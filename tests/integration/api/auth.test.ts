/**
 * Authentication API Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IntegrationTestRunner, MockApiServer } from '../../../src/shared/testing/ApiTestUtils';

describe('Authentication API Integration', () => {
  let testRunner: IntegrationTestRunner;
  let mockServer: MockApiServer;

  beforeEach(() => {
    testRunner = new IntegrationTestRunner({
      baseUrl: 'http://localhost:3000/api',
      timeout: 5000,
    });
    mockServer = testRunner.getMockServer();
    
    // Setup mock routes
    setupMockAuthRoutes(mockServer);
    mockServer.mockFetch();
  });

  afterEach(() => {
    mockServer.reset();
  });

  describe('Login Flow', () => {
    it('should successfully log in with valid credentials', async () => {
      const result = await testRunner.runTestSuite('login_success', [
        {
          name: 'login_with_valid_credentials',
          test: async () => {
            const apiTester = testRunner.getApiTester();
            const result = await apiTester.testEndpoint(
              'POST',
              '/auth/login',
              {
                email: 'test@example.com',
                password: 'password123'
              },
              200
            );

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('accessToken');
            expect(result.data).toHaveProperty('refreshToken');
            expect(result.data).toHaveProperty('expiresIn');
          }
        }
      ]);

      expect(result.passedTests).toBe(1);
      expect(result.failedTests).toBe(0);
    });

    it('should fail login with invalid credentials', async () => {
      const result = await testRunner.runTestSuite('login_failure', [
        {
          name: 'login_with_invalid_credentials',
          test: async () => {
            const apiTester = testRunner.getApiTester();
            const result = await apiTester.testEndpoint(
              'POST',
              '/auth/login',
              {
                email: 'test@example.com',
                password: 'wrongpassword'
              },
              401
            );

            expect(result.success).toBe(true); // Success means we got expected 401
            expect(result.data).toHaveProperty('error');
            expect(result.data.error).toContain('Invalid credentials');
          }
        }
      ]);

      expect(result.passedTests).toBe(1);
    });

    it('should validate required fields', async () => {
      const result = await testRunner.runTestSuite('login_validation', [
        {
          name: 'login_missing_email',
          test: async () => {
            const apiTester = testRunner.getApiTester();
            const result = await apiTester.testEndpoint(
              'POST',
              '/auth/login',
              { password: 'password123' },
              400
            );

            expect(result.success).toBe(true);
            expect(result.data.error).toContain('Email is required');
          }
        },
        {
          name: 'login_missing_password',
          test: async () => {
            const apiTester = testRunner.getApiTester();
            const result = await apiTester.testEndpoint(
              'POST',
              '/auth/login',
              { email: 'test@example.com' },
              400
            );

            expect(result.success).toBe(true);
            expect(result.data.error).toContain('Password is required');
          }
        }
      ]);

      expect(result.passedTests).toBe(2);
    });
  });

  describe('Token Refresh Flow', () => {
    it('should refresh token with valid refresh token', async () => {
      const result = await testRunner.runTestSuite('token_refresh', [
        {
          name: 'refresh_with_valid_token',
          test: async () => {
            const apiTester = testRunner.getApiTester();
            const result = await apiTester.testEndpoint(
              'POST',
              '/auth/refresh',
              { refreshToken: 'valid-refresh-token' },
              200
            );

            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('accessToken');
            expect(result.data).toHaveProperty('expiresIn');
          }
        }
      ]);

      expect(result.passedTests).toBe(1);
    });

    it('should fail refresh with invalid token', async () => {
      const result = await testRunner.runTestSuite('token_refresh_failure', [
        {
          name: 'refresh_with_invalid_token',
          test: async () => {
            const apiTester = testRunner.getApiTester();
            const result = await apiTester.testEndpoint(
              'POST',
              '/auth/refresh',
              { refreshToken: 'invalid-token' },
              401
            );

            expect(result.success).toBe(true);
            expect(result.data.error).toContain('Invalid refresh token');
          }
        }
      ]);

      expect(result.passedTests).toBe(1);
    });
  });

  describe('Logout Flow', () => {
    it('should successfully logout', async () => {
      const result = await testRunner.runTestSuite('logout', [
        {
          name: 'logout_success',
          test: async () => {
            const apiTester = testRunner.getApiTester();
            const result = await apiTester.testEndpoint(
              'POST',
              '/auth/logout',
              { refreshToken: 'valid-refresh-token' },
              200
            );

            expect(result.success).toBe(true);
            expect(result.data.message).toBe('Logged out successfully');
          }
        }
      ]);

      expect(result.passedTests).toBe(1);
    });
  });

  describe('Password Reset Flow', () => {
    it('should initiate password reset', async () => {
      const result = await testRunner.runTestSuite('password_reset', [
        {
          name: 'request_password_reset',
          test: async () => {
            const apiTester = testRunner.getApiTester();
            const result = await apiTester.testEndpoint(
              'POST',
              '/auth/forgot-password',
              { email: 'test@example.com' },
              200
            );

            expect(result.success).toBe(true);
            expect(result.data.message).toContain('Password reset email sent');
          }
        }
      ]);

      expect(result.passedTests).toBe(1);
    });

    it('should reset password with valid token', async () => {
      const result = await testRunner.runTestSuite('password_reset_confirm', [
        {
          name: 'reset_password_with_token',
          test: async () => {
            const apiTester = testRunner.getApiTester();
            const result = await apiTester.testEndpoint(
              'POST',
              '/auth/reset-password',
              {
                token: 'valid-reset-token',
                newPassword: 'newpassword123'
              },
              200
            );

            expect(result.success).toBe(true);
            expect(result.data.message).toBe('Password reset successfully');
          }
        }
      ]);

      expect(result.passedTests).toBe(1);
    });
  });
});

function setupMockAuthRoutes(mockServer: MockApiServer) {
  // Login endpoint
  mockServer.addRoute('POST', '/auth/login', (req) => {
    const { email, password } = req.body || {};

    if (!email) {
      throw new Error('Email is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }

    if (email === 'test@example.com' && password === 'password123') {
      return {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        user: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User'
        }
      };
    } else {
      const error = new Error('Invalid credentials');
      (error as any).status = 401;
      throw error;
    }
  });

  // Refresh token endpoint
  mockServer.addRoute('POST', '/auth/refresh', (req) => {
    const { refreshToken } = req.body || {};

    if (refreshToken === 'valid-refresh-token') {
      return {
        accessToken: 'new-access-token',
        expiresIn: 3600
      };
    } else {
      const error = new Error('Invalid refresh token');
      (error as any).status = 401;
      throw error;
    }
  });

  // Logout endpoint
  mockServer.addRoute('POST', '/auth/logout', (req) => {
    return { message: 'Logged out successfully' };
  });

  // Forgot password endpoint
  mockServer.addRoute('POST', '/auth/forgot-password', (req) => {
    const { email } = req.body || {};
    
    if (!email) {
      throw new Error('Email is required');
    }

    return { message: 'Password reset email sent' };
  });

  // Reset password endpoint
  mockServer.addRoute('POST', '/auth/reset-password', (req) => {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    if (token === 'valid-reset-token') {
      return { message: 'Password reset successfully' };
    } else {
      const error = new Error('Invalid reset token');
      (error as any).status = 400;
      throw error;
    }
  });
}