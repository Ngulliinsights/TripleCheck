import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertReviewSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import fileUpload from "express-fileupload";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import { 
  handleDocumentVerification,
  handleFraudDetection,
  handleGenerateReport,
  FileUploadRequest,
  registerAIRoutes
} from "./ai-routes";

// Uploads directory for temporary file storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../uploads');
// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// AI verification function using Google's AI
async function performAIVerification(propertyData: any) {
  try {
    // Import the fraud detection function directly to avoid circular dependencies
    const { detectFraud } = await import('./ai-routes');
    
    // Run fraud detection on the property data
    const fraudDetection = await detectFraud(propertyData);
    
    // Create a basic verification result when no documents are provided
    return {
      documentAuthenticity: fraudDetection.isSuspicious ? "suspicious" : "verified",
      ownershipVerified: !fraudDetection.isSuspicious,
      riskScore: Math.floor(fraudDetection.suspiciousScore * 100),
      fraudDetection,
      verifiedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("AI verification error:", error);
    // Return a fallback verification if the AI service fails
    return {
      documentAuthenticity: "pending",
      ownershipVerified: false,
      riskScore: 50,
      verifiedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error during verification"
    };
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Configure file upload middleware
  app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    abortOnLimit: true,
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: UPLOAD_DIR,
  }));
  
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user session
      if (req.session) {
        (req.session as any).userId = user.id;
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    if (req.session) {
      req.session.destroy((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = req.session ? (req.session as any)?.userId : null;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Properties routes
  app.get("/api/properties", async (req, res) => {
    const query = req.query.q as string;
    const properties = query 
      ? await storage.searchProperties(query)
      : await storage.getProperties();
    res.json(properties);
  });

  app.get("/api/properties/:id", async (req, res) => {
    const property = await storage.getProperty(Number(req.params.id));
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }
    res.json(property);
  });

  // Reviews routes
  app.get("/api/properties/:id/reviews", async (req, res) => {
    const reviews = await storage.getReviews(Number(req.params.id));
    res.json(reviews);
  });

  app.post("/api/properties/:id/reviews", async (req, res) => {
    try {
      const userId = req.session ? (req.session as any)?.userId : null;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const propertyId = Number(req.params.id);
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        propertyId,
        userId
      });

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.post("/api/properties", async (req, res) => {
    try {
      const propertyData = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(propertyData);
      
      // Trigger AI verification
      const verificationResults = await performAIVerification(propertyData);
      const verificationStatus = verificationResults.documentAuthenticity === "verified" 
        && verificationResults.ownershipVerified ? "verified" : "failed";
      
      const updatedProperty = await storage.updateVerificationStatus(
        property.id,
        verificationStatus,
        verificationResults
      );
      
      res.status(201).json(updatedProperty);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid property data" });
      }
      throw error;
    }
  });

  // Reviews routes
  app.get("/api/properties/:id/reviews", async (req, res) => {
    const reviews = await storage.getReviews(Number(req.params.id));
    res.json(reviews);
  });

  app.post("/api/properties/:id/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        propertyId: Number(req.params.id)
      });
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid review data" });
      }
      throw error;
    }
  });

  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data" });
      }
      throw error;
    }
  });

  // Register AI-related routes
  registerAIRoutes(app);
  
  // Property verification status endpoint
  app.get("/api/properties/:id/verification-status", async (req, res) => {
    try {
      const propertyId = parseInt(req.params.id);
      if (isNaN(propertyId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid property ID' 
        });
      }
      
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ 
          success: false, 
          message: 'Property not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        status: property.verificationStatus || 'unverified',
        results: property.aiVerificationResults || null
      });
    } catch (error) {
      console.error('Verification status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving verification status'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
