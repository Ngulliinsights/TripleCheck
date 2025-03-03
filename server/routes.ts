import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertReviewSchema, insertUserSchema, insertCommunityPostSchema } from "@shared/schema";
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

  // Community posts routes
  app.get("/api/community-posts", async (_req, res) => {
    const posts = await storage.getCommunityPosts();
    res.json(posts);
  });

  app.get("/api/community-posts/:id", async (req, res) => {
    const post = await storage.getCommunityPost(Number(req.params.id));
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json(post);
  });

  app.post("/api/community-posts", async (req, res) => {
    try {
      const postData = insertCommunityPostSchema.parse(req.body);
      const post = await storage.createCommunityPost(postData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data" });
      }
      throw error;
    }
  });

  // Legal resources routes
  app.get("/api/legal-resources", async (_req, res) => {
    const resources = await storage.getLegalResources();
    res.json(resources);
  });

  app.get("/api/legal-resources/:id", async (req, res) => {
    const resource = await storage.getLegalResource(Number(req.params.id));
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.json(resource);
  });

  const httpServer = createServer(app);
  return httpServer;
}