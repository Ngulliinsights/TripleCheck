/**
 * Event-Driven Architecture System for TripleCheck
 * 
 * Provides a centralized event bus for decoupled communication
 * between services with support for event sourcing, replay, and monitoring.
 */

import { EventEmitter } from 'events';

import { standardErrorHandler, ErrorCategory } from '../error-handling/StandardErrorHandler';
import { logger } from '../monitoring/logger';
import { performanceMonitor } from '../monitoring/PerformanceMonitor';

export interface DomainEvent {
  id: string;
  type: string;
  version: number;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, any>;
  metadata: EventMetadata;
  timestamp: Date;
  correlationId?: string;
  causationId?: string;
}

export interface EventMetadata {
  userId?: number;
  sessionId?: string;
  source: string;
  environment: string;
  traceId?: string;
  tags?: Record<string, string>;
}

export interface EventHandler {
  eventType: string;
  handler: (event: DomainEvent) => Promise<void>;
  options?: EventHandlerOptions;
}

export interface EventHandlerOptions {
  retries?: number;
  timeout?: number;
  deadLetterQueue?: boolean;
  priority?: EventPriority;
  filter?: (event: DomainEvent) => boolean;
}

export enum EventPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface EventStore {
  save(event: DomainEvent): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getEventsByType(eventType: string, limit?: number): Promise<DomainEvent[]>;
  getAllEvents(fromTimestamp?: Date, limit?: number): Promise<DomainEvent[]>;
}

export interface EventSnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  data: Record<string, any>;
  timestamp: Date;
}

export class EventBus extends EventEmitter {
  private static instance: EventBus;
  private handlers: Map<string, EventHandler[]> = new Map();
  private eventStore: EventStore;
  private processingQueue: Map<string, DomainEvent> = new Map();
  private deadLetterQueue: DomainEvent[] = [];
  private eventHistory: DomainEvent[] = [];
  private snapshots: Map<string, EventSnapshot> = new Map();
  private isProcessing: boolean = false;
  private processingInterval: NodeJS.Timeout | null = null;

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  constructor() {
    super();
    this.eventStore = new InMemoryEventStore(); // Would be replaced with persistent store
    this.startProcessing();
  }

  /**
   * Publish an event to the bus
   */
  async publish(event: Omit<DomainEvent, 'id' | 'timestamp'>): Promise<void> {
    const fullEvent: DomainEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    try {
      // Store the event
      await this.eventStore.save(fullEvent);
      
      // Add to processing queue
      this.processingQueue.set(fullEvent.id, fullEvent);
      
      // Add to history for replay capabilities
      this.eventHistory.push(fullEvent);
      
      // Keep history size manageable
      if (this.eventHistory.length > 10000) {
        this.eventHistory = this.eventHistory.slice(-5000);
      }

      // Emit for immediate processing
      this.emit('eventPublished', fullEvent);
      
      // Record metrics
      performanceMonitor.incrementCounter('events_published', 1, {
        eventType: fullEvent.type,
        aggregateType: fullEvent.aggregateType
      });

      logger.info(
        `Event published: ${fullEvent.type}`,
        'EVENT_BUS',
        {
          eventId: fullEvent.id,
          aggregateId: fullEvent.aggregateId,
          correlationId: fullEvent.correlationId
        }
      );

    } catch (error) {
      logger.error(
        `Failed to publish event: ${event.type}`,
        'EVENT_BUS',
        {
          aggregateId: event.aggregateId,
          error: (error as Error).message
        },
        error as Error
      );
      throw standardErrorHandler.createError(
        ErrorCategory.SYSTEM,
        'EVENT_PUBLISH_FAILED',
        `Failed to publish event: ${event.type}`,
        { context: 'EventBus.publish', details: { eventType: event.type } }
      );
    }
  }

  /**
   * Subscribe to events with a handler
   */
  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>, options?: EventHandlerOptions): void {
    const eventHandler: EventHandler = {
      eventType,
      handler,
      options: {
        retries: 3,
        timeout: 30000,
        deadLetterQueue: true,
        priority: EventPriority.MEDIUM,
        ...options
      }
    };

    const existingHandlers = this.handlers.get(eventType) || [];
    existingHandlers.push(eventHandler);
    
    // Sort by priority (highest first)
    existingHandlers.sort((a, b) => (b.options?.priority || 0) - (a.options?.priority || 0));
    
    this.handlers.set(eventType, existingHandlers);

    logger.info(
      `Event handler registered for: ${eventType}`,
      'EVENT_BUS',
      {
        handlerCount: existingHandlers.length,
        priority: eventHandler.options?.priority
      }
    );
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const filteredHandlers = handlers.filter(h => h.handler !== handler);
      if (filteredHandlers.length === 0) {
        this.handlers.delete(eventType);
      } else {
        this.handlers.set(eventType, filteredHandlers);
      }
    }
  }

  /**
   * Get events for an aggregate
   */
  async getAggregateEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    return this.eventStore.getEvents(aggregateId, fromVersion);
  }

  /**
   * Replay events for an aggregate
   */
  async replayEvents(aggregateId: string, fromVersion?: number): Promise<void> {
    const events = await this.getAggregateEvents(aggregateId, fromVersion);
    
    logger.info(
      `Replaying ${events.length} events for aggregate: ${aggregateId}`,
      'EVENT_BUS',
      { aggregateId, fromVersion, eventCount: events.length }
    );

    for (const event of events) {
      await this.processEvent(event, true); // isReplay = true
    }
  }

  /**
   * Create a snapshot of an aggregate
   */
  async createSnapshot(aggregateId: string, aggregateType: string, version: number, data: Record<string, any>): Promise<void> {
    const snapshot: EventSnapshot = {
      aggregateId,
      aggregateType,
      version,
      data,
      timestamp: new Date()
    };

    this.snapshots.set(aggregateId, snapshot);
    
    logger.info(
      `Snapshot created for aggregate: ${aggregateId}`,
      'EVENT_BUS',
      { aggregateId, version, aggregateType }
    );
  }

  /**
   * Get snapshot for an aggregate
   */
  getSnapshot(aggregateId: string): EventSnapshot | undefined {
    return this.snapshots.get(aggregateId);
  }

  /**
   * Get event statistics
   */
  getEventStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    handlerCount: number;
    processingQueueSize: number;
    deadLetterQueueSize: number;
    recentEvents: DomainEvent[];
  } {
    const eventsByType: Record<string, number> = {};
    
    this.eventHistory.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    return {
      totalEvents: this.eventHistory.length,
      eventsByType,
      handlerCount: Array.from(this.handlers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
      processingQueueSize: this.processingQueue.size,
      deadLetterQueueSize: this.deadLetterQueue.length,
      recentEvents: this.eventHistory.slice(-10)
    };
  }

  /**
   * Get dead letter queue events
   */
  getDeadLetterQueue(): DomainEvent[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Retry events from dead letter queue
   */
  async retryDeadLetterEvents(): Promise<void> {
    const eventsToRetry = [...this.deadLetterQueue];
    this.deadLetterQueue = [];

    logger.info(
      `Retrying ${eventsToRetry.length} events from dead letter queue`,
      'EVENT_BUS'
    );

    for (const event of eventsToRetry) {
      this.processingQueue.set(event.id, event);
    }
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    const clearedCount = this.deadLetterQueue.length;
    this.deadLetterQueue = [];
    
    logger.info(
      `Cleared ${clearedCount} events from dead letter queue`,
      'EVENT_BUS'
    );
  }

  /**
   * Start event processing
   */
  private startProcessing(): void {
    if (this.processingInterval) {
      return;
    }

    this.isProcessing = true;
    this.processingInterval = setInterval(async () => {
      await this.processQueuedEvents();
    }, 100); // Process every 100ms

    logger.info('Event processing started', 'EVENT_BUS');
  }

  /**
   * Stop event processing
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    
    logger.info('Event processing stopped', 'EVENT_BUS');
  }

  /**
   * Process queued events
   */
  private async processQueuedEvents(): Promise<void> {
    if (this.processingQueue.size === 0) {
      return;
    }

    const events = Array.from(this.processingQueue.values());
    this.processingQueue.clear();

    // Sort by priority and timestamp
    events.sort((a, b) => {
      const aPriority = this.getEventPriority(a);
      const bPriority = this.getEventPriority(b);
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      return a.timestamp.getTime() - b.timestamp.getTime(); // Older first
    });

    for (const event of events) {
      await this.processEvent(event);
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: DomainEvent, isReplay: boolean = false): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    
    if (handlers.length === 0) {
      logger.debug(
        `No handlers found for event type: ${event.type}`,
        'EVENT_BUS',
        { eventId: event.id }
      );
      return;
    }

    const startTime = performance.now();

    for (const eventHandler of handlers) {
      // Apply filter if specified
      if (eventHandler.options?.filter && !eventHandler.options.filter(event)) {
        continue;
      }

      await this.executeHandler(event, eventHandler, isReplay);
    }

    const duration = performance.now() - startTime;
    
    performanceMonitor.recordMetric({
      name: 'event_processing_time',
      category: performanceMonitor.MetricCategory.BUSINESS_METRIC,
      value: duration,
      unit: performanceMonitor.MetricUnit.MILLISECONDS,
      context: event.type,
      tags: {
        eventType: event.type,
        aggregateType: event.aggregateType,
        isReplay: isReplay.toString()
      }
    });
  }

  /**
   * Execute a single event handler with retry logic
   */
  private async executeHandler(event: DomainEvent, eventHandler: EventHandler, isReplay: boolean): Promise<void> {
    const maxRetries = eventHandler.options?.retries || 3;
    const timeout = eventHandler.options?.timeout || 30000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Execute handler with timeout
        await Promise.race([
          eventHandler.handler(event),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Handler timeout')), timeout)
          )
        ]);

        // Success - record metrics and return
        performanceMonitor.incrementCounter('event_handler_success', 1, {
          eventType: event.type,
          handlerName: eventHandler.handler.name || 'anonymous'
        });

        if (!isReplay) {
          logger.debug(
            `Event handler executed successfully: ${event.type}`,
            'EVENT_BUS',
            {
              eventId: event.id,
              attempt,
              handlerName: eventHandler.handler.name
            }
          );
        }

        return;

      } catch (error) {
        logger.warn(
          `Event handler failed (attempt ${attempt}/${maxRetries}): ${event.type}`,
          'EVENT_BUS',
          {
            eventId: event.id,
            attempt,
            error: (error as Error).message,
            handlerName: eventHandler.handler.name
          },
          error as Error
        );

        // If this was the last attempt and we should use dead letter queue
        if (attempt === maxRetries && eventHandler.options?.deadLetterQueue) {
          this.deadLetterQueue.push(event);
          
          performanceMonitor.incrementCounter('event_handler_dead_letter', 1, {
            eventType: event.type,
            handlerName: eventHandler.handler.name || 'anonymous'
          });

          logger.error(
            `Event moved to dead letter queue: ${event.type}`,
            'EVENT_BUS',
            {
              eventId: event.id,
              handlerName: eventHandler.handler.name,
              finalError: (error as Error).message
            }
          );
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    // Record final failure
    performanceMonitor.incrementCounter('event_handler_failure', 1, {
      eventType: event.type,
      handlerName: eventHandler.handler.name || 'anonymous'
    });
  }

  /**
   * Get event priority for processing order
   */
  private getEventPriority(event: DomainEvent): number {
    const handlers = this.handlers.get(event.type) || [];
    return Math.max(...handlers.map(h => h.options?.priority || EventPriority.MEDIUM));
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `EVENT_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Shutdown the event bus
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down event bus...', 'EVENT_BUS');
    
    this.stopProcessing();
    
    // Process remaining events
    if (this.processingQueue.size > 0) {
      logger.info(
        `Processing ${this.processingQueue.size} remaining events...`,
        'EVENT_BUS'
      );
      await this.processQueuedEvents();
    }

    // Clear all data
    this.handlers.clear();
    this.processingQueue.clear();
    this.eventHistory = [];
    this.snapshots.clear();
    
    logger.info('Event bus shutdown completed', 'EVENT_BUS');
  }
}

/**
 * In-memory event store implementation
 * In production, this would be replaced with a persistent store like PostgreSQL or EventStore
 */
class InMemoryEventStore implements EventStore {
  private events: Map<string, DomainEvent[]> = new Map();
  private allEvents: DomainEvent[] = [];

  async save(event: DomainEvent): Promise<void> {
    const aggregateEvents = this.events.get(event.aggregateId) || [];
    aggregateEvents.push(event);
    this.events.set(event.aggregateId, aggregateEvents);
    this.allEvents.push(event);
    
    // Keep total events manageable
    if (this.allEvents.length > 50000) {
      this.allEvents = this.allEvents.slice(-25000);
    }
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    const events = this.events.get(aggregateId) || [];
    
    if (fromVersion !== undefined) {
      return events.filter(event => event.version >= fromVersion);
    }
    
    return events;
  }

  async getEventsByType(eventType: string, limit?: number): Promise<DomainEvent[]> {
    let events = this.allEvents.filter(event => event.type === eventType);
    
    if (limit) {
      events = events.slice(-limit);
    }
    
    return events;
  }

  async getAllEvents(fromTimestamp?: Date, limit?: number): Promise<DomainEvent[]> {
    let events = this.allEvents;
    
    if (fromTimestamp) {
      events = events.filter(event => event.timestamp >= fromTimestamp);
    }
    
    if (limit) {
      events = events.slice(-limit);
    }
    
    return events;
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();

// Export convenience functions
export const publishEvent = (event: Omit<DomainEvent, 'id' | 'timestamp'>) => 
  eventBus.publish(event);

export const subscribeToEvent = (
  eventType: string, 
  handler: (event: DomainEvent) => Promise<void>, 
  options?: EventHandlerOptions
) => eventBus.subscribe(eventType, handler, options);

// Export event types for domain events
export const EventTypes = {
  // Property events
  PROPERTY_CREATED: 'property.created',
  PROPERTY_UPDATED: 'property.updated',
  PROPERTY_DELETED: 'property.deleted',
  PROPERTY_VERIFIED: 'property.verified',
  PROPERTY_VERIFICATION_FAILED: 'property.verification.failed',
  
  // User events
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  USER_PROFILE_UPDATED: 'user.profile.updated',
  USER_TRUST_SCORE_UPDATED: 'user.trust_score.updated',
  
  // Verification events
  VERIFICATION_STARTED: 'verification.started',
  VERIFICATION_COMPLETED: 'verification.completed',
  VERIFICATION_FAILED: 'verification.failed',
  DOCUMENT_VERIFIED: 'document.verified',
  DOCUMENT_VERIFICATION_FAILED: 'document.verification.failed',
  
  // Fraud detection events
  FRAUD_DETECTED: 'fraud.detected',
  FRAUD_INVESTIGATION_STARTED: 'fraud.investigation.started',
  FRAUD_CASE_RESOLVED: 'fraud.case.resolved',
  
  // System events
  SYSTEM_ERROR: 'system.error',
  SYSTEM_MAINTENANCE_STARTED: 'system.maintenance.started',
  SYSTEM_MAINTENANCE_COMPLETED: 'system.maintenance.completed'
} as const;