import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { LoginCredentials, RegisterData, User } from '../../src/auth/types/auth.types';

interface AuthResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private readonly SALT_ROUNDS = 12;

  // In-memory user store for development (replace with database in production)
  private users: Map<string, User & { password: string }> = new Map();
  private invalidatedTokens: Set<string> = new Set();

  constructor() {
    // Add a default test user for development
    this.createTestUser();
  }

  private async createTestUser(): Promise<void> {
    const hashedPassword = await bcrypt.hash('password123', this.SALT_ROUNDS);
    const testUser: User & { password: string } = {
      id: '1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
      isVerified: true,
      password: hashedPassword,
      preferences: {
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        privacy: {
          showProfile: true,
          showContactInfo: false
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.users.set(testUser.email, testUser);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse<{ user: User; token: string }>> {
    try {
      const { email, password } = credentials;

      // Find user by email
      const userWithPassword = this.users.get(email);
      if (!userWithPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userWithPassword.password);
      if (!isPasswordValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: userWithPassword.id, 
          email: userWithPassword.email,
          role: userWithPassword.role 
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN }
      );

      // Remove password from user object
      const { password: _, ...user } = userWithPassword;

      return {
        success: true,
        data: {
          user,
          token
        }
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed. Please try again.'
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse<{ user: User; token: string }>> {
    try {
      const { email, password, firstName, lastName, phone, agreeToTerms } = userData;

      // Check if user already exists
      if (this.users.has(email)) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Validate terms agreement
      if (!agreeToTerms) {
        return {
          success: false,
          error: 'You must agree to the terms and conditions'
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Create new user
      const newUser: User & { password: string } = {
        id: Date.now().toString(), // Simple ID generation for development
        email,
        firstName,
        lastName,
        phone,
        role: 'user',
        isVerified: false, // Email verification required
        password: hashedPassword,
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          privacy: {
            showProfile: true,
            showContactInfo: false
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store user
      this.users.set(email, newUser);

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: newUser.id, 
          email: newUser.email,
          role: newUser.role 
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN }
      );

      // Remove password from user object
      const { password: _, ...user } = newUser;

      return {
        success: true,
        data: {
          user,
          token
        },
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      };
    }
  }

  async logout(authHeader?: string): Promise<AuthResponse<void>> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'No valid token provided'
        };
      }

      const token = authHeader.substring(7);
      
      // Add token to invalidated tokens set
      this.invalidatedTokens.add(token);

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Logout failed'
      };
    }
  }

  async getProfile(authHeader?: string): Promise<AuthResponse<User>> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'No valid token provided'
        };
      }

      const token = authHeader.substring(7);

      // Check if token is invalidated
      if (this.invalidatedTokens.has(token)) {
        return {
          success: false,
          error: 'Token has been invalidated'
        };
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // Find user by email
      const userWithPassword = this.users.get(decoded.email);
      if (!userWithPassword) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Remove password from user object
      const { password: _, ...user } = userWithPassword;

      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: 'Failed to get user profile'
      };
    }
  }

  async updateProfile(authHeader: string, updates: Partial<User>): Promise<AuthResponse<User>> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'No valid token provided'
        };
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      const userWithPassword = this.users.get(decoded.email);
      if (!userWithPassword) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Update user data (excluding sensitive fields)
      const allowedUpdates = ['firstName', 'lastName', 'phone', 'preferences'];
      const filteredUpdates: Partial<User> = {};
      
      for (const key of allowedUpdates) {
        if (key in updates) {
          (filteredUpdates as any)[key] = (updates as any)[key];
        }
      }

      // Apply updates
      const updatedUser = {
        ...userWithPassword,
        ...filteredUpdates,
        updatedAt: new Date().toISOString()
      };

      this.users.set(decoded.email, updatedUser);

      // Remove password from response
      const { password: _, ...user } = updatedUser;

      return {
        success: true,
        data: user
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: 'Failed to update profile'
      };
    }
  }

  async requestPasswordReset(email: string): Promise<AuthResponse<void>> {
    try {
      const user = this.users.get(email);
      if (!user) {
        // Don't reveal if user exists for security
        return {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.'
        };
      }

      // In a real implementation, you would:
      // 1. Generate a secure reset token
      // 2. Store it with expiration
      // 3. Send email with reset link
      
      console.log(`Password reset requested for: ${email}`);
      
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    } catch (error) {
      console.error('Password reset request error:', error);
      return {
        success: false,
        error: 'Failed to process password reset request'
      };
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse<void>> {
    try {
      // In a real implementation, you would:
      // 1. Verify the reset token
      // 2. Check if it's not expired
      // 3. Hash the new password
      // 4. Update the user's password
      
      console.log(`Password reset attempted with token: ${token}`);
      
      return {
        success: true,
        message: 'Password has been reset successfully'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: 'Failed to reset password'
      };
    }
  }

  // Helper method to validate token without returning user data
  async validateToken(authHeader?: string): Promise<boolean> {
    try {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
      }

      const token = authHeader.substring(7);

      if (this.invalidatedTokens.has(token)) {
        return false;
      }

      jwt.verify(token, this.JWT_SECRET);
      return true;
    } catch (error) {
      return false;
    }
  }
}