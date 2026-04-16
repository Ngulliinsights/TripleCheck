/**
 * Unified API Client Usage Examples
 * 
 * This file demonstrates how to use the new unified API client
 * with all its enhanced features.
 */

import { apiClient, UnifiedApiClient } from "../../../local/services/unified-api-client"

// Example 1: Basic Usage (same as before)
export async function basicUsage() {
  // GET request with caching
  const users = await apiClient.get<User[]>('/users');
  
  // POST request
  const newUser = await apiClient.post<User>('/users', {
    name: 'John Doe',
    email: 'john@example.com'
  });
  
  // PUT request
  const updatedUser = await apiClient.put<User>(`/users/${newUser.data?.id}`, {
    name: 'John Smith'
  });
  
  // DELETE request
  await apiClient.delete(`/users/${newUser.data?.id}`);
}

// Example 2: Advanced Configuration
export async function advancedUsage() {
  // Custom client with specific base URL
  const customClient = new UnifiedApiClient('https://api.example.com');

  // Request with custom options
  const response = await customClient.get<PropertyData>('/properties', {
    timeout: 5000,   // Custom timeout
    retries: 1       // Fewer retries for this request
  });

  return response;
}

// Example 3: Error Handling
export async function errorHandlingExample() {
  try {
    const response = await apiClient.get<UserProfile>('/user/profile');
    
    console.log('User profile:', response.data);
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
  } catch (error) {
    // Network errors, timeouts, etc.
    console.error('Request failed:', error);
  }
}

// Example 4: Cache Management
export async function cacheManagementExample() {
  // Make a request
  const response1 = await apiClient.get<Property[]>('/properties', {
    timeout: 5000
  });

  // Make another request
  const response2 = await apiClient.get<Property[]>('/properties', {
    timeout: 5000
  });

  console.log('First request completed');
  console.log('Second request completed');
}

// Example 5: File Upload
export async function fileUploadExample(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', 'property-images');

  const response = await apiClient.post<UploadResponse>('/upload', formData, {
    headers: {
      // Don't set Content-Type, let browser set it with boundary
    },
    timeout: 30000, // Longer timeout for file uploads
    retries: 1      // Fewer retries for uploads
  });

  return response;
}

// Example 6: Batch Operations
export async function batchOperationsExample() {
  // Multiple requests that will be handled efficiently
  const [users, properties, notifications] = await Promise.all([
    apiClient.get<User[]>('/users'),
    apiClient.get<Property[]>('/properties'),
    apiClient.get<Notification[]>('/notifications')
  ]);

  return {
    users: users.data,
    properties: properties.data,
    notifications: notifications.data
  };
}

// Example 7: Authentication Handling
export async function authenticationExample() {
  // Login request
  const loginResponse = await apiClient.post<AuthResponse>('/auth/login', {
    email: 'user@example.com',
    password: 'password123'
  });

  if (loginResponse.data?.token) {
    // Token is automatically stored and used for subsequent requests
    localStorage.setItem('auth_token', loginResponse.data.token);

    // This request will automatically include the auth token
    const profileResponse = await apiClient.get<UserProfile>('/user/profile');
    
    return profileResponse.data;
  }

  throw new Error('Login failed');
}

// Example 8: Real-time Data with Polling
export async function pollingExample() {
  let isPolling = true;
  
  const pollData = async () => {
    while (isPolling) {
      try {
        const response = await apiClient.get<SystemStatus>('/system/status', {
          timeout: 5000
        });

        console.log('System status:', response.data);
        
        // Process the data
        if (response.data?.status === 'critical') {
          console.warn('System in critical state!');
          // Handle critical state
        }

        // Wait 30 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 30000));
      } catch (error) {
        console.error('Polling error:', error);
        // Wait longer on error
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
  };

  // Start polling
  pollData();

  // Return function to stop polling
  return () => {
    isPolling = false;
  };
}

// Type definitions for examples
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface UserProfile extends User {
  avatar?: string;
  preferences: Record<string, any>;
}

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  verified: boolean;
}

interface PropertyData {
  properties: Property[];
  total: number;
  page: number;
}

interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

interface UploadResponse {
  fileId: string;
  url: string;
  size: number;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
}

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  services: Record<string, 'up' | 'down'>;
}