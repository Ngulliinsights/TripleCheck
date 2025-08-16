/**
 * Comprehensive form validation utilities
 * Provides validation functions, error handling, and form state management
 * Optimized for exactOptionalPropertyTypes and strict TypeScript compliance
 * Addresses ESLint security and complexity concerns
 */

// Type definitions with improved specificity and exactOptionalPropertyTypes compatibility
export interface ValidationRule {
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly custom?: (value: unknown, allValues?: unknown) => string | null;
  readonly email?: boolean;
  readonly phone?: boolean;
  readonly url?: boolean;
  readonly numeric?: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly fileSize?: number; // in bytes
  readonly fileTypes?: readonly string[];
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly type: string;
}

// Internal form field - removed readonly from rules to allow modification
interface InternalFormField {
  readonly name: string;
  value: unknown;
  rules: ValidationRule | undefined; // Removed readonly to allow assignment
  touched: boolean;
  error: string | undefined;
}

// External API uses clean optional properties
export interface FormField {
  readonly name: string;
  value: unknown;
  readonly rules?: ValidationRule;
  touched?: boolean;
  error?: string;
}

// Separate interfaces for internal state (mutable) and external API (readonly)
interface InternalFormState {
  fields: Record<string, InternalFormField>;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  touchedFields: Set<string>;
}

export interface FormState {
  readonly fields: Record<string, FormField>;
  readonly errors: Record<string, string>;
  readonly isValid: boolean;
  readonly isSubmitting: boolean;
  readonly isDirty: boolean;
  readonly touchedFields: ReadonlySet<string>;
}

// Constants to avoid string duplication and improve maintainability
const ERROR_MESSAGES = {
  INVALID_NUMBER: "Please enter a valid number",
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_PHONE: "Please enter a valid Kenyan phone number",
  INVALID_URL: "Please enter a valid URL",
  INVALID_HTTP_URL: "Please enter a valid HTTP or HTTPS URL",
  INVALID_FORMAT: "Please enter a valid format",
  INVALID_FILE: "Invalid file",
  REQUIRED: "This field is required",
} as const;

// Pre-compiled safe regex patterns to avoid security issues
const REGEX_PATTERNS = {
  // Simplified, safe email validation - prevents catastrophic backtracking
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Safe Kenyan phone pattern without complex quantifiers
  KENYAN_PHONE: /^(\+254|0)[17]\d{8}$/,
  // Simplified URL pattern that's safe and readable
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  // Simple numeric pattern
  NUMERIC: /^-?\d+(\.\d+)?$/,
  // Safe pattern for removing phone separators
  PHONE_SEPARATORS: /[\s\-()]/g,
} as const;

/**
 * Type guard to check if a value is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/**
 * Type guard to check if a value is a valid number
 */
function isValidNumber(value: unknown): value is number {
  return (
    typeof value === "number" && !Number.isNaN(value) && Number.isFinite(value)
  );
}

/**
 * Type guard to check if a value is a File instance
 */
function isFile(value: unknown): value is File {
  return value instanceof File;
}

/**
 * Check if a value is considered empty for validation purposes
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined || value === "") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "string") {
    return value.trim() === "";
  }

  return false;
}

/**
 * Enhanced validation functions with better type safety and error handling
 * Refactored to reduce complexity and improve security
 */
export const validators = {
  required: (value: unknown): string | null => {
    return isEmpty(value) ? ERROR_MESSAGES.REQUIRED : null;
  },

  minLength: (value: unknown, min: number): string | null => {
    if (!isNonEmptyString(value)) {
      return null; // Let required validator handle empty values
    }

    return value.length < min ?
        `Must be at least ${min} characters long`
      : null;
  },

  maxLength: (value: unknown, max: number): string | null => {
    if (!isNonEmptyString(value)) {
      return null; // Let required validator handle empty values
    }

    return value.length > max ?
        `Must be no more than ${max} characters long`
      : null;
  },

  email: (value: unknown): string | null => {
    if (!isNonEmptyString(value)) {
      return null; // Let required validator handle empty values
    }

    // Using simplified, safe regex pattern
    return REGEX_PATTERNS.EMAIL.test(value) ? null : ERROR_MESSAGES.INVALID_EMAIL;
  },

  phone: (value: unknown): string | null => {
    if (!isNonEmptyString(value)) {
      return null; // Let required validator handle empty values
    }

    // Remove separators using safe regex
    const cleanedValue = value.replace(REGEX_PATTERNS.PHONE_SEPARATORS, "");
    
    return REGEX_PATTERNS.KENYAN_PHONE.test(cleanedValue) ? null : ERROR_MESSAGES.INVALID_PHONE;
  },

  url: (value: unknown): string | null => {
    if (!isNonEmptyString(value)) {
      return null; // Let required validator handle empty values
    }

    try {
      // Use optional chaining instead of explicit checks
      if (typeof globalThis?.URL !== "undefined") {
        const url = new globalThis.URL(value);
        // Additional check to ensure it's http or https
        return ["http:", "https:"].includes(url.protocol) ? null : ERROR_MESSAGES.INVALID_HTTP_URL;
      }

      // Fallback URL validation using safe regex
      return REGEX_PATTERNS.URL.test(value) ? null : ERROR_MESSAGES.INVALID_URL;
    } catch {
      return ERROR_MESSAGES.INVALID_URL;
    }
  },

  numeric: (value: unknown): string | null => {
    if (!isNonEmptyString(value)) {
      return null; // Let required validator handle empty values
    }

    // Using safe numeric regex pattern
    return REGEX_PATTERNS.NUMERIC.test(value) ? null : ERROR_MESSAGES.INVALID_NUMBER;
  },

  min: (value: unknown, min: number): string | null => {
    // Handle both string numbers and actual numbers
    let numValue: number;

    if (isValidNumber(value)) {
      numValue = value;
    } else if (isNonEmptyString(value)) {
      numValue = parseFloat(value);
      if (!Number.isFinite(numValue)) {
        return ERROR_MESSAGES.INVALID_NUMBER;
      }
    } else {
      return null; // Let required validator handle empty values
    }

    return numValue < min ? `Value must be at least ${min}` : null;
  },

  max: (value: unknown, max: number): string | null => {
    // Handle both string numbers and actual numbers
    let numValue: number;

    if (isValidNumber(value)) {
      numValue = value;
    } else if (isNonEmptyString(value)) {
      numValue = parseFloat(value);
      if (!Number.isFinite(numValue)) {
        return ERROR_MESSAGES.INVALID_NUMBER;
      }
    } else {
      return null; // Let required validator handle empty values
    }

    return numValue > max ? `Value must be no more than ${max}` : null;
  },

  pattern: (value: unknown, pattern: RegExp): string | null => {
    if (!isNonEmptyString(value)) {
      return null; // Let required validator handle empty values
    }

    return pattern.test(value) ? null : ERROR_MESSAGES.INVALID_FORMAT;
  },

  fileSize: (file: unknown, maxSize: number): string | null => {
    if (!isFile(file)) {
      return ERROR_MESSAGES.INVALID_FILE;
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  },

  fileType: (file: unknown, allowedTypes: readonly string[]): string | null => {
    if (!isFile(file)) {
      return ERROR_MESSAGES.INVALID_FILE;
    }

    return allowedTypes.includes(file.type) ? null : (
        `File type must be one of: ${allowedTypes.join(", ")}`
      );
  },
} as const;

/**
 * Individual validation functions to reduce cognitive complexity
 * Each handles a specific validation rule type
 */
const validateStringRules = (value: unknown, rules: ValidationRule): string | null => {
  if (rules.minLength !== undefined) {
    const error = validators.minLength(value, rules.minLength);
    if (error) return error;
  }

  if (rules.maxLength !== undefined) {
    const error = validators.maxLength(value, rules.maxLength);
    if (error) return error;
  }

  if (rules.email) {
    const error = validators.email(value);
    if (error) return error;
  }

  if (rules.phone) {
    const error = validators.phone(value);
    if (error) return error;
  }

  if (rules.url) {
    const error = validators.url(value);
    if (error) return error;
  }

  if (rules.numeric) {
    const error = validators.numeric(value);
    if (error) return error;
  }

  if (rules.pattern) {
    const error = validators.pattern(value, rules.pattern);
    if (error) return error;
  }

  return null;
};

const validateNumericRules = (value: unknown, rules: ValidationRule): string | null => {
  if (rules.min !== undefined) {
    const error = validators.min(value, rules.min);
    if (error) return error;
  }

  if (rules.max !== undefined) {
    const error = validators.max(value, rules.max);
    if (error) return error;
  }

  return null;
};

const validateFileRules = (value: unknown, rules: ValidationRule): string | null => {
  if (rules.fileSize !== undefined) {
    const error = validators.fileSize(value, rules.fileSize);
    if (error) return error;
  }

  if (rules.fileTypes) {
    const error = validators.fileType(value, rules.fileTypes);
    if (error) return error;
  }

  return null;
};

/**
 * Validate a single field with comprehensive error handling
 * Refactored to reduce cognitive complexity by delegating to smaller functions
 */
export function validateField(
  value: unknown,
  rules: ValidationRule = {}
): string | null {
  // Required validation always comes first
  if (rules.required) {
    const requiredError = validators.required(value);
    if (requiredError) {
      return requiredError;
    }
  }

  // Skip other validations if value is empty and not required
  if (isEmpty(value)) {
    return null;
  }

  // Delegate to specialized validation functions
  const stringError = validateStringRules(value, rules);
  if (stringError) return stringError;

  const numericError = validateNumericRules(value, rules);
  if (numericError) return numericError;

  const fileError = validateFileRules(value, rules);
  if (fileError) return fileError;

  // Custom validation always runs last
  if (rules.custom) {
    const error = rules.custom(value);
    if (error) return error;
  }

  return null;
}

/**
 * Helper function to convert external FormField to internal representation
 * This handles the type conversion necessary for exactOptionalPropertyTypes compliance
 */
function toInternalFormField(
  field: Omit<FormField, "touched" | "error">
): InternalFormField {
  return {
    name: field.name,
    value: field.value,
    rules: field.rules ?? undefined, // Convert optional to explicit undefined
    touched: false,
    error: undefined,
  };
}

/**
 * Helper function to convert internal FormField to external representation
 * Using proper type assertion instead of any
 */
function toExternalFormField(field: InternalFormField): FormField {
  // Start with required properties
  const result: FormField = {
    name: field.name,
    value: field.value,
  };

  // Only include optional properties if they have meaningful values
  // Using type assertion with proper typing instead of any
  if (field.rules !== undefined) {
    (result as FormField & { rules: ValidationRule }).rules = field.rules;
  }

  if (field.touched) {
    (result as FormField & { touched: boolean }).touched = field.touched;
  }

  if (field.error !== undefined) {
    (result as FormField & { error: string }).error = field.error;
  }

  return result;
}

/**
 * Validate entire form with detailed error reporting
 */
export function validateForm(fields: Record<string, FormField>): {
  readonly errors: Record<string, string>;
  readonly isValid: boolean;
} {
  const errors: Record<string, string> = {};

  // Use Object.entries for better performance and readability
  for (const [fieldName, field] of Object.entries(fields)) {
    const error = validateField(field.value, field.rules);
    if (error) {
      errors[fieldName] = error;
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
  } as const;
}

/**
 * Sanitize input to prevent XSS attacks with comprehensive character escaping
 */
export function sanitizeInput(input: unknown): string {
  if (typeof input !== "string") {
    return String(input ?? "");
  }

  // Create a map for better performance with frequent sanitization
  const escapeMap: Record<string, string> = {
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "&": "&amp;", // Handle ampersands to prevent double-escaping
  };

  return input.replace(/[<>"'/&]/g, (char) => escapeMap[char] || char);
}

/**
 * Format error messages for display with better label generation
 */
export function formatErrorMessage(error: string, fieldName: string): string {
  // Convert camelCase and snake_case to readable labels
  const fieldLabel = fieldName
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Handle camelCase
    .replace(/[_-]/g, " ") // Handle snake_case and kebab-case
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter

  return error.replace(/this field/gi, fieldLabel);
}

/**
 * Generic debounce function with proper TypeScript typing
 */
export function debounce<TArgs extends readonly unknown[]>(
  func: (...args: TArgs) => void,
  wait: number
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: TArgs): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      func(...args);
    }, wait);
  };
}

/**
 * Safe field access helper to avoid object injection warnings
 * Provides type-safe access to form fields
 */
function safeFieldAccess<T>(
  obj: Record<string, T>, 
  key: string
): T | undefined {
  // Validate key is a string and exists in object
  if (typeof key === "string" && Object.prototype.hasOwnProperty.call(obj, key)) {
    return obj[key];
  }
  return undefined;
}

/**
 * Safe field assignment helper to avoid object injection warnings
 */
function safeFieldAssignment<T>(
  obj: Record<string, T>,
  key: string,
  value: T
): void {
  if (typeof key === "string") {
    obj[key] = value;
  }
}

/**
 * Enhanced form state management with better encapsulation and type safety
 * Optimized for exactOptionalPropertyTypes compliance and security
 */
export class FormManager {
  private state: InternalFormState;
  private readonly listeners = new Set<(state: FormState) => void>();

  constructor(
    initialFields: Record<string, Omit<FormField, "touched" | "error">>
  ) {
    // Create initial state using helper function for proper type conversion
    this.state = {
      fields: Object.fromEntries(
        Object.entries(initialFields).map(([name, field]) => [
          name,
          toInternalFormField(field),
        ])
      ),
      errors: {},
      isValid: true,
      isSubmitting: false,
      isDirty: false,
      touchedFields: new Set<string>(),
    };
  }

  /**
   * Subscribe to state changes with automatic cleanup
   */
  subscribe(listener: (state: FormState) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all subscribers of state changes
   */
  private notify(): void {
    // Create a readonly copy for external consumption with proper type conversion
    const stateCopy: FormState = {
      fields: Object.fromEntries(
        Object.entries(this.state.fields).map(([name, field]) => [
          name,
          toExternalFormField(field),
        ])
      ),
      errors: { ...this.state.errors },
      isValid: this.state.isValid,
      isSubmitting: this.state.isSubmitting,
      isDirty: this.state.isDirty,
      touchedFields: new Set(this.state.touchedFields) as ReadonlySet<string>,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(stateCopy);
      } catch (error) {
        // Only log errors in development environment
        if (process.env.NODE_ENV === "development") {
          // eslint-disable-next-line no-console
          console.error("Error in form state listener:", error);
        }
      }
    });
  }

  /**
   * Get current form state (read-only copy)
   */
  getState(): FormState {
    return {
      fields: Object.fromEntries(
        Object.entries(this.state.fields).map(([name, field]) => [
          name,
          toExternalFormField(field),
        ])
      ),
      errors: { ...this.state.errors },
      isValid: this.state.isValid,
      isSubmitting: this.state.isSubmitting,
      isDirty: this.state.isDirty,
      touchedFields: new Set(this.state.touchedFields) as ReadonlySet<string>,
    };
  }

  /**
   * Update a field's value with validation - using safe field access
   */
  setFieldValue(fieldName: string, value: unknown): void {
    const field = safeFieldAccess(this.state.fields, fieldName);
    if (!field) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(`Field "${fieldName}" not found in form`);
      }
      return;
    }

    // Update field value and mark form as dirty using safe assignment
    safeFieldAssignment(this.state.fields, fieldName, { ...field, value });
    this.state.isDirty = true;

    // Validate the field and notify listeners
    this.validateSingleField(fieldName);
    this.notify();
  }

  /**
   * Mark a field as touched with validation - using safe field access
   */
  setFieldTouched(fieldName: string, touched = true): void {
    const field = safeFieldAccess(this.state.fields, fieldName);
    if (!field) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(`Field "${fieldName}" not found in form`);
      }
      return;
    }

    // Update touched state using safe assignment
    safeFieldAssignment(this.state.fields, fieldName, { ...field, touched });

    if (touched) {
      this.state.touchedFields.add(fieldName);
    } else {
      this.state.touchedFields.delete(fieldName);
    }

    // Validate the field and notify listeners
    this.validateSingleField(fieldName);
    this.notify();
  }

  /**
   * Validate a single field and update state - using safe field access
   */
  private validateSingleField(fieldName: string): void {
    const field = safeFieldAccess(this.state.fields, fieldName);
    if (!field) return;

    const error = validateField(field.value, field.rules);

    // Update field error state - explicitly set to undefined when no error
    safeFieldAssignment(this.state.fields, fieldName, {
      ...field,
      error: error ?? undefined,
    });

    // Update global errors object using safe methods
    if (error) {
      safeFieldAssignment(this.state.errors, fieldName, error);
    } else {
      delete this.state.errors[fieldName];
    }

    // Update global validation state
    this.state.isValid = Object.keys(this.state.errors).length === 0;
  }

  /**
   * Validate all fields and return validation result
   */
  validateAll(): boolean {
    // Mark all fields as touched
    Object.keys(this.state.fields).forEach((fieldName) => {
      this.setFieldTouched(fieldName, true);
    });

    // Perform comprehensive validation using external field format
    const externalFields = Object.fromEntries(
      Object.entries(this.state.fields).map(([name, field]) => [
        name,
        toExternalFormField(field),
      ])
    );

    const { errors, isValid } = validateForm(externalFields);

    // Update state with validation results
    this.state.errors = { ...errors };
    this.state.isValid = isValid;

    this.notify();
    return isValid;
  }

  /**
   * Set form submission state
   */
  setSubmitting(isSubmitting: boolean): void {
    this.state.isSubmitting = isSubmitting;
    this.notify();
  }

  /**
   * Reset form to initial state
   * This method carefully reconstructs each field to comply with exactOptionalPropertyTypes
   */
  reset(): void {
    // Reset all field values and states using proper type-safe reconstruction
    Object.keys(this.state.fields).forEach((fieldName) => {
      const field = safeFieldAccess(this.state.fields, fieldName);

      // Add explicit check to ensure field exists
      if (!field) {
        return;
      }

      // Create a new field object that properly handles optional properties
      const resetField: InternalFormField = {
        name: field.name,
        value: "",
        rules: field.rules, // Preserve the original rules (could be undefined)
        touched: false,
        error: undefined,
      };

      safeFieldAssignment(this.state.fields, fieldName, resetField);
    });

    // Reset global state
    this.state.errors = {};
    this.state.isValid = true;
    this.state.isSubmitting = false;
    this.state.isDirty = false;
    this.state.touchedFields.clear();

    this.notify();
  }

  /**
   * Get error for a specific field (only if touched) - using safe field access
   */
  getFieldError(fieldName: string): string | undefined {
    const field = safeFieldAccess(this.state.fields, fieldName);
    if (!field) {
      return undefined;
    }
    return field.touched ? field.error : undefined;
  }

  /**
   * Check if a field has an error (only if touched) - using safe field access
   */
  hasFieldError(fieldName: string): boolean {
    const field = safeFieldAccess(this.state.fields, fieldName);
    if (!field) {
      return false;
    }
    return field.touched && Boolean(field.error);
  }

  /**
   * Get all field names in the form
   */
  getFieldNames(): readonly string[] {
    return Object.keys(this.state.fields);
  }

  /**
   * Check if form has any errors
   */
  hasErrors(): boolean {
    return Object.keys(this.state.errors).length > 0;
  }

  /**
   * Get count of validation errors
   */
  getErrorCount(): number {
    return Object.keys(this.state.errors).length;
  }
}