import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { formService } from '../services/FormService';
import { useAnalyticsMetrics } from '@/analytics';

// Enhanced validation rule interface with better type safety
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any, formData?: any) => string | null;
  // New: conditional validation based on other fields
  when?: (formData: any) => boolean;
  // New: debounced validation for expensive operations
  debounce?: number;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

// Enhanced form state with loading states and submission history
export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isValidating: boolean;
  submitCount: number;
  lastSubmissionTime: Date | undefined;
}

export interface UseFormValidationOptions<T> {
  initialData: T;
  validationRules: ValidationRules;
  onSubmit: (data: T) => Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  // New: transform data before validation and submission
  transformData?: (data: T) => T;
  // New: reset form after successful submission
  resetOnSuccess?: boolean;
  // New: prevent multiple rapid submissions
  preventDoubleSubmit?: boolean;
}

export interface UseFormValidationReturn<T> {
  formState: FormState<T>;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  validateField: (field: keyof T, value: any) => Promise<string | null>;
  validateForm: () => Promise<boolean>;
  getFieldProps: (field: keyof T) => {
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    error: string;
    touched: boolean;
  };
  getFieldError: (field: keyof T) => string | null;
  isFieldValid: (field: keyof T) => boolean;
  // New utility methods
  setFieldValue: (field: keyof T, value: any) => void;
  setMultipleValues: (values: Partial<T>) => void;
  clearForm: () => void;
  isDirty: boolean;
  canSubmit: boolean;
}

// Utility function to safely convert values to strings with null checks
function safeStringValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
}

// Utility function to check if a value is considered empty
function isEmpty(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim() === '';
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length === 0;
  }
  return false;
}

export function useFormValidation<T extends Record<string, any>>({
  initialData,
  validationRules,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
  transformData,
  resetOnSuccess = false,
  preventDoubleSubmit = true,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  // Core state management with proper initialization
  const [data, setData] = useState<T>(() => ({ ...initialData }));
  const [errors, setErrors] = useState<Record<keyof T, string>>(() => 
    Object.keys(initialData).reduce((acc, key) => {
      acc[key as keyof T] = '';
      return acc;
    }, {} as Record<keyof T, string>)
  );
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>(() =>
    Object.keys(initialData).reduce((acc, key) => {
      acc[key as keyof T] = false;
      return acc;
    }, {} as Record<keyof T, boolean>)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<Date>();

  // Refs for managing async operations and preventing memory leaks
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const validationAbortControllers = useRef<Record<string, AbortController>>({});
  const initialDataRef = useRef<T>(initialData);

  // Update initial data ref when it changes
  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  // Enhanced validation function with async support and better error handling
  const validateField = useCallback(async (field: keyof T, value: any): Promise<string | null> => {
    const fieldKey = field as string;
    const rule = validationRules[fieldKey];
    
    if (!rule) return null;

    // Check conditional validation
    if (rule.when && !rule.when(data)) {
      return null;
    }

    // Required validation with type-safe empty checking
    if (rule.required && isEmpty(value)) {
      return 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (isEmpty(value)) {
      return null;
    }

    // Convert to string safely for string-based validations
    const stringValue = safeStringValue(value);

    // String-specific validations
    if (typeof value === 'string' || stringValue) {
      const valueToCheck = typeof value === 'string' ? value : stringValue;

      // Min length validation
      if (rule.minLength !== undefined && valueToCheck.length < rule.minLength) {
        return `Must be at least ${rule.minLength} characters`;
      }

      // Max length validation
      if (rule.maxLength !== undefined && valueToCheck.length > rule.maxLength) {
        return `Must be no more than ${rule.maxLength} characters`;
      }

      // Pattern validation with safe regex testing
      if (rule.pattern) {
        try {
          if (!rule.pattern.test(valueToCheck)) {
            return 'Invalid format';
          }
        } catch (regexError) {
          console.warn(`Regex validation error for field ${fieldKey}:`, regexError);
          return 'Validation error occurred';
        }
      }
    }

    // Custom validation with error handling
    if (rule.custom) {
      try {
        const customResult = rule.custom(value, data);
        return customResult;
      } catch (customError) {
        console.error(`Custom validation error for field ${fieldKey}:`, customError);
        return 'Validation error occurred';
      }
    }

    return null;
  }, [validationRules, data]);

  // Debounced validation for expensive operations
  const validateFieldDebounced = useCallback(async (field: keyof T, value: any): Promise<void> => {
    const fieldKey = field as string;
    const rule = validationRules[fieldKey];
    
    if (!rule || !rule.debounce) {
      const error = await validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || '' }));
      return;
    }

    // Cancel previous timer
    if (debounceTimers.current[fieldKey]) {
      clearTimeout(debounceTimers.current[fieldKey]);
    }

    // Set new timer
    debounceTimers.current[fieldKey] = setTimeout(async () => {
      const error = await validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || '' }));
    }, rule.debounce);
  }, [validateField, validationRules]);

  // Enhanced form validation with async support
  const validateForm = useCallback(async (): Promise<boolean> => {
    setIsValidating(true);
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>;
    let isValid = true;

    try {
      // Use Promise.all for concurrent validation
      const validationPromises = Object.keys(data).map(async (field) => {
        const fieldKey = field as keyof T;
        const error = await validateField(fieldKey, data[fieldKey]);
        return { field: fieldKey, error };
      });

      const validationResults = await Promise.all(validationPromises);

      validationResults.forEach(({ field, error }) => {
        if (error) {
          newErrors[field] = error;
          isValid = false;
        } else {
          newErrors[field] = '';
        }
      });

      setErrors(newErrors);
      return isValid;
    } catch (validationError) {
      console.error('Form validation error:', validationError);
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [data, validateField]);

  // Enhanced setValue with type safety and optional validation
  const setValue = useCallback((field: keyof T, value: any) => {
    // Type-safe value setting
    const safeValue = value === undefined ? null : value;
    
    setData(prev => ({ 
      ...prev, 
      [field]: safeValue 
    }));

    // Clear error when user starts typing (UX improvement)
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Validate on change if enabled
    if (validateOnChange) {
      validateFieldDebounced(field, safeValue);
    }
  }, [validateOnChange, validateFieldDebounced, errors]);

  // Utility method for setting multiple values at once
  const setMultipleValues = useCallback((values: Partial<T>) => {
    setData(prev => ({ ...prev, ...values }));
    
    // Clear errors for updated fields
    const updatedFields = Object.keys(values);
    if (updatedFields.length > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        updatedFields.forEach(field => {
          newErrors[field as keyof T] = '';
        });
        return newErrors;
      });
    }

    // Validate if enabled
    if (validateOnChange) {
      Object.entries(values).forEach(([field, value]) => {
        validateFieldDebounced(field as keyof T, value);
      });
    }
  }, [validateOnChange, validateFieldDebounced]);

  // Type-safe error management
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: safeStringValue(error) }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  // Enhanced touched state management
  const setTouched = useCallback((field: keyof T, touchedValue = true) => {
    setTouchedState(prev => ({ ...prev, [field]: Boolean(touchedValue) }));
  }, []);

  // Enhanced form submission with comprehensive error handling
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    // Prevent double submission if enabled
    if (preventDoubleSubmit && isSubmitting) {
      return;
    }

    // Check for rapid successive submissions
    if (lastSubmissionTime && preventDoubleSubmit) {
      const timeSinceLastSubmission = Date.now() - lastSubmissionTime.getTime();
      if (timeSinceLastSubmission < 1000) { // 1 second cooldown
        return;
      }
    }

    setIsSubmitting(true);
    const submissionTime = new Date();
    setLastSubmissionTime(submissionTime);

    try {
      // Mark all fields as touched for validation display
      const allTouched = Object.keys(data).reduce((acc, field) => {
        acc[field as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);
      setTouchedState(allTouched);

      // Validate form
      const isValid = await validateForm();
      if (!isValid) {
        return;
      }

      // Transform data if transformer provided
      const submissionData = transformData ? transformData({ ...data }) : { ...data };

      // Submit form with proper error handling
      await onSubmit(submissionData);
      
      // Increment success counter
      setSubmitCount(prev => prev + 1);

      // Reset form if configured to do so
      if (resetOnSuccess) {
        handleReset();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Re-throw error to allow parent components to handle it
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    data, 
    validateForm, 
    onSubmit, 
    transformData, 
    resetOnSuccess, 
    preventDoubleSubmit, 
    isSubmitting, 
    lastSubmissionTime
  ]);

  // Enhanced reset functionality
  const handleReset = useCallback(() => {
    setData({ ...initialDataRef.current });
    setErrors(Object.keys(initialDataRef.current).reduce((acc, key) => {
      acc[key as keyof T] = '';
      return acc;
    }, {} as Record<keyof T, string>));
    setTouchedState(Object.keys(initialDataRef.current).reduce((acc, key) => {
      acc[key as keyof T] = false;
      return acc;
    }, {} as Record<keyof T, boolean>));
    setIsSubmitting(false);
    setIsValidating(false);
  }, []);

  // Clear form (reset to empty values rather than initial values)
  const clearForm = useCallback(() => {
    // Create empty data while preserving the original structure and types
    const emptyData = Object.keys(data).reduce((acc, key) => {
      const fieldKey = key as keyof T;
      // Use type-safe empty value assignment based on original data type
      const originalValue = initialDataRef.current[fieldKey];
      if (typeof originalValue === 'boolean') {
        (acc as any)[fieldKey] = false;
      } else if (typeof originalValue === 'number') {
        (acc as any)[fieldKey] = 0;
      } else if (Array.isArray(originalValue)) {
        (acc as any)[fieldKey] = [];
      } else if (typeof originalValue === 'object' && originalValue !== null) {
        (acc as any)[fieldKey] = {};
      } else {
        // Default to empty string for string types and others
        (acc as any)[fieldKey] = '';
      }
      return acc;
    }, {} as T);
    
    setData(emptyData);
    setErrors(Object.keys(data).reduce((acc, key) => {
      acc[key as keyof T] = '';
      return acc;
    }, {} as Record<keyof T, string>));
    setTouchedState(Object.keys(data).reduce((acc, key) => {
      acc[key as keyof T] = false;
      return acc;
    }, {} as Record<keyof T, boolean>));
  }, [data]);

  // Enhanced field props with better event handling
  const getFieldProps = useCallback((field: keyof T) => ({
    value: safeStringValue(data[field]),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : e.target.value;
      setValue(field, value);
    },
    onBlur: () => {
      setTouched(field, true);
      if (validateOnBlur) {
        validateFieldDebounced(field, data[field]);
      }
    },
    error: safeStringValue(errors[field]),
    touched: Boolean(touched[field]),
  }), [data, errors, touched, setValue, setTouched, validateOnBlur, validateFieldDebounced]);

  // Type-safe field error retrieval
  const getFieldError = useCallback((field: keyof T): string | null => {
    const fieldTouched = Boolean(touched[field]);
    const fieldError = safeStringValue(errors[field]);
    return (fieldTouched && fieldError) || null;
  }, [touched, errors]);

  // Enhanced field validation check
  const isFieldValid = useCallback((field: keyof T): boolean => {
    const fieldError = safeStringValue(errors[field]);
    const fieldTouched = Boolean(touched[field]);
    return !fieldError || !fieldTouched;
  }, [errors, touched]);

  // Computed properties for enhanced UX
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !safeStringValue(error));
  }, [errors]);

  const isDirty = useMemo(() => {
    return Object.keys(data).some(key => {
      const currentValue = safeStringValue(data[key as keyof T]);
      const initialValue = safeStringValue(initialDataRef.current[key as keyof T]);
      return currentValue !== initialValue;
    });
  }, [data]);

  const canSubmit = useMemo(() => {
    return isValid && !isSubmitting && !isValidating;
  }, [isValid, isSubmitting, isValidating]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(timer => {
        clearTimeout(timer);
      });
      Object.values(validationAbortControllers.current).forEach(controller => {
        controller.abort();
      });
    };
  }, []);

  const formState: FormState<T> = {
    data,
    errors,
    touched,
    isSubmitting,
    isValid,
    isValidating,
    submitCount,
    lastSubmissionTime,
  };

  return {
    formState,
    setValue,
    setError,
    clearError,
    setTouched,
    handleSubmit,
    handleReset,
    validateField,
    validateForm,
    getFieldProps,
    getFieldError,
    isFieldValid,
    // New utility methods
    setFieldValue: setValue, // Alias for consistency
    setMultipleValues,
    clearForm,
    isDirty,
    canSubmit,
  };
}

// Enhanced common validation rules with TypeScript safety
export const commonValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      const stringValue = safeStringValue(value);
      if (stringValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },
  phone: {
    pattern: /^(\+254|0)[17]\d{8}$/,
    custom: (value: string) => {
      const stringValue = safeStringValue(value);
      if (stringValue && !/^(\+254|0)[17]\d{8}$/.test(stringValue.replace(/\s/g, ''))) {
        return 'Please enter a valid Kenyan phone number';
      }
      return null;
    }
  },
  required: {
    required: true
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    custom: (value: string) => {
      const stringValue = safeStringValue(value);
      if (stringValue && !/^[a-zA-Z\s'-]+$/.test(stringValue)) {
        return 'Name can only contain letters, spaces, hyphens, and apostrophes';
      }
      return null;
    }
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 1000
  },
  rating: {
    required: true,
    custom: (value: any) => {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 1 || numValue > 5) {
        return 'Rating must be between 1 and 5';
      }
      return null;
    }
  },
  // New common validation rules
  url: {
    pattern: /^https?:\/\/.+/,
    custom: (value: string) => {
      const stringValue = safeStringValue(value);
      if (stringValue) {
        try {
          new URL(stringValue);
          return null;
        } catch {
          return 'Please enter a valid URL';
        }
      }
      return null;
    }
  },
  positiveNumber: {
    custom: (value: any) => {
      const numValue = Number(value);
      if (value && (isNaN(numValue) || numValue <= 0)) {
        return 'Must be a positive number';
      }
      return null;
    }
  },
  password: {
    required: true,
    minLength: 8,
    custom: (value: string) => {
      const stringValue = safeStringValue(value);
      if (stringValue && stringValue.length >= 8) {
        const hasUpper = /[A-Z]/.test(stringValue);
        const hasLower = /[a-z]/.test(stringValue);
        const hasNumber = /\d/.test(stringValue);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(stringValue);
        
        if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
          return 'Password must contain uppercase, lowercase, number, and special character';
        }
      }
      return null;
    }
  }
} as const;

export default useFormValidation;