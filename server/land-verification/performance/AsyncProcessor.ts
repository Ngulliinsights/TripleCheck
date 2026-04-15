import { EventEmitter } from 'events';

import type {
  VerificationSession,
  LayerExecutionResult,
  VerificationLayer
} from '../../../src/types/land-verification';
import { logger } from '../../infrastructure/observability/telemetry';
import { landVerificationCache } from '../cache/LandVerificationCache';

export interface AsyncTask {
  id: string;
  type: 'verification-layer' | 'risk-assessment' | 'government-data' | 'monitoring';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sessionId: string;
  propertyId: string;
  payload: any;
  createdAt: Date;
  scheduledFor?: Date;
  maxRetries: number;
  currentRetries: number;
  timeout: number; // in milliseconds
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  completedAt: Date;
}

export interface ProcessorConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryDelay: number;
  maxRetries: number;
  enablePrioritization: boolean;
  batchSize: number;
}

export class AsyncProcessor extends EventEmitter {
  private config: ProcessorConfig;
  private taskQueue: AsyncTask[] = [];
  private runningTasks: Map<string, AsyncTask> = new Map();
  private completedTasks: Map<string, TaskResult> = new Map();
  private isProcessing: boolean = false;
  private processingInterval?: NodeJS.Timeout;
  private taskHandlers: Map<string, (task: AsyncTask) => Promise<any>> = new Map();

  constructor(config?: Partial<ProcessorConfig>) {
    super();
    this.config = {
      maxConcurrentTasks: 10,
      taskTimeout: 300000, // 5 minutes
      retryDelay: 5000, // 5 seconds
      maxRetries: 3,
      enablePrioritization: true,
      batchSize: 5,
      ...config
    };

    this.setupTaskHandlers();
  }

  private setupTaskHandlers(): void {
    // Register task handlers for different task types
    this.taskHandlers.set('verification-layer', this.handleVerificationLayer.bind(this));
    this.taskHandlers.set('risk-assessment', this.handleRiskAssessment.bind(this));
    this.taskHandlers.set('government-data', this.handleGovernmentData.bind(this));
    this.taskHandlers.set('monitoring', this.handleMonitoring.bind(this));
  }

  // Task Management
  async addTask(task: Omit<AsyncTask, 'id' | 'createdAt' | 'currentRetries'>): Promise<string> {
    const taskId = this.generateTaskId();
    const fullTask: AsyncTask = {
      ...task,
      id: taskId,
      createdAt: new Date(),
      currentRetries: 0,
      maxRetries: task.maxRetries || this.config.maxRetries,
      timeout: task.timeout || this.config.taskTimeout
    };

    // Add to queue with priority sorting if enabled
    if (this.config.enablePrioritization) {
      this.insertTaskByPriority(fullTask);
    } else {
      this.taskQueue.push(fullTask);
    }

    logger.info(`Added task ${taskId} to queue (type: ${task.type}, priority: ${task.priority})`);
    this.emit('taskAdded', fullTask);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }

    return taskId;
  }

  async addBatchTasks(tasks: Array<Omit<AsyncTask, 'id' | 'createdAt' | 'currentRetries'>>): Promise<string[]> {
    const taskIds: string[] = [];
    
    for (const task of tasks) {
      const taskId = await this.addTask(task);
      taskIds.push(taskId);
    }

    logger.info(`Added batch of ${tasks.length} tasks to queue`);
    return taskIds;
  }

  private insertTaskByPriority(task: AsyncTask): void {
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    const taskPriority = priorityOrder[task.priority];

    let insertIndex = this.taskQueue.length;
    for (let i = 0; i < this.taskQueue.length; i++) {
      const queuedTaskPriority = priorityOrder[this.taskQueue[i].priority];
      if (taskPriority < queuedTaskPriority) {
        insertIndex = i;
        break;
      }
    }

    this.taskQueue.splice(insertIndex, 0, task);
  }

  // Processing Control
  startProcessing(): void {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    logger.info('Starting async task processing');

    // Process tasks immediately and then set up interval
    this.processTasks();
    this.processingInterval = setInterval(() => {
      this.processTasks();
    }, 1000); // Check every second

    this.emit('processingStarted');
  }

  stopProcessing(): void {
    if (!this.isProcessing) {
      return;
    }

    this.isProcessing = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }

    logger.info('Stopped async task processing');
    this.emit('processingStopped');
  }

  private async processTasks(): Promise<void> {
    if (!this.isProcessing || this.runningTasks.size >= this.config.maxConcurrentTasks) {
      return;
    }

    // Process tasks in batches for better performance
    const availableSlots = this.config.maxConcurrentTasks - this.runningTasks.size;
    const tasksToProcess = Math.min(availableSlots, this.config.batchSize);

    const tasks = this.getNextTasks(tasksToProcess);
    
    for (const task of tasks) {
      this.executeTask(task);
    }
  }

  private getNextTasks(count: number): AsyncTask[] {
    const tasks: AsyncTask[] = [];
    const now = new Date();

    for (let i = 0; i < this.taskQueue.length && tasks.length < count; i++) {
      const task = this.taskQueue[i];
      
      // Check if task is scheduled for future execution
      if (task.scheduledFor && task.scheduledFor > now) {
        continue;
      }

      tasks.push(task);
      this.taskQueue.splice(i, 1);
      i--; // Adjust index after removal
    }

    return tasks;
  }

  private async executeTask(task: AsyncTask): Promise<void> {
    const startTime = Date.now();
    this.runningTasks.set(task.id, task);

    logger.info(`Executing task ${task.id} (type: ${task.type})`);
    this.emit('taskStarted', task);

    try {
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), task.timeout);
      });

      // Get task handler
      const handler = this.taskHandlers.get(task.type);
      if (!handler) {
        throw new Error(`No handler found for task type: ${task.type}`);
      }

      // Execute task with timeout
      const result = await Promise.race([
        handler(task),
        timeoutPromise
      ]);

      const executionTime = Date.now() - startTime;
      const taskResult: TaskResult = {
        taskId: task.id,
        success: true,
        result,
        executionTime,
        completedAt: new Date()
      };

      this.completedTasks.set(task.id, taskResult);
      this.runningTasks.delete(task.id);

      logger.info(`Task ${task.id} completed successfully in ${executionTime}ms`);
      this.emit('taskCompleted', taskResult);

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(`Task ${task.id} failed: ${errorMessage}`);

      // Handle retry logic
      if (task.currentRetries < task.maxRetries) {
        task.currentRetries++;
        task.scheduledFor = new Date(Date.now() + this.config.retryDelay);
        
        // Re-add to queue for retry
        this.taskQueue.unshift(task);
        
        logger.info(`Task ${task.id} scheduled for retry ${task.currentRetries}/${task.maxRetries}`);
        this.emit('taskRetry', task);
      } else {
        // Max retries reached, mark as failed
        const taskResult: TaskResult = {
          taskId: task.id,
          success: false,
          error: errorMessage,
          executionTime,
          completedAt: new Date()
        };

        this.completedTasks.set(task.id, taskResult);
        logger.error(`Task ${task.id} failed permanently after ${task.maxRetries} retries`);
        this.emit('taskFailed', taskResult);
      }

      this.runningTasks.delete(task.id);
    }
  }

  // Task Handlers
  private async handleVerificationLayer(task: AsyncTask): Promise<LayerExecutionResult> {
    const { sessionId, layerType, layerConfig } = task.payload;

    // Check cache first
    const cachedResult = await landVerificationCache.getLayerResult(sessionId, layerType);
    if (cachedResult) {
      logger.info(`Using cached result for layer ${layerType} in session ${sessionId}`);
      return cachedResult;
    }

    // Execute layer verification based on type
    let result: LayerExecutionResult;
    
    switch (layerType) {
      case 'registry':
        result = await this.executeRegistryVerification(sessionId, layerConfig);
        break;
      case 'physical':
        result = await this.executePhysicalVerification(sessionId, layerConfig);
        break;
      case 'community':
        result = await this.executeCommunityVerification(sessionId, layerConfig);
        break;
      case 'government':
        result = await this.executeGovernmentVerification(sessionId, layerConfig);
        break;
      case 'legal':
        result = await this.executeLegalVerification(sessionId, layerConfig);
        break;
      case 'expert':
        result = await this.executeExpertVerification(sessionId, layerConfig);
        break;
      default:
        throw new Error(`Unknown layer type: ${layerType}`);
    }

    // Cache the result
    await landVerificationCache.setLayerResult(sessionId, layerType, result);

    return result;
  }

  private async handleRiskAssessment(task: AsyncTask): Promise<any> {
    const { sessionId } = task.payload;
    
    // Check cache first
    const cachedAssessment = await landVerificationCache.getRiskAssessment(sessionId);
    if (cachedAssessment) {
      return cachedAssessment;
    }

    // Mock risk assessment for now - would import actual service in production
    const assessment = {
      id: `risk-${sessionId}`,
      sessionId,
      overallRiskScore: Math.floor(Math.random() * 100),
      riskLevel: 'medium' as const,
      confidence: 0.85,
      riskFactors: [],
      recommendations: [],
      riskInteractions: [],
      assessmentDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
    
    // Cache the result
    await landVerificationCache.setRiskAssessment(sessionId, assessment);
    
    return assessment;
  }

  private async handleGovernmentData(task: AsyncTask): Promise<any> {
    const { propertyId, dataType, queryParams } = task.payload;
    
    // Check cache first
    const cachedData = await landVerificationCache.getGovernmentData(propertyId, dataType);
    if (cachedData) {
      return cachedData;
    }

    // Mock government data retrieval for now - would import actual service in production
    let result;
    switch (dataType) {
      case 'registry':
        result = {
          success: true,
          data: {
            titleNumber: queryParams?.titleNumber || 'MOCK-123',
            owner: 'Mock Owner',
            verified: true
          },
          timestamp: new Date(),
          source: 'mock-registry'
        };
        break;
      case 'court-records':
        result = {
          success: true,
          data: {
            records: [],
            hasDisputes: false
          },
          timestamp: new Date(),
          source: 'mock-court'
        };
        break;
      case 'designations':
        result = {
          success: true,
          data: {
            designations: [],
            hasRestrictions: false
          },
          timestamp: new Date(),
          source: 'mock-designations'
        };
        break;
      case 'infrastructure':
        result = {
          success: true,
          data: {
            plannedProjects: [],
            hasImpact: false
          },
          timestamp: new Date(),
          source: 'mock-infrastructure'
        };
        break;
      default:
        throw new Error(`Unknown government data type: ${dataType}`);
    }

    // Cache the result
    await landVerificationCache.setGovernmentData(propertyId, dataType, result);
    
    return result;
  }

  private async handleMonitoring(task: AsyncTask): Promise<any> {
    const { propertyId, monitoringType } = task.payload;
    
    // Mock monitoring service for now - would import actual service in production
    return {
      propertyId,
      monitoringType: monitoringType || 'general',
      updates: [],
      alerts: [],
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      status: 'no_changes'
    };
  }

  // Layer Execution Methods (simplified implementations)
  private async executeRegistryVerification(sessionId: string, config: any): Promise<LayerExecutionResult> {
    // Placeholder implementation - would integrate with actual registry service
    return {
      layerId: parseInt(sessionId),
      status: 'completed',
      results: { verified: true },
      duration: 1000,
      findings: ['Registry verification completed'],
      recommendations: [],
      nextActions: []
    };
  }

  private async executePhysicalVerification(sessionId: string, config: any): Promise<LayerExecutionResult> {
    // Import and use existing PhysicalVerificationService
    const { PhysicalVerificationService } = await import('../PhysicalVerificationService');
    const physicalService = new PhysicalVerificationService();
    
    // This would use the actual verification request from the session
    const mockRequest = {
      sessionId,
      propertyId: config.propertyId,
      surveyPlan: config.surveyPlan,
      actualCoordinates: config.actualCoordinates,
      beaconReadings: config.beaconReadings
    };
    
    const result = await physicalService.performPhysicalVerification(mockRequest);
    return physicalService.toLayerExecutionResult(result);
  }

  private async executeCommunityVerification(sessionId: string, config: any): Promise<LayerExecutionResult> {
    // Placeholder implementation
    return {
      layerId: parseInt(sessionId),
      status: 'completed',
      results: { communityFeedback: 'positive' },
      duration: 2000,
      findings: ['Community verification completed'],
      recommendations: [],
      nextActions: []
    };
  }

  private async executeGovernmentVerification(sessionId: string, config: any): Promise<LayerExecutionResult> {
    // Placeholder implementation
    return {
      layerId: parseInt(sessionId),
      status: 'completed',
      results: { governmentClearance: true },
      duration: 3000,
      findings: ['Government verification completed'],
      recommendations: [],
      nextActions: []
    };
  }

  private async executeLegalVerification(sessionId: string, config: any): Promise<LayerExecutionResult> {
    // Placeholder implementation
    return {
      layerId: parseInt(sessionId),
      status: 'completed',
      results: { legalClearance: true },
      duration: 2500,
      findings: ['Legal verification completed'],
      recommendations: [],
      nextActions: []
    };
  }

  private async executeExpertVerification(sessionId: string, config: any): Promise<LayerExecutionResult> {
    // Placeholder implementation
    return {
      layerId: parseInt(sessionId),
      status: 'completed',
      results: { expertApproval: true },
      duration: 4000,
      findings: ['Expert verification completed'],
      recommendations: [],
      nextActions: []
    };
  }

  // Task Status and Management
  getTaskStatus(taskId: string): 'queued' | 'running' | 'completed' | 'failed' | 'not_found' {
    if (this.runningTasks.has(taskId)) {
      return 'running';
    }
    
    const completed = this.completedTasks.get(taskId);
    if (completed) {
      return completed.success ? 'completed' : 'failed';
    }
    
    const queued = this.taskQueue.find(task => task.id === taskId);
    if (queued) {
      return 'queued';
    }
    
    return 'not_found';
  }

  getTaskResult(taskId: string): TaskResult | null {
    return this.completedTasks.get(taskId) || null;
  }

  cancelTask(taskId: string): boolean {
    // Remove from queue if not yet running
    const queueIndex = this.taskQueue.findIndex(task => task.id === taskId);
    if (queueIndex !== -1) {
      this.taskQueue.splice(queueIndex, 1);
      logger.info(`Cancelled queued task ${taskId}`);
      return true;
    }
    
    // Cannot cancel running tasks in this simple implementation
    return false;
  }

  // Statistics and Monitoring
  getProcessorStats(): {
    queuedTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalProcessed: number;
  } {
    const completed = Array.from(this.completedTasks.values());
    const successful = completed.filter(task => task.success).length;
    const failed = completed.filter(task => !task.success).length;

    return {
      queuedTasks: this.taskQueue.length,
      runningTasks: this.runningTasks.size,
      completedTasks: successful,
      failedTasks: failed,
      totalProcessed: completed.length
    };
  }

  // Utility Methods
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  // Cleanup
  async shutdown(): Promise<void> {
    logger.info('Shutting down async processor...');
    
    this.stopProcessing();
    
    // Wait for running tasks to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();
    
    while (this.runningTasks.size > 0 && (Date.now() - startTime) < shutdownTimeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (this.runningTasks.size > 0) {
      logger.warn(`Shutdown timeout reached with ${this.runningTasks.size} tasks still running`);
    }
    
    // Clear all data
    this.taskQueue = [];
    this.runningTasks.clear();
    this.completedTasks.clear();
    
    logger.info('Async processor shutdown complete');
  }
}

// Export singleton instance
export const asyncProcessor = new AsyncProcessor();