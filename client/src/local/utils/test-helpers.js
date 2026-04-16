"use strict";
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
exports.MockAuthProvider = exports.createSafeFetch = exports.createMockFetch = void 0;
// Test utilities with race condition protection
var react_1 = require("react");
var createMockFetch = function (mockResponse, delay) {
    if (delay === void 0) { delay = 0; }
    return jest.fn().mockImplementation(function (url, options) {
        var controller = options === null || options === void 0 ? void 0 : options.signal;
        return new Promise(function (resolve, reject) {
            var timeoutId = setTimeout(function () {
                if (controller === null || controller === void 0 ? void 0 : controller.aborted) {
                    reject(new Error('AbortError'));
                    return;
                }
                resolve({
                    ok: true,
                    json: function () { return Promise.resolve(mockResponse); },
                    status: 200,
                    statusText: 'OK',
                });
            }, delay);
            // Handle abort signal
            if (controller) {
                controller.addEventListener('abort', function () {
                    clearTimeout(timeoutId);
                    reject(new Error('AbortError'));
                });
            }
        });
    });
};
exports.createMockFetch = createMockFetch;
var createSafeFetch = function (originalFetch) {
    return function (url, options) {
        if (options === void 0) { options = {}; }
        var controller = new AbortController();
        var timeoutId = setTimeout(function () { return controller.abort(); }, 5000);
        return originalFetch(url, __assign(__assign({}, options), { signal: options.signal || controller.signal })).finally(function () {
            clearTimeout(timeoutId);
        });
    };
};
exports.createSafeFetch = createSafeFetch;
// Mock auth provider for tests
var MockAuthProvider = function (_a) {
    var children = _a.children, _b = _a.user, user = _b === void 0 ? null : _b, _c = _a.loading, loading = _c === void 0 ? false : _c;
    var _d = react_1.default.useState(user), currentUser = _d[0], setCurrentUser = _d[1];
    var _e = react_1.default.useState(loading), isLoading = _e[0], setIsLoading = _e[1];
    react_1.default.useEffect(function () {
        var controller = new AbortController();
        if (!user && !loading) {
            // Simulate auth check with race condition protection
            fetch('/api/auth/profile', { signal: controller.signal })
                .then(function (res) { return res.json(); })
                .then(function (data) {
                if (!controller.signal.aborted && data.data) {
                    setCurrentUser(data.data);
                }
            })
                .catch(function (error) {
                if (error.name !== 'AbortError') {
                    setCurrentUser(null);
                }
            })
                .finally(function () {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });
        }
        return function () {
            controller.abort();
        };
    }, [user, loading]);
    return (<div data-testid="mock-auth-provider">
      {isLoading ? <div>Loading...</div> : children}
    </div>);
};
exports.MockAuthProvider = MockAuthProvider;
