import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, X, File, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Progress } from '../ui/progress'
import { cn } from '../../utils/cn'
import { formatFileSize } from '../../utils/generic-formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileUploadFieldProps {
  label: string;
  name: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // bytes
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

type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

interface FileWithProgress {
  /** Stable key derived from file identity to keep state in sync with `value`. */
  key: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Derive a stable key for a File so progress state can be matched correctly. */
function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

/** Build an `aria-describedby` string from optional ID fragments. */
function ariaDescribedBy(...ids: Array<string | false | undefined>): string | undefined {
  const joined = ids.filter(Boolean).join(' ');
  return joined || undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  name,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10 MB
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
  const [isUploading, setIsUploading] = useState(false);
  // Keyed by fileKey() so state stays consistent when `value` is updated externally.
  const [progressMap, setProgressMap] = useState<Record<string, FileWithProgress>>({});

  const hasError = touched && !!error;
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;
  const helpId  = `${fieldId}-help`;

  // ---------------------------------------------------------------------------
  // Sync: drop orphaned progress entries when `value` shrinks externally.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const currentKeys = new Set(value.map(fileKey));
    setProgressMap(prev => {
      const next: Record<string, FileWithProgress> = {};
      for (const k of Object.keys(prev)) {
        if (currentKeys.has(k)) next[k] = prev[k];
      }
      return next;
    });
  }, [value]);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return `File size must be less than ${Math.round(maxSize / 1024 / 1024)} MB`;
      }
      return null;
    },
    [maxSize],
  );

  // ---------------------------------------------------------------------------
  // File handling
  // ---------------------------------------------------------------------------
  const processFiles = useCallback(
    (incoming: FileList | File[]) => {
      const fileArray = Array.from(incoming);
      const validFiles: File[] = [];

      for (const file of fileArray) {
        const err = validateFile(file);
        if (!err) validFiles.push(file);
        // Silently skip invalid files; errors are surfaced via the `error` prop
        // passed from the parent form's validation layer.
      }

      const combined = multiple ? [...value, ...validFiles] : validFiles;
      if (combined.length > maxFiles) return; // Reject the whole batch if it exceeds the cap.

      if (validFiles.length === 0) return;

      onChange(combined);

      if (showProgress) {
        setProgressMap(prev => {
          const next = { ...prev };
          for (const file of validFiles) {
            const k = fileKey(file);
            next[k] = { key: k, progress: 0, status: 'pending' };
          }
          return next;
        });
      }
    },
    [value, onChange, multiple, maxFiles, validateFile, showProgress],
  );

  // ---------------------------------------------------------------------------
  // Drag & drop
  // ---------------------------------------------------------------------------
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;
      const files = e.dataTransfer.files;
      if (files?.length) processFiles(files);
    },
    [disabled, processFiles],
  );

  // ---------------------------------------------------------------------------
  // Input change
  // ---------------------------------------------------------------------------
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.length) processFiles(files);
      // Reset so the same file can be reselected.
      e.target.value = '';
    },
    [processFiles],
  );

  // ---------------------------------------------------------------------------
  // Remove a single file
  // ---------------------------------------------------------------------------
  const removeFile = useCallback(
    (index: number) => {
      const removed = value[index];
      onChange(value.filter((_, i) => i !== index));
      if (removed && showProgress) {
        setProgressMap(prev => {
          const next = { ...prev };
          delete next[fileKey(removed)];
          return next;
        });
      }
    },
    [value, onChange, showProgress],
  );

  // ---------------------------------------------------------------------------
  // Upload
  // ---------------------------------------------------------------------------
  const handleUpload = useCallback(async () => {
    if (!onUpload || value.length === 0) return;

    setIsUploading(true);

    if (showProgress) {
      setProgressMap(prev => {
        const next = { ...prev };
        for (const file of value) {
          const k = fileKey(file);
          next[k] = { ...next[k], key: k, status: 'uploading', progress: 0 };
        }
        return next;
      });

      // Simulate incremental progress until the real upload completes.
      const interval = setInterval(() => {
        setProgressMap(prev => {
          const next = { ...prev };
          for (const k of Object.keys(next)) {
            if (next[k].status === 'uploading' && next[k].progress < 90) {
              next[k] = { ...next[k], progress: next[k].progress + 10 };
            }
          }
          return next;
        });
      }, 150);

      try {
        await onUpload(value);
        clearInterval(interval);
        setProgressMap(prev => {
          const next = { ...prev };
          for (const k of Object.keys(next)) {
            next[k] = { ...next[k], status: 'success', progress: 100 };
          }
          return next;
        });
      } catch (err) {
        clearInterval(interval);
        const message = err instanceof Error ? err.message : 'Upload failed';
        setProgressMap(prev => {
          const next = { ...prev };
          for (const k of Object.keys(next)) {
            next[k] = { ...next[k], status: 'error', error: message };
          }
          return next;
        });
      } finally {
        setIsUploading(false);
      }
    } else {
      try {
        await onUpload(value);
      } catch {
        // Error handling delegated to the caller.
      } finally {
        setIsUploading(false);
      }
    }
  }, [onUpload, value, showProgress]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className={cn('space-y-2', className)}>
      <Label
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium leading-none',
          hasError && 'text-red-600',
          disabled && 'opacity-50',
        )}
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
      </Label>

      {/* Drop zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          dragActive               && 'border-primary bg-primary/5',
          hasError                 && 'border-red-500',
          disabled                 && 'opacity-50 cursor-not-allowed',
          !disabled                && 'hover:border-primary/50 cursor-pointer',
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
          aria-describedby={ariaDescribedBy(
            hasError && errorId,
            helpText && helpId,
          )}
        />

        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {accept    && `Accepted: ${accept}`}
            {maxSize   && ` • Max ${Math.round(maxSize / 1024 / 1024)} MB`}
            {multiple  && ` • Up to ${maxFiles} files`}
          </div>
        </div>
      </div>

      {/* File list */}
      {value.length > 0 && (
        <ul className="space-y-2" aria-label="Selected files">
          {value.map((file, index) => {
            const k    = fileKey(file);
            const meta = progressMap[k];
            const status   = meta?.status   ?? 'pending';
            const progress = meta?.progress ?? 0;

            return (
              <li
                key={k}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                    {showProgress && status === 'uploading' && (
                      <Progress value={progress} className="mt-1 h-1" />
                    )}
                    {meta?.error && (
                      <p className="text-xs text-red-600 mt-1">{meta.error}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {status === 'uploading' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" aria-label="Uploading" />
                  )}
                  {status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-500" aria-label="Upload complete" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-500" aria-label="Upload failed" />
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={disabled || isUploading}
                    className="h-6 w-6 p-0"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
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
              <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" aria-hidden="true" />
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
          <AlertCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
};

export default FileUploadField;