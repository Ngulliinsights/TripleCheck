/**
 * Testing Infrastructure Index
 * Exports all testing utilities and helpers
 */

// Test utilities
export {
  renderWithProviders,
  mockServices,
  mockApiResponses,
  mockFetch,
  MockWebSocket,
  mockLocalStorage,
  mockSessionStorage,
  mockIntersectionObserver,
  mockResizeObserver,
  mockPerformance,
  createMockUser,
  createMockProperty,
  createMockMessage,
  waitForNextTick,
  waitForCondition,
  TestErrorBoundary,
  setupTest,
  teardownTest
} from './TestUtils'

// API testing utilities
export {
  ApiTester,
  MockApiServer,
  createApiTestScenarios,
  LoadTester,
  IntegrationTestRunner
} from './ApiTestUtils'

// E2E testing utilities
export {
  BasePage,
  LoginPage,
  PropertySearchPage,
  PropertyDetailsPage,
  MessagesPage,
  e2eTestScenarios,
  performanceTestScenarios,
  accessibilityTestScenarios,
  mobileTestScenarios,
  crossBrowserTestScenarios,
  TestDataManager
} from './E2ETestUtils'

// Test helpers with race condition protection
export {
  createMockFetch,
  createSafeFetch,
  MockAuthProvider
} from './test-helpers'

// Types
export type {
  E2ETestConfig,
  E2ETestResult
} from './E2ETestUtils'

export type {
  ApiTestConfig,
  ApiTestResult
} from './ApiTestUtils'