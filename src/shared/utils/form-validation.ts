/**
 * Comprehensive form validation utilities
 * Provides validation functions, error handling, and form state management
 * Optimized for exactOptionalPropertyTypes and strict TypeScript compliance
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
 */
export const validators = {
  required: (value: unknown): string | null => {
    return isEmpty(value) ? "This field is required" : null;
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

    // More comprehensive email regex that handles edge cases better
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return emailRegex.test(value) ? null : "Please enter a valid email address";
  },

  phone: (value: unknown): string | null => {
    if (!isNonEmptyString(value)) {
      return null; // Let required validator handle empty values
    }

    // Remove all whitespace and common separators for validation
    const cleanedValue = value.replace(/[\s\-()]/g, "");
    const kenyanPhoneRegex = /^(\+254|0)[17]\d{8}$/;

    return kenyanPhoneRegex.test(cleanedValue) ? null : (
        "Please enter a valid Kenyan phone number"
      );
  },

  url: (value: unknown): string | null => {
    if (!isNonEmptyString(value)) {
      return null; // Let required validator handle empty values
    }

    try {
      // Check if we're in a browser environment where URL constructor is available
      if (typeof globalThis !== "undefined" && globalThis.URL) {
        const url = new globalThis.URL(value);
        // Additional check to ensure it's http or https
        return ["http:", "https:"].includes(url.protocol) ? null : (
            "Please enter a valid HTTP or HTTPS URL"
          );
      }

      // Fallback URL validation using regex for environments without URL constructor
      const urlRegex =
        /^https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)?$/;
      return urlRegex.test(value) ? null : "Please enter a valid URL";
    } catch {
      return "Please enter a valid URL";
    }
  },

  numeric: (value: unknown): string | null => {
    if (!isNonEmptyString(value)) {
      return null; // Let required validator handle empty values
    }

    // More precise numeric validation that handles edge cases
    const numericRegex = /^-?\d+(\.\d+)?$/;

    return numericRegex.test(value) ? null : "Please enter a valid number";
  },

  min: (value: unknown, min: number): string | null => {
    // Handle both string numbers and actual numbers
    let numValue: number;

    if (isValidNumber(value)) {
      numValue = value;
    } else if (isNonEmptyString(value)) {
      numValue = parseFloat(value);
      if (!Number.isFinite(numValue)) {
        return "Please enter a valid number";
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
        return "Please enter a valid number";
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

    return pattern.test(value) ? null : "Please enter a valid format";
  },

  fileSize: (file: unknown, maxSize: number): string | null => {
    if (!isFile(file)) {
      return "Invalid file";
    }

    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      return `File size must be less than ${maxSizeMB}MB`;
    }

    return null;
  },

  fileType: (file: unknown, allowedTypes: readonly string[]): string | null => {
    if (!isFile(file)) {
      return "Invalid file";
    }

    return allowedTypes.includes(file.type) ? null : (
        `File type must be one of: ${allowedTypes.join(", ")}`
      );
  },
} as const;

/**
 * Validate a single field with comprehensive error handling
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

  // String-based validations
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

  // Numeric validations
  if (rules.min !== undefined) {
    const error = validators.min(value, rules.min);
    if (error) return error;
  }

  if (rules.max !== undefined) {
    const error = validators.max(value, rules.max);
    if (error) return error;
  }

  // File validations
  if (rules.fileSize !== undefined) {
    const error = validators.fileSize(value, rules.fileSize);
    if (error) return error;
  }

  if (rules.fileTypes) {
    const error = validators.fileType(value, rules.fileTypes);
    if (error) return error;
  }

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
 * This carefully handles optional properties according to exactOptionalPropertyTypes requirements
 */
function toExternalFormField(field: InternalFormField): FormField {
  // Start with required properties
  const result: FormField = {
    name: field.name,
    value: field.value,
  };

  // Only include optional properties if they have meaningful values
  // This avoids explicit undefined assignments which exactOptionalPropertyTypes rejects
  if (field.rules !== undefined) {
    (result as any).rules = field.rules;
  }

  if (field.touched) {
    (result as any).touched = field.touched;
  }

  if (field.error !== undefined) {
    (result as any).error = field.error;
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
 * Enhanced form state management with better encapsulation and type safety
 * Optimized for exactOptionalPropertyTypes compliance
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
   * Update a field's value with validation
   */
  setFieldValue(fieldName: string, value: unknown): void {
    const field = this.state.fields[fieldName];
    if (!field) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(`Field "${fieldName}" not found in form`);
      }
      return;
    }

    // Update field value and mark form as dirty
    this.state.fields[fieldName] = { ...field, value };
    this.state.isDirty = true;

    // Validate the field and notify listeners
    this.validateSingleField(fieldName);
    this.notify();
  }

  /**
   * Mark a field as touched with validation
   */
  setFieldTouched(fieldName: string, touched = true): void {
    const field = this.state.fields[fieldName];
    if (!field) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn(`Field "${fieldName}" not found in form`);
      }
      return;
    }

    // Update touched state
    this.state.fields[fieldName] = { ...field, touched };

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
   * Validate a single field and update state
   */
  private validateSingleField(fieldName: string): void {
    const field = this.state.fields[fieldName];
    if (!field) return;

    const error = validateField(field.value, field.rules);

    // Update field error state - explicitly set to undefined when no error
    this.state.fields[fieldName] = {
      ...field,
      error: error ?? undefined,
    };

    // Update global errors object
    if (error) {
      this.state.errors[fieldName] = error;
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
      const field = this.state.fields[fieldName];

      // Add explicit check to ensure field exists
      if (!field || field === undefined) {
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

      this.state.fields[fieldName] = resetField;
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
   * Get error for a specific field (only if touched)
   * Fixed with proper null checking
   */
  getFieldError(fieldName: string): string | undefined {
    const field = this.state.fields[fieldName];
    // Add explicit null check to prevent 'possibly undefined' error
    if (!field || field === undefined) {
      return undefined;
    }
    return field.touched ? field.error : undefined;
  }

  /**
   * Check if a field has an error (only if touched)
   * Fixed with proper null checking
   */
  hasFieldError(fieldName: string): boolean {
    const field = this.state.fields[fieldName];
    // Add explicit null check to prevent 'possibly undefined' error
    if (!field || field === undefined) {
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
