import { API_BASE_URL, ENDPOINTS } from './config';
import { apiFetch } from './fetch';
import type { FileErrorDetail } from '../store/fileStore';

// Types
interface SignedUrlRequest {
  filePath: string;
  contentType: string;
  uploadExpiresInSeconds?: number;
  readExpiresInSeconds?: number;
  responseDisposition?: string;
}

interface SignedUrlResponse {
  signedUrl: string;
  uploadExpiresAt: string;
  publicSignedUrl: string;
  publicExpiresAt: string;
}

interface QueueFileJobRequest {
  sessionID: string;
  fileName: string;
  jobID: string;
}

interface QueueFileJobResponse {
  success: boolean;
  jobID: string;
  task?: unknown;
}

interface ProcessFileJob {
  fileName: string;
  jobID: string;
  uuid: string;
  error?: string;
}

interface ProcessFileResponse {
  message: string;
  jobs: ProcessFileJob[];
}

interface JobStatusEvent {
  job_id: string;
  session_id: string;
  file_name: string;
  status: 'processing' | 'done' | 'complete' | 'failed' | 'error';
  file_response?: {
    gcs_uris?: Record<string, string[]>;
    errors?: Array<{
      original_gcs_uri: string;
      is_partial_error: boolean;
      error_details: FileErrorDetail[];
    }>;
  };
  created_at?: unknown;
  updated_at?: unknown;
}

/**
 * Get signed URLs for direct file upload to GCS
 */
export const getSignedUrls = async (
  sessionId: string,
  fileName: string,
  contentType: string
): Promise<SignedUrlResponse> => {
  const request: SignedUrlRequest = {
    filePath: `${sessionId}/raw/${fileName}`,
    contentType,
    uploadExpiresInSeconds: 900, // 15 minutes
    readExpiresInSeconds: 86400, // 24 hours
  };

  console.log('[FileUpload] getSignedUrls - Request:', {
    endpoint: ENDPOINTS.FRONTEND_PROCESS_FILE,
    payload: request,
  });

  const response = await apiFetch(ENDPOINTS.FRONTEND_PROCESS_FILE, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[FileUpload] getSignedUrls - Error:', {
      status: response.status,
      errorData,
    });
    throw new Error(errorData.message || `Failed to get signed URLs: ${response.status}`);
  }

  const result = await response.json();
  console.log('[FileUpload] getSignedUrls - Response:', {
    hasSignedUrl: !!result.signedUrl,
    hasPublicSignedUrl: !!result.publicSignedUrl,
  });

  return result;
};

/**
 * Upload file directly to GCS using signed URL
 */
export const uploadToGCS = async (
  signedUrl: string,
  fileUri: string,
  contentType: string,
  onProgress?: (progress: number) => void
): Promise<void> => {
  console.log('[FileUpload] uploadToGCS - Starting upload:', {
    fileUri,
    contentType,
    signedUrlPreview: signedUrl.substring(0, 100) + '...',
  });

  // For React Native, we need to use fetch with the file URI
  // First, read the file as a blob
  const response = await fetch(fileUri);
  const blob = await response.blob();
  console.log('[FileUpload] uploadToGCS - Blob created, size:', blob.size);

  // Upload to GCS
  const uploadResponse = await fetch(signedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    console.error('[FileUpload] uploadToGCS - Upload failed:', {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
    });
    throw new Error(`Failed to upload to GCS: ${uploadResponse.status}`);
  }

  console.log('[FileUpload] uploadToGCS - Upload successful');

  // Note: fetch doesn't support progress tracking natively
  // For real progress tracking, we'd need XMLHttpRequest or a library
  if (onProgress) {
    onProgress(100);
  }
};

/**
 * Queue a file job for preprocessing (non-ZIP files in normal mode)
 */
export const queueFileJob = async (
  sessionId: string,
  fileName: string,
  jobId: string
): Promise<QueueFileJobResponse> => {
  const request: QueueFileJobRequest = {
    sessionID: sessionId,
    fileName,
    jobID: jobId,
  };

  console.log('[FileUpload] queueFileJob - Request:', {
    endpoint: ENDPOINTS.UPLOAD_QUEUE,
    payload: request,
  });

  const response = await apiFetch(ENDPOINTS.UPLOAD_QUEUE, {
    method: 'POST',
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[FileUpload] queueFileJob - Error:', {
      status: response.status,
      errorData,
    });
    throw new Error(errorData.message || `Failed to queue file job: ${response.status}`);
  }

  const result = await response.json();
  console.log('[FileUpload] queueFileJob - Response:', result);

  return result;
};

/**
 * Process ZIP files (uploads to backend for extraction)
 * Uses native fetch instead of apiFetch because FormData needs
 * Content-Type to be set automatically by fetch (multipart/form-data with boundary)
 */
export const processZipFile = async (
  sessionId: string,
  fileUri: string,
  fileName: string,
  fileUUIDMap: Record<string, string>
): Promise<ProcessFileResponse> => {
  const url = `${API_BASE_URL}${ENDPOINTS.PROCESS_FILE}`;

  console.log('[FileUpload] processZipFile - Starting:', {
    url,
    sessionId,
    fileName,
    fileUUIDMap,
  });

  // Create FormData
  const formData = new FormData();

  // Add the file - React Native FormData format
  formData.append('files', {
    uri: fileUri,
    name: fileName,
    type: 'application/zip',
  } as unknown as Blob);

  formData.append('session_id', sessionId);
  formData.append('fileUUIDMap', JSON.stringify(fileUUIDMap));

  // Use native fetch directly - don't set Content-Type header
  // Let fetch set it automatically with the correct multipart boundary
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      // Only set ngrok header, NOT Content-Type
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData as unknown as BodyInit,
  });

  console.log('[FileUpload] processZipFile - Response status:', response.status);

  if (!response.ok && response.status !== 207) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[FileUpload] processZipFile - Error:', {
      status: response.status,
      errorData,
    });
    throw new Error(errorData.error || errorData.message || `Failed to process ZIP file: ${response.status}`);
  }

  const result = await response.json();
  console.log('[FileUpload] processZipFile - Response:', result);

  return result;
};

/**
 * Listen for file job status updates using XMLHttpRequest
 * SSE endpoints keep connections open, so we use XHR with onprogress to capture streaming data
 */
export const listenForJobStatus = (
  jobId: string,
  onStatus: (status: JobStatusEvent) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): (() => void) => {
  const url = `${API_BASE_URL}${ENDPOINTS.UPLOAD_LISTEN}/${jobId}`;
  let isCompleted = false;
  let lastProcessedLength = 0;
  let xhr: XMLHttpRequest | null = null;
  let retryCount = 0;
  const maxRetries = 10;
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;

  console.log('========================================');
  console.log('[FileUpload] Listen - STARTING (XHR mode)');
  console.log('[FileUpload] Listen - Job ID:', jobId);
  console.log('[FileUpload] Listen - URL:', url);
  console.log('========================================');

  // Helper to complete
  const complete = (reason: string) => {
    if (isCompleted) return;
    isCompleted = true;
    console.log('========================================');
    console.log('[FileUpload] Listen - COMPLETING');
    console.log('[FileUpload] Listen - Reason:', reason);
    console.log('========================================');
    if (xhr) {
      xhr.abort();
      xhr = null;
    }
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      retryTimeout = null;
    }
    onComplete();
  };

  // Process SSE data chunk
  const processChunk = (text: string): boolean => {
    console.log('[FileUpload] Listen - Processing chunk, length:', text.length);
    console.log('[FileUpload] Listen - Chunk content:', text);

    const lines = text.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and event type lines
      if (!trimmedLine || trimmedLine.startsWith('event:')) {
        continue;
      }

      // Handle SSE data lines (format: "data: {...}")
      let jsonStr = trimmedLine;
      if (trimmedLine.startsWith('data:')) {
        jsonStr = trimmedLine.substring(5).trim();
      }

      if (!jsonStr || !jsonStr.startsWith('{')) {
        continue;
      }

      try {
        const data = JSON.parse(jsonStr) as JobStatusEvent;

        console.log('****************************************');
        console.log('[FileUpload] Listen - PARSED JOB STATUS:');
        console.log('[FileUpload] Listen - status:', data.status);
        console.log('[FileUpload] Listen - job_id:', data.job_id);
        console.log('[FileUpload] Listen - file_name:', data.file_name);
        console.log('[FileUpload] Listen - file_response:', JSON.stringify(data.file_response, null, 2));
        console.log('****************************************');

        onStatus(data);

        // Check if job is complete (matching web app logic)
        const terminalStatuses = ['done', 'complete', 'failed', 'error'];
        if (terminalStatuses.includes(data.status)) {
          console.log(`[FileUpload] Listen - Terminal status "${data.status}" received`);
          return true;
        }
      } catch (e) {
        console.error('[FileUpload] Listen - JSON parse error:', e);
        console.error('[FileUpload] Listen - Failed string:', jsonStr.substring(0, 100));
      }
    }

    return false;
  };

  // Start XHR connection
  const startConnection = () => {
    if (isCompleted) return;

    retryCount++;
    console.log(`[FileUpload] Listen - Starting XHR connection (attempt ${retryCount}/${maxRetries})`);

    lastProcessedLength = 0;
    xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'text/event-stream, application/json, text/plain, */*');
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');

    // Handle progress - this fires as data streams in
    xhr.onprogress = () => {
      if (isCompleted || !xhr) return;

      const responseText = xhr.responseText;
      const newData = responseText.substring(lastProcessedLength);
      lastProcessedLength = responseText.length;

      if (newData.length > 0) {
        console.log('[FileUpload] Listen - XHR onprogress, new data length:', newData.length);
        const isDone = processChunk(newData);
        if (isDone) {
          complete('Terminal status received');
        }
      }
    };

    xhr.onreadystatechange = () => {
      if (!xhr) return;

      console.log('[FileUpload] Listen - XHR readyState:', xhr.readyState, 'status:', xhr.status);

      // DONE state
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          // Process any remaining data
          const responseText = xhr.responseText;
          const newData = responseText.substring(lastProcessedLength);
          if (newData.length > 0) {
            console.log('[FileUpload] Listen - XHR complete, processing remaining data');
            const isDone = processChunk(newData);
            if (isDone) {
              complete('Terminal status received');
              return;
            }
          }

          // Connection closed but not done - retry
          if (!isCompleted && retryCount < maxRetries) {
            console.log('[FileUpload] Listen - Connection closed, retrying in 2s...');
            retryTimeout = setTimeout(startConnection, 2000);
          } else if (!isCompleted) {
            complete('Max retries reached');
            onError(new Error('Max retries reached waiting for file processing'));
          }
        } else if (xhr.status === 0) {
          // Request aborted or network error
          if (!isCompleted && retryCount < maxRetries) {
            console.log('[FileUpload] Listen - Request failed (status 0), retrying in 2s...');
            retryTimeout = setTimeout(startConnection, 2000);
          }
        } else {
          console.error('[FileUpload] Listen - HTTP error:', xhr.status);
          if (!isCompleted) {
            complete('HTTP error');
            onError(new Error(`HTTP error: ${xhr.status}`));
          }
        }
      }
    };

    xhr.onerror = () => {
      console.error('[FileUpload] Listen - XHR error event');
      if (!isCompleted && retryCount < maxRetries) {
        console.log('[FileUpload] Listen - Retrying in 2s...');
        retryTimeout = setTimeout(startConnection, 2000);
      } else if (!isCompleted) {
        complete('XHR error');
        onError(new Error('Network error'));
      }
    };

    xhr.ontimeout = () => {
      console.log('[FileUpload] Listen - XHR timeout');
      if (!isCompleted && retryCount < maxRetries) {
        retryTimeout = setTimeout(startConnection, 2000);
      }
    };

    // Set timeout (2 minutes)
    xhr.timeout = 120000;

    console.log('[FileUpload] Listen - Sending XHR request...');
    xhr.send();
  };

  // Start the connection
  startConnection();

  // Return cleanup function
  return () => {
    console.log('[FileUpload] Listen - Cleanup called');
    complete('Cleanup');
  };
};

/**
 * Determine error state from job status
 */
export const determineErrorState = (
  status: JobStatusEvent
): { hasError: boolean; isPartialError: boolean; errorDetails: FileErrorDetail[] } => {
  const fileResponse = status.file_response;

  if (!fileResponse?.errors?.length) {
    return { hasError: false, isPartialError: false, errorDetails: [] };
  }

  const allErrorDetails: FileErrorDetail[] = [];
  for (const error of fileResponse.errors) {
    allErrorDetails.push(...error.error_details);
  }

  // Check if it's a partial error (has both errors and successful URIs)
  const hasSuccessfulUris = Boolean(fileResponse.gcs_uris && Object.keys(fileResponse.gcs_uris).length > 0);
  const isPartialError = hasSuccessfulUris && allErrorDetails.length > 0;
  const hasError = !hasSuccessfulUris && allErrorDetails.length > 0;

  return { hasError, isPartialError, errorDetails: allErrorDetails };
};

/**
 * Get MIME type from file extension
 */
export const getMimeType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const mimeTypes: Record<string, string> = {
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',
    xlsb: 'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    pptm: 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
    txt: 'text/plain',
    csv: 'text/csv',
    // Archives
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    bz2: 'application/x-bzip2',
    xz: 'application/x-xz',
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
  };

  return mimeTypes[ext] || 'application/octet-stream';
};
