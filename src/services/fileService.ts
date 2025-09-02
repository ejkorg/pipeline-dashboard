import { logger } from '@/utils/logger';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/pipeline-service';
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS) || 10000;

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
 * @param filePath - The file path to stream
 * @param fileType - Type of file (output, log, archive)
 * @returns Promise that resolves when streaming starts
 */
export async function streamFile(filePath: string, fileType: 'output' | 'log' | 'archive'): Promise<void> {
  try {
    const fileUrl = `${baseUrl}${filePath}`;

    if (fileType === 'archive') {
      // For archived files, trigger download
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filePath.split('/').pop() || `archive.${filePath.endsWith('.gz') ? 'gz' : 'zip'}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      logger.info('Archive file download initiated', { filePath });
    } else {
      // For text files, open in new tab
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