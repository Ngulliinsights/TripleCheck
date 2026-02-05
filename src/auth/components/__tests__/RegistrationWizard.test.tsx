import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { RegistrationWizard } from '../RegistrationWizard'

// Mock dependencies
vi.mock('zxcvbn', () => ({
  default: vi.fn(() => ({
    score: 3,
    feedback: {
      suggestions: ['Add more variety to your password'],
      warning: '',
    },
  })),
}));

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('RegistrationWizard', () => {
  let queryClient: QueryClient;
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderRegistrationWizard = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <RegistrationWizard onComplete={mockOnComplete} {...props} />
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('renders registration wizard with first step', () => {
      renderRegistrationWizard();

      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('shows progress bar with correct percentage', () => {
      renderRegistrationWizard();

      expect(screen.getByText('25% Complete')).toBeInTheDocument();
    });

    it('renders all step navigation buttons', () => {
      renderRegistrationWizard();

      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Create Password')).toBeInTheDocument();
      expect(screen.getByText('Profile Setup')).toBeInTheDocument();
      expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('navigates to next step when Next button is clicked with valid data', async () => {
      const user = userEvent.setup();
      renderRegistrationWizard();

      // Fill in required fields
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');

      // Click Next
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
      });
    });

    it('shows validation errors when trying to proceed with invalid data', async () => {
      const user = userEvent.setup();
      renderRegistrationWizard();

      // Try to proceed without filling required fields
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('allows going back to previous step', async () => {
      const user = userEvent.setup();
      renderRegistrationWizard();

      // Fill in first step and proceed
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      // Go back
      await user.click(screen.getByText('Previous'));

      await waitFor(() => {
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates email format', async () => {
      const user = userEvent.setup();
      renderRegistrationWizard();

      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates password requirements', async () => {
      const user = userEvent.setup();
      renderRegistrationWizard();

      // Navigate to password step
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      // Try weak password
      await user.type(screen.getByPlaceholderText(/create a strong password/i), 'weak');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('validates password confirmation match', async () => {
      const user = userEvent.setup();
      renderRegistrationWizard();

      // Navigate to password step
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      // Enter mismatched passwords
      await user.type(screen.getByPlaceholderText(/create a strong password/i), 'StrongPass123!');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'DifferentPass123!');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
      });
    });
  });

  describe('Password Strength Indicator', () => {
    it('shows password strength when typing password', async () => {
      const user = userEvent.setup();
      renderRegistrationWizard();

      // Navigate to password step
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      // Type password and check strength indicator
      await user.type(screen.getByPlaceholderText(/create a strong password/i), 'StrongPass123!');

      await waitFor(() => {
        expect(screen.getByText('Password strength:')).toBeInTheDocument();
        expect(screen.getByText('Good')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Photo Upload', () => {
    it('allows profile photo upload in profile step', async () => {
      const user = userEvent.setup();
      renderRegistrationWizard();

      // Navigate through steps to profile setup
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      await user.type(screen.getByPlaceholderText(/create a strong password/i), 'StrongPass123!');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'StrongPass123!');
      await user.click(screen.getByText('Next'));

      await waitFor(() => {
        expect(screen.getByText('Profile Setup')).toBeInTheDocument();
        expect(screen.getByText('Upload a profile photo (optional)')).toBeInTheDocument();
      });
    });
  });

  describe('Terms and Conditions', () => {
    it('requires terms acceptance before submission', async () => {
      const user = userEvent.setup();
      renderRegistrationWizard();

      // Navigate through all steps
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByText('Next'));

      await user.type(screen.getByPlaceholderText(/create a strong password/i), 'StrongPass123!');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'StrongPass123!');
      await user.click(screen.getByText('Next'));

      await user.click(screen.getByText('Next')); // Skip profile setup

      await waitFor(() => {
        expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
      });

      // Try to submit without accepting terms
      await user.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(screen.getByText('You must agree to the terms of service')).toBeInTheDocument();
        expect(screen.getByText('You must agree to the privacy policy')).toBeInTheDocument();
      });
    });
  });

  describe('Form Persistence', () => {
    it('saves form data to localStorage', async () => {
      const user = userEvent.setup();
      renderRegistrationWizard();

      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');

      // Check if localStorage.setItem was called
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'registrationFormData',
          expect.stringContaining('John')
        );
      });
    });

    it('loads saved form data on mount', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        })
      );

      renderRegistrationWizard();

      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
      const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;

      expect(firstNameInput.value).toBe('John');
      expect(lastNameInput.value).toBe('Doe');
      expect(emailInput.value).toBe('john@example.com');
    });
  });

  describe('Form Submission', () => {
    it('calls onComplete when registration is successful', async () => {
      const user = userEvent.setup();
      
      // Mock successful registration
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              user: { id: '1', email: 'john@example.com' },
              token: 'mock-token',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

      renderRegistrationWizard();

      // Fill out all required fields and complete registration
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByText('Next'));

      await user.type(screen.getByPlaceholderText(/create a strong password/i), 'StrongPass123!');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'StrongPass123!');
      await user.click(screen.getByText('Next'));

      await user.click(screen.getByText('Next')); // Skip profile setup

      await waitFor(() => {
        expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
      });

      // Accept terms
      const termsCheckbox = screen.getByRole('checkbox', { name: /terms of service/i });
      const privacyCheckbox = screen.getByRole('checkbox', { name: /privacy policy/i });
      
      await user.click(termsCheckbox);
      await user.click(privacyCheckbox);
      await user.click(screen.getByText('Create Account'));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe',
          phone: '',
          agreeToTerms: true,
        });
      });
    });
  });
});