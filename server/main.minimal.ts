#!/usr/bin/env tsx

/**
 * Minimal server startup for debugging
 * This bypasses complex initialization to identify core issues
 */

import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'TripleCheck API is running',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('dist/client'));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist/client/index.html'));
  });
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API status: http://localhost:${PORT}/api/status`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;