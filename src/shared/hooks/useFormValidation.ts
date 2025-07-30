import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ValidationRule<T = any> {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  email?: boolean | string;
  url?: boolean | string;
  custom?: (value: T, formData: Record<string, any>) => string | boolean;
  asyncValidator?: (value: T, formData: Record<string, any>) => Promise<string | boolean>;
}

interface FieldConfig<T = any> {
  initialValue?: T;
  rules?: ValidationRule<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  transform?: (value: any) => T;
}

interface FormConfig {
  [fieldName: string]: FieldConfig;
}

interface FieldState {
  value: any;
  error: string | null;
  touched: boolean;
  validating: boolean;
  dirty: boolean;
}

interface UseFormValidationReturn {
  values: Record<string, any>;
  errors: Record<string, string | null>;
  touched: Record<string, boolean>;
  validating: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isValid: boolean;
  isValidating: boolean;
  isDirty: boolean;
  setValue: (field: string, value: any) => void;
  setValues: (values: Record<string, any>) => void;
  setError: (field: string, error: string | null) => void;
  setTouched: (field: string, touched?: boolean) => void;
  validateField: (field: string) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
  resetForm: () => void;
  resetField: (field: string) => void;
  handleChange: (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: string) => (event: React.FocusEvent) => void;
  handleSubmit: (onSubmit: (values: Record<string, any>) => void | Promise<void>) => (event: React.FormEvent) => Promise<void>;
}

/**
 * Comprehensive form validation hook with async validation, debouncing, and advanced rules
 * Essential for property listing forms, user registration, and complex multi-step forms
 */
export function useFormValidation(config: FormConfig): UseFormValidationReturn {
  const [fields, setFields] = useState<Record<string, FieldState>>(() => {
    const initialFields: Record<string, FieldState> = {};
    
    Object.entries(config).forEach(([fieldName, fieldConfig]) => {
      initialFields[fieldName] = {
        value: fieldConfig.initialValue ?? '',
        error: null,
        touched: false,
        validating: false,
        dirty: false,
      };
    });
    
    return initialFields;
  });

  const debounceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const asyncValidationControllers = useRef<Record<string, AbortController>>({});

  // Validation functions
  const validateValue = useCallback(async (
    fieldName: string,
    value: any,
    rules: ValidationRule,
    formData: Record<string, any>
  ): Promise<string | null> => {
    // Required validation
    if (rules.required) {
      const isEmpty = value === null || value === undefined || value === '' || 
                     (Array.isArray(value) && value.length === 0);
      
      if (isEmpty) {
        return typeof rules.required === 'string' ? rules.required : `${fieldName} is required`;
      }
    }

    // Skip other validations if value is empty and not required
    if (!value && !rules.required) {
      return null;
    }

    // String length validations
    if (typeof value === 'string') {
      if (rules.minLength) {
        const minLength = typeof rules.minLength === 'number' ? rules.minLength : rules.minLength.value;
        const message = typeof rules.minLength === 'object' ? rules.minLength.message : 
                       `${fieldName} must be at least ${minLength} characters`;
        
        if (value.length < minLength) {
          return message;
        }
      }

      if (rules.maxLength) {
        const maxLength = typeof rules.maxLength === 'number' ? rules.maxLength : rules.maxLength.value;
        const message = typeof rules.maxLength === 'object' ? rules.maxLength.message : 
                       `${fieldName} must be no more than ${maxLength} characters`;
        
        if (value.length > maxLength) {
          return message;
        }
      }
    }

    // Numeric validations
    if (typeof value === 'number') {
      if (rules.min !== undefined) {
        const min = typeof rules.min === 'number' ? rules.min : rules.min.value;
        const message = typeof rules.min === 'object' ? rules.min.message : 
                       `${fieldName} must be at least ${min}`;
        
        if (value < min) {
          return message;
        }
      }

      if (rules.max !== undefined) {
        const max = typeof rules.max === 'number' ? rules.max : rules.max.value;
        const message = typeof rules.max === 'object' ? rules.max.message : 
                       `${fieldName} must be no more than ${max}`;
        
        if (value > max) {
          return message;
        }
      }
    }

    // Pattern validation
    if (rules.pattern) {
      const pattern = typeof rules.pattern === 'object' && 'value' in rules.pattern ? 
                     rules.pattern.value : rules.pattern as RegExp;
      const message = typeof rules.pattern === 'object' && 'message' in rules.pattern ? 
                     rules.pattern.message : `${fieldName} format is invalid`;
      
      if (!pattern.test(String(value))) {
        return message;
      }
    }

    // Email validation
    if (rules.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const message = typeof rules.email === 'string' ? rules.email : 'Invalid email format';
      
      if (!emailPattern.test(String(value))) {
        return message;
      }
    }

    // URL validation
    if (rules.url) {
      try {
        new URL(String(value));
      } catch {
        const message = typeof rules.url === 'string' ? rules.url : 'Invalid URL format';
        return message;
      }
    }

    // Custom validation
    if (rules.custom) {
      const result = rules.custom(value, formData);
      if (typeof result === 'string') {
        return result;
      }
      if (result === false) {
        return `${fieldName} is invalid`;
      }
    }

    // Async validation
    if (rules.asyncValidator) {
      // Cancel previous async validation
      if (asyncValidationControllers.current[fieldName]) {
        asyncValidationControllers.current[fieldName].abort();
      }

      const controller = new AbortController();
      asyncValidationControllers.current[fieldName] = controller;

      try {
        const result = await rules.asyncValidator(value, formData);
        
        if (controller.signal.aborted) {
          return null; // Validation was cancelled
        }
        
        if (typeof result === 'string') {
          return result;
        }
        if (result === false) {
          return `${fieldName} is invalid`;
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          return 'Validation failed';
        }
      } finally {
        delete asyncValidationControllers.current[fieldName];
      }
    }

    return null;
  }, []);

  // Validate single field
  const validateField = useCallback(async (fieldName: string): Promise<boolean> => {
    const fieldConfig = config[fieldName];
    const fieldState = fields[fieldName];
    
    if (!fieldConfig || !fieldState) {
      return true;
    }

    setFields(prev => ({
      ...prev,
      [fieldName]: { 
        ...prev[fieldName], 
        validating: true,
        value: prev[fieldName]?.value ?? '',
        error: prev[fieldName]?.error ?? null,
        touched: prev[fieldName]?.touched ?? false,
        dirty: prev[fieldName]?.dirty ?? false
      },
    }));

    try {
      const formData = Object.fromEntries(
        Object.entries(fields).map(([key, field]) => [key, field.value])
      );

      const error = fieldConfig.rules ? 
        await validateValue(fieldName, fieldState.value, fieldConfig.rules, formData) : 
        null;

      setFields(prev => ({
        ...prev,
        [fieldName]: { 
          ...prev[fieldName], 
          error, 
          validating: false,
          value: prev[fieldName]?.value ?? '',
          touched: prev[fieldName]?.touched ?? false,
          dirty: prev[fieldName]?.dirty ?? false
        },
      }));

      return error === null;
    } catch (error) {
      setFields(prev => ({
        ...prev,
        [fieldName]: { 
          ...prev[fieldName], 
          error: 'Validation error', 
          validating: false,
          value: prev[fieldName]?.value ?? '',
          touched: prev[fieldName]?.touched ?? false,
          dirty: prev[fieldName]?.dirty ?? false
        },
      }));
      return false;
    }
  }, [config, fields, validateValue]);

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    const validationPromises = Object.keys(config).map(fieldName => validateField(fieldName));
    const results = await Promise.all(validationPromises);
    return results.every(Boolean);
  }, [config, validateField]);

  // Set field value
  const setValue = useCallback((fieldName: string, value: any) => {
    const fieldConfig = config[fieldName];
    const transformedValue = fieldConfig?.transform ? fieldConfig.transform(value) : value;

    setFields(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value: transformedValue,
        dirty: true,
        error: null, // Clear error when value changes
        touched: prev[fieldName]?.touched ?? false,
        validating: prev[fieldName]?.validating ?? false
      },
    }));

    // Validate on change if configured
    if (fieldConfig?.validateOnChange) {
      const debounceMs = fieldConfig.debounceMs ?? 300;
      
      if (debounceTimeouts.current[fieldName]) {
        clearTimeout(debounceTimeouts.current[fieldName]);
      }

      debounceTimeouts.current[fieldName] = setTimeout(() => {
        validateField(fieldName);
      }, debounceMs);
    }
  }, [config, validateField]);

  // Set multiple values
  const setValues = useCallback((values: Record<string, any>) => {
    Object.entries(values).forEach(([fieldName, value]) => {
      setValue(fieldName, value);
    });
  }, [setValue]);

  // Set field error
  const setError = useCallback((fieldName: string, error: string | null) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: { 
        ...prev[fieldName], 
        error,
        value: prev[fieldName]?.value ?? '',
        touched: prev[fieldName]?.touched ?? false,
        validating: prev[fieldName]?.validating ?? false,
        dirty: prev[fieldName]?.dirty ?? false
      },
    }));
  }, []);

  // Set field touched
  const setTouched = useCallback((fieldName: string, touched: boolean = true) => {
    setFields(prev => ({
      ...prev,
      [fieldName]: { 
        value: prev[fieldName]?.value || '',
        error: prev[fieldName]?.error || null,
        validating: prev[fieldName]?.validating || false,
        dirty: prev[fieldName]?.dirty || false,
        touched 
      },
    }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    const resetFields: Record<string, FieldState> = {};
    
    Object.entries(config).forEach(([fieldName, fieldConfig]) => {
      resetFields[fieldName] = {
        value: fieldConfig.initialValue ?? '',
        error: null,
        touched: false,
        validating: false,
        dirty: false,
      };
    });
    
    setFields(resetFields);
    
    // Clear debounce timeouts
    Object.values(debounceTimeouts.current).forEach(clearTimeout);
    debounceTimeouts.current = {};
  }, [config]);

  // Reset single field
  const resetField = useCallback((fieldName: string) => {
    const fieldConfig = config[fieldName];
    if (!fieldConfig) return;

    setFields(prev => ({
      ...prev,
      [fieldName]: {
        value: fieldConfig.initialValue ?? '',
        error: null,
        touched: false,
        validating: false,
        dirty: false,
      },
    }));

    if (debounceTimeouts.current[fieldName]) {
      clearTimeout(debounceTimeouts.current[fieldName]);
      delete debounceTimeouts.current[fieldName];
    }
  }, [config]);

  // Handle input change
  const handleChange = useCallback((fieldName: string) => {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { type, value, checked } = event.target as HTMLInputElement;
      const fieldValue = type === 'checkbox' ? checked : value;
      setValue(fieldName, fieldValue);
    };
  }, [setValue]);

  // Handle input blur
  const handleBlur = useCallback((fieldName: string) => {
    return (event: React.FocusEvent) => {
      setTouched(fieldName, true);
      
      const fieldConfig = config[fieldName];
      if (fieldConfig?.validateOnBlur) {
        validateField(fieldName);
      }
    };
  }, [config, setTouched, validateField]);

  // Handle form submit
  const handleSubmit = useCallback((onSubmit: (values: Record<string, any>) => void | Promise<void>) => {
    return async (event: React.FormEvent) => {
      event.preventDefault();
      
      // Mark all fields as touched
      Object.keys(config).forEach(fieldName => {
        setTouched(fieldName, true);
      });

      const isValid = await validateForm();
      
      if (isValid) {
        const values = Object.fromEntries(
          Object.entries(fields).map(([key, field]) => [key, field.value])
        );
        
        await onSubmit(values);
      }
    };
  }, [config, fields, setTouched, validateForm]);

  // Computed values
  const values = useMemo(() => {
    return Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.value])
    );
  }, [fields]);

  const errors = useMemo(() => {
    return Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.error])
    );
  }, [fields]);

  const touched = useMemo(() => {
    return Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.touched])
    );
  }, [fields]);

  const validating = useMemo(() => {
    return Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.validating])
    );
  }, [fields]);

  const dirty = useMemo(() => {
    return Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.dirty])
    );
  }, [fields]);

  const isValid = useMemo(() => {
    return Object.values(fields).every(field => field.error === null);
  }, [fields]);

  const isValidating = useMemo(() => {
    return Object.values(fields).some(field => field.validating);
  }, [fields]);

  const isDirty = useMemo(() => {
    return Object.values(fields).some(field => field.dirty);
  }, [fields]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimeouts.current).forEach(clearTimeout);
      Object.values(asyncValidationControllers.current).forEach(controller => {
        controller.abort();
      });
    };
  }, []);

  return {
    values,
    errors,
    touched,
    validating,
    dirty,
    isValid,
    isValidating,
    isDirty,
    setValue,
    setValues,
    setError,
    setTouched,
    validateField,
    validateForm,
    resetForm,
    resetField,
    handleChange,
    handleBlur,
    handleSubmit,
  };
}

/**
 * Property listing form validation
 */
export function usePropertyFormValidation(initialData?: Partial<any>) {
  return useFormValidation({
    title: {
      initialValue: initialData?.title || '',
      rules: {
        required: 'Property title is required',
        minLength: { value: 10, message: 'Title must be at least 10 characters' },
        maxLength: { value: 100, message: 'Title must be no more than 100 characters' },
      },
      validateOnChange: true,
      debounceMs: 500,
    },
    description: {
      initialValue: initialData?.description || '',
      rules: {
        required: 'Property description is required',
        minLength: { value: 50, message: 'Description must be at least 50 characters' },
        maxLength: { value: 2000, message: 'Description must be no more than 2000 characters' },
      },
      validateOnBlur: true,
    },
    price: {
      initialValue: initialData?.price || '',
      rules: {
        required: 'Price is required',
        min: { value: 1000, message: 'Price must be at least KES 1,000' },
        max: { value: 1000000000, message: 'Price must be reasonable' },
        custom: (value) => {
          const numValue = Number(value);
          if (isNaN(numValue)) return 'Price must be a valid number';
          return true;
        },
      },
      transform: (value) => Number(value) || 0,
      validateOnChange: true,
    },
    location: {
      initialValue: initialData?.location || '',
      rules: {
        required: 'Location is required',
        minLength: { value: 5, message: 'Location must be at least 5 characters' },
      },
      validateOnBlur: true,
    },
    bedrooms: {
      initialValue: initialData?.bedrooms || 1,
      rules: {
        required: 'Number of bedrooms is required',
        min: { value: 0, message: 'Bedrooms cannot be negative' },
        max: { value: 20, message: 'Maximum 20 bedrooms allowed' },
      },
      transform: (value) => Number(value) || 0,
    },
    bathrooms: {
      initialValue: initialData?.bathrooms || 1,
      rules: {
        required: 'Number of bathrooms is required',
        min: { value: 0, message: 'Bathrooms cannot be negative' },
        max: { value: 20, message: 'Maximum 20 bathrooms allowed' },
      },
      transform: (value) => Number(value) || 0,
    },
    propertyType: {
      initialValue: initialData?.propertyType || '',
      rules: {
        required: 'Property type is required',
        custom: (value) => {
          const validTypes = ['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial'];
          return validTypes.includes(value) || 'Please select a valid property type';
        },
      },
    },
    contactEmail: {
      initialValue: initialData?.contactEmail || '',
      rules: {
        required: 'Contact email is required',
        email: 'Please enter a valid email address',
        asyncValidator: async (email) => {
          // Simulate email validation API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Mock validation - in real app, this would call your API
          if (email === 'test@blocked.com') {
            return 'This email is not allowed';
          }
          
          return true;
        },
      },
      validateOnBlur: true,
      debounceMs: 1000,
    },
    contactPhone: {
      initialValue: initialData?.contactPhone || '',
      rules: {
        required: 'Contact phone is required',
        pattern: {
          value: /^(\+254|0)[17]\d{8}$/,
          message: 'Please enter a valid Kenyan phone number',
        },
      },
      validateOnBlur: true,
    },
  });
}

/**
 * User registration form validation
 */
export function useUserRegistrationValidation() {
  return useFormValidation({
    firstName: {
      initialValue: '',
      rules: {
        required: 'First name is required',
        minLength: { value: 2, message: 'First name must be at least 2 characters' },
        pattern: {
          value: /^[a-zA-Z\s]+$/,
          message: 'First name can only contain letters and spaces',
        },
      },
      validateOnBlur: true,
    },
    lastName: {
      initialValue: '',
      rules: {
        required: 'Last name is required',
        minLength: { value: 2, message: 'Last name must be at least 2 characters' },
        pattern: {
          value: /^[a-zA-Z\s]+$/,
          message: 'Last name can only contain letters and spaces',
        },
      },
      validateOnBlur: true,
    },
    email: {
      initialValue: '',
      rules: {
        required: 'Email is required',
        email: 'Please enter a valid email address',
        asyncValidator: async (email) => {
          const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
          const data = await response.json();
          
          if (data.exists) {
            return 'This email is already registered';
          }
          
          return true;
        },
      },
      validateOnBlur: true,
      debounceMs: 1000,
    },
    password: {
      initialValue: '',
      rules: {
        required: 'Password is required',
        minLength: { value: 8, message: 'Password must be at least 8 characters' },
        custom: (password) => {
          const hasUpperCase = /[A-Z]/.test(password);
          const hasLowerCase = /[a-z]/.test(password);
          const hasNumbers = /\d/.test(password);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
          
          if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
          if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
          if (!hasNumbers) return 'Password must contain at least one number';
          if (!hasSpecialChar) return 'Password must contain at least one special character';
          
          return true;
        },
      },
      validateOnChange: true,
      debounceMs: 500,
    },
    confirmPassword: {
      initialValue: '',
      rules: {
        required: 'Please confirm your password',
        custom: (confirmPassword, formData) => {
          return confirmPassword === formData.password || 'Passwords do not match';
        },
      },
      validateOnChange: true,
      debounceMs: 300,
    },
    phone: {
      initialValue: '',
      rules: {
        required: 'Phone number is required',
        pattern: {
          value: /^(\+254|0)[17]\d{8}$/,
          message: 'Please enter a valid Kenyan phone number',
        },
      },
      validateOnBlur: true,
    },
    agreeToTerms: {
      initialValue: false,
      rules: {
        custom: (agreed) => agreed || 'You must agree to the terms and conditions',
      },
    },
  });
}