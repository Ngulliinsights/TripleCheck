import { FieldConfig, ValidationRule } from '../useFormValidation';

// Base validation rules that can be reused across forms
export const baseValidationRules = {
  // Text field rules
  required: (fieldName: string): ValidationRule<string> => ({
    required: `${fieldName} is required`,
  }),

  minLength: (min: number, fieldName: string): ValidationRule<string> => ({
    minLength: { 
      value: min, 
      message: `${fieldName} must be at least ${min} characters` 
    },
  }),

  maxLength: (max: number, fieldName: string): ValidationRule<string> => ({
    maxLength: { 
      value: max, 
      message: `${fieldName} must be no more than ${max} characters` 
    },
  }),

  // Name validation
  namePattern: (fieldName: string): ValidationRule<string> => ({
    pattern: {
      value: /^[a-zA-Z\s]+$/,
      message: `${fieldName} can only contain letters and spaces`,
    },
  }),

  // Email validation
  email: (): ValidationRule<string> => ({
    email: 'Please enter a valid email address',
  }),

  // Phone validation (Kenyan format)
  kenyanPhone: (): ValidationRule<string> => ({
    pattern: {
      value: /^(\+254|0)[17]\d{8}$/,
      message: 'Please enter a valid Kenyan phone number',
    },
  }),

  // Number validation
  numberRange: (min: number, max: number, fieldName: string): ValidationRule<number> => ({
    min: { value: min, message: `${fieldName} must be at least ${min}` },
    max: { value: max, message: `${fieldName} must be no more than ${max}` },
  }),

  // Price validation
  priceValidation: (): ValidationRule<string> => ({
    custom: (value) => {
      const numValue = Number(value);
      if (isNaN(numValue)) return 'Price must be a valid number';
      if (numValue < 1000) return 'Price must be at least KES 1,000';
      if (numValue > 1000000000) return 'Price must be reasonable';
      return true;
    },
  }),

  // Password complexity
  passwordComplexity: (): ValidationRule<string> => ({
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
  }),

  // Password confirmation
  passwordConfirmation: (): ValidationRule<string> => ({
    custom: (confirmPassword, formData) => {
      return confirmPassword === formData?.password || 'Passwords do not match';
    },
  }),

  // Terms agreement
  termsAgreement: (): ValidationRule<boolean> => ({
    custom: (agreed) => agreed || 'You must agree to the terms and conditions',
  }),

  // Property type validation
  propertyType: (): ValidationRule<string> => ({
    custom: (value) => {
      const validTypes = ['apartment', 'house', 'condo', 'townhouse', 'land', 'commercial'];
      return validTypes.includes(value) || 'Please select a valid property type';
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