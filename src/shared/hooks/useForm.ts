import { useState, useCallback, useEffect, useRef } from 'react';
import { FormManager, FormField, FormState, ValidationRule } from '../utils/form-validation';

export interface UseFormOptions {
  initialValues: Record<string, any>;
  validationRules?: Record<string, ValidationRule>;
  onSubmit?: (values: Record<string, any>) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  preventNavigationOnDirty?: boolean;
}

export interface UseFormReturn {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  
  // Field operations
  setValue: (field: string, value: any) => void;
  setTouched: (field: string, touched?: boolean) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  
  // Form operations
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  validate: () => boolean;
  
  // Field helpers
  getFieldProps: (field: string) => {
    name: string;
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    'aria-invalid': boolean;
    'aria-describedby': string | undefined;
  };
  
  getFieldError: (field: string) => string | undefined;
  hasFieldError: (field: string) => boolean;
}

export function useForm(options: UseFormOptions): UseFormReturn {
  const {
    initialValues,
    validationRules = {},
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true,
    preventNavigationOnDirty = true
  } = options;

  // Create form manager
  const formManagerRef = useRef<FormManager>();
  if (!formManagerRef.current) {
    const initialFields: Record<string, Omit<FormField, 'touched' | 'error'>> = {};
    Object.entries(initialValues).forEach(([name, value]) => {
      const rules = validationRules[name];
      initialFields[name] = {
        name,
        value,
        ...(rules && { rules })
      };
    });
    formManagerRef.current = new FormManager(initialFields);
  }

  const formManager = formManagerRef.current;

  // State from form manager
  const [formState, setFormState] = useState<FormState>(formManager.getState());

  // Subscribe to form manager updates
  useEffect(() => {
    const unsubscribe = formManager.subscribe(setFormState);
    return unsubscribe;
  }, [formManager]);

  // Prevent navigation on dirty form
  useEffect(() => {
    if (!preventNavigationOnDirty || !formState.isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formState.isDirty, preventNavigationOnDirty]);

  // Field operations
  const setValue = useCallback((field: string, value: any) => {
    formManager.setFieldValue(field, value);
  }, [formManager]);

  const setTouched = useCallback((field: string, touched: boolean = true) => {
    formManager.setFieldTouched(field, touched);
  }, [formManager]);

  const setError = useCallback((field: string, error: string) => {
    // Since FormManager doesn't have setError method, we'll handle this in state
    setFormState(prev => ({
      ...prev,
      errors: { ...prev.errors, [field]: error },
      isValid: Object.keys({ ...prev.errors, [field]: error }).length === 0
    }));
  }, []);

  const clearError = useCallback((field: string) => {
    setFormState(prev => {
      const newErrors = { ...prev.errors };
      delete newErrors[field];
      return {
        ...prev,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0
      };
    });
  }, []);

  // Form operations
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const isValid = formManager.validateAll();
    if (!isValid || !onSubmit) return;

    formManager.setSubmitting(true);
    
    try {
      const values = Object.fromEntries(
        Object.entries(formState.fields).map(([name, field]) => [name, field.value])
      );
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      // Handle submission error - could set form-level error here
    } finally {
      formManager.setSubmitting(false);
    }
  }, [formManager, formState.fields, onSubmit]);

  const handleReset = useCallback(() => {
    formManager.reset();
  }, [formManager]);

  const validate = useCallback(() => {
    return formManager.validateAll();
  }, [formManager]);

  // Field helpers
  const getFieldProps = useCallback((field: string) => {
    const fieldValue = formState.fields[field]?.value ?? '';
    
    return {
      name: field,
      value: fieldValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked
          : e.target.type === 'file'
          ? (e.target as HTMLInputElement).files?.[0] || null
          : e.target.value;
        
        setValue(field, value);
        
        if (validateOnChange) {
          // Validation happens automatically in setValue
        }
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (validateOnBlur) {
          setTouched(field, true);
        }
      },
      'aria-invalid': formManager.hasFieldError(field),
      'aria-describedby': formManager.hasFieldError(field) ? `${field}-error` : undefined
    };
  }, [formState.fields, setValue, setTouched, validateOnChange, validateOnBlur, formManager]);

  const getFieldError = useCallback((field: string) => {
    return formManager.getFieldError(field);
  }, [formManager]);

  const hasFieldError = useCallback((field: string) => {
    return formManager.hasFieldError(field);
  }, [formManager]);

  // Extract values for easier access
  const values = Object.fromEntries(
    Object.entries(formState.fields).map(([name, field]) => [name, field.value])
  );

  const touched = Object.fromEntries(
    Object.entries(formState.fields).map(([name, field]) => [name, field.touched || false])
  );

  return {
    values,
    errors: formState.errors,
    touched,
    isValid: formState.isValid,
    isSubmitting: formState.isSubmitting,
    isDirty: formState.isDirty,
    
    setValue,
    setTouched,
    setError,
    clearError,
    
    handleSubmit,
    handleReset,
    validate,
    
    getFieldProps,
    getFieldError,
    hasFieldError
  };
}

// Utility hook for file uploads
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
      const error = validateFile(file);
      if (error) {
        setError(error);
        onError?.(error);
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
      // Simulate progress
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
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
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