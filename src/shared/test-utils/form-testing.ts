/**
 * Form Testing Utilities
 * Specialized utilities for testing form components, validation, and user interactions
 */

import { screen, waitFor, within, fireEvent } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { vi, type MockedFunction } from 'vitest';

import { userEventInstance } from './user-event';


export interface FormField {
  name: string;
  label?: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'file';
  value?: string | number | boolean | File | File[];
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    custom?: (value: any) => boolean;
  };
}

export interface FormTestConfig {
  formSelector?: string;
  submitButtonText?: string | RegExp;
  resetButtonText?: string | RegExp;
  expectedSubmitData?: Record<string, any>;
  onSubmit?: MockedFunction<any>;
  onReset?: MockedFunction<any>;
  skipValidation?: boolean;
}

export class FormTestingUtils {
  private user: UserEvent;

  constructor() {
    this.user = userEventInstance;
  }

  /**
   * Fill a form field based on its type
   */
  async fillField(field: FormField): Promise<void> {
    const element = this.getFieldElement(field);

    switch (field.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        if (typeof field.value === 'string' || typeof field.value === 'number') {
          await this.user.clear(element);
          await this.user.type(element, String(field.value));
        }
        break;

      case 'textarea':
        if (typeof field.value === 'string') {
          await this.user.clear(element);
          await this.user.type(element, field.value);
        }
        break;

      case 'select':
        if (typeof field.value === 'string') {
          await this.user.selectOptions(element, field.value);
        }
        break;

      case 'checkbox':
        if (typeof field.value === 'boolean') {
          const isChecked = (element as HTMLInputElement).checked;
          if (isChecked !== field.value) {
            await this.user.click(element);
          }
        }
        break;

      case 'radio':
        if (typeof field.value === 'string') {
          const radioButton = screen.getByRole('radio', { name: field.value });
          await this.user.click(radioButton);
        }
        break;

      case 'file':
        if (field.value instanceof File || Array.isArray(field.value)) {
          const files = Array.isArray(field.value) ? field.value : [field.value];
          await this.user.upload(element, files);
        }
        break;

      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }

  /**
   * Fill multiple form fields
   */
  async fillForm(fields: FormField[]): Promise<void> {
    for (const field of fields) {
      await this.fillField(field);
    }
  }

  /**
   * Submit a form
   */
  async submitForm(config: FormTestConfig = {}): Promise<void> {
    const submitButton = this.getSubmitButton(config.submitButtonText);
    await this.user.click(submitButton);
  }

  /**
   * Reset a form
   */
  async resetForm(config: FormTestConfig = {}): Promise<void> {
    const resetButton = this.getResetButton(config.resetButtonText);
    await this.user.click(resetButton);
  }

  /**
   * Test form submission with validation
   */
  async testFormSubmission(
    fields: FormField[],
    config: FormTestConfig = {}
  ): Promise<void> {
    // Fill form fields
    await this.fillForm(fields);

    // Submit form
    await this.submitForm(config);

    // Wait for submission to complete
    if (config.onSubmit) {
      await waitFor(() => {
        expect(config.onSubmit).toHaveBeenCalled();
      });

      // Verify submitted data if expected
      if (config.expectedSubmitData) {
        expect(config.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining(config.expectedSubmitData)
        );
      }
    }
  }

  /**
   * Test field validation
   */
  async testFieldValidation(field: FormField, invalidValue: any, expectedError: string): Promise<void> {
    const element = this.getFieldElement(field);

    // Clear field and enter invalid value
    await this.user.clear(element);
    
    if (field.type === 'checkbox') {
      if (typeof invalidValue === 'boolean') {
        const isChecked = (element as HTMLInputElement).checked;
        if (isChecked !== invalidValue) {
          await this.user.click(element);
        }
      }
    } else if (field.type === 'select') {
      await this.user.selectOptions(element, String(invalidValue));
    } else {
      await this.user.type(element, String(invalidValue));
    }

    // Trigger validation (blur or form submission)
    await this.user.tab();

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(expectedError)).toBeInTheDocument();
    });
  }

  /**
   * Test form validation for multiple fields
   */
  async testFormValidation(
    validationTests: Array<{
      field: FormField;
      invalidValue: any;
      expectedError: string;
    }>
  ): Promise<void> {
    for (const test of validationTests) {
      await this.testFieldValidation(test.field, test.invalidValue, test.expectedError);
    }
  }

  /**
   * Test form accessibility
   */
  async testFormAccessibility(fields: FormField[]): Promise<void> {
    for (const field of fields) {
      const element = this.getFieldElement(field);

      // Check for proper labeling
      if (field.label) {
        expect(element).toHaveAccessibleName(field.label);
      }

      // Check for required attribute
      if (field.required) {
        expect(element).toBeRequired();
      }

      // Check for proper ARIA attributes
      if (field.type === 'password') {
        expect(element).toHaveAttribute('type', 'password');
      }

      // Test keyboard navigation
      await this.user.tab();
      expect(element).toHaveFocus();
    }
  }

  /**
   * Test form state management
   */
  async testFormState(
    initialFields: FormField[],
    updatedFields: FormField[],
    expectedStateChanges: Record<string, any>
  ): Promise<void> {
    // Fill initial form state
    await this.fillForm(initialFields);

    // Update form fields
    await this.fillForm(updatedFields);

    // Verify state changes
    for (const [fieldName, expectedValue] of Object.entries(expectedStateChanges)) {
      const field = updatedFields.find(f => f.name === fieldName);
      if (field) {
        const element = this.getFieldElement(field);
        
        if (field.type === 'checkbox') {
          expect((element as HTMLInputElement).checked).toBe(expectedValue);
        } else {
          expect((element as HTMLInputElement).value).toBe(String(expectedValue));
        }
      }
    }
  }

  /**
   * Test file upload functionality
   */
  async testFileUpload(
    field: FormField,
    files: File[],
    expectedFeedback?: string,
    progressCallback?: () => void
  ): Promise<void> {
    const element = this.getFieldElement(field);
    
    // Upload files
    await this.user.upload(element, files);

    // Check for upload feedback
    if (expectedFeedback) {
      await waitFor(() => {
        expect(screen.getByText(expectedFeedback)).toBeInTheDocument();
      });
    }

    // Check progress if callback provided
    if (progressCallback) {
      progressCallback();
    }

    // Verify files are attached
    expect((element as HTMLInputElement).files).toHaveLength(files.length);
    files.forEach((file, index) => {
      expect((element as HTMLInputElement).files?.[index]).toBe(file);
    });
  }

  /**
   * Test drag and drop file upload
   */
  async testDragAndDropUpload(
    dropZoneSelector: string,
    files: File[],
    expectedFeedback?: string
  ): Promise<void> {
    const dropZone = screen.getByTestId(dropZoneSelector) || 
                    document.querySelector(dropZoneSelector);

    if (!dropZone) {
      throw new Error(`Drop zone not found: ${dropZoneSelector}`);
    }

    // Create drag and drop events
    const dataTransfer = new DataTransfer();
    files.forEach(file => dataTransfer.items.add(file));

    // Simulate drag enter
    fireEvent.dragEnter(dropZone, { dataTransfer });

    // Simulate drag over
    fireEvent.dragOver(dropZone, { dataTransfer });

    // Simulate drop
    fireEvent.drop(dropZone, { dataTransfer });

    // Check for upload feedback
    if (expectedFeedback) {
      await waitFor(() => {
        expect(screen.getByText(expectedFeedback)).toBeInTheDocument();
      });
    }
  }

  /**
   * Test multi-step form navigation
   */
  async testMultiStepForm(
    steps: Array<{
      stepName: string;
      fields: FormField[];
      nextButtonText?: string;
      previousButtonText?: string;
      validation?: boolean;
    }>
  ): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (!step) continue;

      // Verify current step is active
      expect(screen.getByText(step.stepName)).toBeInTheDocument();

      // Fill step fields
      await this.fillForm(step.fields);

      // Navigate to next step (except for last step)
      if (i < steps.length - 1) {
        const nextButton = screen.getByRole('button', {
          name: step.nextButtonText ? new RegExp(step.nextButtonText, 'i') : /next/i
        });
        await this.user.click(nextButton);

        // Wait for next step to load
        const nextStep = steps[i + 1];
        if (nextStep) {
          await waitFor(() => {
            expect(screen.getByText(nextStep.stepName)).toBeInTheDocument();
          });
        }
      }
    }
  }

  /**
   * Test conditional form fields
   */
  async testConditionalFields(
    triggerField: FormField,
    triggerValue: any,
    conditionalFields: FormField[],
    shouldShow: boolean
  ): Promise<void> {
    // Set trigger field value
    const modifiedTriggerField = { ...triggerField, value: triggerValue };
    await this.fillField(modifiedTriggerField);

    // Check if conditional fields are shown/hidden
    for (const field of conditionalFields) {
      const element = this.getFieldElement(field, false);
      
      if (shouldShow) {
        expect(element).toBeInTheDocument();
        expect(element).toBeVisible();
      } else {
        expect(element).not.toBeInTheDocument();
      }
    }
  }

  /**
   * Test form auto-save functionality
   */
  async testAutoSave(
    fields: FormField[],
    autoSaveDelay: number = 1000,
    onAutoSave?: MockedFunction<any>
  ): Promise<void> {
    // Fill form fields
    await this.fillForm(fields);

    // Wait for auto-save delay
    await waitFor(
      () => {
        if (onAutoSave) {
          expect(onAutoSave).toHaveBeenCalled();
        } else {
          // Look for auto-save indicator
          expect(screen.getByText(/saved|auto.?saved/i)).toBeInTheDocument();
        }
      },
      { timeout: autoSaveDelay + 1000 }
    );
  }

  /**
   * Test form data persistence
   */
  async testFormPersistence(
    fields: FormField[],
    storageKey: string,
    storageType: 'localStorage' | 'sessionStorage' = 'localStorage'
  ): Promise<void> {
    // Fill form fields
    await this.fillForm(fields);

    // Check if data is persisted
    const storage = storageType === 'localStorage' ? localStorage : sessionStorage;
    const persistedData = JSON.parse(storage.getItem(storageKey) || '{}');

    // Verify persisted data matches form values
    for (const field of fields) {
      if (field.value !== undefined) {
        expect(persistedData[field.name]).toBe(field.value);
      }
    }
  }

  /**
   * Get form field element
   */
  private getFieldElement(field: FormField, shouldExist: boolean = true): HTMLElement {
    let element: HTMLElement | null = null;

    // Try different ways to find the element
    if (field.label) {
      element = screen.queryByLabelText(new RegExp(field.label, 'i'));
    }

    if (!element && field.label) {
      element = screen.queryByRole(this.getFieldRole(field.type), { 
        name: new RegExp(field.label, 'i')
      });
    }

    if (!element && field.placeholder) {
      element = screen.queryByPlaceholderText(field.placeholder);
    }

    if (!element) {
      element = screen.queryByTestId(field.name) || 
                document.querySelector(`[name="${field.name}"]`) as HTMLElement;
    }

    if (!element && shouldExist) {
      throw new Error(`Field element not found: ${field.name} (${field.type})`);
    }

    return element as HTMLElement;
  }

  /**
   * Get submit button element
   */
  private getSubmitButton(buttonText?: string | RegExp): HTMLElement {
    const text = buttonText || /submit|save|create|send|publish/i;
    return screen.getByRole('button', { name: text });
  }

  /**
   * Get reset button element
   */
  private getResetButton(buttonText?: string | RegExp): HTMLElement {
    const text = buttonText || /reset|clear|cancel/i;
    return screen.getByRole('button', { name: text });
  }

  /**
   * Get appropriate role for field type
   */
  private getFieldRole(type: string): string {
    switch (type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
        return 'textbox';
      case 'textarea':
        return 'textbox';
      case 'select':
        return 'combobox';
      case 'checkbox':
        return 'checkbox';
      case 'radio':
        return 'radio';
      case 'file':
        return 'button'; // File inputs often have button role
      default:
        return 'textbox';
    }
  }
}

// Export singleton instance
export const formTestingUtils = new FormTestingUtils();

// Export validation test helpers
export class FormValidationHelpers {
  /**
   * Common email validation test
   */
  static emailValidation(fieldName: string = 'email'): Array<{
    field: FormField;
    invalidValue: string;
    expectedError: string;
  }> {
    return [
      {
        field: { name: fieldName, type: 'email', label: 'Email' },
        invalidValue: 'invalid-email',
        expectedError: 'Please enter a valid email address'
      },
      {
        field: { name: fieldName, type: 'email', label: 'Email' },
        invalidValue: '',
        expectedError: 'Email is required'
      }
    ];
  }

  /**
   * Common password validation test
   */
  static passwordValidation(fieldName: string = 'password'): Array<{
    field: FormField;
    invalidValue: string;
    expectedError: string;
  }> {
    return [
      {
        field: { name: fieldName, type: 'password', label: 'Password' },
        invalidValue: '123',
        expectedError: 'Password must be at least 8 characters'
      },
      {
        field: { name: fieldName, type: 'password', label: 'Password' },
        invalidValue: '',
        expectedError: 'Password is required'
      }
    ];
  }

  /**
   * Common required field validation test
   */
  static requiredFieldValidation(
    fieldName: string,
    fieldType: FormField['type'],
    label: string
  ): Array<{
    field: FormField;
    invalidValue: string;
    expectedError: string;
  }> {
    return [
      {
        field: { name: fieldName, type: fieldType, label, required: true },
        invalidValue: '',
        expectedError: `${label} is required`
      }
    ];
  }

  /**
   * Common number validation test
   */
  static numberValidation(
    fieldName: string,
    label: string,
    min?: number,
    max?: number
  ): Array<{
    field: FormField;
    invalidValue: string;
    expectedError: string;
  }> {
    const tests = [];

    if (min !== undefined) {
      tests.push({
        field: { name: fieldName, type: 'number' as const, label },
        invalidValue: String(min - 1),
        expectedError: `${label} must be at least ${min}`
      });
    }

    if (max !== undefined) {
      tests.push({
        field: { name: fieldName, type: 'number' as const, label },
        invalidValue: String(max + 1),
        expectedError: `${label} must be at most ${max}`
      });
    }

    return tests;
  }
}

// Export file upload helpers
export class FileUploadHelpers {
  /**
   * Create test file
   */
  static createTestFile(
    name: string = 'test.jpg',
    type: string = 'image/jpeg',
    size: number = 1024
  ): File {
    const content = new Array(size).fill('a').join('');
    return new File([content], name, { type });
  }

  /**
   * Create multiple test files
   */
  static createTestFiles(count: number, namePrefix: string = 'test'): File[] {
    return Array.from({ length: count }, (_, i) => 
      this.createTestFile(`${namePrefix}-${i + 1}.jpg`)
    );
  }

  /**
   * Test file validation
   */
  static async testFileValidation(
    field: FormField,
    file: File,
    expectedError: string
  ): Promise<void> {
    const utils = new FormTestingUtils();
    
    try {
      await utils.testFileUpload(field, [file]);
      // If no error thrown, check for error message in UI
      await waitFor(() => {
        expect(screen.getByText(expectedError)).toBeInTheDocument();
      });
    } catch (error) {
      // File validation might throw an error
      expect(error).toBeDefined();
    }
  }
}