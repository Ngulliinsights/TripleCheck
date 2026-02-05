import { Express, Request, Response } from "express";
import { z } from "zod";

import { CacheService, defaultCacheConfig } from "../infrastructure/cache"
import { AuthenticatedRequest, requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error";
import { CommunityResourcesService } from "../services/CommunityResourcesService";

// Validation schemas
const ShareExperienceSchema = z.object({
  title: z.string().min(10).max(200),
  location: z.string().min(2).max(100),
  fraudType: z.enum(['land', 'rental', 'development', 'investment', 'other']),
  amountLost: z.string().optional(),
  whatHappened: z.string().min(50).max(2000),
  personalVulnerabilities: z.string().max(1000).optional(),
  systemicChallenges: z.string().max(1000).optional(),
  lessonsLearned: z.string().max(1000).optional(),
  resolutionStatus: z.enum(['resolved', 'partial', 'unresolved']),
  resolutionDetails: z.string().max(1000).optional(),
  anonymous: z.boolean().default(false)
});

const ExperienceQuerySchema = z.object({
  category: z.enum(['all', 'land', 'rental', 'development', 'investment']).default('all'),
  search: z.string().optional(),
  resolved: z.enum(['all', 'resolved', 'unresolved']).default('all'),
  location: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
  offset: z.coerce.number().min(0).default(0),
  sortBy: z.enum(['recent', 'popular', 'amount', 'resolved']).default('recent')
});

const InteractionSchema = z.object({
  type: z.enum(['like', 'unlike', 'helpful', 'unhelpful']),
  experienceId: z.string()
});

const CommentSchema = z.object({
  experienceId: z.string(),
  content: z.string().min(1).max(500),
  anonymous: z.boolean().default(false)
});

export function registerCommunityResourcesRoutes(app: Express) {
  const communityService = new CommunityResourcesService();
  const cache = new CacheService(defaultCacheConfig);

  /**
   * Get community experiences with filtering and pagination
   */
  app.get("/api/community/experiences",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const query = ExperienceQuerySchema.parse(req.query);
        
        const cacheKey = `community_experiences:${JSON.stringify(query)}`;
        const cached = await cache.get(cacheKey);
        
        if (cached) {
          return res.json({
            success: true,
            data: cached,
            cached: true
          });
        }

        const experiences = await communityService.getExperiences(query);
        
        // Cache for 10 minutes
        await cache.set(cacheKey, experiences, 600);

        res.json({
          success: true,
          data: experiences
        });

      } catch (error: any) {
        console.error('Community experiences fetch error:', error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "Invalid query parameters",
            details: error.errors
          });
        }

        res.status(500).json({
          success: false,
          error: "Failed to fetch community experiences",
          message: error.message
        });
      }
    })
  );

  /**
   * Share a new experience
   */
  app.post("/api/community/experiences",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const experienceData = ShareExperienceSchema.parse(req.body);
        const userId = req.session?.userId;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: "Authentication required"
          });
        }

        const experience = await communityService.shareExperience({
          ...experienceData,
          userId,
          datePosted: new Date()
        });

        // Invalidate relevant caches
        await cache.deletePattern('community_experiences:*');
        await cache.deletePattern('community_stats:*');

        res.status(201).json({
          success: true,
          data: experience,
          message: "Experience shared successfully. Thank you for helping the community!"
        });

      } catch (error: any) {
        console.error('Experience sharing error:', error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "Invalid experience data",
            details: error.errors
          });
        }

        res.status(500).json({
          success: false,
          error: "Failed to share experience",
          message: error.message
        });
      }
    })
  );

  /**
   * Get a specific experience with comments
   */
  app.get("/api/community/experiences/:experienceId",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const { experienceId } = req.params;
        
        const cacheKey = `community_experience:${experienceId}`;
        const cached = await cache.get(cacheKey);
        
        if (cached) {
          return res.json({
            success: true,
            data: cached,
            cached: true
          });
        }

        const experience = await communityService.getExperienceById(experienceId);

        if (!experience) {
          return res.status(404).json({
            success: false,
            error: "Experience not found"
          });
        }

        // Cache for 5 minutes
        await cache.set(cacheKey, experience, 300);

        res.json({
          success: true,
          data: experience
        });

      } catch (error: any) {
        console.error('Experience fetch error:', error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch experience",
          message: error.message
        });
      }
    })
  );

  /**
   * Interact with an experience (like, helpful, etc.)
   */
  app.post("/api/community/experiences/interact",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const interactionData = InteractionSchema.parse(req.body);
        const userId = req.session?.userId;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: "Authentication required"
          });
        }

        const result = await communityService.interactWithExperience(
          userId,
          interactionData.experienceId,
          interactionData.type
        );

        // Invalidate relevant caches
        await cache.delete(`community_experience:${interactionData.experienceId}`);
        await cache.deletePattern('community_experiences:*');

        res.json({
          success: true,
          data: result
        });

      } catch (error: any) {
        console.error('Experience interaction error:', error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "Invalid interaction data",
            details: error.errors
          });
        }

        res.status(500).json({
          success: false,
          error: "Failed to process interaction",
          message: error.message
        });
      }
    })
  );

  /**
   * Add comment to an experience
   */
  app.post("/api/community/experiences/comments",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const commentData = CommentSchema.parse(req.body);
        const userId = req.session?.userId;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: "Authentication required"
          });
        }

        const comment = await communityService.addComment({
          ...commentData,
          userId,
          createdAt: new Date()
        });

        // Invalidate relevant caches
        await cache.delete(`community_experience:${commentData.experienceId}`);

        res.status(201).json({
          success: true,
          data: comment,
          message: "Comment added successfully"
        });

      } catch (error: any) {
        console.error('Comment creation error:', error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "Invalid comment data",
            details: error.errors
          });
        }

        res.status(500).json({
          success: false,
          error: "Failed to add comment",
          message: error.message
        });
      }
    })
  );

  /**
   * Get community statistics
   */
  app.get("/api/community/stats",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const cacheKey = 'community_stats';
        const cached = await cache.get(cacheKey);
        
        if (cached) {
          return res.json({
            success: true,
            data: cached,
            cached: true
          });
        }

        const stats = await communityService.getCommunityStats();
        
        // Cache for 15 minutes
        await cache.set(cacheKey, stats, 900);

        res.json({
          success: true,
          data: stats
        });

      } catch (error: any) {
        console.error('Community stats fetch error:', error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch community statistics",
          message: error.message
        });
      }
    })
  );

  /**
   * Get experience categories with counts
   */
  app.get("/api/community/categories",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        const cacheKey = 'community_categories';
        const cached = await cache.get(cacheKey);
        
        if (cached) {
          return res.json({
            success: true,
            data: cached,
            cached: true
          });
        }

        const categories = await communityService.getCategories();
        
        // Cache for 30 minutes
        await cache.set(cacheKey, categories, 1800);

        res.json({
          success: true,
          data: categories
        });

      } catch (error: any) {
        console.error('Categories fetch error:', error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch categories",
          message: error.message
        });
      }
    })
  );

  /**
   * Report inappropriate content
   */
  app.post("/api/community/report",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const reportData = z.object({
          contentId: z.string(),
          contentType: z.enum(['experience', 'comment']),
          reason: z.enum(['spam', 'inappropriate', 'false_information', 'harassment', 'other']),
          details: z.string().max(500).optional()
        }).parse(req.body);

        const userId = req.session?.userId;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: "Authentication required"
          });
        }

        const report = await communityService.reportContent({
          ...reportData,
          reporterId: userId,
          timestamp: new Date()
        });

        res.json({
          success: true,
          data: { reportId: report.id },
          message: "Content reported successfully. Our team will review it shortly."
        });

      } catch (error: any) {
        console.error('Content report error:', error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "Invalid report data",
            details: error.errors
          });
        }

        res.status(500).json({
          success: false,
          error: "Failed to report content",
          message: error.message
        });
      }
    })
  );

  /**
   * Get user's own experiences
   */
  app.get("/api/community/my-experiences",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.session?.userId;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: "Authentication required"
          });
        }

        const experiences = await communityService.getUserExperiences(userId);

        res.json({
          success: true,
          data: experiences
        });

      } catch (error: any) {
        console.error('User experiences fetch error:', error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch your experiences",
          message: error.message
        });
      }
    })
  );
}