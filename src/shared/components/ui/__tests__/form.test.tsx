import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
} from '../form'
import { Input } from '../input'
import { Button } from '../button'

// Test component that uses the form components
const TestForm = ({ onSubmit = vi.fn(), defaultValues = {} }) => {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} data-testid="test-form">
        <FormField
          control={form.control}
          name="username"
          rules={{ required: 'Username is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          rules={{ 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
};

// Test component to test useFormField hook
const TestFormField = () => {
  const formField = useFormField();
  
  return (
    <div data-testid="form-field-info">
      <span data-testid="field-name">{formField.name}</span>
      <span data-testid="field-id">{formField.id}</span>
      <span data-testid="form-item-id">{formField.formItemId}</span>
      <span data-testid="form-description-id">{formField.formDescriptionId}</span>
      <span data-testid="form-message-id">{formField.formMessageId}</span>
      <span data-testid="field-invalid">{formField.invalid ? 'true' : 'false'}</span>
      <span data-testid="field-error">{formField.error?.message || 'no-error'}</span>
    </div>
  );
};

const TestFormWithFieldInfo = () => {
  const form = useForm({
    defaultValues: { testField: '' },
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="testField"
        render={() => (
          <FormItem>
            <TestFormField />
          </FormItem>
        )}
      />
    </Form>
  );
};

describe('Form Components', () => {
  describe('Form Provider', () => {
    it('renders without crashing', () => {
      render(<TestForm />);
      expect(screen.getByTestId('test-form')).toBeInTheDocument();
    });

    it('provides form context to child components', () => {
      render(<TestForm />);
      
      // Form fields should render
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });
  });

  describe('FormField', () => {
    it('renders form field with all components', () => {
      render(<TestForm />);
      
      // Check that all form components are rendered
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
      expect(screen.getByText('This is your public display name.')).toBeInTheDocument();
    });

    it('handles field validation', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      
      render(<TestForm onSubmit={onSubmit} />);
      
      // Try to submit without filling required fields
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      
      render(<TestForm onSubmit={onSubmit} />);
      
      // Fill username but invalid email
      await user.type(screen.getByPlaceholderText('Enter username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter email'), 'invalid-email');
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
      
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      
      render(<TestForm onSubmit={onSubmit} />);
      
      // Fill valid data
      await user.type(screen.getByPlaceholderText('Enter username'), 'testuser');
      await user.type(screen.getByPlaceholderText('Enter email'), 'test@example.com');
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
        });
      });
    });
  });

  describe('FormItem', () => {
    it('renders with proper spacing classes', () => {
      render(<TestForm />);
      
      const formItems = screen.getAllByRole('textbox').map(input => 
        input.closest('[class*="space-y"]')
      );
      
      formItems.forEach(item => {
        expect(item).toHaveClass('space-y-2');
      });
    });

    it('applies custom className', () => {
      const TestFormWithCustomClass = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem className="custom-form-item" data-testid="form-item">
                  <FormControl>
                    <Input />
                  </FormControl>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestFormWithCustomClass />);
      expect(screen.getByTestId('form-item')).toHaveClass('custom-form-item');
    });
  });

  describe('FormLabel', () => {
    it('renders label text correctly', () => {
      render(<TestForm />);
      
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('associates label with form control', () => {
      render(<TestForm />);
      
      const usernameInput = screen.getByPlaceholderText('Enter username');
      const usernameLabel = screen.getByText('Username');
      
      expect(usernameLabel).toHaveAttribute('for', usernameInput.id);
    });

    it('applies error styling when field has error', async () => {
      const user = userEvent.setup();
      
      render(<TestForm />);
      
      // Trigger validation error
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      await waitFor(() => {
        const usernameLabel = screen.getByText('Username');
        expect(usernameLabel).toHaveClass('text-destructive');
      });
    });
  });

  describe('FormControl', () => {
    it('applies proper ARIA attributes', () => {
      render(<TestForm />);
      
      const usernameInput = screen.getByPlaceholderText('Enter username');
      
      expect(usernameInput).toHaveAttribute('aria-describedby');
      expect(usernameInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('updates ARIA attributes when field has error', async () => {
      const user = userEvent.setup();
      
      render(<TestForm />);
      
      const usernameInput = screen.getByPlaceholderText('Enter username');
      
      // Trigger validation error
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      await waitFor(() => {
        expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });
  });

  describe('FormDescription', () => {
    it('renders description text', () => {
      render(<TestForm />);
      
      expect(screen.getByText('This is your public display name.')).toBeInTheDocument();
    });

    it('has proper ID for ARIA association', () => {
      render(<TestForm />);
      
      const description = screen.getByText('This is your public display name.');
      const usernameInput = screen.getByPlaceholderText('Enter username');
      
      expect(description).toHaveAttribute('id');
      expect(usernameInput.getAttribute('aria-describedby')).toContain(
        description.getAttribute('id')
      );
    });

    it('applies custom className', () => {
      const TestFormWithCustomDescription = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormDescription className="custom-description" data-testid="description">
                    Custom description
                  </FormDescription>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestFormWithCustomDescription />);
      expect(screen.getByTestId('description')).toHaveClass('custom-description');
    });
  });

  describe('FormMessage', () => {
    it('does not render when no error', () => {
      render(<TestForm />);
      
      expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
    });

    it('renders error message when field has error', async () => {
      const user = userEvent.setup();
      
      render(<TestForm />);
      
      // Trigger validation error
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      await waitFor(() => {
        expect(screen.getByText('Username is required')).toBeInTheDocument();
      });
    });

    it('renders custom children when provided', () => {
      const TestFormWithCustomMessage = () => {
        const form = useForm({ defaultValues: { test: '' } });
        
        return (
          <Form {...form}>
            <FormField
              control={form.control}
              name="test"
              render={() => (
                <FormItem>
                  <FormMessage>Custom message content</FormMessage>
                </FormItem>
              )}
            />
          </Form>
        );
      };
      
      render(<TestFormWithCustomMessage />);
      expect(screen.getByText('Custom message content')).toBeInTheDocument();
    });

    it('has proper ID for ARIA association', async () => {
      const user = userEvent.setup();
      
      render(<TestForm />);
      
      // Trigger validation error
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Username is required');
        const usernameInput = screen.getByPlaceholderText('Enter username');
        
        expect(errorMessage).toHaveAttribute('id');
        expect(usernameInput.getAttribute('aria-describedby')).toContain(
          errorMessage.getAttribute('id')
        );
      });
    });
  });

  describe('useFormField Hook', () => {
    it('provides form field context', () => {
      render(<TestFormWithFieldInfo />);
      
      expect(screen.getByTestId('field-name')).toHaveTextContent('testField');
      expect(screen.getByTestId('field-id')).toHaveTextContent(/^.+$/); // Should have some ID
      expect(screen.getByTestId('form-item-id')).toHaveTextContent(/form-item$/);
      expect(screen.getByTestId('form-description-id')).toHaveTextContent(/description$/);
      expect(screen.getByTestId('form-message-id')).toHaveTextContent(/message$/);
    });

    it('throws error when used outside FormField', () => {
      const TestComponentOutsideForm = () => {
        try {
          useFormField();
          return <div>Should not render</div>;
        } catch (error) {
          return <div data-testid="error">Error caught</div>;
        }
      };
      
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => render(<TestComponentOutsideForm />)).toThrow();
      
      consoleSpy.mockRestore();
    });

    it('provides field state information', async () => {
      const TestFormWithValidation = () => {
        const form = useForm({
          defaultValues: { testField: '' },
        });

        return (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(() => {})}>
              <FormField
                control={form.control}
                name="testField"
                rules={{ required: 'Field is required' }}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <TestFormField />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        );
      };

      const user = userEvent.setup();
      render(<TestFormWithValidation />);
      
      // Initially no error
      expect(screen.getByTestId('field-invalid')).toHaveTextContent('false');
      expect(screen.getByTestId('field-error')).toHaveTextContent('no-error');
      
      // Trigger validation
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      await waitFor(() => {
        expect(screen.getByTestId('field-invalid')).toHaveTextContent('true');
        expect(screen.getByTestId('field-error')).toHaveTextContent('Field is required');
      });
    });
  });

  describe('Integration with Default Values', () => {
    it('renders with default values', () => {
      render(
        <TestForm 
          defaultValues={{ 
            username: 'defaultuser', 
            email: 'default@example.com' 
          }} 
        />
      );
      
      expect(screen.getByDisplayValue('defaultuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('default@example.com')).toBeInTheDocument();
    });

    it('validates default values on submit', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      
      render(
        <TestForm 
          onSubmit={onSubmit}
          defaultValues={{ 
            username: 'validuser', 
            email: 'valid@example.com' 
          }} 
        />
      );
      
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          username: 'validuser',
          email: 'valid@example.com',
        });
      });
    });
  });

  describe('Accessibility', () => {
    it('maintains proper form structure', () => {
      render(<TestForm />);
      
      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
      
      const inputs = screen.getAllByRole('textbox');
      expect(inputs).toHaveLength(2);
      
      const button = screen.getByRole('button', { name: 'Submit' });
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('provides proper labeling', () => {
      render(<TestForm />);
      
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup();
      
      render(<TestForm />);
      
      await user.click(screen.getByRole('button', { name: 'Submit' }));
      
      await waitFor(() => {
        const usernameInput = screen.getByLabelText('Username');
        expect(usernameInput).toHaveAttribute('aria-invalid', 'true');
        
        const errorMessage = screen.getByText('Username is required');
        expect(errorMessage).toHaveAttribute('id');
        expect(usernameInput.getAttribute('aria-describedby')).toContain(
          errorMessage.getAttribute('id')
        );
      });
    });
  });
});