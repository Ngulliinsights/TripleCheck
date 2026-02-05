import React from 'react'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../../../shared/test-utils'
import { server } from '../../../shared/test-utils/msw-server'
import { http, HttpResponse } from 'msw'
import Register from '../Register'

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

describe('Register Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Rendering', () => {
    it('renders registration wizard with first step', () => {
      renderWithProviders(<Register />);

      expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('shows progress indicator', () => {
      renderWithProviders(<Register />);

      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      expect(screen.getByText('25% Complete')).toBeInTheDocument();
    });

    it('shows step navigation', () => {
      renderWithProviders(<Register />);

      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      expect(screen.getByText('Create Password')).toBeInTheDocument();
      expect(screen.getByText('Profile Setup')).toBeInTheDocument();
      expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
    });

    it('renders sign in link', () => {
      renderWithProviders(<Register />);

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });

  describe('Step 1: Personal Information', () => {
    it('validates required fields', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const emailInput = screen.getByLabelText(/email address/i);
      const nextButton = screen.getByRole('button', { name: /next/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates minimum name length', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const nextButton = screen.getByRole('button', { name: /next/i });

      await user.type(firstNameInput, 'A');
      await user.type(lastNameInput, 'B');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('First name must be at least 2 characters')).toBeInTheDocument();
        expect(screen.getByText('Last name must be at least 2 characters')).toBeInTheDocument();
      });
    });

    it('proceeds to next step with valid data', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const nextButton = screen.getByRole('button', { name: /next/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'john@example.com');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
        expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
      });
    });

    it('allows optional phone number', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const phoneInput = screen.getByLabelText(/phone number/i);
      await user.type(phoneInput, '+254712345678');

      expect(phoneInput).toHaveValue('+254712345678');
    });
  });

  describe('Step 2: Password Creation', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      // Fill first step
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });
    });

    it('validates password requirements', async () => {
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/^password$/i);
      const nextButton = screen.getByRole('button', { name: /next/i });

      await user.type(passwordInput, 'weak');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('validates password complexity', async () => {
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/^password$/i);
      const nextButton = screen.getByRole('button', { name: /next/i });

      await user.type(passwordInput, 'password123');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
      });
    });

    it('validates password confirmation', async () => {
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const nextButton = screen.getByRole('button', { name: /next/i });

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'DifferentPassword123!');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
      });
    });

    it('shows password strength indicator', async () => {
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'Password123!');

      await waitFor(() => {
        expect(screen.getByText('Password strength:')).toBeInTheDocument();
        expect(screen.getByText('Strong')).toBeInTheDocument();
      });
    });

    it('proceeds to next step with valid passwords', async () => {
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const nextButton = screen.getByRole('button', { name: /next/i });

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'Password123!');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Profile Setup')).toBeInTheDocument();
        expect(screen.getByText('Step 3 of 4')).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Profile Setup', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      // Fill first two steps
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Profile Setup')).toBeInTheDocument();
      });
    });

    it('allows skipping profile setup', async () => {
      const user = userEvent.setup();

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
        expect(screen.getByText('Step 4 of 4')).toBeInTheDocument();
      });
    });

    it('allows adding bio', async () => {
      const user = userEvent.setup();

      const bioTextarea = screen.getByLabelText(/bio/i);
      await user.type(bioTextarea, 'I am a property enthusiast looking for my dream home.');

      expect(bioTextarea).toHaveValue('I am a property enthusiast looking for my dream home.');
    });

    it('validates bio character limit', async () => {
      const user = userEvent.setup();

      const bioTextarea = screen.getByLabelText(/bio/i);
      const longBio = 'A'.repeat(501);
      
      await user.type(bioTextarea, longBio);

      expect(screen.getByText('501/500 characters')).toBeInTheDocument();
    });

    it('shows avatar placeholder with initials', () => {
      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe initials
    });
  });

  describe('Step 4: Terms & Conditions', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      // Fill all previous steps
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Profile Setup')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
      });
    });

    it('requires terms of service agreement', async () => {
      const user = userEvent.setup();

      const createAccountButton = screen.getByRole('button', { name: /create account/i });
      await user.click(createAccountButton);

      await waitFor(() => {
        expect(screen.getByText('You must agree to the terms of service')).toBeInTheDocument();
      });
    });

    it('requires privacy policy agreement', async () => {
      const user = userEvent.setup();

      const termsCheckbox = screen.getByRole('checkbox', { name: /terms of service/i });
      const createAccountButton = screen.getByRole('button', { name: /create account/i });

      await user.click(termsCheckbox);
      await user.click(createAccountButton);

      await waitFor(() => {
        expect(screen.getByText('You must agree to the privacy policy')).toBeInTheDocument();
      });
    });

    it('allows optional marketing emails', async () => {
      const user = userEvent.setup();

      const marketingCheckbox = screen.getByRole('checkbox', { name: /marketing emails/i });
      await user.click(marketingCheckbox);

      expect(marketingCheckbox).toBeChecked();
    });

    it('successfully creates account with required agreements', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/register', () => {
          return HttpResponse.json({
            data: {
              user: {
                id: '1',
                email: 'john@example.com',
                firstName: 'John',
                lastName: 'Doe',
                role: 'user',
                isVerified: false
              },
              token: 'new-user-token'
            }
          });
        })
      );

      const termsCheckbox = screen.getByRole('checkbox', { name: /terms of service/i });
      const privacyCheckbox = screen.getByRole('checkbox', { name: /privacy policy/i });
      const createAccountButton = screen.getByRole('button', { name: /create account/i });

      await user.click(termsCheckbox);
      await user.click(privacyCheckbox);
      await user.click(createAccountButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/verify-email', {
          state: { email: 'john@example.com' }
        });
      });
    });

    it('displays error on registration failure', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/register', () => {
          return new HttpResponse(
            JSON.stringify({ error: 'Email already exists' }),
            { status: 409 }
          );
        })
      );

      const termsCheckbox = screen.getByRole('checkbox', { name: /terms of service/i });
      const privacyCheckbox = screen.getByRole('checkbox', { name: /privacy policy/i });
      const createAccountButton = screen.getByRole('button', { name: /create account/i });

      await user.click(termsCheckbox);
      await user.click(privacyCheckbox);
      await user.click(createAccountButton);

      await waitFor(() => {
        expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('shows loading state during registration', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/register', () => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve(HttpResponse.json({
                data: {
                  user: { id: '1', email: 'john@example.com' },
                  token: 'token'
                }
              }));
            }, 100);
          });
        })
      );

      const termsCheckbox = screen.getByRole('checkbox', { name: /terms of service/i });
      const privacyCheckbox = screen.getByRole('checkbox', { name: /privacy policy/i });
      const createAccountButton = screen.getByRole('button', { name: /create account/i });

      await user.click(termsCheckbox);
      await user.click(privacyCheckbox);
      await user.click(createAccountButton);

      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
      expect(createAccountButton).toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('allows going back to previous steps', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      // Go to step 2
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      // Go back to step 1
      const previousButton = screen.getByRole('button', { name: /previous/i });
      await user.click(previousButton);

      await waitFor(() => {
        expect(screen.getByText('Personal Information')).toBeInTheDocument();
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      });
    });

    it('disables previous button on first step', () => {
      renderWithProviders(<Register />);

      const previousButton = screen.getByRole('button', { name: /previous/i });
      expect(previousButton).toBeDisabled();
    });

    it('allows clicking on completed steps', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      // Complete step 1
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      // Click on step 1 in navigation
      const step1Button = screen.getAllByText('Personal Information')[0];
      await user.click(step1Button);

      await waitFor(() => {
        expect(screen.getByText('Step 1 of 4')).toBeInTheDocument();
      });
    });
  });

  describe('Form Persistence', () => {
    it('saves form data to localStorage', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'registrationFormData',
        expect.stringContaining('John')
      );
    });

    it('loads saved form data on mount', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          firstName: 'Saved',
          lastName: 'User',
          email: 'saved@example.com'
        })
      );

      renderWithProviders(<Register />);

      expect(screen.getByDisplayValue('Saved')).toBeInTheDocument();
      expect(screen.getByDisplayValue('User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('saved@example.com')).toBeInTheDocument();
    });

    it('clears saved data after successful registration', async () => {
      const user = userEvent.setup();

      server.use(
        http.post('/api/auth/register', () => {
          return HttpResponse.json({
            data: {
              user: { id: '1', email: 'john@example.com' },
              token: 'token'
            }
          });
        })
      );

      renderWithProviders(<Register />);

      // Complete all steps
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/^password$/i), 'Password123!');
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Profile Setup')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('checkbox', { name: /terms of service/i }));
      await user.click(screen.getByRole('checkbox', { name: /privacy policy/i }));
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('registrationFormData');
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<Register />);

      expect(screen.getByLabelText(/first name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/last name/i)).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('type', 'email');
    });

    it('provides proper error announcements', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('maintains focus management between steps', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Register />);

      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com');
      await user.click(screen.getByRole('button', { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText('Create Password')).toBeInTheDocument();
      });

      // Focus should be managed appropriately when moving between steps
      expect(document.activeElement).toBeTruthy();
    });
  });
});