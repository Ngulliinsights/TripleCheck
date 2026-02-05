import path from './app';
import { fileURLToPath } from 'url';

import express from './app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, '../dist/public')));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(__dirname, '../dist/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Simple dev server running on http://localhost:${PORT}`);
  console.log('📁 Serving files from dist/public');
  console.log('🔄 SPA routing enabled');
});