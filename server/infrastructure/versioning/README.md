# TripleCheck API Versioning System

A comprehensive API versioning system that provides backward compatibility, automatic migration, and interactive documentation for the TripleCheck platform.

## Features

- **Multi-version Support**: Supports v1, v2, and v3 APIs simultaneously
- **Backward Compatibility**: Automatic request/response transformation between versions
- **Feature Gating**: Version-specific feature availability
- **Interactive Documentation**: Auto-generated documentation with examples
- **Migration Guides**: Step-by-step migration instructions with code examples
- **Deprecation Management**: Graceful deprecation with sunset dates
- **Usage Analytics**: Track API version usage patterns

## Quick Start

### 1. Setup Versioning System

```typescript
import { setupApiVersioning } from './infrastructure/versioning';
import express from 'express';

const app = express();

// Initialize versioning system
setupApiVersioning(app);
```

### 2. Version Detection Methods

The system supports multiple ways to specify API versions:

#### Accept Header (Recommended)
```http
Accept: application/vnd.triplecheck.v2+json
```

#### Custom Header
```http
api-version: v2
```

#### Query Parameter
```http
GET /api/properties?version=v2
```

#### URL Path
```http
GET /api/v2/properties
```

### 3. Using Versioned Routes

```typescript
import { versionSpecificHandler, requireFeature } from './infrastructure/versioning';

// Version-specific handlers
app.get('/api/properties', versionSpecificHandler({
  v1: async (req, res) => {
    // V1 implementation
    const properties = await getBasicProperties();
    res.json({ data: properties });
  },
  v2: async (req, res) => {
    // V2 implementation with verification
    const properties = await getVerifiedProperties();
    res.json({ data: properties, verificationSummary: {...} });
  },
  v3: async (req, res) => {
    // V3 implementation with AI insights
    const properties = await getAIEnhancedProperties();
    res.json({ data: properties, aiInsights: {...} });
  }
}));

// Feature-gated endpoint
app.post('/api/verification/documents', 
  requireFeature('document-authentication'),
  versionSpecificHandler({
    v2: handleDocumentVerificationV2,
    v3: handleDocumentVerificationV3
  })
);
```

## API Versions

### Version 1 (v1) - Active
- **Release Date**: January 1, 2024
- **Status**: Active (Default)
- **Features**: Basic property management, simple authentication, basic search
- **Breaking Changes**: None (initial version)

### Version 2 (v2) - Active
- **Release Date**: June 1, 2024
- **Status**: Active
- **Features**: Enhanced verification, fraud detection, trust scoring, document authentication
- **Breaking Changes**: 
  - Property `type` field renamed to `propertyType`
  - Authentication returns access/refresh token pairs
  - Verification response structure changed

### Version 3 (v3) - Beta
- **Release Date**: December 1, 2024
- **Status**: Beta
- **Features**: AI-powered verification, community intelligence, predictive analytics, expert coordination
- **Breaking Changes**:
  - AI analysis results added to responses
  - New optional AI configuration parameters
  - Enhanced security with behavior analysis

## Client Implementation Examples

### JavaScript/TypeScript

```typescript
class TripleCheckAPI {
  constructor(private version: 'v1' | 'v2' | 'v3' = 'v2') {}

  private async request(endpoint: string, options: RequestInit = {}) {
    return fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'api-version': this.version,
        ...options.headers
      }
    });
  }

  async getProperties(filters?: any) {
    const query = filters ? `?${new URLSearchParams(filters)}` : '';
    const response = await this.request(`/properties${query}`);
    return response.json();
  }

  async createProperty(propertyData: any) {
    const response = await this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(propertyData)
    });
    return response.json();
  }
}

// Usage
const apiV2 = new TripleCheckAPI('v2');
const properties = await apiV2.getProperties({ verified: true });

const apiV3 = new TripleCheckAPI('v3');
const aiProperties = await apiV3.getProperties(); // Includes AI insights
```

### Python

```python
import requests

class TripleCheckAPI:
    def __init__(self, version='v2', base_url='/api'):
        self.version = version
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'api-version': version})

    def get_properties(self, **filters):
        response = self.session.get(f'{self.base_url}/properties', params=filters)
        return response.json()

    def create_property(self, property_data):
        response = self.session.post(f'{self.base_url}/properties', json=property_data)
        return response.json()

# Usage
api_v2 = TripleCheckAPI('v2')
properties = api_v2.get_properties(verified=True)

api_v3 = TripleCheckAPI('v3')
ai_properties = api_v3.get_properties()  # Includes AI insights
```

### cURL Examples

```bash
# V1 - Basic property listing
curl -X GET "/api/v1/properties" \
  -H "Accept: application/json"

# V2 - Enhanced property listing with verification
curl -X GET "/api/properties" \
  -H "api-version: v2" \
  -H "Accept: application/json"

# V3 - AI-powered property listing
curl -X GET "/api/properties" \
  -H "Accept: application/vnd.triplecheck.v3+json"
```

## Migration Guides

### V1 to V2 Migration

#### Key Changes
1. **Property Type Field**: `type` → `propertyType`
2. **Authentication**: Single token → Access/refresh token pairs
3. **New Fields**: Added `verificationStatus`, `trustScore`, `fraudRiskScore`

#### Migration Steps

1. **Update API Version**
```javascript
// Before (V1)
fetch('/api/v1/properties')

// After (V2)
fetch('/api/v2/properties', {
  headers: { 'api-version': 'v2' }
})
```

2. **Handle Property Data Changes**
```javascript
// Before (V1)
const propertyType = property.type;

// After (V2)
const propertyType = property.propertyType;
const verificationStatus = property.verificationStatus;
const trustScore = property.trustScore;
```

3. **Update Authentication**
```javascript
// Before (V1)
localStorage.setItem('token', response.token);

// After (V2)
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
```

### V2 to V3 Migration

#### Key Changes
1. **AI Enhancement**: Added AI analysis results to responses
2. **New Features**: Community intelligence, predictive analytics
3. **Optional Parameters**: AI configuration options

#### Migration Steps

1. **Handle AI Data**
```javascript
// V2 Response
{
  "verificationStatus": "verified",
  "trustScore": 85
}

// V3 Response (backward compatible)
{
  "verificationStatus": "verified",
  "trustScore": 85,
  "aiAnalysisResults": {
    "marketValue": 87000,
    "investmentPotential": "high"
  }
}
```

2. **Utilize New Features**
```javascript
// Check for AI features
if (property.aiAnalysisResults) {
  displayMarketInsights(property.aiAnalysisResults);
  showInvestmentRecommendations(property.aiAnalysisResults);
}
```

## Documentation

### Interactive Documentation
Visit `/docs` for interactive API documentation with:
- Live examples for each version
- Request/response schemas
- Migration guides
- Feature compatibility matrix

### API Reference
- **JSON Documentation**: `/docs/api.json`
- **Migration Guides**: `/docs/migration/{from}/{to}`
- **Version Info**: `/api/version`

## Configuration

### Environment Variables

```env
# API Versioning Configuration
API_DEFAULT_VERSION=v1
API_LATEST_VERSION=v3
API_ALLOW_BETA_VERSIONS=false
API_REQUIRE_EXPLICIT_VERSIONING=false
API_ENABLE_COMPATIBILITY_MODE=true
API_LOG_VERSION_USAGE=true

# Deprecation Settings
API_V1_SUNSET_DATE=2025-06-01
API_V2_DEPRECATION_DATE=2025-01-01
```

### Middleware Options

```typescript
import { ApiVersioningMiddleware } from './infrastructure/versioning';

const versioningMiddleware = new ApiVersioningMiddleware({
  enforceVersioning: true,
  allowBetaVersions: process.env.NODE_ENV === 'development',
  logVersionUsage: true,
  enableCompatibilityMode: true,
  requireExplicitVersioning: false
});
```

## Best Practices

### For API Consumers

1. **Always specify version explicitly**
```http
api-version: v2
```

2. **Handle new fields gracefully**
```javascript
const trustScore = property.trustScore || 0; // Default for V1
```

3. **Check deprecation warnings**
```javascript
if (response.headers.get('Deprecation')) {
  console.warn('API version deprecated:', response.headers.get('Sunset'));
}
```

4. **Use feature detection**
```javascript
if (property.aiAnalysisResults) {
  // V3 features available
}
```

### For API Developers

1. **Maintain backward compatibility**
2. **Use semantic versioning for breaking changes**
3. **Provide clear migration paths**
4. **Document all changes thoroughly**
5. **Give adequate deprecation notice**

## Monitoring and Analytics

### Version Usage Statistics
```typescript
import { apiVersioningMiddleware } from './infrastructure/versioning';

// Get usage statistics
const stats = apiVersioningMiddleware.getUsageStats();
console.log('Version usage:', stats);
// Output: { v1: 150, v2: 300, v3: 50 }
```

### Health Monitoring
```typescript
import { apiVersionManager } from './infrastructure/versioning';

// Get version health information
const versionStats = apiVersionManager.getVersionStats();
console.log('Version statistics:', versionStats);
```

## Troubleshooting

### Common Issues

1. **Version Not Supported**
   - Check if version is active or has been sunset
   - Use `/api/version` endpoint to see supported versions

2. **Feature Not Available**
   - Verify feature is supported in requested version
   - Check feature requirements in documentation

3. **Compatibility Issues**
   - Enable compatibility mode in middleware
   - Check migration guides for breaking changes

4. **Authentication Errors**
   - Ensure correct token format for version
   - V1 uses single token, V2+ use access/refresh pairs

### Debug Mode

```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';

// Check version detection
console.log('Detected version:', req.apiVersion);
console.log('Version config:', req.versionConfig);
```

## Contributing

When adding new API versions:

1. Update `ApiVersionManager` with new version configuration
2. Add version-specific handlers in `VersionedRoutes`
3. Create compatibility layers for smooth transitions
4. Update documentation and migration guides
5. Add comprehensive tests for new version

## Support

- **Documentation**: `/docs`
- **API Reference**: `/docs/api.json`
- **Migration Help**: `/docs/migration/{from}/{to}`
- **Version Status**: `/api/version`