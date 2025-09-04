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

function filenameFromContentDisposition(cd?: string | null, fallback?: string): string | undefined {
  if (!cd) return fallback;
  const m = /filename\*\s*=\s*([^;]+)/i.exec(cd);
  if (m && m[1]) {
    let v = m[1].trim();
    // handle RFC5987 encoded: filename*=UTF-8''...
    if (v.toLowerCase().startsWith("utf-8''")) v = decodeURIComponent(v.slice(7));
    return v.replace(/^"|"$/g, '');
  }
  const m2 = /filename="?([^";]+)"?/i.exec(cd);
  return (m2 && m2[1]) ? m2[1] : fallback;
}

function absoluteFromRelative(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function extractDownloadHref(html: string, baseUrl: string): string | null {
  const m = html.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>\s*(?:Download|download)[^<]*<\/a>/i);
  if (m && m[1]) return absoluteFromRelative(m[1], baseUrl);
  return null;
}

/**
 * Open or download archive by date_code with preview for small .gz files.
 * - HEAD to get size/type (falls back to Range GET); if small .gz, decompress & open
 * - Otherwise, GET and download (uses Content-Disposition or extracted link from HTML)
 */
export async function openOrDownloadArchiveByDateCode(
  dateCode: string,
  opts?: { maxPreviewBytes?: number }
): Promise<void> {
  const url = `${baseUrl}/pipelines/archived/${encodeURIComponent(dateCode)}`;
  const limit = opts?.maxPreviewBytes ?? DEFAULT_MAX_DECOMPRESS_SIZE;
  try {
    // 1) Try to learn size/type
    let head = await fetchWithTimeout(url, { method: 'HEAD' });
    if (!head.ok && head.status !== 405) {
      // If HEAD fails for other reason, proceed with GET path
      head = undefined as any;
    }
    if (head && head.status === 405) {
      // Not allowed: make a ranged GET
      const resp = await fetchWithTimeout(url, { method: 'GET', headers: { Range: 'bytes=0-0' } });
      if (resp.ok) head = resp as any;
    }
    const size = head?.headers?.get('content-length') ? parseInt(head.headers.get('content-length')!, 10) : undefined;
    const type = head?.headers?.get('content-type') || undefined;

    const isGzip = (type && /gzip|application\/gzip|application\/x-gzip/i.test(type)) || false;
    if (isGzip && size != null && size <= limit) {
      // 2) Small gzip: fetch and preview
      const response = await fetchWithTimeout(url, { method: 'GET' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const compressedData = new Uint8Array(arrayBuffer);
      const decompressedData = pako.ungzip(compressedData, { to: 'string' });
      const blob = new Blob([decompressedData], { type: 'text/plain' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      logger.info('Archive preview opened (small gzip)', { dateCode, size });
      return;
    }

    // 3) Programmatic download
    const getResp = await fetchWithTimeout(url, { method: 'GET' });
    if (!getResp.ok) throw new Error(`HTTP ${getResp.status}`);

    const ctype = getResp.headers.get('content-type') || '';
    const cd = getResp.headers.get('content-disposition');
    const defaultName = `${dateCode}.gz`;

    if (/text\/html/i.test(ctype)) {
      // HTML body possibly contains a "Download file" link; extract and follow
      const text = await getResp.text();
      const href = extractDownloadHref(text, url);
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.target = '_blank';
        a.rel = 'noopener';
        // If the link doesn't force download, try to set download attr with filename fallback
        a.download = filenameFromContentDisposition(cd, defaultName) || defaultName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        logger.info('Archive HTML page provided link; triggered download', { dateCode, href });
        return;
      }
      // Fallback: open the page (user can click)
      window.open(url, '_blank');
      logger.warn('Archive returned HTML without direct link; opened page instead', { dateCode });
      return;
    }

    // Non-HTML: blob download using server-provided filename
    const blob = await getResp.blob();
    const a = document.createElement('a');
    const dlUrl = URL.createObjectURL(blob);
    a.href = dlUrl;
    a.download = filenameFromContentDisposition(cd, defaultName) || defaultName;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(dlUrl);
    logger.info('Archive downloaded via blob', { dateCode, filename: a.download, contentType: ctype });
  } catch (error) {
    logger.error('Failed to open/download archive by date_code', { dateCode, error });
    // As a last resort, open the URL so user sees server page
    try { window.open(url, '_blank'); } catch {}
    throw error;
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