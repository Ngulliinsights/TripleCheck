# Route Preloading Optimization System

A comprehensive route preloading system that implements multiple loading strategies to optimize application performance through intelligent code splitting and predictive loading.

## Overview

The route preloading system provides:

- **Multiple Preloading Strategies**: Immediate, hover, idle, on-demand, and viewport-based loading
- **Domain-Driven Code Splitting**: Aligned with the application's domain architecture
- **Performance Monitoring**: Real-time metrics and analytics for route loading performance
- **Intelligent Caching**: Prevents duplicate loads and tracks cache hit rates
- **Data Preloading**: Preloads API endpoints alongside route components

## Architecture

```
src/infrastructure/routing/
├── route-preloader.ts          # Core preloading engine
├── useRoutePreloader.ts        # React hooks for component integration
├── RoutePerformanceMonitor.tsx # Performance monitoring UI
├── index.ts                    # Public API exports
└── __tests__/                  # Test suite
```

## Preloading Strategies

### 1. Immediate Loading
Routes that are critical to the user experience are loaded immediately when the application starts.

```typescript
// Routes configured for immediate loading
{
  path: '/',
  strategy: 'immediate',
  priority: 'high'
}
```

**Use Cases:**
- Home page
- Authentication pages
- Core search functionality

### 2. Hover Preloading
Routes are preloaded when users hover over navigation links, providing instant navigation.

```typescript
// Automatically detects hover events on links
document.addEventListener('mouseover', (event) => {
  const link = event.target.closest('a[href]');
  if (link && shouldPreloadOnHover(link.href)) {
    preloadRoute(link.href, 'hover');
  }
});
```

**Use Cases:**
- Property detail pages
- Service pages
- Marketing pages

### 3. Idle Preloading
Routes are preloaded during browser idle time to avoid impacting user interactions.

```typescript
// Uses requestIdleCallback when available
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    preloadIdleRoutes();
  });
}
```

**Use Cases:**
- Dashboard pages
- Secondary features
- Help documentation

### 4. Viewport Preloading
Routes are preloaded when related elements come into the viewport.

```typescript
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const route = entry.target.dataset.preloadRoute;
      preloadRoute(route, 'viewport');
    }
  });
});
```

**Use Cases:**
- Content sections that link to specific pages
- Call-to-action buttons
- Feature showcases

### 5. On-Demand Loading
Traditional lazy loading - routes are loaded only when navigated to.

**Use Cases:**
- Rarely accessed pages
- Administrative interfaces
- Error pages

## Domain-Based Code Splitting

The system aligns with the application's domain-driven architecture:

```typescript
// Domain configurations
const domainConfigs = {
  property: {
    pages: ['PropertyDetails', 'PropertyCompare', 'ListProperty'],
    components: ['PropertyCard', 'TrustScore'],
    strategy: 'hover'
  },
  trust: {
    pages: ['BasicChecks', 'FraudDetection', 'DocumentAuth'],
    strategy: 'hover'
  },
  user: {
    pages: ['Dashboard', 'Team'],
    strategy: 'idle'
  }
};
```

This creates optimized chunks:
- `domain-property-pages.js` - Property page components
- `domain-trust-pages.js` - Trust service pages
- `domain-user-pages.js` - User management pages

## Usage

### Basic Integration

```typescript
import { useRoutePreloader } from '@/infrastructure/routing';

function App() {
  const { preloadRoute, isPreloaded } = useRoutePreloader({
    enableHoverPreloading: true,
    preloadOnMount: ['/features', '/pricing']
  });

  return (
    <Router>
      <Routes>
        {/* Routes automatically benefit from preloading */}
      </Routes>
    </Router>
  );
}
```

### Advanced Usage

```typescript
import { routePreloader, useSmartPreloading } from '@/infrastructure/routing';

function NavigationComponent() {
  const { preloadByUserBehavior } = useSmartPreloading();

  useEffect(() => {
    // Preload based on user context
    if (userIsOnPropertyPage) {
      preloadByUserBehavior(['/compare', '/properties']);
    }
  }, [userContext]);

  return (
    <nav>
      <Link 
        to="/property/123"
        onMouseEnter={() => routePreloader.preloadRoute('/property/123', 'hover')}
      >
        View Property
      </Link>
    </nav>
  );
}
```

### Performance Monitoring

```typescript
import { RoutePerformanceMonitor } from '@/infrastructure/routing';

function App() {
  return (
    <div>
      {/* Shows performance metrics in development */}
      <RoutePerformanceMonitor position="bottom-right" />
      
      <Router>
        {/* Your routes */}
      </Router>
    </div>
  );
}
```

## Configuration

### Route Configuration

```typescript
const routeConfig: RouteConfig = {
  path: '/property/:id',
  domain: 'property',
  component: 'PropertyDetails',
  strategy: 'hover',
  priority: 'high',
  dependencies: ['PropertyCard', 'TrustScore'], // Preload related components
  preloadData: true, // Preload API endpoints
  estimatedSize: 120 // KB - for performance budgeting
};
```

### Data Preloading

```typescript
// Automatically preloads API endpoints for routes
const dataEndpoints = {
  '/property/:id': ['/api/properties/:id', '/api/trust-scores/:id'],
  '/dashboard': ['/api/user/profile', '/api/user/properties']
};
```

## Performance Metrics

The system tracks comprehensive metrics:

### Preload Metrics
- **Total Preloads**: Number of preload attempts
- **Success Rate**: Percentage of successful preloads
- **Cache Hit Rate**: Percentage of preloads that were cache hits
- **Average Load Time**: Mean time to load components
- **Strategy Usage**: Breakdown by preloading strategy

### Route Loading Metrics
- **Navigation Time**: Time from route change to component render
- **Component Size**: Estimated size of loaded components
- **Cache Status**: Whether route was preloaded or loaded on-demand

### Performance Insights
The system provides automated insights:

```typescript
const insights = getPerformanceInsights();
// [
//   {
//     type: 'warning',
//     message: 'Low cache hit rate (45%)',
//     recommendation: 'Review preloading strategy for better prediction'
//   }
// ]
```

## Vite Integration

The system integrates with Vite's code splitting:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Domain-based chunking
          if (id.includes('/src/property/pages/')) {
            return 'domain-property-pages';
          }
          if (id.includes('/src/trust/pages/')) {
            return 'domain-trust-pages';
          }
          // ... more domain chunks
        }
      }
    }
  }
});
```

## Best Practices

### 1. Strategy Selection
- **Immediate**: Critical user paths (home, auth)
- **Hover**: High-engagement content (properties, services)
- **Idle**: Secondary features (dashboard, settings)
- **Viewport**: Content-driven preloading
- **On-demand**: Rarely accessed pages

### 2. Performance Budgets
Set size limits for preloaded content:

```typescript
const performanceBudgets = {
  immediate: 200, // KB - critical path budget
  hover: 100,     // KB - per hover preload
  idle: 500,      // KB - total idle preloads
};
```

### 3. Data Preloading
Only preload data that's likely to be used:

```typescript
// Good: Preload property details when hovering property link
preloadData: route.includes('/property/')

// Bad: Preload all user data on every page
preloadData: true
```

### 4. Error Handling
Always handle preload failures gracefully:

```typescript
try {
  await preloadRoute('/property/123');
} catch (error) {
  // Route will load normally on navigation
  console.warn('Preload failed, falling back to on-demand loading');
}
```

## Development Tools

### Browser Console
Access preloader in development:

```javascript
// Check preloaded routes
__routePreloader.getMetrics()

// Manually preload a route
__routePreloader.preloadRoute('/dashboard', 'immediate')

// View performance summary
__routePreloadingUtils.logMetrics()
```

### Performance Monitor
The `RoutePerformanceMonitor` component provides:
- Real-time preload metrics
- Cache hit rate monitoring
- Load time analysis
- Strategy effectiveness insights

## Testing

### Unit Tests
```bash
npm test -- src/infrastructure/routing/__tests__/
```

### Integration Tests
```bash
npm test -- src/infrastructure/routing/__tests__/integration.test.ts
```

### Performance Testing
Monitor metrics in development:
1. Enable `RoutePerformanceMonitor`
2. Navigate through the application
3. Review insights and recommendations

## Analytics Integration

In production, metrics are sent to analytics:

```typescript
// Automatic analytics reporting
fetch('/api/analytics/route-performance', {
  method: 'POST',
  body: JSON.stringify({
    route: '/property/123',
    loadTime: 150,
    cacheStatus: 'hit',
    strategy: 'hover'
  })
});
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Metrics are limited to 1000 entries
   - Preloaded routes are cleaned up on navigation
   - Use `destroy()` method when needed

2. **Low Cache Hit Rate**
   - Review preloading strategies
   - Adjust hover delays
   - Consider user behavior patterns

3. **Slow Preloading**
   - Check network conditions
   - Reduce component sizes
   - Optimize dependencies

### Debug Mode
Enable detailed logging:

```typescript
// Set in development
localStorage.setItem('debug-route-preloader', 'true');
```

## Future Enhancements

- **Machine Learning**: Predict user navigation patterns
- **Service Worker Integration**: Cache preloaded routes offline
- **A/B Testing**: Test different preloading strategies
- **Real User Monitoring**: Collect performance data from users

## Contributing

When adding new routes:

1. Add route configuration to `routeConfigs`
2. Choose appropriate preloading strategy
3. Add data endpoints if needed
4. Update tests
5. Monitor performance impact