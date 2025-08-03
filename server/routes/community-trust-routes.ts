/**
 * Community Trust Routes - PRIMARY Verification System
 *
 * Prioritizes community-based verification over document verification.
 * This is the main verification system that most users will use.
 */

import { neon } from "@neondatabase/serverless";
import { eq, and, desc, count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import type { Express, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";

// Import session type augmentation
import "../types";

import {
  BehaviorAnalysisAI,
  CommunityTrustAI,
  ComprehensiveTrustCalculator,
  PhysicalVerificationAI,
} from "../ai/community-trust-ai-root";
import {
  TrustScore,
  TrustLevel,
  BehaviorPattern,
  // TODO: Add database table definitions to community-trust-schema.ts
  // communityReferences,
  // socialConnections,
  // behaviorPatterns,
  // communityEndorsements,
  // locationTrust,
  // trustScores,
  // physicalVerificationRequests,
  // transactionTrustEvents,
  // insertCommunityReferenceSchema,
  // insertBehaviorPatternSchema,
  // insertCommunityEndorsementSchema,
  // insertPhysicalVerificationRequestSchema,
  // TRUST_LEVELS,
  // getTrustLevelRequirements,
  // calculateTrustScore,
  // getTrustLevelFromScore,
} from "../shared/community-trust-schema";


// Initialize database
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Initialize AI services
const behaviorAI = new BehaviorAnalysisAI();
const communityAI = new CommunityTrustAI();
const trustCalculator = new ComprehensiveTrustCalculator();
const physicalVerificationAI = new PhysicalVerificationAI();

// ============================================================================
// RATE LIMITING
// ============================================================================

const communityActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 community actions per hour
  message: {
    error: "Too many community verification requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const referenceSubmissionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 references per day
  message: {
    error:
      "Daily reference submission limit reached. Please try again tomorrow.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const addCommunityReferenceSchema = z.object({
  referenceType: z.enum([
    "neighbor",
    "church_member",
    "colleague",
    "family",
    "business_partner",
  ]),
  referenceName: z.string().min(2).max(100),
  referencePhone: z
    .string()
    .regex(/^\+254[0-9]{9}$/, "Must be valid Kenyan phone number"),
  relationship: z.string().min(5).max(200),
  yearsKnown: z.number().int().min(0).max(50),
  trustRating: z.number().int().min(1).max(10),
  notes: z.string().max(500).optional(),
});

const addEndorsementSchema = z.object({
  endorserType: z.enum([
    "church_leader",
    "local_chief",
    "business_association",
    "womens_group",
    "youth_group",
  ]),
  endorserName: z.string().min(2).max(100),
  endorserTitle: z.string().min(2).max(100),
  endorserContact: z.string().min(10).max(50),
  endorsementLevel: z.number().int().min(1).max(10),
  endorsementReason: z.string().min(10).max(500),
});

const updateLocationTrustSchema = z.object({
  area: z.string().min(2).max(100),
  city: z.string().min(2).max(50),
  yearsInArea: z.number().int().min(0).max(100),
  localKnowledge: z.string().min(50).max(1000), // Description of local area knowledge
  localBusinessOwner: z.boolean().optional(),
  communityInvolvement: z.string().max(500).optional(),
});

const requestPhysicalVerificationSchema = z.object({
  targetUserId: z.number().int().positive(),
  propertyId: z.number().int().positive().optional(),
  transactionValue: z.number().int().positive(),
  verificationType: z.enum([
    "in_person_meeting",
    "agent_verification",
    "document_check",
  ]),
  requestReason: z.string().min(10).max(500),
  meetingLocation: z.string().min(5).max(200).optional(),
  scheduledAt: z.string().datetime().optional(),
});

// ============================================================================
// COMMUNITY REFERENCE ROUTES
// ============================================================================

export function registerCommunityTrustRoutes(app: Express) {
  // Add Community Reference
  app.post(
    "/api/community/references",
    referenceSubmissionLimiter,
    async (req: Request, res: Response) => {
      try {
        if (!req.session?.userId) {
          return res.status(401).json({
            success: false,
            message: "Authentication required",
          });
        }

        const validatedData = addCommunityReferenceSchema.parse(req.body);

        // Check if reference already exists
        const existingReference = await db
          .select()
          .from(communityReferences)
          .where(
            and(
              eq(communityReferences.userId, req.session.userId),
              eq(
                communityReferences.referencePhone,
                validatedData.referencePhone
              )
            )
          )
          .limit(1);

        if (existingReference.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Reference with this phone number already exists",
          });
        }

        // Insert new reference
        const [newReference] = await db
          .insert(communityReferences)
          .values({
            userId: req.session.userId,
            ...validatedData,
          })
          .returning();

        // TODO: Send SMS verification to reference
        // await sendReferenceVerificationSMS(validatedData.referencePhone, newReference.id);

        // Update trust score
        await updateUserTrustScore(req.session.userId);

        res.json({
          success: true,
          message: "Community reference added successfully",
          data: {
            referenceId: newReference.id,
            verificationStatus: "pending",
            nextSteps: [
              "Your reference will receive an SMS verification",
              "Verification typically takes 24-48 hours",
              "You can add more references to increase your trust score",
            ],
          },
        });
      } catch (error) {
        console.error("Add community reference error:", error);

        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: error.errors,
          });
        }

        res.status(500).json({
          success: false,
          message: "Failed to add community reference",
        });
      }
    }
  );

  // Get User's Community References
  app.get("/api/community/references", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const references = await db
        .select({
          id: communityReferences.id,
          referenceType: communityReferences.referenceType,
          referenceName: communityReferences.referenceName,
          relationship: communityReferences.relationship,
          yearsKnown: communityReferences.yearsKnown,
          trustRating: communityReferences.trustRating,
          verificationStatus: communityReferences.verificationStatus,
          verifiedAt: communityReferences.verifiedAt,
          createdAt: communityReferences.createdAt,
        })
        .from(communityReferences)
        .where(eq(communityReferences.userId, req.session.userId))
        .orderBy(desc(communityReferences.createdAt));

      const summary = {
        totalReferences: references.length,
        verifiedReferences: references.filter(
          (r) => r.verificationStatus === "verified"
        ).length,
        pendingReferences: references.filter(
          (r) => r.verificationStatus === "pending"
        ).length,
        averageTrustRating:
          references.length > 0 ?
            references.reduce((sum, r) => sum + r.trustRating, 0) /
            references.length
          : 0,
      };

      res.json({
        success: true,
        data: {
          references,
          summary,
          recommendations: generateReferenceRecommendations(summary),
        },
      });
    } catch (error) {
      console.error("Get community references error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get community references",
      });
    }
  });

  // ============================================================================
  // COMMUNITY ENDORSEMENT ROUTES
  // ============================================================================

  // Add Community Endorsement
  app.post(
    "/api/community/endorsements",
    communityActionLimiter,
    async (req: Request, res: Response) => {
      try {
        if (!req.session?.userId) {
          return res.status(401).json({
            success: false,
            message: "Authentication required",
          });
        }

        const validatedData = addEndorsementSchema.parse(req.body);

        // Insert new endorsement
        const [newEndorsement] = await db
          .insert(communityEndorsements)
          .values({
            userId: req.session.userId,
            ...validatedData,
          })
          .returning();

        // TODO: Send verification request to endorser
        // await sendEndorsementVerificationRequest(validatedData.endorserContact, newEndorsement.id);

        // Update trust score
        await updateUserTrustScore(req.session.userId);

        res.json({
          success: true,
          message: "Community endorsement request submitted",
          data: {
            endorsementId: newEndorsement.id,
            verificationStatus: "pending",
            nextSteps: [
              "The community leader will be contacted for verification",
              "Endorsement verification may take 3-7 days",
              "You will be notified once verification is complete",
            ],
          },
        });
      } catch (error) {
        console.error("Add community endorsement error:", error);

        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: error.errors,
          });
        }

        res.status(500).json({
          success: false,
          message: "Failed to add community endorsement",
        });
      }
    }
  );

  // ============================================================================
  // LOCATION TRUST ROUTES
  // ============================================================================

  // Update Location Trust Information
  app.put(
    "/api/community/location-trust",
    async (req: Request, res: Response) => {
      try {
        if (!req.session?.userId) {
          return res.status(401).json({
            success: false,
            message: "Authentication required",
          });
        }

        const validatedData = updateLocationTrustSchema.parse(req.body);

        // Analyze local knowledge using AI
        const localKnowledgeScore = await analyzeLocalKnowledge(
          validatedData.localKnowledge,
          validatedData.area,
          validatedData.city
        );

        // Check if location trust record exists
        const existingLocationTrust = await db
          .select()
          .from(locationTrust)
          .where(eq(locationTrust.userId, req.session.userId))
          .limit(1);

        let locationTrustRecord;

        if (existingLocationTrust.length > 0) {
          // Update existing record
          [locationTrustRecord] = await db
            .update(locationTrust)
            .set({
              area: validatedData.area,
              city: validatedData.city,
              yearsInArea: validatedData.yearsInArea,
              localKnowledge: localKnowledgeScore,
              localBusinessOwner: validatedData.localBusinessOwner || false,
              communityInvolvement: validatedData.communityInvolvement ? 8 : 5, // AI would score this
              updatedAt: new Date(),
            })
            .where(eq(locationTrust.userId, req.session.userId))
            .returning();
        } else {
          // Create new record
          [locationTrustRecord] = await db
            .insert(locationTrust)
            .values({
              userId: req.session.userId,
              area: validatedData.area,
              city: validatedData.city,
              yearsInArea: validatedData.yearsInArea,
              localKnowledge: localKnowledgeScore,
              neighborhoodReputation: 7, // Default, would be calculated from community feedback
              physicalPresence: false, // Updated when user meets others
              localBusinessOwner: validatedData.localBusinessOwner || false,
              communityInvolvement: validatedData.communityInvolvement ? 8 : 5,
            })
            .returning();
        }

        // Update trust score
        await updateUserTrustScore(req.session.userId);

        res.json({
          success: true,
          message: "Location trust information updated",
          data: {
            locationTrustId: locationTrustRecord.id,
            localKnowledgeScore,
            recommendations: [
              "Connect with neighbors on the platform to increase your neighborhood reputation",
              "Arrange in-person meetings to boost your physical presence score",
              "Join local community groups to improve community involvement",
            ],
          },
        });
      } catch (error) {
        console.error("Update location trust error:", error);

        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: error.errors,
          });
        }

        res.status(500).json({
          success: false,
          message: "Failed to update location trust",
        });
      }
    }
  );

  // ============================================================================
  // TRUST SCORE ROUTES
  // ============================================================================

  // Get Comprehensive Trust Score
  app.get("/api/community/trust-score", async (req: Request, res: Response) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const trustScoreRecord = await db
        .select()
        .from(trustScores)
        .where(eq(trustScores.userId, req.session.userId))
        .limit(1);

      if (trustScoreRecord.length === 0) {
        // Calculate initial trust score
        await updateUserTrustScore(req.session.userId);

        // Fetch the newly created score
        const [newTrustScore] = await db
          .select()
          .from(trustScores)
          .where(eq(trustScores.userId, req.session.userId))
          .limit(1);

        return res.json({
          success: true,
          data: formatTrustScoreResponse(newTrustScore),
        });
      }

      const [currentTrustScore] = trustScoreRecord;

      // Check if score needs recalculation (older than 24 hours)
      const lastCalculated = new Date(currentTrustScore.lastCalculatedAt);
      const now = new Date();
      const hoursSinceCalculation =
        (now.getTime() - lastCalculated.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCalculation > 24) {
        await updateUserTrustScore(req.session.userId);

        // Fetch updated score
        const [updatedTrustScore] = await db
          .select()
          .from(trustScores)
          .where(eq(trustScores.userId, req.session.userId))
          .limit(1);

        return res.json({
          success: true,
          data: formatTrustScoreResponse(updatedTrustScore),
        });
      }

      res.json({
        success: true,
        data: formatTrustScoreResponse(currentTrustScore),
      });
    } catch (error) {
      console.error("Get trust score error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get trust score",
      });
    }
  });

  // ============================================================================
  // PHYSICAL VERIFICATION ROUTES (SECONDARY)
  // ============================================================================

  // Request Physical Verification
  app.post(
    "/api/community/physical-verification",
    communityActionLimiter,
    async (req: Request, res: Response) => {
      try {
        if (!req.session?.userId) {
          return res.status(401).json({
            success: false,
            message: "Authentication required",
          });
        }

        const validatedData = requestPhysicalVerificationSchema.parse(req.body);

        // Check if requester has sufficient trust level for this transaction value
        const requesterTrustScore = await db
          .select()
          .from(trustScores)
          .where(eq(trustScores.userId, req.session.userId))
          .limit(1);

        if (
          requesterTrustScore.length === 0 ||
          requesterTrustScore[0].maxTransactionValue <
            validatedData.transactionValue
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Your trust level is insufficient for this transaction value",
            data: {
              yourMaxTransactionValue:
                requesterTrustScore[0]?.maxTransactionValue || 0,
              requestedTransactionValue: validatedData.transactionValue,
              recommendation:
                "Build your community trust score to access higher transaction values",
            },
          });
        }

        // Create physical verification request
        const [verificationRequest] = await db
          .insert(physicalVerificationRequests)
          .values({
            requesterId: req.session.userId,
            ...validatedData,
            scheduledAt:
              validatedData.scheduledAt ?
                new Date(validatedData.scheduledAt)
              : null,
          })
          .returning();

        // TODO: Notify target user about verification request
        // await notifyPhysicalVerificationRequest(validatedData.targetUserId, verificationRequest.id);

        res.json({
          success: true,
          message: "Physical verification request submitted",
          data: {
            requestId: verificationRequest.id,
            status: "pending",
            nextSteps: [
              "The other party will be notified of your verification request",
              "They can accept or decline the request",
              "If accepted, you can coordinate meeting details",
              "Verification must be completed before transaction",
            ],
            estimatedCost: calculateVerificationCost(
              validatedData.verificationType,
              validatedData.transactionValue
            ),
          },
        });
      } catch (error) {
        console.error("Request physical verification error:", error);

        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            message: "Validation error",
            errors: error.errors,
          });
        }

        res.status(500).json({
          success: false,
          message: "Failed to request physical verification",
        });
      }
    }
  );

  // Get Physical Verification Requests
  app.get(
    "/api/community/physical-verification",
    async (req: Request, res: Response) => {
      try {
        if (!req.session?.userId) {
          return res.status(401).json({
            success: false,
            message: "Authentication required",
          });
        }

        // Get requests where user is either requester or target
        const requests = await db
          .select()
          .from(physicalVerificationRequests)
          .where(
            eq(physicalVerificationRequests.requesterId, req.session.userId)
            // TODO: Add OR condition for targetUserId when we have proper joins
          )
          .orderBy(desc(physicalVerificationRequests.createdAt));

        res.json({
          success: true,
          data: {
            requests: requests.map((request) => ({
              id: request.id,
              type: request.verificationType,
              transactionValue: request.transactionValue,
              status: request.status,
              scheduledAt: request.scheduledAt,
              createdAt: request.createdAt,
              isRequester: request.requesterId === req.session.userId,
            })),
            summary: {
              totalRequests: requests.length,
              pendingRequests: requests.filter((r) => r.status === "pending")
                .length,
              completedRequests: requests.filter(
                (r) => r.status === "completed"
              ).length,
            },
          },
        });
      } catch (error) {
        console.error("Get physical verification requests error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to get verification requests",
        });
      }
    }
  );

  console.log("✅ Community trust routes registered");
  console.log("🏘️  Primary verification: Community-based trust system");
  console.log(
    "📄 Secondary verification: Physical document verification available"
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function updateUserTrustScore(userId: number): Promise<void> {
  try {
    // Get all trust-related data for user
    const [references, endorsements, locationTrustData, behaviorData] =
      await Promise.all([
        db
          .select()
          .from(communityReferences)
          .where(eq(communityReferences.userId, userId)),
        db
          .select()
          .from(communityEndorsements)
          .where(eq(communityEndorsements.userId, userId)),
        db
          .select()
          .from(locationTrust)
          .where(eq(locationTrust.userId, userId))
          .limit(1),
        db
          .select()
          .from(behaviorPatterns)
          .where(eq(behaviorPatterns.userId, userId))
          .limit(1),
      ]);

    // Calculate comprehensive trust score using AI
    const trustResult = await trustCalculator.calculateComprehensiveTrust({
      userId,
      behaviorPattern: behaviorData[0] || getDefaultBehaviorPattern(userId),
      communityReferences: references,
      socialConnections: [], // TODO: Implement social connections
      locationTrust: locationTrustData[0] || getDefaultLocationTrust(userId),
      endorsements,
      transactionHistory: {
        successfulTransactions: 0, // TODO: Get from transactions table
        totalValue: 0,
        averageRating: 0,
        cancellationRate: 0,
      },
    });

    // Update or insert trust score
    const existingTrustScore = await db
      .select()
      .from(trustScores)
      .where(eq(trustScores.userId, userId))
      .limit(1);

    if (existingTrustScore.length > 0) {
      await db
        .update(trustScores)
        .set({
          overallScore: trustResult.overallScore,
          trustLevel: trustResult.trustLevel,
          communityScore: trustResult.scoreBreakdown.community,
          behaviorScore: trustResult.scoreBreakdown.behavior,
          socialScore: trustResult.scoreBreakdown.social,
          locationScore: trustResult.scoreBreakdown.location,
          endorsementScore: trustResult.scoreBreakdown.endorsement,
          transactionScore: trustResult.scoreBreakdown.transaction,
          riskLevel: trustResult.riskLevel,
          maxTransactionValue: trustResult.maxTransactionValue,
          lastCalculatedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(trustScores.userId, userId));
    } else {
      await db.insert(trustScores).values({
        userId,
        overallScore: trustResult.overallScore,
        trustLevel: trustResult.trustLevel,
        communityScore: trustResult.scoreBreakdown.community,
        behaviorScore: trustResult.scoreBreakdown.behavior,
        socialScore: trustResult.scoreBreakdown.social,
        locationScore: trustResult.scoreBreakdown.location,
        endorsementScore: trustResult.scoreBreakdown.endorsement,
        transactionScore: trustResult.scoreBreakdown.transaction,
        riskLevel: trustResult.riskLevel,
        maxTransactionValue: trustResult.maxTransactionValue,
        calculationVersion: "1.0",
      });
    }
  } catch (error) {
    console.error("Failed to update trust score:", error);
  }
}

function getDefaultBehaviorPattern(userId: number): any {
  return {
    userId,
    responseTimeAvg: 60,
    profileCompleteness: 50,
    communicationQuality: 5,
    consistencyScore: 5,
    activityLevel: 3,
    transactionHistory: 0,
    cancellationRate: 0,
    positiveInteractions: 0,
    flaggedInteractions: 0,
    lastActivityAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function getDefaultLocationTrust(userId: number): any {
  return {
    userId,
    area: "Unknown",
    city: "Unknown",
    yearsInArea: 0,
    localKnowledge: 0,
    neighborhoodReputation: 5,
    physicalPresence: false,
    localBusinessOwner: false,
    communityInvolvement: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function analyzeLocalKnowledge(
  description: string,
  area: string,
  city: string
): Promise<number> {
  // TODO: Use AI to analyze local knowledge description
  // For now, return a simple score based on description length and detail
  const words = description.split(" ").length;
  const hasSpecificDetails =
    description.includes("school") ||
    description.includes("hospital") ||
    description.includes("market") ||
    description.includes("church");

  let score = Math.min(words / 10, 8); // Base score from description length
  if (hasSpecificDetails) score += 2; // Bonus for specific local details

  return Math.min(Math.round(score), 10);
}

function generateReferenceRecommendations(summary: any): string[] {
  const recommendations: string[] = [];

  if (summary.totalReferences < 2) {
    recommendations.push("Add at least 2 community references to build trust");
  }

  if (summary.verifiedReferences === 0) {
    recommendations.push(
      "Follow up with your references to complete verification"
    );
  }

  if (summary.averageTrustRating < 7) {
    recommendations.push(
      "Consider adding references who know you better and can rate you higher"
    );
  }

  if (summary.totalReferences < 5) {
    recommendations.push(
      "Add references from different relationship types (neighbor, colleague, church member)"
    );
  }

  return recommendations;
}

function formatTrustScoreResponse(trustScore: any): any {
  const requirements = getTrustLevelRequirements(trustScore.trustLevel);

  return {
    overallScore: trustScore.overallScore,
    trustLevel: trustScore.trustLevel,
    maxTransactionValue: trustScore.maxTransactionValue,
    riskLevel: trustScore.riskLevel,
    scoreBreakdown: {
      community: trustScore.communityScore,
      behavior: trustScore.behaviorScore,
      social: trustScore.socialScore,
      location: trustScore.locationScore,
      endorsement: trustScore.endorsementScore,
      transaction: trustScore.transactionScore,
    },
    trustLevelInfo: {
      current: trustScore.trustLevel,
      requirements: requirements.requirements,
      benefits: [
        `Maximum transaction value: KES ${trustScore.maxTransactionValue.toLocaleString()}`,
        "Access to community-verified listings",
        "Priority customer support",
        "Reduced verification requirements",
      ],
    },
    lastCalculated: trustScore.lastCalculatedAt,
    nextRecalculation: new Date(
      trustScore.lastCalculatedAt.getTime() + 24 * 60 * 60 * 1000
    ), // 24 hours later
  };
}

function calculateVerificationCost(
  verificationType:
    | "in_person_meeting"
    | "agent_verification"
    | "document_check",
  transactionValue: number
): number {
  const baseCosts = {
    in_person_meeting: 0, // Free for users to meet
    agent_verification: 2000, // KES 2,000 for agent verification
    document_check: 1000, // KES 1,000 for document verification
  };

  const baseCost = baseCosts[verificationType];

  // Add percentage fee for high-value transactions
  if (transactionValue > 1000000) {
    // > 1M KES
    return baseCost + transactionValue * 0.001; // 0.1% fee
  }

  return baseCost;
}
