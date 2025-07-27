import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TwoFactorAuth } from '../TwoFactorAuth';
import { User } from '../../types/auth.types';

// Mock fetch
global.fetch = vi.fn();

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('TwoFactorAuth', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    isVerified: true,
    preferences: {
      notifications: {
        email: true,
        sms: true,
        push: true,
      },
      privacy: {
        showProfile: true,
        showContactInfo: false,
      },
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnVerified = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Verification Mode', () => {
    it('renders verification form for authenticator method', () => {
      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['authenticator']}
        />
      );

      expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByText('Enter your verification code to continue')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
      expect(screen.getByText('Verify Code')).toBeInTheDocument();
    });

    it('allows entering verification code', async () => {
      const user = userEvent.setup();
      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['authenticator']}
        />
      );

      const codeInput = screen.getByPlaceholderText('000000');
      await user.type(codeInput, '123456');

      expect(codeInput).toHaveValue('123456');
    });

    it('validates code format', async () => {
      const user = userEvent.setup();
      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['authenticator']}
        />
      );

      const codeInput = screen.getByPlaceholderText('000000');
      const verifyButton = screen.getByText('Verify Code');

      await user.type(codeInput, '123');
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Code must be 6 digits')).toBeInTheDocument();
      });
    });

    it('calls onVerified when verification succeeds', async () => {
      const user = userEvent.setup();
      
      // Mock successful verification
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['authenticator']}
        />
      );

      const codeInput = screen.getByPlaceholderText('000000');
      const verifyButton = screen.getByText('Verify Code');

      await user.type(codeInput, '123456');
      await user.click(verifyButton);

      await waitFor(() => {
        expect(mockOnVerified).toHaveBeenCalled();
      });
    });

    it('shows error message when verification fails', async () => {
      const user = userEvent.setup();
      
      // Mock failed verification
      global.fetch = vi.fn().mockRejectedValue(new Error('Invalid code'));

      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['authenticator']}
        />
      );

      const codeInput = screen.getByPlaceholderText('000000');
      const verifyButton = screen.getByText('Verify Code');

      await user.type(codeInput, '123456');
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid verification code. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Setup Mode', () => {
    it('renders setup form for authenticator method', () => {
      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="setup"
          methods={['authenticator']}
        />
      );

      expect(screen.getByText('Set Up Two-Factor Authentication')).toBeInTheDocument();
      expect(screen.getByText('Secure your account with an additional layer of protection')).toBeInTheDocument();
      expect(screen.getByText('Install an Authenticator App')).toBeInTheDocument();
    });

    it('shows QR code when setup data is loaded', async () => {
      // Mock setup initialization
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            secret: 'JBSWY3DPEHPK3PXP',
            qrCodeUrl: 'otpauth://totp/TripleCheck:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TripleCheck',
            backupCodes: ['12345678', '87654321'],
            manualEntryKey: 'JBSWY3DPEHPK3PXP',
          },
        }),
      });

      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="setup"
          methods={['authenticator']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
        expect(screen.getByText('Verify Setup')).toBeInTheDocument();
      });
    });

    it('allows manual entry of secret key', async () => {
      const user = userEvent.setup();
      
      // Mock setup initialization
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: {
            secret: 'JBSWY3DPEHPK3PXP',
            qrCodeUrl: 'otpauth://totp/TripleCheck:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TripleCheck',
            backupCodes: ['12345678', '87654321'],
            manualEntryKey: 'JBSWY3DPEHPK3PXP',
          },
        }),
      });

      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="setup"
          methods={['authenticator']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
      });

      const manualEntryButton = screen.getByText("Can't scan? Enter code manually");
      await user.click(manualEntryButton);

      await waitFor(() => {
        expect(screen.getByText('Manual Entry Key:')).toBeInTheDocument();
        expect(screen.getByText('JBSWY3DPEHPK3PXP')).toBeInTheDocument();
      });
    });

    it('completes setup when verification code is correct', async () => {
      const user = userEvent.setup();
      
      // Mock setup initialization
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            data: {
              secret: 'JBSWY3DPEHPK3PXP',
              qrCodeUrl: 'otpauth://totp/TripleCheck:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=TripleCheck',
              backupCodes: ['12345678', '87654321'],
              manualEntryKey: 'JBSWY3DPEHPK3PXP',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });

      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="setup"
          methods={['authenticator']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Verify Setup')).toBeInTheDocument();
      });

      const codeInput = screen.getByPlaceholderText('000000');
      const completeButton = screen.getByText('Complete Setup');

      await user.type(codeInput, '123456');
      await user.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Two-factor authentication has been successfully enabled!')).toBeInTheDocument();
      });
    });
  });

  describe('SMS/Email Methods', () => {
    it('renders SMS verification option', () => {
      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['sms']}
        />
      );

      expect(screen.getByText('Enter the 6-digit code sent to your phone')).toBeInTheDocument();
      expect(screen.getByText('Resend Code')).toBeInTheDocument();
    });

    it('renders email verification option', () => {
      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['email']}
        />
      );

      expect(screen.getByText('Enter the 6-digit code sent to your email')).toBeInTheDocument();
      expect(screen.getByText('Resend Code')).toBeInTheDocument();
    });

    it('allows resending verification code', async () => {
      const user = userEvent.setup();
      
      // Mock send code request
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['sms']}
        />
      );

      const resendButton = screen.getByText('Resend Code');
      await user.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText('Verification code sent to your phone')).toBeInTheDocument();
      });
    });
  });

  describe('Method Selection', () => {
    it('shows method tabs when multiple methods are available', () => {
      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['authenticator', 'sms', 'email']}
        />
      );

      expect(screen.getByText('Choose Verification Method')).toBeInTheDocument();
    });

    it('allows switching between methods', async () => {
      const user = userEvent.setup();
      
      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['authenticator', 'sms']}
        />
      );

      // Should start with authenticator method
      expect(screen.getByText('Enter the 6-digit code from your authenticator app')).toBeInTheDocument();

      // Switch to SMS method
      const smsTab = screen.getByRole('tab', { name: /sms/i });
      await user.click(smsTab);

      await waitFor(() => {
        expect(screen.getByText('Enter the 6-digit code sent to your phone')).toBeInTheDocument();
      });
    });
  });

  describe('Recovery Options', () => {
    it('shows recovery options in verify mode', () => {
      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="verify"
          methods={['authenticator']}
        />
      );

      expect(screen.getByText('Having trouble accessing your codes?')).toBeInTheDocument();
      expect(screen.getByText('Use Backup Code')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
    });

    it('does not show recovery options in setup mode', () => {
      render(
        <TwoFactorAuth
          user={mockUser}
          onVerified={mockOnVerified}
          mode="setup"
          methods={['authenticator']}
        />
      );

      expect(screen.queryByText('Having trouble accessing your codes?')).not.toBeInTheDocument();
    });
  });
});