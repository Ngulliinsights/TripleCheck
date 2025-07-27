/**
 * Validation Utilities Tests
 * Comprehensive testing for form validation functions
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  validateEmail,
  validatePassword,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumericRange,
  validateFileType,
  validateFileSize,
  validatePhoneNumber,
  validateUrl,
  createValidator,
  combineValidators,
  ValidationResult,
  ValidationRule,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        '',
        'user name@domain.com',
      ];

      invalidEmails.forEach(email => {
        const result = validateEmail(email);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Please enter a valid email address');
      });
    });

    it('should handle custom error messages', () => {
      const customMessage = 'Custom email error';
      const result = validateEmail('invalid', customMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(customMessage);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'StrongPass123!',
        'MySecure@Password1',
        'Complex#Pass2023',
      ];

      strongPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'PASSWORD',
        'Pass123',
        'NoSpecialChar123',
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Password must');
      });
    });

    it('should validate with custom requirements', () => {
      const options = {
        minLength: 6,
        requireUppercase: false,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
      };

      const result = validatePassword('simple123', undefined, options);
      expect(result.isValid).toBe(true);
    });

    it('should provide specific error messages', () => {
      const result = validatePassword('short');
      expect(result.error).toContain('at least 8 characters');

      const result2 = validatePassword('nouppercase123!');
      expect(result2.error).toContain('uppercase letter');

      const result3 = validatePassword('NoNumbers!');
      expect(result3.error).toContain('number');
    });
  });

  describe('validateRequired', () => {
    it('should validate non-empty values', () => {
      const validValues = ['text', 123, true, ['item'], { key: 'value' }];

      validValues.forEach(value => {
        const result = validateRequired(value);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty values', () => {
      const emptyValues = ['', null, undefined, [], {}];

      emptyValues.forEach(value => {
        const result = validateRequired(value);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('This field is required');
      });
    });

    it('should handle whitespace-only strings', () => {
      const result = validateRequired('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This field is required');
    });

    it('should use custom error messages', () => {
      const customMessage = 'Custom required error';
      const result = validateRequired('', customMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(customMessage);
    });
  });

  describe('validateMinLength', () => {
    it('should validate strings meeting minimum length', () => {
      const result = validateMinLength('hello world', 5);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject strings below minimum length', () => {
      const result = validateMinLength('hi', 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Must be at least 5 characters long');
    });

    it('should handle arrays', () => {
      const result = validateMinLength(['a', 'b', 'c'], 2);
      expect(result.isValid).toBe(true);

      const result2 = validateMinLength(['a'], 2);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Must have at least 2 items');
    });

    it('should use custom error messages', () => {
      const customMessage = 'Too short!';
      const result = validateMinLength('hi', 5, customMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(customMessage);
    });
  });

  describe('validateMaxLength', () => {
    it('should validate strings within maximum length', () => {
      const result = validateMaxLength('hello', 10);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject strings exceeding maximum length', () => {
      const result = validateMaxLength('hello world', 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Must be no more than 5 characters long');
    });

    it('should handle arrays', () => {
      const result = validateMaxLength(['a', 'b'], 3);
      expect(result.isValid).toBe(true);

      const result2 = validateMaxLength(['a', 'b', 'c', 'd'], 3);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Must have no more than 3 items');
    });
  });

  describe('validateNumericRange', () => {
    it('should validate numbers within range', () => {
      const result = validateNumericRange(5, 1, 10);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject numbers below minimum', () => {
      const result = validateNumericRange(0, 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Must be at least 1');
    });

    it('should reject numbers above maximum', () => {
      const result = validateNumericRange(15, 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Must be at most 10');
    });

    it('should handle string numbers', () => {
      const result = validateNumericRange('5', 1, 10);
      expect(result.isValid).toBe(true);

      const result2 = validateNumericRange('15', 1, 10);
      expect(result2.isValid).toBe(false);
    });

    it('should reject non-numeric values', () => {
      const result = validateNumericRange('abc', 1, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Must be a valid number');
    });
  });

  describe('validateFileType', () => {
    const createMockFile = (name: string, type: string): File => {
      return new File(['content'], name, { type });
    };

    it('should validate allowed file types', () => {
      const file = createMockFile('image.jpg', 'image/jpeg');
      const result = validateFileType(file, ['image/jpeg', 'image/png']);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject disallowed file types', () => {
      const file = createMockFile('document.pdf', 'application/pdf');
      const result = validateFileType(file, ['image/jpeg', 'image/png']);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File type not allowed. Allowed types: image/jpeg, image/png');
    });

    it('should handle wildcard types', () => {
      const file = createMockFile('image.png', 'image/png');
      const result = validateFileType(file, ['image/*']);
      
      expect(result.isValid).toBe(true);
    });

    it('should handle file extensions', () => {
      const file = createMockFile('document.pdf', 'application/pdf');
      const result = validateFileType(file, ['.pdf', '.doc']);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    const createMockFile = (name: string, size: number): File => {
      const content = new Array(size).fill('a').join('');
      return new File([content], name);
    };

    it('should validate files within size limit', () => {
      const file = createMockFile('small.txt', 1024); // 1KB
      const result = validateFileSize(file, 2048); // 2KB limit
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject files exceeding size limit', () => {
      const file = createMockFile('large.txt', 3072); // 3KB
      const result = validateFileSize(file, 2048); // 2KB limit
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('File size must be less than 2.0 KB');
    });

    it('should format file sizes correctly', () => {
      const file = createMockFile('large.txt', 1048576 * 2); // 2MB
      const result = validateFileSize(file, 1048576); // 1MB limit
      
      expect(result.error).toBe('File size must be less than 1.0 MB');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      const validNumbers = [
        '+254712345678',
        '+1234567890',
        '0712345678',
        '(555) 123-4567',
        '555-123-4567',
      ];

      validNumbers.forEach(number => {
        const result = validatePhoneNumber(number);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = [
        '123',
        'abc',
        '++254712345678',
        '254712345678901234', // too long
      ];

      invalidNumbers.forEach(number => {
        const result = validatePhoneNumber(number);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Please enter a valid phone number');
      });
    });

    it('should validate with country-specific patterns', () => {
      const result = validatePhoneNumber('0712345678', 'KE');
      expect(result.isValid).toBe(true);

      const result2 = validatePhoneNumber('555-123-4567', 'US');
      expect(result2.isValid).toBe(true);
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://test.org',
        'https://sub.domain.com/path?query=value',
        'ftp://files.example.com',
      ];

      validUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'http://',
        'https://.',
        'ftp',
        'javascript:alert(1)',
      ];

      invalidUrls.forEach(url => {
        const result = validateUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Please enter a valid URL');
      });
    });

    it('should validate with protocol restrictions', () => {
      const result = validateUrl('https://example.com', ['https']);
      expect(result.isValid).toBe(true);

      const result2 = validateUrl('http://example.com', ['https']);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('URL must use one of these protocols: https');
    });
  });

  describe('createValidator', () => {
    it('should create custom validator function', () => {
      const isEven = createValidator(
        (value: number) => value % 2 === 0,
        'Number must be even'
      );

      const result1 = isEven(4);
      expect(result1.isValid).toBe(true);

      const result2 = isEven(3);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Number must be even');
    });

    it('should handle async validation', async () => {
      const asyncValidator = createValidator(
        async (value: string) => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return value === 'valid';
        },
        'Value is not valid'
      );

      const result1 = await asyncValidator('valid');
      expect(result1.isValid).toBe(true);

      const result2 = await asyncValidator('invalid');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('Value is not valid');
    });
  });

  describe('combineValidators', () => {
    it('should combine multiple validators', () => {
      const combinedValidator = combineValidators([
        validateRequired,
        (value: string) => validateMinLength(value, 3),
        (value: string) => validateMaxLength(value, 10),
      ]);

      const result1 = combinedValidator('hello');
      expect(result1.isValid).toBe(true);

      const result2 = combinedValidator('');
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('This field is required');

      const result3 = combinedValidator('hi');
      expect(result3.isValid).toBe(false);
      expect(result3.error).toBe('Must be at least 3 characters long');

      const result4 = combinedValidator('this is too long');
      expect(result4.isValid).toBe(false);
      expect(result4.error).toBe('Must be no more than 10 characters long');
    });

    it('should stop at first validation error', () => {
      const validator1 = vi.fn(() => ({ isValid: false, error: 'Error 1' }));
      const validator2 = vi.fn(() => ({ isValid: false, error: 'Error 2' }));

      const combinedValidator = combineValidators([validator1, validator2]);
      const result = combinedValidator('test');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Error 1');
      expect(validator1).toHaveBeenCalled();
      expect(validator2).not.toHaveBeenCalled();
    });

    it('should handle async validators', async () => {
      const asyncValidator1 = async (value: string): Promise<ValidationResult> => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { isValid: true };
      };

      const asyncValidator2 = async (value: string): Promise<ValidationResult> => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return { isValid: false, error: 'Async error' };
      };

      const combinedValidator = combineValidators([asyncValidator1, asyncValidator2]);
      const result = await combinedValidator('test');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Async error');
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should validate property listing form data', () => {
      const propertyValidator = combineValidators([
        validateRequired,
        (value: string) => validateMinLength(value, 10),
        (value: string) => validateMaxLength(value, 200),
      ]);

      const priceValidator = combineValidators([
        validateRequired,
        (value: string) => validateNumericRange(value, 1, 10000000),
      ]);

      // Test property title
      const titleResult = propertyValidator('Beautiful 2BR apartment in Nairobi');
      expect(titleResult.isValid).toBe(true);

      // Test price
      const priceResult = priceValidator('50000');
      expect(priceResult.isValid).toBe(true);

      // Test invalid price
      const invalidPriceResult = priceValidator('0');
      expect(invalidPriceResult.isValid).toBe(false);
    });

    it('should validate user registration form', () => {
      const emailValidator = validateEmail;
      const passwordValidator = validatePassword;
      const nameValidator = combineValidators([
        validateRequired,
        (value: string) => validateMinLength(value, 2),
        (value: string) => validateMaxLength(value, 50),
      ]);

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'SecurePass123!',
      };

      expect(nameValidator(userData.firstName).isValid).toBe(true);
      expect(nameValidator(userData.lastName).isValid).toBe(true);
      expect(emailValidator(userData.email).isValid).toBe(true);
      expect(passwordValidator(userData.password).isValid).toBe(true);
    });

    it('should validate file upload with multiple constraints', () => {
      const fileValidator = combineValidators([
        validateRequired,
        (file: File) => validateFileType(file, ['image/jpeg', 'image/png']),
        (file: File) => validateFileSize(file, 5 * 1024 * 1024), // 5MB
      ]);

      const validFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
      const result = fileValidator(validFile);
      expect(result.isValid).toBe(true);

      const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      const result2 = fileValidator(invalidFile);
      expect(result2.isValid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null and undefined values', () => {
      expect(validateEmail(null as any).isValid).toBe(false);
      expect(validateEmail(undefined as any).isValid).toBe(false);
      expect(validatePassword(null as any).isValid).toBe(false);
      expect(validateMinLength(null as any, 5).isValid).toBe(false);
    });

    it('should handle non-string values for string validators', () => {
      expect(validateEmail(123 as any).isValid).toBe(false);
      expect(validateMinLength(123 as any, 5).isValid).toBe(false);
      expect(validateMaxLength([] as any, 5).isValid).toBe(true); // Arrays have length
    });

    it('should handle empty arrays and objects', () => {
      expect(validateRequired([]).isValid).toBe(false);
      expect(validateRequired({}).isValid).toBe(false);
      expect(validateMinLength([], 1).isValid).toBe(false);
    });

    it('should handle very large numbers', () => {
      const result = validateNumericRange(Number.MAX_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER);
      expect(result.isValid).toBe(true);

      const result2 = validateNumericRange(Number.MAX_SAFE_INTEGER + 1, 0, Number.MAX_SAFE_INTEGER);
      expect(result2.isValid).toBe(false);
    });
  });
});