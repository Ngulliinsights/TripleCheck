import { useCallback, useRef, useState } from 'react';

import { useEnhancedCleanupManager } from '../../infrastructure/hooks/useCleanupManager';
import { useSafeEffect } from '../../infrastructure/hooks/useSafeEffect';

interface FileUploadOptions {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedFileTypes?: string[];
  multiple?: boolean;
  autoUpload?: boolean;
  uploadEndpoint?: string;
  onProgress?: (progress: number, file: File) => void;
  onSuccess?: (response: any, file: File) => void;
  onError?: (error: Error, file: File) => void;
  onComplete?: (results: UploadResult[]) => void;
}

interface UploadResult {
  file: File;
  success: boolean;
  response?: any;
  error?: Error;
  url?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

interface UseFileUploadReturn {
  files: FileWithPreview[];
  uploading: boolean;
  progress: Record<string, number>;
  errors: Record<string, Error>;
  results: UploadResult[];
  addFiles: (newFiles: FileList | File[]) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  uploadFiles: () => Promise<UploadResult[]>;
  uploadFile: (file: FileWithPreview) => Promise<UploadResult>;
  cancelUpload: (fileId?: string) => void;
  getRootProps: () => React.HTMLAttributes<HTMLElement>;
  getInputProps: () => React.InputHTMLAttributes<HTMLInputElement>;
  isDragActive: boolean;
}

/**
 * Comprehensive file upload hook with drag-and-drop, progress tracking, and validation
 * Essential for property images, documents, and user profile pictures
 */
export function useFileUpload({
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = ['image/*', 'application/pdf', '.doc', '.docx'],
  multiple = true,
  autoUpload = false,
  uploadEndpoint = '/api/upload',
  onProgress,
  onSuccess,
  onError,
  onComplete,
}: FileUploadOptions = {}): UseFileUploadReturn {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [results, setResults] = useState<UploadResult[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadControllersRef = useRef<Record<string, AbortController>>({});

  // Generate unique file ID
  const generateFileId = useCallback(() => {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }

    // Check file type
    const isValidType = acceptedFileTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      }
      if (type.includes('*')) {
        const [mainType] = type.split('/');
        return mainType ? file.type.startsWith(mainType) : false;
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`;
    }

    return null;
  }, [maxFileSize, acceptedFileTypes]);

  // Create file preview
  const createFilePreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  }, []);

  // Add files
  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      const error = new Error(`Maximum ${maxFiles} files allowed`);
      setErrors(prev => ({ ...prev, general: error }));
      return;
    }

    const validFiles: FileWithPreview[] = [];
    const fileErrors: Record<string, Error> = {};

    for (const file of fileArray) {
      const fileId = generateFileId();
      const validationError = validateFile(file);

      if (validationError) {
        fileErrors[fileId] = new Error(validationError);
        continue;
      }

      const preview = await createFilePreview(file);
      const fileWithPreview = Object.assign(file, {
        id: fileId,
        ...(preview && { preview }),
      });

      validFiles.push(fileWithPreview);
    }

    setFiles(prev => [...prev, ...validFiles]);
    setErrors(prev => ({ ...prev, ...fileErrors }));

    // Auto upload if enabled
    if (autoUpload && validFiles.length > 0) {
      uploadFiles();
    }
  }, [files.length, maxFiles, validateFile, createFilePreview, generateFileId, autoUpload]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fileId];
      return newErrors;
    });

    // Cancel upload if in progress
    if (uploadControllersRef.current[fileId]) {
      uploadControllersRef.current[fileId].abort();
      delete uploadControllersRef.current[fileId];
    }
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    // Cancel all uploads
    Object.values(uploadControllersRef.current).forEach(controller => {
      controller.abort();
    });
    uploadControllersRef.current = {};

    setFiles([]);
    setProgress({});
    setErrors({});
    setResults([]);
    setUploading(false);
  }, []);

  // Upload single file
  const uploadFile = useCallback(async (file: FileWithPreview): Promise<UploadResult> => {
    const controller = new AbortController();
    uploadControllersRef.current[file.id] = controller;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('fileType', file.type);

      const token = localStorage.getItem('authToken');

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progressPercent = Math.round((event.loaded / event.total) * 100);
            setProgress(prev => ({ ...prev, [file.id]: progressPercent }));
            onProgress?.(progressPercent, file);
          }
        });

        xhr.addEventListener('load', () => {
          delete uploadControllersRef.current[file.id];
          
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              const result: UploadResult = {
                file,
                success: true,
                response,
                url: response.url || response.fileUrl,
              };
              
              onSuccess?.(response, file);
              resolve(result);
            } catch (error) {
              const parseError = new Error('Invalid response format');
              const result: UploadResult = {
                file,
                success: false,
                error: parseError,
              };
              
              setErrors(prev => ({ ...prev, [file.id]: parseError }));
              onError?.(parseError, file);
              resolve(result);
            }
          } else {
            const error = new Error(`Upload failed: ${xhr.statusText}`);
            const result: UploadResult = {
              file,
              success: false,
              error,
            };
            
            setErrors(prev => ({ ...prev, [file.id]: error }));
            onError?.(error, file);
            resolve(result);
          }
        });

        xhr.addEventListener('error', () => {
          delete uploadControllersRef.current[file.id];
          const error = new Error('Upload failed');
          const result: UploadResult = {
            file,
            success: false,
            error,
          };
          
          setErrors(prev => ({ ...prev, [file.id]: error }));
          onError?.(error, file);
          resolve(result);
        });

        xhr.addEventListener('abort', () => {
          delete uploadControllersRef.current[file.id];
          const error = new Error('Upload cancelled');
          const result: UploadResult = {
            file,
            success: false,
            error,
          };
          resolve(result);
        });

        xhr.open('POST', uploadEndpoint);
        
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        controller.signal.addEventListener('abort', () => {
          xhr.abort();
        });

        xhr.send(formData);
      });
    } catch (error) {
      delete uploadControllersRef.current[file.id];
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      
      setErrors(prev => ({ ...prev, [file.id]: uploadError }));
      onError?.(uploadError, file);
      
      return {
        file,
        success: false,
        error: uploadError,
      };
    }
  }, [uploadEndpoint, onProgress, onSuccess, onError]);

  // Upload all files
  const uploadFiles = useCallback(async (): Promise<UploadResult[]> => {
    if (files.length === 0) return [];

    setUploading(true);
    setResults([]);

    try {
      const uploadPromises = files.map(file => uploadFile(file));
      const uploadResults = await Promise.all(uploadPromises);
      
      setResults(uploadResults);
      onComplete?.(uploadResults);
      
      return uploadResults;
    } finally {
      setUploading(false);
    }
  }, [files, uploadFile, onComplete]);

  // Cancel upload
  const cancelUpload = useCallback((fileId?: string) => {
    if (fileId) {
      if (uploadControllersRef.current[fileId]) {
        uploadControllersRef.current[fileId].abort();
        delete uploadControllersRef.current[fileId];
      }
    } else {
      // Cancel all uploads
      Object.values(uploadControllersRef.current).forEach(controller => {
        controller.abort();
      });
      uploadControllersRef.current = {};
      setUploading(false);
    }
  }, []);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [addFiles]);

  // Get root props for drag and drop area
  const getRootProps = useCallback(() => ({
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
    onClick: () => fileInputRef.current?.click(),
  }), [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  // Get input props
  const getInputProps = useCallback(() => ({
    ref: fileInputRef,
    type: 'file' as const,
    multiple,
    accept: acceptedFileTypes.join(','),
    onChange: handleInputChange,
    style: { display: 'none' },
  }), [multiple, acceptedFileTypes, handleInputChange]);

  return {
    files,
    uploading,
    progress,
    errors,
    results,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
    uploadFile,
    cancelUpload,
    getRootProps,
    getInputProps,
    isDragActive,
  };
}

/**
 * Property images upload hook
 */
export function usePropertyImageUpload(propertyId?: string) {
  return useFileUpload({
    maxFiles: 20,
    maxFileSize: 5 * 1024 * 1024, // 5MB per image
    acceptedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    multiple: true,
    autoUpload: false,
    uploadEndpoint: `/api/properties/${propertyId || 'temp'}/images`,
    onSuccess: (response, file) => {
      console.log(`Image ${file.name} uploaded successfully:`, response);
    },
    onError: (error, file) => {
      console.error(`Failed to upload image ${file.name}:`, error);
    },
  });
}

/**
 * Document upload hook for property documents
 */
export function useDocumentUpload(propertyId?: string) {
  return useFileUpload({
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024, // 10MB per document
    acceptedFileTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ],
    multiple: true,
    autoUpload: false,
    uploadEndpoint: `/api/properties/${propertyId || 'temp'}/documents`,
    onSuccess: (response, file) => {
      console.log(`Document ${file.name} uploaded successfully:`, response);
    },
    onError: (error, file) => {
      console.error(`Failed to upload document ${file.name}:`, error);
    },
  });
}

/**
 * User avatar upload hook
 */
export function useAvatarUpload(userId?: string) {
  return useFileUpload({
    maxFiles: 1,
    maxFileSize: 2 * 1024 * 1024, // 2MB
    acceptedFileTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    multiple: false,
    autoUpload: true,
    uploadEndpoint: `/api/users/${userId || 'me'}/avatar`,
    onSuccess: (response, file) => {
      console.log('Avatar uploaded successfully:', response);
    },
    onError: (error, file) => {
      console.error('Failed to upload avatar:', error);
    },
  });
}