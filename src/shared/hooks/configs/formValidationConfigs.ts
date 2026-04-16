import { ValidationRule } from '../useFormValidation'

// Define FieldConfig interface
export interface FieldConfig<T = any> {
  initialValue: T;
  rules: ValidationRule;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  transform?: (value: any) => T;
  asyncValidator?: (value: T) => Promise<string | true>;
}

// Base validation rules that can be reused across forms
export const baseValidationRules = {
  // Text field rules
  required: (fieldName: string): ValidationRule => ({
    required: true,
    custom: (value: any) => !value ? `${fieldName} is required` : null,
  }),

  minLength: (min: number, fieldName: string): ValidationRule => ({
    minLength: min,
    custom: (value: any) => {
      const str = String(value || '');
      return str.length < min ? `${fieldName} must be at least ${min} characters` : null;
    },
  }),

  maxLength: (max: number, fieldName: string): ValidationRule => ({
    maxLength: max,
    custom: (value: any) => {
      const str = String(value || '');
      return str.length > max ? `${fieldName} must be no more than ${max} characters` : null;
    },
  }),

  // Name validation
  namePattern: (fieldName: string): ValidationRule => ({
    pattern: /^[a-zA-Z\s]+$/,
    custom: (value: any) => {
      const str = String(value || '');
      return !/^[a-zA-Z\s]+$/.test(str) ? `${fieldName} can only contain letters and spaces` : null;
    },
  }),

  // Email validation
  email: (): ValidationRule => ({
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: any) => {
      const str = String(value || '');
      return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str) ? 'Please enter a valid email address' : null;
    },
  }),

  // Phone validation (Kenyan format)
  kenyanPhone: (): ValidationRule => ({
    pattern: /^(\+254|0)[17]\d{8}$/,
    custom: (value: any) => {
      const str = String(value || '');
      return !/^(\+254|0)[17]\d{8}$/.test(str) ? 'Please enter a valid Kenyan phone number' : null;
    },
  }),

  // Number validation
  numberRange: (min: number, max: number, fieldName: string): ValidationRule => ({
    custom: (value: any) => {
      const num = Number(value);
      if (isNaN(num)) return `${fieldName} must be a number`;
      if (num < min) return `${fieldName} must be at least ${min}`;
      if (num > max) return `${fieldName} must be no more than ${max}`;
      return null;
    },
  }),

  // Price validation
  priceValidation: (): ValidationRule => ({
    custom: (value: any) => {
      const numValue = Number(value);
      if (isNaN(numValue)) return 'Price must be a valid number';
      if (numValue < 1000) return 'Price must be at least KES 1,000';
      if (numValue > 1000000000) return 'Price must be reasonable';
      return null;
    },
  }),

  // Password complexity
  passwordComplexity: (): ValidationRule => ({
    custom: (password: any) => {
      const str = String(password || '');
      const hasUpperCase = /[A-Z]/.test(str);
      const hasLowerCase = /[a-z]/.test(str);
      const hasNumbers = /\d/.test(str);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(str);
      
      if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
      if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
      if (!hasNumbers) return 'Password must contain at least one number';
      if (!hasSpecialChar) return 'Password must contain at least one special character';
      
      return null;
    },
  }),

  // Password confirmation
  passwordConfirmation: (): ValidationRule => ({
    custom: (confirmPassword: any, formData: any) => {
      return confirmPassword === formData?.password ? null : 'Passwords do not match';
    },
  }),

  // Terms agreement
  termsAgreement: (): ValidationRule => ({
    custom: (agreed: any) => agreed ? null : 'You must agree to the terms and conditions',
  }),

  // Property type validation
  propertyType: (): ValidationRule => ({
    custom: (value: any) => {
      const validTypes = ['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial'];
      return validTypes.includes(value) ? null : 'Please select a valid property type';
    },
  }),
};

// Async validators
export const asyncValidators = {
  emailAvailability: async (email: string): Promise<string | true> => {
    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.exists) {
        return 'This email is already registered';
      }
      
      return true;
    } catch (error) {
      return 'Unable to verify email availability';
    }
  },

  emailBlacklist: async (email: string): Promise<string | true> => {
    // Simulate email validation API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock validation - in real app, this would call your API
    if (email === 'test@blocked.com') {
      return 'This email is not allowed';
    }
    
    return true;
  },
};

// Property form configuration
export interface PropertyFormConfig {
  title: FieldConfig<string>;
  description: FieldConfig<string>;
  price: FieldConfig<string>;
  location: FieldConfig<string>;
  bedrooms: FieldConfig<number>;
  bathrooms: FieldConfig<number>;
  propertyType: FieldConfig<string>;
  contactEmail: FieldConfig<string>;
  contactPhone: FieldConfig<string>;
}

export const createPropertyFormConfig = (initialData?: Partial<any>): PropertyFormConfig => ({
  title: {
    initialValue: initialData?.title || '',
    rules: {
      ...baseValidationRules.required('Property title'),
      ...baseValidationRules.minLength(10, 'Title'),
      ...baseValidationRules.maxLength(100, 'Title'),
    },
    validateOnChange: true,
    debounceMs: 500,
  },
  description: {
    initialValue: initialData?.description || '',
    rules: {
      ...baseValidationRules.required('Property description'),
      ...baseValidationRules.minLength(50, 'Description'),
      ...baseValidationRules.maxLength(2000, 'Description'),
    },
    validateOnBlur: true,
  },
  price: {
    initialValue: initialData?.price || '',
    rules: {
      ...baseValidationRules.required('Price'),
      ...baseValidationRules.priceValidation(),
    },
    transform: (value) => Number(value) || 0,
    validateOnChange: true,
  },
  location: {
    initialValue: initialData?.location || '',
    rules: {
      ...baseValidationRules.required('Location'),
      ...baseValidationRules.minLength(5, 'Location'),
    },
    validateOnBlur: true,
  },
  bedrooms: {
    initialValue: initialData?.bedrooms || 1,
    rules: {
      ...baseValidationRules.required('Number of bedrooms'),
      ...baseValidationRules.numberRange(0, 20, 'Bedrooms'),
    },
    transform: (value) => Number(value) || 0,
  },
  bathrooms: {
    initialValue: initialData?.bathrooms || 1,
    rules: {
      ...baseValidationRules.required('Number of bathrooms'),
      ...baseValidationRules.numberRange(0, 20, 'Bathrooms'),
    },
    transform: (value) => Number(value) || 0,
  },
  propertyType: {
    initialValue: initialData?.propertyType || '',
    rules: {
      ...baseValidationRules.required('Property type'),
      ...baseValidationRules.propertyType(),
    },
  },
  contactEmail: {
    initialValue: initialData?.contactEmail || '',
    rules: {
      ...baseValidationRules.required('Contact email'),
      ...baseValidationRules.email(),
      asyncValidator: asyncValidators.emailBlacklist,
    },
    validateOnBlur: true,
    debounceMs: 1000,
  },
  contactPhone: {
    initialValue: initialData?.contactPhone || '',
    rules: {
      ...baseValidationRules.required('Contact phone'),
      ...baseValidationRules.kenyanPhone(),
    },
    validateOnBlur: true,
  },
});

// User registration form configuration
export interface UserRegistrationFormConfig {
  firstName: FieldConfig<string>;
  lastName: FieldConfig<string>;
  email: FieldConfig<string>;
  password: FieldConfig<string>;
  confirmPassword: FieldConfig<string>;
  phone: FieldConfig<string>;
  agreeToTerms: FieldConfig<boolean>;
}

export const createUserRegistrationFormConfig = (): UserRegistrationFormConfig => ({
  firstName: {
    initialValue: '',
    rules: {
      ...baseValidationRules.required('First name'),
      ...baseValidationRules.minLength(2, 'First name'),
      ...baseValidationRules.namePattern('First name'),
    },
    validateOnBlur: true,
  },
  lastName: {
    initialValue: '',
    rules: {
      ...baseValidationRules.required('Last name'),
      ...baseValidationRules.minLength(2, 'Last name'),
      ...baseValidationRules.namePattern('Last name'),
    },
    validateOnBlur: true,
  },
  email: {
    initialValue: '',
    rules: {
      ...baseValidationRules.required('Email'),
      ...baseValidationRules.email(),
      asyncValidator: asyncValidators.emailAvailability,
    },
    validateOnBlur: true,
    debounceMs: 1000,
  },
  password: {
    initialValue: '',
    rules: {
      ...baseValidationRules.required('Password'),
      ...baseValidationRules.minLength(8, 'Password'),
      ...baseValidationRules.passwordComplexity(),
    },
    validateOnChange: true,
    debounceMs: 500,
  },
  confirmPassword: {
    initialValue: '',
    rules: {
      ...baseValidationRules.required('Please confirm your password'),
      ...baseValidationRules.passwordConfirmation(),
    },
    validateOnChange: true,
    debounceMs: 300,
  },
  phone: {
    initialValue: '',
    rules: {
      ...baseValidationRules.required('Phone number'),
      ...baseValidationRules.kenyanPhone(),
    },
    validateOnBlur: true,
  },
  agreeToTerms: {
    initialValue: false,
    rules: {
      ...baseValidationRules.termsAgreement(),
    },
  },
});

// Additional form configurations for common use cases
export interface ContactFormConfig {
  name: FieldConfig<string>;
  email: FieldConfig<string>;
  subject: FieldConfig<string>;
  message: FieldConfig<string>;
}

export const createContactFormConfig = (): ContactFormConfig => ({
  name: {
    initialValue: '',
    rules: {
      ...baseValidationRules.required('Name'),
      ...baseValidationRules.minLength(2, 'Name'),
      ...baseValidationRules.namePattern('Name'),
    },
    validateOnBlur: true,
  },
  email: {
    initialValue: '',
    rules: {
      ...baseValidationRules.required('Email'),
      ...baseValidationRules.email(),
    },
    validateOnBlur: true,
  },
  subject: {
    initialValue: '',
    rules: {
      ...baseValidationRules.required('Subject'),
      ...baseValidationRules.minLength(5, 'Subject'),
      ...baseValidationRules.maxLength(100, 'Subject'),
    },
    validateOnBlur: true,
  },
  message: {
    initialValue: '',
    rules: {
      ...baseValidationRules.required('Message'),
      ...baseValidationRules.minLength(20, 'Message'),
      ...baseValidationRules.maxLength(1000, 'Message'),
    },
    validateOnBlur: true,
  },
});

// Profile update form configuration
export interface ProfileUpdateFormConfig {
  firstName: FieldConfig<string>;
  lastName: FieldConfig<string>;
  email: FieldConfig<string>;
  phone: FieldConfig<string>;
  bio: FieldConfig<string>;
}

export const createProfileUpdateFormConfig = (initialData?: Partial<any>): ProfileUpdateFormConfig => ({
  firstName: {
    initialValue: initialData?.firstName || '',
    rules: {
      ...baseValidationRules.required('First name'),
      ...baseValidationRules.minLength(2, 'First name'),
      ...baseValidationRules.namePattern('First name'),
    },
    validateOnBlur: true,
  },
  lastName: {
    initialValue: initialData?.lastName || '',
    rules: {
      ...baseValidationRules.required('Last name'),
      ...baseValidationRules.minLength(2, 'Last name'),
      ...baseValidationRules.namePattern('Last name'),
    },
    validateOnBlur: true,
  },
  email: {
    initialValue: initialData?.email || '',
    rules: {
      ...baseValidationRules.required('Email'),
      ...baseValidationRules.email(),
    },
    validateOnBlur: true,
  },
  phone: {
    initialValue: initialData?.phone || '',
    rules: {
      ...baseValidationRules.required('Phone number'),
      ...baseValidationRules.kenyanPhone(),
    },
    validateOnBlur: true,
  },
  bio: {
    initialValue: initialData?.bio || '',
    rules: {
      ...baseValidationRules.maxLength(500, 'Bio'),
    },
    validateOnBlur: true,
  },
});

// Export all configurations as a registry
export const formConfigs = {
  propertyForm: createPropertyFormConfig,
  userRegistration: createUserRegistrationFormConfig,
  contactForm: createContactFormConfig,
  profileUpdate: createProfileUpdateFormConfig,
} as const;

// Type for configuration keys
export type FormConfigKey = keyof typeof formConfigs;

// Helper function to get configuration by key
export function getFormConfig<T = any>(
  key: FormConfigKey,
  initialData?: Partial<T>
): any {
  const configFactory = formConfigs[key];
  return typeof configFactory === 'function' ? configFactory(initialData) : configFactory();
}

// Helper function to create a configured form validation hook
export function createConfiguredFormValidation<T = any>(
  configKey: FormConfigKey,
  initialData?: Partial<T>,
  overrides?: Partial<any>
) {
  const config = getFormConfig(configKey, initialData);
  return {
    ...config,
    ...overrides,
  };
}