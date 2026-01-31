import type { FileAttachment } from '../store/fileStore';

/**
 * Merges all gcs_uris from processFileResponse, handling both flat and preprocessResults-based (zip) responses.
 * Matches web app implementation in merge-gcs-uris.ts
 */
export const mergeAllGcsUris = (
  filesMetaData?: FileAttachment[]
): { [key: string]: string[] } => {
  // Flattens and extracts ALL gcs_uris (top-level and inside preprocessResults of zips)
  const allGcsUris: Record<string, string[]>[] = [];

  for (const file of Array.isArray(filesMetaData) ? filesMetaData : []) {
    // 1. Top level (single file uploads or legacy shape)
    const topLevelUris = file?.processFileResponse?.fileResponse?.gcs_uris;
    if (topLevelUris) allGcsUris.push(topLevelUris);

    // 2. Zip/multi-file: check for preprocessResults
    const preprocessResults = file?.processFileResponse?.preprocessResults;
    if (Array.isArray(preprocessResults)) {
      for (const result of preprocessResults) {
        const uris = result?.fileResponse?.gcs_uris;
        if (uris) allGcsUris.push(uris);
      }
    }
  }

  // Custom merge function (simplified lodash mergeWith)
  const mergedGcsUris: Record<string, string[]> = {};

  for (const gcsUriObj of allGcsUris) {
    for (const [key, value] of Object.entries(gcsUriObj)) {
      if (!mergedGcsUris[key]) {
        mergedGcsUris[key] = [];
      }
      if (Array.isArray(value)) {
        mergedGcsUris[key] = [...mergedGcsUris[key], ...value];
      }
    }
  }

  // Ensure both keys exist
  mergedGcsUris['is_unstructured=False'] = mergedGcsUris['is_unstructured=False'] || [];
  mergedGcsUris['is_unstructured=True'] = mergedGcsUris['is_unstructured=True'] || [];

  // Deduplicate
  Object.keys(mergedGcsUris).forEach((key) => {
    mergedGcsUris[key] = [...new Set(mergedGcsUris[key])];
  });

  return mergedGcsUris;
};
