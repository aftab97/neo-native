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
import { generateUUID } from '../utils/parseStream';

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
  const setFileError = useFileStore((state) => state.setFileError);
  const setFileProgress = useFileStore((state) => state.setFileProgress);
  const files = useFileStore((state) => state.files);
  const addToast = usePopupStore((state) => state.addToast);
  const sessionId = useSessionStore((state) => state.currentSessionId);

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
        await queueFileJob(currentSessionId, file.name, jobId);

        updateFile(file.id, { jobID: jobId });
        setFileProgress(file.id, 80);

        // Step 4: Listen for job status via SSE
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
              updateFile(file.id, {
                loading: false,
                error: false,
                partialError: isPartialError,
                errorDetails: isPartialError ? errorDetails : undefined,
                uploadProgress: 100,
                processFileResponse: status.file_response,
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
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFileError(file.id, errorMessage);
    }
  }, [isLiveChatActive, updateFile, setFileError, setFileProgress]);

  // Upload archive file (ZIP, etc.)
  const uploadArchiveFile = useCallback(async (
    file: FileAttachment,
    currentSessionId: string
  ): Promise<void> => {
    try {
      const uuid = generateUUID();

      // Update file with UUID for tracking
      updateFile(file.id, { uuid, isPreviewOnly: true });

      setFileProgress(file.id, 20);

      // Create file UUID map (for ZIP extraction tracking)
      const fileUUIDMap: Record<string, string> = {
        [file.name]: uuid,
      };

      // Process ZIP file via backend
      const response = await processZipFile(
        currentSessionId,
        file.uri,
        file.name,
        fileUUIDMap
      );

      setFileProgress(file.id, 60);

      // Update file with job info
      if (response.jobs && response.jobs.length > 0) {
        const job = response.jobs[0];

        if (job.error) {
          setFileError(file.id, job.error);
          return;
        }

        updateFile(file.id, {
          jobID: job.jobID,
          isPreviewOnly: false,
        });

        setFileProgress(file.id, 80);

        // Listen for job status
        listenForJobStatus(
          job.jobID,
          (status) => {
            const { hasError, isPartialError, errorDetails } = determineErrorState(status);

            if (hasError) {
              setFileError(file.id, 'Processing failed', errorDetails);
            } else {
              updateFile(file.id, {
                loading: false,
                error: false,
                partialError: isPartialError,
                errorDetails: isPartialError ? errorDetails : undefined,
                uploadProgress: 100,
                processFileResponse: status.file_response,
              });
            }
          },
          (error) => {
            setFileError(file.id, error.message);
          },
          () => {
            // Cleanup on complete
          }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFileError(file.id, errorMessage);
    }
  }, [updateFile, setFileError, setFileProgress]);

  // Process and upload files
  const processFiles = useCallback(async (newFiles: FileAttachment[]) => {
    // Get the current session ID directly from the store to avoid stale closure
    const currentSessionId = useSessionStore.getState().currentSessionId;

    console.log('[useFileUpload] processFiles called:', {
      fileCount: newFiles.length,
      sessionIdFromClosure: sessionId,
      sessionIdFromStore: currentSessionId,
      fileNames: newFiles.map(f => f.name),
    });

    // Use the store value to ensure we have the latest
    const activeSessionId = currentSessionId || sessionId;

    if (!activeSessionId) {
      console.error('[useFileUpload] No session ID available!');
      addToast({
        label: 'No active session. Please start a chat first.',
        variant: 'danger',
      });
      return;
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
  }, [sessionId, uploadNonArchiveFile, uploadArchiveFile, addToast]);

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
