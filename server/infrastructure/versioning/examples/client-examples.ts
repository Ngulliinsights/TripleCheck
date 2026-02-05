/**
 * Client Implementation Examples
 * 
 * Comprehensive examples showing how to implement API versioning
 * in different client environments and programming languages.
 */

// TypeScript/JavaScript Client Implementation
export class TripleCheckAPIClient {
  private baseUrl: string;
  private version: 'v1' | 'v2' | 'v3';
  private accessToken?: string;
  private refreshToken?: string;

  constructor(options: {
    baseUrl?: string;
    version?: 'v1' | 'v2' | 'v3';
    accessToken?: string;
    refreshToken?: string;
  } = {}) {
    this.baseUrl = options.baseUrl || '/api';
    this.version = options.version || 'v2';
    this.accessToken = options.accessToken;
    this.refreshToken = options.refreshToken;
  }

  /**
   * Make authenticated API request with automatic version handling
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'api-version': this.version,
      ...options.headers
    };

    // Add authentication if available
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle token refresh for V2+
    if (response.status === 401 && this.version !== 'v1' && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry original request with new token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        return fetch(url, { ...options, headers });
      }
    }

    // Check for deprecation warnings
    if (response.headers.get('Deprecation')) {
      console.warn(`API version ${this.version} is deprecated. Sunset date: ${response.headers.get('Sunset')}`);
    }

    return response;
  }

  /**
   * Refresh access token (V2+ only)
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken || this.version === 'v1') {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-version': this.version
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  /**
   * Authenticate user
   */
  async login(credentials: { username: string; password: string; deviceFingerprint?: string }): Promise<any> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (response.ok) {
      const data = await response.json();
      
      // Handle version-specific token storage
      if (this.version === 'v1') {
        this.accessToken = data.token;
      } else {
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
      }

      return data;
    }

    throw new Error('Login failed');
  }

  /**
   * Get properties with version-specific features
   */
  async getProperties(filters: {
    page?: number;
    limit?: number;
    location?: string;
    verified?: boolean; // V2+ only
    priceMin?: number;
    priceMax?: number;
  } = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });

    const query = queryParams.toString();
    const endpoint = `/properties${query ? `?${query}` : ''}`;
    
    const response = await this.request(endpoint);
    
    if (response.ok) {
      const data = await response.json();
      
      // Handle version-specific response formats
      if (this.version === 'v1') {
        return {
          properties: data.data.properties || data.data,
          total: data.data.total || data.data.length,
          hasAIInsights: false,
          hasVerificationData: false
        };
      } else if (this.version === 'v2') {
        return {
          properties: data.data.properties,
          total: data.data.total,
          verificationSummary: data.data.verificationSummary,
          hasAIInsights: false,
          hasVerificationData: true
        };
      } else { // v3
        return {
          properties: data.data.properties,
          total: data.data.total,
          verificationSummary: data.data.verificationSummary,
          marketInsights: data.data.marketInsights,
          aiRecommendations: data.data.aiRecommendations,
          hasAIInsights: true,
          hasVerificationData: true
        };
      }
    }

    throw new Error('Failed to fetch properties');
  }

  /**
   * Create property with version-specific validation
   */
  async createProperty(propertyData: {
    title: string;
    description: string;
    location: string;
    price: number;
    propertyType?: string; // V2+ (maps to 'type' in V1)
    type?: string; // V1 only
    verificationLevel?: 'basic' | 'enhanced'; // V2+ only
    aiAnalysisEnabled?: boolean; // V3 only
    communityIntelligenceEnabled?: boolean; // V3 only
  }): Promise<any> {
    // Transform data based on version
    let requestData = { ...propertyData };
    
    if (this.version === 'v1') {
      // V1 uses 'type' instead of 'propertyType'
      if (propertyData.propertyType && !propertyData.type) {
        requestData = { ...propertyData, type: propertyData.propertyType };
        delete requestData.propertyType;
      }
      // Remove V2+ specific fields
      delete requestData.verificationLevel;
      delete requestData.aiAnalysisEnabled;
      delete requestData.communityIntelligenceEnabled;
    }

    const response = await this.request('/properties', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });

    if (response.ok) {
      return response.json();
    }

    throw new Error('Failed to create property');
  }

  /**
   * Verify property (V2+ only)
   */
  async verifyProperty(propertyId: string, options: {
    expertCoordinationRequired?: boolean; // V3 only
    aiAnalysisEnabled?: boolean; // V3 only
  } = {}): Promise<any> {
    if (this.version === 'v1') {
      throw new Error('Property verification is not available in API v1');
    }

    const response = await this.request(`/properties/${propertyId}/verify`, {
      method: 'POST',
      body: JSON.stringify(options)
    });

    if (response.ok) {
      return response.json();
    }

    throw new Error('Property verification failed');
  }

  /**
   * Verify documents (V2+ only)
   */
  async verifyDocuments(documents: File[], options: {
    documentTypes?: string[];
    aiAnalysisLevel?: 'basic' | 'comprehensive'; // V3 only
    expertReviewRequired?: boolean; // V3 only
  } = {}): Promise<any> {
    if (this.version === 'v1') {
      throw new Error('Document verification is not available in API v1');
    }

    const formData = new FormData();
    documents.forEach((file, index) => {
      formData.append('documents', file);
      if (options.documentTypes?.[index]) {
        formData.append('documentTypes', options.documentTypes[index]);
      }
    });

    // Add V3-specific options
    if (this.version === 'v3') {
      if (options.aiAnalysisLevel) {
        formData.append('aiAnalysisLevel', options.aiAnalysisLevel);
      }
      if (options.expertReviewRequired !== undefined) {
        formData.append('expertReviewRequired', options.expertReviewRequired.toString());
      }
    }

    const response = await this.request('/verification/documents', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });

    if (response.ok) {
      return response.json();
    }

    throw new Error('Document verification failed');
  }

  /**
   * Get user trust score (V2+ only)
   */
  async getTrustScore(): Promise<any> {
    if (this.version === 'v1') {
      throw new Error('Trust score is not available in API v1');
    }

    const response = await this.request('/auth/trust-score');

    if (response.ok) {
      return response.json();
    }

    throw new Error('Failed to get trust score');
  }

  /**
   * Get market insights (V3 only)
   */
  async getMarketInsights(location?: string): Promise<any> {
    if (this.version !== 'v3') {
      throw new Error('Market insights are only available in API v3');
    }

    const query = location ? `?location=${encodeURIComponent(location)}` : '';
    const response = await this.request(`/analytics/market-insights${query}`);

    if (response.ok) {
      return response.json();
    }

    throw new Error('Failed to get market insights');
  }

  /**
   * Migrate to newer API version
   */
  async migrateToVersion(newVersion: 'v1' | 'v2' | 'v3'): Promise<void> {
    // Check if migration is supported
    const versionResponse = await fetch(`${this.baseUrl}/version`);
    if (versionResponse.ok) {
      const versionInfo = await versionResponse.json();
      const supportedVersions = versionInfo.data.supportedVersions.map((v: any) => v.version);
      
      if (!supportedVersions.includes(newVersion)) {
        throw new Error(`Version ${newVersion} is not supported`);
      }
    }

    // Update client version
    const oldVersion = this.version;
    this.version = newVersion;

    // Handle token migration if needed
    if (oldVersion === 'v1' && (newVersion === 'v2' || newVersion === 'v3')) {
      // V1 to V2/V3: Need to re-authenticate to get new token format
      console.warn('Token format changed. Please re-authenticate.');
      this.accessToken = undefined;
      this.refreshToken = undefined;
    }

    console.log(`Migrated from API ${oldVersion} to ${newVersion}`);
  }

  /**
   * Get API version information
   */
  async getVersionInfo(): Promise<any> {
    const response = await this.request('/version');
    if (response.ok) {
      return response.json();
    }
    throw new Error('Failed to get version information');
  }

  /**
   * Check feature availability
   */
  isFeatureAvailable(feature: string): boolean {
    const featureMap: Record<string, string[]> = {
      'basic-property-management': ['v1', 'v2', 'v3'],
      'user-authentication': ['v1', 'v2', 'v3'],
      'simple-verification': ['v1'],
      'multi-layer-verification': ['v2', 'v3'],
      'fraud-detection': ['v2', 'v3'],
      'trust-scoring': ['v2', 'v3'],
      'document-authentication': ['v2', 'v3'],
      'ai-powered-verification': ['v3'],
      'community-intelligence': ['v3'],
      'predictive-analytics': ['v3'],
      'expert-coordination': ['v3']
    };

    return featureMap[feature]?.includes(this.version) || false;
  }
}

// React Hook for API Client
export function useTripleCheckAPI(version: 'v1' | 'v2' | 'v3' = 'v2') {
  const [client] = useState(() => new TripleCheckAPIClient({ version }));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = useCallback(async (credentials: any) => {
    try {
      const result = await client.login(credentials);
      setUser(result.user);
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      throw error;
    }
  }, [client]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    // Clear tokens from client
    (client as any).accessToken = undefined;
    (client as any).refreshToken = undefined;
  }, [client]);

  return {
    client,
    isAuthenticated,
    user,
    login,
    logout,
    version,
    isFeatureAvailable: client.isFeatureAvailable.bind(client)
  };
}

// Python Client Example (for reference)
export const pythonClientExample = `
import requests
from typing import Optional, Dict, Any, List
import json

class TripleCheckAPIClient:
    def __init__(self, base_url: str = '/api', version: str = 'v2', 
                 access_token: Optional[str] = None, refresh_token: Optional[str] = None):
        self.base_url = base_url
        self.version = version
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'api-version': version
        })

    def _request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        url = f"{self.base_url}{endpoint}"
        
        # Add authentication if available
        if self.access_token:
            self.session.headers['Authorization'] = f'Bearer {self.access_token}'
        
        response = self.session.request(method, url, **kwargs)
        
        # Handle token refresh for V2+
        if response.status_code == 401 and self.version != 'v1' and self.refresh_token:
            if self._refresh_token():
                self.session.headers['Authorization'] = f'Bearer {self.access_token}'
                response = self.session.request(method, url, **kwargs)
        
        # Check for deprecation warnings
        if response.headers.get('Deprecation'):
            print(f"Warning: API version {self.version} is deprecated. "
                  f"Sunset date: {response.headers.get('Sunset')}")
        
        return response

    def _refresh_token(self) -> bool:
        if not self.refresh_token or self.version == 'v1':
            return False
        
        try:
            response = requests.post(f'{self.base_url}/auth/refresh', 
                json={'refreshToken': self.refresh_token},
                headers={'api-version': self.version}
            )
            
            if response.ok:
                data = response.json()
                self.access_token = data['accessToken']
                self.refresh_token = data['refreshToken']
                return True
        except Exception as e:
            print(f"Token refresh failed: {e}")
        
        return False

    def login(self, username: str, password: str, **kwargs) -> Dict[str, Any]:
        credentials = {'username': username, 'password': password, **kwargs}
        response = self._request('POST', '/auth/login', json=credentials)
        
        if response.ok:
            data = response.json()
            
            # Handle version-specific token storage
            if self.version == 'v1':
                self.access_token = data['token']
            else:
                self.access_token = data['accessToken']
                self.refresh_token = data['refreshToken']
            
            return data
        
        raise Exception('Login failed')

    def get_properties(self, **filters) -> Dict[str, Any]:
        response = self._request('GET', '/properties', params=filters)
        
        if response.ok:
            data = response.json()
            
            # Handle version-specific response formats
            if self.version == 'v1':
                return {
                    'properties': data['data'].get('properties', data['data']),
                    'total': data['data'].get('total', len(data['data'])),
                    'has_ai_insights': False,
                    'has_verification_data': False
                }
            elif self.version == 'v2':
                return {
                    'properties': data['data']['properties'],
                    'total': data['data']['total'],
                    'verification_summary': data['data'].get('verificationSummary'),
                    'has_ai_insights': False,
                    'has_verification_data': True
                }
            else:  # v3
                return {
                    'properties': data['data']['properties'],
                    'total': data['data']['total'],
                    'verification_summary': data['data'].get('verificationSummary'),
                    'market_insights': data['data'].get('marketInsights'),
                    'ai_recommendations': data['data'].get('aiRecommendations'),
                    'has_ai_insights': True,
                    'has_verification_data': True
                }
        
        raise Exception('Failed to fetch properties')

    def create_property(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        # Transform data based on version
        request_data = property_data.copy()
        
        if self.version == 'v1':
            # V1 uses 'type' instead of 'propertyType'
            if 'propertyType' in request_data and 'type' not in request_data:
                request_data['type'] = request_data.pop('propertyType')
            
            # Remove V2+ specific fields
            request_data.pop('verificationLevel', None)
            request_data.pop('aiAnalysisEnabled', None)
            request_data.pop('communityIntelligenceEnabled', None)
        
        response = self._request('POST', '/properties', json=request_data)
        
        if response.ok:
            return response.json()
        
        raise Exception('Failed to create property')

    def verify_property(self, property_id: str, **options) -> Dict[str, Any]:
        if self.version == 'v1':
            raise Exception('Property verification is not available in API v1')
        
        response = self._request('POST', f'/properties/{property_id}/verify', json=options)
        
        if response.ok:
            return response.json()
        
        raise Exception('Property verification failed')

    def is_feature_available(self, feature: str) -> bool:
        feature_map = {
            'basic-property-management': ['v1', 'v2', 'v3'],
            'user-authentication': ['v1', 'v2', 'v3'],
            'simple-verification': ['v1'],
            'multi-layer-verification': ['v2', 'v3'],
            'fraud-detection': ['v2', 'v3'],
            'trust-scoring': ['v2', 'v3'],
            'document-authentication': ['v2', 'v3'],
            'ai-powered-verification': ['v3'],
            'community-intelligence': ['v3'],
            'predictive-analytics': ['v3'],
            'expert-coordination': ['v3']
        }
        
        return self.version in feature_map.get(feature, [])

# Usage example
client = TripleCheckAPIClient(version='v2')
user_data = client.login('user@example.com', 'password123')
properties = client.get_properties(verified=True, location='Westlands')
`;

// PHP Client Example (for reference)
export const phpClientExample = `
<?php

class TripleCheckAPIClient {
    private $baseUrl;
    private $version;
    private $accessToken;
    private $refreshToken;
    
    public function __construct($baseUrl = '/api', $version = 'v2', $accessToken = null, $refreshToken = null) {
        $this->baseUrl = $baseUrl;
        $this->version = $version;
        $this->accessToken = $accessToken;
        $this->refreshToken = $refreshToken;
    }
    
    private function request($method, $endpoint, $data = null, $headers = []) {
        $url = $this->baseUrl . $endpoint;
        
        $defaultHeaders = [
            'Content-Type: application/json',
            'api-version: ' . $this->version
        ];
        
        if ($this->accessToken) {
            $defaultHeaders[] = 'Authorization: Bearer ' . $this->accessToken;
        }
        
        $headers = array_merge($defaultHeaders, $headers);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $responseHeaders = curl_getinfo($ch, CURLINFO_HEADER_OUT);
        curl_close($ch);
        
        // Handle token refresh for V2+
        if ($httpCode === 401 && $this->version !== 'v1' && $this->refreshToken) {
            if ($this->refreshToken()) {
                return $this->request($method, $endpoint, $data, $headers);
            }
        }
        
        return [
            'status' => $httpCode,
            'data' => json_decode($response, true),
            'headers' => $responseHeaders
        ];
    }
    
    private function refreshToken() {
        if (!$this->refreshToken || $this->version === 'v1') {
            return false;
        }
        
        $response = $this->request('POST', '/auth/refresh', [
            'refreshToken' => $this->refreshToken
        ]);
        
        if ($response['status'] === 200) {
            $data = $response['data'];
            $this->accessToken = $data['accessToken'];
            $this->refreshToken = $data['refreshToken'];
            return true;
        }
        
        return false;
    }
    
    public function login($username, $password, $additionalData = []) {
        $credentials = array_merge([
            'username' => $username,
            'password' => $password
        ], $additionalData);
        
        $response = $this->request('POST', '/auth/login', $credentials);
        
        if ($response['status'] === 200) {
            $data = $response['data'];
            
            // Handle version-specific token storage
            if ($this->version === 'v1') {
                $this->accessToken = $data['token'];
            } else {
                $this->accessToken = $data['accessToken'];
                $this->refreshToken = $data['refreshToken'];
            }
            
            return $data;
        }
        
        throw new Exception('Login failed');
    }
    
    public function getProperties($filters = []) {
        $query = http_build_query($filters);
        $endpoint = '/properties' . ($query ? '?' . $query : '');
        
        $response = $this->request('GET', $endpoint);
        
        if ($response['status'] === 200) {
            $data = $response['data'];
            
            // Handle version-specific response formats
            switch ($this->version) {
                case 'v1':
                    return [
                        'properties' => $data['data']['properties'] ?? $data['data'],
                        'total' => $data['data']['total'] ?? count($data['data']),
                        'hasAIInsights' => false,
                        'hasVerificationData' => false
                    ];
                    
                case 'v2':
                    return [
                        'properties' => $data['data']['properties'],
                        'total' => $data['data']['total'],
                        'verificationSummary' => $data['data']['verificationSummary'] ?? null,
                        'hasAIInsights' => false,
                        'hasVerificationData' => true
                    ];
                    
                case 'v3':
                    return [
                        'properties' => $data['data']['properties'],
                        'total' => $data['data']['total'],
                        'verificationSummary' => $data['data']['verificationSummary'] ?? null,
                        'marketInsights' => $data['data']['marketInsights'] ?? null,
                        'aiRecommendations' => $data['data']['aiRecommendations'] ?? null,
                        'hasAIInsights' => true,
                        'hasVerificationData' => true
                    ];
            }
        }
        
        throw new Exception('Failed to fetch properties');
    }
    
    public function createProperty($propertyData) {
        $requestData = $propertyData;
        
        if ($this->version === 'v1') {
            // V1 uses 'type' instead of 'propertyType'
            if (isset($requestData['propertyType']) && !isset($requestData['type'])) {
                $requestData['type'] = $requestData['propertyType'];
                unset($requestData['propertyType']);
            }
            
            // Remove V2+ specific fields
            unset($requestData['verificationLevel']);
            unset($requestData['aiAnalysisEnabled']);
            unset($requestData['communityIntelligenceEnabled']);
        }
        
        $response = $this->request('POST', '/properties', $requestData);
        
        if ($response['status'] === 201) {
            return $response['data'];
        }
        
        throw new Exception('Failed to create property');
    }
    
    public function isFeatureAvailable($feature) {
        $featureMap = [
            'basic-property-management' => ['v1', 'v2', 'v3'],
            'user-authentication' => ['v1', 'v2', 'v3'],
            'simple-verification' => ['v1'],
            'multi-layer-verification' => ['v2', 'v3'],
            'fraud-detection' => ['v2', 'v3'],
            'trust-scoring' => ['v2', 'v3'],
            'document-authentication' => ['v2', 'v3'],
            'ai-powered-verification' => ['v3'],
            'community-intelligence' => ['v3'],
            'predictive-analytics' => ['v3'],
            'expert-coordination' => ['v3']
        ];
        
        return in_array($this->version, $featureMap[$feature] ?? []);
    }
}

// Usage example
$client = new TripleCheckAPIClient('/api', 'v2');
$userData = $client->login('user@example.com', 'password123');
$properties = $client->getProperties(['verified' => true, 'location' => 'Westlands']);
?>
`;

// Import statements for React usage
import { useState, useCallback } from 'react';