/**
 * System health checker to validate that all critical components are working
 */

// import { parseError, logError } from '../../local/utils/error-handling" // File doesn't exist
import { queryClient } from "../api/queryClient"

// Fallback error handling functions
const parseError = (error: any) => error?.message || String(error);
const logError = (error: any) => console.error(error);

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'error';
  checks: HealthCheck[];
  timestamp: string;
}

/**
 * Check if React Query is properly configured
 */
async function checkReactQuery(): Promise<HealthCheck> {
  try {
    const cache = queryClient.getQueryCache();
    const mutations = queryClient.getMutationCache();
    
    return {
      name: 'React Query',
      status: 'healthy',
      message: 'React Query is properly configured',
      details: {
        queryCacheSize: cache.getAll().length,
        mutationCacheSize: mutations.getAll().length
      }
    };
  } catch (error) {
    return {
      name: 'React Query',
      status: 'error',
      message: 'React Query configuration error',
      details: parseError(error)
    };
  }
}

/**
 * Check if API endpoints are accessible
 */
async function checkAPIHealth(): Promise<HealthCheck> {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        name: 'API Health',
        status: 'healthy',
        message: 'API is responding normally',
        details: data
      };
    } else {
      return {
        name: 'API Health',
        status: 'warning',
        message: `API returned status ${response.status}`,
        details: { status: response.status, statusText: response.statusText }
      };
    }
  } catch (error) {
    return {
      name: 'API Health',
      status: 'error',
      message: 'Cannot connect to API',
      details: parseError(error)
    };
  }
}

/**
 * Check if essential images are accessible
 */
async function checkImageAssets(): Promise<HealthCheck> {
  const essentialImages = [
    '/placeholder-property.jpg',
    '/placeholder-image.jpg',
    '/assets/hero-bg.jpg'
  ];
  
  const results = await Promise.allSettled(
    essentialImages.map(async (src) => {
      const response = await fetch(src, { method: 'HEAD' });
      return { src, ok: response.ok, status: response.status };
    })
  );
  
  const failed = results
    .map((result, index) => ({
      src: essentialImages[index],
      result: result.status === 'fulfilled' ? result.value : { ok: false, error: result.reason }
    }))
    .filter(({ result }) => !result.ok);
  
  if (failed.length === 0) {
    return {
      name: 'Image Assets',
      status: 'healthy',
      message: 'All essential images are accessible'
    };
  } else if (failed.length < essentialImages.length) {
    return {
      name: 'Image Assets',
      status: 'warning',
      message: `${failed.length} of ${essentialImages.length} images are missing`,
      details: failed
    };
  } else {
    return {
      name: 'Image Assets',
      status: 'error',
      message: 'Critical images are missing',
      details: failed
    };
  }
}

/**
 * Check if local storage is working
 */
function checkLocalStorage(): HealthCheck {
  try {
    const testKey = '__health_check__';
    const testValue = 'test';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved === testValue) {
      return {
        name: 'Local Storage',
        status: 'healthy',
        message: 'Local storage is working properly'
      };
    } else {
      return {
        name: 'Local Storage',
        status: 'error',
        message: 'Local storage read/write failed'
      };
    }
  } catch (error) {
    return {
      name: 'Local Storage',
      status: 'error',
      message: 'Local storage is not available',
      details: parseError(error)
    };
  }
}

/**
 * Check if session storage is working
 */
function checkSessionStorage(): HealthCheck {
  try {
    const testKey = '__health_check__';
    const testValue = 'test';
    
    sessionStorage.setItem(testKey, testValue);
    const retrieved = sessionStorage.getItem(testKey);
    sessionStorage.removeItem(testKey);
    
    if (retrieved === testValue) {
      return {
        name: 'Session Storage',
        status: 'healthy',
        message: 'Session storage is working properly'
      };
    } else {
      return {
        name: 'Session Storage',
        status: 'error',
        message: 'Session storage read/write failed'
      };
    }
  } catch (error) {
    return {
      name: 'Session Storage',
      status: 'error',
      message: 'Session storage is not available',
      details: parseError(error)
    };
  }
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility(): HealthCheck {
  const requiredFeatures = {
    'Fetch API': typeof fetch !== 'undefined',
    'Promise': typeof Promise !== 'undefined',
    'Local Storage': typeof localStorage !== 'undefined',
    'Session Storage': typeof sessionStorage !== 'undefined',
    'JSON': typeof JSON !== 'undefined',
    'URLSearchParams': typeof URLSearchParams !== 'undefined'
  };
  
  const unsupported = Object.entries(requiredFeatures)
    .filter(([, supported]) => !supported)
    .map(([feature]) => feature);
  
  if (unsupported.length === 0) {
    return {
      name: 'Browser Compatibility',
      status: 'healthy',
      message: 'All required browser features are supported'
    };
  } else {
    return {
      name: 'Browser Compatibility',
      status: 'error',
      message: `Unsupported features: ${unsupported.join(', ')}`,
      details: { unsupported, required: Object.keys(requiredFeatures) }
    };
  }
}

/**
 * Run all health checks
 */
export async function runSystemHealthCheck(): Promise<SystemHealth> {
  const checks: HealthCheck[] = [];
  
  // Run synchronous checks
  checks.push(checkBrowserCompatibility());
  checks.push(checkLocalStorage());
  checks.push(checkSessionStorage());
  checks.push(await checkReactQuery());
  
  // Run asynchronous checks
  const asyncChecks = await Promise.allSettled([
    checkAPIHealth(),
    checkImageAssets()
  ]);
  
  asyncChecks.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      checks.push(result.value);
    } else {
      const checkNames = ['API Health', 'Image Assets'];
      checks.push({
        name: checkNames[index],
        status: 'error',
        message: 'Health check failed to run',
        details: parseError(result.reason)
      });
    }
  });
  
  // Determine overall health
  const hasError = checks.some(check => check.status === 'error');
  const hasWarning = checks.some(check => check.status === 'warning');
  
  let overall: 'healthy' | 'warning' | 'error';
  if (hasError) {
    overall = 'error';
  } else if (hasWarning) {
    overall = 'warning';
  } else {
    overall = 'healthy';
  }
  
  const systemHealth: SystemHealth = {
    overall,
    checks,
    timestamp: new Date().toISOString()
  };
  
  // Log the results (only in development or for critical errors)
  if (overall === 'error') {
    if (process.env.NODE_ENV === 'development') {
      logError({
        message: 'System health check failed',
        details: systemHealth
      });
    }
  } else if (overall === 'warning' && process.env.NODE_ENV === 'development') {
    console.warn('System health check has warnings:', systemHealth);
  } else if (process.env.NODE_ENV === 'development') {
    console.log('System health check passed:', systemHealth);
  }
  
  return systemHealth;
}

/**
 * Quick health check for critical systems only
 */
export async function quickHealthCheck(): Promise<boolean> {
  try {
    const criticalChecks = [
      checkBrowserCompatibility(),
      await checkReactQuery()
    ];
    
    return criticalChecks.every(check => check.status !== 'error');
  } catch (error) {
    logError(parseError(error));
    return false;
  }
}

/**
 * Initialize system health monitoring
 */
export function initializeHealthMonitoring() {
  // Run initial health check (only log critical errors in production)
  runSystemHealthCheck().then(health => {
    if (health.overall === 'error') {
      if (import.meta.env.MODE === 'development') {
        console.warn('🚨 System health check failed! Some features may not work properly.');
      }
    } else if (health.overall === 'warning' && import.meta.env.MODE === 'development') {
      console.info('⚠️ System health check has warnings. Some features may be degraded.');
    } else if (import.meta.env.MODE === 'development') {
      console.info('✅ System health check passed. All systems operational.');
    }
  }).catch(error => {
    if (import.meta.env.MODE === 'development') {
      console.info('Health check initialization failed:', error);
    }
  });
  
  // Set up periodic health checks (every 5 minutes)
  if (typeof window !== 'undefined') {
    setInterval(() => {
      quickHealthCheck().then(isHealthy => {
        if (!isHealthy && process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Quick health check failed. Running full health check...');
          runSystemHealthCheck();
        }
      }).catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Periodic health check failed:', error);
        }
      });
    }, 5 * 60 * 1000);
  }
}