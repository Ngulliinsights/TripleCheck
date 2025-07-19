/**
 * OperationTracker - A sophisticated debugging system for race conditions
 * 
 * This system captures the temporal relationships between asynchronous operations
 * to make invisible race conditions visible. It's designed to debug:
 * - UI flickering caused by competing state updates
 * - Infinite API call loops
 * - Unexpected app reloads from cascading operations
 * - Operations completing out of order
 * 
 * Think of this as a "time machine" that records exactly how your app's
 * operations unfold and interact over time.
 */

export type OperationType = 
  | 'api_call' 
  | 'state_update' 
  | 'component_mount' 
  | 'component_unmount' 
  | 'component_update' 
  | 'effect_run' 
  | 'query_fetch' 
  | 'mutation' 
  | 'navigation' 
  | 'user_interaction'
  | 'timer'
  | 'promise_resolution';

export type OperationStatus = 'started' | 'progress' | 'completed' | 'failed' | 'cancelled';

export interface OperationMilestone {
  timestamp: number;
  status: OperationStatus;
  data?: any;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface OperationRecord {
  /** Unique sequential identifier for this operation */
  id: string;
  /** Type of operation being tracked */
  type: OperationType;
  /** Human-readable description of what this operation does */
  description: string;
  /** Component or module context where operation originated */
  context: string;
  /** Call stack at operation start (for debugging) */
  callStack: string;
  /** When this operation was initiated */
  startTime: number;
  /** All milestones in this operation's lifecycle */
  milestones: OperationMilestone[];
  /** IDs of operations that this operation depends on */
  dependencies: string[];
  /** IDs of operations that were triggered by this operation */
  children: string[];
  /** Operation that triggered this one (if any) */
  parentId?: string;
  /** Additional metadata for debugging */
  metadata: Record<string, any>;
  /** Whether this operation is still active */
  isActive: boolean;
  /** Final completion time (if completed) */
  endTime?: number;
  /** Total duration in milliseconds (if completed) */
  duration?: number;
}

export interface RaceConditionPattern {
  /** Type of race condition detected */
  type: 'overlapping_sequential' | 'duplicate_operations' | 'out_of_order' | 'cascading_chain' | 'infinite_loop';
  /** Severity level of the race condition */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Human-readable description of the issue */
  description: string;
  /** Operations involved in this race condition */
  operationIds: string[];
  /** When this pattern was detected */
  detectedAt: number;
  /** Suggested fix for this race condition */
  suggestion: string;
}

export interface OperationQuery {
  /** Filter by operation type */
  type?: OperationType;
  /** Filter by context (component/module) */
  context?: string;
  /** Filter by time range */
  timeRange?: { start: number; end: number };
  /** Filter by status */
  status?: OperationStatus;
  /** Include only active operations */
  activeOnly?: boolean;
  /** Maximum number of results */
  limit?: number;
}

/**
 * Centralized operation tracking system for debugging race conditions
 * 
 * This class provides a comprehensive view of all asynchronous operations
 * in your application, making it possible to identify and debug race conditions
 * that cause UI flickering, infinite loops, and unexpected behavior.
 */
export class OperationTracker {
  private static instance: OperationTracker;
  private operations: Map<string, OperationRecord> = new Map();
  private operationHistory: OperationRecord[] = [];
  private sequenceCounter = 0;
  private readonly maxHistorySize: number;
  private readonly raceConditionPatterns: RaceConditionPattern[] = [];
  private readonly patternDetectionEnabled: boolean;
  
  constructor(maxHistorySize = 1000, enablePatternDetection = true) {
    this.maxHistorySize = maxHistorySize;
    this.patternDetectionEnabled = enablePatternDetection;
  }

  /**
   * Get singleton instance of OperationTracker
   * 
   * Using singleton ensures all parts of the application share the same
   * operation tracking context, which is crucial for detecting race conditions
   * that span multiple components or modules.
   */
  public static getInstance(): OperationTracker {
    if (!OperationTracker.instance) {
      OperationTracker.instance = new OperationTracker();
    }
    return OperationTracker.instance;
  }

  /**
   * Start tracking a new asynchronous operation
   * 
   * This method captures the initial state of an operation, including its
   * call stack and context. The call stack is crucial for understanding
   * where race conditions originate.
   * 
   * @param type - Type of operation being tracked
   * @param description - Human-readable description
   * @param context - Component or module context
   * @param parentId - ID of operation that triggered this one
   * @param metadata - Additional debugging information
   * @returns Unique operation ID for tracking milestones
   */
  public startOperation(
    type: OperationType,
    description: string,
    context: string,
    parentId?: string,
    metadata: Record<string, any> = {}
  ): string {
    const id = this.generateOperationId();
    const now = performance.now();
    
    // Capture call stack for debugging - this is crucial for race condition analysis
    const callStack = this.captureCallStack();
    
    const operation: OperationRecord = {
      id,
      type,
      description,
      context,
      callStack,
      startTime: now,
      milestones: [{
        timestamp: now,
        status: 'started',
        metadata: { ...metadata }
      }],
      dependencies: [],
      children: [],
      parentId,
      metadata: { ...metadata },
      isActive: true
    };

    // Establish parent-child relationship for dependency tracking
    if (parentId && this.operations.has(parentId)) {
      const parent = this.operations.get(parentId)!;
      parent.children.push(id);
      operation.dependencies.push(parentId);
    }

    this.operations.set(id, operation);
    
    // Detect race condition patterns if enabled
    if (this.patternDetectionEnabled) {
      this.detectRaceConditionPatterns(operation);
    }

    this.logOperationStart(operation);
    return id;
  }

  /**
   * Record a milestone in an operation's lifecycle
   * 
   * Milestones help track the progress of long-running operations and
   * identify where race conditions occur within an operation's lifecycle.
   * 
   * @param operationId - ID of the operation
   * @param status - Current status of the operation
   * @param data - Any data associated with this milestone
   * @param error - Error if operation failed
   * @param metadata - Additional milestone metadata
   */
  public recordMilestone(
    operationId: string,
    status: OperationStatus,
    data?: any,
    error?: Error,
    metadata: Record<string, any> = {}
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) {
      console.warn(`OperationTracker: Unknown operation ID ${operationId}`);
      return;
    }

    const now = performance.now();
    const milestone: OperationMilestone = {
      timestamp: now,
      status,
      data,
      error,
      metadata
    };

    operation.milestones.push(milestone);

    // Update operation completion status
    if (status === 'completed' || status === 'failed' || status === 'cancelled') {
      operation.isActive = false;
      operation.endTime = now;
      operation.duration = now - operation.startTime;
      
      // Move to history and clean up active operations
      this.moveToHistory(operation);
    }

    // Detect patterns after each milestone
    if (this.patternDetectionEnabled) {
      this.detectRaceConditionPatterns(operation);
    }

    this.logMilestone(operation, milestone);
  }

  /**
   * Record a dependency between operations
   * 
   * Dependencies are crucial for understanding race conditions. When operation A
   * depends on operation B, but B completes after A starts, you have a race condition.
   * 
   * @param dependentId - Operation that depends on another
   * @param dependencyId - Operation that is depended upon
   */
  public recordDependency(dependentId: string, dependencyId: string): void {
    const dependent = this.operations.get(dependentId);
    const dependency = this.operations.get(dependencyId);

    if (!dependent || !dependency) {
      console.warn(`OperationTracker: Invalid dependency relationship ${dependentId} -> ${dependencyId}`);
      return;
    }

    if (!dependent.dependencies.includes(dependencyId)) {
      dependent.dependencies.push(dependencyId);
    }

    if (!dependency.children.includes(dependentId)) {
      dependency.children.push(dependentId);
    }

    // Check for circular dependencies - a common source of infinite loops
    if (this.hasCircularDependency(dependentId, dependencyId)) {
      this.recordRaceConditionPattern({
        type: 'infinite_loop',
        severity: 'critical',
        description: `Circular dependency detected between ${dependent.description} and ${dependency.description}`,
        operationIds: [dependentId, dependencyId],
        detectedAt: performance.now(),
        suggestion: 'Break the circular dependency by restructuring the operation flow'
      });
    }
  }

  /**
   * Query operations based on various criteria
   * 
   * This method enables sophisticated analysis of operation patterns,
   * which is essential for identifying race conditions.
   * 
   * @param query - Query criteria for filtering operations
   * @returns Array of matching operations
   */
  public queryOperations(query: OperationQuery = {}): OperationRecord[] {
    let results: OperationRecord[] = [];
    
    // Combine active operations and history
    const allOperations = [
      ...Array.from(this.operations.values()),
      ...this.operationHistory
    ];

    results = allOperations.filter(op => {
      if (query.type && op.type !== query.type) return false;
      if (query.context && !op.context.includes(query.context)) return false;
      if (query.status && !op.milestones.some(m => m.status === query.status)) return false;
      if (query.activeOnly && !op.isActive) return false;
      if (query.timeRange) {
        const { start, end } = query.timeRange;
        if (op.startTime < start || op.startTime > end) return false;
      }
      return true;
    });

    // Sort by start time (most recent first)
    results.sort((a, b) => b.startTime - a.startTime);

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Analyze operations for race condition patterns
   * 
   * This method performs sophisticated analysis to identify common
   * race condition patterns that cause UI flickering and infinite loops.
   * 
   * @param timeWindow - Time window to analyze (in milliseconds)
   * @returns Array of detected race condition patterns
   */
  public analyzeRaceConditions(timeWindow = 5000): RaceConditionPattern[] {
    const now = performance.now();
    const windowStart = now - timeWindow;
    
    const recentOperations = this.queryOperations({
      timeRange: { start: windowStart, end: now }
    });

    const patterns: RaceConditionPattern[] = [];

    // Detect overlapping sequential operations
    patterns.push(...this.detectOverlappingSequentialOperations(recentOperations));
    
    // Detect duplicate operations
    patterns.push(...this.detectDuplicateOperations(recentOperations));
    
    // Detect out-of-order completions
    patterns.push(...this.detectOutOfOrderCompletions(recentOperations));
    
    // Detect cascading operation chains
    patterns.push(...this.detectCascadingChains(recentOperations));

    return patterns;
  }

  /**
   * Generate a visual timeline of operations
   * 
   * This creates a text-based timeline that makes temporal relationships
   * between operations visible, which is crucial for debugging race conditions.
   * 
   * @param timeWindow - Time window to visualize
   * @returns String representation of operation timeline
   */
  public generateTimeline(timeWindow = 10000): string {
    const now = performance.now();
    const windowStart = now - timeWindow;
    
    const operations = this.queryOperations({
      timeRange: { start: windowStart, end: now }
    }).sort((a, b) => a.startTime - b.startTime);

    if (operations.length === 0) {
      return 'No operations in the specified time window';
    }

    const timeline: string[] = [];
    timeline.push('🕐 Operation Timeline (Race Condition Analysis)');
    timeline.push('=' .repeat(60));
    
    const baseTime = operations[0].startTime;
    
    operations.forEach(op => {
      const relativeStart = Math.round(op.startTime - baseTime);
      const duration = op.duration || (now - op.startTime);
      const relativeEnd = Math.round(relativeStart + duration);
      
      // Create visual timeline bar
      const timelineBar = this.createTimelineBar(relativeStart, relativeEnd, timeWindow);
      const statusIcon = this.getStatusIcon(op);
      const contextInfo = `[${op.context}]`;
      
      timeline.push(`${statusIcon} ${timelineBar} ${op.description} ${contextInfo}`);
      
      // Show dependencies
      if (op.dependencies.length > 0) {
        timeline.push(`   ↳ Depends on: ${op.dependencies.join(', ')}`);
      }
      
      // Show children
      if (op.children.length > 0) {
        timeline.push(`   ↳ Triggers: ${op.children.join(', ')}`);
      }
    });

    // Add race condition warnings
    const raceConditions = this.analyzeRaceConditions(timeWindow);
    if (raceConditions.length > 0) {
      timeline.push('');
      timeline.push('⚠️  Race Condition Warnings:');
      timeline.push('-'.repeat(40));
      raceConditions.forEach(pattern => {
        timeline.push(`${this.getSeverityIcon(pattern.severity)} ${pattern.description}`);
        timeline.push(`   Suggestion: ${pattern.suggestion}`);
      });
    }

    return timeline.join('\n');
  }

  /**
   * Get comprehensive debugging report
   * 
   * This method provides a complete analysis of the application's
   * operation patterns, specifically focused on race condition detection.
   * 
   * @returns Detailed debugging report
   */
  public getDebugReport(): {
    summary: {
      totalOperations: number;
      activeOperations: number;
      completedOperations: number;
      failedOperations: number;
      averageDuration: number;
    };
    raceConditions: RaceConditionPattern[];
    timeline: string;
    recommendations: string[];
  } {
    const allOperations = [
      ...Array.from(this.operations.values()),
      ...this.operationHistory
    ];

    const activeOps = allOperations.filter(op => op.isActive);
    const completedOps = allOperations.filter(op => op.endTime && !op.milestones.some(m => m.status === 'failed'));
    const failedOps = allOperations.filter(op => op.milestones.some(m => m.status === 'failed'));
    
    const avgDuration = completedOps.length > 0 
      ? completedOps.reduce((sum, op) => sum + (op.duration || 0), 0) / completedOps.length
      : 0;

    const raceConditions = this.analyzeRaceConditions();
    const timeline = this.generateTimeline();
    const recommendations = this.generateRecommendations(raceConditions);

    return {
      summary: {
        totalOperations: allOperations.length,
        activeOperations: activeOps.length,
        completedOperations: completedOps.length,
        failedOperations: failedOps.length,
        averageDuration: Math.round(avgDuration)
      },
      raceConditions,
      timeline,
      recommendations
    };
  }

  /**
   * Clear all tracking data
   * 
   * Useful for resetting the tracker during development or testing.
   */
  public clear(): void {
    this.operations.clear();
    this.operationHistory = [];
    this.raceConditionPatterns.length = 0;
    this.sequenceCounter = 0;
  }

  // Private helper methods

  private generateOperationId(): string {
    return `op_${++this.sequenceCounter}_${Date.now()}`;
  }

  private captureCallStack(): string {
    const stack = new Error().stack || '';
    // Remove the first few lines which are internal to this tracker
    return stack.split('\n').slice(3, 8).join('\n');
  }

  private moveToHistory(operation: OperationRecord): void {
    this.operations.delete(operation.id);
    this.operationHistory.unshift(operation);
    
    // Maintain circular buffer size
    if (this.operationHistory.length > this.maxHistorySize) {
      this.operationHistory = this.operationHistory.slice(0, this.maxHistorySize);
    }
  }

  private detectRaceConditionPatterns(operation: OperationRecord): void {
    // This is called after each operation start/milestone
    // Implement real-time pattern detection here
    
    // Example: Detect if multiple operations of the same type are running simultaneously
    const similarOperations = Array.from(this.operations.values())
      .filter(op => op.type === operation.type && op.context === operation.context && op.isActive);
    
    if (similarOperations.length > 1) {
      this.recordRaceConditionPattern({
        type: 'duplicate_operations',
        severity: 'medium',
        description: `Multiple ${operation.type} operations running simultaneously in ${operation.context}`,
        operationIds: similarOperations.map(op => op.id),
        detectedAt: performance.now(),
        suggestion: 'Consider debouncing or canceling previous operations before starting new ones'
      });
    }
  }

  private recordRaceConditionPattern(pattern: RaceConditionPattern): void {
    this.raceConditionPatterns.push(pattern);
    console.warn('🚨 Race Condition Detected:', pattern);
  }

  private hasCircularDependency(opId1: string, opId2: string): boolean {
    // Simple circular dependency check - can be enhanced for deeper analysis
    const op1 = this.operations.get(opId1);
    const op2 = this.operations.get(opId2);
    
    if (!op1 || !op2) return false;
    
    return op1.dependencies.includes(opId2) && op2.dependencies.includes(opId1);
  }

  private detectOverlappingSequentialOperations(operations: OperationRecord[]): RaceConditionPattern[] {
    const patterns: RaceConditionPattern[] = [];
    
    // Group operations by context and type
    const groups = new Map<string, OperationRecord[]>();
    operations.forEach(op => {
      const key = `${op.context}_${op.type}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(op);
    });

    groups.forEach((ops, key) => {
      if (ops.length < 2) return;
      
      // Sort by start time
      ops.sort((a, b) => a.startTime - b.startTime);
      
      // Check for overlapping operations that should be sequential
      for (let i = 0; i < ops.length - 1; i++) {
        const current = ops[i];
        const next = ops[i + 1];
        
        if (current.isActive && next.startTime < (current.endTime || performance.now())) {
          patterns.push({
            type: 'overlapping_sequential',
            severity: 'high',
            description: `Sequential operations overlapping: ${current.description} and ${next.description}`,
            operationIds: [current.id, next.id],
            detectedAt: performance.now(),
            suggestion: 'Ensure previous operation completes before starting the next one'
          });
        }
      }
    });

    return patterns;
  }

  private detectDuplicateOperations(operations: OperationRecord[]): RaceConditionPattern[] {
    const patterns: RaceConditionPattern[] = [];
    const duplicateGroups = new Map<string, OperationRecord[]>();
    
    operations.forEach(op => {
      const key = `${op.type}_${op.description}_${op.context}`;
      if (!duplicateGroups.has(key)) duplicateGroups.set(key, []);
      duplicateGroups.get(key)!.push(op);
    });

    duplicateGroups.forEach((ops, key) => {
      if (ops.length > 1) {
        const activeOps = ops.filter(op => op.isActive);
        if (activeOps.length > 1) {
          patterns.push({
            type: 'duplicate_operations',
            severity: 'medium',
            description: `Duplicate operations detected: ${ops[0].description}`,
            operationIds: activeOps.map(op => op.id),
            detectedAt: performance.now(),
            suggestion: 'Implement operation deduplication or cancellation logic'
          });
        }
      }
    });

    return patterns;
  }

  private detectOutOfOrderCompletions(operations: OperationRecord[]): RaceConditionPattern[] {
    const patterns: RaceConditionPattern[] = [];
    
    // Find operations with dependencies that completed out of order
    operations.forEach(op => {
      if (op.dependencies.length > 0 && op.endTime) {
        op.dependencies.forEach(depId => {
          const dependency = operations.find(o => o.id === depId);
          if (dependency && dependency.endTime && dependency.endTime > op.endTime!) {
            patterns.push({
              type: 'out_of_order',
              severity: 'high',
              description: `Operation completed before its dependency: ${op.description} finished before ${dependency.description}`,
              operationIds: [op.id, depId],
              detectedAt: performance.now(),
              suggestion: 'Ensure proper async/await or Promise chaining for dependent operations'
            });
          }
        });
      }
    });

    return patterns;
  }

  private detectCascadingChains(operations: OperationRecord[]): RaceConditionPattern[] {
    const patterns: RaceConditionPattern[] = [];
    
    // Find long chains of operations that might indicate cascading updates
    operations.forEach(op => {
      if (op.children.length > 3) {
        patterns.push({
          type: 'cascading_chain',
          severity: 'medium',
          description: `Long operation chain detected starting from: ${op.description}`,
          operationIds: [op.id, ...op.children],
          detectedAt: performance.now(),
          suggestion: 'Consider batching updates or using a state management solution to reduce cascading effects'
        });
      }
    });

    return patterns;
  }

  private createTimelineBar(start: number, end: number, totalWindow: number): string {
    const barLength = 20;
    const startPos = Math.floor((start / totalWindow) * barLength);
    const endPos = Math.floor((end / totalWindow) * barLength);
    
    let bar = '·'.repeat(barLength);
    for (let i = startPos; i <= Math.min(endPos, barLength - 1); i++) {
      bar = bar.substring(0, i) + '█' + bar.substring(i + 1);
    }
    
    return `[${bar}]`;
  }

  private getStatusIcon(operation: OperationRecord): string {
    if (operation.isActive) return '🔄';
    if (operation.milestones.some(m => m.status === 'failed')) return '❌';
    if (operation.milestones.some(m => m.status === 'completed')) return '✅';
    return '⏸️';
  }

  private getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '⚡';
      case 'low': return 'ℹ️';
      default: return '❓';
    }
  }

  private generateRecommendations(patterns: RaceConditionPattern[]): string[] {
    const recommendations: string[] = [];
    
    if (patterns.some(p => p.type === 'infinite_loop')) {
      recommendations.push('🔄 Break circular dependencies by restructuring operation flow');
    }
    
    if (patterns.some(p => p.type === 'duplicate_operations')) {
      recommendations.push('🎯 Implement operation deduplication using request IDs or cancellation tokens');
    }
    
    if (patterns.some(p => p.type === 'overlapping_sequential')) {
      recommendations.push('⏳ Add proper async/await patterns to ensure sequential execution');
    }
    
    if (patterns.some(p => p.type === 'cascading_chain')) {
      recommendations.push('🔗 Consider batching state updates to reduce cascading effects');
    }
    
    if (patterns.some(p => p.type === 'out_of_order')) {
      recommendations.push('📋 Review Promise chains and ensure proper dependency management');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ No major race condition patterns detected');
    }

    return recommendations;
  }

  private logOperationStart(operation: OperationRecord): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [${operation.id}] Started: ${operation.description} in ${operation.context}`);
    }
  }

  private logMilestone(operation: OperationRecord, milestone: OperationMilestone): void {
    if (process.env.NODE_ENV === 'development') {
      const icon = milestone.status === 'completed' ? '✅' : 
                   milestone.status === 'failed' ? '❌' : 
                   milestone.status === 'progress' ? '⏳' : '📍';
      console.log(`${icon} [${operation.id}] ${milestone.status}: ${operation.description}`);
    }
  }
}

// Export singleton instance for easy access
export const operationTracker = OperationTracker.getInstance();