# File Upload & Processing

## Overview
Direct GCS upload with backend preprocessing for documents.

## Files
| File | Purpose |
|------|---------|
| `src/api/fileUpload.ts` | Signed URLs, GCS upload, job status polling |
| `src/hooks/useFileUpload.ts` | File picker integration, upload orchestration |
| `src/store/fileStore.ts` | File state management |

## Supported Formats
- **Documents:** PDF, DOC, DOCX, XLS, XLSX, XLSM, XLSB, PPT, PPTX, PPTM, TXT, CSV
- **Archives:** ZIP, RAR, 7Z, TAR, GZ, BZ2, XZ
- **Images:** PNG, JPG, JPEG, GIF, WEBP, HEIC

## Limits
- **Max file size:** 50MB
- **Max files per session:** 20

## Upload Flow

### Non-Archive Files
1. Get signed URLs from backend (`getSignedUrls`)
2. Upload directly to GCS (`uploadToGCS`)
3. Queue preprocessing job (`queueFileJob`)
4. Listen for job status via XHR streaming (`listenForJobStatus`)
5. Update file state on completion

### Archive Files (ZIP)
1. Peek inside ZIP to get filenames (`peekZipContents`)
2. Remove ZIP from UI, create preview tiles for each file
3. Send ZIP + `fileUUIDMap` to backend (`processZipFile`)
4. Replace preview tiles with real tiles
5. Start listeners for each extracted file

## Edge Cases & Behaviors

### Don't Break These:

1. **Files cleared only on chat success**
   ```typescript
   // In chat.ts onSuccess:
   useFileStore.getState().removeAllFiles();
   ```
   NOT cleared on send, only after successful mutation.

2. **Session ID creation for uploads**
   ```typescript
   if (!activeSessionId) {
     activeSessionId = createSessionId();
     setCurrentSessionId(activeSessionId);
   }
   ```
   Creates session if none exists (allows attaching files before chatting).

3. **Files with errors filtered before send**
   ```typescript
   const validFiles = filesFromStore.filter((file) => !file.error);
   ```
   In `chat.ts` before building request.

4. **Hide files after send (not remove)**
   ```typescript
   useFileStore.getState().hideFilesFromPromptBar();
   ```
   Files hidden immediately, cleared only on success.

5. **Terminal statuses**
   ```typescript
   const terminalStatuses = ['done', 'complete', 'failed', 'error'];
   ```
   Job polling completes on any of these.

6. **Partial error handling**
   ```typescript
   const isPartialError = hasSuccessfulUris && allErrorDetails.length > 0;
   ```
   Some sheets succeed, some fail.

7. **Job status listener started BEFORE queueing**
   ```typescript
   // Start listening FIRST
   listenForJobStatus(jobId, onStatus, onError, onComplete);
   // THEN queue the job
   await queueFileJob(sessionId, fileName, jobId);
   ```
   Prevents missing early events.

8. **ZIP preview replacement**
   ```typescript
   replacePreviewFiles(previewUuids, realFiles);
   ```
   Preview tiles replaced with real tiles after BFF responds.

9. **Archive blocked in live chat**
   ```typescript
   if (isLiveChatActive && isArchiveFile(asset.name)) {
     blockedArchives.push(asset.name);
     continue;
   }
   ```

10. **ProcessFileResponse structure**
    ```typescript
    processFileResponse: {
      fileResponse: {
        gcs_uris: Record<string, string[]>
      }
    }
    ```
    Must match this structure for `mergeAllGcsUris` to work.

### Job Status Polling
```typescript
// XHR-based SSE polling
// Retries up to 10 times with 2-second intervals
// Processes SSE data: "event: ...\ndata: {...}"
```

### File Store State
```typescript
interface FileAttachment {
  id: string;
  name: string;
  type: string;
  uri: string;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  errorDetails?: FileErrorDetail[];
  signedUrl?: string;
  publicSignedUrl?: string;
  jobID?: string;
  uuid?: string;
  isPreviewOnly?: boolean;
  processFileResponse?: { fileResponse?: { gcs_uris?: Record<string, string[]> } };
  partialError?: boolean;
  uploadProgress?: number;
  isVisibleInPromptBar?: boolean;
}
```

## API Contract

### Get Signed URLs
```typescript
POST /api/v1/session/file/frontendProcessFile
{
  filePath: `${sessionId}/raw/${fileName}`,
  contentType: string,
  uploadExpiresInSeconds: 900,
  readExpiresInSeconds: 86400
}
// Response: { signedUrl, uploadExpiresAt, publicSignedUrl, publicExpiresAt }
```

### Queue Job
```typescript
POST /api/v1/session/upload/queue
{
  sessionID: string,
  fileName: string,
  jobID: string
}
```

### Process ZIP
```typescript
POST /api/v1/session/file/processFile
FormData: {
  files: Blob,
  session_id: string,
  fileUUIDMap: JSON string
}
// Response: { message, jobs: [{ fileName, jobID, uuid, error? }] }
```

### Job Status
```typescript
GET /api/v1/session/upload/listen/{jobId}
// SSE stream: { job_id, session_id, file_name, status, file_response }
```
