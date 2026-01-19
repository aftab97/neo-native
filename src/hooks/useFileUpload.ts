import { useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import { useFileStore, usePopupStore, useSessionStore, type FileAttachment, type FileErrorDetail } from '../store';
import {
  getSignedUrls,
  uploadToGCS,
  queueFileJob,
  processZipFile,
  listenForJobStatus,
  determineErrorState,
  getMimeType,
} from '../api/fileUpload';
import { generateUUID, createSessionId } from '../utils/parseStream';
import { peekZipContents } from '../utils/peekZipContents';

// Allowed file extensions (matching web app)
const DOCUMENT_EXTENSIONS = [
  'doc', 'docx', 'pdf', 'txt', 'xls', 'xlsx', 'xlsm', 'xlsb',
  'ppt', 'pptx', 'pptm', 'csv',
];

const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'];

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'heic'];

// Max file size: 50MB (matching web app)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Max files per session
const MAX_FILES_PER_SESSION = 20;

// Generate unique ID for file tracking (UUID v4 format for consistency with backend)
const generateFileId = () => generateUUID();

// Get file extension from name or URI
const getFileExtension = (name: string): string => {
  return name.split('.').pop()?.toLowerCase() || '';
};

// Get file type label
export const getFileTypeLabel = (name: string): string => {
  const ext = getFileExtension(name);

  switch (ext) {
    case 'pdf': return 'PDF';
    case 'xls':
    case 'xlsx':
    case 'xlsm':
    case 'xlsb': return 'Excel';
    case 'doc':
    case 'docx': return 'Word';
    case 'ppt':
    case 'pptx':
    case 'pptm': return 'PowerPoint';
    case 'txt': return 'Text';
    case 'csv': return 'CSV';
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
    case 'bz2':
    case 'xz': return 'Archive';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'heic': return 'Image';
    default: return 'File';
  }
};

// Check if file is an image
export const isImageFile = (name: string): boolean => {
  const ext = getFileExtension(name);
  return IMAGE_EXTENSIONS.includes(ext);
};

// Check if file is an archive
export const isArchiveFile = (name: string): boolean => {
  const ext = getFileExtension(name);
  return ARCHIVE_EXTENSIONS.includes(ext);
};

interface UseFileUploadOptions {
  isLiveChatActive?: boolean;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const { isLiveChatActive = false } = options;
  const addFiles = useFileStore((state) => state.addFiles);
  const updateFile = useFileStore((state) => state.updateFile);
  const removeFile = useFileStore((state) => state.removeFile);
  const replacePreviewFiles = useFileStore((state) => state.replacePreviewFiles);
  const setFileError = useFileStore((state) => state.setFileError);
  const setFileProgress = useFileStore((state) => state.setFileProgress);
  const files = useFileStore((state) => state.files);
  const addToast = usePopupStore((state) => state.addToast);
  const sessionId = useSessionStore((state) => state.currentSessionId);
  const setCurrentSessionId = useSessionStore((state) => state.setCurrentSessionId);

  // Debug: Log session ID on each render
  console.log('[useFileUpload] Hook initialized - sessionId:', sessionId, 'isLiveChatActive:', isLiveChatActive);

  // Request camera permissions
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      addToast({
        label: 'Camera permission is required to take photos.',
        variant: 'danger',
      });
      return false;
    }
    return true;
  };

  // Request media library permissions
  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      addToast({
        label: 'Photo library permission is required to select images.',
        variant: 'danger',
      });
      return false;
    }
    return true;
  };

  // Validate file size
  const validateFileSize = (size: number | undefined, name: string): boolean => {
    if (size && size > MAX_FILE_SIZE) {
      addToast({
        label: `File "${name}" exceeds 50MB limit.`,
        variant: 'danger',
      });
      return false;
    }
    return true;
  };

  // Validate file count
  const validateFileCount = (additionalCount: number): boolean => {
    if (files.length + additionalCount > MAX_FILES_PER_SESSION) {
      addToast({
        label: `Maximum ${MAX_FILES_PER_SESSION} files per session.`,
        variant: 'danger',
      });
      return false;
    }
    return true;
  };

  // Upload a single non-archive file
  const uploadNonArchiveFile = useCallback(async (
    file: FileAttachment,
    currentSessionId: string
  ): Promise<void> => {
    console.log('[useFileUpload] uploadNonArchiveFile - Starting:', {
      fileId: file.id,
      fileName: file.name,
      sessionId: currentSessionId,
      isLiveChatActive,
    });

    try {
      const mimeType = file.mimeType || getMimeType(file.name);

      // Step 1: Get signed URLs
      setFileProgress(file.id, 10);
      const signedUrls = await getSignedUrls(currentSessionId, file.name, mimeType);

      updateFile(file.id, {
        signedUrl: signedUrls.signedUrl,
        publicSignedUrl: signedUrls.publicSignedUrl,
      });

      // Step 2: Upload to GCS
      setFileProgress(file.id, 30);
      await uploadToGCS(
        signedUrls.signedUrl,
        file.uri,
        mimeType,
        (progress) => setFileProgress(file.id, 30 + (progress * 0.4))
      );

      setFileProgress(file.id, 70);

      // Step 3: Handle based on mode
      if (isLiveChatActive) {
        // Live chat mode: skip preprocessing, mark as ready
        updateFile(file.id, {
          loading: false,
          error: false,
          uploadProgress: 100,
          processFileResponse: {
            strategy: 'websocket',
            skippedPreprocess: true,
          },
        });
      } else {
        // Normal mode: queue for preprocessing
        const jobId = generateUUID();
        updateFile(file.id, { jobID: jobId });

        // Step 4: Start listening BEFORE queueing (to not miss early events)
        // This matches the web app behavior
        console.log('[useFileUpload] Starting SSE listener for job:', jobId);
        listenForJobStatus(
          jobId,
          (status) => {
            console.log('[useFileUpload] SSE status callback:', {
              jobId,
              fileId: file.id,
              status: status.status,
              hasFileResponse: !!status.file_response,
            });

            const { hasError, isPartialError, errorDetails } = determineErrorState(status);
            console.log('[useFileUpload] Error state determined:', { hasError, isPartialError, errorDetailsCount: errorDetails.length });

            if (hasError) {
              console.log('[useFileUpload] Setting file error');
              setFileError(file.id, 'Processing failed', errorDetails);
            } else {
              console.log('[useFileUpload] Updating file to complete');
              // Match web app structure: processFileResponse.fileResponse.gcs_uris
              const { file_response, ...restOfStatus } = status;
              updateFile(file.id, {
                loading: false,
                error: false,
                partialError: isPartialError,
                errorDetails: isPartialError ? errorDetails : undefined,
                uploadProgress: 100,
                processFileResponse: {
                  fileResponse: file_response ? { ...file_response } : undefined,
                  ...restOfStatus,
                },
              });
            }
          },
          (error) => {
            console.error('[useFileUpload] SSE error callback:', error.message);
            setFileError(file.id, error.message);
          },
          () => {
            console.log('[useFileUpload] SSE complete callback for job:', jobId);
          }
        );

        // Step 5: Queue the job (after listener is set up)
        await queueFileJob(currentSessionId, file.name, jobId);
        setFileProgress(file.id, 80);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFileError(file.id, errorMessage);
    }
  }, [isLiveChatActive, updateFile, setFileError, setFileProgress]);

  // Upload archive file (ZIP, etc.) - matches web app behavior
  // 1. Peek inside ZIP to get filenames
  // 2. Remove ZIP from UI, create preview tiles for each file
  // 3. Send ZIP + fileUUIDMap to BFF
  // 4. Replace preview tiles with real tiles, start listeners
  const uploadArchiveFile = useCallback(async (
    file: FileAttachment,
    currentSessionId: string
  ): Promise<void> => {
    console.log('[useFileUpload] uploadArchiveFile - Starting for:', file.name);

    try {
      // Step 1: Peek inside the ZIP to get filenames (like web app)
      const filenames = await peekZipContents(file.uri);
      console.log('[useFileUpload] Peeked ZIP contents:', filenames);

      if (filenames.length === 0) {
        // If we couldn't peek, process as single file
        console.log('[useFileUpload] Could not peek ZIP, processing as single file');
        setFileError(file.id, 'Could not read ZIP contents');
        return;
      }

      // Step 2: Generate UUIDs for each file inside the ZIP
      const fileUUIDMap: Record<string, string> = {};
      filenames.forEach((name) => {
        fileUUIDMap[name] = generateUUID();
      });
      console.log('[useFileUpload] Generated fileUUIDMap:', fileUUIDMap);

      // Step 3: Remove the original ZIP file from the store
      removeFile(file.id);

      // Step 4: Create preview tiles for each file inside the ZIP
      const previewFiles: FileAttachment[] = filenames.map((name) => ({
        id: generateFileId(),
        name,
        type: getFileTypeLabel(name),
        uri: file.uri, // Keep original URI for reference
        loading: true,
        error: false,
        isPreviewOnly: true,
        uuid: fileUUIDMap[name],
        uploadProgress: 0,
      }));
      addFiles(previewFiles);
      console.log('[useFileUpload] Created', previewFiles.length, 'preview tiles');

      // Step 5: Send ZIP file to BFF with fileUUIDMap
      const response = await processZipFile(
        currentSessionId,
        file.uri,
        file.name,
        fileUUIDMap
      );
      console.log('[useFileUpload] processZipFile response:', response);

      // Step 6: Handle response - replace preview tiles with real tiles
      if (response.jobs && response.jobs.length > 0) {
        // Filter out __MACOSX metadata files from BFF response
        const validJobs = response.jobs.filter((job: any) => {
          const fileName = job.fileName || job.file_name || '';
          return !fileName.startsWith('__MACOSX') && !fileName.includes('/__MACOSX');
        });
        console.log('[useFileUpload] Filtered jobs:', validJobs.length, 'from', response.jobs.length);

        // Create real file entries from the jobs response
        // Note: BFF returns snake_case (job_id, file_name) but we normalize to camelCase
        const realFiles: FileAttachment[] = validJobs.map((job: any) => {
          const jobID = job.jobID || job.job_id;
          const fileName = job.fileName || job.file_name;
          const hasError = !jobID || !!job.error;

          console.log('[useFileUpload] Creating real file entry:', {
            fileName,
            jobID,
            uuid: job.uuid,
            hasError,
            rawJob: job,
          });

          return {
            id: generateFileId(),
            name: fileName,
            type: getFileTypeLabel(fileName),
            uri: file.uri,
            loading: !hasError,
            error: hasError,
            errorMessage: job.error,
            jobID: jobID,
            uuid: job.uuid,
            isPreviewOnly: false,
            uploadProgress: hasError ? 0 : 50,
          };
        });

        // Get preview UUIDs to replace
        const previewUuids = Object.values(fileUUIDMap);

        // Replace preview files with real files
        replacePreviewFiles(previewUuids, realFiles);
        console.log('[useFileUpload] Replaced preview tiles with', realFiles.length, 'real tiles');

        // Step 7: Start SSE listeners for each job (like web app)
        validJobs.forEach((job: any) => {
          const jobID = job.jobID || job.job_id;
          const fileName = job.fileName || job.file_name;

          if (jobID && !job.error) {
            console.log('[useFileUpload] Starting listener for job:', jobID, 'file:', fileName);

            // Find the file ID for this job
            const fileEntry = realFiles.find((f) => f.uuid === job.uuid);
            if (!fileEntry) {
              console.error('[useFileUpload] Could not find file entry for job:', jobID);
              return;
            }

            listenForJobStatus(
              jobID,
              (status) => {
                console.log('[useFileUpload] ZIP job status update for', fileName, ':', status.status);
                console.log('[useFileUpload] ZIP job file_response:', JSON.stringify(status.file_response));
                const { hasError, isPartialError, errorDetails } = determineErrorState(status);

                // Find current file by UUID since ID might have changed
                const currentFiles = useFileStore.getState().files;
                const currentFile = currentFiles.find((f) => f.uuid === job.uuid);

                console.log('[useFileUpload] ZIP looking for file with uuid:', job.uuid);
                console.log('[useFileUpload] ZIP available files:', currentFiles.map(f => ({ id: f.id, uuid: f.uuid, name: f.name })));

                if (!currentFile) {
                  console.error('[useFileUpload] ZIP file not found for UUID:', job.uuid);
                  return;
                }

                console.log('[useFileUpload] ZIP found file:', currentFile.id, currentFile.name);

                if (hasError) {
                  setFileError(currentFile.id, 'Processing failed', errorDetails);
                } else {
                  // Match web app structure: processFileResponse.fileResponse.gcs_uris
                  // Only mark as fully complete on terminal statuses
                  const terminalStatuses = ['done', 'complete', 'failed', 'error'];
                  const isTerminal = terminalStatuses.includes(status.status);
                  const { file_response, ...restOfStatus } = status;

                  console.log('[useFileUpload] ZIP updating file:', {
                    fileId: currentFile.id,
                    status: status.status,
                    isTerminal,
                    hasGcsUris: !!file_response?.gcs_uris,
                    gcsUris: file_response?.gcs_uris,
                  });

                  updateFile(currentFile.id, {
                    loading: !isTerminal,
                    error: false,
                    partialError: isPartialError,
                    errorDetails: isPartialError ? errorDetails : undefined,
                    uploadProgress: isTerminal ? 100 : 80,
                    processFileResponse: {
                      fileResponse: file_response ? { ...file_response } : undefined,
                      ...restOfStatus,
                    },
                  });

                  // Verify the update was applied
                  if (isTerminal) {
                    const updatedFiles = useFileStore.getState().files;
                    const updatedFile = updatedFiles.find((f) => f.id === currentFile.id);
                    console.log('[useFileUpload] ZIP VERIFY after update:', {
                      fileId: currentFile.id,
                      hasProcessFileResponse: !!updatedFile?.processFileResponse,
                      hasFileResponse: !!updatedFile?.processFileResponse?.fileResponse,
                      hasGcsUris: !!updatedFile?.processFileResponse?.fileResponse?.gcs_uris,
                      error: updatedFile?.error,
                      loading: updatedFile?.loading,
                    });
                  }
                }
              },
              (error) => {
                console.error('[useFileUpload] ZIP listener error for', fileName, ':', error.message);
                const currentFiles = useFileStore.getState().files;
                const currentFile = currentFiles.find((f) => f.uuid === job.uuid);
                if (currentFile) {
                  setFileError(currentFile.id, error.message);
                }
              },
              () => {
                console.log('[useFileUpload] ZIP listener complete for', fileName);
              }
            );
          }
        });
      } else {
        // No jobs returned - mark all preview files as error
        console.error('[useFileUpload] No jobs returned from processZipFile');
        const currentFiles = useFileStore.getState().files;
        currentFiles
          .filter((f) => f.isPreviewOnly && Object.values(fileUUIDMap).includes(f.uuid || ''))
          .forEach((f) => {
            setFileError(f.id, 'Processing failed');
          });
      }
    } catch (error) {
      console.error('[useFileUpload] uploadArchiveFile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      // Mark the original file as error if it still exists
      const currentFiles = useFileStore.getState().files;
      const originalFile = currentFiles.find((f) => f.id === file.id);
      if (originalFile) {
        setFileError(file.id, errorMessage);
      }
      addToast({
        label: errorMessage,
        variant: 'danger',
      });
    }
  }, [addFiles, removeFile, replacePreviewFiles, updateFile, setFileError, addToast]);

  // Process and upload files
  const processFiles = useCallback(async (newFiles: FileAttachment[]) => {
    // Get the current session ID directly from the store to avoid stale closure
    let currentSessionId = useSessionStore.getState().currentSessionId;

    console.log('[useFileUpload] processFiles called:', {
      fileCount: newFiles.length,
      sessionIdFromClosure: sessionId,
      sessionIdFromStore: currentSessionId,
      fileNames: newFiles.map(f => f.name),
    });

    // Use the store value to ensure we have the latest
    let activeSessionId = currentSessionId || sessionId;

    // If no session exists, create one for file uploads
    // This allows users to attach files before starting a chat
    if (!activeSessionId) {
      console.log('[useFileUpload] No session ID, creating one for file upload');
      activeSessionId = createSessionId();
      setCurrentSessionId(activeSessionId);
      console.log('[useFileUpload] Created new session ID:', activeSessionId);
    }

    const nonArchiveFiles = newFiles.filter((f) => !isArchiveFile(f.name));
    const archiveFiles = newFiles.filter((f) => isArchiveFile(f.name));
    console.log('[useFileUpload] Files categorized:', {
      nonArchiveCount: nonArchiveFiles.length,
      archiveCount: archiveFiles.length,
      usingSessionId: activeSessionId,
    });

    // Process non-archive files in parallel
    const nonArchivePromises = nonArchiveFiles.map((file) =>
      uploadNonArchiveFile(file, activeSessionId)
    );

    // Process archive files (not in live chat mode)
    const archivePromises = archiveFiles.map((file) =>
      uploadArchiveFile(file, activeSessionId)
    );

    // Wait for all uploads
    const results = await Promise.allSettled([...nonArchivePromises, ...archivePromises]);

    // Count failures
    const failures = results.filter((r) => r.status === 'rejected').length;

    if (failures > 0) {
      addToast({
        label: failures === 1 ? 'A file could not be uploaded.' : 'Some files could not be uploaded.',
        variant: 'danger',
      });
    }
  }, [sessionId, setCurrentSessionId, uploadNonArchiveFile, uploadArchiveFile, addToast]);

  // Take photo with camera
  const takePhoto = useCallback(async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    if (!validateFileCount(1)) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || getMimeType(fileName);

        const newFile: FileAttachment = {
          id: generateFileId(),
          name: fileName,
          type: getFileTypeLabel(fileName),
          uri: asset.uri,
          mimeType,
          width: asset.width,
          height: asset.height,
          loading: true,
          error: false,
          uploadProgress: 0,
        };

        addFiles([newFile]);

        // Process the file
        await processFiles([newFile]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      addToast({
        label: 'Failed to take photo.',
        variant: 'danger',
      });
    }
  }, [addFiles, addToast, processFiles, validateFileCount]);

  // Pick images from gallery
  const pickImages = useCallback(async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        if (!validateFileCount(result.assets.length)) return;

        const newFiles: FileAttachment[] = result.assets.map((asset) => {
          const fileName = asset.fileName || `image_${Date.now()}.jpg`;
          const mimeType = asset.mimeType || getMimeType(fileName);

          return {
            id: generateFileId(),
            name: fileName,
            type: getFileTypeLabel(fileName),
            uri: asset.uri,
            mimeType,
            width: asset.width,
            height: asset.height,
            loading: true,
            error: false,
            uploadProgress: 0,
          };
        });

        addFiles(newFiles);

        // Process the files
        await processFiles(newFiles);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      addToast({
        label: 'Failed to pick images.',
        variant: 'danger',
      });
    }
  }, [addFiles, addToast, processFiles, validateFileCount]);

  // Pick documents
  const pickDocuments = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const validFiles: FileAttachment[] = [];
        const blockedArchives: string[] = [];

        for (const asset of result.assets) {
          // Check if archive in live chat mode
          if (isLiveChatActive && isArchiveFile(asset.name)) {
            blockedArchives.push(asset.name);
            continue;
          }

          // Validate file size
          if (!validateFileSize(asset.size, asset.name)) {
            continue;
          }

          const mimeType = asset.mimeType || getMimeType(asset.name);

          validFiles.push({
            id: generateFileId(),
            name: asset.name,
            type: getFileTypeLabel(asset.name),
            uri: asset.uri,
            mimeType,
            size: asset.size,
            loading: true,
            error: false,
            uploadProgress: 0,
          });
        }

        if (!validateFileCount(validFiles.length)) return;

        if (blockedArchives.length > 0) {
          addToast({
            label: `Archive uploads are disabled during Live Chat: ${blockedArchives.join(', ')}`,
            variant: 'danger',
          });
        }

        if (validFiles.length > 0) {
          addFiles(validFiles);

          // Process the files
          await processFiles(validFiles);
        }
      }
    } catch (error) {
      console.error('Error picking documents:', error);
      addToast({
        label: 'Failed to pick documents.',
        variant: 'danger',
      });
    }
  }, [isLiveChatActive, addFiles, addToast, processFiles, validateFileCount]);

  // Get recent photos from media library
  const getRecentPhotos = useCallback(async (limit: number = 10): Promise<MediaLibrary.Asset[]> => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        return [];
      }

      const { assets } = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
        first: limit,
      });

      return assets;
    } catch (error) {
      console.error('Error getting recent photos:', error);
      return [];
    }
  }, []);

  // Add photo from MediaLibrary asset
  const addPhotoFromAsset = useCallback(async (asset: MediaLibrary.Asset) => {
    if (!validateFileCount(1)) return;

    try {
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
      const uri = assetInfo.localUri || asset.uri;
      const fileName = asset.filename || `photo_${Date.now()}.jpg`;
      const mimeType = getMimeType(fileName);

      const newFile: FileAttachment = {
        id: generateFileId(),
        name: fileName,
        type: getFileTypeLabel(fileName),
        uri,
        mimeType,
        width: asset.width,
        height: asset.height,
        loading: true,
        error: false,
        uploadProgress: 0,
      };

      addFiles([newFile]);

      // Process the file
      await processFiles([newFile]);
    } catch (error) {
      console.error('Error adding photo from asset:', error);
      addToast({
        label: 'Failed to add photo.',
        variant: 'danger',
      });
    }
  }, [addFiles, addToast, processFiles, validateFileCount]);

  return {
    takePhoto,
    pickImages,
    pickDocuments,
    getRecentPhotos,
    addPhotoFromAsset,
  };
};
