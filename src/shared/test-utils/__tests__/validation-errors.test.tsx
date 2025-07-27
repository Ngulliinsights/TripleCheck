/**
 * Invalid input handling and validation error display tests
 * Tests form validation, input sanitization, and error message display
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../render';
import { validationUtilities, apiErrors, cleanup } from '../error-testing';

// Mock form component for testing validation
function ValidationTestForm() {
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    phone: '',
    title: '',
    price: '',
    description: '',
  });
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  const validateField = (name: string, value: string): string[] => {
    const fieldErrors: string[] = [];

    switch (name) {
      case 'email':
        if (!value) {
          fieldErrors.push('Email is required');
        } else if (validationUtilities.invalidEmails.includes(value)) {
          fieldErrors.push('Please enter a valid email address');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          fieldErrors.push('Email format is invalid');
        }
        break;

      case 'password':
        if (!value) {
          fieldErrors.push('Password is required');
        } else if (validationUtilities.invalidPasswords.includes(value)) {
          fieldErrors.push('Password must be at least 8 characters with uppercase, lowercase, and numbers');
        } else if (value.length < 8) {
          fieldErrors.push('Password must be at least 8 characters long');
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          fieldErrors.push('Password must contain uppercase, lowercase, and numbers');
        }
        break;

      case 'phone':
        if (!value) {
          fieldErrors.push('Phone number is required');
        } else if (validationUtilities.invalidPhoneNumbers.includes(value)) {
          fieldErrors.push('Please enter a valid phone number');
        } else if (!/^\+254\d{9}$/.test(value)) {
          fieldErrors.push('Phone number must be in format +254XXXXXXXXX');
        }
        break;

      case 'title':
        if (!value.trim()) {
          fieldErrors.push('Title is required');
        } else if (value.trim().length < 5) {
          fieldErrors.push('Title must be at least 5 characters long');
        } else if (value.trim().length > 100) {
          fieldErrors.push('Title must be less than 100 characters');
        }
        break;

      case 'price':
        if (!value) {
          fieldErrors.push('Price is required');
        } else {
          const numPrice = parseFloat(value);
          if (isNaN(numPrice)) {
            fieldErrors.push('Price must be a valid number');
          } else if (numPrice <= 0) {
            fieldErrors.push('Price must be greater than 0');
          } else if (numPrice > 1000000000) {
            fieldErrors.push('Price is too high');
          }
        }
        break;

      case 'description':
        if (!value.trim()) {
          fieldErrors.push('Description is required');
        } else if (value.trim().length < 20) {
          fieldErrors.push('Description must be at least 20 characters long');
        } else if (value.trim().length > 1000) {
          fieldErrors.push('Description must be less than 1000 characters');
        }
        break;
    }

    return fieldErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    const fieldErrors = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: fieldErrors }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    // Validate all fields
    const allErrors: Record<string, string[]> = {};
    let hasErrors = false;

    Object.entries(formData).forEach(([name, value]) => {
      const fieldErrors = validateField(name, value);
      if (fieldErrors.length > 0) {
        allErrors[name] = fieldErrors;
        hasErrors = true;
      }
    });

    setErrors(allErrors);

    if (hasErrors) {
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitSuccess(true);
    } catch (error) {
      // Handle API errors
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearForm = () => {
    setFormData({
      email: '',
      password: '',
      phone: '',
      title: '',
      price: '',
      description: '',
    });
    setErrors({});
    setSubmitSuccess(false);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          aria-invalid={errors.email?.length > 0}
          aria-describedby={errors.email?.length > 0 ? 'email-error' : undefined}
        />
        {errors.email?.length > 0 && (
          <div id="email-error" role="alert" data-testid="email-error">
            {errors.email.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="password">Password *</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange}
          aria-invalid={errors.password?.length > 0}
          aria-describedby={errors.password?.length > 0 ? 'password-error' : undefined}
        />
        {errors.password?.length > 0 && (
          <div id="password-error" role="alert" data-testid="password-error">
            {errors.password.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="phone">Phone Number *</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="+254XXXXXXXXX"
          aria-invalid={errors.phone?.length > 0}
          aria-describedby={errors.phone?.length > 0 ? 'phone-error' : undefined}
        />
        {errors.phone?.length > 0 && (
          <div id="phone-error" role="alert" data-testid="phone-error">
            {errors.phone.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="title">Property Title *</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formData.title}
          onChange={handleInputChange}
          aria-invalid={errors.title?.length > 0}
          aria-describedby={errors.title?.length > 0 ? 'title-error' : undefined}
        />
        {errors.title?.length > 0 && (
          <div id="title-error" role="alert" data-testid="title-error">
            {errors.title.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="price">Price (KES) *</label>
        <input
          id="price"
          name="price"
          type="number"
          value={formData.price}
          onChange={handleInputChange}
          min="1"
          aria-invalid={errors.price?.length > 0}
          aria-describedby={errors.price?.length > 0 ? 'price-error' : undefined}
        />
        {errors.price?.length > 0 && (
          <div id="price-error" role="alert" data-testid="price-error">
            {errors.price.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          aria-invalid={errors.description?.length > 0}
          aria-describedby={errors.description?.length > 0 ? 'description-error' : undefined}
        />
        {errors.description?.length > 0 && (
          <div id="description-error" role="alert" data-testid="description-error">
            {errors.description.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </div>
        )}
      </div>

      <div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
        <button type="button" onClick={clearForm}>
          Clear
        </button>
      </div>

      {submitSuccess && (
        <div data-testid="success-message" role="status">
          Form submitted successfully!
        </div>
      )}
    </form>
  );
}

describe('Validation Error Handling', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    cleanup.resetAll();
  });

  afterEach(() => {
    cleanup.restoreDefaults();
  });

  describe('Email Validation', () => {
    it('should show error for empty email', async () => {
      renderWithProviders(<ValidationTestForm />);

      const emailInput = screen.getByLabelText(/email/i);
      
      await user.click(emailInput);
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('email-error')).toHaveTextContent('Email is required');
    });

    it('should show error for invalid email formats', async () => {
      renderWithProviders(<ValidationTestForm />);

      const emailInput = screen.getByLabelText(/email/i);

      for (const invalidEmail of validationUtilities.invalidEmails.slice(0, 5)) {
        await user.clear(emailInput);
        await user.type(emailInput, invalidEmail);
        await user.tab();

        await waitFor(() => {
          expect(screen.getByTestId('email-error')).toBeInTheDocument();
        });

        expect(screen.getByTestId('email-error')).toHaveTextContent(/valid email|email format/i);
      }
    });

    it('should clear error for valid email', async () => {
      renderWithProviders(<ValidationTestForm />);

      const emailInput = screen.getByLabelText(/email/i);

      // First enter invalid email
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Then enter valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Validation', () => {
    it('should show error for weak passwords', async () => {
      renderWithProviders(<ValidationTestForm />);

      const passwordInput = screen.getByLabelText(/password/i);

      for (const weakPassword of validationUtilities.invalidPasswords.slice(0, 5)) {
        await user.clear(passwordInput);
        await user.type(passwordInput, weakPassword);
        await user.tab();

        await waitFor(() => {
          expect(screen.getByTestId('password-error')).toBeInTheDocument();
        });

        const errorText = screen.getByTestId('password-error').textContent;
        expect(errorText).toMatch(/password|characters|uppercase|lowercase|numbers/i);
      }
    });

    it('should accept strong password', async () => {
      renderWithProviders(<ValidationTestForm />);

      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(passwordInput, 'StrongPass123!');
      await user.tab();

      // Should not show error for strong password
      expect(screen.queryByTestId('password-error')).not.toBeInTheDocument();
    });
  });

  describe('Phone Number Validation', () => {
    it('should show error for invalid phone numbers', async () => {
      renderWithProviders(<ValidationTestForm />);

      const phoneInput = screen.getByLabelText(/phone/i);

      for (const invalidPhone of validationUtilities.invalidPhoneNumbers.slice(0, 5)) {
        await user.clear(phoneInput);
        await user.type(phoneInput, invalidPhone);
        await user.tab();

        await waitFor(() => {
          expect(screen.getByTestId('phone-error')).toBeInTheDocument();
        });

        expect(screen.getByTestId('phone-error')).toHaveTextContent(/phone|format|required/i);
      }
    });

    it('should accept valid Kenyan phone number', async () => {
      renderWithProviders(<ValidationTestForm />);

      const phoneInput = screen.getByLabelText(/phone/i);

      await user.type(phoneInput, '+254712345678');
      await user.tab();

      expect(screen.queryByTestId('phone-error')).not.toBeInTheDocument();
    });
  });

  describe('Property Data Validation', () => {
    it('should validate property title', async () => {
      renderWithProviders(<ValidationTestForm />);

      const titleInput = screen.getByLabelText(/property title/i);

      // Test empty title
      await user.click(titleInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('title-error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('title-error')).toHaveTextContent('Title is required');

      // Test too short title
      await user.type(titleInput, 'Hi');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('title-error')).toHaveTextContent(/at least 5 characters/i);
      });

      // Test valid title
      await user.clear(titleInput);
      await user.type(titleInput, 'Beautiful Modern Apartment');

      await waitFor(() => {
        expect(screen.queryByTestId('title-error')).not.toBeInTheDocument();
      });
    });

    it('should validate property price', async () => {
      renderWithProviders(<ValidationTestForm />);

      const priceInput = screen.getByLabelText(/price/i);

      // Test negative price
      await user.type(priceInput, '-1000');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('price-error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('price-error')).toHaveTextContent(/greater than 0/i);

      // Test invalid price
      await user.clear(priceInput);
      await user.type(priceInput, 'abc');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('price-error')).toHaveTextContent(/valid number/i);
      });

      // Test valid price
      await user.clear(priceInput);
      await user.type(priceInput, '1000000');

      await waitFor(() => {
        expect(screen.queryByTestId('price-error')).not.toBeInTheDocument();
      });
    });

    it('should validate property description', async () => {
      renderWithProviders(<ValidationTestForm />);

      const descriptionInput = screen.getByLabelText(/description/i);

      // Test empty description
      await user.click(descriptionInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('description-error')).toBeInTheDocument();
      });

      expect(screen.getByTestId('description-error')).toHaveTextContent('Description is required');

      // Test too short description
      await user.type(descriptionInput, 'Short desc');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('description-error')).toHaveTextContent(/at least 20 characters/i);
      });

      // Test valid description
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'This is a beautiful modern apartment with stunning city views and excellent amenities.');

      await waitFor(() => {
        expect(screen.queryByTestId('description-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission Validation', () => {
    it('should prevent submission with validation errors', async () => {
      renderWithProviders(<ValidationTestForm />);

      const submitButton = screen.getByText('Submit');

      // Try to submit empty form
      await user.click(submitButton);

      // Should show all required field errors
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
        expect(screen.getByTestId('password-error')).toBeInTheDocument();
        expect(screen.getByTestId('phone-error')).toBeInTheDocument();
        expect(screen.getByTestId('title-error')).toBeInTheDocument();
        expect(screen.getByTestId('price-error')).toBeInTheDocument();
        expect(screen.getByTestId('description-error')).toBeInTheDocument();
      });

      // Should not show success message
      expect(screen.queryByTestId('success-message')).not.toBeInTheDocument();
    });

    it('should submit successfully with valid data', async () => {
      renderWithProviders(<ValidationTestForm />);

      // Fill in valid data
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'StrongPass123!');
      await user.type(screen.getByLabelText(/phone/i), '+254712345678');
      await user.type(screen.getByLabelText(/property title/i), 'Beautiful Modern Apartment');
      await user.type(screen.getByLabelText(/price/i), '1000000');
      await user.type(screen.getByLabelText(/description/i), 'This is a beautiful modern apartment with stunning city views and excellent amenities.');

      const submitButton = screen.getByText('Submit');
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Submitting...')).toBeInTheDocument();

      // Should show success message after submission
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByTestId('success-message')).toHaveTextContent('Form submitted successfully!');
    });
  });

  describe('Real-time Validation', () => {
    it('should show validation errors as user types', async () => {
      renderWithProviders(<ValidationTestForm />);

      const emailInput = screen.getByLabelText(/email/i);

      // Start typing invalid email
      await user.type(emailInput, 'invalid');

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Continue typing to make it valid
      await user.type(emailInput, '@example.com');

      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      });
    });

    it('should update validation errors immediately', async () => {
      renderWithProviders(<ValidationTestForm />);

      const passwordInput = screen.getByLabelText(/password/i);

      // Type weak password
      await user.type(passwordInput, '123');

      await waitFor(() => {
        expect(screen.getByTestId('password-error')).toBeInTheDocument();
      });

      // Make it stronger
      await user.type(passwordInput, 'StrongPass!');

      await waitFor(() => {
        expect(screen.queryByTestId('password-error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility in Validation', () => {
    it('should associate error messages with form fields', async () => {
      renderWithProviders(<ValidationTestForm />);

      const emailInput = screen.getByLabelText(/email/i);

      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
    });

    it('should announce validation errors to screen readers', async () => {
      renderWithProviders(<ValidationTestForm />);

      const emailInput = screen.getByLabelText(/email/i);

      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        const errorElement = screen.getByTestId('email-error');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });

    it('should clear aria-invalid when errors are resolved', async () => {
      renderWithProviders(<ValidationTestForm />);

      const emailInput = screen.getByLabelText(/email/i);

      // Create error
      await user.click(emailInput);
      await user.tab();

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      });

      // Fix error
      await user.type(emailInput, 'valid@example.com');

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'false');
      });
    });
  });

  describe('Form Reset and Clear', () => {
    it('should clear all validation errors when form is cleared', async () => {
      renderWithProviders(<ValidationTestForm />);

      // Create some validation errors
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toBeInTheDocument();
      });

      // Clear form
      await user.click(screen.getByText('Clear'));

      // Errors should be cleared
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
      expect(emailInput).toHaveValue('');
    });
  });
});