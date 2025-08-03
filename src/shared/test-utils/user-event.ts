import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Create a pre-configured user-event instance
export function setupUserEvent() {
  return userEvent.setup({
    advanceTimers: (delay: number) => {
      if (vi.isFakeTimers()) {
        vi.advanceTimersByTime(delay);
        return Promise.resolve();
      } else {
        return new Promise(resolve => setTimeout(resolve, delay));
      }
    },
  });
}

// Enhanced form field types
interface FormField {
  value: string | boolean | number;
  type?: 'text' | 'email' | 'password' | 'number' | 'checkbox' | 'radio' | 'select' | 'textarea';
  selector?: string; // Custom selector if name attribute isn't available
  clear?: boolean; // Whether to clear existing content first
}

type FormFields = Record<string, string | boolean | number | FormField>;

// Enhanced form filling with better field detection and handling
export async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  fields: FormFields
) {
  for (const [fieldName, fieldConfig] of Object.entries(fields)) {
    let element: Element | null = null;
    let value: string | boolean | number;
    let fieldType: string = 'text';
    let shouldClear = false;
    let customSelector: string | undefined;

    // Handle different field configuration formats
    if (typeof fieldConfig === 'object' && fieldConfig !== null && 'value' in fieldConfig) {
      const config = fieldConfig as FormField;
      value = config.value;
      fieldType = config.type || 'text';
      shouldClear = config.clear || false;
      customSelector = config.selector;
    } else {
      value = fieldConfig;
    }

    // Find the element using various strategies
    if (customSelector) {
      element = document.querySelector(customSelector);
    } else {
      // Try multiple selector strategies
      element = 
        document.querySelector(`[name="${fieldName}"]`) ||
        document.querySelector(`[data-testid="${fieldName}"]`) ||
        document.querySelector(`#${fieldName}`) ||
        document.querySelector(`[aria-label="${fieldName}"]`) ||
        document.querySelector(`[placeholder="${fieldName}"]`);
    }

    if (!element) {
      throw new Error(`Field "${fieldName}" not found. Tried selectors: [name="${fieldName}"], [data-testid="${fieldName}"], #${fieldName}, [aria-label="${fieldName}"], [placeholder="${fieldName}"]`);
    }

    // Handle different input types
    if (typeof value === 'boolean') {
      // Handle checkbox/radio
      const isChecked = (element as HTMLInputElement).checked;
      if (isChecked !== value) {
        await user.click(element);
      }
    } else if (fieldType === 'select') {
      // Handle select elements
      await user.selectOptions(element, String(value));
    } else if (fieldType === 'number') {
      // Handle number inputs
      if (shouldClear) {
        await user.clear(element);
      }
      await user.type(element, String(value));
    } else {
      // Handle text inputs, textareas, etc.
      if (shouldClear) {
        await user.clear(element);
      }
      await user.type(element, String(value));
    }
  }
}

// Submit a form with given values
export async function submitForm(
  user: ReturnType<typeof userEvent.setup>,
  formSelector: string,
  fields: FormFields
) {
  await fillForm(user, fields);
  
  const form = document.querySelector(formSelector);
  if (!form) {
    throw new Error(`Form with selector "${formSelector}" not found`);
  }
  
  const submitButton = form.querySelector('button[type="submit"], input[type="submit"]');
  if (submitButton) {
    await user.click(submitButton);
  } else {
    // If no submit button, try to submit the form directly
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
  }
}

// Upload files to a file input
export async function uploadFiles(
  user: ReturnType<typeof userEvent.setup>,
  fileInputSelector: string,
  files: File[]
) {
  const fileInput = document.querySelector(fileInputSelector);
  if (!fileInput) {
    throw new Error(`File input with selector "${fileInputSelector}" not found`);
  }
  
  await user.upload(fileInput as HTMLElement, files);
}

// Create mock files for testing
export function createMockFile(
  name: string,
  content: string = 'mock file content',
  type: string = 'text/plain'
): File {
  return new File([content], name, { type });
}

export function createMockImageFile(
  name: string = 'test-image.jpg',
  type: string = 'image/jpeg'
): File {
  // Create a minimal valid image file
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  
  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], name, { type }));
      } else {
        // Fallback to simple file
        resolve(new File(['fake image data'], name, { type }));
      }
    }, type);
  }) as any; // Type assertion for synchronous usage in tests
}

// Navigate through multi-step forms
export async function navigateMultiStepForm(
  user: ReturnType<typeof userEvent.setup>,
  steps: Array<{
    fields: FormFields;
    nextButtonSelector?: string;
    validation?: () => Promise<void> | void;
  }>
) {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    
    // Fill current step fields
    await fillForm(user, step?.fields || {});
    
    // Run validation if provided
    if (step?.validation) {
      await step.validation();
    }
    
    // Click next button if not the last step
    if (i < steps.length - 1) {
      const nextButton = document.querySelector(
        step?.nextButtonSelector || '[data-testid="next-button"], button:contains("Next"), button:contains("Continue")'
      );
      
      if (nextButton) {
        await user.click(nextButton);
      }
    }
  }
}

// Interact with dropdown/select components
export async function selectFromDropdown(
  user: ReturnType<typeof userEvent.setup>,
  dropdownSelector: string,
  optionText: string
) {
  const dropdown = document.querySelector(dropdownSelector);
  if (!dropdown) {
    throw new Error(`Dropdown with selector "${dropdownSelector}" not found`);
  }
  
  // Open dropdown
  await user.click(dropdown);
  
  // Find and click option
  const option = document.querySelector(`[role="option"]:contains("${optionText}"), option:contains("${optionText}")`);
  if (!option) {
    throw new Error(`Option "${optionText}" not found in dropdown`);
  }
  
  await user.click(option);
}

// Handle modal interactions
export async function interactWithModal(
  user: ReturnType<typeof userEvent.setup>,
  actions: {
    openTriggerSelector?: string;
    fields?: FormFields;
    confirmButtonSelector?: string;
    cancelButtonSelector?: string;
    closeButtonSelector?: string;
  }
) {
  // Open modal if trigger provided
  if (actions.openTriggerSelector) {
    const trigger = document.querySelector(actions.openTriggerSelector);
    if (trigger) {
      await user.click(trigger);
    }
  }
  
  // Fill form fields if provided
  if (actions.fields) {
    await fillForm(user, actions.fields);
  }
  
  // Click action buttons
  if (actions.confirmButtonSelector) {
    const confirmButton = document.querySelector(actions.confirmButtonSelector);
    if (confirmButton) {
      await user.click(confirmButton);
    }
  } else if (actions.cancelButtonSelector) {
    const cancelButton = document.querySelector(actions.cancelButtonSelector);
    if (cancelButton) {
      await user.click(cancelButton);
    }
  } else if (actions.closeButtonSelector) {
    const closeButton = document.querySelector(actions.closeButtonSelector);
    if (closeButton) {
      await user.click(closeButton);
    }
  }
}

// Keyboard navigation helpers
export async function navigateWithKeyboard(
  user: ReturnType<typeof userEvent.setup>,
  sequence: Array<'Tab' | 'Shift+Tab' | 'Enter' | 'Escape' | 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Space'>
) {
  for (const key of sequence) {
    if (key.includes('+')) {
      const [modifier, mainKey] = key.split('+');
      await user.keyboard(`{${modifier}>${mainKey}}`);
    } else {
      await user.keyboard(`{${key}}`);
    }
  }
}

// Test accessibility keyboard navigation
export async function testKeyboardNavigation(
  user: ReturnType<typeof userEvent.setup>,
  containerSelector: string = 'body'
) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    throw new Error(`Container "${containerSelector}" not found`);
  }
  
  // Get all focusable elements
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) {
    throw new Error('No focusable elements found');
  }
  
  // Test tab navigation
  for (let i = 0; i < focusableElements.length; i++) {
    await user.tab();
    const {activeElement} = document;
    
    if (activeElement !== focusableElements[i]) {
      console.warn(`Expected focus on element ${i}, but got:`, activeElement);
    }
  }
  
  // Test reverse tab navigation
  for (let i = focusableElements.length - 1; i >= 0; i--) {
    await user.tab({ shift: true });
    const {activeElement} = document;
    
    if (activeElement !== focusableElements[i]) {
      console.warn(`Expected focus on element ${i} (reverse), but got:`, activeElement);
    }
  }
}

// Simulate drag and drop
export async function dragAndDrop(
  user: ReturnType<typeof userEvent.setup>,
  sourceSelector: string,
  targetSelector: string
) {
  const source = document.querySelector(sourceSelector);
  const target = document.querySelector(targetSelector);
  
  if (!source) {
    throw new Error(`Source element "${sourceSelector}" not found`);
  }
  
  if (!target) {
    throw new Error(`Target element "${targetSelector}" not found`);
  }
  
  // Simulate drag and drop
  await user.pointer([
    { keys: '[MouseLeft>]', target: source },
    { coords: { x: 0, y: 0 }, target },
    { keys: '[/MouseLeft]' },
  ]);
}

// Wait for element to appear and interact with it
export async function waitAndClick(
  user: ReturnType<typeof userEvent.setup>,
  selector: string,
  timeout: number = 5000
) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      await user.click(element);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Element "${selector}" not found within ${timeout}ms`);
}

// Simulate typing with realistic delays
export async function typeRealistic(
  user: ReturnType<typeof userEvent.setup>,
  element: Element | string,
  text: string,
  options: { delay?: number; mistake?: boolean } = {}
) {
  const { delay = 50, mistake = false } = options;
  
  const targetElement = typeof element === 'string' 
    ? document.querySelector(element)
    : element;
    
  if (!targetElement) {
    throw new Error(`Element not found: ${element}`);
  }
  
  if (mistake && text.length > 3) {
    // Simulate a typing mistake
    const mistakeIndex = Math.floor(text.length / 2);
    const beforeMistake = text.slice(0, mistakeIndex);
    const afterMistake = text.slice(mistakeIndex);
    
    // Type up to mistake
    await user.type(targetElement, beforeMistake);
    
    // Type wrong character
    await user.type(targetElement, 'x');
    
    // Backspace to correct
    await user.keyboard('{Backspace}');
    
    // Continue typing
    await user.type(targetElement, afterMistake);
  } else {
    await user.type(targetElement, text);
  }
}

// Export commonly used user event instance
export const userEventInstance = setupUserEvent();