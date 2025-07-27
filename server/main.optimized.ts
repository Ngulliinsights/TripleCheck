/**
 * Performance-Optimized Development Server
 * Addresses root causes of memory leaks and crashes
 */

import app from './app-optimized';
import { cleanupManager } from './utils/cleanup-manager';

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Enable garbage collection if available
if (typeof global.gc === 'function') {
  // Run GC every 30 seconds in development
  const gcInterval = cleanupManager.createInterval(() => {
    global.gc();
    console.log('🗑️  Garbage collection completed');
  }, 30000);
} else {
  console.log('💡 Garbage collection not available. Start with: npm run dev:gc');
}

async function startOptimizedServer(): Promise<void> {
  try {
    console.log('🚀 Starting optimized server...');
    console.log(`📊 Initial memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🧠 Memory monitor: http://localhost:${PORT}/api/memory`);
      console.log(`🔧 Mode: Optimized Development`);
      
      if (global.gc) {
        console.log(`🗑️  Garbage collection: Enabled (every 30s)`);
        console.log(`💡 Tip: Use POST /api/gc to trigger manual GC`);
      } else {
        console.log(`💡 Tip: Start with --expose-gc for manual garbage collection`);
      }
    });

    // Configure server for better performance
    server.keepAliveTimeout = 5000;  // Shorter timeout for development
    server.headersTimeout = 6000;
    server.maxConnections = 100;     // Limit concurrent connections

    // Register server cleanup
    cleanupManager.register('optimized-server', () => {
      server.close();
    });

    // Monitor memory usage
    const memoryInterval = cleanupManager.createInterval(() => {
      const usage = process.memoryUsage();
      const heapUsed = Math.round(usage.heapUsed / 1024 / 1024);
      
      if (heapUsed > 100) { // Alert if memory usage > 100MB
        console.log(`⚠️  High memory usage: ${heapUsed} MB`);
      }
    }, 10000); // Check every 10 seconds

    console.log('✅ Optimized server started successfully');

  } catch (error) {
    console.error('❌ Failed to start optimized server:', error);
    await cleanupManager.cleanup();
    process.exit(1);
  }
}

startOptimizedServer();