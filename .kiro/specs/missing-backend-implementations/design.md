# Design Document

## Overview

This design document outlines the implementation of missing backend services for the TripleCheck application. The design follows the existing domain-driven architecture and integrates seamlessly with the current service layer, route coordination system, and database schema.

## Architecture

### Service Layer Architecture

The missing backend implementations will follow the established patterns:

```
server/
├── services/
│   ├── ProfessionalService.ts          # New: Professional directory management
│   ├── AnalyticsService.ts             # Enhanced: Comprehensive analytics
│   ├── CommunicationService.ts         # Enhanced: Messaging and notifications
│   └── TrustIntegrationService.ts      # Enhanced: Trust score integration
├── routes/
│   ├── professionals.routes.ts         # New: Professional directory routes
│   ├── analytics.routes.ts             # Enhanced: Analytics endpoints
│   ├── communication.routes.ts         # Enhanced: Communication routes
│   └── trust-integration.routes.ts     # Enhanced: Trust integration routes
└── controllers/
    ├── professionals.controller.ts     # New: Professional directory controller
    ├── analytics.controller.ts         # Enhanced: Analytics controller
    └── communication.controller.ts     # Enhanced: Communication controller
```

### Database Schema Extensions

The design will extend the existing database schema with new tables:

```sql
-- Professional directory tables
CREATE TABLE professionals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  professional_type VARCHAR(50) NOT NULL,
  company_name VARCHAR(200),
  specializations TEXT[],
  certifications TEXT[],
  years_experience INTEGER,
  verification_level VARCHAR(20) DEFAULT 'basic',
  availability_status VARCHAR(20) DEFAULT 'available',
  response_time_hours INTEGER DEFAULT 24,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Professional ratings and reviews
CREATE TABLE professional_reviews (
  id SERIAL PRIMARY KEY,
  professional_id INTEGER REFERENCES professionals(id),
  reviewer_id INTEGER REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  transaction_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE analytics_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  session_id VARCHAR(100),
  properties JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Communication threads and messages
CREATE TABLE message_threads (
  id SERIAL PRIMARY KEY,
  participants INTEGER[],
  thread_type VARCHAR(50) DEFAULT 'direct',
  subject VARCHAR(200),
  last_message_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  thread_id INTEGER REFERENCES message_threads(id),
  sender_id INTEGER REFERENCES users(id),
  content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  read_by INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Components and Interfaces

### Professional Service Interface

```typescript
interface ProfessionalService {
  // Professional management with race condition protection
  createProfessionalProfile(userId: number, profileData: ProfessionalProfileData, idempotencyKey: string): Promise<Professional>;
  updateProfessionalProfile(professionalId: number, updates: Partial<ProfessionalProfileData>, version: number): Promise<Professional>;
  getProfessionalById(professionalId: number, includeCache?: boolean): Promise<Professional | null>;
  
  // Search and filtering with intelligent caching
  searchProfessionals(criteria: ProfessionalSearchCriteria, cacheKey?: string): Promise<PaginatedResponse<Professional>>;
  getProfessionalsByCategory(category: string, location?: string, useCache?: boolean): Promise<Professional[]>;
  
  // Reviews and ratings with duplicate prevention
  addProfessionalReview(professionalId: number, reviewData: ReviewData, reviewerFingerprint: string): Promise<Review>;
  getProfessionalReviews(professionalId: number, pagination?: PaginationOptions): Promise<PaginatedResponse<Review>>;
  
  // Availability management with real-time updates
  updateAvailability(professionalId: number, status: AvailabilityStatus, timestamp: Date): Promise<void>;
  getAvailableProfessionals(criteria: AvailabilityCriteria, realTime?: boolean): Promise<Professional[]>;
  
  // Batch operations for efficiency
  batchUpdateProfessionals(updates: Array<{ id: number; data: Partial<ProfessionalProfileData> }>): Promise<Professional[]>;
  batchGetProfessionals(ids: number[]): Promise<Professional[]>;
}
```

### Analytics Service Interface

```typescript
interface AnalyticsService {
  // Event tracking with deduplication
  trackEvent(eventData: AnalyticsEvent, deduplicationKey?: string): Promise<void>;
  trackUserAction(userId: number, action: string, properties?: Record<string, any>, sessionId?: string): Promise<void>;
  batchTrackEvents(events: AnalyticsEvent[]): Promise<void>;
  
  // Metrics retrieval with smart caching
  getMetrics(filter: MetricsFilter, cacheStrategy?: 'aggressive' | 'moderate' | 'fresh'): Promise<AnalyticsMetrics>;
  getTimeSeriesData(filter: TimeSeriesFilter, granularity?: 'hour' | 'day' | 'week'): Promise<TimeSeriesData>;
  getUserAnalytics(userId: number, includePrivate?: boolean): Promise<UserAnalytics>;
  getPropertyAnalytics(propertyId: number, timeRange?: TimeRange): Promise<PropertyAnalytics>;
  
  // Performance monitoring with aggregation
  recordPerformanceMetric(metric: PerformanceMetric, aggregateImmediately?: boolean): Promise<void>;
  getCoreWebVitals(timeRange: TimeRange, aggregationLevel?: 'raw' | 'summary'): Promise<CoreWebVitals>;
  getBundleMetrics(includeSourceMaps?: boolean): Promise<BundleMetrics>;
  
  // Real-time analytics
  getRealtimeMetrics(userId?: number): Promise<RealtimeMetrics>;
  subscribeToMetrics(callback: (metrics: RealtimeMetrics) => void): () => void;
}
```

### Communication Service Interface

```typescript
interface CommunicationService {
  // Message management with delivery guarantees
  sendMessage(senderId: number, recipientId: number, content: string, options?: {
    threadId?: number;
    messageType?: 'text' | 'image' | 'document';
    priority?: 'low' | 'normal' | 'high';
    deliveryReceipt?: boolean;
    idempotencyKey?: string;
  }): Promise<Message>;
  
  getMessages(userId: number, options?: {
    threadId?: number;
    pagination?: PaginationOptions;
    includeDeleted?: boolean;
    markAsRead?: boolean;
  }): Promise<PaginatedResponse<Message>>;
  
  getMessageThreads(userId: number, options?: {
    includeArchived?: boolean;
    sortBy?: 'lastMessage' | 'unreadCount' | 'participants';
    limit?: number;
  }): Promise<MessageThread[]>;
  
  // Message status with optimistic updates
  markMessageAsRead(messageId: number, userId: number, timestamp?: Date): Promise<void>;
  markThreadAsRead(threadId: number, userId: number): Promise<void>;
  deleteMessage(messageId: number, userId: number, softDelete?: boolean): Promise<void>;
  
  // Bulk operations
  batchMarkAsRead(messageIds: number[], userId: number): Promise<void>;
  batchDeleteMessages(messageIds: number[], userId: number): Promise<void>;
  
  // Real-time features
  subscribeToMessages(userId: number, callback: (message: Message) => void): () => void;
  getUserOnlineStatus(userId: number): Promise<{ online: boolean; lastSeen: Date }>;
  updateUserOnlineStatus(userId: number, online: boolean): Promise<void>;
  
  // Notifications with channel preferences
  sendNotification(userId: number, notification: NotificationData, channels?: ('email' | 'sms' | 'push')[]): Promise<void>;
  getNotifications(userId: number, options?: {
    unreadOnly?: boolean;
    category?: string;
    pagination?: PaginationOptions;
  }): Promise<PaginatedResponse<Notification>>;
  markNotificationAsRead(notificationId: number, userId: number): Promise<void>;
  
  // Message search and filtering
  searchMessages(userId: number, query: string, options?: {
    threadId?: number;
    dateRange?: { start: Date; end: Date };
    messageType?: string;
  }): Promise<PaginatedResponse<Message>>;
}
```

## Data Models

### Professional Data Model

```typescript
interface Professional {
  id: number;
  userId: number;
  professionalType: 'real-estate-agent' | 'property-lawyer' | 'surveyor' | 'valuer' | 'property-manager' | 'photographer';
  companyName?: string;
  specializations: string[];
  certifications: string[];
  yearsExperience: number;
  verificationLevel: 'basic' | 'verified' | 'premium';
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  responseTimeHours: number;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  portfolio: {
    totalValue: string;
    recentProjects: number;
    successRate: number;
  };
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  pricing: {
    type: 'hourly' | 'project' | 'commission';
    range: string;
  };
  location: {
    area: string;
    county: string;
  };
  languages: string[];
  bio: string;
  services: string[];
  achievements: string[];
  education: string[];
  isOnline: boolean;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Analytics Event Model

```typescript
interface AnalyticsEvent {
  eventType: string;
  userId?: number;
  sessionId: string;
  properties: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  pageViews: number;
  sessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  topPages: Array<{ page: string; views: number }>;
  userGrowth: Array<{ date: string; users: number }>;
}
```

### Message Data Model

```typescript
interface Message {
  id: number;
  threadId: number;
  senderId: number;
  content: string;
  messageType: 'text' | 'image' | 'document' | 'system';
  readBy: number[];
  createdAt: Date;
}

interface MessageThread {
  id: number;
  participants: number[];
  threadType: 'direct' | 'group' | 'support';
  subject?: string;
  lastMessageAt: Date;
  unreadCount: number;
  lastMessage?: Message;
  createdAt: Date;
}
```

## Race Condition Prevention and API Consistency

### Request Deduplication and Idempotency

```typescript
interface IdempotentRequest {
  idempotencyKey: string;
  requestHash: string;
  expiresAt: Date;
  response?: any;
}

class RequestDeduplicator {
  private static pendingRequests = new Map<string, Promise<any>>();
  private static completedRequests = new Map<string, { response: any; timestamp: Date }>();
  
  static async handleIdempotentRequest<T>(
    key: string,
    operation: () => Promise<T>,
    ttl: number = 300000 // 5 minutes
  ): Promise<T> {
    // Check if request is already in progress
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }
    
    // Check if we have a recent completed request
    const completed = this.completedRequests.get(key);
    if (completed && Date.now() - completed.timestamp.getTime() < ttl) {
      return completed.response;
    }
    
    // Execute new request
    const promise = operation();
    this.pendingRequests.set(key, promise);
    
    try {
      const result = await promise;
      this.completedRequests.set(key, { response: result, timestamp: new Date() });
      return result;
    } finally {
      this.pendingRequests.delete(key);
    }
  }
}
```

### API Rate Limiting and Circuit Breaker

```typescript
class ApiRateLimiter {
  private static userRequests = new Map<number, { count: number; resetTime: Date }>();
  private static globalRequests = { count: 0, resetTime: new Date() };
  
  static checkRateLimit(userId: number, endpoint: string): boolean {
    const now = new Date();
    const userLimit = this.getUserLimit(userId, endpoint);
    const globalLimit = this.getGlobalLimit(endpoint);
    
    // Reset counters if time window expired
    if (now > this.globalRequests.resetTime) {
      this.globalRequests = { count: 0, resetTime: new Date(now.getTime() + 60000) };
    }
    
    const userRecord = this.userRequests.get(userId);
    if (!userRecord || now > userRecord.resetTime) {
      this.userRequests.set(userId, { count: 0, resetTime: new Date(now.getTime() + 60000) });
    }
    
    // Check limits
    if (this.globalRequests.count >= globalLimit) return false;
    if (this.userRequests.get(userId)!.count >= userLimit) return false;
    
    // Increment counters
    this.globalRequests.count++;
    this.userRequests.get(userId)!.count++;
    
    return true;
  }
}

class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.timeout)
        )
      ]);
      
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = new Date();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}
```

### Infinite API Call Prevention

```typescript
class ApiCallTracker {
  private static userCallHistory = new Map<number, Array<{ endpoint: string; timestamp: Date }>>();
  private static suspiciousPatterns = new Map<number, { count: number; lastAlert: Date }>();
  
  static trackApiCall(userId: number, endpoint: string): boolean {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 300000);
    
    // Get user's recent calls
    let userCalls = this.userCallHistory.get(userId) || [];
    
    // Remove calls older than 5 minutes
    userCalls = userCalls.filter(call => call.timestamp > fiveMinutesAgo);
    
    // Check for suspicious patterns
    const recentSameCalls = userCalls.filter(call => 
      call.endpoint === endpoint && 
      call.timestamp > new Date(now.getTime() - 60000) // Last minute
    ).length;
    
    // Block if too many identical calls in short time
    if (recentSameCalls > 10) {
      this.flagSuspiciousActivity(userId, endpoint);
      return false;
    }
    
    // Check for rapid-fire requests (more than 1 per second)
    const lastCall = userCalls[userCalls.length - 1];
    if (lastCall && now.getTime() - lastCall.timestamp.getTime() < 1000) {
      return false;
    }
    
    // Add current call
    userCalls.push({ endpoint, timestamp: now });
    this.userCallHistory.set(userId, userCalls);
    
    return true;
  }
  
  private static flagSuspiciousActivity(userId: number, endpoint: string) {
    const pattern = this.suspiciousPatterns.get(userId) || { count: 0, lastAlert: new Date(0) };
    pattern.count++;
    
    // Alert if pattern escalates and we haven't alerted recently
    if (pattern.count > 3 && Date.now() - pattern.lastAlert.getTime() > 300000) {
      console.warn(`Suspicious API activity detected for user ${userId} on ${endpoint}`);
      pattern.lastAlert = new Date();
    }
    
    this.suspiciousPatterns.set(userId, pattern);
  }
}
```

### Frontend-Consistent API Design

```typescript
// Consistent response wrapper that matches frontend expectations
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  cached?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

// Smart caching that prevents redundant requests
class SmartCache {
  private cache = new Map<string, { data: any; timestamp: Date; etag: string }>();
  
  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = 300000): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp.getTime() < ttl) {
      return cached.data;
    }
    
    const data = await fetcher();
    const etag = this.generateETag(data);
    
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      etag
    });
    
    return data;
  }
  
  private generateETag(data: any): string {
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
  }
}
```

## Error Handling

### Standardized Error Response Format

```typescript
interface ApiErrorResponse {
  success: false;
  error: string;
  message?: string;
  details?: any;
  code?: string;
  timestamp: string;
  requestId: string;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  cached?: boolean;
  pagination?: PaginationInfo;
  requestId: string;
  timestamp: string;
}
```

### Error Categories

1. **Validation Errors (400)**: Invalid input data, missing required fields
2. **Authentication Errors (401)**: Missing or invalid authentication
3. **Authorization Errors (403)**: Insufficient permissions
4. **Not Found Errors (404)**: Resource not found
5. **Conflict Errors (409)**: Resource conflicts, duplicate entries
6. **Rate Limit Errors (429)**: Too many requests
7. **Server Errors (500)**: Internal server errors, database issues

### Error Handling Middleware

```typescript
class ErrorHandler {
  static handleValidationError(error: ZodError): ApiErrorResponse;
  static handleDatabaseError(error: DatabaseError): ApiErrorResponse;
  static handleAuthenticationError(message: string): ApiErrorResponse;
  static handleNotFoundError(resource: string): ApiErrorResponse;
  static handleGenericError(error: Error): ApiErrorResponse;
}
```

## Testing Strategy

### Unit Testing

- **Service Layer Tests**: Test all business logic in isolation
- **Controller Tests**: Test API endpoint behavior with mocked services
- **Validation Tests**: Test input validation schemas
- **Error Handling Tests**: Test error scenarios and responses

### Integration Testing

- **Database Integration**: Test service interactions with database
- **API Integration**: Test complete request/response cycles
- **Service Integration**: Test inter-service communication
- **Authentication Integration**: Test auth middleware integration

### End-to-End Testing

- **Professional Directory Flow**: Test complete professional search and contact flow
- **Analytics Flow**: Test event tracking and metrics retrieval
- **Communication Flow**: Test message sending and receiving
- **Trust Integration Flow**: Test trust score calculations and updates

### Performance Testing

- **Load Testing**: Test API endpoints under high load
- **Database Performance**: Test query performance with large datasets
- **Caching Performance**: Test cache hit rates and response times
- **Memory Usage**: Monitor memory consumption under load

## Security Considerations

### Authentication and Authorization

- **Session-based Authentication**: Integrate with existing session management
- **Role-based Access Control**: Implement proper permission checks
- **API Rate Limiting**: Prevent abuse and ensure fair usage
- **Input Sanitization**: Validate and sanitize all user inputs

### Data Protection

- **Personal Data Handling**: Comply with data protection regulations
- **Message Encryption**: Encrypt sensitive communication data
- **Audit Logging**: Log all sensitive operations for compliance
- **Data Retention**: Implement appropriate data retention policies

### API Security

- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Request Validation**: Comprehensive input validation
- **SQL Injection Prevention**: Use parameterized queries
- **XSS Prevention**: Sanitize output data

## Performance Optimization

### Caching Strategy

- **Redis Caching**: Cache frequently accessed data
- **Query Result Caching**: Cache expensive database queries
- **API Response Caching**: Cache API responses with appropriate TTL
- **Cache Invalidation**: Implement smart cache invalidation strategies

### Database Optimization

- **Indexing Strategy**: Create appropriate database indexes
- **Query Optimization**: Optimize slow database queries
- **Connection Pooling**: Implement efficient connection management
- **Read Replicas**: Use read replicas for analytics queries

### API Optimization

- **Pagination**: Implement efficient pagination for large datasets
- **Field Selection**: Allow clients to specify required fields
- **Batch Operations**: Support batch operations where appropriate
- **Compression**: Enable response compression

## Monitoring and Observability

### Logging Strategy

- **Structured Logging**: Use consistent log formats
- **Log Levels**: Implement appropriate log levels
- **Error Tracking**: Track and alert on errors
- **Performance Logging**: Log slow operations

### Metrics Collection

- **Business Metrics**: Track key business indicators
- **Technical Metrics**: Monitor system performance
- **User Metrics**: Track user behavior and engagement
- **Error Metrics**: Monitor error rates and types

### Health Checks

- **Service Health**: Monitor service availability
- **Database Health**: Monitor database connectivity
- **External Service Health**: Monitor third-party integrations
- **Resource Health**: Monitor system resources

## Deployment Considerations

### Environment Configuration

- **Environment Variables**: Proper configuration management
- **Feature Flags**: Support for feature toggles
- **Database Migrations**: Automated schema migrations
- **Service Dependencies**: Proper dependency management

### Scalability

- **Horizontal Scaling**: Design for horizontal scaling
- **Load Balancing**: Support for load balancers
- **Microservice Ready**: Prepare for potential microservice split
- **Resource Management**: Efficient resource utilization

### Monitoring and Alerting

- **Application Monitoring**: Monitor application performance
- **Infrastructure Monitoring**: Monitor server resources
- **Alert Configuration**: Set up appropriate alerts
- **Dashboard Creation**: Create monitoring dashboards