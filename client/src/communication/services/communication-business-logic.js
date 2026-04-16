"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationBusinessLogic = exports.MessageThreadSchema = exports.MessageSchema = void 0;
var zod_1 = require("zod");
// Communication validation schemas
exports.MessageSchema = zod_1.z.object({
    senderId: zod_1.z.string().uuid('Invalid sender ID'),
    senderName: zod_1.z.string().min(1, 'Sender name is required'),
    recipientId: zod_1.z.string().uuid('Invalid recipient ID'),
    subject: zod_1.z.string()
        .min(3, 'Subject must be at least 3 characters')
        .max(200, 'Subject must not exceed 200 characters'),
    content: zod_1.z.string()
        .min(10, 'Message must be at least 10 characters')
        .max(5000, 'Message must not exceed 5000 characters'),
    priority: zod_1.z.enum(['low', 'medium', 'high']).default('medium'),
    threadId: zod_1.z.string().uuid().optional(),
});
exports.MessageThreadSchema = zod_1.z.object({
    participants: zod_1.z.array(zod_1.z.string().uuid()).min(2, 'Thread must have at least 2 participants'),
    subject: zod_1.z.string().min(3).max(200),
});
// Communication business logic implementation
var CommunicationBusinessLogic = /** @class */ (function () {
    function CommunicationBusinessLogic() {
    }
    // Validate message data
    CommunicationBusinessLogic.validateMessage = function (data) {
        try {
            return exports.MessageSchema.parse(data);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                var errorMessages = error.errors.map(function (err) { return "".concat(err.path.join('.'), ": ").concat(err.message); });
                throw new Error("Message validation failed: ".concat(errorMessages.join(', ')));
            }
            throw error;
        }
    };
    // Spam detection algorithm
    CommunicationBusinessLogic.detectSpam = function (message) {
        var spamScore = 0;
        var reasons = [];
        // Check for spam keywords
        var combinedText = "".concat(message.subject, " ").concat(message.content).toLowerCase();
        var foundKeywords = this.SPAM_KEYWORDS.filter(function (keyword) {
            return combinedText.includes(keyword.toLowerCase());
        });
        if (foundKeywords.length > 0) {
            spamScore += foundKeywords.length * 15;
            reasons.push("Contains spam keywords: ".concat(foundKeywords.join(', ')));
        }
        // Check for excessive capitalization
        var capsRatio = (message.content.match(/[A-Z]/g) || []).length / message.content.length;
        if (capsRatio > 0.3) {
            spamScore += 20;
            reasons.push('Excessive use of capital letters');
        }
        // Check for excessive punctuation
        var punctuationRatio = (message.content.match(/[!?]{2,}/g) || []).length;
        if (punctuationRatio > 2) {
            spamScore += 15;
            reasons.push('Excessive punctuation marks');
        }
        // Check for suspicious URLs
        var urlPattern = /https?:\/\/[^\s]+/gi;
        var urls = message.content.match(urlPattern) || [];
        if (urls.length > 3) {
            spamScore += 25;
            reasons.push('Contains multiple URLs');
        }
        // Check sender history
        if (message.senderHistory) {
            var recentMessages = message.senderHistory.filter(function (msg) { return new Date(msg.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000); });
            if (recentMessages.length > 20) {
                spamScore += 30;
                reasons.push('High message frequency from sender');
            }
            // Check for duplicate content
            var duplicateCount = message.senderHistory.filter(function (msg) { return msg.content === message.content; }).length;
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
        var confidence = Math.min(reasons.length * 20, 100);
        return {
            isSpam: spamScore >= 50,
            spamScore: spamScore,
            reasons: reasons,
            confidence: confidence,
        };
    };
    // Message sentiment analysis
    CommunicationBusinessLogic.analyzeSentiment = function (content) {
        // Simple sentiment analysis (in production, use a proper NLP service)
        var positiveWords = [
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'love', 'like', 'happy', 'pleased', 'satisfied', 'perfect',
            'thank', 'thanks', 'appreciate', 'grateful', 'awesome'
        ];
        var negativeWords = [
            'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike',
            'angry', 'frustrated', 'disappointed', 'upset', 'annoyed',
            'problem', 'issue', 'complaint', 'wrong', 'error', 'fail'
        ];
        var urgentWords = [
            'urgent', 'emergency', 'asap', 'immediately', 'quickly',
            'rush', 'hurry', 'deadline', 'critical', 'important'
        ];
        var words = content.toLowerCase().split(/\s+/);
        var positiveCount = 0;
        var negativeCount = 0;
        var urgentCount = 0;
        words.forEach(function (word) {
            if (positiveWords.includes(word))
                positiveCount++;
            if (negativeWords.includes(word))
                negativeCount++;
            if (urgentWords.includes(word))
                urgentCount++;
        });
        var totalSentimentWords = positiveCount + negativeCount;
        var sentiment;
        var score = 0;
        if (totalSentimentWords === 0) {
            sentiment = 'neutral';
            score = 0;
        }
        else if (positiveCount > negativeCount) {
            sentiment = 'positive';
            score = (positiveCount - negativeCount) / totalSentimentWords;
        }
        else if (negativeCount > positiveCount) {
            sentiment = 'negative';
            score = (negativeCount - positiveCount) / totalSentimentWords;
        }
        else {
            sentiment = 'neutral';
            score = 0;
        }
        var confidence = Math.min(totalSentimentWords * 10, 100);
        return {
            sentiment: sentiment,
            score: Math.abs(score),
            confidence: confidence,
            emotions: {
                positive: positiveCount,
                negative: negativeCount,
                urgent: urgentCount,
            },
        };
    };
    // Message thread management
    CommunicationBusinessLogic.organizeMessagesIntoThreads = function (messages) {
        var threadsMap = new Map();
        // Group messages by thread ID or create new threads
        messages.forEach(function (message) {
            var threadId = message.threadId || "".concat(message.senderId, "-").concat(message.recipientId);
            if (!threadsMap.has(threadId)) {
                threadsMap.set(threadId, []);
            }
            threadsMap.get(threadId).push(message);
        });
        // Convert to MessageThread objects
        var threads = [];
        threadsMap.forEach(function (threadMessages, threadId) {
            var sortedMessages = threadMessages.sort(function (a, b) { return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(); });
            var lastMessage = sortedMessages[0];
            var participants = Array.from(new Set(__spreadArray(__spreadArray([], threadMessages.map(function (m) { return m.senderId; }), true), threadMessages.map(function (m) { return m.recipientId; }), true)));
            var unreadCount = threadMessages.filter(function (m) { return !m.isRead; }).length;
            threads.push({
                id: threadId,
                participants: participants,
                subject: lastMessage.subject,
                lastMessage: lastMessage,
                messageCount: threadMessages.length,
                unreadCount: unreadCount,
            });
        });
        // Sort threads by last message timestamp
        return threads.sort(function (a, b) { return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime(); });
    };
    // Message priority calculation
    CommunicationBusinessLogic.calculateMessagePriority = function (message) {
        var score = 50; // Base score
        var factors = {};
        // Sentiment analysis
        var sentiment = this.analyzeSentiment(message.content);
        if (sentiment.emotions.urgent > 0) {
            var urgentBonus = sentiment.emotions.urgent * 10;
            score += urgentBonus;
            factors.urgency = urgentBonus;
        }
        if (sentiment.sentiment === 'negative' && sentiment.score > 0.5) {
            var negativeBonus = 15;
            score += negativeBonus;
            factors.negativeSentiment = negativeBonus;
        }
        // Trust score influence
        if (message.senderTrustScore) {
            if (message.senderTrustScore >= 800) {
                var trustBonus = 10;
                score += trustBonus;
                factors.highTrust = trustBonus;
            }
            else if (message.senderTrustScore < 400) {
                var trustPenalty = -10;
                score += trustPenalty;
                factors.lowTrust = trustPenalty;
            }
        }
        // Subject line analysis
        var subjectUrgent = /urgent|asap|emergency|important/i.test(message.subject);
        if (subjectUrgent) {
            var subjectBonus = 20;
            score += subjectBonus;
            factors.urgentSubject = subjectBonus;
        }
        // Message length consideration
        if (message.content.length > 1000) {
            var lengthBonus = 5;
            score += lengthBonus;
            factors.detailedMessage = lengthBonus;
        }
        // Determine priority level
        var priority;
        if (score >= 80) {
            priority = 'high';
        }
        else if (score >= 60) {
            priority = 'medium';
        }
        else {
            priority = 'low';
        }
        return {
            priority: priority,
            score: Math.max(0, Math.min(100, score)),
            factors: factors,
        };
    };
    // Message delivery optimization
    CommunicationBusinessLogic.optimizeMessageDelivery = function (messages, recipientPreferences) {
        var _this = this;
        var immediateDelivery = [];
        var batchedDelivery = [];
        var scheduledDelivery = [];
        var recommendations = [];
        var now = new Date();
        var currentHour = now.getHours();
        // Check if we're in quiet hours
        var inQuietHours = false;
        if (recipientPreferences.quietHours) {
            var quietStart = parseInt(recipientPreferences.quietHours.start);
            var quietEnd = parseInt(recipientPreferences.quietHours.end);
            if (quietStart <= quietEnd) {
                inQuietHours = currentHour >= quietStart && currentHour < quietEnd;
            }
            else {
                inQuietHours = currentHour >= quietStart || currentHour < quietEnd;
            }
        }
        messages.forEach(function (message) {
            var priorityAnalysis = _this.calculateMessagePriority(message);
            var priorityLevel = _this.PRIORITY_WEIGHTS[priorityAnalysis.priority];
            var thresholdLevel = _this.PRIORITY_WEIGHTS[recipientPreferences.priorityThreshold];
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
                    }
                    else if (inQuietHours) {
                        scheduledDelivery.push(message);
                        recommendations.push('Message scheduled due to quiet hours');
                    }
                    else {
                        batchedDelivery.push(message);
                    }
                    break;
                case 'batched':
                    if (priorityAnalysis.priority === 'high') {
                        immediateDelivery.push(message);
                    }
                    else {
                        batchedDelivery.push(message);
                    }
                    break;
                case 'scheduled':
                    scheduledDelivery.push(message);
                    break;
            }
        });
        return {
            immediateDelivery: immediateDelivery,
            batchedDelivery: batchedDelivery,
            scheduledDelivery: scheduledDelivery,
            recommendations: recommendations,
        };
    };
    // Message search and filtering
    CommunicationBusinessLogic.searchMessages = function (messages, query) {
        var filteredMessages = __spreadArray([], messages, true);
        // Text search
        if (query.text) {
            var searchTerm_1 = query.text.toLowerCase();
            filteredMessages = filteredMessages.filter(function (message) {
                return message.subject.toLowerCase().includes(searchTerm_1) ||
                    message.content.toLowerCase().includes(searchTerm_1);
            });
        }
        // Sender filter
        if (query.senderId) {
            filteredMessages = filteredMessages.filter(function (message) {
                return message.senderId === query.senderId;
            });
        }
        // Date range filter
        if (query.dateFrom) {
            filteredMessages = filteredMessages.filter(function (message) {
                return new Date(message.timestamp) >= query.dateFrom;
            });
        }
        if (query.dateTo) {
            filteredMessages = filteredMessages.filter(function (message) {
                return new Date(message.timestamp) <= query.dateTo;
            });
        }
        // Priority filter
        if (query.priority) {
            filteredMessages = filteredMessages.filter(function (message) {
                return message.priority === query.priority;
            });
        }
        // Read status filter
        if (query.isRead !== undefined) {
            filteredMessages = filteredMessages.filter(function (message) {
                return message.isRead === query.isRead;
            });
        }
        // Generate search statistics
        var searchStats = {
            byPriority: {},
            byDate: {},
            bySender: {},
        };
        filteredMessages.forEach(function (message) {
            // Priority stats
            searchStats.byPriority[message.priority] =
                (searchStats.byPriority[message.priority] || 0) + 1;
            // Date stats (by day)
            var dateKey = new Date(message.timestamp).toDateString();
            searchStats.byDate[dateKey] =
                (searchStats.byDate[dateKey] || 0) + 1;
            // Sender stats
            searchStats.bySender[message.senderId] =
                (searchStats.bySender[message.senderId] || 0) + 1;
        });
        return {
            results: filteredMessages,
            totalCount: filteredMessages.length,
            searchStats: searchStats,
        };
    };
    // Validate message permissions
    CommunicationBusinessLogic.validateMessagePermissions = function (action, message, userId, userRole) {
        var reasons = [];
        var allowed = true;
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
        return { allowed: allowed, reasons: reasons };
    };
    // Message priority scoring
    CommunicationBusinessLogic.PRIORITY_WEIGHTS = {
        low: 1,
        medium: 2,
        high: 3,
    };
    // Spam detection keywords
    CommunicationBusinessLogic.SPAM_KEYWORDS = [
        'urgent', 'act now', 'limited time', 'guaranteed', 'free money',
        'click here', 'call now', 'winner', 'congratulations', 'prize',
        'investment opportunity', 'make money fast', 'work from home',
    ];
    return CommunicationBusinessLogic;
}());
exports.CommunicationBusinessLogic = CommunicationBusinessLogic;
