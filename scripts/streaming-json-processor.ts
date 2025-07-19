import { Transform, Readable, pipeline } from 'stream';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

const pipelineAsync = promisify(pipeline);

// Types for our streaming processor
interface ProcessorOptions {
  batchSize?: number;
  checkpointInterval?: number;
  resumeFromCheckpoint?: boolean;
  onProgress?: (stats: ProcessingStats) => void;
  onRecord?: (record: any, index: number) => Promise<any> | any;
  onBatch?: (batch: any[], startIndex: number) => Promise<void> | void;
  onError?: (error: Error, record?: any, index?: number) => void;
}

interface ProcessingStats {
  totalRecords: number;
  processedRecords: number;
  skippedRecords: number;
  errorRecords: number;
  currentBatch: number;
  processingRate: number; // records per second
  estimatedTimeRemaining: number; // seconds
  startTime: Date;
  lastCheckpoint: number;
}

interface CheckpointData {
  lastProcessedIndex: number;
  stats: ProcessingStats;
  timestamp: Date;
}

class StreamingJSONProcessor extends EventEmitter {
  private options: ProcessorOptions;
  private stats: ProcessingStats;
  private isPaused: boolean = false;
  private isProcessing: boolean = false;
  private checkpointPath: string;
  private startTime: Date;

  constructor(options: ProcessorOptions = {}) {
    super();
    this.options = {
      batchSize: 100,
      checkpointInterval: 1000,
      resumeFromCheckpoint: false,
      ...options
    };

    this.stats = {
      totalRecords: 0,
      processedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      currentBatch: 0,
      processingRate: 0,
      estimatedTimeRemaining: 0,
      startTime: new Date(),
      lastCheckpoint: 0
    };

    this.startTime = new Date();
    this.checkpointPath = path.join(process.cwd(), '.streaming-checkpoint.json');
  }

  async processFile(filePath: string): Promise<ProcessingStats> {
    if (this.isProcessing) {
      throw new Error('Processor is already running');
    }

    this.isProcessing = true;
    this.emit('start');

    try {
      // Load checkpoint if resuming
      if (this.options.resumeFromCheckpoint) {
        await this.loadCheckpoint();
      }

      // Get file size for progress calculation
      const fileStats = await fs.promises.stat(filePath);
      const fileSize = fileStats.size;

      // Create read stream
      const readStream = fs.createReadStream(filePath, { encoding: 'utf8' });
      
      // Create JSON parser transform stream
      const jsonParser = this.createJSONParserStream();
      
      // Create record processor transform stream
      const recordProcessor = this.createRecordProcessorStream();

      // Set up progress tracking
      let bytesRead = 0;
      readStream.on('data', (chunk) => {
        bytesRead += chunk.length;
        const progress = (bytesRead / fileSize) * 100;
        this.updateProgress();
      });

      // Pipeline the streams
      await pipelineAsync(
        readStream,
        jsonParser,
        recordProcessor
      );

      this.emit('complete', this.stats);
      return this.stats;

    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  private createJSONParserStream(): Transform {
    let buffer = '';
    let recordCount = 0;
    let bracketDepth = 0;
    let inString = false;
    let escapeNext = false;
    let currentRecord = '';
    let inArray = false;

    return new Transform({
      objectMode: true,
      transform(chunk: Buffer, encoding, callback) {
        const chunkStr = chunk.toString();
        buffer += chunkStr;
        
        // Process buffer in smaller chunks to prevent memory buildup
        let processedLength = 0;
        
        for (let i = 0; i < buffer.length; i++) {
          const char = buffer[i];
          
          if (escapeNext) {
            escapeNext = false;
            if (bracketDepth > 0) currentRecord += char;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            if (bracketDepth > 0) currentRecord += char;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            if (bracketDepth > 0) currentRecord += char;
            continue;
          }
          
          if (!inString) {
            if (char === '[') {
              inArray = true;
            } else if (char === ']') {
              inArray = false;
            } else if (char === '{') {
              if (bracketDepth === 0) {
                currentRecord = char;
              } else {
                currentRecord += char;
              }
              bracketDepth++;
            } else if (char === '}') {
              currentRecord += char;
              bracketDepth--;
              
              if (bracketDepth === 0 && currentRecord.trim()) {
                try {
                  const record = JSON.parse(currentRecord);
                  this.push({ record, index: recordCount++ });
                  currentRecord = '';
                  processedLength = i + 1;
                } catch (error) {
                  // Skip malformed JSON
                  currentRecord = '';
                  processedLength = i + 1;
                }
              }
            } else if (bracketDepth > 0) {
              currentRecord += char;
            }
          } else {
            if (bracketDepth > 0) currentRecord += char;
          }
        }
        
        // Keep only unprocessed part of buffer to prevent memory buildup
        if (processedLength > 0) {
          buffer = buffer.slice(processedLength);
        } else if (buffer.length > 1000000) { // 1MB limit
          // If buffer gets too large without finding complete records, truncate
          buffer = buffer.slice(-100000); // Keep last 100KB
        }
        
        callback();
      },
      
      flush(callback) {
        if (currentRecord.trim()) {
          try {
            const record = JSON.parse(currentRecord);
            this.push({ record, index: recordCount++ });
          } catch (error) {
            // Skip malformed JSON at end
          }
        }
        callback();
      }
    });
  }

  private createRecordProcessorStream(): Transform {
    const processor = this;
    let batch: any[] = [];
    let batchStartIndex = 0;

    return new Transform({
      objectMode: true,
      async transform(data: { record: any, index: number }, encoding, callback) {
        try {
          // Check if paused
          if (processor.isPaused) {
            await processor.waitForResume();
          }

          // Skip if resuming from checkpoint
          if (data.index < processor.stats.lastCheckpoint) {
            processor.stats.skippedRecords++;
            callback();
            return;
          }

          // Process individual record if handler provided
          let processedRecord = data.record;
          if (processor.options.onRecord) {
            try {
              processedRecord = await processor.options.onRecord(data.record, data.index);
            } catch (error) {
              processor.stats.errorRecords++;
              if (processor.options.onError) {
                processor.options.onError(error as Error, data.record, data.index);
              }
              callback();
              return;
            }
          }

          // Add to batch
          batch.push(processedRecord);
          
          // Process batch when full
          if (batch.length >= (processor.options.batchSize || 100)) {
            await processor.processBatch(batch, batchStartIndex);
            batch = [];
            batchStartIndex = data.index + 1;
          }

          processor.stats.processedRecords++;
          processor.updateProgress();

          // Save checkpoint periodically
          if (processor.stats.processedRecords % (processor.options.checkpointInterval || 1000) === 0) {
            await processor.saveCheckpoint(data.index);
          }

          callback();
        } catch (error) {
          callback(error);
        }
      },

      async flush(callback) {
        // Process remaining batch
        if (batch.length > 0) {
          await processor.processBatch(batch, batchStartIndex);
        }
        
        // Clean up checkpoint
        await processor.cleanupCheckpoint();
        callback();
      }
    });
  }

  private async processBatch(batch: any[], startIndex: number): Promise<void> {
    if (this.options.onBatch) {
      try {
        await this.options.onBatch(batch, startIndex);
        this.stats.currentBatch++;
      } catch (error) {
        this.stats.errorRecords += batch.length;
        if (this.options.onError) {
          this.options.onError(error as Error);
        }
      }
    }
  }

  private updateProgress(): void {
    const now = new Date();
    const elapsedSeconds = (now.getTime() - this.startTime.getTime()) / 1000;
    
    this.stats.processingRate = this.stats.processedRecords / elapsedSeconds;
    
    if (this.stats.totalRecords > 0) {
      const remainingRecords = this.stats.totalRecords - this.stats.processedRecords;
      this.stats.estimatedTimeRemaining = remainingRecords / this.stats.processingRate;
    }

    if (this.options.onProgress) {
      this.options.onProgress(this.stats);
    }

    this.emit('progress', this.stats);
  }

  private async saveCheckpoint(lastIndex: number): Promise<void> {
    const checkpoint: CheckpointData = {
      lastProcessedIndex: lastIndex,
      stats: { ...this.stats, lastCheckpoint: lastIndex },
      timestamp: new Date()
    };

    try {
      await fs.promises.writeFile(
        this.checkpointPath,
        JSON.stringify(checkpoint, null, 2)
      );
    } catch (error) {
      console.warn('Failed to save checkpoint:', error);
    }
  }

  private async loadCheckpoint(): Promise<void> {
    try {
      const checkpointData = await fs.promises.readFile(this.checkpointPath, 'utf8');
      const checkpoint: CheckpointData = JSON.parse(checkpointData);
      
      this.stats = { ...checkpoint.stats };
      console.log(`Resuming from checkpoint: ${checkpoint.lastProcessedIndex} records processed`);
    } catch (error) {
      console.log('No checkpoint found, starting from beginning');
    }
  }

  private async cleanupCheckpoint(): Promise<void> {
    try {
      await fs.promises.unlink(this.checkpointPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  private async waitForResume(): Promise<void> {
    return new Promise((resolve) => {
      const checkResume = () => {
        if (!this.isPaused) {
          resolve();
        } else {
          setTimeout(checkResume, 100);
        }
      };
      checkResume();
    });
  }

  // Control methods
  pause(): void {
    this.isPaused = true;
    this.emit('paused');
  }

  resume(): void {
    this.isPaused = false;
    this.emit('resumed');
  }

  stop(): void {
    this.isProcessing = false;
    this.emit('stopped');
  }

  getStats(): ProcessingStats {
    return { ...this.stats };
  }
}

export { StreamingJSONProcessor, ProcessorOptions, ProcessingStats };