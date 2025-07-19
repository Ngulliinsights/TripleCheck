import { z } from 'zod';
import { Message, MessageThread } from '../hooks/useMessages';

// Communication validation schemas
export const MessageSchema = z.object({
  senderId: z.string().uuid('Invalid sender ID'),
  recipientId: z.string().uuid('Invalid recipient ID'),
  subject: z.string()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must not exceed 200 characters'),
  content: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must not exceed 5000 characters'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  threadId: z.string().uuid().optional(),
});

export const MessageThreadSchema = z.object({
  participants: z.array(z.string().uuid()).min(2, 'Thread must have at least 2 participants'),
  subject: z.string().min(3).max(200),
});

// Communication business logic implementation
export class CommunicationBusinessLogic {
  // Message priority scoring
  private static readonly PRIORITY_WEIGHTS = {
    low: 1,
    medium: 2,
    high: 3,
  };

  // Spam detection keywords
  private static readonly SPAM_KEYWORDS = [
    'urgent', 'act now', 'limited time', 'guaranteed', 'free money',
    'click here', 'call now', 'winner', 'congratulations', 'prize',
    'investment opportunity', 'make money fast', 'work from home',
  ];

  // Validate message data
  static validateMessage(data: unknown): Omit<Message, 'id' | 'timestamp' | 'isRead'> {
    try {
      return MessageSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Message validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  // Spam detection algorithm
  static detectSpam(message: {
    content: string;
    subject: string;
    senderId: string;
    senderHistory?: any[];
  }): {
    isSpam: boolean;
    spamScore: number;
    reasons: string[];
    confidence: number;
  } {
    let spamScore = 0;
    const reasons: string[] = [];

    // Check for spam keywords
    const combinedText = `${message.subject} ${message.content}`.toLowerCase();
    const foundKeywords = this.SPAM_KEYWORDS.filter(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );

    if (foundKeywords.length > 0) {
      spamScore += foundKeywords.length * 15;
      reasons.push(`Contains spam keywords: ${foundKeywords.join(', ')}`);
    }

    // Check for excessive capitalization
    const capsRatio = (message.content.match(/[A-Z]/g) || []).length / message.content.length;
    if (capsRatio > 0.3) {
      spamScore += 20;
      reasons.push('Excessive use of capital letters');
    }

    // Check for excessive punctuation
    const punctuationRatio = (message.content.match(/[!?]{2,}/g) || []).length;
    if (punctuationRatio > 2) {
      spamScore += 15;
      reasons.push('Excessive punctuation marks');
    }

    // Check for suspicious URLs
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = message.content.match(urlPattern) || [];
    if (urls.length > 3) {
      spamScore += 25;
      reasons.push('Contains multiple URLs');
    }

    // Check sender history
    if (message.senderHistory) {
      const recentMessages = message.senderHistory.filter(
        (msg: any) => new Date(msg.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );

      if (recentMessages.length > 20) {
        spamScore += 30;
        reasons.push('High message frequency from sender');
      }

      // Check for duplicate content
      const duplicateCount = message.senderHistory.filter(
        (msg: any) => msg.content === message.content
      ).length;

      if (duplicateCount > 0) {
        spamScore += 40;
        reasons.push('Duplicate message content detected');
      }
    }

    // Check message length patterns
    if (message.content.length < 20) {
      spamScore += 10;
      reasons.push('Suspiciously short message');
    }

    // Calculate confidence based on number of factors
    const confidence = Math.min(reasons.length * 20, 100);

    return {
      isSpam: spamScore >= 50,
      spamScore,
      reasons,
      confidence,
    };
  }

  // Message sentiment analysis
  static analyzeSentiment(content: string): {
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number;
    confidence: number;
    emotions: Record<string, number>;
  } {
    // Simple sentiment analysis (in production, use a proper NLP service)
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'love', 'like', 'happy', 'pleased', 'satisfied', 'perfect',
      'thank', 'thanks', 'appreciate', 'grateful', 'awesome'
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike',
      'angry', 'frustrated', 'disappointed', 'upset', 'annoyed',
      'problem', 'issue', 'complaint', 'wrong', 'error', 'fail'
    ];

    const urgentWords = [
      'urgent', 'emergency', 'asap', 'immediately', 'quickly',
      'rush', 'hurry', 'deadline', 'critical', 'important'
    ];

    const words = content.toLowerCase().split(/\s+/);
    
    let positiveCount = 0;
    let negativeCount = 0;
    let urgentCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
      if (urgentWords.includes(word)) urgentCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    let sentiment: 'positive' | 'neutral' | 'negative';
    let score = 0;

    if (totalSentimentWords === 0) {
      sentiment = 'neutral';
      score = 0;
    } else if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = (positiveCount - negativeCount) / totalSentimentWords;
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = (negativeCount - positiveCount) / totalSentimentWords;
    } else {
      sentiment = 'neutral';
      score = 0;
    }

    const confidence = Math.min(totalSentimentWords * 10, 100);

    return {
      sentiment,
      score: Math.abs(score),
      confidence,
      emotions: {
        positive: positiveCount,
        negative: negativeCount,
        urgent: urgentCount,
      },
    };
  }

  // Message thread management
  static organizeMessagesIntoThreads(messages: Message[]): MessageThread[] {
    const threadsMap = new Map<string, Message[]>();

    // Group messages by thread ID or create new threads
    messages.forEach(message => {
      const threadId = message.threadId || `${message.senderId}-${message.recipientId}`;
      
      if (!threadsMap.has(threadId)) {
        threadsMap.set(threadId, []);
      }
      
      threadsMap.get(threadId)!.push(message);
    });

    // Convert to MessageThread objects
    const threads: MessageThread[] = [];

    threadsMap.forEach((threadMessages, threadId) => {
      const sortedMessages = threadMessages.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const lastMessage = sortedMessages[0];
      const participants = Array.from(new Set([
        ...threadMessages.map(m => m.senderId),
        ...threadMessages.map(m => m.recipientId),
      ]));

      const unreadCount = threadMessages.filter(m => !m.isRead).length;

      threads.push({
        id: threadId,
        participants,
        subject: lastMessage.subject,
        lastMessage,
        messageCount: threadMessages.length,
        unreadCount,
      });
    });

    // Sort threads by last message timestamp
    return threads.sort(
      (a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  }

  // Message priority calculation
  static calculateMessagePriority(message: {
    content: string;
    subject: string;
    senderId: string;
    recipientId: string;
    senderTrustScore?: number;
  }): {
    priority: 'low' | 'medium' | 'high';
    score: number;
    factors: Record<string, number>;
  } {
    let score = 50; // Base score
    const factors: Record<string, number> = {};

    // Sentiment analysis
    const sentiment = this.analyzeSentiment(message.content);
    if (sentiment.emotions.urgent > 0) {
      const urgentBonus = sentiment.emotions.urgent * 10;
      score += urgentBonus;
      factors.urgency = urgentBonus;
    }

    if (sentiment.sentiment === 'negative' && sentiment.score > 0.5) {
      const negativeBonus = 15;
      score += negativeBonus;
      factors.negativeSentiment = negativeBonus;
    }

    // Trust score influence
    if (message.senderTrustScore) {
      if (message.senderTrustScore >= 800) {
        const trustBonus = 10;
        score += trustBonus;
        factors.highTrust = trustBonus;
      } else if (message.senderTrustScore < 400) {
        const trustPenalty = -10;
        score += trustPenalty;
        factors.lowTrust = trustPenalty;
      }
    }

    // Subject line analysis
    const subjectUrgent = /urgent|asap|emergency|important/i.test(message.subject);
    if (subjectUrgent) {
      const subjectBonus = 20;
      score += subjectBonus;
      factors.urgentSubject = subjectBonus;
    }

    // Message length consideration
    if (message.content.length > 1000) {
      const lengthBonus = 5;
      score += lengthBonus;
      factors.detailedMessage = lengthBonus;
    }

    // Determine priority level
    let priority: 'low' | 'medium' | 'high';
    if (score >= 80) {
      priority = 'high';
    } else if (score >= 60) {
      priority = 'medium';
    } else {
      priority = 'low';
    }

    return {
      priority,
      score: Math.max(0, Math.min(100, score)),
      factors,
    };
  }

  // Message delivery optimization
  static optimizeMessageDelivery(messages: Message[], recipientPreferences: {
    notificationFrequency: 'immediate' | 'batched' | 'scheduled';
    quietHours?: { start: string; end: string };
    priorityThreshold: 'low' | 'medium' | 'high';
  }): {
    immediateDelivery: Message[];
    batchedDelivery: Message[];
    scheduledDelivery: Message[];
    recommendations: string[];
  } {
    const immediateDelivery: Message[] = [];
    const batchedDelivery: Message[] = [];
    const scheduledDelivery: Message[] = [];
    const recommendations: string[] = [];

    const now = new Date();
    const currentHour = now.getHours();

    // Check if we're in quiet hours
    let inQuietHours = false;
    if (recipientPreferences.quietHours) {
      const quietStart = parseInt(recipientPreferences.quietHours.start);
      const quietEnd = parseInt(recipientPreferences.quietHours.end);
      
      if (quietStart <= quietEnd) {
        inQuietHours = currentHour >= quietStart && currentHour < quietEnd;
      } else {
        inQuietHours = currentHour >= quietStart || currentHour < quietEnd;
      }
    }

    messages.forEach(message => {
      const priorityAnalysis = this.calculateMessagePriority(message);
      const priorityLevel = this.PRIORITY_WEIGHTS[priorityAnalysis.priority];
      const thresholdLevel = this.PRIORITY_WEIGHTS[recipientPreferences.priorityThreshold];

      // High priority messages always go through immediately
      if (priorityAnalysis.priority === 'high') {
        immediateDelivery.push(message);
        return;
      }

      // Check delivery preferences
      switch (recipientPreferences.notificationFrequency) {
        case 'immediate':
          if (priorityLevel >= thresholdLevel && !inQuietHours) {
            immediateDelivery.push(message);
          } else if (inQuietHours) {
            scheduledDelivery.push(message);
            recommendations.push('Message scheduled due to quiet hours');
          } else {
            batchedDelivery.push(message);
          }
          break;

        case 'batched':
          if (priorityAnalysis.priority === 'high') {
            immediateDelivery.push(message);
          } else {
            batchedDelivery.push(message);
          }
          break;

        case 'scheduled':
          scheduledDelivery.push(message);
          break;
      }
    });

    return {
      immediateDelivery,
      batchedDelivery,
      scheduledDelivery,
      recommendations,
    };
  }

  // Message search and filtering
  static searchMessages(messages: Message[], query: {
    text?: string;
    senderId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    priority?: 'low' | 'medium' | 'high';
    isRead?: boolean;
  }): {
    results: Message[];
    totalCount: number;
    searchStats: {
      byPriority: Record<string, number>;
      byDate: Record<string, number>;
      bySender: Record<string, number>;
    };
  } {
    let filteredMessages = [...messages];

    // Text search
    if (query.text) {
      const searchTerm = query.text.toLowerCase();
      filteredMessages = filteredMessages.filter(message =>
        message.subject.toLowerCase().includes(searchTerm) ||
        message.content.toLowerCase().includes(searchTerm)
      );
    }

    // Sender filter
    if (query.senderId) {
      filteredMessages = filteredMessages.filter(message =>
        message.senderId === query.senderId
      );
    }

    // Date range filter
    if (query.dateFrom) {
      filteredMessages = filteredMessages.filter(message =>
        new Date(message.timestamp) >= query.dateFrom!
      );
    }

    if (query.dateTo) {
      filteredMessages = filteredMessages.filter(message =>
        new Date(message.timestamp) <= query.dateTo!
      );
    }

    // Priority filter
    if (query.priority) {
      filteredMessages = filteredMessages.filter(message =>
        message.priority === query.priority
      );
    }

    // Read status filter
    if (query.isRead !== undefined) {
      filteredMessages = filteredMessages.filter(message =>
        message.isRead === query.isRead
      );
    }

    // Generate search statistics
    const searchStats = {
      byPriority: {} as Record<string, number>,
      byDate: {} as Record<string, number>,
      bySender: {} as Record<string, number>,
    };

    filteredMessages.forEach(message => {
      // Priority stats
      searchStats.byPriority[message.priority] = 
        (searchStats.byPriority[message.priority] || 0) + 1;

      // Date stats (by day)
      const dateKey = new Date(message.timestamp).toDateString();
      searchStats.byDate[dateKey] = 
        (searchStats.byDate[dateKey] || 0) + 1;

      // Sender stats
      searchStats.bySender[message.senderId] = 
        (searchStats.bySender[message.senderId] || 0) + 1;
    });

    return {
      results: filteredMessages,
      totalCount: filteredMessages.length,
      searchStats,
    };
  }

  // Validate message permissions
  static validateMessagePermissions(
    action: 'send' | 'read' | 'delete',
    message: Message,
    userId: string,
    userRole: 'user' | 'agent' | 'admin'
  ): {
    allowed: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let allowed = true;

    switch (action) {
      case 'send':
        // Anyone can send messages (spam detection handles abuse)
        break;

      case 'read':
        // Users can read messages they sent or received
        if (message.senderId !== userId && message.recipientId !== userId) {
          if (userRole !== 'admin') {
            allowed = false;
            reasons.push('You can only read your own messages');
          }
        }
        break;

      case 'delete':
        // Users can delete messages they sent or received
        if (message.senderId !== userId && message.recipientId !== userId) {
          if (userRole !== 'admin') {
            allowed = false;
            reasons.push('You can only delete your own messages');
          }
        }
        break;
    }

    return { allowed, reasons };
  }
}