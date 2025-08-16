import { useState, useCallback, useMemo } from 'react';
import { formService } from '../services/FormService';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface UseFormValidationOptions<T> {
  initialData: T;
  validationRules: ValidationRules;
  onSubmit: (data: T) => Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormValidationReturn<T> {
  formState: FormState<T>;
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  validateField: (field: keyof T, value: any) => string | null;
  validateForm: () => boolean;
  getFieldProps: (field: keyof T) => {
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    error: string;
    touched: boolean;
  };
  getFieldError: (field: keyof T) => string | null;
  isFieldValid: (field: keyof T) => boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  initialData,
  validationRules,
  onSubmit,
  validateOnChange = false,
  validateOnBlur = true,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation function for a single field
  const validateField = useCallback((field: keyof T, value: any): string | null => {
    const rule = validationRules[field as string];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // String-specific validations
    if (typeof value === 'string') {
      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        return `Must be at least ${rule.minLength} characters`;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        return `Must be no more than ${rule.maxLength} characters`;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return 'Invalid format';
      }
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }, [validationRules]);

  // Validate entire form
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<keyof T, string> = {} as Record<keyof T, string>;
    let isValid = true;

    Object.keys(data).forEach((field) => {
      const error = validateField(field as keyof T, data[field as keyof T]);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [data, validateField]);

  // Set field value
  const setValue = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));

    // Validate on change if enabled
    if (validateOnChange) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error || ''
      }));
    }
  }, [validateField, validateOnChange]);

  // Set field error
  const setError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // Clear field error
  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  // Set field touched state
  const setTouched = useCallback((field: keyof T, touchedValue = true) => {
    setTouchedState(prev => ({ ...prev, [field]: touchedValue }));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);

    try {
      // Mark all fields as touched
      const allTouched = Object.keys(data).reduce((acc, field) => {
        acc[field as keyof T] = true;
        return acc;
      }, {} as Record<keyof T, boolean>);
      setTouchedState(allTouched);

      // Validate form
      const isValid = validateForm();
      if (!isValid) {
        return;
      }

      // Submit form
      await onSubmit(data);
    } catch (error) {
      // Error handling is done in the onSubmit function
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, validateForm, onSubmit]);

  // Reset form
  const handleReset = useCallback(() => {
    setData(initialData);
    setErrors({} as Record<keyof T, string>);
    setTouchedState({} as Record<keyof T, boolean>);
    setIsSubmitting(false);
  }, [initialData]);

  // Get field props for easy integration with form inputs
  const getFieldProps = useCallback((field: keyof T) => ({
    value: data[field] || '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValue(field, e.target.value);
    },
    onBlur: () => {
      setTouched(field, true);
      if (validateOnBlur) {
        const error = validateField(field, data[field]);
        setErrors(prev => ({
          ...prev,
          [field]: error || ''
        }));
      }
    },
    error: errors[field] || '',
    touched: touched[field] || false,
  }), [data, errors, touched, setValue, setTouched, validateField, validateOnBlur]);

  // Get field error
  const getFieldError = useCallback((field: keyof T): string | null => {
    return (touched[field] && errors[field]) || null;
  }, [touched, errors]);

  // Check if field is valid
  const isFieldValid = useCallback((field: keyof T): boolean => {
    return !errors[field] || !touched[field];
  }, [errors, touched]);

  // Calculate overall form validity
  const isValid = useMemo(() => {
    return Object.values(errors).every(error => !error);
  }, [errors]);

  const formState: FormState<T> = {
    data,
    errors,
    touched,
    isSubmitting,
    isValid,
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
  };
}

// Common validation rules
export const commonValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },
  phone: {
    pattern: /^(\+254|0)[17]\d{8}$/,
    custom: (value: string) => {
      if (value && !/^(\+254|0)[17]\d{8}$/.test(value.replace(/\s/g, ''))) {
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
    maxLength: 50
  },
  message: {
    required: true,
    minLength: 10,
    maxLength: 1000
  },
  rating: {
    required: true,
    custom: (value: number) => {
      if (value < 1 || value > 5) {
        return 'Rating must be between 1 and 5';
      }
      return null;
    }
  }
};

export default useFormValidation;