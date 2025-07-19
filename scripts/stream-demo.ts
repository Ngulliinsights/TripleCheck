#!/usr/bin/env tsx

import { StreamingJSONProcessor } from './streaming-json-processor';
import path from 'path';
import readline from 'readline';

// Interactive demo of the streaming processor
class StreamingDemo {
  private processor: StreamingJSONProcessor;
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.processor = new StreamingJSONProcessor({
      batchSize: 10,
      checkpointInterval: 50,
      resumeFromCheckpoint: false,
      
      onProgress: (stats) => {
        this.displayProgress(stats);
      },
      
      onRecord: async (record, index) => {
        // Simple record transformation
        return {
          ...record,
          processed: true,
          processedAt: new Date().toISOString(),
          index
        };
      },
      
      onBatch: async (batch, startIndex) => {
        console.log(`\n📦 Processing batch starting at index ${startIndex} (${batch.length} records)`);
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Log some sample data
        if (batch.length > 0) {
          const sample = batch[0];
          console.log(`   Sample: ${sample.title || sample.id || 'Unknown'}`);
        }
      },
      
      onError: (error, record, index) => {
        console.error(`❌ Error at record ${index}:`, error.message);
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.processor.on('start', () => {
      console.log('🚀 Processing started');
      console.log('Commands: [p]ause, [r]esume, [s]top, [q]uit');
    });

    this.processor.on('paused', () => {
      console.log('\n⏸️  Processing paused - checkpoint saved');
    });

    this.processor.on('resumed', () => {
      console.log('\n▶️  Processing resumed');
    });

    this.processor.on('complete', (stats) => {
      console.log('\n🎉 Processing complete!');
      this.displayFinalStats(stats);
      this.rl.close();
    });

    this.processor.on('stopped', () => {
      console.log('\n🛑 Processing stopped');
      this.rl.close();
    });
  }

  private displayProgress(stats: any) {
    // Clear previous progress (simple version)
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    
    const rate = stats.processingRate.toFixed(1);
    const progress = `📊 ${stats.processedRecords} processed | ⚡ ${rate}/sec | ❌ ${stats.errorRecords} errors`;
    
    process.stdout.write(progress);
  }

  private displayFinalStats(stats: any) {
    console.log('\n' + '═'.repeat(50));
    console.log('📈 Final Statistics:');
    console.log(`   Total Processed: ${stats.processedRecords.toLocaleString()}`);
    console.log(`   Errors: ${stats.errorRecords}`);
    console.log(`   Skipped: ${stats.skippedRecords}`);
    console.log(`   Batches: ${stats.currentBatch}`);
    console.log(`   Average Rate: ${stats.processingRate.toFixed(2)} records/sec`);
    
    const totalTime = (Date.now() - stats.startTime.getTime()) / 1000;
    console.log(`   Total Time: ${totalTime.toFixed(2)} seconds`);
  }

  async start() {
    const datasetPath = path.join(__dirname, 'data-generation', 'fraudulent_property_dataset.json');
    
    console.log('🔄 Streaming JSON Processor Demo');
    console.log('═'.repeat(40));
    console.log(`📁 File: ${path.basename(datasetPath)}`);
    
    // Set up command handling
    this.rl.on('line', (input) => {
      const command = input.trim().toLowerCase();
      
      switch (command) {
        case 'p':
        case 'pause':
          this.processor.pause();
          break;
        case 'r':
        case 'resume':
          this.processor.resume();
          break;
        case 's':
        case 'stop':
          this.processor.stop();
          break;
        case 'q':
        case 'quit':
          this.processor.stop();
          break;
        case 'stats':
          console.log('\n📊 Current Stats:', this.processor.getStats());
          break;
        default:
          console.log('\nCommands: [p]ause, [r]esume, [s]top, [q]uit, [stats]');
      }
    });

    try {
      await this.processor.processFile(datasetPath);
    } catch (error) {
      console.error('\n💥 Processing failed:', error);
    }
  }
}

// Performance test utility
async function performanceTest() {
  console.log('🏃‍♂️ Performance Test Mode');
  
  const processor = new StreamingJSONProcessor({
    batchSize: 100,
    checkpointInterval: 1000,
    
    onRecord: (record, index) => {
      // Minimal processing for speed test
      return { ...record, index, processed: true };
    },
    
    onBatch: async (batch) => {
      // Simulate database insertion
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  });

  const startTime = Date.now();
  const datasetPath = path.join(__dirname, 'data-generation', 'fraudulent_property_dataset.json');
  
  try {
    const stats = await processor.processFile(datasetPath);
    const totalTime = (Date.now() - startTime) / 1000;
    
    console.log('\n🏁 Performance Results:');
    console.log(`   Records: ${stats.processedRecords.toLocaleString()}`);
    console.log(`   Time: ${totalTime.toFixed(2)}s`);
    console.log(`   Rate: ${(stats.processedRecords / totalTime).toFixed(2)} records/sec`);
    console.log(`   Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('Performance test failed:', error);
  }
}

// CLI interface - ES module compatible
const isMainModule = import.meta.url === new URL(process.argv[1], 'file:').href;
if (isMainModule) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
🔧 Streaming JSON Processor Demo

Usage:
  tsx scripts/stream-demo.ts              # Interactive demo
  tsx scripts/stream-demo.ts --perf       # Performance test
  tsx scripts/stream-demo.ts --help       # Show this help

Interactive Commands:
  p, pause     - Pause processing
  r, resume    - Resume processing  
  s, stop      - Stop processing
  q, quit      - Quit application
  stats        - Show current statistics

Features:
  ✅ Memory-efficient streaming (handles GB+ files)
  ✅ Real-time progress tracking
  ✅ Pause/resume with checkpoints
  ✅ Error handling and recovery
  ✅ Batch processing
  ✅ Interactive controls
    `);
    process.exit(0);
  }
  
  if (args.includes('--perf')) {
    performanceTest().catch(console.error);
  } else {
    const demo = new StreamingDemo();
    demo.start().catch(console.error);
  }
}

export { StreamingDemo };