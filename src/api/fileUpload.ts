import { API_BASE_URL, ENDPOINTS } from '../config/api';
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
 */
export const processZipFile = async (
  sessionId: string,
  fileUri: string,
  fileName: string,
  fileUUIDMap: Record<string, string>
): Promise<ProcessFileResponse> => {
  console.log('[FileUpload] processZipFile - Starting:', {
    endpoint: ENDPOINTS.PROCESS_FILE,
    sessionId,
    fileName,
    fileUUIDMap,
  });

  // Create FormData
  const formData = new FormData();

  // Add the file
  formData.append('files', {
    uri: fileUri,
    name: fileName,
    type: 'application/zip',
  } as unknown as Blob);

  formData.append('session_id', sessionId);
  formData.append('fileUUIDMap', JSON.stringify(fileUUIDMap));

  const response = await apiFetch(ENDPOINTS.PROCESS_FILE, {
    method: 'POST',
    headers: {
      // Don't set Content-Type - let fetch set it with boundary for FormData
      'Content-Type': undefined as unknown as string,
    },
    body: formData as unknown as BodyInit,
  });

  if (!response.ok && response.status !== 207) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[FileUpload] processZipFile - Error:', {
      status: response.status,
      errorData,
    });
    throw new Error(errorData.message || `Failed to process ZIP file: ${response.status}`);
  }

  const result = await response.json();
  console.log('[FileUpload] processZipFile - Response:', result);

  return result;
};

/**
 * Listen for file job status updates
 * The server sends newline-delimited JSON (NDJSON)
 * React Native doesn't support streaming fetch, so we poll until done
 */
export const listenForJobStatus = (
  jobId: string,
  onStatus: (status: JobStatusEvent) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): (() => void) => {
  const url = `${API_BASE_URL}${ENDPOINTS.UPLOAD_LISTEN}/${jobId}`;
  let isCompleted = false;
  let pollCount = 0;
  const maxPolls = 60; // Max 60 polls (about 2 minutes with 2s interval)
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  console.log('[FileUpload] Listen - Starting for job:', jobId);

  // Helper to complete
  const complete = (reason: string) => {
    if (isCompleted) return;
    isCompleted = true;
    console.log('[FileUpload] Listen - Completing:', reason);
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
    onComplete();
  };

  // Process the response text (NDJSON - multiple JSON objects per line)
  const processResponse = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    console.log('[FileUpload] Listen - Received', lines.length, 'lines');

    for (const line of lines) {
      try {
        const data = JSON.parse(line.trim()) as JobStatusEvent;
        console.log('[FileUpload] Listen - Status:', {
          status: data.status,
          job_id: data.job_id,
          file_name: data.file_name,
          hasGcsUris: !!data.file_response?.gcs_uris,
        });

        onStatus(data);

        // Check if job is complete
        if (['done', 'complete', 'completed', 'failed', 'error'].includes(data.status)) {
          complete(`Job status: ${data.status}`);
          return true; // Signal that we're done
        }
      } catch (e) {
        console.error('[FileUpload] Listen - Parse error:', e, 'Line:', line.substring(0, 100));
      }
    }
    return false; // Not done yet
  };

  // Poll the endpoint
  const poll = async () => {
    if (isCompleted) return;

    pollCount++;
    console.log('[FileUpload] Listen - Poll', pollCount, '/', maxPolls);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Cache-Control': 'no-cache',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      console.log('[FileUpload] Listen - Response status:', response.status);

      if (!response.ok) {
        console.error('[FileUpload] Listen - HTTP error:', response.status);
        if (pollCount >= maxPolls) {
          complete('Max polls reached with error');
          onError(new Error(`HTTP error: ${response.status}`));
        }
        return;
      }

      const text = await response.text();
      console.log('[FileUpload] Listen - Response text length:', text.length);
      console.log('[FileUpload] Listen - Response preview:', text.substring(0, 300));

      const isDone = processResponse(text);

      if (!isDone && pollCount >= maxPolls) {
        console.error('[FileUpload] Listen - Max polls reached');
        complete('Max polls reached');
        onError(new Error('Timeout waiting for file processing'));
      }
    } catch (error) {
      console.error('[FileUpload] Listen - Fetch error:', error);
      if (pollCount >= maxPolls) {
        complete('Max polls reached with fetch error');
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  // Start polling immediately, then every 2 seconds
  poll();
  pollInterval = setInterval(poll, 2000);

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
