import { describe, it, expect } from 'vitest';
import { 
  validators, 
  validateField, 
  validateForm, 
  sanitizeInput, 
  formatErrorMessage,
  FormManager 
} from '../form-validation';

describe('Form Validation Utilities', () => {
  describe('validators', () => {
    describe('required', () => {
      it('should return error for empty values', () => {
        expect(validators.required('')).toBe('This field is required');
        expect(validators.required(null)).toBe('This field is required');
        expect(validators.required(undefined)).toBe('This field is required');
        expect(validators.required([])).toBe('This field is required');
      });

      it('should return null for non-empty values', () => {
        expect(validators.required('test')).toBeNull();
        expect(validators.required(0)).toBeNull();
        expect(validators.required(false)).toBeNull();
        expect(validators.required(['item'])).toBeNull();
      });
    });

    describe('email', () => {
      it('should validate email addresses', () => {
        expect(validators.email('test@example.com')).toBeNull();
        expect(validators.email('user.name+tag@domain.co.uk')).toBeNull();
        
        expect(validators.email('invalid-email')).toBe('Please enter a valid email address');
        expect(validators.email('test@')).toBe('Please enter a valid email address');
        expect(validators.email('@example.com')).toBe('Please enter a valid email address');
      });

      it('should return null for empty values', () => {
        expect(validators.email('')).toBeNull();
        expect(validators.email(null)).toBeNull();
      });
    });

    describe('phone', () => {
      it('should validate Kenyan phone numbers', () => {
        expect(validators.phone('+254712345678')).toBeNull();
        expect(validators.phone('0712345678')).toBeNull();
        expect(validators.phone('+254 712 345 678')).toBeNull();
        
        expect(validators.phone('123')).toBe('Please enter a valid Kenyan phone number');
        expect(validators.phone('+1234567890')).toBe('Please enter a valid Kenyan phone number');
      });
    });

    describe('minLength', () => {
      it('should validate minimum length', () => {
        expect(validators.minLength('test', 3)).toBeNull();
        expect(validators.minLength('test', 4)).toBeNull();
        expect(validators.minLength('test', 5)).toBe('Must be at least 5 characters long');
      });
    });

    describe('maxLength', () => {
      it('should validate maximum length', () => {
        expect(validators.maxLength('test', 5)).toBeNull();
        expect(validators.maxLength('test', 4)).toBeNull();
        expect(validators.maxLength('test', 3)).toBe('Must be no more than 3 characters long');
      });
    });

    describe('numeric', () => {
      it('should validate numeric values', () => {
        expect(validators.numeric('123')).toBeNull();
        expect(validators.numeric('123.45')).toBeNull();
        expect(validators.numeric('-123')).toBeNull();
        
        expect(validators.numeric('abc')).toBe('Please enter a valid number');
        expect(validators.numeric('12.34.56')).toBe('Please enter a valid number');
      });
    });

    describe('min/max', () => {
      it('should validate numeric ranges', () => {
        expect(validators.min(5, 3)).toBeNull();
        expect(validators.min(3, 3)).toBeNull();
        expect(validators.min(2, 3)).toBe('Value must be at least 3');

        expect(validators.max(3, 5)).toBeNull();
        expect(validators.max(5, 5)).toBeNull();
        expect(validators.max(6, 5)).toBe('Value must be no more than 5');
      });

      it('should handle string numbers', () => {
        expect(validators.min('5', 3)).toBeNull();
        expect(validators.max('3', 5)).toBeNull();
      });
    });

    describe('fileSize', () => {
      it('should validate file sizes', () => {
        const smallFile = new File(['content'], 'test.txt', { type: 'text/plain' });
        Object.defineProperty(smallFile, 'size', { value: 1000 });
        
        const largeFile = new File(['content'], 'test.txt', { type: 'text/plain' });
        Object.defineProperty(largeFile, 'size', { value: 2000 });

        expect(validators.fileSize(smallFile, 1500)).toBeNull();
        expect(validators.fileSize(largeFile, 1500)).toBe('File size must be less than 0.0MB');
      });
    });

    describe('fileType', () => {
      it('should validate file types', () => {
        const textFile = new File(['content'], 'test.txt', { type: 'text/plain' });
        const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

        expect(validators.fileType(textFile, ['text/plain'])).toBeNull();
        expect(validators.fileType(imageFile, ['text/plain'])).toBe('File type must be one of: text/plain');
      });
    });
  });

  describe('validateField', () => {
    it('should validate single field with multiple rules', () => {
      const rules = {
        required: true,
        minLength: 3,
        maxLength: 10,
        email: true
      };

      expect(validateField('', rules)).toBe('This field is required');
      expect(validateField('ab', rules)).toBe('Must be at least 3 characters long');
      expect(validateField('invalid-email', rules)).toBe('Must be no more than 10 characters long');
      expect(validateField('a@b.co', rules)).toBeNull();
    });

    it('should skip other validations if required fails', () => {
      const rules = {
        required: true,
        minLength: 10
      };

      expect(validateField('', rules)).toBe('This field is required');
    });

    it('should skip validations for empty non-required fields', () => {
      const rules = {
        minLength: 10,
        email: true
      };

      expect(validateField('', rules)).toBeNull();
    });
  });

  describe('validateForm', () => {
    it('should validate entire form', () => {
      const fields = {
        name: {
          name: 'name',
          value: '',
          rules: { required: true }
        },
        email: {
          name: 'email',
          value: 'invalid-email',
          rules: { required: true, email: true }
        },
        phone: {
          name: 'phone',
          value: '+254712345678',
          rules: { phone: true }
        }
      };

      const result = validateForm(fields);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual({
        name: 'This field is required',
        email: 'Please enter a valid email address'
      });
    });

    it('should return valid for correct form', () => {
      const fields = {
        name: {
          name: 'name',
          value: 'John Doe',
          rules: { required: true }
        },
        email: {
          name: 'email',
          value: 'john@example.com',
          rules: { required: true, email: true }
        }
      };

      const result = validateForm(fields);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize HTML characters', () => {
      expect(sanitizeInput('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      
      expect(sanitizeInput('Hello & goodbye'))
        .toBe('Hello &amp; goodbye');
      
      expect(sanitizeInput("It's a test"))
        .toBe('It&#x27;s a test');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeInput(123)).toBe('123');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format error messages with field names', () => {
      expect(formatErrorMessage('This field is required', 'firstName'))
        .toBe('First name is required');
      
      expect(formatErrorMessage('This field is invalid', 'emailAddress'))
        .toBe('Email address is invalid');
      
      expect(formatErrorMessage('This field must be longer', 'user_name'))
        .toBe('User name must be longer');
    });
  });

  describe('FormManager', () => {
    it('should initialize with correct state', () => {
      const initialFields = {
        name: { name: 'name', value: '' },
        email: { name: 'email', value: '', rules: { required: true, email: true } }
      };

      const manager = new FormManager(initialFields);
      const state = manager.getState();

      expect(state.isValid).toBe(true);
      expect(state.isDirty).toBe(false);
      expect(state.isSubmitting).toBe(false);
      expect(state.errors).toEqual({});
    });

    it('should update field values and validate', () => {
      const initialFields = {
        email: { name: 'email', value: '', rules: { required: true, email: true } }
      };

      const manager = new FormManager(initialFields);
      
      // Set invalid email
      manager.setFieldValue('email', 'invalid-email');
      manager.setFieldTouched('email', true);
      
      const state = manager.getState();
      expect(state.isValid).toBe(false);
      expect(state.errors.email).toBe('Please enter a valid email address');
      expect(state.isDirty).toBe(true);
    });

    it('should validate all fields', () => {
      const initialFields = {
        name: { name: 'name', value: '', rules: { required: true } },
        email: { name: 'email', value: '', rules: { required: true, email: true } }
      };

      const manager = new FormManager(initialFields);
      
      const isValid = manager.validateAll();
      const state = manager.getState();
      
      expect(isValid).toBe(false);
      expect(state.errors).toEqual({
        name: 'This field is required',
        email: 'This field is required'
      });
    });

    it('should reset form state', () => {
      const initialFields = {
        name: { name: 'name', value: '' }
      };

      const manager = new FormManager(initialFields);
      
      // Make changes
      manager.setFieldValue('name', 'John');
      manager.setFieldTouched('name', true);
      
      // Reset
      manager.reset();
      
      const state = manager.getState();
      expect(state.fields.name.value).toBe('');
      expect(state.fields.name.touched).toBeUndefined();
      expect(state.isDirty).toBe(false);
      expect(state.errors).toEqual({});
    });

    it('should handle field errors correctly', () => {
      const initialFields = {
        name: { name: 'name', value: '', rules: { required: true } }
      };

      const manager = new FormManager(initialFields);
      
      // Field not touched, should not show error
      expect(manager.getFieldError('name')).toBeUndefined();
      expect(manager.hasFieldError('name')).toBe(false);
      
      // Touch field, should show error
      manager.setFieldTouched('name', true);
      expect(manager.getFieldError('name')).toBe('This field is required');
      expect(manager.hasFieldError('name')).toBe(true);
      
      // Fix error
      manager.setFieldValue('name', 'John');
      expect(manager.getFieldError('name')).toBeUndefined();
      expect(manager.hasFieldError('name')).toBe(false);
    });

    it('should handle non-existent fields gracefully', () => {
      const manager = new FormManager({});
      
      expect(manager.getFieldError('nonexistent')).toBeUndefined();
      expect(manager.hasFieldError('nonexistent')).toBe(false);
      
      // These should not throw errors
      manager.setFieldValue('nonexistent', 'value');
      manager.setFieldTouched('nonexistent', true);
    });
  });
});