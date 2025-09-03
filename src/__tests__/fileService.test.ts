import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { streamFile, checkFileExists, getFileMetadata } from '@/services/fileService';
import pako from 'pako';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock URL.createObjectURL and revokeObjectURL
const createObjectURLMock = vi.fn();
const revokeObjectURLMock = vi.fn();
global.URL.createObjectURL = createObjectURLMock;
global.URL.revokeObjectURL = revokeObjectURLMock;

// Mock window.open
const openMock = vi.fn();
global.window.open = openMock;

// Mock document methods for download links
const appendChildMock = vi.fn();
const removeChildMock = vi.fn();
const clickMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  global.document.body.appendChild = appendChildMock;
  global.document.body.removeChild = removeChildMock;
  global.document.createElement = vi.fn().mockReturnValue({
    href: '',
    download: '',
    target: '',
    click: clickMock
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('fileService', () => {
  describe('streamFile', () => {
    it('should open text files in new tab', async () => {
      const filePath = '/path/to/log.txt';
      const fileType = 'log';

      await streamFile(filePath, fileType);

      expect(openMock).toHaveBeenCalledWith('/pipeline-service/path/to/log.txt', '_blank');
    });

    it('should decompress and display small .gz archive files', async () => {
      const filePath = '/path/to/archive.gz';
      const fileType = 'archive';
      // Create a simple valid gzip compressed "test" string
      const originalText = 'test content';
      const compressedData = pako.gzip(originalText);
      const mockResponse = {
        ok: true,
        headers: new Map([['content-length', compressedData.length.toString()]]),
        arrayBuffer: vi.fn().mockResolvedValue(compressedData.buffer)
      };

      fetchMock.mockResolvedValue(mockResponse);
      createObjectURLMock.mockReturnValue('blob:mock-url');

      await streamFile(filePath, fileType);

      expect(fetchMock).toHaveBeenCalledWith('/pipeline-service/path/to/archive.gz', { method: 'GET' });
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(openMock).toHaveBeenCalledWith('blob:mock-url', '_blank');
    });

    it('should download large .gz archive files', async () => {
      const filePath = '/path/to/large-archive.gz';
      const fileType = 'archive';
      const mockResponse = {
        ok: true,
        headers: new Map([['content-length', '15000000']]), // 15MB > 10MB limit
      };

      fetchMock.mockResolvedValue(mockResponse);

      await streamFile(filePath, fileType);

      // For large files, we still need to fetch to check the size, but then trigger download
      expect(fetchMock).toHaveBeenCalledWith('/pipeline-service/path/to/large-archive.gz', { method: 'GET' });
      expect(clickMock).toHaveBeenCalled();
    });

    it('should handle fetch errors', async () => {
      const filePath = '/path/to/missing.txt';
      const fileType = 'output';
      const mockResponse = {
        ok: false,
        status: 404
      };

      fetchMock.mockResolvedValue(mockResponse);

      // For non-archive files, even failed responses should still try to open the URL
      await streamFile(filePath, fileType);

      expect(openMock).toHaveBeenCalledWith('/pipeline-service/path/to/missing.txt', '_blank');
    });
  });

  describe('checkFileExists', () => {
    it('should return true for existing files', async () => {
      const filePath = '/path/to/existing.txt';
      const mockResponse = { ok: true };

      fetchMock.mockResolvedValue(mockResponse);

      const result = await checkFileExists(filePath);

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith('/pipeline-service/path/to/existing.txt', { method: 'HEAD' });
    });

    it('should return false for non-existing files', async () => {
      const filePath = '/path/to/missing.txt';
      const mockResponse = { ok: false };

      fetchMock.mockResolvedValue(mockResponse);

      const result = await checkFileExists(filePath);

      expect(result).toBe(false);
    });

    it('should return false on fetch errors', async () => {
      const filePath = '/path/to/error.txt';

      fetchMock.mockRejectedValue(new Error('Network error'));

      const result = await checkFileExists(filePath);

      expect(result).toBe(false);
    });
  });

  describe('getFileMetadata', () => {
    it('should return metadata for existing files', async () => {
      const filePath = '/path/to/file.txt';
      const mockResponse = {
        ok: true,
        headers: new Map([
          ['content-length', '1024'],
          ['last-modified', 'Wed, 21 Oct 2015 07:28:00 GMT'],
          ['content-type', 'text/plain']
        ])
      };

      fetchMock.mockResolvedValue(mockResponse);

      const result = await getFileMetadata(filePath);

      expect(result).toEqual({
        exists: true,
        size: 1024,
        lastModified: 'Wed, 21 Oct 2015 07:28:00 GMT',
        contentType: 'text/plain'
      });
    });

    it('should return exists: false for non-existing files', async () => {
      const filePath = '/path/to/missing.txt';
      const mockResponse = { ok: false };

      fetchMock.mockResolvedValue(mockResponse);

      const result = await getFileMetadata(filePath);

      expect(result).toEqual({ exists: false });
    });
  });
});