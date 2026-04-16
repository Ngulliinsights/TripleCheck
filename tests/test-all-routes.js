"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
// Comprehensive test to find ALL 404 errors in lazy routes
var dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
// Mock import.meta.env for components that need it
globalThis.importMeta = {
    env: {
        VITE_DEMO_USER_PASSWORD: process.env.VITE_DEMO_USER_PASSWORD || 'demo123',
        VITE_DEMO_AGENT_PASSWORD: process.env.VITE_DEMO_AGENT_PASSWORD || 'agent123',
        VITE_GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY || 'test-key',
    }
};
function testAllRoutes() {
    return __awaiter(this, void 0, void 0, function () {
        var lazyRoutes, routes, routeNames, results, _i, routeNames_1, routeName, RouteComponent, payload, loadError_1, error_1, fileNotFoundErrors, runtimeErrors, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔍 Testing ALL routes for 404 errors...\n');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 12, , 13]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./src/app/lazy-routes'); })];
                case 2:
                    lazyRoutes = _a.sent();
                    if (!lazyRoutes.WorkingRoutes) {
                        console.log('❌ WorkingRoutes not found in lazy-routes module');
                        return [2 /*return*/];
                    }
                    routes = lazyRoutes.WorkingRoutes;
                    routeNames = Object.keys(routes);
                    console.log("\uD83D\uDCCA Found ".concat(routeNames.length, " routes to test\n"));
                    results = {
                        success: [],
                        failed: [],
                        comingSoon: [],
                    };
                    _i = 0, routeNames_1 = routeNames;
                    _a.label = 3;
                case 3:
                    if (!(_i < routeNames_1.length)) return [3 /*break*/, 11];
                    routeName = routeNames_1[_i];
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 9, , 10]);
                    RouteComponent = routes[routeName];
                    if (!RouteComponent) {
                        results.failed.push({
                            name: routeName,
                            error: 'Route component is undefined',
                            isFileNotFound: false
                        });
                        return [3 /*break*/, 10];
                    }
                    // Try to render the component to trigger lazy loading
                    console.log("Testing ".concat(routeName, "..."));
                    if (!(RouteComponent && typeof RouteComponent === 'object' && '_payload' in RouteComponent)) return [3 /*break*/, 8];
                    payload = RouteComponent._payload;
                    if (!(payload && typeof payload._result === 'undefined')) return [3 /*break*/, 8];
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, RouteComponent._init(RouteComponent._payload)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    loadError_1 = _a.sent();
                    if (loadError_1.message.includes('Cannot resolve module') ||
                        loadError_1.message.includes('Module not found') ||
                        loadError_1.message.includes('Failed to resolve')) {
                        results.failed.push({
                            name: routeName,
                            error: loadError_1.message,
                            isFileNotFound: true
                        });
                        console.log("\u274C ".concat(routeName, ": 404 - ").concat(loadError_1.message));
                        return [3 /*break*/, 10];
                    }
                    else {
                        // Other error (like environment variables, etc.)
                        results.failed.push({
                            name: routeName,
                            error: loadError_1.message,
                            isFileNotFound: false
                        });
                        console.log("\u26A0\uFE0F  ".concat(routeName, ": Runtime error - ").concat(loadError_1.message));
                        return [3 /*break*/, 10];
                    }
                    return [3 /*break*/, 8];
                case 8:
                    results.success.push(routeName);
                    console.log("\u2705 ".concat(routeName, ": OK"));
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _a.sent();
                    if (error_1.message.includes('Cannot resolve module') ||
                        error_1.message.includes('Module not found') ||
                        error_1.message.includes('Failed to resolve')) {
                        results.failed.push({
                            name: routeName,
                            error: error_1.message,
                            isFileNotFound: true
                        });
                        console.log("\u274C ".concat(routeName, ": 404 - ").concat(error_1.message));
                    }
                    else {
                        results.failed.push({
                            name: routeName,
                            error: error_1.message,
                            isFileNotFound: false
                        });
                        console.log("\u26A0\uFE0F  ".concat(routeName, ": Runtime error - ").concat(error_1.message));
                    }
                    return [3 /*break*/, 10];
                case 10:
                    _i++;
                    return [3 /*break*/, 3];
                case 11:
                    // Summary
                    console.log('\n' + '='.repeat(60));
                    console.log('📋 SUMMARY');
                    console.log('='.repeat(60));
                    console.log("\u2705 Successful: ".concat(results.success.length));
                    console.log("\u274C Failed: ".concat(results.failed.length));
                    fileNotFoundErrors = results.failed.filter(function (f) { return f.isFileNotFound; });
                    runtimeErrors = results.failed.filter(function (f) { return !f.isFileNotFound; });
                    console.log("\uD83D\uDEAB 404 Errors (File Not Found): ".concat(fileNotFoundErrors.length));
                    console.log("\u26A0\uFE0F  Runtime Errors: ".concat(runtimeErrors.length));
                    if (fileNotFoundErrors.length > 0) {
                        console.log('\n🚫 404 ERRORS (Missing Files):');
                        console.log('-'.repeat(40));
                        fileNotFoundErrors.forEach(function (error) {
                            console.log("\u274C ".concat(error.name, ": ").concat(error.error));
                        });
                    }
                    if (runtimeErrors.length > 0) {
                        console.log('\n⚠️  RUNTIME ERRORS:');
                        console.log('-'.repeat(40));
                        runtimeErrors.forEach(function (error) {
                            console.log("\u26A0\uFE0F  ".concat(error.name, ": ").concat(error.error));
                        });
                    }
                    if (results.success.length > 0) {
                        console.log('\n✅ SUCCESSFUL ROUTES:');
                        console.log('-'.repeat(40));
                        results.success.forEach(function (name) {
                            console.log("\u2705 ".concat(name));
                        });
                    }
                    return [3 /*break*/, 13];
                case 12:
                    error_2 = _a.sent();
                    console.log("\u274C Failed to load lazy-routes module: ".concat(error_2.message));
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
testAllRoutes().catch(console.error);
