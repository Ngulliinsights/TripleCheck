"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("@testing-library/jest-dom");
var vitest_1 = require("vitest");
var matchers = require("@testing-library/jest-dom/matchers");
var vitest_2 = require("vitest");
// Extend vitest's expect with jest-dom matchers
vitest_2.expect.extend(matchers);
// Mock ResizeObserver
global.ResizeObserver = /** @class */ (function () {
    function ResizeObserver() {
    }
    ResizeObserver.prototype.observe = function () { };
    ResizeObserver.prototype.unobserve = function () { };
    ResizeObserver.prototype.disconnect = function () { };
    return ResizeObserver;
}());
// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vitest_1.vi.fn().mockImplementation(function (query) { return ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vitest_1.vi.fn(), // deprecated
        removeListener: vitest_1.vi.fn(), // deprecated
        addEventListener: vitest_1.vi.fn(),
        removeEventListener: vitest_1.vi.fn(),
        dispatchEvent: vitest_1.vi.fn(),
    }); }),
});
// Cleanup
var react_1 = require("@testing-library/react");
var vitest_3 = require("vitest");
(0, vitest_3.afterEach)(function () {
    (0, react_1.cleanup)();
});
