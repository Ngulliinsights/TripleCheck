import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFormValidation, usePropertyFormValidation, useUserRegistrationValidation } from '../useFormValidation';

describe('useFormValidation Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('initializes with default values', () => {
      const config = {
        username: { initialValue: 'testuser' },
        email: { initialValue: 'test@example.com' },
      };

      const { result } = renderHook(() => useFormValidation(config));

      expect(result.current.values).toEqual({
        username: 'testuser',
        email: 'test@example.com',
      });
      expect(result.current.errors).toEqual({
        username: null,
        email: null,
      });
      expect(result.current.touched).toEqual({
        username: false,
        email: false,
      });
      expect(result.current.dirty).toEqual({
        username: false,
        email: false,
      });
      expect(result.current.isValid).toBe(true);
      expect(result.current.isDirty).toBe(false);
    });

    it('handles empty initial values', () => {
      const config = {
        username: {},
        email: {},
      };

      const { result } = renderHook(() => useFormValidation(config));

      expect(result.current.values).toEqual({
        username: '',
        email: '',
      });
    });
  });

  describe('Value Management', () => {
    it('updates single field value', () => {
      const config = {
        username: { initialValue: '' },
      };

      const { result } = renderHook(() => useFormValidation(config));

      act(() => {
        result.current.setValue('username', 'newuser');
      });

      expect(result.current.values.username).toBe('newuser');
      expect(result.current.dirty.username).toBe(true);
      expect(result.current.isDirty).toBe(true);
    });

    it('updates multiple field values', () => {
      const config = {
        username: { initialValue: '' },
        email: { initialValue: '' },
      };

      const { result } = renderHook(() => useFormValidation(config));

      act(() => {
        result.current.setValues({
          username: 'testuser',
          email: 'test@example.com',
        });
      });

      expect(result.current.values).toEqual({
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('transforms values when transform function is provided', () => {
      const config = {
        price: {
          initialValue: 0,
          transform: (value: string) => Number(value) || 0,
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      act(() => {
        result.current.setValue('price', '1000');
      });

      expect(result.current.values.price).toBe(1000);
    });
  });

  describe('Validation Rules', () => {
    it('validates required fields', async () => {
      const config = {
        username: {
          initialValue: '',
          rules: { required: 'Username is required' },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      const isValid = await act(async () => {
        return await result.current.validateField('username');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.username).toBe('Username is required');
    });

    it('validates minimum length', async () => {
      const config = {
        password: {
          initialValue: '123',
          rules: {
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
          },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      const isValid = await act(async () => {
        return await result.current.validateField('password');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.password).toBe('Password must be at least 8 characters');
    });

    it('validates maximum length', async () => {
      const config = {
        bio: {
          initialValue: 'a'.repeat(101),
          rules: {
            maxLength: { value: 100, message: 'Bio must be no more than 100 characters' },
          },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      const isValid = await act(async () => {
        return await result.current.validateField('bio');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.bio).toBe('Bio must be no more than 100 characters');
    });

    it('validates numeric minimum', async () => {
      const config = {
        age: {
          initialValue: 15,
          rules: {
            min: { value: 18, message: 'Must be at least 18 years old' },
          },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      const isValid = await act(async () => {
        return await result.current.validateField('age');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.age).toBe('Must be at least 18 years old');
    });

    it('validates numeric maximum', async () => {
      const config = {
        score: {
          initialValue: 150,
          rules: {
            max: { value: 100, message: 'Score cannot exceed 100' },
          },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      const isValid = await act(async () => {
        return await result.current.validateField('score');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.score).toBe('Score cannot exceed 100');
    });

    it('validates pattern matching', async () => {
      const config = {
        phone: {
          initialValue: '123-456',
          rules: {
            pattern: {
              value: /^\d{3}-\d{3}-\d{4}$/,
              message: 'Phone must be in format XXX-XXX-XXXX',
            },
          },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      const isValid = await act(async () => {
        return await result.current.validateField('phone');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.phone).toBe('Phone must be in format XXX-XXX-XXXX');
    });

    it('validates email format', async () => {
      const config = {
        email: {
          initialValue: 'invalid-email',
          rules: { email: 'Invalid email format' },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      const isValid = await act(async () => {
        return await result.current.validateField('email');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.email).toBe('Invalid email format');
    });

    it('validates URL format', async () => {
      const config = {
        website: {
          initialValue: 'not-a-url',
          rules: { url: 'Invalid URL format' },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      const isValid = await act(async () => {
        return await result.current.validateField('website');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.website).toBe('Invalid URL format');
    });

    it('validates with custom function', async () => {
      const config = {
        username: {
          initialValue: 'admin',
          rules: {
            custom: (value: string) => {
              return value !== 'admin' || 'Username cannot be admin';
            },
          },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      const isValid = await act(async () => {
        return await result.current.validateField('username');
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.username).toBe('Username cannot be admin');
    });

    it('handles async validation', async () => {
      const config = {
        email: {
          initialValue: 'taken@example.com',
          rules: {
            asyncValidator: async (email: string) => {
              await new Promise(resolve => setTimeout(resolve, 100));
              return email === 'taken@example.com' ? 'Email is already taken' : true;
            },
          },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      let isValid: boolean;
      await act(async () => {
        isValid = await result.current.validateField('email');
      });

      expect(isValid!).toBe(false);
      expect(result.current.errors.email).toBe('Email is already taken');
    });
  });

  describe('Validation Triggers', () => {
    it('validates on change when configured', async () => {
      const config = {
        username: {
          initialValue: '',
          rules: { required: 'Username is required' },
          validateOnChange: true,
          debounceMs: 100,
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      act(() => {
        result.current.setValue('username', '');
      });

      // Wait for debounced validation
      act(() => {
        vi.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(result.current.errors.username).toBe('Username is required');
      });
    });

    it('validates on blur when configured', async () => {
      const config = {
        email: {
          initialValue: '',
          rules: { required: 'Email is required' },
          validateOnBlur: true,
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      await act(async () => {
        const blurHandler = result.current.handleBlur('email');
        blurHandler({} as React.FocusEvent);
      });

      expect(result.current.touched.email).toBe(true);
      expect(result.current.errors.email).toBe('Email is required');
    });
  });

  describe('Form Submission', () => {
    it('validates entire form on submit', async () => {
      const config = {
        username: {
          initialValue: '',
          rules: { required: 'Username is required' },
        },
        email: {
          initialValue: '',
          rules: { required: 'Email is required' },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      const isValid = await act(async () => {
        return await result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.username).toBe('Username is required');
      expect(result.current.errors.email).toBe('Email is required');
    });

    it('calls onSubmit with valid data', async () => {
      const onSubmit = vi.fn();
      const config = {
        username: { initialValue: 'testuser' },
        email: { initialValue: 'test@example.com' },
      };

      const { result } = renderHook(() => useFormValidation(config));

      await act(async () => {
        const submitHandler = result.current.handleSubmit(onSubmit);
        await submitHandler({ preventDefault: vi.fn() } as any);
      });

      expect(onSubmit).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    it('does not call onSubmit with invalid data', async () => {
      const onSubmit = vi.fn();
      const config = {
        username: {
          initialValue: '',
          rules: { required: 'Username is required' },
        },
      };

      const { result } = renderHook(() => useFormValidation(config));

      await act(async () => {
        const submitHandler = result.current.handleSubmit(onSubmit);
        await submitHandler({ preventDefault: vi.fn() } as any);
      });

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('marks all fields as touched on submit', async () => {
      const config = {
        username: { initialValue: '' },
        email: { initialValue: '' },
      };

      const { result } = renderHook(() => useFormValidation(config));

      await act(async () => {
        const submitHandler = result.current.handleSubmit(() => {});
        await submitHandler({ preventDefault: vi.fn() } as any);
      });

      expect(result.current.touched.username).toBe(true);
      expect(result.current.touched.email).toBe(true);
    });
  });

  describe('Form Reset', () => {
    it('resets entire form to initial state', () => {
      const config = {
        username: { initialValue: 'initial' },
        email: { initialValue: 'initial@example.com' },
      };

      const { result } = renderHook(() => useFormValidation(config));

      // Make changes
      act(() => {
        result.current.setValue('username', 'changed');
        result.current.setTouched('username', true);
        result.current.setError('username', 'Some error');
      });

      // Reset form
      act(() => {
        result.current.resetForm();
      });

      expect(result.current.values.username).toBe('initial');
      expect(result.current.touched.username).toBe(false);
      expect(result.current.errors.username).toBe(null);
      expect(result.current.dirty.username).toBe(false);
    });

    it('resets single field to initial state', () => {
      const config = {
        username: { initialValue: 'initial' },
      };

      const { result } = renderHook(() => useFormValidation(config));

      // Make changes
      act(() => {
        result.current.setValue('username', 'changed');
        result.current.setTouched('username', true);
        result.current.setError('username', 'Some error');
      });

      // Reset field
      act(() => {
        result.current.resetField('username');
      });

      expect(result.current.values.username).toBe('initial');
      expect(result.current.touched.username).toBe(false);
      expect(result.current.errors.username).toBe(null);
      expect(result.current.dirty.username).toBe(false);
    });
  });

  describe('Event Handlers', () => {
    it('handles input change events', () => {
      const config = {
        username: { initialValue: '' },
      };

      const { result } = renderHook(() => useFormValidation(config));

      act(() => {
        const changeHandler = result.current.handleChange('username');
        changeHandler({
          target: { value: 'newvalue', type: 'text' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.values.username).toBe('newvalue');
    });

    it('handles checkbox change events', () => {
      const config = {
        agree: { initialValue: false },
      };

      const { result } = renderHook(() => useFormValidation(config));

      act(() => {
        const changeHandler = result.current.handleChange('agree');
        changeHandler({
          target: { checked: true, type: 'checkbox' },
        } as React.ChangeEvent<HTMLInputElement>);
      });

      expect(result.current.values.agree).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('cleans up timers on unmount', () => {
      const config = {
        username: {
          initialValue: '',
          validateOnChange: true,
          debounceMs: 500,
        },
      };

      const { result, unmount } = renderHook(() => useFormValidation(config));

      act(() => {
        result.current.setValue('username', 'test');
      });

      // Unmount before debounce completes
      unmount();

      // Should not cause any issues
      act(() => {
        vi.advanceTimersByTime(500);
      });
    });

    it('cancels async validations on unmount', async () => {
      const config = {
        email: {
          initialValue: '',
          rules: {
            asyncValidator: async () => {
              await new Promise(resolve => setTimeout(resolve, 1000));
              return true;
            },
          },
        },
      };

      const { result, unmount } = renderHook(() => useFormValidation(config));

      // Start async validation
      act(() => {
        result.current.validateField('email');
      });

      // Unmount before validation completes
      unmount();

      // Should not cause any issues
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    });
  });
});

describe('usePropertyFormValidation Hook', () => {
  it('initializes with property-specific validation rules', () => {
    const { result } = renderHook(() => usePropertyFormValidation());

    expect(result.current.values).toHaveProperty('title');
    expect(result.current.values).toHaveProperty('description');
    expect(result.current.values).toHaveProperty('price');
    expect(result.current.values).toHaveProperty('location');
    expect(result.current.values).toHaveProperty('bedrooms');
    expect(result.current.values).toHaveProperty('bathrooms');
    expect(result.current.values).toHaveProperty('propertyType');
    expect(result.current.values).toHaveProperty('contactEmail');
    expect(result.current.values).toHaveProperty('contactPhone');
  });

  it('validates property title requirements', async () => {
    const { result } = renderHook(() => usePropertyFormValidation());

    // Test too short title
    act(() => {
      result.current.setValue('title', 'Short');
    });

    const isValid = await act(async () => {
      return await result.current.validateField('title');
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.title).toBe('Title must be at least 10 characters');
  });

  it('validates price as number', async () => {
    const { result } = renderHook(() => usePropertyFormValidation());

    act(() => {
      result.current.setValue('price', 'not-a-number');
    });

    const isValid = await act(async () => {
      return await result.current.validateField('price');
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.price).toBe('Price must be a valid number');
  });

  it('validates Kenyan phone number format', async () => {
    const { result } = renderHook(() => usePropertyFormValidation());

    act(() => {
      result.current.setValue('contactPhone', '123-456-7890');
    });

    const isValid = await act(async () => {
      return await result.current.validateField('contactPhone');
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.contactPhone).toBe('Please enter a valid Kenyan phone number');
  });
});

describe('useUserRegistrationValidation Hook', () => {
  it('initializes with user registration validation rules', () => {
    const { result } = renderHook(() => useUserRegistrationValidation());

    expect(result.current.values).toHaveProperty('firstName');
    expect(result.current.values).toHaveProperty('lastName');
    expect(result.current.values).toHaveProperty('email');
    expect(result.current.values).toHaveProperty('password');
    expect(result.current.values).toHaveProperty('confirmPassword');
    expect(result.current.values).toHaveProperty('phone');
    expect(result.current.values).toHaveProperty('agreeToTerms');
  });

  it('validates password complexity', async () => {
    const { result } = renderHook(() => useUserRegistrationValidation());

    act(() => {
      result.current.setValue('password', 'weak');
    });

    const isValid = await act(async () => {
      return await result.current.validateField('password');
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.password).toContain('uppercase letter');
  });

  it('validates password confirmation match', async () => {
    const { result } = renderHook(() => useUserRegistrationValidation());

    act(() => {
      result.current.setValue('password', 'StrongPass123!');
      result.current.setValue('confirmPassword', 'DifferentPass123!');
    });

    const isValid = await act(async () => {
      return await result.current.validateField('confirmPassword');
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.confirmPassword).toBe('Passwords do not match');
  });

  it('validates terms agreement', async () => {
    const { result } = renderHook(() => useUserRegistrationValidation());

    act(() => {
      result.current.setValue('agreeToTerms', false);
    });

    const isValid = await act(async () => {
      return await result.current.validateField('agreeToTerms');
    });

    expect(isValid).toBe(false);
    expect(result.current.errors.agreeToTerms).toBe('You must agree to the terms and conditions');
  });
});