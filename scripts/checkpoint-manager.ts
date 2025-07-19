#!/usr/bin/env tsx
/**
 * Checkpoint Manager for Robust Data Loader
 * 
 * Utilities to:
 * - List available checkpoints
 * - Resume from specific checkpoints
 * - Clean up old checkpoints
 * - Analyze processing logs
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHECKPOINT_DIR = path.join(__dirname, 'checkpoints');
const LOG_DIR = path.join(__dirname, 'logs');

interface ProcessingCheckpoint {
  timestamp: string;
  operation: 'users' | 'properties' | 'reviews';
  totalRecords: number;
  processedChunks: number;
  processedRecords: number;
  failedChunks: number[];
  lastSuccessfulChunk: number;
  userIdMapping?: Record<string, number>;
  propertyIdMapping?: Record<string, number>;
  errors: any[];
}

class CheckpointManager {
  
  /**
   * List all available checkpoints
   */
  async listCheckpoints(): Promise<void> {
    try {
      await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
      const files = await fs.readdir(CHECKPOINT_DIR);
      const checkpointFiles = files.filter(f => f.endsWith('.json'));
      
      if (checkpointFiles.length === 0) {
        console.log('📋 No checkpoints found');
        return;
      }

      console.log('📋 Available Checkpoints:');
      console.log('========================');
      
      const checkpoints: Array<{
        file: string;
        sessionId: string;
        operation: string;
        data: ProcessingCheckpoint;
      }> = [];

      for (const file of checkpointFiles) {
        try {
          const filePath = path.join(CHECKPOINT_DIR, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const checkpoint = JSON.parse(content) as ProcessingCheckpoint;
          
          const [sessionId, operation] = file.replace('.json', '').split('_').slice(-2);
          
          checkpoints.push({
            file,
            sessionId: sessionId || 'unknown',
            operation: operation || 'unknown',
            data: checkpoint
          });
        } catch (error) {
          console.log(`⚠️  Failed to read checkpoint ${file}: ${error.message}`);
        }
      }

      // Group by session
      const sessionGroups = checkpoints.reduce((groups, cp) => {
        if (!groups[cp.sessionId]) {
          groups[cp.sessionId] = [];
        }
        groups[cp.sessionId].push(cp);
        return groups;
      }, {} as Record<string, typeof checkpoints>);

      Object.entries(sessionGroups).forEach(([sessionId, sessionCheckpoints]) => {
        console.log(`\n🔄 Session: ${sessionId}`);
        console.log(`   Created: ${sessionCheckpoints[0]?.data.timestamp}`);
        
        sessionCheckpoints.forEach(cp => {
          const progress = Math.round((cp.data.processedRecords / cp.data.totalRecords) * 100);
          console.log(`   📊 ${cp.operation}: ${cp.data.processedRecords}/${cp.data.totalRecords} (${progress}%)`);
          
          if (cp.data.failedChunks.length > 0) {
            console.log(`      ❌ Failed chunks: ${cp.data.failedChunks.length}`);
          }
          
          if (cp.data.errors.length > 0) {
            console.log(`      ⚠️  Errors: ${cp.data.errors.length}`);
          }
        });
      });

    } catch (error) {
      console.error('❌ Failed to list checkpoints:', error.message);
    }
  }

  /**
   * Clean up old checkpoints
   */
  async cleanupCheckpoints(olderThanDays: number = 7): Promise<void> {
    try {
      await fs.mkdir(CHECKPOINT_DIR, { recursive: true });
      const files = await fs.readdir(CHECKPOINT_DIR);
      const checkpointFiles = files.filter(f => f.endsWith('.json'));
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      
      let cleanedCount = 0;
      
      for (const file of checkpointFiles) {
        try {
          const filePath = path.join(CHECKPOINT_DIR, file);
          const stats = await fs.stat(filePath);
          
          if (stats.mtime < cutoffDate) {
            await fs.unlink(filePath);
            cleanedCount++;
            console.log(`🗑️  Removed old checkpoint: ${file}`);
          }
        } catch (error) {
          console.log(`⚠️  Failed to process checkpoint ${file}: ${error.message}`);
        }
      }
      
      console.log(`✅ Cleanup completed. Removed ${cleanedCount} old checkpoints.`);
      
    } catch (error) {
      console.error('❌ Failed to cleanup checkpoints:', error.message);
    }
  }

  /**
   * Analyze processing logs
   */
  async analyzeLogs(sessionId?: string): Promise<void> {
    try {
      await fs.mkdir(LOG_DIR, { recursive: true });
      const files = await fs.readdir(LOG_DIR);
      let logFiles = files.filter(f => f.startsWith('data_loader_') && f.endsWith('.log'));
      
      if (sessionId) {
        logFiles = logFiles.filter(f => f.includes(sessionId));
      }
      
      if (logFiles.length === 0) {
        console.log('📋 No log files found');
        return;
      }

      console.log('📊 Log Analysis:');
      console.log('================');
      
      for (const logFile of logFiles) {
        console.log(`\n📄 Log: ${logFile}`);
        
        try {
          const filePath = path.join(LOG_DIR, logFile);
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.trim().split('\n').filter(line => line.trim());
          
          const logEntries = lines.map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          }).filter(entry => entry !== null);
          
          const stats = {
            total: logEntries.length,
            info: logEntries.filter(e => e.level === 'INFO').length,
            warn: logEntries.filter(e => e.level === 'WARN').length,
            error: logEntries.filter(e => e.level === 'ERROR').length,
            debug: logEntries.filter(e => e.level === 'DEBUG').length
          };
          
          console.log(`   📊 Total entries: ${stats.total}`);
          console.log(`   ℹ️  Info: ${stats.info}`);
          console.log(`   ⚠️  Warnings: ${stats.warn}`);
          console.log(`   ❌ Errors: ${stats.error}`);
          console.log(`   🐛 Debug: ${stats.debug}`);
          
          // Show recent errors
          const errors = logEntries.filter(e => e.level === 'ERROR').slice(-5);
          if (errors.length > 0) {
            console.log(`   \n🔍 Recent Errors:`);
            errors.forEach(error => {
              console.log(`      ${error.timestamp}: ${error.message}`);
              if (error.data?.error) {
                console.log(`         Details: ${error.data.error}`);
              }
            });
          }
          
        } catch (error) {
          console.log(`   ⚠️  Failed to analyze log: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to analyze logs:', error.message);
    }
  }

  /**
   * Show recovery options
   */
  async showRecoveryOptions(): Promise<void> {
    console.log('🔧 Recovery Options:');
    console.log('====================');
    console.log('');
    console.log('1. Resume from checkpoint:');
    console.log('   npx tsx scripts/robust-data-loader.ts');
    console.log('   (Automatically detects and resumes from latest checkpoint)');
    console.log('');
    console.log('2. Start fresh (clears checkpoints):');
    console.log('   npx tsx scripts/checkpoint-manager.ts cleanup');
    console.log('   npx tsx scripts/robust-data-loader.ts');
    console.log('');
    console.log('3. Analyze what went wrong:');
    console.log('   npx tsx scripts/checkpoint-manager.ts analyze');
    console.log('');
    console.log('4. List current progress:');
    console.log('   npx tsx scripts/checkpoint-manager.ts list');
    console.log('');
  }
}

/**
 * CLI interface
 */
async function main() {
  const manager = new CheckpointManager();
  const command = process.argv[2];
  
  switch (command) {
    case 'list':
      await manager.listCheckpoints();
      break;
      
    case 'cleanup':
      const days = parseInt(process.argv[3]) || 7;
      await manager.cleanupCheckpoints(days);
      break;
      
    case 'analyze':
      const sessionId = process.argv[3];
      await manager.analyzeLogs(sessionId);
      break;
      
    case 'help':
    case '--help':
    case '-h':
      await manager.showRecoveryOptions();
      break;
      
    default:
      console.log('🔧 Checkpoint Manager');
      console.log('=====================');
      console.log('');
      console.log('Usage:');
      console.log('  npx tsx scripts/checkpoint-manager.ts <command>');
      console.log('');
      console.log('Commands:');
      console.log('  list                    - List all checkpoints');
      console.log('  cleanup [days]          - Clean up checkpoints older than N days (default: 7)');
      console.log('  analyze [sessionId]     - Analyze processing logs');
      console.log('  help                    - Show recovery options');
      console.log('');
      await manager.listCheckpoints();
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { CheckpointManager };