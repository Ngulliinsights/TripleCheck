"use strict";
/**
 * Test Setup Configuration
 * Global test setup and configuration
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../src/shared/test-utils/index");
var TestUtils_1 = require("../src/local/testing/TestUtils");
// Global test setup
(0, index_1.beforeAll)(function () {
    // Set test environment
    process.env.NODE_ENV = 'test';
    // Mock console methods to reduce noise
    global.console = __assign(__assign({}, console), { warn: vi.fn(), error: vi.fn(), log: vi.fn() });
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(function (query) { return ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }); }),
    });
    // Mock window.scrollTo
    Object.defineProperty(window, 'scrollTo', {
        value: vi.fn(),
        writable: true,
    });
    // Mock window.location
    delete window.location;
    window.location = __assign(__assign({}, window.location), { assign: vi.fn(), replace: vi.fn(), reload: vi.fn(), href: 'http://localhost:3000', origin: 'http://localhost:3000', pathname: '/', search: '', hash: '' });
    // Mock fetch globally
    global.fetch = vi.fn();
    // Mock Image constructor
    global.Image = /** @class */ (function () {
        function class_1() {
            var _this = this;
            this.onload = null;
            this.onerror = null;
            this.src = '';
            setTimeout(function () {
                var _a;
                (_a = _this.onload) === null || _a === void 0 ? void 0 : _a.call(_this);
            }, 0);
        }
        return class_1;
    }());
    // Mock URL constructor
    global.URL = /** @class */ (function () {
        function class_2(url) {
            this.pathname = '';
            this.search = '';
            this.hash = '';
            var parts = url.split('/');
            this.pathname = '/' + parts.slice(3).join('/');
        }
        return class_2;
    }());
    // Mock crypto for UUID generation
    Object.defineProperty(global, 'crypto', {
        value: {
            randomUUID: function () { return 'test-uuid-' + Math.random().toString(36).substr(2, 9); },
            getRandomValues: function (arr) {
                for (var i = 0; i < arr.length; i++) {
                    arr[i] = Math.floor(Math.random() * 256);
                }
                return arr;
            },
        },
    });
});
// Setup before each test
(0, index_1.beforeEach)(function () {
    (0, TestUtils_1.setupTest)();
});
// Cleanup after each test
(0, index_1.afterEach)(function () {
    (0, TestUtils_1.teardownTest)();
});
// Global cleanup
(0, index_1.afterAll)(function () {
    vi.clearAllMocks();
    vi.restoreAllMocks();
});
