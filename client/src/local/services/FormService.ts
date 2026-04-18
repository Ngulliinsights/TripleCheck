/**
 * Form Service — Centralised form submission and validation
 *
 * Handles all form submissions with typed errors, unified fetch logic,
 * optional toast feedback, and composable validation rules.
 */

import { toast } from '../hooks/use-toast';

// ─── Analytics shim ───────────────────────────────────────────────────────────
// Keeps gtag calls opt-in and SSR-safe without polluting call sites.

type GtagEvent = {
  event_category: string;
  event_label: string;
  [key: string]: unknown;
};

function trackEvent(name: string, payload: GtagEvent): void {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', name, payload);
  }
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class FormSubmissionError extends Error {
  constructor(
    message: string,
    public readonly errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'FormSubmissionError';
  }
}

// ─── Form data types ──────────────────────────────────────────────────────────

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  inquiryType: 'general' | 'support' | 'partnership' | 'media';
}

export interface SalesInquiryData {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  useCase: string;
  monthlyVolume: string;
  timeline: string;
  additionalInfo?: string;
}

export interface VerificationRequestData {
  propertyAddress: string;
  ownerName: string;
  ownerPhone?: string;
  ownerEmail?: string;
  documentType: string;
  additionalInfo?: string;
}

export interface ReviewSubmissionData {
  rating: number;
  comment: string;
  propertyId?: string;
  reviewType: 'property' | 'service' | 'agent';
}

export interface AlertSubscriptionData {
  location: string;
  priceRange: { min: number; max: number };
  propertyType: string;
  alertFrequency: 'immediate' | 'daily' | 'weekly';
  email: string;
}

export interface UserProfileData {
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
  [key: string]: unknown;
}

export interface PropertyListingData {
  address: string;
  price: number;
  propertyType: string;
  description?: string;
  [key: string]: unknown;
}

// ─── API + result types ───────────────────────────────────────────────────────

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface FormSubmissionResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// ─── Submit options ────────────────────────────────────────────────────────────

interface SubmitOptions {
  method?: 'POST' | 'PUT' | 'PATCH';
  /** Show a toast on success (default: true). */
  showSuccessToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

// ─── Validation types ─────────────────────────────────────────────────────────

type Validator<V = unknown> = (value: V) => string | null;

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ─── Service ──────────────────────────────────────────────────────────────────

class FormService {
  private readonly baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  // ── Core JSON submit ────────────────────────────────────────────────────────

  private async submitJson<TData, TResult = unknown>(
    endpoint: string,
    data: TData,
    options: SubmitOptions = {}
  ): Promise<FormSubmissionResult<TResult>> {
    const {
      method = 'POST',
      showSuccessToast = true,
      successMessage = 'Form submitted successfully!',
      errorMessage = 'Failed to submit form. Please try again.',
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, timestamp: new Date().toISOString() }),
      });

      const result: ApiResponse<TResult> = await response.json();

      if (!response.ok || !result.success) {
        throw new FormSubmissionError(
          result.message ?? (response.ok ? errorMessage : `HTTP ${response.status}`),
          result.errors
        );
      }

      if (showSuccessToast) {
        toast({ title: 'Success!', description: result.message ?? successMessage });
      }

      return {
        success: true,
        message: result.message ?? successMessage,
        data: result.data,
      };
    } catch (err) {
      return this.handleError(err, errorMessage);
    }
  }

  // ── Multipart (file) submit ─────────────────────────────────────────────────

  private async submitMultipart<TResult = unknown>(
    endpoint: string,
    formData: FormData,
    options: Pick<SubmitOptions, 'showSuccessToast' | 'successMessage' | 'errorMessage'> = {}
  ): Promise<FormSubmissionResult<TResult>> {
    const {
      showSuccessToast = true,
      successMessage = 'Upload successful!',
      errorMessage = 'Failed to upload. Please try again.',
    } = options;

    try {
      // Do not set Content-Type — the browser sets it with the correct boundary.
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const result: ApiResponse<TResult> = await response.json();

      if (!response.ok || !result.success) {
        throw new FormSubmissionError(
          result.message ?? (response.ok ? errorMessage : `HTTP ${response.status}`),
          result.errors
        );
      }

      if (showSuccessToast) {
        toast({ title: 'Uploaded!', description: result.message ?? successMessage });
      }

      return {
        success: true,
        message: result.message ?? successMessage,
        data: result.data,
      };
    } catch (err) {
      return this.handleError(err, errorMessage);
    }
  }

  // ── Error normalisation ─────────────────────────────────────────────────────

  private handleError<TResult = unknown>(err: unknown, fallbackMessage: string): FormSubmissionResult<TResult> {
    const message =
      err instanceof Error ? err.message : fallbackMessage;
    const errors =
      err instanceof FormSubmissionError ? err.errors : undefined;

    toast({ title: 'Submission Failed', description: message, variant: 'destructive' });

    return { success: false, message, errors };
  }

  // ── Public submission methods ───────────────────────────────────────────────

  async submitContactForm(data: ContactFormData): Promise<FormSubmissionResult> {
    trackEvent('contact_form_submit', {
      event_category: 'Contact',
      event_label: data.inquiryType,
    });

    return this.submitJson('/contact', data, {
      successMessage: "Thank you for contacting us! We'll get back to you within 24 hours.",
    });
  }

  async submitSalesInquiry(data: SalesInquiryData): Promise<FormSubmissionResult> {
    trackEvent('sales_inquiry', {
      event_category: 'B2B',
      event_label: 'contact_sales_form',
      company: data.company,
      role: data.role,
      use_case: data.useCase,
      monthly_volume: data.monthlyVolume,
    });

    return this.submitJson('/b2b/sales-inquiry', data, {
      successMessage: 'Thank you for your interest! Our sales team will contact you within 24 hours.',
    });
  }

  async submitVerificationRequest(data: VerificationRequestData): Promise<FormSubmissionResult> {
    return this.submitJson('/trust/verification-request', data, {
      successMessage: 'Verification request submitted! You will receive updates via email.',
    });
  }

  async submitReview(data: ReviewSubmissionData): Promise<FormSubmissionResult> {
    return this.submitJson('/reviews', data, {
      successMessage: 'Thank you for your review! It helps other users make informed decisions.',
    });
  }

  async subscribeToAlerts(data: AlertSubscriptionData): Promise<FormSubmissionResult> {
    return this.submitJson('/alerts/subscribe', data, {
      successMessage: 'Alert subscription created! You will receive notifications based on your preferences.',
    });
  }

  async updateUserProfile(data: UserProfileData): Promise<FormSubmissionResult> {
    return this.submitJson('/users/profile', data, {
      method: 'PATCH',
      successMessage: 'Profile updated successfully!',
    });
  }

  async submitPropertyListing(data: PropertyListingData): Promise<FormSubmissionResult> {
    return this.submitJson('/properties', data, {
      successMessage: 'Property listing submitted! It will be reviewed and published shortly.',
    });
  }

  async submitDocumentVerification(data: FormData): Promise<FormSubmissionResult> {
    return this.submitMultipart('/documents/verify', data, {
      successMessage: 'Your document has been uploaded and is being verified.',
      errorMessage: 'Failed to upload document. Please try again.',
    });
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  /**
   * Validate a record against required-field checks and optional per-field rules.
   *
   * @param data           — the form data object
   * @param requiredFields — fields that must be non-empty
   * @param rules          — optional map of field → validator function
   *
   * @example
   * const { isValid, errors } = formService.validate(data, ['email'], {
   *   email: FormService.rules.email,
   *   phone: FormService.rules.phone,
   * });
   */
  validate<T extends Record<string, unknown>>(
    data: T,
    requiredFields: (keyof T)[],
    rules?: Partial<Record<keyof T, Validator>>
  ): ValidationResult {
    const errors: Record<string, string> = {};

    for (const field of requiredFields) {
      const value = data[field];
      if (value === undefined || value === null || String(value).trim() === '') {
        errors[field as string] = 'This field is required';
      }
    }

    if (rules) {
      for (const [field, validator] of Object.entries(rules) as [keyof T, Validator][]) {
        // Only run rule when there's a value and no prior required-field error.
        if (data[field] !== undefined && data[field] !== null && !errors[field as string]) {
          const error = validator(data[field]);
          if (error) errors[field as string] = error;
        }
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  // ── Built-in validation rules ──────────────────────────────────────────────

  /**
   * Ready-made validators for common fields.
   * Pass directly to `validate()` or compose with custom rules.
   */
  static readonly rules = {
    email: (value: unknown): string | null => {
      const ok = typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      return ok ? null : 'Please enter a valid email address';
    },

    /** Accepts Kenyan mobile numbers: +2547xxxxxxxx or 07xxxxxxxx / 01xxxxxxxx */
    phone: (value: unknown): string | null => {
      const ok =
        typeof value === 'string' &&
        /^(\+254|0)[17]\d{8}$/.test(value.replace(/\s/g, ''));
      return ok ? null : 'Please enter a valid Kenyan phone number (+2547xx or 07xx)';
    },

    rating: (value: unknown): string | null => {
      const n = Number(value);
      return Number.isInteger(n) && n >= 1 && n <= 5
        ? null
        : 'Rating must be a whole number between 1 and 5';
    },

    minLength:
      (min: number): Validator<string> =>
      (value) =>
        typeof value === 'string' && value.length >= min
          ? null
          : `Must be at least ${min} characters`,

    maxLength:
      (max: number): Validator<string> =>
      (value) =>
        typeof value === 'string' && value.length <= max
          ? null
          : `Must be no more than ${max} characters`,

    /** Compose multiple validators — returns the first error found. */
    compose:
      (...validators: Validator[]): Validator =>
      (value) => {
        for (const v of validators) {
          const error = v(value);
          if (error) return error;
        }
        return null;
      },
  } as const;
}

// ─── Singleton ────────────────────────────────────────────────────────────────

export const formService = new FormService();
export default formService;