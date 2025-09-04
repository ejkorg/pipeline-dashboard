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
 * Open archived content by date_code using the backend endpoint that handles
 * content-type detection, inline preview vs forced download, and chunked streaming.
 */
export async function openArchiveByDateCode(dateCode: string): Promise<void> {
  const url = `${baseUrl}/pipelines/archived/${encodeURIComponent(dateCode)}`;
  // Just open: server decides inline vs download based on size and type
  window.open(url, '_blank');
}

/**
 * Fetch metadata for an archived file by date_code.
 * Tries HEAD first; if not allowed, falls back to a small ranged GET to read headers.
 */
export async function getArchiveMetadataByDateCode(dateCode: string): Promise<{
  size?: number;
  lastModified?: string;
  contentType?: string;
  exists: boolean;
}> {
  const url = `${baseUrl}/pipelines/archived/${encodeURIComponent(dateCode)}`;
  try {
    let resp = await fetchWithTimeout(url, { method: 'HEAD' });
    if (!resp.ok && resp.status !== 405) {
      return { exists: false };
    }
    if (resp.status === 405) {
      // HEAD not allowed: make a ranged GET request to retrieve minimal headers
      resp = await fetchWithTimeout(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
      if (!resp.ok) return { exists: false };
    }
    const size = resp.headers.get('content-length');
    const lastModified = resp.headers.get('last-modified');
    const contentType = resp.headers.get('content-type');
    return {
      exists: true,
      size: size ? parseInt(size, 10) : undefined,
      lastModified: lastModified || undefined,
      contentType: contentType || undefined
    };
  } catch (error) {
    logger.warn('Archive metadata fetch failed', { dateCode, error });
    return { exists: false };
  }
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
      // Deprecated path-based archive handling: delegate to backend archived endpoint via date_code instead
      logger.info('Archive requested via path; delegating to server-managed streaming if possible', { filePath });
      window.open(fileUrl, '_blank');
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