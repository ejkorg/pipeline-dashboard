import { logger } from '@/utils/logger';
import pako from 'pako';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/pipeline-service';
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 10000;
// Default limit (10MB) if caller does not supply one
const DEFAULT_MAX_DECOMPRESS_SIZE = 10 * 1024 * 1024;

function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = DEFAULT_TIMEOUT, ...rest } = options;
  return Promise.race([
    fetch(resource, rest),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout)
    )
  ]) as Promise<Response>;
}

/**
 * Stream a file from the backend API
 * @param filePath - The file path to stream (should be absolute or relative to baseUrl)
 * @param fileType - Type of file (output, log, archive)
 * @returns Promise that resolves when streaming/display starts
 */
export async function streamFile(
  filePath: string,
  fileType: 'output' | 'log' | 'archive',
  opts?: { maxPreviewBytes?: number }
): Promise<void> {
  try {
    const fileUrl = `${baseUrl}${filePath}`;

    if (fileType === 'archive') {
      const MAX_DECOMPRESS_SIZE = opts?.maxPreviewBytes ?? DEFAULT_MAX_DECOMPRESS_SIZE;
      // For archived .gz files, fetch, decompress, and display
      const response = await fetch(fileUrl, { method: 'GET' });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

      const contentLength = response.headers.get('content-length');
      const size = contentLength ? parseInt(contentLength, 10) : 0;

      if (size > MAX_DECOMPRESS_SIZE) {
        // For large files, fall back to download to avoid performance issues
        logger.warn('Archive file too large for decompression, triggering download', { filePath, size });
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = filePath.split('/').pop() || `archive.${filePath.endsWith('.gz') ? 'gz' : 'zip'}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Fetch as array buffer for binary data
      const arrayBuffer = await response.arrayBuffer();
      const compressedData = new Uint8Array(arrayBuffer);

      // Decompress using pako
      const decompressedData = pako.ungzip(compressedData, { to: 'string' }); // Assumes text content

      // Create a blob and open in new tab for viewing
      const blob = new Blob([decompressedData], { type: 'text/plain' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      logger.info('Archive file decompressed and opened in new tab', { filePath, originalSize: size });
    } else {
      // For text files, open in new tab (existing behavior)
      window.open(fileUrl, '_blank');
      logger.info('File opened in new tab', { filePath, fileType });
    }
  } catch (error) {
    logger.error('Failed to stream file', { filePath, fileType, error });
    throw error;
  }
}

/**
 * Check if a file exists on the backend
 * @param filePath - The file path to check
 * @returns Promise<boolean> - true if file exists
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    const fileUrl = `${baseUrl}${filePath}`;
    const response = await fetchWithTimeout(fileUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    logger.warn('File existence check failed', { filePath, error });
    return false;
  }
}

/**
 * Get file metadata (size, last modified, etc.)
 * @param filePath - The file path to get metadata for
 * @returns Promise with file metadata
 */
export async function getFileMetadata(filePath: string): Promise<{
  size?: number;
  lastModified?: string;
  contentType?: string;
  exists: boolean;
}> {
  try {
    const fileUrl = `${baseUrl}${filePath}`;
    const response = await fetchWithTimeout(fileUrl, { method: 'HEAD' });

    if (!response.ok) {
      return { exists: false };
    }

    const size = response.headers.get('content-length');
    const lastModified = response.headers.get('last-modified');
    const contentType = response.headers.get('content-type');

    return {
      exists: true,
      size: size ? parseInt(size, 10) : undefined,
      lastModified: lastModified || undefined,
      contentType: contentType || undefined,
    };
  } catch (error) {
    logger.warn('File metadata fetch failed', { filePath, error });
    return { exists: false };
  }
}