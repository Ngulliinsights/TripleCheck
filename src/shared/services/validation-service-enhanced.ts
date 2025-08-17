/**
 * Enhanced Validation Service
 * 
 * Comprehensive input validation, sanitization, and security hardening
 * for the African Property Trust platform.
 */

import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Types and Interfaces
export interface ValidationResult<T = any> {
  isValid: boolean;
  data: T | null;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripTags?: boolean;
  maxLength?: number;
}

export interface ValidationRule {
  field: string;
  validator: (value: any) => boolean | Promise<boolean>;
  message: string;
  async?: boolean;
}

// Custom Zod validators for Kenyan context
const kenyanPhoneRegex = /^\+254[0-9]{9}$/;
const kenyanIdRegex = /^[0-9]{8}$/;
const kenyanLandNumberRegex = /^[A-Z]{2,}\/[A-Z0-9]+\/[0-9]+$/;

// Enhanced validation schemas
const createPropertySchema = () => z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title cannot exceed 200 characters')
    .regex(/^[a-zA-Z0-9\s\-.,()]+$/, 'Title contains invalid characters'),
  
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  
  price: z.number()
    .positive('Price must be positive')
    .max(10000000000, 'Price exceeds maximum allowed value')
    .refine(val => val >= 10000, 'Minimum price is KES 10,000'),
  
  location: z.object({
    lat: z.number()
      .min(-4.7, 'Latitude must be within Kenya bounds')
      .max(5.5, 'Latitude must be within Kenya bounds'),
    lng: z.number()
      .min(33.9, 'Longitude must be within Kenya bounds')
      .max(41.9, 'Longitude must be within Kenya bounds'),
    address: z.string()
      .min(10, 'Address must be at least 10 characters')
      .max(500, 'Address cannot exceed 500 characters'),
    county: z.string()
      .min(2, 'County is required')
      .max(50, 'County name too long'),
    ward: z.string().optional(),
    postalCode: z.string()
      .regex(/^[0-9]{5}$/, 'Invalid Kenyan postal code')
      .optional()
  }),
  
  propertyType: z.enum(['residential', 'commercial', 'land', 'mixed-use']),
  
  features: z.object({
    bedrooms: z.number().min(0).max(20).optional(),
    bathrooms: z.number().min(0).max(20).optional(),
    area: z.number().positive('Area must be positive').optional(),
    parking: z.number().min(0).max(50).optional(),
    furnished: z.boolean().optional(),
    garden: z.boolean().optional(),
    security: z.boolean().optional(),
    waterSupply: z.enum(['borehole', 'municipal', 'well', 'none']).optional(),
    electricity: z.boolean().optional()
  }).optional(),
  
  images: z.array(z.string().url('Invalid image URL'))
    .max(20, 'Maximum 20 images allowed')
    .optional(),
  
  documents: z.array(z.object({
    type: z.enum(['title_deed', 'survey_plan', 'valuation', 'other']),
    url: z.string().url('Invalid document URL'),
    name: z.string().min(1).max(200)
  })).optional(),
  
  landDetails: z.object({
    landNumber: z.string()
      .regex(kenyanLandNumberRegex, 'Invalid Kenyan land reference number')
      .optional(),
    titleDeedNumber: z.string().min(5).max(50).optional(),
    surveyPlan: z.string().optional(),
    zoning: z.enum(['residential', 'commercial', 'agricultural', 'industrial', 'mixed']).optional()
  }).optional()
});

const createUserRegistrationSchema = () => z.object({
  email: z.string()
    .email('Invalid email address')
    .max(254, 'Email too long')
    .refine(email => !email.includes('+'), 'Email aliases not allowed'),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character'),
  
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name contains invalid characters'),
  
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name contains invalid characters'),
  
  phone: z.string()
    .regex(kenyanPhoneRegex, 'Invalid Kenyan phone number format (+254XXXXXXXXX)'),
  
  nationalId: z.string()
    .regex(kenyanIdRegex, 'Invalid Kenyan national ID number')
    .optional(),
  
  dateOfBirth: z.string()
    .datetime('Invalid date format')
    .refine(date => {
      const age = (Date.now() - new Date(date).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 18 && age <= 120;
    }, 'Must be between 18 and 120 years old')
    .optional(),
  
  occupation: z.string().max(100).optional(),
  
  termsAccepted: z.boolean()
    .refine(val => val === true, 'Terms and conditions must be accepted'),
  
  marketingConsent: z.boolean().optional()
});

const createLandVerificationSchema = () => z.object({
  propertyId: z.string().uuid('Invalid property ID'),
  
  landNumber: z.string()
    .regex(kenyanLandNumberRegex, 'Invalid land reference number format'),
  
  titleDeedNumber: z.string()
    .min(5, 'Title deed number too short')
    .max(50, 'Title deed number too long'),
  
  ownerName: z.string()
    .min(2, 'Owner name too short')
    .max(200, 'Owner name too long')
    .regex(/^[a-zA-Z\s\-'.,]+$/, 'Owner name contains invalid characters'),
  
  ownerNationalId: z.string()
    .regex(kenyanIdRegex, 'Invalid national ID format'),
  
  surveyPlan: z.string().optional(),
  
  coordinates: z.object({
    boundaries: z.array(z.object({
      lat: z.number(),
      lng: z.number()
    })).min(3, 'At least 3 boundary points required'),
    center: z.object({
      lat: z.number(),
      lng: z.number()
    })
  }).optional(),
  
  verificationDocuments: z.array(z.object({
    type: z.enum(['title_deed', 'survey_plan', 'id_copy', 'other']),
    url: z.string().url(),
    uploadedAt: z.string().datetime()
  })).min(1, 'At least one verification document required')
});

export class ValidationService {
  private schemas = new Map<string, z.ZodSchema>();
  private customRules = new Map<string, ValidationRule[]>();
  private sanitizationRules = new Map<string, SanitizationOptions>();

  constructor() {
    this.registerSchemas();
    this.registerCustomRules();
    this.registerSanitizationRules();
  }

  private registerSchemas(): void {
    this.schemas.set('property', createPropertySchema());
    this.schemas.set('user-registration', createUserRegistrationSchema());
    this.schemas.set('land-verification', createLandVerificationSchema());
    
    // Contact form schema
    this.schemas.set('contact', z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      phone: z.string().regex(kenyanPhoneRegex).optional(),
      subject: z.string().min(5).max(200),
      message: z.string().min(10).max(2000),
      category: z.enum(['general', 'support', 'sales', 'technical']).optional()
    }));

    // Review schema
    this.schemas.set('review', z.object({
      propertyId: z.string().uuid(),
      rating: z.number().min(1).max(5),
      title: z.string().min(5).max(100),
      comment: z.string().min(10).max(1000),
      wouldRecommend: z.boolean(),
      visitDate: z.string().datetime().optional()
    }));

    // Search schema
    this.schemas.set('search', z.object({
      query: z.string().max(200).optional(),
      location: z.string().max(100).optional(),
      propertyType: z.enum(['residential', 'commercial', 'land', 'mixed-use']).optional(),
      priceMin: z.number().min(0).optional(),
      priceMax: z.number().min(0).optional(),
      bedrooms: z.number().min(0).max(20).optional(),
      bathrooms: z.number().min(0).max(20).optional(),
      areaMin: z.number().min(0).optional(),
      areaMax: z.number().min(0).optional(),
      page: z.number().min(1).max(1000).default(1),
      limit: z.number().min(1).max(100).default(20),
      sortBy: z.enum(['price', 'date', 'area', 'relevance']).default('relevance'),
      sortOrder: z.enum(['asc', 'desc']).default('desc')
    }));
  }

  private registerCustomRules(): void {
    // Property-specific rules
    this.customRules.set('property', [
      {
        field: 'price',
        validator: (price: number) => {
          // Check if price is reasonable for Kenyan market
          return price >= 10000 && price <= 10000000000;
        },
        message: 'Price seems unrealistic for Kenyan property market'
      },
      {
        field: 'location.county',
        validator: async (county: string) => {
          // Validate against list of Kenyan counties
          const kenyanCounties = [
            'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
            'Malindi', 'Kitale', 'Garissa', 'Kakamega', 'Machakos', 'Meru',
            // ... add all 47 counties
          ];
          return kenyanCounties.some(c => 
            c.toLowerCase().includes(county.toLowerCase()) ||
            county.toLowerCase().includes(c.toLowerCase())
          );
        },
        message: 'Please specify a valid Kenyan county',
        async: true
      }
    ]);

    // User registration rules
    this.customRules.set('user-registration', [
      {
        field: 'email',
        validator: async (email: string) => {
          // Check against disposable email providers
          const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
          const domain = email.split('@')[1];
          return !disposableDomains.includes(domain);
        },
        message: 'Disposable email addresses are not allowed',
        async: true
      },
      {
        field: 'phone',
        validator: async (phone: string) => {
          // Validate Kenyan mobile network prefixes
          const validPrefixes = ['254701', '254702', '254703', '254704', '254705', '254706', '254707', '254708', '254709', '254710', '254711', '254712', '254713', '254714', '254715', '254716', '254717', '254718', '254719', '254720', '254721', '254722', '254723', '254724', '254725', '254726', '254727', '254728', '254729', '254730', '254731', '254732', '254733', '254734', '254735', '254736', '254737', '254738', '254739', '254740', '254741', '254742', '254743', '254744', '254745', '254746', '254747', '254748', '254749', '254750', '254751', '254752', '254753', '254754', '254755', '254756', '254757', '254758', '254759', '254760', '254761', '254762', '254763', '254764', '254765', '254766', '254767', '254768', '254769', '254770', '254771', '254772', '254773', '254774', '254775', '254776', '254777', '254778', '254779', '254780', '254781', '254782', '254783', '254784', '254785', '254786', '254787', '254788', '254789', '254790', '254791', '254792', '254793', '254794', '254795', '254796', '254797', '254798', '254799'];
          return validPrefixes.some(prefix => phone.startsWith(prefix));
        },
        message: 'Invalid Kenyan mobile number prefix',
        async: true
      }
    ]);
  }

  private registerSanitizationRules(): void {
    this.sanitizationRules.set('property', {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
      allowedAttributes: {},
      stripTags: true,
      maxLength: 2000
    });

    this.sanitizationRules.set('user-input', {
      allowedTags: [],
      stripTags: true,
      maxLength: 1000
    });

    this.sanitizationRules.set('review', {
      allowedTags: ['b', 'i', 'em', 'strong'],
      allowedAttributes: {},
      stripTags: true,
      maxLength: 1000
    });
  }

  /**
   * Validate data against a registered schema
   */
  async validate<T>(schemaName: string, data: unknown): Promise<ValidationResult<T>> {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw new Error(`Schema '${schemaName}' not found`);
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // First, run Zod validation
      const validatedData = schema.parse(data) as T;

      // Then run custom validation rules
      const customRules = this.customRules.get(schemaName) || [];
      for (const rule of customRules) {
        try {
          const fieldValue = this.getNestedValue(data, rule.field);
          const isValid = rule.async 
            ? await rule.validator(fieldValue)
            : rule.validator(fieldValue);

          if (!isValid) {
            errors.push({
              field: rule.field,
              message: rule.message,
              code: 'CUSTOM_VALIDATION_FAILED',
              severity: 'error'
            });
          }
        } catch (error) {
          console.warn(`Custom validation rule failed for ${rule.field}:`, error);
        }
      }

      return {
        isValid: errors.length === 0,
        data: errors.length === 0 ? validatedData : null,
        errors,
        warnings
      };

    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
          severity: 'error' as const
        }));

        return {
          isValid: false,
          data: null,
          errors: zodErrors,
          warnings
        };
      }
      throw error;
    }
  }

  /**
   * Sanitize input data
   */
  sanitizeInput(input: string, ruleName: string = 'user-input'): string {
    const rules = this.sanitizationRules.get(ruleName) || this.sanitizationRules.get('user-input')!;

    let sanitized = input;

    // Basic XSS prevention
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: rules.allowedTags || [],
      ALLOWED_ATTR: rules.allowedAttributes || {},
      STRIP_TAGS: rules.stripTags
    });

    // Remove potentially dangerous patterns
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '');

    // Trim and limit length
    sanitized = sanitized.trim();
    if (rules.maxLength && sanitized.length > rules.maxLength) {
      sanitized = sanitized.substring(0, rules.maxLength);
    }

    return sanitized;
  }

  /**
   * Sanitize object recursively
   */
  sanitizeObject(obj: any, ruleName: string = 'user-input'): any {
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj, ruleName);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, ruleName));
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value, ruleName);
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: File, allowedTypes: string[], maxSize: number): ValidationResult {
    const errors: ValidationError[] = [];

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push({
        field: 'file',
        message: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        code: 'INVALID_FILE_TYPE',
        severity: 'error'
      });
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        message: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
        code: 'FILE_TOO_LARGE',
        severity: 'error'
      });
    }

    // Check filename
    const dangerousPatterns = [/\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.php$/i, /\.asp$/i];
    if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
      errors.push({
        field: 'file',
        message: 'File type is potentially dangerous and not allowed',
        code: 'DANGEROUS_FILE_TYPE',
        severity: 'error'
      });
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? file : null,
      errors
    };
  }

  /**
   * Validate Kenyan-specific data
   */
  validateKenyanData(type: 'phone' | 'id' | 'landNumber', value: string): ValidationResult {
    const errors: ValidationError[] = [];

    switch (type) {
      case 'phone':
        if (!kenyanPhoneRegex.test(value)) {
          errors.push({
            field: 'phone',
            message: 'Invalid Kenyan phone number format. Use +254XXXXXXXXX',
            code: 'INVALID_PHONE_FORMAT',
            severity: 'error'
          });
        }
        break;

      case 'id':
        if (!kenyanIdRegex.test(value)) {
          errors.push({
            field: 'nationalId',
            message: 'Invalid Kenyan national ID format. Must be 8 digits',
            code: 'INVALID_ID_FORMAT',
            severity: 'error'
          });
        }
        break;

      case 'landNumber':
        if (!kenyanLandNumberRegex.test(value)) {
          errors.push({
            field: 'landNumber',
            message: 'Invalid land reference number format. Use format: COUNTY/BLOCK/NUMBER',
            code: 'INVALID_LAND_NUMBER_FORMAT',
            severity: 'error'
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      data: errors.length === 0 ? value : null,
      errors
    };
  }

  /**
   * Batch validation for multiple items
   */
  async validateBatch<T>(schemaName: string, items: unknown[]): Promise<ValidationResult<T[]>> {
    const results = await Promise.all(
      items.map(item => this.validate<T>(schemaName, item))
    );

    const validItems: T[] = [];
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    results.forEach((result, index) => {
      if (result.isValid && result.data) {
        validItems.push(result.data);
      }
      
      result.errors.forEach(error => {
        allErrors.push({
          ...error,
          field: `[${index}].${error.field}`
        });
      });

      if (result.warnings) {
        result.warnings.forEach(warning => {
          allWarnings.push({
            ...warning,
            field: `[${index}].${warning.field}`
          });
        });
      }
    });

    return {
      isValid: allErrors.length === 0,
      data: allErrors.length === 0 ? validItems : null,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Get nested object value by dot notation path
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Register custom validation rule
   */
  addCustomRule(schemaName: string, rule: ValidationRule): void {
    const existing = this.customRules.get(schemaName) || [];
    existing.push(rule);
    this.customRules.set(schemaName, existing);
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): any {
    return {
      registeredSchemas: Array.from(this.schemas.keys()),
      customRules: Array.from(this.customRules.entries()).map(([schema, rules]) => ({
        schema,
        ruleCount: rules.length
      })),
      sanitizationRules: Array.from(this.sanitizationRules.keys())
    };
  }
}

// Export singleton instance
export const validationService = new ValidationService();

// Export commonly used validation functions
export const validateProperty = (data: unknown) => 
  validationService.validate('property', data);

export const validateUserRegistration = (data: unknown) => 
  validationService.validate('user-registration', data);

export const validateLandVerification = (data: unknown) => 
  validationService.validate('land-verification', data);

export const sanitizeUserInput = (input: string) => 
  validationService.sanitizeInput(input, 'user-input');

export const validateKenyanPhone = (phone: string) => 
  validationService.validateKenyanData('phone', phone);

export const validateKenyanId = (id: string) => 
  validationService.validateKenyanData('id', id);

export const validateLandNumber = (landNumber: string) => 
  validationService.validateKenyanData('landNumber', landNumber);