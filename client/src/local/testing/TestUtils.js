"use strict";
/**
 * Testing Utilities
 * Comprehensive testing helpers and utilities
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardownTest = exports.setupTest = exports.TestErrorBoundary = exports.waitForCondition = exports.waitForNextTick = exports.createMockMessage = exports.createMockProperty = exports.createMockUser = exports.mockPerformance = exports.mockResizeObserver = exports.mockIntersectionObserver = exports.mockSessionStorage = exports.mockLocalStorage = exports.MockWebSocket = exports.mockFetch = exports.mockApiResponses = exports.renderWithProviders = exports.mockServices = void 0;
var react_1 = require("@testing-library/react");
var react_query_1 = require("@tanstack/react-query");
var react_router_dom_1 = require("react-router-dom");
var react_2 = require("react");
var index_1 = require("../test-utils/index");
// Mock services for testing
exports.mockServices = {
    cacheService: {
        get: index_1.vi.fn(),
        set: index_1.vi.fn(),
        delete: index_1.vi.fn(),
        clear: index_1.vi.fn(),
        has: index_1.vi.fn(),
        getStats: index_1.vi.fn(function () { return ({
            hits: 0,
            misses: 0,
            hitRate: 0,
            totalEntries: 0,
            totalSize: 0,
            oldestEntry: 0,
            newestEntry: 0
        }); })
    },
    authTokenService: {
        getAccessToken: index_1.vi.fn(),
        setTokens: index_1.vi.fn(),
        clearTokens: index_1.vi.fn(),
        getTokenPayload: index_1.vi.fn(),
        hasPermission: index_1.vi.fn(),
        hasRole: index_1.vi.fn(),
        getUserId: index_1.vi.fn(),
        getUserEmail: index_1.vi.fn()
    },
    validationService: {
        validate: index_1.vi.fn(),
        sanitizeHtml: index_1.vi.fn(),
        sanitizeSql: index_1.vi.fn(),
        sanitizeUserInput: index_1.vi.fn()
    },
    performanceService: {
        recordMetric: index_1.vi.fn(),
        startTiming: index_1.vi.fn(function () { return index_1.vi.fn(); }),
        measureAsync: index_1.vi.fn(),
        measureSync: index_1.vi.fn(),
        getPerformanceReport: index_1.vi.fn(function () { return ({
            metrics: [],
            summary: {
                totalMetrics: 0,
                averageLoadTime: 0,
                slowestResource: '',
                fastestResource: '',
                coreWebVitals: { lcp: 0, fid: 0, cls: 0 }
            },
            recommendations: []
        }); })
    },
    healthCheckService: {
        performHealthChecks: index_1.vi.fn(),
        checkEndpointHealth: index_1.vi.fn(),
        getCurrentHealth: index_1.vi.fn(),
        startMonitoring: index_1.vi.fn(),
        stopMonitoring: index_1.vi.fn()
    },
    auditLogService: {
        logEvent: index_1.vi.fn(),
        logAuthentication: index_1.vi.fn(),
        logAuthorization: index_1.vi.fn(),
        logDataAccess: index_1.vi.fn(),
        logSecurityEvent: index_1.vi.fn(),
        getEvents: index_1.vi.fn(function () { return []; }),
        getSecuritySummary: index_1.vi.fn(function () { return ({
            totalEvents: 0,
            failedLogins: 0,
            unauthorizedAccess: 0,
            highRiskEvents: 0,
            recentEvents: []
        }); })
    }
};
var TestProviders = function (_a) {
    var children = _a.children, queryClient = _a.queryClient, _b = _a.initialRoute, initialRoute = _b === void 0 ? '/' : _b;
    var testQueryClient = queryClient || new react_query_1.QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 0,
                gcTime: 0,
            },
            mutations: {
                retry: false,
            },
        },
    });
    // Mock window.location for routing tests
    if (initialRoute !== '/') {
        Object.defineProperty(window, 'location', {
            value: __assign(__assign({}, window.location), { pathname: initialRoute }),
            writable: true,
        });
    }
    return (<react_query_1.QueryClientProvider client={testQueryClient}>
      <react_router_dom_1.BrowserRouter>
        {children}
      </react_router_dom_1.BrowserRouter>
    </react_query_1.QueryClientProvider>);
};
var renderWithProviders = function (ui, options) {
    if (options === void 0) { options = {}; }
    var queryClient = options.queryClient, initialRoute = options.initialRoute, renderOptions = __rest(options, ["queryClient", "initialRoute"]);
    var Wrapper = function (_a) {
        var children = _a.children;
        return (<TestProviders queryClient={queryClient} initialRoute={initialRoute}>
      {children}
    </TestProviders>);
    };
    return (0, react_1.render)(ui, __assign({ wrapper: Wrapper }, renderOptions));
};
exports.renderWithProviders = renderWithProviders;
// Mock API responses
exports.mockApiResponses = {
    success: function (data) { return ({
        ok: true,
        status: 200,
        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, data];
        }); }); },
        text: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, JSON.stringify(data)];
        }); }); },
    }); },
    error: function (status, message) { return ({
        ok: false,
        status: status,
        statusText: message,
        json: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, ({ error: message })];
        }); }); },
        text: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, JSON.stringify({ error: message })];
        }); }); },
    }); },
    loading: function () { return new Promise(function () { }); }, // Never resolves
};
// Mock fetch function
var mockFetch = function (response) {
    global.fetch = index_1.vi.fn().mockResolvedValue(response);
};
exports.mockFetch = mockFetch;
// Mock WebSocket
var MockWebSocket = /** @class */ (function () {
    function MockWebSocket(url, protocols) {
        var _this = this;
        this.url = url;
        this.protocols = protocols;
        this.readyState = MockWebSocket.CONNECTING;
        this.onopen = null;
        this.onclose = null;
        this.onerror = null;
        this.onmessage = null;
        setTimeout(function () {
            var _a;
            _this.readyState = MockWebSocket.OPEN;
            (_a = _this.onopen) === null || _a === void 0 ? void 0 : _a.call(_this, new Event('open'));
        }, 0);
    }
    MockWebSocket.prototype.send = function (data) {
        if (this.readyState !== MockWebSocket.OPEN) {
            throw new Error('WebSocket is not open');
        }
    };
    MockWebSocket.prototype.close = function (code, reason) {
        var _this = this;
        this.readyState = MockWebSocket.CLOSING;
        setTimeout(function () {
            var _a;
            _this.readyState = MockWebSocket.CLOSED;
            (_a = _this.onclose) === null || _a === void 0 ? void 0 : _a.call(_this, new CloseEvent('close', { code: code, reason: reason }));
        }, 0);
    };
    // Test helpers
    MockWebSocket.prototype.simulateMessage = function (data) {
        var _a;
        if (this.readyState === MockWebSocket.OPEN) {
            (_a = this.onmessage) === null || _a === void 0 ? void 0 : _a.call(this, new MessageEvent('message', { data: JSON.stringify(data) }));
        }
    };
    MockWebSocket.prototype.simulateError = function () {
        var _a;
        (_a = this.onerror) === null || _a === void 0 ? void 0 : _a.call(this, new Event('error'));
    };
    MockWebSocket.CONNECTING = 0;
    MockWebSocket.OPEN = 1;
    MockWebSocket.CLOSING = 2;
    MockWebSocket.CLOSED = 3;
    return MockWebSocket;
}());
exports.MockWebSocket = MockWebSocket;
// Mock localStorage
var mockLocalStorage = function () {
    var store = {};
    return {
        getItem: index_1.vi.fn(function (key) { return store[key] || null; }),
        setItem: index_1.vi.fn(function (key, value) {
            store[key] = value;
        }),
        removeItem: index_1.vi.fn(function (key) {
            delete store[key];
        }),
        clear: index_1.vi.fn(function () {
            Object.keys(store).forEach(function (key) { return delete store[key]; });
        }),
        key: index_1.vi.fn(function (index) { return Object.keys(store)[index] || null; }),
        get length() {
            return Object.keys(store).length;
        }
    };
};
exports.mockLocalStorage = mockLocalStorage;
// Mock sessionStorage
var mockSessionStorage = function () {
    var store = {};
    return {
        getItem: index_1.vi.fn(function (key) { return store[key] || null; }),
        setItem: index_1.vi.fn(function (key, value) {
            store[key] = value;
        }),
        removeItem: index_1.vi.fn(function (key) {
            delete store[key];
        }),
        clear: index_1.vi.fn(function () {
            Object.keys(store).forEach(function (key) { return delete store[key]; });
        }),
        key: index_1.vi.fn(function (index) { return Object.keys(store)[index] || null; }),
        get length() {
            return Object.keys(store).length;
        }
    };
};
exports.mockSessionStorage = mockSessionStorage;
// Mock IntersectionObserver
var mockIntersectionObserver = function () {
    var mockObserver = {
        observe: index_1.vi.fn(),
        unobserve: index_1.vi.fn(),
        disconnect: index_1.vi.fn(),
    };
    global.IntersectionObserver = index_1.vi.fn().mockImplementation(function (callback) {
        return __assign(__assign({}, mockObserver), { trigger: function (entries) { return callback(entries); } });
    });
    return mockObserver;
};
exports.mockIntersectionObserver = mockIntersectionObserver;
// Mock ResizeObserver
var mockResizeObserver = function () {
    var mockObserver = {
        observe: index_1.vi.fn(),
        unobserve: index_1.vi.fn(),
        disconnect: index_1.vi.fn(),
    };
    global.ResizeObserver = index_1.vi.fn().mockImplementation(function (callback) {
        return __assign(__assign({}, mockObserver), { trigger: function (entries) { return callback(entries); } });
    });
    return mockObserver;
};
exports.mockResizeObserver = mockResizeObserver;
// Mock performance API
var mockPerformance = function () {
    var mockPerformance = {
        now: index_1.vi.fn(function () { return Date.now(); }),
        mark: index_1.vi.fn(),
        measure: index_1.vi.fn(),
        getEntriesByType: index_1.vi.fn(function () { return []; }),
        getEntriesByName: index_1.vi.fn(function () { return []; }),
        clearMarks: index_1.vi.fn(),
        clearMeasures: index_1.vi.fn(),
    };
    Object.defineProperty(global, 'performance', {
        value: mockPerformance,
        writable: true,
    });
    return mockPerformance;
};
exports.mockPerformance = mockPerformance;
// Test data factories
var createMockUser = function (overrides) {
    if (overrides === void 0) { overrides = {}; }
    return (__assign({ id: 'user-123', email: 'test@example.com', firstName: 'John', lastName: 'Doe', role: 'user', permissions: ['read', 'write'], createdAt: new Date().toISOString() }, overrides));
};
exports.createMockUser = createMockUser;
var createMockProperty = function (overrides) {
    if (overrides === void 0) { overrides = {}; }
    return (__assign({ id: 'prop-123', title: 'Beautiful Family Home', description: 'A lovely 3-bedroom house in a quiet neighborhood', price: 350000, address: '123 Main St, Anytown, USA', bedrooms: 3, bathrooms: 2, squareFeet: 1500, images: ['image1.jpg', 'image2.jpg'], createdAt: new Date().toISOString() }, overrides));
};
exports.createMockProperty = createMockProperty;
var createMockMessage = function (overrides) {
    if (overrides === void 0) { overrides = {}; }
    return (__assign({ id: 'msg-123', threadId: 'thread-123', senderId: 'user-123', content: 'Hello, this is a test message', messageType: 'text', timestamp: new Date().toISOString(), isRead: false, deliveryStatus: 'delivered' }, overrides));
};
exports.createMockMessage = createMockMessage;
// Async testing utilities
var waitForNextTick = function () { return new Promise(function (resolve) { return setTimeout(resolve, 0); }); };
exports.waitForNextTick = waitForNextTick;
var waitForCondition = function (condition_1) {
    var args_1 = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args_1[_i - 1] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([condition_1], args_1, true), void 0, function (condition, timeout, interval) {
        var startTime;
        if (timeout === void 0) { timeout = 5000; }
        if (interval === void 0) { interval = 100; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    startTime = Date.now();
                    _a.label = 1;
                case 1:
                    if (!(!condition() && Date.now() - startTime < timeout)) return [3 /*break*/, 3];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, interval); })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 1];
                case 3:
                    if (!condition()) {
                        throw new Error("Condition not met within ".concat(timeout, "ms"));
                    }
                    return [2 /*return*/];
            }
        });
    });
};
exports.waitForCondition = waitForCondition;
// Error boundary for testing
var TestErrorBoundary = /** @class */ (function (_super) {
    __extends(TestErrorBoundary, _super);
    function TestErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { hasError: false };
        return _this;
    }
    TestErrorBoundary.getDerivedStateFromError = function (error) {
        return { hasError: true, error: error };
    };
    TestErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        var _a, _b;
        (_b = (_a = this.props).onError) === null || _b === void 0 ? void 0 : _b.call(_a, error);
    };
    TestErrorBoundary.prototype.render = function () {
        if (this.state.hasError) {
            return <div data-testid="error-boundary">Something went wrong</div>;
        }
        return this.props.children;
    };
    return TestErrorBoundary;
}(react_2.default.Component));
exports.TestErrorBoundary = TestErrorBoundary;
// Setup and teardown helpers
var setupTest = function () {
    // Mock services
    index_1.vi.clearAllMocks();
    // Mock browser APIs
    Object.defineProperty(window, 'localStorage', {
        value: (0, exports.mockLocalStorage)(),
        writable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
        value: (0, exports.mockSessionStorage)(),
        writable: true,
    });
    global.WebSocket = MockWebSocket;
    (0, exports.mockIntersectionObserver)();
    (0, exports.mockResizeObserver)();
    (0, exports.mockPerformance)();
    // Mock console methods to reduce noise in tests
    index_1.vi.spyOn(console, 'warn').mockImplementation(function () { });
    index_1.vi.spyOn(console, 'error').mockImplementation(function () { });
};
exports.setupTest = setupTest;
var teardownTest = function () {
    index_1.vi.clearAllMocks();
    index_1.vi.restoreAllMocks();
};
exports.teardownTest = teardownTest;
