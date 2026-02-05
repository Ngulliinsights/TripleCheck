import { eq, and, desc, sql, count, ilike, or } from "drizzle-orm";

import {
  communityExperiences,
  experienceComments,
  experienceInteractions,
  contentReports,
  users
} from "../../src/shared/schema";
import { db } from "../infrastructure/database/connection";

import { NotificationService } from "..\communication\notification.service";

// Constants to avoid duplication
const ANONYMOUS_USER = 'Anonymous User';
const DEFAULT_LIMIT = 10;
const THREE_MONTHS_AGO_MS = 3 * 30 * 24 * 60 * 60 * 1000;

interface CommunityExperience {
  id: string;
  title: string;
  location: string;
  fraudType: string;
  amountLost?: string | undefined;
  whatHappened: string;
  personalVulnerabilities?: string | undefined;
  systemicChallenges?: string | undefined;
  lessonsLearned?: string | undefined;
  resolutionStatus: 'resolved' | 'partial' | 'unresolved';
  resolutionDetails?: string | undefined;
  anonymous: boolean;
  userId: number;
  datePosted: Date;
  likes: number;
  comments: number;
  views: number;
  helpful: number;
  tags: string[];
  // Make author optional at the interface level to handle both anonymous and named cases
  author: {
    name: string;
    verified: boolean;
  } | undefined;
}

interface ExperienceComment {
  id: string;
  experienceId: string;
  userId: number;
  content: string;
  anonymous: boolean;
  createdAt: Date;
  likes: number;
  // Make author optional to handle anonymous comments
  author: {
    name: string;
    verified: boolean;
  } | undefined;
}

interface CommunityStats {
  totalExperiences: number;
  resolvedCases: number;
  totalLosses: number;
  activeMembers: number;
  thisMonth: {
    newExperiences: number;
    resolvedCases: number;
    savedAmount: number;
  };
}

// Helper type for database query results that might be undefined
// type QueryResult<T> = T | undefined;

export class CommunityResourcesService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Get community experiences with filtering and pagination
   * This method handles complex filtering logic while maintaining type safety
   */
  async getExperiences(query: {
    category?: string;
    search?: string;
    resolved?: string;
    location?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
  }): Promise<{
    experiences: CommunityExperience[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const conditions = this.buildQueryConditions(query);

      // Get total count with proper null handling
      const countResult = await db
        .select({ count: count() })
        .from(communityExperiences)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const totalCount = countResult[0]?.count ?? 0;

      // Determine sort order - extract to method for clarity
      const orderBy = this.buildOrderBy(query.sortBy);

      // Get experiences with user info
      const results = await db
        .select({
          // Select all experience fields explicitly
          id: communityExperiences.id,
          title: communityExperiences.title,
          location: communityExperiences.location,
          fraudType: communityExperiences.fraudType,
          amountLost: communityExperiences.amountLost,
          whatHappened: communityExperiences.whatHappened,
          personalVulnerabilities: communityExperiences.personalVulnerabilities,
          systemicChallenges: communityExperiences.systemicChallenges,
          lessonsLearned: communityExperiences.lessonsLearned,
          resolutionStatus: communityExperiences.resolutionStatus,
          resolutionDetails: communityExperiences.resolutionDetails,
          anonymous: communityExperiences.anonymous,
          userId: communityExperiences.userId,
          datePosted: communityExperiences.datePosted,
          likes: communityExperiences.likes,
          comments: communityExperiences.comments,
          views: communityExperiences.views,
          helpful: communityExperiences.helpful,
          tags: communityExperiences.tags,
          // Select user fields explicitly if they exist in schema
          userName: users.username,
          userVerified: users.emailVerifiedAt
        })
        .from(communityExperiences)
        .leftJoin(users, eq(communityExperiences.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(...orderBy)
        .limit(query.limit || DEFAULT_LIMIT)
        .offset(query.offset || 0);

      // Transform results with proper type safety
      const experiences = results.map(result => this.transformExperienceResult(result));

      return {
        experiences,
        total: totalCount,
        hasMore: (query.offset || 0) + (query.limit || DEFAULT_LIMIT) < totalCount
      };

    } catch (error) {
      this.logError('Error fetching community experiences:', error);
      throw new Error('Failed to fetch community experiences');
    }
  }

  /**
   * Share a new experience with comprehensive validation
   */
  async shareExperience(experienceData: {
    title: string;
    location: string;
    fraudType: string;
    amountLost?: string;
    whatHappened: string;
    personalVulnerabilities?: string;
    systemicChallenges?: string;
    lessonsLearned?: string;
    resolutionStatus: 'resolved' | 'partial' | 'unresolved';
    resolutionDetails?: string;
    anonymous: boolean;
    userId: number;
    datePosted: Date;
  }): Promise<CommunityExperience> {
    try {
      // Generate tags based on content - moved to helper method for clarity
      const tags = this.generateTags(experienceData);

      const insertResult = await db
        .insert(communityExperiences)
        .values({
          title: experienceData.title,
          location: experienceData.location,
          fraudType: experienceData.fraudType,
          amountLost: experienceData.amountLost,
          whatHappened: experienceData.whatHappened,
          personalVulnerabilities: experienceData.personalVulnerabilities,
          systemicChallenges: experienceData.systemicChallenges,
          lessonsLearned: experienceData.lessonsLearned,
          resolutionStatus: experienceData.resolutionStatus,
          resolutionDetails: experienceData.resolutionDetails,
          anonymous: experienceData.anonymous,
          userId: experienceData.userId,
          datePosted: experienceData.datePosted,
          likes: 0,
          comments: 0,
          views: 0,
          helpful: 0,
          tags: JSON.stringify(tags)
        })
        .returning();

      const [experience] = insertResult;
      if (!experience) {
        throw new Error('Failed to create experience record');
      }

      // Send notification to community moderators
      await this.notificationService.sendCommunityModerationNotification(experience);

      return this.transformExperienceForReturn(experience, tags);

    } catch (error) {
      this.logError('Error sharing community experience:', error);
      throw new Error('Failed to share experience');
    }
  }

  /**
   * Get a specific experience with comments and proper view tracking
   */
  async getExperienceById(experienceId: string): Promise<{
    experience: CommunityExperience;
    comments: ExperienceComment[];
  } | null> {
    try {
      // Get experience with author info
      const experienceResults = await db
        .select({
          // Explicit field selection for type safety
          id: communityExperiences.id,
          title: communityExperiences.title,
          location: communityExperiences.location,
          fraudType: communityExperiences.fraudType,
          amountLost: communityExperiences.amountLost,
          whatHappened: communityExperiences.whatHappened,
          personalVulnerabilities: communityExperiences.personalVulnerabilities,
          systemicChallenges: communityExperiences.systemicChallenges,
          lessonsLearned: communityExperiences.lessonsLearned,
          resolutionStatus: communityExperiences.resolutionStatus,
          resolutionDetails: communityExperiences.resolutionDetails,
          anonymous: communityExperiences.anonymous,
          userId: communityExperiences.userId,
          datePosted: communityExperiences.datePosted,
          likes: communityExperiences.likes,
          comments: communityExperiences.comments,
          views: communityExperiences.views,
          helpful: communityExperiences.helpful,
          tags: communityExperiences.tags,
          userName: users.username,
          userVerified: users.emailVerifiedAt
        })
        .from(communityExperiences)
        .leftJoin(users, eq(communityExperiences.userId, users.id))
        .where(eq(communityExperiences.id, experienceId));

      if (!experienceResults.length) {
        return null;
      }

      const [experienceResult] = experienceResults;

      // Increment view count with error handling
      await this.incrementViewCount(experienceId);

      // Get comments with author info
      const commentsResults = await db
        .select({
          id: experienceComments.id,
          experienceId: experienceComments.experienceId,
          userId: experienceComments.userId,
          content: experienceComments.content,
          anonymous: experienceComments.anonymous,
          createdAt: experienceComments.createdAt,
          likes: experienceComments.likes,
          userName: users.username,
          userVerified: users.emailVerifiedAt
        })
        .from(experienceComments)
        .leftJoin(users, eq(experienceComments.userId, users.id))
        .where(eq(experienceComments.experienceId, experienceId))
        .orderBy(desc(experienceComments.createdAt));

      // Transform results with proper type handling
      if (!experienceResult) {
        return null;
      }

      const experience = this.transformExperienceResult({
        ...experienceResult,
        views: (experienceResult.views ?? 0) + 1 // Include the incremented view count
      });

      const comments = commentsResults.map(result => this.transformCommentResult(result));

      return { experience, comments };

    } catch (error) {
      this.logError('Error fetching experience by ID:', error);
      throw new Error('Failed to fetch experience');
    }
  }

  /**
   * Interact with an experience (like, helpful, etc.) with proper transaction handling
   */
  async interactWithExperience(
    userId: number,
    experienceId: string,
    interactionType: 'like' | 'unlike' | 'helpful' | 'unhelpful'
  ): Promise<{ success: boolean; newCount: number }> {
    try {
      const baseType = interactionType.replace('un', '') as 'like' | 'helpful';
      const isRemoving = interactionType.startsWith('un');

      // Check if user already has an interaction
      const existingInteractions = await db
        .select()
        .from(experienceInteractions)
        .where(and(
          eq(experienceInteractions.userId, userId),
          eq(experienceInteractions.experienceId, experienceId),
          eq(experienceInteractions.type, baseType)
        ));

      const [existingInteraction] = existingInteractions;

      if (isRemoving && existingInteraction) {
        return await this.removeInteraction(existingInteraction.id, experienceId, baseType);
      } else if (!isRemoving && !existingInteraction) {
        return await this.addInteraction(userId, experienceId, baseType);
      }

      // No change needed - interaction already in desired state
      const currentCount = await this.getInteractionCount(experienceId, baseType);
      return { success: true, newCount: currentCount };

    } catch (error) {
      this.logError('Error processing experience interaction:', error);
      throw new Error('Failed to process interaction');
    }
  }

  /**
   * Add comment to an experience with proper validation
   */
  async addComment(commentData: {
    experienceId: string;
    userId: number;
    content: string;
    anonymous: boolean;
    createdAt: Date;
  }): Promise<ExperienceComment> {
    try {
      const insertResult = await db
        .insert(experienceComments)
        .values({
          experienceId: commentData.experienceId,
          userId: commentData.userId,
          content: commentData.content,
          anonymous: commentData.anonymous,
          createdAt: commentData.createdAt,
          likes: 0
        })
        .returning();

      const [comment] = insertResult;
      if (!comment) {
        throw new Error('Failed to create comment');
      }

      // Increment comment count on experience
      await db
        .update(communityExperiences)
        .set({ comments: sql`${communityExperiences.comments} + 1` })
        .where(eq(communityExperiences.id, commentData.experienceId));

      return {
        id: comment.id,
        experienceId: comment.experienceId,
        userId: comment.userId,
        content: comment.content,
        anonymous: comment.anonymous,
        createdAt: comment.createdAt,
        likes: comment.likes,
        author: comment.anonymous ? undefined : {
          name: ANONYMOUS_USER, // We don't have user info in this context
          verified: false
        }
      };

    } catch (error) {
      this.logError('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get community statistics with proper null handling
   */
  async getCommunityStats(): Promise<CommunityStats> {
    try {
      const [
        totalExperiencesResult,
        resolvedCasesResult,
        totalLossesResult,
        activeMembersResult,
        newExperiencesResult,
        resolvedThisMonthResult,
        savedThisMonthResult
      ] = await Promise.all([
        this.getTotalExperiences(),
        this.getResolvedCases(),
        this.getTotalLosses(),
        this.getActiveMembers(),
        this.getNewExperiencesThisMonth(),
        this.getResolvedCasesThisMonth(),
        this.getSavedAmountThisMonth()
      ]);

      return {
        totalExperiences: totalExperiencesResult,
        resolvedCases: resolvedCasesResult,
        totalLosses: totalLossesResult,
        activeMembers: activeMembersResult,
        thisMonth: {
          newExperiences: newExperiencesResult,
          resolvedCases: resolvedThisMonthResult,
          savedAmount: savedThisMonthResult
        }
      };

    } catch (error) {
      this.logError('Error fetching community stats:', error);
      throw new Error('Failed to fetch community statistics');
    }
  }

  /**
   * Get categories with counts and proper error handling
   */
  async getCategories(): Promise<Array<{ id: string; name: "Land Purchase" | "Rental Fraud" | "Property Development" | "Investment Scams" | "Other" | "All Stories"; count: number }>> {
    try {
      const categories = await db
        .select({
          fraudType: communityExperiences.fraudType,
          count: count()
        })
        .from(communityExperiences)
        .groupBy(communityExperiences.fraudType);

      const categoryMap = {
        'land': 'Land Purchase',
        'rental': 'Rental Fraud',
        'development': 'Property Development',
        'investment': 'Investment Scams',
        'other': 'Other'
      } as const;

      const result: Array<{ id: string; name: "Land Purchase" | "Rental Fraud" | "Property Development" | "Investment Scams" | "Other" | "All Stories"; count: number }> = categories.map(cat => ({
        id: cat.fraudType,
        name: (categoryMap[cat.fraudType as keyof typeof categoryMap] || cat.fraudType) as "Land Purchase" | "Rental Fraud" | "Property Development" | "Investment Scams" | "Other",
        count: cat.count
      }));

      // Add "all" category with total count
      const totalCount = result.reduce((sum, cat) => sum + cat.count, 0);
      result.unshift({ id: 'all', name: 'All Stories', count: totalCount });

      return result;

    } catch (error) {
      this.logError('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Report inappropriate content with comprehensive validation
   */
  async reportContent(reportData: {
    contentId: string;
    contentType: 'experience' | 'comment';
    reason: string;
    details?: string;
    reporterId: number;
    timestamp: Date;
  }): Promise<{ id: string; status: string }> {
    try {
      const insertResult = await db
        .insert(contentReports)
        .values({
          contentId: reportData.contentId,
          contentType: reportData.contentType,
          reason: reportData.reason,
          details: reportData.details,
          reporterId: reportData.reporterId,
          status: 'pending',
          timestamp: reportData.timestamp
        })
        .returning();

      const [report] = insertResult;
      if (!report) {
        throw new Error('Failed to create report');
      }

      // Send notification to moderators
      await this.notificationService.sendContentReportNotification(report);

      return {
        id: report.id,
        status: report.status
      };

    } catch (error) {
      this.logError('Error reporting content:', error);
      throw new Error('Failed to report content');
    }
  }

  /**
   * Get user's own experiences with proper type safety
   */
  async getUserExperiences(userId: number): Promise<CommunityExperience[]> {
    try {
      const experiences = await db
        .select()
        .from(communityExperiences)
        .where(eq(communityExperiences.userId, userId))
        .orderBy(desc(communityExperiences.datePosted));

      return experiences.map(exp => ({
        id: exp.id,
        title: exp.title,
        location: exp.location,
        fraudType: exp.fraudType,
        amountLost: exp.amountLost || undefined,
        whatHappened: exp.whatHappened,
        personalVulnerabilities: exp.personalVulnerabilities || undefined,
        systemicChallenges: exp.systemicChallenges || undefined,
        lessonsLearned: exp.lessonsLearned || undefined,
        resolutionStatus: exp.resolutionStatus as CommunityExperience['resolutionStatus'],
        resolutionDetails: exp.resolutionDetails || undefined,
        anonymous: exp.anonymous,
        userId: exp.userId,
        datePosted: exp.datePosted,
        likes: exp.likes,
        comments: exp.comments,
        views: exp.views,
        helpful: exp.helpful,
        tags: exp.tags ? JSON.parse(exp.tags) : [],
        author: exp.anonymous ? undefined : {
          name: ANONYMOUS_USER, // We don't have user info in this context
          verified: false
        }
      }));

    } catch (error) {
      this.logError('Error fetching user experiences:', error);
      throw new Error('Failed to fetch user experiences');
    }
  }

  /**
   * Private helper methods for better code organization and reusability
   */

  private buildQueryConditions(query: {
    category?: string;
    search?: string;
    resolved?: string;
    location?: string;
  }) {
    const conditions = [];

    // Category filter
    if (query.category && query.category !== 'all') {
      conditions.push(eq(communityExperiences.fraudType, query.category));
    }

    // Resolution status filter
    if (query.resolved && query.resolved !== 'all') {
      if (query.resolved === 'resolved') {
        conditions.push(eq(communityExperiences.resolutionStatus, 'resolved'));
      } else {
        conditions.push(or(
          eq(communityExperiences.resolutionStatus, 'partial'),
          eq(communityExperiences.resolutionStatus, 'unresolved')
        ));
      }
    }

    // Location filter
    if (query.location) {
      conditions.push(ilike(communityExperiences.location, `%${query.location}%`));
    }

    // Search filter
    if (query.search) {
      conditions.push(or(
        ilike(communityExperiences.title, `%${query.search}%`),
        ilike(communityExperiences.whatHappened, `%${query.search}%`),
        ilike(communityExperiences.location, `%${query.search}%`)
      ));
    }

    return conditions;
  }

  private buildOrderBy(sortBy?: string) {
    switch (sortBy) {
      case 'popular':
        return [desc(communityExperiences.likes)];
      case 'amount':
        return [desc(sql`CAST(REGEXP_REPLACE(${communityExperiences.amountLost}, '[^0-9.]', '', 'g') AS NUMERIC)`)];
      case 'resolved':
        return [desc(communityExperiences.resolutionStatus), desc(communityExperiences.datePosted)];
      default:
        return [desc(communityExperiences.datePosted)];
    }
  }

  private transformExperienceResult(result: {
    id: string;
    title: string;
    location: string;
    fraudType: string;
    amountLost?: string | null;
    whatHappened: string;
    personalVulnerabilities?: string | null;
    systemicChallenges?: string | null;
    lessonsLearned?: string | null;
    resolutionStatus: string;
    resolutionDetails?: string | null;
    anonymous: boolean;
    userId: number;
    datePosted: Date;
    likes: number;
    comments: number;
    views: number;
    helpful: number;
    tags?: string | null;
    userName?: string | null;
    userVerified?: Date | null;
  }): CommunityExperience {
    return {
      id: result.id,
      title: result.title,
      location: result.location,
      fraudType: result.fraudType,
      amountLost: result.amountLost || undefined,
      whatHappened: result.whatHappened,
      personalVulnerabilities: result.personalVulnerabilities || undefined,
      systemicChallenges: result.systemicChallenges || undefined,
      lessonsLearned: result.lessonsLearned || undefined,
      resolutionStatus: result.resolutionStatus as CommunityExperience['resolutionStatus'],
      resolutionDetails: result.resolutionDetails || undefined,
      anonymous: result.anonymous,
      userId: result.userId,
      datePosted: result.datePosted,
      likes: result.likes,
      comments: result.comments,
      views: result.views,
      helpful: result.helpful,
      tags: result.tags ? JSON.parse(result.tags) : [],
      author: result.anonymous ? undefined : {
        name: result.userName || ANONYMOUS_USER,
        verified: !!result.userVerified
      }
    };
  }

  private transformCommentResult(result: {
    id: string;
    experienceId: string;
    userId: number;
    content: string;
    anonymous: boolean;
    createdAt: Date;
    likes: number;
    userName?: string | null;
    userVerified?: Date | null;
  }): ExperienceComment {
    return {
      id: result.id,
      experienceId: result.experienceId,
      userId: result.userId,
      content: result.content,
      anonymous: result.anonymous,
      createdAt: result.createdAt,
      likes: result.likes,
      author: result.anonymous ? undefined : {
        name: result.userName || ANONYMOUS_USER,
        verified: !!result.userVerified
      }
    };
  }

  private transformExperienceForReturn(experience: {
    id: string;
    title: string;
    location: string;
    fraudType: string;
    amountLost?: string | null;
    whatHappened: string;
    personalVulnerabilities?: string | null;
    systemicChallenges?: string | null;
    lessonsLearned?: string | null;
    resolutionStatus: string;
    resolutionDetails?: string | null;
    anonymous: boolean;
    userId: number;
    datePosted: Date;
    likes: number;
    comments: number;
    views: number;
    helpful: number;
  }, tags: string[]): CommunityExperience {
    return {
      id: experience.id,
      title: experience.title,
      location: experience.location,
      fraudType: experience.fraudType,
      amountLost: experience.amountLost || undefined,
      whatHappened: experience.whatHappened,
      personalVulnerabilities: experience.personalVulnerabilities || undefined,
      systemicChallenges: experience.systemicChallenges || undefined,
      lessonsLearned: experience.lessonsLearned || undefined,
      resolutionStatus: experience.resolutionStatus as CommunityExperience['resolutionStatus'],
      resolutionDetails: experience.resolutionDetails || undefined,
      anonymous: experience.anonymous,
      userId: experience.userId,
      datePosted: experience.datePosted,
      likes: experience.likes,
      comments: experience.comments,
      views: experience.views,
      helpful: experience.helpful,
      tags,
      author: experience.anonymous ? undefined : {
        name: ANONYMOUS_USER, // We don't have user info in this context
        verified: false
      }
    };
  }

  private async incrementViewCount(experienceId: string): Promise<void> {
    try {
      await db
        .update(communityExperiences)
        .set({ views: sql`${communityExperiences.views} + 1` })
        .where(eq(communityExperiences.id, experienceId));
    } catch (error) {
      // Log but don't throw - view counting shouldn't break the main functionality
      this.logError('Error incrementing view count:', error);
    }
  }

  private async removeInteraction(
    interactionId: string,
    experienceId: string,
    type: 'like' | 'helpful'
  ): Promise<{ success: boolean; newCount: number }> {
    await db
      .delete(experienceInteractions)
      .where(eq(experienceInteractions.id, interactionId));

    if (type === 'like') {
      await db
        .update(communityExperiences)
        .set({ likes: sql`${communityExperiences.likes} - 1` })
        .where(eq(communityExperiences.id, experienceId));
    } else {
      await db
        .update(communityExperiences)
        .set({ helpful: sql`${communityExperiences.helpful} - 1` })
        .where(eq(communityExperiences.id, experienceId));
    }

    const newCount = await this.getInteractionCount(experienceId, type);
    return { success: true, newCount };
  }

  private async addInteraction(
    userId: number,
    experienceId: string,
    type: 'like' | 'helpful'
  ): Promise<{ success: boolean; newCount: number }> {
    await db
      .insert(experienceInteractions)
      .values({
        userId,
        experienceId,
        type,
        createdAt: new Date()
      });

    if (type === 'like') {
      await db
        .update(communityExperiences)
        .set({ likes: sql`${communityExperiences.likes} + 1` })
        .where(eq(communityExperiences.id, experienceId));
    } else {
      await db
        .update(communityExperiences)
        .set({ helpful: sql`${communityExperiences.helpful} + 1` })
        .where(eq(communityExperiences.id, experienceId));
    }

    const newCount = await this.getInteractionCount(experienceId, type);
    return { success: true, newCount };
  }

  private async getInteractionCount(experienceId: string, type: 'like' | 'helpful'): Promise<number> {
    if (type === 'like') {
      const results = await db
        .select({ count: communityExperiences.likes })
        .from(communityExperiences)
        .where(eq(communityExperiences.id, experienceId));
      return results[0]?.count ?? 0;
    } else {
      const results = await db
        .select({ count: communityExperiences.helpful })
        .from(communityExperiences)
        .where(eq(communityExperiences.id, experienceId));
      return results[0]?.count ?? 0;
    }
  }

  // Statistics helper methods for better organization
  private async getTotalExperiences(): Promise<number> {
    const results = await db
      .select({ count: count() })
      .from(communityExperiences);
    return results[0]?.count ?? 0;
  }

  private async getResolvedCases(): Promise<number> {
    const results = await db
      .select({ count: count() })
      .from(communityExperiences)
      .where(eq(communityExperiences.resolutionStatus, 'resolved'));
    return results[0]?.count ?? 0;
  }

  private async getTotalLosses(): Promise<number> {
    const results = await db
      .select({
        total: sql`SUM(CAST(REGEXP_REPLACE(${communityExperiences.amountLost}, '[^0-9.]', '', 'g') AS NUMERIC))`
      })
      .from(communityExperiences)
      .where(sql`${communityExperiences.amountLost} IS NOT NULL`);

    return Number(results[0]?.total) || 0;
  }

  private async getActiveMembers(): Promise<number> {
    const threeMonthsAgo = new Date(Date.now() - THREE_MONTHS_AGO_MS);

    const results = await db
      .select({ count: sql`COUNT(DISTINCT ${communityExperiences.userId})` })
      .from(communityExperiences)
      .where(sql`${communityExperiences.datePosted} >= ${threeMonthsAgo}`);

    return Number(results[0]?.count) || 0;
  }

  private async getNewExperiencesThisMonth(): Promise<number> {
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const results = await db
      .select({ count: count() })
      .from(communityExperiences)
      .where(sql`${communityExperiences.datePosted} >= ${thisMonthStart}`);

    return results[0]?.count ?? 0;
  }

  private async getResolvedCasesThisMonth(): Promise<number> {
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const results = await db
      .select({ count: count() })
      .from(communityExperiences)
      .where(and(
        eq(communityExperiences.resolutionStatus, 'resolved'),
        sql`${communityExperiences.datePosted} >= ${thisMonthStart}`
      ));

    return results[0]?.count ?? 0;
  }

  private async getSavedAmountThisMonth(): Promise<number> {
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const results = await db
      .select({
        total: sql`SUM(CAST(REGEXP_REPLACE(${communityExperiences.amountLost}, '[^0-9.]', '', 'g') AS NUMERIC))`
      })
      .from(communityExperiences)
      .where(and(
        eq(communityExperiences.resolutionStatus, 'resolved'),
        sql`${communityExperiences.datePosted} >= ${thisMonthStart}`
      ));

    return Number(results[0]?.total) || 0;
  }

  private generateTags(experienceData: {
    fraudType: string;
    location: string;
    resolutionStatus: string;
    amountLost?: string;
    whatHappened: string;
    lessonsLearned?: string;
  }): string[] {
    const tags = [];

    // Add fraud type
    tags.push(experienceData.fraudType);

    // Add location-based tag
    const location = experienceData.location.toLowerCase();
    const locationTags = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret'];
    locationTags.forEach(city => {
      if (location.includes(city)) {
        tags.push(city);
      }
    });

    // Add resolution status
    if (experienceData.resolutionStatus === 'resolved') {
      tags.push('resolved', 'recovery');
    } else {
      tags.push('unresolved');
    }

    // Add amount-based tags
    if (experienceData.amountLost) {
      const amount = this.parseAmount(experienceData.amountLost);
      if (amount > 1000000) tags.push('high-value');
      if (amount > 5000000) tags.push('major-loss');
    }

    // Add content-based tags
    const content = (`${experienceData.whatHappened} ${experienceData.lessonsLearned || ''}`).toLowerCase();
    const contentKeywords = [
      { keyword: 'title', tag: 'title-fraud' },
      { keyword: 'broker', tag: 'broker-scam' },
      { keyword: 'developer', tag: 'developer-fraud' },
      { keyword: 'rental', tag: 'rental-scam' },
      { keyword: 'deposit', tag: 'deposit-scam' }
    ];

    contentKeywords.forEach(({ keyword, tag }) => {
      if (content.includes(keyword)) {
        tags.push(tag);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  private parseAmount(amount: string): number {
    const cleaned = amount.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private logError(message: string, error: unknown): void {
    // In production, you might want to use a proper logging service
    // For now, we'll use console.error but make it conditional
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error(message, error);
    }

    // In production, you could send to a logging service:
    // this.loggingService.error(message, error);
  }
}