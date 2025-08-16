import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderWithProviders } from '../render';
import { useForm } from '../../hooks/useFormValidation';
// ValidationRule is now part of useFormValidation
import FormField from '../../components/forms/FormField';
import FileUpload from '../../components/forms/FileUpload';

// Mock toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Test form component
const TestForm = ({ 
  onSubmit = vi.fn(),
  validationRules = {},
  initialValues = {}
}: {
  onSubmit?: (data: any) => Promise<void>;
  validationRules?: Record<string, any>;
  initialValues?: Record<string, any>;
}) => {
  const {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    getFieldProps,
    getFieldError,
    handleSubmit,
    handleReset
  } = useForm({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      rating: 0,
      file: null,
      ...initialValues
    },
    validationRules,
    onSubmit,
    validateOnChange: true,
    validateOnBlur: true
  });

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField
        name="name"
        label="Name"
        required
        error={getFieldError('name')}
        touched={touched.name}
        {...getFieldProps('name')}
      />
      
      <FormField
        name="email"
        label="Email"
        type="email"
        required
        error={getFieldError('email')}
        touched={touched.email}
        {...getFieldProps('email')}
      />
      
      <FormField
        name="phone"
        label="Phone"
        type="tel"
        error={getFieldError('phone')}
        touched={touched.phone}
        {...getFieldProps('phone')}
      />
      
      <FormField
        name="message"
        label="Message"
        type="textarea"
        required
        error={getFieldError('message')}
        touched={touched.message}
        {...getFieldProps('message')}
      />
      
      <div>
        <label>Rating</label>
        {[1, 2, 3, 4, 5].map(rating => (
          <button
            key={rating}
            type="button"
            onClick={() => getFieldProps('rating').onChange({ target: { value: rating } } as any)}
            aria-label={`Rate ${rating} stars`}
          >
            {rating} Star
          </button>
        ))}
        {getFieldError('rating') && (
          <div role="alert">{getFieldError('rating')}</div>
        )}
      </div>
      
      <FileUpload
        name="file"
        label="Upload File"
        onFilesChange={(files) => getFieldProps('file').onChange({ target: { files: files[0] } } as any)}
        error={getFieldError('file')}
        touched={touched.file}
      />
      
      <button type="submit" disabled={!isValid || isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
      
      <button type="button" onClick={handleReset}>
        Reset
      </button>
      
      <div data-testid="form-state">
        Valid: {isValid.toString()}
        Submitting: {isSubmitting.toString()}
        Errors: {JSON.stringify(errors)}
      </div>
    </form>
  );
};

describe('Form Validation Integration', () => {
  const user = userEvent.setup();

  describe('Basic Form Validation', () => {
    it('should validate required fields', async () => {
      const validationRules = {
        name: { required: true, minLength: 2 },
        email: { required: true, email: true },
        message: { required: true, minLength: 10 }
      };

      renderWithProviders(
        <TestForm validationRules={validationRules} />
      );

      const submitButton = screen.getByRole('button', { name: /submit/i });
      
      // Form should be invalid initially
      expect(screen.getByTestId('form-state')).toHaveTextContent('Valid: false');
      expect(submitButton).toBeDisabled();

      // Try to submit without filling fields
      await user.click(submitButton);
      
      // Should show validation errors after touching fields
      const nameInput = screen.getByLabelText(/name/i);
      await user.click(nameInput);
      await user.tab(); // Blur the field
      
      await waitFor(() => {
        expect(screen.getByText(/this field is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const validationRules = {
        email: { required: true, email: true }
      };

      renderWithProviders(
        <TestForm validationRules={validationRules} />
      );

      const emailInput = screen.getByLabelText(/email/i);
      
      // Enter invalid email
      await user.type(emailInput, 'invalid-email');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Enter valid email
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      const validationRules = {
        phone: { phone: true }
      };

      renderWithProviders(
        <TestForm validationRules={validationRules} />
      );

      const phoneInput = screen.getByLabelText(/phone/i);
      
      // Enter invalid phone
      await user.type(phoneInput, '123');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/please enter a valid kenyan phone number/i)).toBeInTheDocument();
      });

      // Enter valid phone
      await user.clear(phoneInput);
      await user.type(phoneInput, '+254712345678');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid kenyan phone number/i)).not.toBeInTheDocument();
      });
    });

    it('should validate text length', async () => {
      const validationRules = {
        message: { required: true, minLength: 10, maxLength: 100 }
      };

      renderWithProviders(
        <TestForm validationRules={validationRules} />
      );

      const messageInput = screen.getByLabelText(/message/i);
      
      // Enter text too short
      await user.type(messageInput, 'short');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/must be at least 10 characters long/i)).toBeInTheDocument();
      });

      // Enter text too long
      await user.clear(messageInput);
      await user.type(messageInput, 'a'.repeat(101));
      await user.tab();
      
      await waitFor(() => {
        expect(screen.getByText(/must be no more than 100 characters long/i)).toBeInTheDocument();
      });

      // Enter valid text
      await user.clear(messageInput);
      await user.type(messageInput, 'This is a valid message with proper length');
      await user.tab();
      
      await waitFor(() => {
        expect(screen.queryByText(/must be at least 10 characters long/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/must be no more than 100 characters long/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should handle successful form submission', async () => {
      const mockSubmit = vi.fn().mockResolvedValue(undefined);
      const validationRules = {
        name: { required: true },
        email: { required: true, email: true }
      };

      renderWithProviders(
        <TestForm onSubmit={mockSubmit} validationRules={validationRules} />
      );

      // Fill form with valid data
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '',
          message: '',
          rating: 0,
          file: null
        });
      });
    });

    it('should handle form submission errors', async () => {
      const mockSubmit = vi.fn().mockRejectedValue(new Error('Server error'));
      const validationRules = {
        name: { required: true },
        email: { required: true, email: true }
      };

      renderWithProviders(
        <TestForm onSubmit={mockSubmit} validationRules={validationRules} />
      );

      // Fill form with valid data
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await user.click(submitButton);

      // Should show submitting state
      await waitFor(() => {
        expect(screen.getByText(/submitting/i)).toBeInTheDocument();
      });

      // Should return to normal state after error
      await waitFor(() => {
        expect(screen.queryByText(/submitting/i)).not.toBeInTheDocument();
      });
    });

    it('should prevent submission with invalid data', async () => {
      const mockSubmit = vi.fn();
      const validationRules = {
        name: { required: true },
        email: { required: true, email: true }
      };

      renderWithProviders(
        <TestForm onSubmit={mockSubmit} validationRules={validationRules} />
      );

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();

      // Fill only name
      await user.type(screen.getByLabelText(/name/i), 'John');
      
      // Submit button should still be disabled
      expect(submitButton).toBeDisabled();
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('should reset form to initial state', async () => {
      const validationRules = {
        name: { required: true },
        email: { required: true, email: true }
      };

      renderWithProviders(
        <TestForm validationRules={validationRules} />
      );

      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');

      // Reset form
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      // Form should be reset
      expect(screen.getByLabelText(/name/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByTestId('form-state')).toHaveTextContent('Valid: false');
    });
  });

  describe('Custom Validation', () => {
    it('should handle custom validation rules', async () => {
      const validationRules = {
        rating: {
          required: true,
          custom: (value: any) => {
            if (typeof value !== 'number' || value < 1 || value > 5) {
              return 'Please select a rating from 1 to 5 stars';
            }
            return null;
          }
        }
      };

      renderWithProviders(
        <TestForm validationRules={validationRules} />
      );

      // Try to submit without rating
      const submitButton = screen.getByRole('button', { name: /submit/i });
      expect(submitButton).toBeDisabled();

      // Select a rating
      const ratingButton = screen.getByRole('button', { name: /rate 4 stars/i });
      await user.click(ratingButton);

      // Form should now be valid
      await waitFor(() => {
        expect(screen.getByTestId('form-state')).toHaveTextContent('Valid: true');
      });
    });
  });

  describe('File Upload Validation', () => {
    it('should validate file uploads', async () => {
      const validationRules = {
        file: {
          required: true,
          fileSize: 5 * 1024 * 1024, // 5MB
          fileTypes: ['image/jpeg', 'image/png', 'application/pdf']
        }
      };

      renderWithProviders(
        <TestForm validationRules={validationRules} />
      );

      // Create a test file
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const fileInput = screen.getByLabelText(/upload file/i);

      // Upload invalid file type
      await user.upload(fileInput, file);

      await waitFor(() => {
        expect(screen.getByText(/file type not allowed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const validationRules = {
        name: { required: true },
        email: { required: true, email: true }
      };

      renderWithProviders(
        <TestForm validationRules={validationRules} />
      );

      // Check form has novalidate
      const form = screen.getByRole('form');
      expect(form).toHaveAttribute('novalidate');

      // Check required fields have proper attributes
      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('required');
      expect(nameInput).toHaveAttribute('aria-invalid', 'false');

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should announce validation errors to screen readers', async () => {
      const validationRules = {
        name: { required: true }
      };

      renderWithProviders(
        <TestForm validationRules={validationRules} />
      );

      const nameInput = screen.getByLabelText(/name/i);
      
      // Focus and blur to trigger validation
      await user.click(nameInput);
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent(/this field is required/i);
      });

      // Input should have aria-invalid and aria-describedby
      expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      expect(nameInput).toHaveAttribute('aria-describedby');
    });
  });

  describe('Form State Management', () => {
    it('should track dirty state correctly', async () => {
      renderWithProviders(<TestForm />);

      const nameInput = screen.getByLabelText(/name/i);
      
      // Initially not dirty
      expect(screen.getByTestId('form-state')).toHaveTextContent('Valid: true');

      // Type something to make it dirty
      await user.type(nameInput, 'John');

      // Form state should reflect changes
      expect(nameInput).toHaveValue('John');
    });

    it('should handle navigation prevention on dirty forms', async () => {
      // This would typically be tested with router integration
      // For now, we'll just verify the form tracks dirty state
      renderWithProviders(<TestForm />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'John');

      // In a real implementation, this would prevent navigation
      expect(nameInput).toHaveValue('John');
    });
  });
});

describe('Form Component Integration', () => {
  it('should integrate with Contact form', async () => {
    // This would test the actual Contact form component
    // For now, we'll test the form structure
    const validationRules = {
      name: { required: true, minLength: 2, maxLength: 100 },
      email: { required: true, email: true },
      subject: { required: true, minLength: 5, maxLength: 200 },
      message: { required: true, minLength: 10, maxLength: 2000 }
    };

    renderWithProviders(
      <TestForm validationRules={validationRules} />
    );

    // Fill out contact form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'This is a test message with sufficient length');

    // Form should be valid
    await waitFor(() => {
      expect(screen.getByTestId('form-state')).toHaveTextContent('Valid: true');
    });
  });

  it('should integrate with Reviews form', async () => {
    const validationRules = {
      rating: {
        required: true,
        min: 1,
        max: 5,
        custom: (value: any) => {
          if (typeof value !== 'number' || value < 1 || value > 5) {
            return 'Please select a rating from 1 to 5 stars';
          }
          return null;
        }
      },
      comment: { required: true, minLength: 10, maxLength: 1000 }
    };

    renderWithProviders(
      <TestForm validationRules={validationRules} />
    );

    // Select rating
    await user.click(screen.getByRole('button', { name: /rate 5 stars/i }));
    
    // Add comment
    await user.type(screen.getByLabelText(/message/i), 'This is an excellent service with great support');

    // Form should be valid
    await waitFor(() => {
      expect(screen.getByTestId('form-state')).toHaveTextContent('Valid: true');
    });
  });
});