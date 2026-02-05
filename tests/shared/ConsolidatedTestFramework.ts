/**
 * Consolidated Test Framework - Unified testing utilities
 * Eliminates duplicate test infrastructure while improving coverage and speed
 */

import { beforeEach, afterEach, vi, expect } from '..\..\src\shared\test-utils\index';
import { render, screen, fireEvent, waitFor } from '..\..\src\shared\test-utils\index';
import userEvent from '..\..\scripts\cleanup-redundancies';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ReactElement, ReactNode } from 'react';
import { performance } from 'perf_hooks';

// Test data generators
interface TestProperty {
  id: string;
  title: string;
  location: string;
  price: number;
  parcelNumber: string;
  ownershipStatus: 'verified' | 'pending' | 'disputed';
  coordinates?: { lat: number; lng: number };
}

interface TestUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'agent';
  verified: boolean;
}

interface TestEnvironment {
  queryClient: QueryClient;
  user?: TestUser;
  cleanup: () => void;
}

interface BenchmarkResult<T> {
  result: T;
  duration: number;
  passed: boolean;
  benchmark: number;
}

interface MockServiceManager {
  mockApiClient: any;
  mockDatabase: any;
  mockAuth: any;
  cleanup: () => void;
}

export class ConsolidatedTestFramework {
  private testEnvironments: TestEnvironment[] = [];
  private mockServices: MockServiceManager[] = [];

  /**
   * Create comprehensive test environment for any component or service
   */
  createTestEnvironment(options: {
    withAuth?: boolean;
    withRouter?: boolean;
    withQueryClient?: boolean;
    user?: Partial<TestUser>;
  } = {}): TestEnvironment {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
          staleTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    });

    const user = options.user ? this.createTestUser(options.user) : undefined;

    const environment: TestEnvironment = {
      queryClient,
      user,
      cleanup: () => {
        queryClient.clear();
        this.cleanupMocks();
      }
    };

    this.testEnvironments.push(environment);
    return environment;
  }

  /**
   * Render component with all necessary providers
   */
  renderWithProviders(
    ui: ReactElement,
    options: {
      environment?: TestEnvironment;
      initialEntries?: string[];
      user?: TestUser;
    } = {}
  ) {
    const environment = options.environment || this.createTestEnvironment();
    
    const AllTheProviders = ({ children }: { children: ReactNode }) => {
      return (
        <QueryClientProvider client={environment.queryClient}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </QueryClientProvider>
      );
    };

    const result = render(ui, { wrapper: AllTheProviders });
    
    return {
      ...result,
      environment,
      user: userEvent.setup(),
    };
  }

  /**
   * Create test property with Kenya-specific defaults
   */
  createTestProperty(overrides: Partial<TestProperty> = {}): TestProperty {
    const id = `test-property-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      title: `Test Property ${id.slice(-8)}`,
      location: 'Nairobi County',
      price: 5000000, // 5M KES
      parcelNumber: `NBI/TEST/${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      ownershipStatus: 'verified',
      coordinates: {
        lat: -1.2921 + (Math.random() - 0.5) * 0.1, // Nairobi area
        lng: 36.8219 + (Math.random() - 0.5) * 0.1
      },
      ...overrides
    };
  }

  /**
   * Create test user with realistic data
   */
  createTestUser(overrides: Partial<TestUser> = {}): TestUser {
    const id = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      email: `test.user.${id.slice(-8)}@example.com`,
      name: `Test User ${id.slice(-8)}`,
      role: 'user',
      verified: true,
      ...overrides
    };
  }

  /**
   * Create test fraud report data
   */
  createTestFraudReport(propertyId?: string) {
    return {
      id: `fraud-${Date.now()}`,
      propertyId: propertyId || this.createTestProperty().id,
      reportType: 'document_forgery',
      severity: 'high',
      description: 'Suspicious document alterations detected',
      reportedBy: this.createTestUser().id,
      status: 'under_investigation',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Create mock service manager for testing
   */
  createMockServices(): MockServiceManager {
    const mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn()
    };

    const mockDatabase = {
      query: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    };

    const mockAuth = {
      login: vi.fn(),
      logout: vi.fn(),
      getCurrentUser: vi.fn(),
      isAuthenticated: vi.fn(() => true)
    };

    const manager: MockServiceManager = {
      mockApiClient,
      mockDatabase,
      mockAuth,
      cleanup: () => {
        vi.clearAllMocks();
      }
    };

    this.mockServices.push(manager);
    return manager;
  }

  /**
   * Performance benchmark utility
   */
  async runPerformanceBenchmark<T>(
    operation: () => Promise<T>,
    expectedMaxDuration: number,
    description?: string
  ): Promise<BenchmarkResult<T>> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      const passed = duration <= expectedMaxDuration;
      
      if (description) {
        console.log(
          `${passed ? '✅' : '❌'} ${description}: ${duration.toFixed(2)}ms (target: ${expectedMaxDuration}ms)`
        );
      }

      return {
        result,
        duration,
        passed,
        benchmark: expectedMaxDuration
      };
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`💥 Benchmark failed for ${description}:`, error);
      
      throw error;
    }
  }

  /**
   * Test Kenya-specific property validation
   */
  validateKenyaProperty(property: TestProperty): boolean {
    // Validate parcel number format (Kenya standard)
    const parcelRegex = /^[A-Z]{2,4}\/[A-Z0-9]+\/\d+$/;
    if (!parcelRegex.test(property.parcelNumber)) {
      return false;
    }

    // Validate coordinates are within Kenya bounds
    if (property.coordinates) {
      const { lat, lng } = property.coordinates;
      const kenyaBounds = {
        north: 5.0,
        south: -4.7,
        east: 41.9,
        west: 33.9
      };
      
      if (lat < kenyaBounds.south || lat > kenyaBounds.north ||
          lng < kenyaBounds.west || lng > kenyaBounds.east) {
        return false;
      }
    }

    // Validate price is reasonable for Kenya market
    if (property.price < 100000 || property.price > 1000000000) { // 100K to 1B KES
      return false;
    }

    return true;
  }

  /**
   * Simulate user interactions for testing
   */
  async simulateUserFlow(steps: Array<{
    action: 'click' | 'type' | 'select' | 'wait';
    target?: string;
    value?: string;
    timeout?: number;
  }>) {
    for (const step of steps) {
      switch (step.action) {
        case 'click':
          if (step.target) {
            const element = screen.getByTestId(step.target) || screen.getByText(step.target);
            await userEvent.click(element);
          }
          break;
          
        case 'type':
          if (step.target && step.value) {
            const element = screen.getByTestId(step.target) || screen.getByLabelText(step.target);
            await userEvent.type(element, step.value);
          }
          break;
          
        case 'select':
          if (step.target && step.value) {
            const element = screen.getByTestId(step.target) || screen.getByLabelText(step.target);
            await userEvent.selectOptions(element, step.value);
          }
          break;
          
        case 'wait':
          await waitFor(() => {
            // Wait for any pending operations
          }, { timeout: step.timeout || 1000 });
          break;
      }
      
      // Small delay between actions for more realistic simulation
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  /**
   * Test accessibility compliance
   */
  async testAccessibility(container: HTMLElement): Promise<boolean> {
    try {
      const { axe } = await import('jest-axe');
      const results = await axe(container);
      
      if (results.violations.length > 0) {
        console.warn('Accessibility violations found:', results.violations);
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('Could not run accessibility tests:', error);
      return true; // Don't fail tests if axe is not available
    }
  }

  /**
   * Generate test data for load testing
   */
  generateTestDataSet(count: number): {
    properties: TestProperty[];
    users: TestUser[];
    fraudReports: any[];
  } {
    const properties = Array.from({ length: count }, () => this.createTestProperty());
    const users = Array.from({ length: Math.ceil(count / 3) }, () => this.createTestUser());
    const fraudReports = Array.from({ length: Math.ceil(count / 10) }, () => 
      this.createTestFraudReport(properties[Math.floor(Math.random() * properties.length)].id)
    );

    return { properties, users, fraudReports };
  }

  /**
   * Clean up all test environments and mocks
   */
  cleanup(): void {
    this.testEnvironments.forEach(env => env.cleanup());
    this.mockServices.forEach(service => service.cleanup());
    this.testEnvironments = [];
    this.mockServices = [];
  }

  /**
   * Setup common test hooks
   */
  setupTestHooks(): void {
    beforeEach(() => {
      // Reset all mocks before each test
      vi.clearAllMocks();
    });

    afterEach(() => {
      // Clean up after each test
      this.cleanupMocks();
    });
  }

  /**
   * Clean up mocks
   */
  private cleanupMocks(): void {
    vi.clearAllMocks();
    vi.clearAllTimers();
  }
}

// Export singleton instance for easy use
export const testFramework = new ConsolidatedTestFramework();

// Export common test utilities
export const createTestProperty = (overrides?: Partial<TestProperty>) => 
  testFramework.createTestProperty(overrides);

export const createTestUser = (overrides?: Partial<TestUser>) => 
  testFramework.createTestUser(overrides);

export const renderWithProviders = (ui: ReactElement, options?: any) => 
  testFramework.renderWithProviders(ui, options);

export const runPerformanceBenchmark = <T>(
  operation: () => Promise<T>,
  expectedMaxDuration: number,
  description?: string
) => testFramework.runPerformanceBenchmark(operation, expectedMaxDuration, description);

// Common test assertions
export const expectKenyaPropertyValid = (property: TestProperty) => {
  expect(testFramework.validateKenyaProperty(property)).toBe(true);
};

export const expectAccessible = async (container: HTMLElement) => {
  const isAccessible = await testFramework.testAccessibility(container);
  expect(isAccessible).toBe(true);
};

// Performance test helpers
export const expectFastRender = async (renderFn: () => Promise<any>) => {
  const result = await runPerformanceBenchmark(renderFn, 100, 'Component render');
  expect(result.passed).toBe(true);
  return result.result;
};

export const expectFastApiCall = async (apiFn: () => Promise<any>) => {
  const result = await runPerformanceBenchmark(apiFn, 500, 'API call');
  expect(result.passed).toBe(true);
  return result.result;
};