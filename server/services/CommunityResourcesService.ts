import { eq, and, desc, sql, count, avg, ilike, or } from "drizzle-orm";

import { 
  communityExperiences, 
  experienceComments, 
  experienceInteractions,
  contentReports,
  users 
} from "../../src/shared/schema";
import { db } from "../infrastructure/database/connection";

import { NotificationService } from "./notification-service";

interface CommunityExperience {
  id: string;
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
  likes: number;
  comments: number;
  views: number;
  helpful: number;
  tags: string[];
  author?: {
    name: string;
    verified: boolean;
  };
}

interface ExperienceComment {
  id: string;
  experienceId: string;
  userId: number;
  content: string;
  anonymous: boolean;
  createdAt: Date;
  likes: number;
  author?: {
    name: string;
    verified: boolean;
  };
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

export class CommunityResourcesService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Get community experiences with filtering and pagination
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

      // Get total count
      const [{ count: totalCount }] = await db
        .select({ count: count() })
        .from(communityExperiences)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Determine sort order
      let orderBy;
      switch (query.sortBy) {
        case 'popular':
          orderBy = desc(communityExperiences.likes);
          break;
        case 'amount':
          orderBy = desc(sql`CAST(REGEXP_REPLACE(${communityExperiences.amountLost}, '[^0-9.]', '', 'g') AS NUMERIC)`);
          break;
        case 'resolved':
          orderBy = [desc(communityExperiences.resolutionStatus), desc(communityExperiences.datePosted)];
          break;
        default:
          orderBy = desc(communityExperiences.datePosted);
      }

      // Get experiences with user info
      const experiencesQuery = db
        .select({
          experience: communityExperiences,
          author: {
            name: users.name,
            verified: users.verified
          }
        })
        .from(communityExperiences)
        .leftJoin(users, eq(communityExperiences.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderBy)
        .limit(query.limit || 10)
        .offset(query.offset || 0);

      const results = await experiencesQuery;

      const experiences = results.map(result => ({
        id: result.experience.id,
        title: result.experience.title,
        location: result.experience.location,
        fraudType: result.experience.fraudType,
        amountLost: result.experience.amountLost || undefined,
        whatHappened: result.experience.whatHappened,
        personalVulnerabilities: result.experience.personalVulnerabilities || undefined,
        systemicChallenges: result.experience.systemicChallenges || undefined,
        lessonsLearned: result.experience.lessonsLearned || undefined,
        resolutionStatus: result.experience.resolutionStatus as CommunityExperience['resolutionStatus'],
        resolutionDetails: result.experience.resolutionDetails || undefined,
        anonymous: result.experience.anonymous,
        userId: result.experience.userId,
        datePosted: result.experience.datePosted,
        likes: result.experience.likes,
        comments: result.experience.comments,
        views: result.experience.views,
        helpful: result.experience.helpful,
        tags: result.experience.tags ? JSON.parse(result.experience.tags) : [],
        author: result.experience.anonymous ? undefined : {
          name: result.author?.name || 'Anonymous User',
          verified: result.author?.verified || false
        }
      }));

      return {
        experiences,
        total: totalCount,
        hasMore: (query.offset || 0) + (query.limit || 10) < totalCount
      };

    } catch (error) {
      console.error('Error fetching community experiences:', error);
      throw new Error('Failed to fetch community experiences');
    }
  }

  /**
   * Share a new experience
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
      // Generate tags based on content
      const tags = this.generateTags(experienceData);

      const [experience] = await db
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

      // Send notification to community moderators
      await this.notificationService.sendCommunityModerationNotification(experience);

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
        tags: JSON.parse(experience.tags)
      };

    } catch (error) {
      console.error('Error sharing community experience:', error);
      throw new Error('Failed to share experience');
    }
  }

  /**
   * Get a specific experience with comments
   */
  async getExperienceById(experienceId: string): Promise<{
    experience: CommunityExperience;
    comments: ExperienceComment[];
  } | null> {
    try {
      // Get experience with author info
      const [experienceResult] = await db
        .select({
          experience: communityExperiences,
          author: {
            name: users.name,
            verified: users.verified
          }
        })
        .from(communityExperiences)
        .leftJoin(users, eq(communityExperiences.userId, users.id))
        .where(eq(communityExperiences.id, experienceId));

      if (!experienceResult) {
        return null;
      }

      // Increment view count
      await db
        .update(communityExperiences)
        .set({ views: sql`${communityExperiences.views} + 1` })
        .where(eq(communityExperiences.id, experienceId));

      // Get comments with author info
      const commentsResults = await db
        .select({
          comment: experienceComments,
          author: {
            name: users.name,
            verified: users.verified
          }
        })
        .from(experienceComments)
        .leftJoin(users, eq(experienceComments.userId, users.id))
        .where(eq(experienceComments.experienceId, experienceId))
        .orderBy(desc(experienceComments.createdAt));

      const experience = {
        id: experienceResult.experience.id,
        title: experienceResult.experience.title,
        location: experienceResult.experience.location,
        fraudType: experienceResult.experience.fraudType,
        amountLost: experienceResult.experience.amountLost || undefined,
        whatHappened: experienceResult.experience.whatHappened,
        personalVulnerabilities: experienceResult.experience.personalVulnerabilities || undefined,
        systemicChallenges: experienceResult.experience.systemicChallenges || undefined,
        lessonsLearned: experienceResult.experience.lessonsLearned || undefined,
        resolutionStatus: experienceResult.experience.resolutionStatus as CommunityExperience['resolutionStatus'],
        resolutionDetails: experienceResult.experience.resolutionDetails || undefined,
        anonymous: experienceResult.experience.anonymous,
        userId: experienceResult.experience.userId,
        datePosted: experienceResult.experience.datePosted,
        likes: experienceResult.experience.likes,
        comments: experienceResult.experience.comments,
        views: experienceResult.experience.views + 1, // Include the increment
        helpful: experienceResult.experience.helpful,
        tags: experienceResult.experience.tags ? JSON.parse(experienceResult.experience.tags) : [],
        author: experienceResult.experience.anonymous ? undefined : {
          name: experienceResult.author?.name || 'Anonymous User',
          verified: experienceResult.author?.verified || false
        }
      };

      const comments = commentsResults.map(result => ({
        id: result.comment.id,
        experienceId: result.comment.experienceId,
        userId: result.comment.userId,
        content: result.comment.content,
        anonymous: result.comment.anonymous,
        createdAt: result.comment.createdAt,
        likes: result.comment.likes,
        author: result.comment.anonymous ? undefined : {
          name: result.author?.name || 'Anonymous User',
          verified: result.author?.verified || false
        }
      }));

      return { experience, comments };

    } catch (error) {
      console.error('Error fetching experience by ID:', error);
      throw new Error('Failed to fetch experience');
    }
  }

  /**
   * Interact with an experience (like, helpful, etc.)
   */
  async interactWithExperience(
    userId: number,
    experienceId: string,
    interactionType: 'like' | 'unlike' | 'helpful' | 'unhelpful'
  ): Promise<{ success: boolean; newCount: number }> {
    try {
      // Check if user already has an interaction
      const [existingInteraction] = await db
        .select()
        .from(experienceInteractions)
        .where(and(
          eq(experienceInteractions.userId, userId),
          eq(experienceInteractions.experienceId, experienceId),
          eq(experienceInteractions.type, interactionType.replace('un', ''))
        ));

      let newCount = 0;

      if (interactionType.startsWith('un')) {
        // Remove interaction
        if (existingInteraction) {
          await db
            .delete(experienceInteractions)
            .where(eq(experienceInteractions.id, existingInteraction.id));

          // Decrement count
          const field = interactionType === 'unlike' ? 'likes' : 'helpful';
          await db
            .update(communityExperiences)
            .set({ [field]: sql`${communityExperiences[field]} - 1` })
            .where(eq(communityExperiences.id, experienceId));

          // Get new count
          const [updated] = await db
            .select({ count: communityExperiences[field] })
            .from(communityExperiences)
            .where(eq(communityExperiences.id, experienceId));
          
          newCount = updated.count;
        }
      } else {
        // Add interaction
        if (!existingInteraction) {
          await db
            .insert(experienceInteractions)
            .values({
              userId,
              experienceId,
              type: interactionType,
              createdAt: new Date()
            });

          // Increment count
          const field = interactionType === 'like' ? 'likes' : 'helpful';
          await db
            .update(communityExperiences)
            .set({ [field]: sql`${communityExperiences[field]} + 1` })
            .where(eq(communityExperiences.id, experienceId));

          // Get new count
          const [updated] = await db
            .select({ count: communityExperiences[field] })
            .from(communityExperiences)
            .where(eq(communityExperiences.id, experienceId));
          
          newCount = updated.count;
        }
      }

      return { success: true, newCount };

    } catch (error) {
      console.error('Error processing experience interaction:', error);
      throw new Error('Failed to process interaction');
    }
  }

  /**
   * Add comment to an experience
   */
  async addComment(commentData: {
    experienceId: string;
    userId: number;
    content: string;
    anonymous: boolean;
    createdAt: Date;
  }): Promise<ExperienceComment> {
    try {
      const [comment] = await db
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
        likes: comment.likes
      };

    } catch (error) {
      console.error('Error adding comment:', error);
      throw new Error('Failed to add comment');
    }
  }

  /**
   * Get community statistics
   */
  async getCommunityStats(): Promise<CommunityStats> {
    try {
      // Total experiences
      const [{ count: totalExperiences }] = await db
        .select({ count: count() })
        .from(communityExperiences);

      // Resolved cases
      const [{ count: resolvedCases }] = await db
        .select({ count: count() })
        .from(communityExperiences)
        .where(eq(communityExperiences.resolutionStatus, 'resolved'));

      // Total losses (sum of amounts)
      const [{ total: totalLossesResult }] = await db
        .select({
          total: sql`SUM(CAST(REGEXP_REPLACE(${communityExperiences.amountLost}, '[^0-9.]', '', 'g') AS NUMERIC))`
        })
        .from(communityExperiences)
        .where(sql`${communityExperiences.amountLost} IS NOT NULL`);

      const totalLosses = Number(totalLossesResult) || 0;

      // Active members (users who posted in last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const [{ count: activeMembers }] = await db
        .select({ count: sql`COUNT(DISTINCT ${communityExperiences.userId})` })
        .from(communityExperiences)
        .where(sql`${communityExperiences.datePosted} >= ${threeMonthsAgo}`);

      // This month stats
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);

      const [{ count: newExperiencesThisMonth }] = await db
        .select({ count: count() })
        .from(communityExperiences)
        .where(sql`${communityExperiences.datePosted} >= ${thisMonthStart}`);

      const [{ count: resolvedThisMonth }] = await db
        .select({ count: count() })
        .from(communityExperiences)
        .where(and(
          eq(communityExperiences.resolutionStatus, 'resolved'),
          sql`${communityExperiences.datePosted} >= ${thisMonthStart}`
        ));

      const [{ total: savedThisMonthResult }] = await db
        .select({
          total: sql`SUM(CAST(REGEXP_REPLACE(${communityExperiences.amountLost}, '[^0-9.]', '', 'g') AS NUMERIC))`
        })
        .from(communityExperiences)
        .where(and(
          eq(communityExperiences.resolutionStatus, 'resolved'),
          sql`${communityExperiences.datePosted} >= ${thisMonthStart}`
        ));

      const savedThisMonth = Number(savedThisMonthResult) || 0;

      return {
        totalExperiences,
        resolvedCases,
        totalLosses,
        activeMembers,
        thisMonth: {
          newExperiences: newExperiencesThisMonth,
          resolvedCases: resolvedThisMonth,
          savedAmount: savedThisMonth
        }
      };

    } catch (error) {
      console.error('Error fetching community stats:', error);
      throw new Error('Failed to fetch community statistics');
    }
  }

  /**
   * Get categories with counts
   */
  async getCategories(): Promise<Array<{ id: string; name: string; count: number }>> {
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
      };

      const result = categories.map(cat => ({
        id: cat.fraudType,
        name: categoryMap[cat.fraudType as keyof typeof categoryMap] || cat.fraudType,
        count: cat.count
      }));

      // Add "all" category
      const totalCount = result.reduce((sum, cat) => sum + cat.count, 0);
      result.unshift({ id: 'all', name: 'All Stories', count: totalCount });

      return result;

    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Report inappropriate content
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
      const [report] = await db
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

      // Send notification to moderators
      await this.notificationService.sendContentReportNotification(report);

      return {
        id: report.id,
        status: report.status
      };

    } catch (error) {
      console.error('Error reporting content:', error);
      throw new Error('Failed to report content');
    }
  }

  /**
   * Get user's own experiences
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
        tags: exp.tags ? JSON.parse(exp.tags) : []
      }));

    } catch (error) {
      console.error('Error fetching user experiences:', error);
      throw new Error('Failed to fetch user experiences');
    }
  }

  /**
   * Private helper methods
   */
  private generateTags(experienceData: any): string[] {
    const tags = [];
    
    // Add fraud type
    tags.push(experienceData.fraudType);
    
    // Add location-based tag
    const location = experienceData.location.toLowerCase();
    if (location.includes('nairobi')) tags.push('nairobi');
    if (location.includes('mombasa')) tags.push('mombasa');
    if (location.includes('kisumu')) tags.push('kisumu');
    if (location.includes('nakuru')) tags.push('nakuru');
    if (location.includes('eldoret')) tags.push('eldoret');
    
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
    const content = (`${experienceData.whatHappened  } ${  experienceData.lessonsLearned || ''}`).toLowerCase();
    if (content.includes('title')) tags.push('title-fraud');
    if (content.includes('broker')) tags.push('broker-scam');
    if (content.includes('developer')) tags.push('developer-fraud');
    if (content.includes('rental')) tags.push('rental-scam');
    if (content.includes('deposit')) tags.push('deposit-scam');
    
    return [...new Set(tags)]; // Remove duplicates
  }

  private parseAmount(amount: string): number {
    const cleaned = amount.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  }
}