import React from 'react';

// Service Worker registration and management
export interface ServiceWorkerConfig {
  swUrl: string;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig;

  constructor(config: ServiceWorkerConfig) {
    this.config = config;
  }

  // Register service worker
  public async register(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register(this.config.swUrl);
      
      console.log('Service Worker registered:', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const installingWorker = this.registration!.installing;
        
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content available
                console.log('New content available, please refresh');
                this.config.onUpdate?.(this.registration!);
              } else {
                // Content cached for offline use
                console.log('Content cached for offline use');
                this.config.onSuccess?.(this.registration!);
              }
            }
          });
        }
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      this.config.onError?.(error as Error);
      return null;
    }
  }

  // Unregister service worker
  public async unregister(): Promise<boolean> {
    if (this.registration) {
      const result = await this.registration.unregister();
      console.log('Service Worker unregistered:', result);
      return result;
    }
    return false;
  }

  // Check for updates
  public async checkForUpdates(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  // Skip waiting and activate new service worker
  public async skipWaiting(): Promise<void> {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Get registration status
  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  // Check if service worker is active
  public isActive(): boolean {
    return !!(this.registration && this.registration.active);
  }
}

// Default configuration
const defaultConfig: ServiceWorkerConfig = {
  swUrl: '/sw.js',
  onUpdate: (registration) => {
    // Show update notification
    if (window.confirm('New version available! Click OK to update.')) {
      window.location.reload();
    }
  },
  onSuccess: (registration) => {
    console.log('App is ready for offline use');
  },
  onError: (error) => {
    console.error('Service Worker error:', error);
  },
};

// Singleton service worker manager
export const serviceWorkerManager = new ServiceWorkerManager(defaultConfig);

// React hook for service worker
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = React.useState(false);
  const [registration, setRegistration] = React.useState<ServiceWorkerRegistration | null>(null);

  React.useEffect(() => {
    const config: ServiceWorkerConfig = {
      ...defaultConfig,
      onSuccess: (reg) => {
        setIsRegistered(true);
        setRegistration(reg);
        defaultConfig.onSuccess?.(reg);
      },
      onUpdate: (reg) => {
        setIsUpdateAvailable(true);
        setRegistration(reg);
        defaultConfig.onUpdate?.(reg);
      },
      onError: (error) => {
        setIsRegistered(false);
        defaultConfig.onError?.(error);
      },
    };

    const manager = new ServiceWorkerManager(config);
    manager.register();

    return () => {
      // Cleanup if needed
    };
  }, []);

  const updateApp = React.useCallback(() => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  const checkForUpdates = React.useCallback(async () => {
    if (registration) {
      await registration.update();
    }
  }, [registration]);

  return {
    isRegistered,
    isUpdateAvailable,
    updateApp,
    checkForUpdates,
  };
}

// Offline storage utilities
export const offlineStorage = {
  // Store action for background sync
  storeOfflineAction: async (action: {
    id: string;
    url: string;
    method: string;
    body?: any;
    headers?: Record<string, string>;
  }) => {
    if ('indexedDB' in window) {
      // Store in IndexedDB for background sync
      // Implementation would use IndexedDB
      console.log('Storing offline action:', action);
    }
  },

  // Get stored offline actions
  getOfflineActions: async () => {
    if ('indexedDB' in window) {
      // Retrieve from IndexedDB
      // Implementation would use IndexedDB
      return [];
    }
    return [];
  },

  // Clear offline actions
  clearOfflineActions: async () => {
    if ('indexedDB' in window) {
      // Clear IndexedDB
      // Implementation would use IndexedDB
      console.log('Clearing offline actions');
    }
  },
};

// Network status utilities
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}