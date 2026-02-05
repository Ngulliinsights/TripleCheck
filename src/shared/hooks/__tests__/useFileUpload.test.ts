/**
 * useFileUpload Hook Tests
 * Comprehensive testing for file upload functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { FileUploadHelpers } from '@/shared/test-utils/form-testing'
import { useFileUpload } from '../useFileUpload'

// Mock dependencies
vi.mock('@/shared/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('useFileUpload', () => {
  const mockOnUpload = vi.fn();
  const mockOnProgress = vi.fn();
  const mockOnError = vi.fn();

  const defaultOptions = {
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    onUpload: mockOnUpload,
    onProgress: mockOnProgress,
    onError: mockOnError,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch for upload requests
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      expect(result.current.files).toEqual([]);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with custom options', () => {
      const customOptions = {
        ...defaultOptions,
        maxFiles: 10,
        maxSize: 10 * 1024 * 1024,
      };

      const { result } = renderHook(() => useFileUpload(customOptions));

      expect(result.current.files).toEqual([]);
      expect(result.current.isUploading).toBe(false);
    });
  });

  describe('File Selection', () => {
    it('should add valid files', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFiles = [
        FileUploadHelpers.createTestFile('image1.jpg', 'image/jpeg', 1024),
        FileUploadHelpers.createTestFile('image2.png', 'image/png', 2048),
      ];

      await act(async () => {
        result.current.addFiles(testFiles);
      });

      expect(result.current.files).toHaveLength(2);
      expect(result.current.files[0].file.name).toBe('image1.jpg');
      expect(result.current.files[1].file.name).toBe('image2.png');
    });

    it('should reject files exceeding max count', async () => {
      const { result } = renderHook(() => useFileUpload({
        ...defaultOptions,
        maxFiles: 2,
      }));

      const testFiles = FileUploadHelpers.createTestFiles(3, 'image');

      await act(async () => {
        result.current.addFiles(testFiles);
      });

      expect(result.current.files).toHaveLength(2);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MAX_FILES_EXCEEDED',
          message: expect.stringContaining('Maximum 2 files allowed'),
        })
      );
    });

    it('should reject files with invalid types', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const invalidFile = FileUploadHelpers.createTestFile('document.pdf', 'application/pdf');

      await act(async () => {
        result.current.addFiles([invalidFile]);
      });

      expect(result.current.files).toHaveLength(0);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INVALID_FILE_TYPE',
          message: expect.stringContaining('File type not allowed'),
        })
      );
    });

    it('should reject files exceeding size limit', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const largeFile = FileUploadHelpers.createTestFile(
        'large.jpg',
        'image/jpeg',
        6 * 1024 * 1024 // 6MB
      );

      await act(async () => {
        result.current.addFiles([largeFile]);
      });

      expect(result.current.files).toHaveLength(0);
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'FILE_TOO_LARGE',
          message: expect.stringContaining('File size exceeds limit'),
        })
      );
    });

    it('should handle duplicate files', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      await act(async () => {
        result.current.addFiles([testFile]);
      });

      expect(result.current.files).toHaveLength(1);

      // Try to add the same file again
      await act(async () => {
        result.current.addFiles([testFile]);
      });

      expect(result.current.files).toHaveLength(1); // Should not duplicate
    });
  });

  describe('File Removal', () => {
    it('should remove file by id', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFiles = FileUploadHelpers.createTestFiles(2, 'image');

      await act(async () => {
        result.current.addFiles(testFiles);
      });

      expect(result.current.files).toHaveLength(2);

      const fileId = result.current.files[0].id;

      await act(async () => {
        result.current.removeFile(fileId);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files.find(f => f.id === fileId)).toBeUndefined();
    });

    it('should clear all files', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFiles = FileUploadHelpers.createTestFiles(3, 'image');

      await act(async () => {
        result.current.addFiles(testFiles);
      });

      expect(result.current.files).toHaveLength(3);

      await act(async () => {
        result.current.clearFiles();
      });

      expect(result.current.files).toHaveLength(0);
    });
  });

  describe('File Upload', () => {
    it('should upload files successfully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ urls: ['http://example.com/image1.jpg'] }),
      });

      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      await act(async () => {
        result.current.addFiles([testFile]);
      });

      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockOnUpload).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            file: testFile,
            status: 'completed',
            url: 'http://example.com/image1.jpg',
          }),
        ])
      );
    });

    it('should handle upload progress', async () => {
      // Mock XMLHttpRequest for progress tracking
      const mockXHR = {
        open: vi.fn(),
        send: vi.fn(),
        setRequestHeader: vi.fn(),
        upload: {
          addEventListener: vi.fn(),
        },
        addEventListener: vi.fn(),
        readyState: 4,
        status: 200,
        response: JSON.stringify({ urls: ['http://example.com/image.jpg'] }),
      };

      global.XMLHttpRequest = vi.fn(() => mockXHR) as any;

      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      await act(async () => {
        result.current.addFiles([testFile]);
      });

      await act(async () => {
        result.current.uploadFiles();
      });

      // Simulate progress event
      const progressHandler = mockXHR.upload.addEventListener.mock.calls.find(
        call => call[0] === 'progress'
      )?.[1];

      if (progressHandler) {
        await act(async () => {
          progressHandler({ loaded: 50, total: 100 });
        });

        expect(mockOnProgress).toHaveBeenCalledWith(50);
      }
    });

    it('should handle upload errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      await act(async () => {
        result.current.addFiles([testFile]);
      });

      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPLOAD_ERROR',
          message: expect.stringContaining('Upload failed'),
        })
      );

      expect(result.current.files[0].status).toBe('error');
    });

    it('should handle server errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      await act(async () => {
        result.current.addFiles([testFile]);
      });

      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SERVER_ERROR',
          message: expect.stringContaining('Server error'),
        })
      );
    });

    it('should update upload status correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ urls: ['http://example.com/image.jpg'] }),
      });

      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      await act(async () => {
        result.current.addFiles([testFile]);
      });

      expect(result.current.files[0].status).toBe('pending');

      const uploadPromise = act(async () => {
        await result.current.uploadFiles();
      });

      // During upload
      expect(result.current.isUploading).toBe(true);

      await uploadPromise;

      // After upload
      expect(result.current.isUploading).toBe(false);
      expect(result.current.files[0].status).toBe('completed');
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drag enter', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      await act(async () => {
        result.current.onDragEnter();
      });

      expect(result.current.isDragActive).toBe(true);
    });

    it('should handle drag leave', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      await act(async () => {
        result.current.onDragEnter();
      });

      expect(result.current.isDragActive).toBe(true);

      await act(async () => {
        result.current.onDragLeave();
      });

      expect(result.current.isDragActive).toBe(false);
    });

    it('should handle file drop', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          files: [testFile],
        },
      } as any;

      await act(async () => {
        result.current.onDrop(mockEvent);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].file.name).toBe('image.jpg');
      expect(result.current.isDragActive).toBe(false);
    });

    it('should prevent default drag behavior', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: { files: [] },
      } as any;

      await act(async () => {
        result.current.onDragOver(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('File Preview', () => {
    it('should generate preview URLs for images', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      // Mock URL.createObjectURL
      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/preview');

      await act(async () => {
        result.current.addFiles([testFile]);
      });

      expect(result.current.files[0].preview).toBe('blob:http://localhost/preview');
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(testFile);
    });

    it('should not generate preview for non-image files', async () => {
      const customOptions = {
        ...defaultOptions,
        acceptedTypes: ['application/pdf'],
      };

      const { result } = renderHook(() => useFileUpload(customOptions));

      const testFile = FileUploadHelpers.createTestFile('document.pdf', 'application/pdf');

      await act(async () => {
        result.current.addFiles([testFile]);
      });

      expect(result.current.files[0].preview).toBeUndefined();
    });

    it('should cleanup preview URLs on unmount', () => {
      global.URL.revokeObjectURL = vi.fn();

      const { result, unmount } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      act(() => {
        result.current.addFiles([testFile]);
      });

      unmount();

      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });

  describe('Retry Functionality', () => {
    it('should retry failed uploads', async () => {
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ urls: ['http://example.com/image.jpg'] }),
        });

      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      await act(async () => {
        result.current.addFiles([testFile]);
      });

      // First upload attempt fails
      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(result.current.files[0].status).toBe('error');

      // Retry upload
      await act(async () => {
        await result.current.retryUpload(result.current.files[0].id);
      });

      expect(result.current.files[0].status).toBe('completed');
    });

    it('should retry all failed uploads', async () => {
      (global.fetch as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ urls: ['http://example.com/image1.jpg', 'http://example.com/image2.jpg'] }),
        });

      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFiles = FileUploadHelpers.createTestFiles(2, 'image');

      await act(async () => {
        result.current.addFiles(testFiles);
      });

      // First upload attempt fails
      await act(async () => {
        await result.current.uploadFiles();
      });

      expect(result.current.files.filter(f => f.status === 'error')).toHaveLength(2);

      // Retry all failed uploads
      await act(async () => {
        await result.current.retryFailedUploads();
      });

      expect(result.current.files.filter(f => f.status === 'completed')).toHaveLength(2);
    });
  });

  describe('Validation', () => {
    it('should validate file extensions', async () => {
      const customOptions = {
        ...defaultOptions,
        acceptedTypes: ['.jpg', '.png'],
      };

      const { result } = renderHook(() => useFileUpload(customOptions));

      const validFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');
      const invalidFile = FileUploadHelpers.createTestFile('image.gif', 'image/gif');

      await act(async () => {
        result.current.addFiles([validFile, invalidFile]);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].file.name).toBe('image.jpg');
    });

    it('should validate total upload size', async () => {
      const customOptions = {
        ...defaultOptions,
        maxTotalSize: 3 * 1024 * 1024, // 3MB total
      };

      const { result } = renderHook(() => useFileUpload(customOptions));

      const files = [
        FileUploadHelpers.createTestFile('image1.jpg', 'image/jpeg', 2 * 1024 * 1024), // 2MB
        FileUploadHelpers.createTestFile('image2.jpg', 'image/jpeg', 2 * 1024 * 1024), // 2MB
      ];

      await act(async () => {
        result.current.addFiles(files);
      });

      expect(result.current.files).toHaveLength(1); // Only first file should be added
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TOTAL_SIZE_EXCEEDED',
          message: expect.stringContaining('Total size exceeds limit'),
        })
      );
    });

    it('should validate custom file validation function', async () => {
      const customValidator = vi.fn((file: File) => {
        return file.name.includes('valid');
      });

      const customOptions = {
        ...defaultOptions,
        customValidator,
      };

      const { result } = renderHook(() => useFileUpload(customOptions));

      const validFile = FileUploadHelpers.createTestFile('valid-image.jpg', 'image/jpeg');
      const invalidFile = FileUploadHelpers.createTestFile('invalid-image.jpg', 'image/jpeg');

      await act(async () => {
        result.current.addFiles([validFile, invalidFile]);
      });

      expect(result.current.files).toHaveLength(1);
      expect(result.current.files[0].file.name).toBe('valid-image.jpg');
      expect(customValidator).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Recovery', () => {
    it('should clear errors when adding new files', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      // Trigger an error
      const invalidFile = FileUploadHelpers.createTestFile('document.pdf', 'application/pdf');

      await act(async () => {
        result.current.addFiles([invalidFile]);
      });

      expect(result.current.error).not.toBeNull();

      // Add valid file
      const validFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      await act(async () => {
        result.current.addFiles([validFile]);
      });

      expect(result.current.error).toBeNull();
    });

    it('should reset state on clear', async () => {
      const { result } = renderHook(() => useFileUpload(defaultOptions));

      const testFile = FileUploadHelpers.createTestFile('image.jpg', 'image/jpeg');

      await act(async () => {
        result.current.addFiles([testFile]);
      });

      // Set some state
      act(() => {
        result.current.setProgress(50);
      });

      await act(async () => {
        result.current.clearFiles();
      });

      expect(result.current.files).toHaveLength(0);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
    });
  });
});