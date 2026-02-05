/**
 * Form Service - Centralized form submission and validation
 * Handles all form submissions with proper error handling and validation
 */

import { toast } from '../hooks/use-toast'

// Form data interfaces
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
  priceRange: {
    min: number;
    max: number;
  };
  propertyType: string;
  alertFrequency: 'immediate' | 'daily' | 'weekly';
  email: string;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface FormSubmissionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
}

class FormService {
  private baseUrl = '/api';

  /**
   * Generic form submission handler with error handling
   */
  private async submitForm<T>(
    endpoint: string,
    data: T,
    options: {
      method?: 'POST' | 'PUT' | 'PATCH';
      showSuccessToast?: boolean;
      successMessage?: string;
      errorMessage?: string;
    } = {}
  ): Promise<FormSubmissionResult> {
    const {
      method = 'POST',
      showSuccessToast = true,
      successMessage = 'Form submitted successfully!',
      errorMessage = 'Failed to submit form. Please try again.'
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
        }),
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      if (result.success) {
        if (showSuccessToast) {
          toast({
            title: 'Success!',
            description: result.message || successMessage,
          });
        }

        return {
          success: true,
          message: result.message || successMessage,
          data: result.data,
        };
      } else {
        throw new Error(result.message || errorMessage);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : errorMessage;
      
      toast({
        title: 'Submission Failed',
        description: message,
        variant: 'destructive',
      });

      return {
        success: false,
        message,
        errors: error instanceof Error && 'errors' in error ? (error as any).errors : undefined,
      };
    }
  }

  /**
   * Submit contact form
   */
  async submitContactForm(data: ContactFormData): Promise<FormSubmissionResult> {
    // Track form submission
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'contact_form_submit', {
        event_category: 'Contact',
        event_label: data.inquiryType,
      });
    }

    return this.submitForm('/contact', data, {
      successMessage: "Thank you for contacting us! We'll get back to you within 24 hours.",
    });
  }

  /**
   * Submit sales inquiry
   */
  async submitSalesInquiry(data: SalesInquiryData): Promise<FormSubmissionResult> {
    // Track sales inquiry
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sales_inquiry', {
        event_category: 'B2B',
        event_label: 'contact_sales_form',
        custom_parameters: {
          company: data.company,
          role: data.role,
          use_case: data.useCase,
          monthly_volume: data.monthlyVolume,
        },
      });
    }

    return this.submitForm('/b2b/sales-inquiry', data, {
      successMessage: 'Thank you for your interest! Our sales team will contact you within 24 hours.',
    });
  }

  /**
   * Submit verification request
   */
  async submitVerificationRequest(data: VerificationRequestData): Promise<FormSubmissionResult> {
    return this.submitForm('/trust/verification-request', data, {
      successMessage: 'Verification request submitted successfully! You will receive updates via email.',
    });
  }

  /**
   * Submit review
   */
  async submitReview(data: ReviewSubmissionData): Promise<FormSubmissionResult> {
    return this.submitForm('/reviews', data, {
      successMessage: 'Thank you for your review! It helps other users make informed decisions.',
    });
  }

  /**
   * Subscribe to property alerts
   */
  async subscribeToAlerts(data: AlertSubscriptionData): Promise<FormSubmissionResult> {
    return this.submitForm('/alerts/subscribe', data, {
      successMessage: 'Alert subscription created! You will receive notifications based on your preferences.',
    });
  }

  /**
   * Update user profile
   */
  async updateUserProfile(data: any): Promise<FormSubmissionResult> {
    return this.submitForm('/users/profile', data, {
      method: 'PATCH',
      successMessage: 'Profile updated successfully!',
    });
  }

  /**
   * Submit property listing
   */
  async submitPropertyListing(data: any): Promise<FormSubmissionResult> {
    return this.submitForm('/properties', data, {
      successMessage: 'Property listing submitted successfully! It will be reviewed and published shortly.',
    });
  }

  /**
   * Submit document for verification
   */
  async submitDocumentVerification(data: FormData): Promise<FormSubmissionResult> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/verify`, {
        method: 'POST',
        body: data, // FormData for file uploads
      });

      const result: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      if (result.success) {
        toast({
          title: 'Document Uploaded',
          description: 'Your document has been uploaded and is being verified.',
        });

        return {
          success: true,
          message: result.message || 'Document uploaded successfully',
          data: result.data,
        };
      } else {
        throw new Error(result.message || 'Failed to upload document');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload document';
      
      toast({
        title: 'Upload Failed',
        description: message,
        variant: 'destructive',
      });

      return {
        success: false,
        message,
      };
    }
  }

  /**
   * Validate form data before submission
   */
  validateFormData<T extends Record<string, any>>(
    data: T,
    requiredFields: (keyof T)[],
    validationRules?: Record<keyof T, (value: any) => string | null>
  ): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    // Check required fields
    for (const field of requiredFields) {
      if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors[field as string] = 'This field is required';
      }
    }

    // Apply custom validation rules
    if (validationRules) {
      for (const [field, validator] of Object.entries(validationRules)) {
        if (data[field] && !errors[field]) {
          const error = validator(data[field]);
          if (error) {
            errors[field] = error;
          }
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Common validation rules
   */
  static validationRules = {
    email: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : 'Please enter a valid email address';
    },
    phone: (value: string) => {
      const phoneRegex = /^(\+254|0)[17]\d{8}$/; // Kenyan phone number format
      return phoneRegex.test(value.replace(/\s/g, '')) ? null : 'Please enter a valid phone number';
    },
    required: (value: any) => {
      return value && value.toString().trim() ? null : 'This field is required';
    },
    minLength: (min: number) => (value: string) => {
      return value && value.length >= min ? null : `Must be at least ${min} characters`;
    },
    maxLength: (max: number) => (value: string) => {
      return value && value.length <= max ? null : `Must be no more than ${max} characters`;
    },
    rating: (value: number) => {
      return value >= 1 && value <= 5 ? null : 'Rating must be between 1 and 5';
    },
  };
}

// Export singleton instance
export const formService = new FormService();
export default formService;