/**
 * API Documentation Generator
 * 
 * Automatically generates comprehensive API documentation with version-specific
 * information, migration guides, and interactive examples.
 */

import { Request, Response } from 'express';
import { apiVersionManager, ApiVersion, VersionConfig } from './ApiVersionManager';
import { versionedRoutes } from './VersionedRoutes';
import { ResponseHelper } from '../../utils/response-helpers';

export interface ApiEndpoint {
  path: string;
  method: string;
  versions: ApiVersion[];
  description: string;
  parameters?: Parameter[];
  requestBody?: RequestBodySchema;
  responses: Record<string, ResponseSchema>;
  examples: Record<ApiVersion, any>;
  requiredFeatures: string[];
  deprecationInfo?: DeprecationInfo;
}

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header';
  required: boolean;
  type: string;
  description: string;
  example?: any;
  deprecated?: boolean;
}

export interface RequestBodySchema {
  required: boolean;
  contentType: string;
  schema: any;
  examples: Record<ApiVersion, any>;
}

export interface ResponseSchema {
  description: string;
  contentType: string;
  schema: any;
  examples: Record<ApiVersion, any>;
}

export interface DeprecationInfo {
  version: ApiVersion;
  deprecatedSince: string;
  sunsetDate?: string;
  migrationGuide: string;
  alternatives: string[];
}

export interface MigrationGuide {
  fromVersion: ApiVersion;
  toVersion: ApiVersion;
  breakingChanges: BreakingChange[];
  migrationSteps: MigrationStep[];
  codeExamples: CodeExample[];
  timeline: string;
  supportLevel: 'full' | 'limited' | 'none';
}

export interface BreakingChange {
  category: 'request' | 'response' | 'authentication' | 'behavior';
  description: string;
  impact: 'high' | 'medium' | 'low';
  endpoint?: string;
  oldFormat: any;
  newFormat: any;
  migrationAction: string;
}

export interface MigrationStep {
  step: number;
  title: string;
  description: string;
  codeExample?: string;
  validation?: string;
  rollbackPlan?: string;
}

export interface CodeExample {
  language: 'javascript' | 'python' | 'curl' | 'php';
  title: string;
  before: string;
  after: string;
  explanation: string;
}

export class ApiDocumentationGenerator {
  private endpoints: Map<string, ApiEndpoint> = new Map();
  private migrationGuides: Map<string, MigrationGuide> = new Map();

  constructor() {
    this.generateEndpointDocumentation();
    this.generateMigrationGuides();
  }

  /**
   * Generate comprehensive API documentation
   */
  generateApiDocumentation(): any {
    const versions = apiVersionManager.getSupportedVersions();
    const endpoints = Array.from(this.endpoints.values());

    return {
      info: {
        title: 'TripleCheck API',
        description: 'Comprehensive property verification and land management API',
        version: 'Multi-version',
        contact: {
          name: 'TripleCheck API Support',
          email: 'api-support@triplecheck.com',
          url: 'https://docs.triplecheck.com'
        },
        license: {
          name: 'Proprietary',
          url: 'https://triplecheck.com/license'
        }
      },
      versions: versions.map(v => ({
        version: v.version,
        status: v.status,
        releaseDate: v.releaseDate,
        deprecationDate: v.deprecationDate,
        sunsetDate: v.sunsetDate,
        supportedFeatures: v.supportedFeatures,
        breakingChanges: v.breakingChanges,
        migrationGuide: v.migrationGuide
      })),
      endpoints: endpoints,
      migrationGuides: Array.from(this.migrationGuides.values()),
      authentication: this.generateAuthenticationDocs(),
      errorCodes: this.generateErrorCodeDocs(),
      rateLimit: this.generateRateLimitDocs(),
      examples: this.generateExampleDocs()
    };
  }

  /**
   * Generate endpoint-specific documentation
   */
  private generateEndpointDocumentation(): void {
    // Properties endpoints
    this.endpoints.set('GET /properties', {
      path: '/properties',
      method: 'GET',
      versions: ['v1', 'v2', 'v3'],
      description: 'Retrieve properties list with version-specific enhancements',
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          type: 'integer',
          description: 'Page number for pagination',
          example: 1
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          type: 'integer',
          description: 'Number of items per page',
          example: 20
        },
        {
          name: 'location',
          in: 'query',
          required: false,
          type: 'string',
          description: 'Filter by location',
          example: 'Westlands'
        },
        {
          name: 'verified',
          in: 'query',
          required: false,
          type: 'boolean',
          description: 'Filter by verification status (V2+)',
          example: true
        }
      ],
      responses: {
        '200': {
          description: 'Properties retrieved successfully',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' },
              message: { type: 'string' },
              metadata: { type: 'object' }
            }
          },
          examples: {
            v1: {
              success: true,
              data: {
                properties: [
                  {
                    id: 1,
                    title: 'Modern Apartment',
                    location: 'Westlands',
                    price: 85000,
                    type: 'apartment'
                  }
                ],
                total: 1
              },
              message: 'Properties retrieved'
            },
            v2: {
              success: true,
              data: {
                properties: [
                  {
                    id: 1,
                    title: 'Modern Apartment',
                    location: 'Westlands',
                    price: 85000,
                    propertyType: 'apartment',
                    verificationStatus: 'verified',
                    trustScore: 85,
                    fraudRiskScore: 15
                  }
                ],
                total: 1,
                verificationSummary: {
                  verified: 1,
                  pending: 0,
                  suspicious: 0
                }
              },
              message: 'Properties retrieved with enhanced data'
            },
            v3: {
              success: true,
              data: {
                properties: [
                  {
                    id: 1,
                    title: 'Modern Apartment',
                    location: 'Westlands',
                    price: 85000,
                    propertyType: 'apartment',
                    verificationStatus: 'verified',
                    trustScore: 85,
                    aiAnalysisResults: {
                      marketValue: 87000,
                      investmentPotential: 'high'
                    }
                  }
                ],
                total: 1,
                marketInsights: {
                  averagePrice: 85000,
                  priceGrowth: '12%'
                }
              },
              message: 'Properties retrieved with AI insights'
            }
          }
        }
      },
      examples: {
        v1: {
          request: 'GET /api/v1/properties?page=1&limit=10',
          response: 'Basic property data without verification info'
        },
        v2: {
          request: 'GET /api/v2/properties?page=1&limit=10&verified=true',
          response: 'Enhanced property data with verification status and trust scores'
        },
        v3: {
          request: 'GET /api/v3/properties?page=1&limit=10',
          response: 'AI-powered property data with market insights and predictions'
        }
      },
      requiredFeatures: ['basic-property-management']
    });

    // Authentication endpoints
    this.endpoints.set('POST /auth/login', {
      path: '/auth/login',
      method: 'POST',
      versions: ['v1', 'v2', 'v3'],
      description: 'User authentication with version-specific security features',
      requestBody: {
        required: true,
        contentType: 'application/json',
        schema: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string' },
            password: { type: 'string' }
          }
        },
        examples: {
          v1: {
            username: 'user@example.com',
            password: 'password123'
          },
          v2: {
            username: 'user@example.com',
            password: 'password123',
            rememberMe: true
          },
          v3: {
            username: 'user@example.com',
            password: 'password123',
            deviceFingerprint: 'abc123',
            location: { lat: -1.286389, lng: 36.817223 }
          }
        }
      },
      responses: {
        '200': {
          description: 'Login successful',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' }
            }
          },
          examples: {
            v1: {
              success: true,
              data: {
                token: 'jwt_token_v1',
                user: {
                  id: 1,
                  username: 'user@example.com',
                  role: 'user'
                }
              },
              message: 'Login successful'
            },
            v2: {
              success: true,
              data: {
                accessToken: 'jwt_access_token_v2',
                refreshToken: 'jwt_refresh_token_v2',
                user: {
                  id: 1,
                  username: 'user@example.com',
                  role: 'user',
                  trustScore: 750
                },
                sessionId: 'session_123'
              },
              message: 'Enhanced login successful'
            },
            v3: {
              success: true,
              data: {
                accessToken: 'jwt_access_token_v3',
                refreshToken: 'jwt_refresh_token_v3',
                user: {
                  id: 1,
                  username: 'user@example.com',
                  role: 'user',
                  trustScore: 750,
                  aiRiskScore: 25,
                  behaviorAnalysis: {
                    loginPattern: 'normal',
                    deviceTrust: 'high'
                  }
                },
                sessionId: 'session_123',
                securityLevel: 'enhanced'
              },
              message: 'AI-secured login successful'
            }
          }
        }
      },
      examples: {
        v1: {
          request: 'Basic username/password authentication',
          response: 'Simple JWT token with basic user info'
        },
        v2: {
          request: 'Enhanced authentication with session management',
          response: 'Access/refresh tokens with trust score and session ID'
        },
        v3: {
          request: 'AI-powered authentication with behavior analysis',
          response: 'Enhanced security with AI risk assessment and behavior analysis'
        }
      },
      requiredFeatures: ['user-authentication']
    });

    // Verification endpoints (V2+ only)
    this.endpoints.set('POST /verification/documents', {
      path: '/verification/documents',
      method: 'POST',
      versions: ['v2', 'v3'],
      description: 'Document verification with AI analysis',
      requestBody: {
        required: true,
        contentType: 'multipart/form-data',
        schema: {
          type: 'object',
          required: ['documents'],
          properties: {
            documents: {
              type: 'array',
              items: { type: 'string', format: 'binary' }
            },
            documentTypes: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        examples: {
          v2: {
            documents: ['title_deed.pdf', 'survey_plan.pdf'],
            documentTypes: ['title_deed', 'survey_plan']
          },
          v3: {
            documents: ['title_deed.pdf', 'survey_plan.pdf'],
            documentTypes: ['title_deed', 'survey_plan'],
            aiAnalysisLevel: 'comprehensive',
            expertReviewRequired: false
          }
        }
      },
      responses: {
        '200': {
          description: 'Document verification completed',
          contentType: 'application/json',
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' }
            }
          },
          examples: {
            v2: {
              success: true,
              data: {
                verificationId: 'doc_ver_123',
                results: [
                  {
                    documentType: 'title_deed',
                    status: 'verified',
                    confidence: 0.95,
                    issues: []
                  }
                ]
              },
              message: 'Document verification completed'
            },
            v3: {
              success: true,
              data: {
                verificationId: 'doc_ver_123',
                results: [
                  {
                    documentType: 'title_deed',
                    status: 'verified',
                    confidence: 0.95,
                    issues: [],
                    aiAnalysis: {
                      authenticity: 0.97,
                      completeness: 0.93,
                      forgeryRisk: 0.03
                    }
                  }
                ],
                aiSummary: {
                  overallRisk: 'low',
                  expertReviewRequired: false
                }
              },
              message: 'AI-powered document verification completed'
            }
          }
        }
      },
      examples: {
        v2: {
          request: 'Upload documents for basic verification',
          response: 'Verification results with confidence scores'
        },
        v3: {
          request: 'Upload documents for AI-powered comprehensive analysis',
          response: 'Enhanced verification with AI analysis and risk assessment'
        }
      },
      requiredFeatures: ['document-authentication']
    });
  }

  /**
   * Generate migration guides
   */
  private generateMigrationGuides(): void {
    // V1 to V2 migration guide
    this.migrationGuides.set('v1->v2', {
      fromVersion: 'v1',
      toVersion: 'v2',
      breakingChanges: [
        {
          category: 'response',
          description: 'Property type field renamed from "type" to "propertyType"',
          impact: 'medium',
          endpoint: '/properties',
          oldFormat: { type: 'apartment' },
          newFormat: { propertyType: 'apartment' },
          migrationAction: 'Update client code to use "propertyType" instead of "type"'
        },
        {
          category: 'response',
          description: 'Added verification status and trust score fields',
          impact: 'low',
          endpoint: '/properties',
          oldFormat: { id: 1, title: 'Property' },
          newFormat: { id: 1, title: 'Property', verificationStatus: 'verified', trustScore: 85 },
          migrationAction: 'Handle new fields gracefully in client applications'
        },
        {
          category: 'authentication',
          description: 'JWT token format changed to include refresh tokens',
          impact: 'high',
          endpoint: '/auth/login',
          oldFormat: { token: 'jwt_token' },
          newFormat: { accessToken: 'jwt_access', refreshToken: 'jwt_refresh' },
          migrationAction: 'Update authentication logic to handle access/refresh token pairs'
        }
      ],
      migrationSteps: [
        {
          step: 1,
          title: 'Update API version headers',
          description: 'Change API version from v1 to v2 in all requests',
          codeExample: `
// Before (V1)
fetch('/api/v1/properties', {
  headers: { 'Accept': 'application/json' }
});

// After (V2)
fetch('/api/v2/properties', {
  headers: { 'Accept': 'application/vnd.triplecheck.v2+json' }
});`,
          validation: 'Verify that API responses include new V2 fields',
          rollbackPlan: 'Change version back to v1 if issues occur'
        },
        {
          step: 2,
          title: 'Update property data handling',
          description: 'Modify client code to handle renamed and new property fields',
          codeExample: `
// Before (V1)
const propertyType = property.type;

// After (V2)
const propertyType = property.propertyType;
const verificationStatus = property.verificationStatus;
const trustScore = property.trustScore;`,
          validation: 'Test property listing and detail pages',
          rollbackPlan: 'Use compatibility layer for gradual migration'
        },
        {
          step: 3,
          title: 'Update authentication flow',
          description: 'Implement refresh token handling for enhanced security',
          codeExample: `
// Before (V1)
localStorage.setItem('token', response.token);

// After (V2)
localStorage.setItem('accessToken', response.accessToken);
localStorage.setItem('refreshToken', response.refreshToken);
sessionStorage.setItem('sessionId', response.sessionId);`,
          validation: 'Test login, logout, and token refresh flows',
          rollbackPlan: 'Maintain V1 authentication as fallback'
        }
      ],
      codeExamples: [
        {
          language: 'javascript',
          title: 'Property Listing Migration',
          before: `
// V1 Implementation
const properties = await fetch('/api/v1/properties')
  .then(res => res.json());

properties.data.forEach(property => {
  console.log(\`\${property.title} - \${property.type}\`);
});`,
          after: `
// V2 Implementation
const properties = await fetch('/api/v2/properties', {
  headers: { 'api-version': 'v2' }
}).then(res => res.json());

properties.data.properties.forEach(property => {
  console.log(\`\${property.title} - \${property.propertyType}\`);
  console.log(\`Verification: \${property.verificationStatus}\`);
  console.log(\`Trust Score: \${property.trustScore}\`);
});`,
          explanation: 'V2 introduces enhanced property data with verification status and trust scores'
        },
        {
          language: 'python',
          title: 'Authentication Migration',
          before: `
# V1 Implementation
response = requests.post('/api/v1/auth/login', json={
    'username': 'user@example.com',
    'password': 'password123'
})
token = response.json()['token']
headers = {'Authorization': f'Bearer {token}'}`,
          after: `
# V2 Implementation
response = requests.post('/api/v2/auth/login', 
    json={
        'username': 'user@example.com',
        'password': 'password123'
    },
    headers={'api-version': 'v2'}
)
data = response.json()
access_token = data['accessToken']
refresh_token = data['refreshToken']
headers = {'Authorization': f'Bearer {access_token}'}`,
          explanation: 'V2 introduces access/refresh token pairs for enhanced security'
        }
      ],
      timeline: '3 months deprecation period',
      supportLevel: 'full'
    });

    // V2 to V3 migration guide
    this.migrationGuides.set('v2->v3', {
      fromVersion: 'v2',
      toVersion: 'v3',
      breakingChanges: [
        {
          category: 'response',
          description: 'Added AI analysis results to property and verification responses',
          impact: 'low',
          endpoint: '/properties',
          oldFormat: { verificationStatus: 'verified' },
          newFormat: { 
            verificationStatus: 'verified',
            aiAnalysisResults: { marketValue: 87000, investmentPotential: 'high' }
          },
          migrationAction: 'Handle new AI fields gracefully or ignore if not needed'
        },
        {
          category: 'request',
          description: 'New optional AI configuration parameters',
          impact: 'low',
          endpoint: '/verification/documents',
          oldFormat: { documents: ['file1.pdf'] },
          newFormat: { 
            documents: ['file1.pdf'],
            aiAnalysisLevel: 'comprehensive',
            expertReviewRequired: false
          },
          migrationAction: 'Add AI configuration parameters for enhanced features'
        }
      ],
      migrationSteps: [
        {
          step: 1,
          title: 'Update to V3 endpoints',
          description: 'Migrate API calls to use V3 endpoints with AI enhancements',
          codeExample: `
// V2 to V3 Migration
fetch('/api/v3/properties', {
  headers: { 'api-version': 'v3' }
});`,
          validation: 'Verify AI analysis data is returned in responses',
          rollbackPlan: 'V2 endpoints remain available during transition'
        },
        {
          step: 2,
          title: 'Implement AI features',
          description: 'Add support for AI-powered insights and recommendations',
          codeExample: `
// Handle AI analysis results
if (property.aiAnalysisResults) {
  displayMarketInsights(property.aiAnalysisResults);
  showInvestmentRecommendations(property.aiAnalysisResults);
}`,
          validation: 'Test AI features with sample properties',
          rollbackPlan: 'AI features are optional and backward compatible'
        }
      ],
      codeExamples: [
        {
          language: 'javascript',
          title: 'AI-Enhanced Property Display',
          before: `
// V2 Implementation
const property = await fetchProperty(id);
displayProperty({
  title: property.title,
  price: property.price,
  verificationStatus: property.verificationStatus,
  trustScore: property.trustScore
});`,
          after: `
// V3 Implementation
const property = await fetchProperty(id);
displayProperty({
  title: property.title,
  price: property.price,
  verificationStatus: property.verificationStatus,
  trustScore: property.trustScore,
  aiInsights: property.aiAnalysisResults,
  marketValue: property.aiAnalysisResults?.marketValue,
  investmentPotential: property.aiAnalysisResults?.investmentPotential
});`,
          explanation: 'V3 adds AI-powered market analysis and investment insights'
        }
      ],
      timeline: '6 months transition period',
      supportLevel: 'full'
    });
  }

  /**
   * Generate authentication documentation
   */
  private generateAuthenticationDocs(): any {
    return {
      overview: 'TripleCheck API uses version-specific authentication methods',
      methods: {
        v1: {
          type: 'JWT Bearer Token',
          description: 'Simple JWT token authentication',
          example: 'Authorization: Bearer jwt_token_v1'
        },
        v2: {
          type: 'Access/Refresh Token Pair',
          description: 'Enhanced security with token refresh capability',
          example: 'Authorization: Bearer jwt_access_token_v2'
        },
        v3: {
          type: 'AI-Enhanced Authentication',
          description: 'Behavioral analysis and risk-based authentication',
          example: 'Authorization: Bearer jwt_access_token_v3'
        }
      },
      headers: [
        {
          name: 'Authorization',
          required: true,
          description: 'Bearer token for authentication'
        },
        {
          name: 'api-version',
          required: false,
          description: 'Specify API version (v1, v2, v3)'
        }
      ]
    };
  }

  /**
   * Generate error code documentation
   */
  private generateErrorCodeDocs(): any {
    return {
      standardErrors: {
        400: 'Bad Request - Invalid request parameters',
        401: 'Unauthorized - Authentication required',
        403: 'Forbidden - Insufficient permissions',
        404: 'Not Found - Resource not found',
        409: 'Conflict - Resource conflict',
        429: 'Too Many Requests - Rate limit exceeded',
        500: 'Internal Server Error - Server error'
      },
      versionSpecificErrors: {
        v1: {
          1001: 'Invalid property type',
          1002: 'Missing required fields'
        },
        v2: {
          2001: 'Verification failed',
          2002: 'Trust score too low',
          2003: 'Document authentication failed'
        },
        v3: {
          3001: 'AI analysis failed',
          3002: 'Expert review required',
          3003: 'Community intelligence unavailable'
        }
      }
    };
  }

  /**
   * Generate rate limiting documentation
   */
  private generateRateLimitDocs(): any {
    return {
      overview: 'API rate limits vary by version and endpoint',
      limits: {
        v1: {
          general: '100 requests per minute',
          authentication: '10 requests per minute'
        },
        v2: {
          general: '200 requests per minute',
          authentication: '20 requests per minute',
          verification: '50 requests per hour'
        },
        v3: {
          general: '300 requests per minute',
          authentication: '30 requests per minute',
          verification: '100 requests per hour',
          aiAnalysis: '20 requests per hour'
        }
      },
      headers: {
        'X-RateLimit-Limit': 'Request limit per window',
        'X-RateLimit-Remaining': 'Remaining requests in window',
        'X-RateLimit-Reset': 'Time when limit resets'
      }
    };
  }

  /**
   * Generate example documentation
   */
  private generateExampleDocs(): any {
    return {
      quickStart: {
        v1: {
          title: 'Quick Start with V1',
          description: 'Basic property management',
          example: `
// 1. Authenticate
const loginResponse = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'password123'
  })
});
const { token } = await loginResponse.json();

// 2. Get properties
const propertiesResponse = await fetch('/api/v1/properties', {
  headers: { 'Authorization': \`Bearer \${token}\` }
});
const properties = await propertiesResponse.json();`
        },
        v2: {
          title: 'Quick Start with V2',
          description: 'Enhanced property management with verification',
          example: `
// 1. Authenticate with enhanced security
const loginResponse = await fetch('/api/v2/auth/login', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'api-version': 'v2'
  },
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'password123'
  })
});
const { accessToken, refreshToken } = await loginResponse.json();

// 2. Get verified properties
const propertiesResponse = await fetch('/api/v2/properties?verified=true', {
  headers: { 
    'Authorization': \`Bearer \${accessToken}\`,
    'api-version': 'v2'
  }
});
const properties = await propertiesResponse.json();`
        },
        v3: {
          title: 'Quick Start with V3',
          description: 'AI-powered property management',
          example: `
// 1. AI-enhanced authentication
const loginResponse = await fetch('/api/v3/auth/login', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'api-version': 'v3'
  },
  body: JSON.stringify({
    username: 'user@example.com',
    password: 'password123',
    deviceFingerprint: 'device_123'
  })
});
const { accessToken, user } = await loginResponse.json();

// 2. Get AI-enhanced properties
const propertiesResponse = await fetch('/api/v3/properties', {
  headers: { 
    'Authorization': \`Bearer \${accessToken}\`,
    'api-version': 'v3'
  }
});
const { data } = await propertiesResponse.json();
console.log('Market insights:', data.marketInsights);
console.log('AI recommendations:', data.aiRecommendations);`
        }
      }
    };
  }

  /**
   * Generate interactive API documentation endpoint
   */
  generateInteractiveDocumentation(req: Request, res: Response): void {
    const documentation = this.generateApiDocumentation();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TripleCheck API Documentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 30px; }
        .version-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-right: 10px; }
        .version-active { background: #28a745; color: white; }
        .version-deprecated { background: #ffc107; color: black; }
        .version-beta { background: #17a2b8; color: white; }
        .endpoint { border: 1px solid #ddd; border-radius: 6px; margin: 20px 0; padding: 20px; }
        .method { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; margin-right: 10px; }
        .method-get { background: #28a745; color: white; }
        .method-post { background: #007bff; color: white; }
        .method-put { background: #ffc107; color: black; }
        .method-delete { background: #dc3545; color: white; }
        .code { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .tabs { border-bottom: 1px solid #ddd; margin-bottom: 20px; }
        .tab { display: inline-block; padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { border-bottom-color: #007bff; color: #007bff; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .migration-guide { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .breaking-change { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>TripleCheck API Documentation</h1>
            <p>${documentation.info.description}</p>
            <div>
                ${documentation.versions.map(v => `
                    <span class="version-badge version-${v.status}">${v.version.toUpperCase()}</span>
                `).join('')}
            </div>
        </div>

        <div class="tabs">
            <div class="tab active" onclick="showTab('overview')">Overview</div>
            <div class="tab" onclick="showTab('endpoints')">Endpoints</div>
            <div class="tab" onclick="showTab('migration')">Migration</div>
            <div class="tab" onclick="showTab('examples')">Examples</div>
        </div>

        <div id="overview" class="tab-content active">
            <h2>API Versions</h2>
            ${documentation.versions.map(v => `
                <div class="endpoint">
                    <h3>Version ${v.version.toUpperCase()} 
                        <span class="version-badge version-${v.status}">${v.status}</span>
                    </h3>
                    <p><strong>Release Date:</strong> ${v.releaseDate}</p>
                    ${v.deprecationDate ? `<p><strong>Deprecated:</strong> ${v.deprecationDate}</p>` : ''}
                    ${v.sunsetDate ? `<p><strong>Sunset Date:</strong> ${v.sunsetDate}</p>` : ''}
                    <p><strong>Features:</strong> ${v.supportedFeatures.join(', ')}</p>
                    ${v.breakingChanges.length > 0 ? `<p><strong>Breaking Changes:</strong> ${v.breakingChanges.join(', ')}</p>` : ''}
                </div>
            `).join('')}
        </div>

        <div id="endpoints" class="tab-content">
            <h2>API Endpoints</h2>
            ${documentation.endpoints.map(endpoint => `
                <div class="endpoint">
                    <h3>
                        <span class="method method-${endpoint.method.toLowerCase()}">${endpoint.method}</span>
                        ${endpoint.path}
                    </h3>
                    <p>${endpoint.description}</p>
                    <p><strong>Available in versions:</strong> ${endpoint.versions.join(', ')}</p>
                    ${endpoint.requiredFeatures.length > 0 ? `<p><strong>Required features:</strong> ${endpoint.requiredFeatures.join(', ')}</p>` : ''}
                    
                    <h4>Examples by Version</h4>
                    ${Object.entries(endpoint.examples).map(([version, example]) => `
                        <div>
                            <strong>${version.toUpperCase()}:</strong>
                            <div class="code">${example.request}</div>
                            <p>${example.response}</p>
                        </div>
                    `).join('')}
                </div>
            `).join('')}
        </div>

        <div id="migration" class="tab-content">
            <h2>Migration Guides</h2>
            ${documentation.migrationGuides.map(guide => `
                <div class="migration-guide">
                    <h3>Migrating from ${guide.fromVersion.toUpperCase()} to ${guide.toVersion.toUpperCase()}</h3>
                    <p><strong>Timeline:</strong> ${guide.timeline}</p>
                    <p><strong>Support Level:</strong> ${guide.supportLevel}</p>
                    
                    <h4>Breaking Changes</h4>
                    ${guide.breakingChanges.map(change => `
                        <div class="breaking-change">
                            <strong>${change.category.toUpperCase()} - ${change.impact.toUpperCase()} IMPACT</strong>
                            <p>${change.description}</p>
                            <p><strong>Action:</strong> ${change.migrationAction}</p>
                        </div>
                    `).join('')}
                    
                    <h4>Migration Steps</h4>
                    <ol>
                        ${guide.migrationSteps.map(step => `
                            <li>
                                <strong>${step.title}</strong>
                                <p>${step.description}</p>
                                ${step.codeExample ? `<div class="code">${step.codeExample}</div>` : ''}
                            </li>
                        `).join('')}
                    </ol>
                </div>
            `).join('')}
        </div>

        <div id="examples" class="tab-content">
            <h2>Quick Start Examples</h2>
            ${Object.entries(documentation.examples.quickStart).map(([version, example]) => `
                <div class="endpoint">
                    <h3>${example.title}</h3>
                    <p>${example.description}</p>
                    <div class="code">${example.example}</div>
                </div>
            `).join('')}
        </div>
    </div>

    <script>
        function showTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show selected tab content
            document.getElementById(tabName).classList.add('active');
            
            // Add active class to clicked tab
            event.target.classList.add('active');
        }
    </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Get API documentation as JSON
   */
  getDocumentationJson(req: Request, res: Response): void {
    const documentation = this.generateApiDocumentation();
    ResponseHelper.success(res, documentation, 'API documentation retrieved');
  }

  /**
   * Get specific migration guide
   */
  getMigrationGuide(req: Request, res: Response): void {
    const { fromVersion, toVersion } = req.params;
    const guideKey = `${fromVersion}->${toVersion}`;
    const guide = this.migrationGuides.get(guideKey);

    if (!guide) {
      ResponseHelper.notFound(res, `Migration guide from ${fromVersion} to ${toVersion} not found`);
      return;
    }

    ResponseHelper.success(res, guide, 'Migration guide retrieved');
  }
}

// Export singleton instance
export const apiDocumentationGenerator = new ApiDocumentationGenerator();