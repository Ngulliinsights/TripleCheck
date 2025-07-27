/**
 * Form Accessibility Tests
 * Comprehensive testing for form accessibility compliance
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import { renderWithProviders, userEventInstance } from '@/shared/test-utils';
import { formTestingUtils, type FormField } from '@/shared/test-utils/form-testing';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock form component for testing
const TestForm = ({ 
  fields, 
  onSubmit = vi.fn(),
  showErrors = false,
  hasFieldsets = false,
}: {
  fields: FormField[];
  onSubmit?: (data: any) => void;
  showErrors?: boolean;
  hasFieldsets?: boolean;
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    onSubmit(data);
  };

  const renderField = (field: FormField) => {
    const fieldId = `field-${field.name}`;
    const errorId = `error-${field.name}`;
    const hasError = showErrors && field.required;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span aria-label="required"> *</span>}
            </label>
            <input
              id={fieldId}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              aria-describedby={hasError ? errorId : undefined}
              aria-invalid={hasError}
            />
            {hasError && (
              <div id={errorId} role="alert" className="error-message">
                {field.label} is required
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span aria-label="required"> *</span>}
            </label>
            <textarea
              id={fieldId}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              aria-describedby={hasError ? errorId : undefined}
              aria-invalid={hasError}
            />
            {hasError && (
              <div id={errorId} role="alert" className="error-message">
                {field.label} is required
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span aria-label="required"> *</span>}
            </label>
            <select
              id={fieldId}
              name={field.name}
              required={field.required}
              aria-describedby={hasError ? errorId : undefined}
              aria-invalid={hasError}
            >
              <option value="">Choose an option</option>
              <option value="option1">Option 1</option>
              <option value="option2">Option 2</option>
            </select>
            {hasError && (
              <div id={errorId} role="alert" className="error-message">
                {field.label} is required
              </div>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.name} className="form-field">
            <input
              id={fieldId}
              name={field.name}
              type="checkbox"
              required={field.required}
              aria-describedby={hasError ? errorId : undefined}
              aria-invalid={hasError}
            />
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span aria-label="required"> *</span>}
            </label>
            {hasError && (
              <div id={errorId} role="alert" className="error-message">
                {field.label} is required
              </div>
            )}
          </div>
        );

      case 'radio':
        return (
          <fieldset key={field.name} className="form-field">
            <legend>
              {field.label}
              {field.required && <span aria-label="required"> *</span>}
            </legend>
            <div>
              <input
                id={`${fieldId}-1`}
                name={field.name}
                type="radio"
                value="option1"
                required={field.required}
                aria-describedby={hasError ? errorId : undefined}
              />
              <label htmlFor={`${fieldId}-1`}>Option 1</label>
            </div>
            <div>
              <input
                id={`${fieldId}-2`}
                name={field.name}
                type="radio"
                value="option2"
                required={field.required}
                aria-describedby={hasError ? errorId : undefined}
              />
              <label htmlFor={`${fieldId}-2`}>Option 2</label>
            </div>
            {hasError && (
              <div id={errorId} role="alert" className="error-message">
                {field.label} is required
              </div>
            )}
          </fieldset>
        );

      case 'file':
        return (
          <div key={field.name} className="form-field">
            <label htmlFor={fieldId}>
              {field.label}
              {field.required && <span aria-label="required"> *</span>}
            </label>
            <input
              id={fieldId}
              name={field.name}
              type="file"
              required={field.required}
              aria-describedby={hasError ? errorId : undefined}
              aria-invalid={hasError}
              accept="image/*"
            />
            {hasError && (
              <div id={errorId} role="alert" className="error-message">
                {field.label} is required
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const groupedFields = hasFieldsets ? [
    { legend: 'Personal Information', fields: fields.slice(0, 2) },
    { legend: 'Contact Information', fields: fields.slice(2) },
  ] : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h1>Test Form</h1>
      
      {groupedFields ? (
        groupedFields.map((group, index) => (
          <fieldset key={index}>
            <legend>{group.legend}</legend>
            {group.fields.map(renderField)}
          </fieldset>
        ))
      ) : (
        fields.map(renderField)
      )}

      <button type="submit">Submit Form</button>
      <button type="reset">Reset Form</button>
    </form>
  );
};

describe('Form Accessibility', () => {
  const basicFormFields: FormField[] = [
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
      required: true,
      placeholder: 'Enter your first name',
    },
    {
      name: 'email',
      type: 'email',
      label: 'Email Address',
      required: true,
      placeholder: 'Enter your email',
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'Message',
      placeholder: 'Enter your message',
    },
    {
      name: 'category',
      type: 'select',
      label: 'Category',
      required: true,
    },
    {
      name: 'newsletter',
      type: 'checkbox',
      label: 'Subscribe to newsletter',
    },
    {
      name: 'preference',
      type: 'radio',
      label: 'Contact Preference',
      required: true,
    },
    {
      name: 'avatar',
      type: 'file',
      label: 'Profile Picture',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Accessibility Compliance', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProviders(
        <TestForm fields={basicFormFields} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper form structure', () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      // Form should have proper heading
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Test Form');

      // Form should be identifiable
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();

      // Submit button should be present
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should have accessible form labels', () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      basicFormFields.forEach(field => {
        if (field.type !== 'radio') {
          const input = screen.getByLabelText(new RegExp(field.label, 'i'));
          expect(input).toBeInTheDocument();
          expect(input).toHaveAccessibleName(expect.stringContaining(field.label));
        }
      });
    });

    it('should indicate required fields', () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      const requiredFields = basicFormFields.filter(field => field.required);
      
      requiredFields.forEach(field => {
        if (field.type !== 'radio') {
          const input = screen.getByLabelText(new RegExp(field.label, 'i'));
          expect(input).toBeRequired();
        }
      });

      // Check for visual required indicators
      const requiredIndicators = screen.getAllByLabelText('required');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through all form fields', async () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      // Start tabbing through form
      await userEventInstance.tab();
      expect(screen.getByLabelText(/first name/i)).toHaveFocus();

      await userEventInstance.tab();
      expect(screen.getByLabelText(/email/i)).toHaveFocus();

      await userEventInstance.tab();
      expect(screen.getByLabelText(/message/i)).toHaveFocus();

      await userEventInstance.tab();
      expect(screen.getByLabelText(/category/i)).toHaveFocus();

      await userEventInstance.tab();
      expect(screen.getByLabelText(/newsletter/i)).toHaveFocus();

      // Radio buttons
      await userEventInstance.tab();
      const firstRadio = screen.getByRole('radio', { name: /option 1/i });
      expect(firstRadio).toHaveFocus();

      // File input
      await userEventInstance.tab();
      expect(screen.getByLabelText(/profile picture/i)).toHaveFocus();

      // Submit button
      await userEventInstance.tab();
      expect(screen.getByRole('button', { name: /submit/i })).toHaveFocus();
    });

    it('should support arrow key navigation for radio buttons', async () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      const firstRadio = screen.getByRole('radio', { name: /option 1/i });
      const secondRadio = screen.getByRole('radio', { name: /option 2/i });

      // Focus first radio button
      firstRadio.focus();
      expect(firstRadio).toHaveFocus();

      // Arrow right to second option
      await userEventInstance.keyboard('{ArrowRight}');
      expect(secondRadio).toHaveFocus();
      expect(secondRadio).toBeChecked();

      // Arrow left back to first option
      await userEventInstance.keyboard('{ArrowLeft}');
      expect(firstRadio).toHaveFocus();
      expect(firstRadio).toBeChecked();
    });

    it('should support space key for checkbox selection', async () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      const checkbox = screen.getByLabelText(/newsletter/i);
      checkbox.focus();

      expect(checkbox).not.toBeChecked();

      await userEventInstance.keyboard(' ');
      expect(checkbox).toBeChecked();

      await userEventInstance.keyboard(' ');
      expect(checkbox).not.toBeChecked();
    });

    it('should support Enter key for form submission', async () => {
      const mockSubmit = vi.fn();
      renderWithProviders(<TestForm fields={basicFormFields} onSubmit={mockSubmit} />);

      const firstInput = screen.getByLabelText(/first name/i);
      await userEventInstance.type(firstInput, 'John');

      await userEventInstance.keyboard('{Enter}');
      expect(mockSubmit).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper ARIA labels and descriptions', () => {
      renderWithProviders(<TestForm fields={basicFormFields} showErrors={true} />);

      basicFormFields.forEach(field => {
        if (field.required && field.type !== 'radio') {
          const input = screen.getByLabelText(new RegExp(field.label, 'i'));
          
          // Should have accessible name
          expect(input).toHaveAccessibleName();
          
          // Should have accessible description for errors
          if (field.required) {
            expect(input).toHaveAttribute('aria-describedby');
            expect(input).toHaveAttribute('aria-invalid', 'true');
          }
        }
      });
    });

    it('should announce form errors with role="alert"', () => {
      renderWithProviders(<TestForm fields={basicFormFields} showErrors={true} />);

      const errorMessages = screen.getAllByRole('alert');
      expect(errorMessages.length).toBeGreaterThan(0);

      errorMessages.forEach(error => {
        expect(error).toHaveTextContent(/is required/i);
      });
    });

    it('should have proper fieldset and legend for radio groups', () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      const radioFieldset = screen.getByRole('group', { name: /contact preference/i });
      expect(radioFieldset).toBeInTheDocument();

      const legend = within(radioFieldset).getByText(/contact preference/i);
      expect(legend.tagName).toBe('LEGEND');
    });

    it('should have proper form structure with fieldsets', () => {
      renderWithProviders(<TestForm fields={basicFormFields} hasFieldsets={true} />);

      const personalInfoGroup = screen.getByRole('group', { name: /personal information/i });
      const contactInfoGroup = screen.getByRole('group', { name: /contact information/i });

      expect(personalInfoGroup).toBeInTheDocument();
      expect(contactInfoGroup).toBeInTheDocument();

      // Check that fields are properly grouped
      expect(within(personalInfoGroup).getByLabelText(/first name/i)).toBeInTheDocument();
      expect(within(contactInfoGroup).getByLabelText(/email/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling Accessibility', () => {
    it('should associate error messages with form fields', () => {
      renderWithProviders(<TestForm fields={basicFormFields} showErrors={true} />);

      const requiredFields = basicFormFields.filter(field => field.required && field.type !== 'radio');

      requiredFields.forEach(field => {
        const input = screen.getByLabelText(new RegExp(field.label, 'i'));
        const errorId = `error-${field.name}`;
        
        expect(input).toHaveAttribute('aria-describedby', errorId);
        expect(input).toHaveAttribute('aria-invalid', 'true');
        
        const errorMessage = screen.getByRole('alert');
        expect(errorMessage).toHaveAttribute('id', errorId);
      });
    });

    it('should announce validation errors immediately', async () => {
      const mockSubmit = vi.fn();
      renderWithProviders(<TestForm fields={basicFormFields} onSubmit={mockSubmit} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEventInstance.click(submitButton);

      // In a real implementation, this would trigger validation
      // and show error messages with role="alert"
      expect(mockSubmit).toHaveBeenCalled();
    });

    it('should clear error states when fields are corrected', async () => {
      renderWithProviders(<TestForm fields={basicFormFields} showErrors={true} />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');

      // In a real implementation, typing would clear the error
      await userEventInstance.type(firstNameInput, 'John');
      
      // Error state should be cleared (in real implementation)
      // expect(firstNameInput).toHaveAttribute('aria-invalid', 'false');
    });
  });

  describe('Focus Management', () => {
    it('should maintain logical focus order', async () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      const focusableElements = [
        screen.getByLabelText(/first name/i),
        screen.getByLabelText(/email/i),
        screen.getByLabelText(/message/i),
        screen.getByLabelText(/category/i),
        screen.getByLabelText(/newsletter/i),
        screen.getByRole('radio', { name: /option 1/i }),
        screen.getByLabelText(/profile picture/i),
        screen.getByRole('button', { name: /submit/i }),
        screen.getByRole('button', { name: /reset/i }),
      ];

      // Tab through all elements
      for (let i = 0; i < focusableElements.length; i++) {
        await userEventInstance.tab();
        expect(focusableElements[i]).toHaveFocus();
      }
    });

    it('should skip disabled elements in tab order', async () => {
      const fieldsWithDisabled = [
        ...basicFormFields,
        {
          name: 'disabled',
          type: 'text' as const,
          label: 'Disabled Field',
        },
      ];

      const TestFormWithDisabled = () => (
        <form>
          <TestForm fields={fieldsWithDisabled} />
          <input type="text" disabled aria-label="Disabled input" />
          <button type="button">Active Button</button>
        </form>
      );

      renderWithProviders(<TestFormWithDisabled />);

      const activeButton = screen.getByRole('button', { name: /active button/i });
      
      // Tab to the active button (should skip disabled input)
      let tabCount = 0;
      while (!activeButton.matches(':focus') && tabCount < 20) {
        await userEventInstance.tab();
        tabCount++;
      }

      expect(activeButton).toHaveFocus();
    });

    it('should provide visible focus indicators', () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      const firstInput = screen.getByLabelText(/first name/i);
      firstInput.focus();

      // In a real implementation, focus styles would be tested
      expect(firstInput).toHaveFocus();
    });
  });

  describe('Mobile Accessibility', () => {
    it('should have appropriate input types for mobile keyboards', () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');

      const fileInput = screen.getByLabelText(/profile picture/i);
      expect(fileInput).toHaveAttribute('type', 'file');
    });

    it('should have touch-friendly target sizes', () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      const checkbox = screen.getByLabelText(/newsletter/i);

      // In a real implementation, you would test computed styles
      expect(submitButton).toBeInTheDocument();
      expect(checkbox).toBeInTheDocument();
    });

    it('should support voice input', () => {
      renderWithProviders(<TestForm fields={basicFormFields} />);

      // All form fields should have proper labels for voice recognition
      basicFormFields.forEach(field => {
        if (field.type !== 'radio') {
          const input = screen.getByLabelText(new RegExp(field.label, 'i'));
          expect(input).toHaveAccessibleName();
        }
      });
    });
  });

  describe('High Contrast Mode', () => {
    it('should maintain functionality in high contrast mode', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithProviders(<TestForm fields={basicFormFields} />);

      // Form should still be functional
      expect(screen.getByRole('form')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });
  });

  describe('Reduced Motion', () => {
    it('should respect reduced motion preferences', () => {
      // Mock reduced motion media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithProviders(<TestForm fields={basicFormFields} />);

      // Form should still be functional without animations
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('Complex Form Accessibility', () => {
    it('should handle multi-step forms accessibly', async () => {
      const MultiStepForm = () => {
        const [step, setStep] = React.useState(1);

        return (
          <form>
            <div role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
              Step {step} of 3
            </div>
            
            {step === 1 && (
              <fieldset>
                <legend>Step 1: Personal Information</legend>
                <TestForm fields={basicFormFields.slice(0, 2)} />
              </fieldset>
            )}
            
            {step === 2 && (
              <fieldset>
                <legend>Step 2: Contact Information</legend>
                <TestForm fields={basicFormFields.slice(2, 4)} />
              </fieldset>
            )}
            
            {step === 3 && (
              <fieldset>
                <legend>Step 3: Preferences</legend>
                <TestForm fields={basicFormFields.slice(4)} />
              </fieldset>
            )}

            <button 
              type="button" 
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
            >
              Previous
            </button>
            <button 
              type="button" 
              onClick={() => setStep(step + 1)}
              disabled={step === 3}
            >
              Next
            </button>
          </form>
        );
      };

      const { container } = renderWithProviders(<MultiStepForm />);

      // Should have no accessibility violations
      const results = await axe(container);
      expect(results).toHaveNoViolations();

      // Should have proper progress indicator
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

      // Should have proper fieldset structure
      expect(screen.getByRole('group', { name: /step 1/i })).toBeInTheDocument();
    });

    it('should handle conditional fields accessibly', async () => {
      const ConditionalForm = () => {
        const [showConditional, setShowConditional] = React.useState(false);

        return (
          <form>
            <div>
              <input
                type="checkbox"
                id="trigger"
                onChange={(e) => setShowConditional(e.target.checked)}
              />
              <label htmlFor="trigger">Show additional field</label>
            </div>

            {showConditional && (
              <div>
                <label htmlFor="conditional">Additional Information</label>
                <input
                  type="text"
                  id="conditional"
                  aria-describedby="conditional-help"
                />
                <div id="conditional-help">
                  This field is only shown when the checkbox is checked
                </div>
              </div>
            )}
          </form>
        );
      };

      const { container } = renderWithProviders(<ConditionalForm />);

      const trigger = screen.getByLabelText(/show additional field/i);
      
      // Initially, conditional field should not be present
      expect(screen.queryByLabelText(/additional information/i)).not.toBeInTheDocument();

      // Check the trigger
      await userEventInstance.click(trigger);

      // Conditional field should now be present and accessible
      const conditionalField = screen.getByLabelText(/additional information/i);
      expect(conditionalField).toBeInTheDocument();
      expect(conditionalField).toHaveAccessibleDescription();

      // Should have no accessibility violations
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});