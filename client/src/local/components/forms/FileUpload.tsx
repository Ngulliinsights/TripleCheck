import { Upload, X, FileText, Image, AlertCircle, CheckCircle } from 'lucide-react'
import React, { useRef, useState, useCallback } from 'react'

import { useFileUpload } from '../../hooks/useFileUpload'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { formatFileSize } from '../../utils/generic-formatters'

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

/** Derive a human-readable format hint from an `accept` string. */
function formatAcceptHint(accept: string): string {
  const hints: string[] = [];
  if (accept.includes('image')) hints.push('Images');
  if (accept.includes('pdf'))   hints.push('PDF');
  // Surface any explicit extensions (e.g. ".docx") not covered above
  const extensions = accept
    .split(',')
    .map(s => s.trim())
    .filter(s => s.startsWith('.'))
    .map(s => s.toUpperCase());
  hints.push(...extensions);
  return hints.join(', ');
}

export function FileUpload({
  name,
  label = 'Upload Files',
  accept = 'image/*,application/pdf',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10 MB
  maxFiles = 5,
  disabled = false,
  error,
  touched = false,
  onFilesChange,
  onError,
  className,
  required = false,
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
    clearFiles,
  } = useFileUpload({
    maxSize,
    allowedTypes: accept.split(',').map(t => t.trim()),
    multiple,
    onError: (err: string) => onError?.(err),
  });

  // Notify parent whenever the file list changes.
  React.useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
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
    if (!disabled) handleDrop(e);
  }, [disabled, handleDrop]);

  const openFileDialog = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  const getFileIcon = (file: File) =>
    file.type.startsWith('image/')
      ? <Image className="w-4 h-4 shrink-0" />
      : <FileText className="w-4 h-4 shrink-0" />;

  const hasError = touched && !!(error || uploadError);
  const errorMessage = error || uploadError;
  const atCapacity = multiple && files.length >= maxFiles;
  const errorId = `${name}-error`;
  const acceptHint = formatAcceptHint(accept);

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label
          htmlFor={name}
          className={cn(
            'block text-sm font-medium',
            required && "after:content-['*'] after:ml-0.5 after:text-red-500",
          )}
        >
          {label}
        </label>
      )}

      {/* Drop Zone */}
      <div
        role="region"
        aria-label="File drop zone"
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive && !disabled  && 'border-primary bg-primary/5',
          !dragActive && !disabled && 'border-gray-300 hover:border-gray-400',
          disabled                 && 'border-gray-200 bg-gray-50 cursor-not-allowed',
          hasError                 && 'border-red-300 bg-red-50',
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDropWithState}
      >
        {/* Visually hidden but focusable input; the Button below triggers it */}
        <input
          ref={fileInputRef}
          id={name}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          disabled={disabled || atCapacity}
          onChange={handleFileSelect}
          className="sr-only"
          aria-describedby={hasError ? errorId : undefined}
        />

        <div className="text-center">
          <Upload
            className={cn(
              'mx-auto h-12 w-12 mb-4',
              disabled ? 'text-gray-400' : 'text-gray-500',
            )}
            aria-hidden="true"
          />

          <div className="space-y-2">
            <p className={cn('text-sm', disabled ? 'text-gray-400' : 'text-gray-600')}>
              {dragActive ? 'Drop files here' : 'Drag and drop files here, or'}
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              disabled={disabled || atCapacity}
            >
              Browse Files
            </Button>
          </div>

          <div className={cn('mt-2 text-xs', disabled ? 'text-gray-400' : 'text-gray-500')}>
            {acceptHint && <p>{acceptHint} — up to {formatFileSize(maxSize)} each</p>}
            {multiple && (
              <p>
                {files.length}/{maxFiles} files selected
              </p>
            )}
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Selected Files ({files.length}{multiple ? `/${maxFiles}` : ''})
          </h4>

          <ul className="space-y-2" aria-label="Selected files">
            {files.map((file: File, index: number) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {uploading ? (
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="w-16 h-2" />
                      <span className="text-xs text-gray-500">{progress}%</span>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {!uploading && (
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
              <span className="text-xs text-gray-500">
                Total: {formatFileSize(files.reduce((sum: number, f: File) => sum + f.size, 0))}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <p
          id={errorId}
          className="flex items-center gap-2 text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {errorMessage}
        </p>
      )}

      {/* Success Message */}
      {files.length > 0 && !hasError && !uploading && (
        <p className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {files.length} file{files.length !== 1 ? 's' : ''} ready for upload
        </p>
      )}
    </div>
  );
}

export default FileUpload;