import React, { useCallback, useState } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { cn } from '../../utils/cn';

export interface FileUploadFieldProps {
  label: string;
  name: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  value?: File[];
  onChange: (files: File[]) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
  showProgress?: boolean;
  onUpload?: (files: File[]) => Promise<void>;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  name,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  value = [],
  onChange,
  error,
  touched,
  required = false,
  disabled = false,
  className,
  helpText,
  showProgress = false,
  onUpload,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [filesWithProgress, setFilesWithProgress] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const hasError = touched && error;
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId = `${fieldId}-help`;

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    return null;
  }, [maxSize]);

  // Handle file selection
  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Check total file count
    const totalFiles = value.length + validFiles.length;
    if (totalFiles > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Update files
    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...value, ...validFiles] : validFiles;
      onChange(updatedFiles);

      // Initialize progress tracking
      if (showProgress) {
        const newFilesWithProgress = validFiles.map(file => ({
          file,
          progress: 0,
          status: 'pending' as const,
        }));
        setFilesWithProgress(prev => [...prev, ...newFilesWithProgress]);
      }
    }

    // Show errors if any
    if (errors.length > 0) {
      console.error('File validation errors:', errors);
    }
  }, [value, onChange, multiple, maxFiles, validateFile, showProgress]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  // Remove file
  const removeFile = useCallback((index: number) => {
    const updatedFiles = value.filter((_, i) => i !== index);
    onChange(updatedFiles);

    // Remove from progress tracking
    if (showProgress) {
      setFilesWithProgress(prev => prev.filter((_, i) => i !== index));
    }
  }, [value, onChange, showProgress]);

  // Upload files
  const handleUpload = useCallback(async () => {
    if (!onUpload || value.length === 0) return;

    setIsUploading(true);

    try {
      // Simulate upload progress
      if (showProgress) {
        setFilesWithProgress(prev =>
          prev.map(item => ({ ...item, status: 'uploading' as const }))
        );

        // Simulate progress updates
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setFilesWithProgress(prev =>
            prev.map(item => ({ ...item, progress }))
          );
        }
      }

      await onUpload(value);

      // Mark as success
      if (showProgress) {
        setFilesWithProgress(prev =>
          prev.map(item => ({ ...item, status: 'success' as const, progress: 100 }))
        );
      }
    } catch (error) {
      // Mark as error
      if (showProgress) {
        setFilesWithProgress(prev =>
          prev.map(item => ({
            ...item,
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Upload failed'
          }))
        );
      }
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, value, showProgress]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium leading-none',
          hasError && 'text-red-600',
          disabled && 'opacity-50'
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {/* Drop zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive && 'border-primary bg-primary/5',
          hasError && 'border-red-500',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'hover:border-primary/50 cursor-pointer'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id={fieldId}
          name={name}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          required={required}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-describedby={cn(
            hasError && errorId,
            helpText && helpId
          ).trim() || undefined}
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {accept && `Accepted formats: ${accept}`}
            {maxSize && ` • Max size: ${Math.round(maxSize / 1024 / 1024)}MB`}
            {multiple && ` • Max files: ${maxFiles}`}
          </div>
        </div>
      </div>

      {/* File list */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file, index) => {
            const fileWithProgress = filesWithProgress[index];
            const status = fileWithProgress?.status || 'pending';
            const progress = fileWithProgress?.progress || 0;

            return (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    {showProgress && status === 'uploading' && (
                      <Progress value={progress} className="mt-1 h-1" />
                    )}
                    {fileWithProgress?.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {fileWithProgress.error}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Status icon */}
                  {status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}

                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={disabled || isUploading}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload button */}
      {onUpload && value.length > 0 && (
        <Button
          type="button"
          onClick={handleUpload}
          disabled={disabled || isUploading}
          className="w-full"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload {value.length} file{value.length !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      )}

      {/* Help text */}
      {helpText && !hasError && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}

      {/* Error message */}
      {hasError && (
        <p
          id={errorId}
          className="text-xs text-red-600 flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-3 w-3 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUploadField;