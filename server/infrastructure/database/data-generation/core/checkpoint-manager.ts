/**
 * Checkpoint Manager for Data Generation
 * 
 * Manages progress checkpoints during data generation to enable
 * resuming interrupted operations and tracking generation progress.
 * 
 * Moved from database/seeds/generators/checkpoint-manager.ts
 */

import fs from '..\..\..\..\..\scripts\cleanup-redundancies';
import path from '..\..\..\..\..\scripts\cleanup-redundancies';

export interface Checkpoint {
  id: string;
  timestamp: Date;
  data: unknown;
  metadata: {
    version: string;
    generator: string;
    stage: string;
  };
}

export interface CheckpointSummary {
  id: string;
  timestamp: Date;
  stage: string;
  size: number;
}

/**
 * Manages checkpoints for data generation operations
 */
export class CheckpointManager {
  private checkpointsDir: string;

  constructor(checkpointsDir: string = './database/data-generation/output/checkpoints') {
    this.checkpointsDir = checkpointsDir;
  }

  /**
   * Create a new checkpoint
   */
  async createCheckpoint(id: string, data: unknown, metadata?: Partial<Checkpoint['metadata']>): Promise<void> {
    await this.ensureCheckpointsDir();

    const checkpoint: Checkpoint = {
      id,
      timestamp: new Date(),
      data,
      metadata: {
        version: '1.0.0',
        generator: 'unified-data-generator',
        stage: 'unknown',
        ...metadata
      }
    };

    const filePath = path.join(this.checkpointsDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2));
  }

  /**
   * Load a checkpoint by ID
   */
  async loadCheckpoint(id: string): Promise<Checkpoint | null> {
    try {
      const filePath = path.join(this.checkpointsDir, `${id}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const checkpoint = JSON.parse(content);
      
      // Convert timestamp back to Date object
      checkpoint.timestamp = new Date(checkpoint.timestamp);
      
      return checkpoint;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * List all available checkpoints
   */
  async listCheckpoints(): Promise<CheckpointSummary[]> {
    try {
      await this.ensureCheckpointsDir();
      const files = await fs.readdir(this.checkpointsDir);
      const checkpointFiles = files.filter(file => file.endsWith('.json'));
      
      const summaries: CheckpointSummary[] = [];
      
      for (const file of checkpointFiles) {
        try {
          const filePath = path.join(this.checkpointsDir, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const checkpoint = JSON.parse(content);
          
          summaries.push({
            id: checkpoint.id,
            timestamp: new Date(checkpoint.timestamp),
            stage: checkpoint.metadata?.stage || 'unknown',
            size: stats.size
          });
        } catch (error) {
          // Skip invalid checkpoint files
          continue;
        }
      }
      
      // Sort by timestamp, newest first
      return summaries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete a checkpoint
   */
  async deleteCheckpoint(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.checkpointsDir, `${id}.json`);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Clean up old checkpoints
   */
  async cleanupOldCheckpoints(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const checkpoints = await this.listCheckpoints();
    const cutoffTime = Date.now() - maxAge;
    let deletedCount = 0;

    for (const checkpoint of checkpoints) {
      if (checkpoint.timestamp.getTime() < cutoffTime) {
        const deleted = await this.deleteCheckpoint(checkpoint.id);
        if (deleted) {
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  /**
   * Get checkpoint statistics
   */
  async getStats(): Promise<{
    totalCheckpoints: number;
    totalSize: number;
    oldestCheckpoint: Date | null;
    newestCheckpoint: Date | null;
  }> {
    const checkpoints = await this.listCheckpoints();
    
    if (checkpoints.length === 0) {
      return {
        totalCheckpoints: 0,
        totalSize: 0,
        oldestCheckpoint: null,
        newestCheckpoint: null
      };
    }

    const totalSize = checkpoints.reduce((sum, cp) => sum + cp.size, 0);
    const timestamps = checkpoints.map(cp => cp.timestamp);
    
    return {
      totalCheckpoints: checkpoints.length,
      totalSize,
      oldestCheckpoint: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      newestCheckpoint: new Date(Math.max(...timestamps.map(t => t.getTime())))
    };
  }

  /**
   * Check if a checkpoint exists
   */
  async hasCheckpoint(id: string): Promise<boolean> {
    try {
      const filePath = path.join(this.checkpointsDir, `${id}.json`);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Ensure checkpoints directory exists
   */
  private async ensureCheckpointsDir(): Promise<void> {
    try {
      await fs.mkdir(this.checkpointsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }
}