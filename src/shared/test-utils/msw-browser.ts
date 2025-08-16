import { setupWorker } from 'msw/browser';
import { handlers } from './api-handlers';

// Create MSW worker for browser environment
export const worker = setupWorker(...handlers);

// Start worker in development mode
export async function startMswWorker() {
  if (import.meta.env.DEV) {
    try {
      await worker.start({
        onUnhandledRequest: 'bypass',
        quiet: false,
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
      console.log('🔧 MSW worker started for development');
      console.log('🔧 Mock API endpoints available:');
      console.log('  - GET /api/properties');
      console.log('  - GET /api/properties/:id');
      console.log('  - POST /api/properties');
    } catch (error) {
      console.warn('Failed to start MSW worker:', error);
    }
  }
}