import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Simple server working!', timestamp: new Date().toISOString() });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'dist/public')));

// SPA fallback
app.get('*', (req, res) => {
  console.log('Request for:', req.path);
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API not found' });
  }
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple test server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

server.on('close', () => {
  console.log('🔴 Server closed');
});