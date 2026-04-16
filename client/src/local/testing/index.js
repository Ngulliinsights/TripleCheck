"use strict";
/**
 * Testing Infrastructure Index
 * Exports all testing utilities and helpers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDataManager = exports.crossBrowserTestScenarios = exports.mobileTestScenarios = exports.accessibilityTestScenarios = exports.performanceTestScenarios = exports.e2eTestScenarios = exports.MessagesPage = exports.PropertyDetailsPage = exports.PropertySearchPage = exports.LoginPage = exports.BasePage = exports.IntegrationTestRunner = exports.LoadTester = exports.createApiTestScenarios = exports.MockApiServer = exports.ApiTester = exports.teardownTest = exports.setupTest = exports.TestErrorBoundary = exports.waitForCondition = exports.waitForNextTick = exports.createMockMessage = exports.createMockProperty = exports.createMockUser = exports.mockPerformance = exports.mockResizeObserver = exports.mockIntersectionObserver = exports.mockSessionStorage = exports.mockLocalStorage = exports.MockWebSocket = exports.mockFetch = exports.mockApiResponses = exports.mockServices = exports.renderWithProviders = void 0;
// Test utilities
var TestUtils_1 = require("./TestUtils");
Object.defineProperty(exports, "renderWithProviders", { enumerable: true, get: function () { return TestUtils_1.renderWithProviders; } });
Object.defineProperty(exports, "mockServices", { enumerable: true, get: function () { return TestUtils_1.mockServices; } });
Object.defineProperty(exports, "mockApiResponses", { enumerable: true, get: function () { return TestUtils_1.mockApiResponses; } });
Object.defineProperty(exports, "mockFetch", { enumerable: true, get: function () { return TestUtils_1.mockFetch; } });
Object.defineProperty(exports, "MockWebSocket", { enumerable: true, get: function () { return TestUtils_1.MockWebSocket; } });
Object.defineProperty(exports, "mockLocalStorage", { enumerable: true, get: function () { return TestUtils_1.mockLocalStorage; } });
Object.defineProperty(exports, "mockSessionStorage", { enumerable: true, get: function () { return TestUtils_1.mockSessionStorage; } });
Object.defineProperty(exports, "mockIntersectionObserver", { enumerable: true, get: function () { return TestUtils_1.mockIntersectionObserver; } });
Object.defineProperty(exports, "mockResizeObserver", { enumerable: true, get: function () { return TestUtils_1.mockResizeObserver; } });
Object.defineProperty(exports, "mockPerformance", { enumerable: true, get: function () { return TestUtils_1.mockPerformance; } });
Object.defineProperty(exports, "createMockUser", { enumerable: true, get: function () { return TestUtils_1.createMockUser; } });
Object.defineProperty(exports, "createMockProperty", { enumerable: true, get: function () { return TestUtils_1.createMockProperty; } });
Object.defineProperty(exports, "createMockMessage", { enumerable: true, get: function () { return TestUtils_1.createMockMessage; } });
Object.defineProperty(exports, "waitForNextTick", { enumerable: true, get: function () { return TestUtils_1.waitForNextTick; } });
Object.defineProperty(exports, "waitForCondition", { enumerable: true, get: function () { return TestUtils_1.waitForCondition; } });
Object.defineProperty(exports, "TestErrorBoundary", { enumerable: true, get: function () { return TestUtils_1.TestErrorBoundary; } });
Object.defineProperty(exports, "setupTest", { enumerable: true, get: function () { return TestUtils_1.setupTest; } });
Object.defineProperty(exports, "teardownTest", { enumerable: true, get: function () { return TestUtils_1.teardownTest; } });
// API testing utilities
var ApiTestUtils_1 = require("./ApiTestUtils");
Object.defineProperty(exports, "ApiTester", { enumerable: true, get: function () { return ApiTestUtils_1.ApiTester; } });
Object.defineProperty(exports, "MockApiServer", { enumerable: true, get: function () { return ApiTestUtils_1.MockApiServer; } });
Object.defineProperty(exports, "createApiTestScenarios", { enumerable: true, get: function () { return ApiTestUtils_1.createApiTestScenarios; } });
Object.defineProperty(exports, "LoadTester", { enumerable: true, get: function () { return ApiTestUtils_1.LoadTester; } });
Object.defineProperty(exports, "IntegrationTestRunner", { enumerable: true, get: function () { return ApiTestUtils_1.IntegrationTestRunner; } });
// E2E testing utilities
var E2ETestUtils_1 = require("./E2ETestUtils");
Object.defineProperty(exports, "BasePage", { enumerable: true, get: function () { return E2ETestUtils_1.BasePage; } });
Object.defineProperty(exports, "LoginPage", { enumerable: true, get: function () { return E2ETestUtils_1.LoginPage; } });
Object.defineProperty(exports, "PropertySearchPage", { enumerable: true, get: function () { return E2ETestUtils_1.PropertySearchPage; } });
Object.defineProperty(exports, "PropertyDetailsPage", { enumerable: true, get: function () { return E2ETestUtils_1.PropertyDetailsPage; } });
Object.defineProperty(exports, "MessagesPage", { enumerable: true, get: function () { return E2ETestUtils_1.MessagesPage; } });
Object.defineProperty(exports, "e2eTestScenarios", { enumerable: true, get: function () { return E2ETestUtils_1.e2eTestScenarios; } });
Object.defineProperty(exports, "performanceTestScenarios", { enumerable: true, get: function () { return E2ETestUtils_1.performanceTestScenarios; } });
Object.defineProperty(exports, "accessibilityTestScenarios", { enumerable: true, get: function () { return E2ETestUtils_1.accessibilityTestScenarios; } });
Object.defineProperty(exports, "mobileTestScenarios", { enumerable: true, get: function () { return E2ETestUtils_1.mobileTestScenarios; } });
Object.defineProperty(exports, "crossBrowserTestScenarios", { enumerable: true, get: function () { return E2ETestUtils_1.crossBrowserTestScenarios; } });
Object.defineProperty(exports, "TestDataManager", { enumerable: true, get: function () { return E2ETestUtils_1.TestDataManager; } });
