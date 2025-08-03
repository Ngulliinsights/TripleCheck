/**
 * Common testing patterns and utilities
 */

import { screen, waitFor, within } from '@testing-library/react';
import { vi, type MockedFunction } from 'vitest';

import type { TestUser, TestProperty } from './fixtures';
import { userEventInstance } from './user-event';

// Common test patterns
export class TestPatterns {
  /**
   * Test component rendering without errors
   */
  static async testComponentRenders(
    renderFn: () => void,
    expectedText?: string
  ): Promise<void> {
    expect(() => renderFn()).not.toThrow();
    
    if (expectedText) {
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    }
  }

  /**
   * Test loading states
   */
  static async testLoadingState(
    renderFn: () => void,
    loadingText: string = 'Loading...'
  ): Promise<void> {
    renderFn();
    
    // Should show loading initially
    expect(screen.getByText(loadingText)).toBeInTheDocument();
    
    // Wait for loading to disappear
    await waitFor(() => {
      expect(screen.queryByText(loadingText)).not.toBeInTheDocument();
    });
  }

  /**
   * Test error states
   */
  static async testErrorState(
    renderFn: () => void,
    triggerError: () => Promise<void> | void,
    expectedErrorText: string
  ): Promise<void> {
    renderFn();
    
    await triggerError();
    
    await waitFor(() => {
      expect(screen.getByText(expectedErrorText)).toBeInTheDocument();
    });
  }

  /**
   * Test form submission
   */
  static async testFormSubmission(
    formSelector: string,
    fields: Record<string, string | boolean>,
    onSubmit: MockedFunction<any>,
    expectedData?: any
  ): Promise<void> {
    const user = userEventInstance;
    
    // Fill and submit form
    for (const [fieldName, value] of Object.entries(fields)) {
      const field = screen.getByLabelText(new RegExp(fieldName, 'i')) || 
                   screen.getByRole('textbox', { name: new RegExp(fieldName, 'i') }) ||
                   screen.getByDisplayValue('');
      
      if (typeof value === 'boolean') {
        if (value) {
          await user.click(field);
        }
      } else {
        await user.type(field, value);
      }
    }
    
    const submitButton = screen.getByRole('button', { name: /submit|save|create/i });
    await user.click(submitButton);
    
    // Verify submission
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
    
    if (expectedData) {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining(expectedData)
      );
    }
  }

  /**
   * Test form validation
   */
  static async testFormValidation(
    fields: Array<{
      name: string;
      invalidValue: string;
      expectedError: string;
    }>
  ): Promise<void> {
    const user = userEventInstance;
    
    for (const field of fields) {
      // Clear any existing values
      const input = screen.getByLabelText(new RegExp(field.name, 'i'));
      await user.clear(input);
      
      // Enter invalid value
      await user.type(input, field.invalidValue);
      
      // Trigger validation (usually by blurring or submitting)
      await user.tab();
      
      // Check for error message
      await waitFor(() => {
        expect(screen.getByText(field.expectedError)).toBeInTheDocument();
      });
    }
  }

  /**
   * Test navigation
   */
  static async testNavigation(
    linkText: string,
    expectedUrl: string
  ): Promise<void> {
    const user = userEventInstance;
    
    const link = screen.getByRole('link', { name: new RegExp(linkText, 'i') });
    await user.click(link);
    
    await waitFor(() => {
      expect(window.location.pathname).toBe(expectedUrl);
    });
  }

  /**
   * Test modal interactions
   */
  static async testModal(
    triggerSelector: string,
    modalTitle: string,
    actions: {
      fillFields?: Record<string, string>;
      clickConfirm?: boolean;
      clickCancel?: boolean;
    } = {}
  ): Promise<void> {
    const user = userEventInstance;
    
    // Open modal
    const trigger = screen.getByRole('button', { name: new RegExp(triggerSelector, 'i') });
    await user.click(trigger);
    
    // Verify modal is open
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(modalTitle)).toBeInTheDocument();
    });
    
    // Fill fields if provided
    if (actions.fillFields) {
      for (const [fieldName, value] of Object.entries(actions.fillFields)) {
        const field = within(screen.getByRole('dialog')).getByLabelText(
          new RegExp(fieldName, 'i')
        );
        await user.type(field, value);
      }
    }
    
    // Click action buttons
    if (actions.clickConfirm) {
      const confirmButton = within(screen.getByRole('dialog')).getByRole('button', {
        name: /confirm|save|ok|yes/i
      });
      await user.click(confirmButton);
    } else if (actions.clickCancel) {
      const cancelButton = within(screen.getByRole('dialog')).getByRole('button', {
        name: /cancel|close|no/i
      });
      await user.click(cancelButton);
    }
    
    // Verify modal is closed (if action was taken)
    if (actions.clickConfirm || actions.clickCancel) {
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    }
  }

  /**
   * Test search functionality
   */
  static async testSearch(
    searchTerm: string,
    expectedResults: string[],
    noResultsText?: string
  ): Promise<void> {
    const user = userEventInstance;
    
    const searchInput = screen.getByRole('searchbox') || 
                       screen.getByPlaceholderText(/search/i);
    
    await user.type(searchInput, searchTerm);
    
    // Wait for search results
    await waitFor(() => {
      if (expectedResults.length > 0) {
        expectedResults.forEach(result => {
          expect(screen.getByText(result)).toBeInTheDocument();
        });
      } else if (noResultsText) {
        expect(screen.getByText(noResultsText)).toBeInTheDocument();
      }
    });
  }

  /**
   * Test pagination
   */
  static async testPagination(
    totalPages: number,
    itemsPerPage: number
  ): Promise<void> {
    const user = userEventInstance;
    
    // Test next page navigation
    for (let page = 1; page < Math.min(totalPages, 3); page++) {
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(`Page ${page + 1}`)).toBeInTheDocument();
      });
    }
    
    // Test previous page navigation
    const prevButton = screen.getByRole('button', { name: /previous/i });
    await user.click(prevButton);
    
    await waitFor(() => {
      expect(screen.getByText('Page 2')).toBeInTheDocument();
    });
  }

  /**
   * Test sorting functionality
   */
  static async testSorting(
    sortOptions: Array<{
      label: string;
      expectedOrder: string[];
    }>
  ): Promise<void> {
    const user = userEventInstance;
    
    for (const option of sortOptions) {
      // Find and click sort option
      const sortButton = screen.getByRole('button', { 
        name: new RegExp(option.label, 'i') 
      });
      await user.click(sortButton);
      
      // Verify order
      await waitFor(() => {
        const items = screen.getAllByTestId(/item-/);
        option.expectedOrder.forEach((expectedText, index) => {
          expect(items[index]).toHaveTextContent(expectedText);
        });
      });
    }
  }

  /**
   * Test filtering functionality
   */
  static async testFiltering(
    filters: Array<{
      type: 'select' | 'checkbox' | 'input';
      label: string;
      value: string;
      expectedResults: string[];
    }>
  ): Promise<void> {
    const user = userEventInstance;
    
    for (const filter of filters) {
      // Apply filter based on type
      if (filter.type === 'select') {
        const select = screen.getByLabelText(new RegExp(filter.label, 'i'));
        await user.selectOptions(select, filter.value);
      } else if (filter.type === 'checkbox') {
        const checkbox = screen.getByLabelText(new RegExp(filter.label, 'i'));
        await user.click(checkbox);
      } else if (filter.type === 'input') {
        const input = screen.getByLabelText(new RegExp(filter.label, 'i'));
        await user.type(input, filter.value);
      }
      
      // Verify filtered results
      await waitFor(() => {
        filter.expectedResults.forEach(result => {
          expect(screen.getByText(result)).toBeInTheDocument();
        });
      });
    }
  }

  /**
   * Test file upload
   */
  static async testFileUpload(
    fileInputSelector: string,
    files: File[],
    expectedFeedback?: string
  ): Promise<void> {
    const user = userEventInstance;
    
    const fileInput = screen.getByLabelText(/upload|file/i) ||
                     document.querySelector(fileInputSelector);
    
    if (!fileInput) {
      throw new Error(`File input not found: ${fileInputSelector}`);
    }
    
    await user.upload(fileInput, files);
    
    if (expectedFeedback) {
      await waitFor(() => {
        expect(screen.getByText(expectedFeedback)).toBeInTheDocument();
      });
    }
  }

  /**
   * Test responsive behavior
   */
  static async testResponsive(
    breakpoints: Array<{
      width: number;
      height: number;
      expectedChanges: () => void;
    }>
  ): Promise<void> {
    for (const breakpoint of breakpoints) {
      // Change viewport size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: breakpoint.width,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: breakpoint.height,
      });
      
      // Trigger resize event
      window.dispatchEvent(new Event('resize'));
      
      // Wait for changes and verify
      await waitFor(() => {
        breakpoint.expectedChanges();
      });
    }
  }

  /**
   * Test keyboard navigation
   */
  static async testKeyboardNavigation(
    expectedFocusOrder: string[]
  ): Promise<void> {
    const user = userEventInstance;
    
    // Start from first focusable element
    await user.tab();
    
    for (let i = 0; i < expectedFocusOrder.length; i++) {
      const focusId = expectedFocusOrder[i];
      if (!focusId) continue;
      
      let expectedElement: HTMLElement;
      try {
        expectedElement = screen.getByTestId(focusId);
      } catch {
        try {
          expectedElement = screen.getByLabelText(focusId);
        } catch {
          expectedElement = screen.getByText(focusId);
        }
      }
      
      expect(expectedElement).toHaveFocus();
      
      if (i < expectedFocusOrder.length - 1) {
        await user.tab();
      }
    }
  }

  /**
   * Test async operations with loading states
   */
  static async testAsyncOperation<T>(
    operation: () => Promise<T>,
    loadingIndicator: string,
    successIndicator?: string,
    errorIndicator?: string
  ): Promise<T> {
    // Should show loading
    expect(screen.getByText(loadingIndicator)).toBeInTheDocument();
    
    try {
      const result = await operation();
      
      // Should hide loading
      await waitFor(() => {
        expect(screen.queryByText(loadingIndicator)).not.toBeInTheDocument();
      });
      
      // Should show success if provided
      if (successIndicator) {
        expect(screen.getByText(successIndicator)).toBeInTheDocument();
      }
      
      return result;
    } catch (error) {
      // Should hide loading
      await waitFor(() => {
        expect(screen.queryByText(loadingIndicator)).not.toBeInTheDocument();
      });
      
      // Should show error if provided
      if (errorIndicator) {
        expect(screen.getByText(errorIndicator)).toBeInTheDocument();
      }
      
      throw error;
    }
  }
}

// Property-specific test patterns
export class PropertyTestPatterns {
  /**
   * Test property card rendering
   */
  static testPropertyCard(property: TestProperty): void {
    expect(screen.getByText(property.title)).toBeInTheDocument();
    expect(screen.getByText(property.location)).toBeInTheDocument();
    expect(screen.getByText(`KES ${property.price.toLocaleString()}`)).toBeInTheDocument();
    expect(screen.getByText(`${property.features.bedrooms} bed`)).toBeInTheDocument();
    expect(screen.getByText(`${property.features.bathrooms} bath`)).toBeInTheDocument();
  }

  /**
   * Test property search and filtering
   */
  static async testPropertySearch(
    searchTerm: string,
    filters: {
      location?: string;
      priceMin?: number;
      priceMax?: number;
      propertyType?: string;
      bedrooms?: number;
    } = {}
  ): Promise<void> {
    const user = userEventInstance;
    
    // Enter search term
    if (searchTerm) {
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, searchTerm);
    }
    
    // Apply filters
    if (filters.location) {
      const locationFilter = screen.getByLabelText(/location/i);
      await user.selectOptions(locationFilter, filters.location);
    }
    
    if (filters.priceMin) {
      const priceMinInput = screen.getByLabelText(/minimum price/i);
      await user.type(priceMinInput, String(filters.priceMin));
    }
    
    if (filters.priceMax) {
      const priceMaxInput = screen.getByLabelText(/maximum price/i);
      await user.type(priceMaxInput, String(filters.priceMax));
    }
    
    if (filters.propertyType) {
      const typeFilter = screen.getByLabelText(/property type/i);
      await user.selectOptions(typeFilter, filters.propertyType);
    }
    
    if (filters.bedrooms) {
      const bedroomsFilter = screen.getByLabelText(/bedrooms/i);
      await user.selectOptions(bedroomsFilter, String(filters.bedrooms));
    }
    
    // Submit search
    const searchButton = screen.getByRole('button', { name: /search/i });
    await user.click(searchButton);
    
    // Wait for results
    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });
  }

  /**
   * Test property creation form
   */
  static async testPropertyCreation(
    propertyData: Partial<TestProperty>
  ): Promise<void> {
    const user = userEventInstance;
    
    // Fill basic information
    if (propertyData.title) {
      await user.type(screen.getByLabelText(/title/i), propertyData.title);
    }
    
    if (propertyData.description) {
      await user.type(screen.getByLabelText(/description/i), propertyData.description);
    }
    
    if (propertyData.location) {
      await user.type(screen.getByLabelText(/location/i), propertyData.location);
    }
    
    if (propertyData.price) {
      await user.type(screen.getByLabelText(/price/i), String(propertyData.price));
    }
    
    // Fill features
    if (propertyData.features?.bedrooms) {
      await user.selectOptions(
        screen.getByLabelText(/bedrooms/i), 
        String(propertyData.features.bedrooms)
      );
    }
    
    if (propertyData.features?.bathrooms) {
      await user.selectOptions(
        screen.getByLabelText(/bathrooms/i), 
        String(propertyData.features.bathrooms)
      );
    }
    
    if (propertyData.features?.propertyType) {
      await user.selectOptions(
        screen.getByLabelText(/property type/i), 
        propertyData.features.propertyType
      );
    }
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create|save/i });
    await user.click(submitButton);
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/property created successfully/i)).toBeInTheDocument();
    });
  }
}

// User-specific test patterns
export class UserTestPatterns {
  /**
   * Test user authentication flow
   */
  static async testLogin(
    credentials: { email: string; password: string },
    expectedRedirect?: string
  ): Promise<void> {
    const user = userEventInstance;
    
    // Fill login form
    await user.type(screen.getByLabelText(/email/i), credentials.email);
    await user.type(screen.getByLabelText(/password/i), credentials.password);
    
    // Submit form
    const loginButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(loginButton);
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/welcome|dashboard/i)).toBeInTheDocument();
    });
    
    // Check redirect if provided
    if (expectedRedirect) {
      expect(window.location.pathname).toBe(expectedRedirect);
    }
  }

  /**
   * Test user registration flow
   */
  static async testRegistration(
    userData: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      confirmPassword: string;
    }
  ): Promise<void> {
    const user = userEventInstance;
    
    // Fill registration form
    await user.type(screen.getByLabelText(/first name/i), userData.firstName);
    await user.type(screen.getByLabelText(/last name/i), userData.lastName);
    await user.type(screen.getByLabelText(/email/i), userData.email);
    await user.type(screen.getByLabelText(/^password/i), userData.password);
    await user.type(screen.getByLabelText(/confirm password/i), userData.confirmPassword);
    
    // Submit form
    const registerButton = screen.getByRole('button', { name: /register|sign up/i });
    await user.click(registerButton);
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/registration successful|welcome/i)).toBeInTheDocument();
    });
  }

  /**
   * Test user profile update
   */
  static async testProfileUpdate(
    updates: Partial<TestUser>
  ): Promise<void> {
    const user = userEventInstance;
    
    // Navigate to profile page
    const profileLink = screen.getByRole('link', { name: /profile/i });
    await user.click(profileLink);
    
    // Update fields
    if (updates.firstName) {
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, updates.firstName);
    }
    
    if (updates.lastName) {
      const lastNameInput = screen.getByLabelText(/last name/i);
      await user.clear(lastNameInput);
      await user.type(lastNameInput, updates.lastName);
    }
    
    if (updates.bio) {
      const bioInput = screen.getByLabelText(/bio/i);
      await user.clear(bioInput);
      await user.type(bioInput, updates.bio);
    }
    
    // Save changes
    const saveButton = screen.getByRole('button', { name: /save|update/i });
    await user.click(saveButton);
    
    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  }
}

// Export all patterns
export const testPatterns = {
  common: TestPatterns,
  property: PropertyTestPatterns,
  user: UserTestPatterns,
};