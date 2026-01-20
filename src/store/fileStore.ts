import { create } from 'zustand';

export interface FileErrorDetail {
  filename: string;
  error_type: 'empty_file' | 'too_many_tokens' | 'too_many_pages' | 'invalid_file_type' | 'processing_error' | 'file_size_exceeded' | string;
  sheet_name?: string | null;
  error_message?: string | null;
  error_trace?: string | null;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  uri: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  loading: boolean;
  error: boolean;
  errorMessage?: string;
  errorDetails?: FileErrorDetail[];
  // Signed URLs from GCS
  signedUrl?: string;
  publicSignedUrl?: string;
  // Job tracking for preprocessing
  jobID?: string;
  uuid?: string;
  // For ZIP preview
  isPreviewOnly?: boolean;
  // Processing response from backend (matches web app structure)
  processFileResponse?: {
    strategy?: string;
    skippedPreprocess?: boolean;
    // File response from preprocessing (contains gcs_uris)
    fileResponse?: {
      gcs_uris?: Record<string, string[]>;
      [key: string]: unknown;
    };
    // For ZIP files - array of results for each extracted file
    preprocessResults?: Array<{
      fileResponse?: {
        gcs_uris?: Record<string, string[]>;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  };
  // Partial error (some sheets failed but file partially processed)
  partialError?: boolean;
  // Upload progress (0-100)
  uploadProgress?: number;
  // Whether to show in prompt bar (hidden after sending, cleared after response)
  isVisibleInPromptBar?: boolean;
}

interface FileState {
  files: FileAttachment[];
  addFiles: (files: FileAttachment[]) => void;
  removeFile: (id: string) => void;
  removeAllFiles: () => void;
  updateFile: (id: string, updates: Partial<FileAttachment>) => void;
  setFileError: (id: string, errorMessage: string, errorDetails?: FileErrorDetail[]) => void;
  setFileLoading: (id: string, loading: boolean) => void;
  setFileProgress: (id: string, progress: number) => void;
  getFileById: (id: string) => FileAttachment | undefined;
  // Remove preview files and replace with real ones (for ZIP extraction)
  replacePreviewFiles: (previewUuids: string[], realFiles: FileAttachment[]) => void;
  // Hide files from prompt bar (called when user sends message)
  hideFilesFromPromptBar: () => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],

  addFiles: (newFiles) =>
    set((state) => ({
      files: [
        ...state.files,
        ...newFiles.map((file) => ({ ...file, isVisibleInPromptBar: true })),
      ],
    })),

  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
    })),

  removeAllFiles: () => {
    console.log('[FileStore] removeAllFiles called - CLEARING ALL FILES');
    console.trace('[FileStore] Stack trace:');
    set({ files: [] });
  },

  updateFile: (id, updates) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, ...updates } : file
      ),
    })),

  setFileError: (id, errorMessage, errorDetails) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id
          ? { ...file, error: true, errorMessage, errorDetails, loading: false }
          : file
      ),
    })),

  setFileLoading: (id, loading) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, loading } : file
      ),
    })),

  setFileProgress: (id, progress) =>
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, uploadProgress: progress } : file
      ),
    })),

  getFileById: (id) => get().files.find((file) => file.id === id),

  replacePreviewFiles: (previewUuids, realFiles) =>
    set((state) => ({
      files: [
        ...state.files.filter((file) => !file.uuid || !previewUuids.includes(file.uuid)),
        ...realFiles.map((file) => ({ ...file, isVisibleInPromptBar: true })),
      ],
    })),

  hideFilesFromPromptBar: () =>
    set((state) => ({
      files: state.files.map((file) => ({ ...file, isVisibleInPromptBar: false })),
    })),
}));
