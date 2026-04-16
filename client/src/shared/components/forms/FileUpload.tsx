import { Upload, X, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react'
import React, { useRef, useState, useCallback } from 'react'

import { useFileUpload } from '../../hooks/useFormValidation'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'

export interface FileUploadProps {
  name: string;
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  disabled?: boolean;
  error?: string;
  touched?: boolean;
  onFilesChange?: (files: File[]) => void;
  onError?: (error: string) => void;
  className?: string;
  required?: boolean;
}

export function FileUpload({
  name,
  label = 'Upload Files',
  accept = 'image/*,application/pdf',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  disabled = false,
  error,
  touched = false,
  onFilesChange,
  onError,
  className,
  required = false,
  ...props
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const {
    files,
    uploading,
    progress,
    error: uploadError,
    handleFileSelect,
    handleDrop,
    handleDragOver,
    removeFile,
    clearFiles
  } = useFileUpload({
    maxSize,
    allowedTypes: accept.split(',').map(type => type.trim()),
    multiple,
    onError: (err) => {
      onError?.(err);
    }
  });

  // Notify parent of file changes
  React.useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragActive(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDropWithState = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!disabled) {
      handleDrop(e);
    }
  }, [disabled, handleDrop]);

  const openFileDialog = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const hasError = touched && (!!error || !!uploadError);
  const errorMessage = error || uploadError;

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label className={cn('block text-sm font-medium', required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
          {label}
        </label>
      )}

      {/* Drop Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive && !disabled && 'border-primary bg-primary/5',
          !dragActive && !disabled && 'border-gray-300 hover:border-gray-400',
          disabled && 'border-gray-200 bg-gray-50 cursor-not-allowed',
          hasError && 'border-red-300 bg-red-50'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDropWithState}
      >
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileSelect}
          className="hidden"
          aria-describedby={hasError ? `${name}-error` : undefined}
          {...props}
        />

        <div className="text-center">
          <Upload className={cn('mx-auto h-12 w-12 mb-4', disabled ? 'text-gray-400' : 'text-gray-500')} />
          
          <div className="space-y-2">
            <p className={cn('text-sm', disabled ? 'text-gray-400' : 'text-gray-600')}>
              {dragActive ? 'Drop files here' : 'Drag and drop files here, or'}
            </p>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={disabled}
            >
              Browse Files
            </Button>
          </div>

          <div className={cn('mt-2 text-xs', disabled ? 'text-gray-400' : 'text-gray-500')}>
            <p>
              {accept.includes('image') && 'Images, '}
              {accept.includes('pdf') && 'PDF, '}
              up to {formatFileSize(maxSize)} each
            </p>
            {multiple && <p>Maximum {maxFiles} files</p>}
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Selected Files ({files.length}{multiple ? `/${maxFiles}` : ''})
          </h4>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {uploading && (
                    <div className="flex items-center space-x-2">
                      <Progress value={progress} className="w-16 h-2" />
                      <span className="text-xs text-gray-500">{progress}%</span>
                    </div>
                  )}
                  
                  {!uploading && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {files.length > 0 && !uploading && (
            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearFiles}
                disabled={disabled}
              >
                Clear All
              </Button>
              
              <div className="text-xs text-gray-500">
                Total: {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <div
          id={`${name}-error`}
          className="flex items-center space-x-2 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Success Message */}
      {files.length > 0 && !hasError && !uploading && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>
            {files.length} file{files.length !== 1 ? 's' : ''} ready for upload
          </span>
        </div>
      )}
    </div>
  );
}

export default FileUpload;