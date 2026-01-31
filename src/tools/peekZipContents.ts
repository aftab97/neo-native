import JSZip from 'jszip';
import { File } from 'expo-file-system/next';

/**
 * Peek inside a ZIP file and return the list of filenames
 * Matches web app implementation in peek-zip-contents.ts
 */
export async function peekZipContents(zipUri: string): Promise<string[]> {
  try {
    // Read the ZIP file as base64 using the new File API (SDK 54+)
    const file = new File(zipUri);
    const base64 = await file.base64();

    // Load the ZIP file
    const zip = await JSZip.loadAsync(base64, { base64: true });

    // Get all file names (excluding directories and macOS metadata)
    const filenames = Object.values(zip.files)
      .filter((f) => !f.dir)
      .filter((f) => !f.name.startsWith('__MACOSX/')) // Filter macOS metadata folder
      .filter((f) => !f.name.includes('/__MACOSX/')) // Filter nested macOS metadata
      .map((f) => {
        // Get just the filename, not the full path
        const parts = f.name.split('/');
        return parts[parts.length - 1];
      })
      .filter((name) => name && !name.startsWith('.') && !name.startsWith('._')); // Filter out hidden files, macOS resource forks, and empty names

    console.log('[peekZipContents] Found', filenames.length, 'files:', filenames);
    return filenames;
  } catch (err) {
    console.error('[peekZipContents] Error reading ZIP:', err);
    // On error, return empty (can fallback to just showing the .zip row)
    return [];
  }
}
