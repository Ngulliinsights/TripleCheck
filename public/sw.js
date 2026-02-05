// Enhanced Service Worker for offline support and advanced image caching
const CACHE_NAME = 'triplecheck-v2';
const STATIC_CACHE = 'triplecheck-static-v2';
const DYNAMIC_CACHE = 'triplecheck-dynamic-v2';
const IMAGE_CACHE = 'triplecheck-images-v2';
const API_CACHE = 'triplecheck-api-v2';

// Cache size limits
const CACHE_LIMITS = {
  images: 50, // Maximum number of images to cache
  api: 100,   // Maximum number of API responses to cache
  dynamic: 200, // Maximum number of dynamic resources
};

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  // Add other critical assets
];

// API endpoints to cache
const CACHEABLE_APIS = [
  '/api/properties',
  '/api/users',
  '/api/trust',
  '/api/analytics',
  '/api/search',
];

// Image optimization settings
const IMAGE_FORMATS = {
  webp: 'image/webp',
  avif: 'image/avif',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  images: 7 * 24 * 60 * 60 * 1000, // 7 days
  api: 60 * 60 * 1000, // 1 hour
  static: 30 * 24 * 60 * 60 * 1000, // 30 days
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE].includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Initialize cache management
      initializeCacheManagement(),
      // Claim clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - Network First with fallback to cache
    event.respondWith(networkFirstStrategy(request));
  } else if (request.destination === 'image') {
    // Images - Cache First
    event.respondWith(cacheFirstStrategy(request));
  } else if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    // Static assets - Stale While Revalidate
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // HTML pages - Network First with offline fallback
    event.respondWith(networkFirstWithOfflineFallback(request));
  }
});

// Network First Strategy (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature is not available offline',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Advanced Image Caching Strategy with optimization
async function cacheFirstStrategy(request) {
  const url = new URL(request.url);
  
  // Check for cached image first
  const cachedResponse = await getCachedImage(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Try to fetch optimized image format
    const optimizedResponse = await fetchOptimizedImage(request);
    
    if (optimizedResponse && optimizedResponse.ok) {
      // Cache the optimized image
      await cacheImage(request, optimizedResponse.clone());
      return optimizedResponse;
    }
    
    // Fallback to original request
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cacheImage(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Image fetch failed:', request.url, error);
    
    // Return optimized placeholder based on requested image type
    return createImagePlaceholder(request);
  }
}

// Get cached image with format preference
async function getCachedImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Try to find cached version
  let cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cached image is still fresh
    const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
    const now = new Date();
    
    if (now - cachedDate > CACHE_EXPIRATION.images) {
      // Image is stale, remove from cache
      await cache.delete(request);
      return null;
    }
    
    return cachedResponse;
  }
  
  return null;
}

// Fetch optimized image format (WebP/AVIF)
async function fetchOptimizedImage(request) {
  const url = new URL(request.url);
  const acceptHeader = request.headers.get('accept') || '';
  
  // Check if browser supports modern formats
  const supportsAvif = acceptHeader.includes('image/avif');
  const supportsWebp = acceptHeader.includes('image/webp');
  
  // Try to get optimized version from server
  if (supportsAvif || supportsWebp) {
    const optimizedUrl = new URL(url);
    
    // Add format parameter if server supports it
    if (supportsAvif) {
      optimizedUrl.searchParams.set('format', 'avif');
    } else if (supportsWebp) {
      optimizedUrl.searchParams.set('format', 'webp');
    }
    
    try {
      const optimizedRequest = new Request(optimizedUrl.toString(), {
        headers: request.headers,
        mode: request.mode,
        credentials: request.credentials,
      });
      
      return await fetch(optimizedRequest);
    } catch (error) {
      console.log('Failed to fetch optimized image:', error);
      return null;
    }
  }
  
  return null;
}

// Cache image with size management
async function cacheImage(request, response) {
  const cache = await caches.open(IMAGE_CACHE);
  
  // Check cache size and clean if necessary
  await manageCacheSize(IMAGE_CACHE, CACHE_LIMITS.images);
  
  // Add metadata headers
  const responseWithMetadata = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cached-date': new Date().toISOString(),
      'sw-cache-type': 'image',
    },
  });
  
  await cache.put(request, responseWithMetadata);
  console.log('Cached image:', request.url);
}

// Create optimized placeholder for offline images
function createImagePlaceholder(request) {
  const url = new URL(request.url);
  const filename = url.pathname.split('/').pop() || 'image';
  
  // Create SVG placeholder with image info
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
      <circle cx="200" cy="120" r="30" fill="#6c757d"/>
      <path d="M170 120 L200 90 L230 120 L200 150 Z" fill="#fff"/>
      <text x="200" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#6c757d">
        Image unavailable offline
      </text>
      <text x="200" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#adb5bd">
        ${filename}
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache',
    },
  });
}

// Stale While Revalidate Strategy (for static assets)
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });
  
  return cachedResponse || networkResponsePromise;
}

// Network First with Offline Fallback (for HTML pages)
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline.html') || new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - TripleCheck</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline-message { max-width: 400px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="offline-message">
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sync any pending offline actions
    const pendingActions = await getStoredActions();
    
    for (const action of pendingActions) {
      try {
        await fetch(action.url, action.options);
        await removeStoredAction(action.id);
      } catch (error) {
        console.error('Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Cache management functions
async function initializeCacheManagement() {
  console.log('Initializing cache management...');
  
  // Clean up expired entries on startup
  await cleanExpiredCacheEntries();
  
  // Set up periodic cache cleanup
  setInterval(cleanExpiredCacheEntries, 60 * 60 * 1000); // Every hour
}

async function manageCacheSize(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length >= maxEntries) {
    // Remove oldest entries (FIFO)
    const entriesToRemove = keys.length - maxEntries + 1;
    
    for (let i = 0; i < entriesToRemove; i++) {
      await cache.delete(keys[i]);
    }
    
    console.log(`Cleaned ${entriesToRemove} entries from ${cacheName}`);
  }
}

async function cleanExpiredCacheEntries() {
  const cacheNames = [IMAGE_CACHE, API_CACHE, DYNAMIC_CACHE];
  
  for (const cacheName of cacheNames) {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const cachedDate = new Date(response.headers.get('sw-cached-date') || response.headers.get('date') || 0);
          const now = new Date();
          const cacheType = response.headers.get('sw-cache-type') || 'dynamic';
          
          let maxAge = CACHE_EXPIRATION.dynamic;
          if (cacheType === 'image') maxAge = CACHE_EXPIRATION.images;
          if (cacheType === 'api') maxAge = CACHE_EXPIRATION.api;
          
          if (now - cachedDate > maxAge) {
            await cache.delete(request);
            console.log(`Removed expired entry: ${request.url}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error cleaning cache ${cacheName}:`, error);
    }
  }
}

// Enhanced API caching with expiration
async function cacheApiResponse(request, response) {
  const cache = await caches.open(API_CACHE);
  
  // Check cache size and clean if necessary
  await manageCacheSize(API_CACHE, CACHE_LIMITS.api);
  
  // Add metadata headers
  const responseWithMetadata = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cached-date': new Date().toISOString(),
      'sw-cache-type': 'api',
    },
  });
  
  await cache.put(request, responseWithMetadata);
  console.log('Cached API response:', request.url);
}

// Helper functions for storing offline actions
async function getStoredActions() {
  // Implementation would use IndexedDB or similar
  return [];
}

async function removeStoredAction(id) {
  // Implementation would remove from IndexedDB
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/favicon.ico',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('TripleCheck', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});