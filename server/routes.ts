import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertReviewSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Mock AI verification function
async function performAIVerification(propertyData: any) {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    documentAuthenticity: Math.random() > 0.2 ? "verified" : "suspicious",
    ownershipVerified: Math.random() > 0.3,
    riskScore: Math.floor(Math.random() * 100),
    verifiedAt: new Date().toISOString()
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
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

  const httpServer = createServer(app);
  return httpServer;
}
