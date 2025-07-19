import { Express, Request, Response } from "express";
import { z } from "zod";
import {
  AuthenticatedRequest,
  LoginSchema,
  RegisterSchema,
  hashPassword,
  verifyPassword,
  getUserIdFromSession,
  setUserSession,
  clearUserSession,
  clearAuthAttempts,
  AUTH_ERRORS,
  authRateLimit,
  validateSession
} from "../middleware/auth";
import { asyncHandler } from "../middleware/error-handler";

// Import storage (you'll need to adjust this import based on your storage implementation)
// import { storage } from "../storage";

export function registerAuthRoutes(app: Express, storage: any) {
  
  // Register endpoint
  app.post("/api/auth/register", 
    authRateLimit(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
    asyncHandler(async (req: Request, res: Response) => {
      try {
        // Validate input
        const validatedData = RegisterSchema.parse(req.body);
        
        // Check if username already exists
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser) {
          return res.status(409).json({
            success: false,
            error: "Username already exists",
            message: "Please choose a different username"
          });
        }
        
        // Hash password
        const hashedPassword = await hashPassword(validatedData.password);
        
        // Create user
        const user = await storage.createUser({
          username: validatedData.username,
          password: hashedPassword
        });
        
        // Set session
        const authReq = req as AuthenticatedRequest;
        setUserSession(authReq, user.id);
        
        // Clear rate limiting for this IP on successful registration
        clearAuthAttempts(req.ip || 'unknown');
        
        // Return user data (without password)
        const { password, ...userWithoutPassword } = user;
        
        res.status(201).json({
          success: true,
          data: userWithoutPassword,
          message: "Registration successful"
        });
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        
        console.error('Registration error:', error);
        res.status(500).json({
          success: false,
          error: "Registration failed",
          message: "An error occurred during registration"
        });
      }
    })
  );
  
  // Login endpoint
  app.post("/api/auth/login",
    authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
    asyncHandler(async (req: Request, res: Response) => {
      try {
        // Validate input
        const validatedData = LoginSchema.parse(req.body);
        
        // Find user
        const user = await storage.getUserByUsername(validatedData.username);
        if (!user) {
          return res.status(401).json({
            success: false,
            error: "Invalid credentials",
            message: "Username or password is incorrect"
          });
        }
        
        // Verify password
        const isPasswordValid = await verifyPassword(validatedData.password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            error: "Invalid credentials",
            message: "Username or password is incorrect"
          });
        }
        
        // Set session
        const authReq = req as AuthenticatedRequest;
        setUserSession(authReq, user.id);
        
        // Clear rate limiting for this IP on successful login
        clearAuthAttempts(req.ip || 'unknown');
        
        // Return user data (without password)
        const { password, ...userWithoutPassword } = user;
        
        res.json({
          success: true,
          data: userWithoutPassword,
          message: "Login successful"
        });
        
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }
        
        console.error('Login error:', error);
        res.status(500).json({
          success: false,
          error: "Login failed",
          message: "An error occurred during login"
        });
      }
    })
  );
  
  // Logout endpoint
  app.post("/api/auth/logout",
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        await clearUserSession(req);
        
        res.json({
          success: true,
          message: "Logged out successfully"
        });
        
      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
          success: false,
          error: "Logout failed",
          message: "An error occurred during logout"
        });
      }
    })
  );
  
  // Get current user endpoint
  app.get("/api/auth/me",
    validateSession,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = getUserIdFromSession(req);
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Not authenticated",
          message: "Please log in to access this resource"
        });
      }
      
      try {
        const user = await storage.getUserById(userId);
        
        if (!user) {
          // User was deleted but session still exists
          await clearUserSession(req);
          return res.status(401).json({
            success: false,
            error: "User not found",
            message: "Please log in again"
          });
        }
        
        // Return user data (without password)
        const { password, ...userWithoutPassword } = user;
        
        res.json({
          success: true,
          data: userWithoutPassword
        });
        
      } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
          success: false,
          error: "Failed to get user data",
          message: "An error occurred while fetching user information"
        });
      }
    })
  );
  
  // Password change endpoint
  app.post("/api/auth/change-password",
    validateSession,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = getUserIdFromSession(req);
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required",
          message: "Please log in to change your password"
        });
      }
      
      try {
        const { currentPassword, newPassword } = req.body;
        
        // Validate input
        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            error: "Missing required fields",
            message: "Current password and new password are required"
          });
        }
        
        // Validate new password
        const passwordValidation = z.string()
          .min(8, "Password must be at least 8 characters")
          .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number")
          .safeParse(newPassword);
          
        if (!passwordValidation.success) {
          return res.status(400).json({
            success: false,
            error: "Invalid password",
            message: passwordValidation.error.errors[0].message
          });
        }
        
        // Get current user
        const user = await storage.getUserById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            error: "User not found",
            message: "User account not found"
          });
        }
        
        // Verify current password
        const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(401).json({
            success: false,
            error: "Invalid current password",
            message: "Current password is incorrect"
          });
        }
        
        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);
        
        // Update password
        await storage.updateUserPassword(userId, hashedNewPassword);
        
        res.json({
          success: true,
          message: "Password changed successfully"
        });
        
      } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({
          success: false,
          error: "Password change failed",
          message: "An error occurred while changing your password"
        });
      }
    })
  );
  
  // Session validation endpoint
  app.get("/api/auth/validate-session",
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const userId = getUserIdFromSession(req);
      
      res.json({
        success: true,
        data: {
          isAuthenticated: !!userId,
          userId: userId || null
        }
      });
    })
  );
}