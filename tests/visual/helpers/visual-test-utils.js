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
exports.COMMON_VIEWPORTS = void 0;
exports.takeVisualScreenshot = takeVisualScreenshot;
exports.testComponentStates = testComponentStates;
exports.testResponsiveDesign = testResponsiveDesign;
exports.testThemeSwitching = testThemeSwitching;
exports.testFormStates = testFormStates;
exports.testLoadingStates = testLoadingStates;
exports.testErrorStates = testErrorStates;
exports.testEmptyStates = testEmptyStates;
exports.getAllViewports = getAllViewports;
exports.getMaskSelectors = getMaskSelectors;
var test_1 = require("@playwright/test");
/**
 * Take a visual screenshot with comparison
 */
function takeVisualScreenshot(page, options) {
    return __awaiter(this, void 0, void 0, function () {
        var screenshotOptions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!options.waitFor) return [3 /*break*/, 2];
                    return [4 /*yield*/, page.waitForLoadState(options.waitFor)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (!(options.animations === 'disabled')) return [3 /*break*/, 4];
                    return [4 /*yield*/, page.addStyleTag({
                            content: "\n        *, *::before, *::after {\n          animation-duration: 0s !important;\n          animation-delay: 0s !important;\n          transition-duration: 0s !important;\n          transition-delay: 0s !important;\n        }\n      "
                        })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: 
                // Wait a bit for any remaining animations to settle
                return [4 /*yield*/, page.waitForTimeout(500)];
                case 5:
                    // Wait a bit for any remaining animations to settle
                    _a.sent();
                    screenshotOptions = {
                        animations: options.animations || 'disabled',
                        threshold: options.threshold || 0.2,
                    };
                    if (options.fullPage) {
                        screenshotOptions.fullPage = true;
                    }
                    if (options.mask) {
                        screenshotOptions.mask = options.mask;
                    }
                    if (options.clip) {
                        screenshotOptions.clip = options.clip;
                    }
                    if (!options.element) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, test_1.expect)(options.element).toHaveScreenshot("".concat(options.name, ".png"), screenshotOptions)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 7: return [4 /*yield*/, (0, test_1.expect)(page).toHaveScreenshot("".concat(options.name, ".png"), screenshotOptions)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test component across different states
 */
function testComponentStates(page, options) {
    return __awaiter(this, void 0, void 0, function () {
        var component, _i, _a, state;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    component = page.locator(options.selector);
                    // Wait for component to be visible
                    return [4 /*yield*/, (0, test_1.expect)(component).toBeVisible()];
                case 1:
                    // Wait for component to be visible
                    _b.sent();
                    if (!(options.states && options.states.length > 0)) return [3 /*break*/, 8];
                    _i = 0, _a = options.states;
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    state = _a[_i];
                    return [4 /*yield*/, state.setup(page)];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, page.waitForTimeout(300)];
                case 4:
                    _b.sent(); // Allow state to settle
                    return [4 /*yield*/, takeVisualScreenshot(page, __assign({ name: "".concat(options.name, "-").concat(state.name), element: component }, options.options))];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [3 /*break*/, 10];
                case 8: 
                // Test default state
                return [4 /*yield*/, takeVisualScreenshot(page, __assign({ name: options.name, element: component }, options.options))];
                case 9:
                    // Test default state
                    _b.sent();
                    _b.label = 10;
                case 10: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test responsive design across viewports
 */
function testResponsiveDesign(page, options) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, viewport;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _i = 0, _a = options.viewports;
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    viewport = _a[_i];
                    // Set viewport size
                    return [4 /*yield*/, page.setViewportSize({
                            width: viewport.width,
                            height: viewport.height
                        })];
                case 2:
                    // Set viewport size
                    _b.sent();
                    // Navigate to page
                    return [4 /*yield*/, page.goto(options.url)];
                case 3:
                    // Navigate to page
                    _b.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 4:
                    _b.sent();
                    // Take screenshot
                    return [4 /*yield*/, takeVisualScreenshot(page, __assign({ name: "".concat(options.baseName, "-").concat(viewport.name), fullPage: true }, options.options))];
                case 5:
                    // Take screenshot
                    _b.sent();
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test theme switching (light/dark mode)
 */
function testThemeSwitching(page, url, baseName) {
    return __awaiter(this, void 0, void 0, function () {
        var themeToggle;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, page.goto(url)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 2:
                    _a.sent();
                    // Test light theme (default)
                    return [4 /*yield*/, takeVisualScreenshot(page, {
                            name: "".concat(baseName, "-light-theme"),
                            fullPage: true,
                            waitFor: 'networkidle'
                        })];
                case 3:
                    // Test light theme (default)
                    _a.sent();
                    themeToggle = page.locator('[data-testid="theme-toggle"], button:has-text("Dark"), button:has-text("Theme")');
                    return [4 /*yield*/, themeToggle.isVisible()];
                case 4:
                    if (!_a.sent()) return [3 /*break*/, 8];
                    return [4 /*yield*/, themeToggle.click()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(500)];
                case 6:
                    _a.sent(); // Allow theme transition
                    return [4 /*yield*/, takeVisualScreenshot(page, {
                            name: "".concat(baseName, "-dark-theme"),
                            fullPage: true,
                            animations: 'disabled'
                        })];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test form states (empty, filled, error, success)
 */
function testFormStates(page, formSelector, formName) {
    return __awaiter(this, void 0, void 0, function () {
        var form, inputs, inputCount, i, input, type, tagName, options, optionCount, submitButton;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    form = page.locator(formSelector);
                    return [4 /*yield*/, (0, test_1.expect)(form).toBeVisible()];
                case 1:
                    _a.sent();
                    // Empty state
                    return [4 /*yield*/, takeVisualScreenshot(page, {
                            name: "".concat(formName, "-empty"),
                            element: form
                        })];
                case 2:
                    // Empty state
                    _a.sent();
                    inputs = form.locator('input, textarea, select');
                    return [4 /*yield*/, inputs.count()];
                case 3:
                    inputCount = _a.sent();
                    i = 0;
                    _a.label = 4;
                case 4:
                    if (!(i < inputCount)) return [3 /*break*/, 21];
                    input = inputs.nth(i);
                    return [4 /*yield*/, input.getAttribute('type')];
                case 5:
                    type = _a.sent();
                    return [4 /*yield*/, input.evaluate(function (el) { return el.tagName.toLowerCase(); })];
                case 6:
                    tagName = _a.sent();
                    if (!(type === 'email')) return [3 /*break*/, 8];
                    return [4 /*yield*/, input.fill('test@example.com')];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 20];
                case 8:
                    if (!(type === 'password')) return [3 /*break*/, 10];
                    return [4 /*yield*/, input.fill('password123')];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 20];
                case 10:
                    if (!(type === 'tel')) return [3 /*break*/, 12];
                    return [4 /*yield*/, input.fill('+254700123456')];
                case 11:
                    _a.sent();
                    return [3 /*break*/, 20];
                case 12:
                    if (!(tagName === 'select')) return [3 /*break*/, 16];
                    options = input.locator('option');
                    return [4 /*yield*/, options.count()];
                case 13:
                    optionCount = _a.sent();
                    if (!(optionCount > 1)) return [3 /*break*/, 15];
                    return [4 /*yield*/, input.selectOption({ index: 1 })];
                case 14:
                    _a.sent();
                    _a.label = 15;
                case 15: return [3 /*break*/, 20];
                case 16:
                    if (!(tagName === 'textarea')) return [3 /*break*/, 18];
                    return [4 /*yield*/, input.fill('This is a test message with some content.')];
                case 17:
                    _a.sent();
                    return [3 /*break*/, 20];
                case 18: return [4 /*yield*/, input.fill('Test Value')];
                case 19:
                    _a.sent();
                    _a.label = 20;
                case 20:
                    i++;
                    return [3 /*break*/, 4];
                case 21: return [4 /*yield*/, takeVisualScreenshot(page, {
                        name: "".concat(formName, "-filled"),
                        element: form
                    })];
                case 22:
                    _a.sent();
                    // Try to trigger validation errors
                    return [4 /*yield*/, form.locator('input').first().fill('')];
                case 23:
                    // Try to trigger validation errors
                    _a.sent();
                    submitButton = form.locator('button[type="submit"], button:has-text("Submit")');
                    return [4 /*yield*/, submitButton.isVisible()];
                case 24:
                    if (!_a.sent()) return [3 /*break*/, 28];
                    return [4 /*yield*/, submitButton.click()];
                case 25:
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(500)];
                case 26:
                    _a.sent(); // Allow validation to show
                    return [4 /*yield*/, takeVisualScreenshot(page, {
                            name: "".concat(formName, "-validation-errors"),
                            element: form
                        })];
                case 27:
                    _a.sent();
                    _a.label = 28;
                case 28: return [2 /*return*/];
            }
        });
    });
}
/**
 * Test loading states
 */
function testLoadingStates(page, url, baseName) {
    return __awaiter(this, void 0, void 0, function () {
        var loadingIndicator;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Slow down network to capture loading states
                return [4 /*yield*/, page.route('**/api/**', function (route) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                                case 1:
                                    _a.sent();
                                    route.continue();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    // Slow down network to capture loading states
                    _a.sent();
                    return [4 /*yield*/, page.goto(url)];
                case 2:
                    _a.sent();
                    loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner');
                    return [4 /*yield*/, loadingIndicator.isVisible()];
                case 3:
                    if (!_a.sent()) return [3 /*break*/, 5];
                    return [4 /*yield*/, takeVisualScreenshot(page, {
                            name: "".concat(baseName, "-loading"),
                            fullPage: true
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: 
                // Wait for content to load and capture loaded state
                return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 6:
                    // Wait for content to load and capture loaded state
                    _a.sent();
                    return [4 /*yield*/, page.unroute('**/api/**')];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, takeVisualScreenshot(page, {
                            name: "".concat(baseName, "-loaded"),
                            fullPage: true
                        })];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Test error states
 */
function testErrorStates(page, url, baseName) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Mock API errors
                return [4 /*yield*/, page.route('**/api/**', function (route) {
                        route.fulfill({
                            status: 500,
                            contentType: 'application/json',
                            body: JSON.stringify({ error: 'Internal Server Error' })
                        });
                    })];
                case 1:
                    // Mock API errors
                    _a.sent();
                    return [4 /*yield*/, page.goto(url)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.waitForTimeout(2000)];
                case 3:
                    _a.sent(); // Allow error to show
                    return [4 /*yield*/, takeVisualScreenshot(page, {
                            name: "".concat(baseName, "-error"),
                            fullPage: true
                        })];
                case 4:
                    _a.sent();
                    // Restore normal API behavior
                    return [4 /*yield*/, page.unroute('**/api/**')];
                case 5:
                    // Restore normal API behavior
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Test empty states
 */
function testEmptyStates(page, url, baseName) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Mock empty API responses
                return [4 /*yield*/, page.route('**/api/**', function (route) {
                        route.fulfill({
                            status: 200,
                            contentType: 'application/json',
                            body: JSON.stringify({ data: [], total: 0 })
                        });
                    })];
                case 1:
                    // Mock empty API responses
                    _a.sent();
                    return [4 /*yield*/, page.goto(url)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, page.waitForLoadState('networkidle')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, takeVisualScreenshot(page, {
                            name: "".concat(baseName, "-empty"),
                            fullPage: true
                        })];
                case 4:
                    _a.sent();
                    // Restore normal API behavior
                    return [4 /*yield*/, page.unroute('**/api/**')];
                case 5:
                    // Restore normal API behavior
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Common viewport configurations for responsive testing
 */
exports.COMMON_VIEWPORTS = {
    mobile: [
        { name: 'mobile-portrait', width: 375, height: 667 },
        { name: 'mobile-landscape', width: 667, height: 375 },
    ],
    tablet: [
        { name: 'tablet-portrait', width: 768, height: 1024 },
        { name: 'tablet-landscape', width: 1024, height: 768 },
    ],
    desktop: [
        { name: 'desktop-small', width: 1366, height: 768 },
        { name: 'desktop-large', width: 1920, height: 1080 },
        { name: 'desktop-wide', width: 2560, height: 1440 },
    ]
};
/**
 * Get all viewports for comprehensive testing
 */
function getAllViewports() {
    return __spreadArray(__spreadArray(__spreadArray([], exports.COMMON_VIEWPORTS.mobile, true), exports.COMMON_VIEWPORTS.tablet, true), exports.COMMON_VIEWPORTS.desktop, true);
}
/**
 * Mask dynamic content that changes between test runs
 */
function getMaskSelectors(page) {
    return [
        // Timestamps
        page.locator('[data-testid="timestamp"], .timestamp, time'),
        // Counters and dynamic numbers
        page.locator('[data-testid="counter"], .counter'),
        // User avatars (if they contain dynamic content)
        page.locator('[data-testid="avatar"] img'),
        // Live data indicators
        page.locator('[data-testid="live-indicator"], .live-indicator'),
        // Random IDs or generated content
        page.locator('[data-testid="random-id"], .random-content'),
    ];
}
