import { useCallback, useState } from 'react'

// ===== FILE UPLOAD HOOK =====

export interface UseFileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  multiple?: boolean;
  onUpload?: (files: File[]) => Promise<void>;
  onError?: (error: string) => void;
}

export interface UseFileUploadReturn {
  files: File[];
  uploading: boolean;
  progress: number;
  error: string | null;

  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  upload: () => Promise<void>;
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/*', 'application/pdf'],
    multiple = false,
    onUpload,
    onError
  } = options;

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }

    const isAllowedType = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isAllowedType) {
      return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }

    return null;
  }, [maxSize, allowedTypes]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        onError?.(validationError);
        return;
      }
      validFiles.push(file);
    }

    setFiles(prev => multiple ? [...prev, ...validFiles] : validFiles);
    setError(null);
  }, [validateFile, multiple, onError]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
    }
  }, [addFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
    setProgress(0);
  }, []);

  const upload = useCallback(async () => {
    if (!onUpload || files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress with more efficient approach
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(files);

      clearInterval(progressInterval);
      setProgress(100);

      // Clear files after successful upload
      setTimeout(() => {
        clearFiles();
      }, 1000);

    } catch (uploadError) {
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [files, onUpload, onError, clearFiles]);

  return {
    files,
    uploading,
    progress,
    error,

    handleFileSelect,
    handleDrop,
    handleDragOver,
    removeFile,
    clearFiles,
    upload
  };
}