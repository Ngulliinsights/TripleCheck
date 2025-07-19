import app from './app';
import { initializeDatabase } from './infrastructure/database/connection';
import { logger } from './infrastructure/monitoring/logging.service';

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Initialize logging
    logger.info('Starting server...');
    
    // Initialize database connection
    await initializeDatabase();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();