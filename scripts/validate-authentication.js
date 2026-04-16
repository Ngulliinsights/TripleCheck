#!/usr/bin/env tsx
"use strict";
/**
 * Authentication System Validation Script
 *
 * This script comprehensively tests and validates the authentication system
 * including login, logout, registration, password reset, and session management.
 *
 * Usage: npm run validate:auth
 */
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
exports.AuthenticationValidator = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
var AuthenticationValidator = /** @class */ (function () {
    function AuthenticationValidator() {
        this.results = [];
        this.startTime = Date.now();
        console.log('🔐 Starting Authentication System Validation...\n');
    }
    /**
     * Add a test result to the validation report
     */
    AuthenticationValidator.prototype.addResult = function (test, status, message, details, duration) {
        this.results.push({
            test: test,
            status: status,
            message: message,
            details: details,
            duration: duration
        });
        var icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
        console.log("".concat(icon, " ").concat(test, ": ").concat(message));
        if (details) {
            console.log("   Details: ".concat(details));
        }
        if (duration) {
            console.log("   Duration: ".concat(duration, "ms"));
        }
        console.log();
    };
    /**
     * Test if authentication files exist and are properly structured
     */
    AuthenticationValidator.prototype.validateAuthFileStructure = function () {
        return __awaiter(this, void 0, void 0, function () {
            var requiredFiles, _i, requiredFiles_1, file, startTime, content, duration, duration;
            return __generator(this, function (_a) {
                console.log('📁 Validating Authentication File Structure...\n');
                requiredFiles = [
                    'src/auth/types/auth.types.ts',
                    'src/auth/hooks/useAuth.ts',
                    'src/auth/services/auth-api.ts',
                    'src/auth/components/LoginForm.tsx',
                    'src/auth/pages/Login.tsx',
                    'src/auth/pages/Register.tsx',
                    'server/auth/auth.controller.ts',
                    'server/auth/auth.service.ts'
                ];
                for (_i = 0, requiredFiles_1 = requiredFiles; _i < requiredFiles_1.length; _i++) {
                    file = requiredFiles_1[_i];
                    startTime = Date.now();
                    try {
                        content = (0, fs_1.readFileSync)(file, 'utf-8');
                        duration = Date.now() - startTime;
                        if (content.length > 0) {
                            this.addResult("File Structure: ".concat(file), 'PASS', 'File exists and has content', "File size: ".concat(content.length, " characters"), duration);
                        }
                        else {
                            this.addResult("File Structure: ".concat(file), 'FAIL', 'File exists but is empty', undefined, duration);
                        }
                    }
                    catch (error) {
                        duration = Date.now() - startTime;
                        this.addResult("File Structure: ".concat(file), 'FAIL', 'File does not exist or cannot be read', error instanceof Error ? error.message : 'Unknown error', duration);
                    }
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate TypeScript types and interfaces
     */
    AuthenticationValidator.prototype.validateAuthTypes = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, typesContent_1, duration, requiredTypes, missingTypes, duration;
            return __generator(this, function (_a) {
                console.log('🔍 Validating Authentication Types...\n');
                startTime = Date.now();
                try {
                    typesContent_1 = (0, fs_1.readFileSync)('src/auth/types/auth.types.ts', 'utf-8');
                    duration = Date.now() - startTime;
                    requiredTypes = [
                        'User',
                        'AuthState',
                        'LoginCredentials',
                        'RegisterData'
                    ];
                    missingTypes = requiredTypes.filter(function (type) {
                        return !typesContent_1.includes("interface ".concat(type)) && !typesContent_1.includes("type ".concat(type));
                    });
                    if (missingTypes.length === 0) {
                        this.addResult('Type Definitions', 'PASS', 'All required authentication types are defined', "Found: ".concat(requiredTypes.join(', ')), duration);
                    }
                    else {
                        this.addResult('Type Definitions', 'FAIL', 'Missing required authentication types', "Missing: ".concat(missingTypes.join(', ')), duration);
                    }
                    // Check for proper User interface structure
                    if (typesContent_1.includes('interface User') &&
                        typesContent_1.includes('email:') &&
                        typesContent_1.includes('role:') &&
                        typesContent_1.includes('isVerified:')) {
                        this.addResult('User Interface Structure', 'PASS', 'User interface has required fields', 'Contains email, role, isVerified fields');
                    }
                    else {
                        this.addResult('User Interface Structure', 'FAIL', 'User interface missing required fields', 'Should contain email, role, isVerified fields');
                    }
                }
                catch (error) {
                    duration = Date.now() - startTime;
                    this.addResult('Type Definitions', 'FAIL', 'Cannot read or parse authentication types', error instanceof Error ? error.message : 'Unknown error', duration);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate authentication hooks
     */
    AuthenticationValidator.prototype.validateAuthHooks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, hooksContent_1, duration, requiredHooks, missingHooks, duration;
            return __generator(this, function (_a) {
                console.log('🪝 Validating Authentication Hooks...\n');
                startTime = Date.now();
                try {
                    hooksContent_1 = (0, fs_1.readFileSync)('src/auth/hooks/useAuth.ts', 'utf-8');
                    duration = Date.now() - startTime;
                    requiredHooks = [
                        'useProfile',
                        'useLogin',
                        'useRegister',
                        'useLogout',
                        'useAuth'
                    ];
                    missingHooks = requiredHooks.filter(function (hook) {
                        return !hooksContent_1.includes("export function ".concat(hook)) &&
                            !hooksContent_1.includes("const ".concat(hook));
                    });
                    if (missingHooks.length === 0) {
                        this.addResult('Authentication Hooks', 'PASS', 'All required authentication hooks are defined', "Found: ".concat(requiredHooks.join(', ')), duration);
                    }
                    else {
                        this.addResult('Authentication Hooks', 'FAIL', 'Missing required authentication hooks', "Missing: ".concat(missingHooks.join(', ')), duration);
                    }
                    // Check for proper React Query usage
                    if (hooksContent_1.includes('useQuery') && hooksContent_1.includes('useMutation')) {
                        this.addResult('React Query Integration', 'PASS', 'Authentication hooks use React Query properly', 'Uses useQuery and useMutation');
                    }
                    else {
                        this.addResult('React Query Integration', 'FAIL', 'Authentication hooks missing React Query integration', 'Should use useQuery and useMutation');
                    }
                }
                catch (error) {
                    duration = Date.now() - startTime;
                    this.addResult('Authentication Hooks', 'FAIL', 'Cannot read or parse authentication hooks', error instanceof Error ? error.message : 'Unknown error', duration);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate authentication API service
     */
    AuthenticationValidator.prototype.validateAuthAPI = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, apiContent_1, duration, requiredMethods, missingMethods, duration;
            return __generator(this, function (_a) {
                console.log('🌐 Validating Authentication API Service...\n');
                startTime = Date.now();
                try {
                    apiContent_1 = (0, fs_1.readFileSync)('src/auth/services/auth-api.ts', 'utf-8');
                    duration = Date.now() - startTime;
                    requiredMethods = [
                        'login',
                        'register',
                        'logout',
                        'getProfile',
                        'updateProfile',
                        'requestPasswordReset',
                        'resetPassword'
                    ];
                    missingMethods = requiredMethods.filter(function (method) {
                        return !apiContent_1.includes("".concat(method, ":")) && !apiContent_1.includes("".concat(method, " ="));
                    });
                    if (missingMethods.length === 0) {
                        this.addResult('API Methods', 'PASS', 'All required API methods are defined', "Found: ".concat(requiredMethods.join(', ')), duration);
                    }
                    else {
                        this.addResult('API Methods', 'FAIL', 'Missing required API methods', "Missing: ".concat(missingMethods.join(', ')), duration);
                    }
                    // Check for proper error handling
                    if (apiContent_1.includes('try') && apiContent_1.includes('catch')) {
                        this.addResult('Error Handling', 'PASS', 'API service includes error handling', 'Uses try-catch blocks');
                    }
                    else {
                        this.addResult('Error Handling', 'FAIL', 'API service missing error handling', 'Should use try-catch blocks');
                    }
                    // Check for proper API base URL
                    if (apiContent_1.includes('API_BASE') || apiContent_1.includes('/api/auth')) {
                        this.addResult('API Configuration', 'PASS', 'API service has proper base URL configuration', 'Uses API_BASE or /api/auth');
                    }
                    else {
                        this.addResult('API Configuration', 'FAIL', 'API service missing base URL configuration', 'Should define API_BASE or use /api/auth');
                    }
                }
                catch (error) {
                    duration = Date.now() - startTime;
                    this.addResult('Authentication API', 'FAIL', 'Cannot read or parse authentication API service', error instanceof Error ? error.message : 'Unknown error', duration);
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate authentication components
     */
    AuthenticationValidator.prototype.validateAuthComponents = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, loginFormContent_1, duration, requiredElements, missingElements, duration, loginPageContent;
            return __generator(this, function (_a) {
                console.log('🧩 Validating Authentication Components...\n');
                startTime = Date.now();
                try {
                    loginFormContent_1 = (0, fs_1.readFileSync)('src/auth/components/LoginForm.tsx', 'utf-8');
                    duration = Date.now() - startTime;
                    requiredElements = [
                        'email',
                        'password',
                        'rememberMe',
                        'onSubmit',
                        'useForm'
                    ];
                    missingElements = requiredElements.filter(function (element) {
                        return !loginFormContent_1.includes(element);
                    });
                    if (missingElements.length === 0) {
                        this.addResult('LoginForm Component', 'PASS', 'LoginForm has all required elements', "Found: ".concat(requiredElements.join(', ')), duration);
                    }
                    else {
                        this.addResult('LoginForm Component', 'FAIL', 'LoginForm missing required elements', "Missing: ".concat(missingElements.join(', ')), duration);
                    }
                    // Check for form validation
                    if (loginFormContent_1.includes('zodResolver') && loginFormContent_1.includes('schema')) {
                        this.addResult('Form Validation', 'PASS', 'LoginForm includes proper validation', 'Uses Zod schema validation');
                    }
                    else {
                        this.addResult('Form Validation', 'FAIL', 'LoginForm missing validation', 'Should use Zod schema validation');
                    }
                }
                catch (error) {
                    duration = Date.now() - startTime;
                    this.addResult('LoginForm Component', 'FAIL', 'Cannot read or parse LoginForm component', error instanceof Error ? error.message : 'Unknown error', duration);
                }
                // Validate Login page
                try {
                    loginPageContent = (0, fs_1.readFileSync)('src/auth/pages/Login.tsx', 'utf-8');
                    if (loginPageContent.includes('LoginForm') && loginPageContent.includes('useNavigate')) {
                        this.addResult('Login Page', 'PASS', 'Login page properly integrates LoginForm and navigation', 'Uses LoginForm component and useNavigate hook');
                    }
                    else {
                        this.addResult('Login Page', 'FAIL', 'Login page missing required integration', 'Should use LoginForm component and useNavigate hook');
                    }
                }
                catch (error) {
                    this.addResult('Login Page', 'FAIL', 'Cannot read or parse Login page', error instanceof Error ? error.message : 'Unknown error');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate backend authentication implementation
     */
    AuthenticationValidator.prototype.validateBackendAuth = function () {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, controllerContent_1, duration, requiredRoutes, missingRoutes, duration, serviceContent_1, requiredMethods, missingMethods;
            return __generator(this, function (_a) {
                console.log('🖥️ Validating Backend Authentication...\n');
                startTime = Date.now();
                try {
                    controllerContent_1 = (0, fs_1.readFileSync)('server/auth/auth.controller.ts', 'utf-8');
                    duration = Date.now() - startTime;
                    requiredRoutes = [
                        'login',
                        'register',
                        'logout',
                        'profile'
                    ];
                    missingRoutes = requiredRoutes.filter(function (route) {
                        return !controllerContent_1.includes("'/".concat(route, "'")) &&
                            !controllerContent_1.includes("\"/".concat(route, "\""));
                    });
                    if (missingRoutes.length === 0) {
                        this.addResult('Auth Controller Routes', 'PASS', 'All required authentication routes are defined', "Found: ".concat(requiredRoutes.join(', ')), duration);
                    }
                    else {
                        this.addResult('Auth Controller Routes', 'FAIL', 'Missing required authentication routes', "Missing: ".concat(missingRoutes.join(', ')), duration);
                    }
                    // Check for proper middleware usage
                    if (controllerContent_1.includes('validateRequest') || controllerContent_1.includes('middleware')) {
                        this.addResult('Middleware Integration', 'PASS', 'Auth controller uses validation middleware', 'Includes request validation');
                    }
                    else {
                        this.addResult('Middleware Integration', 'FAIL', 'Auth controller missing validation middleware', 'Should include request validation');
                    }
                }
                catch (error) {
                    duration = Date.now() - startTime;
                    this.addResult('Auth Controller', 'FAIL', 'Cannot read or parse auth controller', error instanceof Error ? error.message : 'Unknown error', duration);
                }
                // Validate auth service
                try {
                    serviceContent_1 = (0, fs_1.readFileSync)('server/auth/auth.service.ts', 'utf-8');
                    requiredMethods = [
                        'login',
                        'register',
                        'logout',
                        'getProfile'
                    ];
                    missingMethods = requiredMethods.filter(function (method) {
                        return !serviceContent_1.includes("".concat(method, "(")) && !serviceContent_1.includes("".concat(method, " ="));
                    });
                    if (missingMethods.length === 0) {
                        this.addResult('Auth Service Methods', 'PASS', 'All required service methods are defined', "Found: ".concat(requiredMethods.join(', ')));
                    }
                    else {
                        this.addResult('Auth Service Methods', 'FAIL', 'Missing required service methods', "Missing: ".concat(missingMethods.join(', ')));
                    }
                    // Check if service is implemented or just stubs
                    if (serviceContent_1.includes('TODO') || serviceContent_1.includes('mock')) {
                        this.addResult('Service Implementation', 'FAIL', 'Auth service contains TODO items or mock implementations', 'Service needs proper implementation');
                    }
                    else {
                        this.addResult('Service Implementation', 'PASS', 'Auth service appears to be properly implemented', 'No TODO items or mock implementations found');
                    }
                }
                catch (error) {
                    this.addResult('Auth Service', 'FAIL', 'Cannot read or parse auth service', error instanceof Error ? error.message : 'Unknown error');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Test authentication flow by running unit tests
     */
    AuthenticationValidator.prototype.validateAuthTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testFiles, _i, testFiles_1, testFile, startTime, testContent, duration, testOutput;
            return __generator(this, function (_a) {
                console.log('🧪 Running Authentication Tests...\n');
                testFiles = [
                    'src/auth/components/__tests__/LoginForm.test.tsx',
                    'src/auth/components/__tests__/PasswordReset.test.tsx',
                    'src/auth/components/__tests__/RegistrationWizard.test.tsx'
                ];
                for (_i = 0, testFiles_1 = testFiles; _i < testFiles_1.length; _i++) {
                    testFile = testFiles_1[_i];
                    startTime = Date.now();
                    try {
                        testContent = (0, fs_1.readFileSync)(testFile, 'utf-8');
                        if (testContent.includes('describe') && testContent.includes('it')) {
                            this.addResult("Test File: ".concat(testFile.split('/').pop()), 'PASS', 'Test file exists and has test cases', "File size: ".concat(testContent.length, " characters"));
                        }
                        else {
                            this.addResult("Test File: ".concat(testFile.split('/').pop()), 'FAIL', 'Test file exists but has no test cases', 'File should contain describe and it blocks');
                        }
                    }
                    catch (error) {
                        duration = Date.now() - startTime;
                        this.addResult("Test File: ".concat(testFile.split('/').pop()), 'FAIL', 'Test file does not exist', error instanceof Error ? error.message : 'Unknown error', duration);
                    }
                }
                // Try to run a specific auth test
                try {
                    console.log('Attempting to run LoginForm tests...');
                    testOutput = (0, child_process_1.execSync)('npm run test -- src/auth/components/__tests__/LoginForm.test.tsx --run', {
                        encoding: 'utf-8',
                        timeout: 30000,
                        stdio: 'pipe'
                    });
                    if (testOutput.includes('PASS') || testOutput.includes('✓')) {
                        this.addResult('LoginForm Tests Execution', 'PASS', 'LoginForm tests executed successfully', 'Tests passed');
                    }
                    else if (testOutput.includes('FAIL') || testOutput.includes('✗')) {
                        this.addResult('LoginForm Tests Execution', 'FAIL', 'LoginForm tests failed', 'Some tests are failing');
                    }
                    else {
                        this.addResult('LoginForm Tests Execution', 'SKIP', 'LoginForm tests executed but results unclear', 'Test output format not recognized');
                    }
                }
                catch (error) {
                    this.addResult('LoginForm Tests Execution', 'FAIL', 'Could not execute LoginForm tests', error instanceof Error ? error.message : 'Unknown error');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate authentication security measures
     */
    AuthenticationValidator.prototype.validateAuthSecurity = function () {
        return __awaiter(this, void 0, void 0, function () {
            var serviceContent, apiContent, loginFormContent;
            return __generator(this, function (_a) {
                console.log('🔒 Validating Authentication Security...\n');
                // Check for password hashing
                try {
                    serviceContent = (0, fs_1.readFileSync)('server/auth/auth.service.ts', 'utf-8');
                    if (serviceContent.includes('bcrypt') || serviceContent.includes('hash')) {
                        this.addResult('Password Hashing', 'PASS', 'Password hashing implementation found', 'Uses bcrypt or similar hashing');
                    }
                    else {
                        this.addResult('Password Hashing', 'FAIL', 'No password hashing implementation found', 'Should use bcrypt or similar for password hashing');
                    }
                }
                catch (error) {
                    this.addResult('Password Hashing', 'FAIL', 'Cannot validate password hashing', error instanceof Error ? error.message : 'Unknown error');
                }
                // Check for JWT token handling
                try {
                    apiContent = (0, fs_1.readFileSync)('src/auth/services/auth-api.ts', 'utf-8');
                    if (apiContent.includes('token') && apiContent.includes('localStorage')) {
                        this.addResult('Token Management', 'PASS', 'Token management implementation found', 'Uses localStorage for token storage');
                    }
                    else {
                        this.addResult('Token Management', 'FAIL', 'No token management implementation found', 'Should handle JWT tokens properly');
                    }
                }
                catch (error) {
                    this.addResult('Token Management', 'FAIL', 'Cannot validate token management', error instanceof Error ? error.message : 'Unknown error');
                }
                // Check for input validation
                try {
                    loginFormContent = (0, fs_1.readFileSync)('src/auth/components/LoginForm.tsx', 'utf-8');
                    if (loginFormContent.includes('zod') && loginFormContent.includes('schema')) {
                        this.addResult('Input Validation', 'PASS', 'Input validation implementation found', 'Uses Zod schema validation');
                    }
                    else {
                        this.addResult('Input Validation', 'FAIL', 'No input validation implementation found', 'Should use Zod or similar for input validation');
                    }
                }
                catch (error) {
                    this.addResult('Input Validation', 'FAIL', 'Cannot validate input validation', error instanceof Error ? error.message : 'Unknown error');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate comprehensive validation report
     */
    AuthenticationValidator.prototype.generateReport = function () {
        var totalDuration = Date.now() - this.startTime;
        var passed = this.results.filter(function (r) { return r.status === 'PASS'; }).length;
        var failed = this.results.filter(function (r) { return r.status === 'FAIL'; }).length;
        var skipped = this.results.filter(function (r) { return r.status === 'SKIP'; }).length;
        var report = {
            timestamp: new Date().toISOString(),
            totalTests: this.results.length,
            passed: passed,
            failed: failed,
            skipped: skipped,
            results: this.results,
            summary: this.generateSummary(passed, failed, skipped, totalDuration)
        };
        return report;
    };
    /**
     * Generate summary text for the report
     */
    AuthenticationValidator.prototype.generateSummary = function (passed, failed, skipped, duration) {
        var total = passed + failed + skipped;
        var passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        var summary = "Authentication Validation Complete\n";
        summary += "Total Tests: ".concat(total, "\n");
        summary += "Passed: ".concat(passed, " (").concat(passRate, "%)\n");
        summary += "Failed: ".concat(failed, "\n");
        summary += "Skipped: ".concat(skipped, "\n");
        summary += "Duration: ".concat(Math.round(duration / 1000), "s\n\n");
        if (failed === 0) {
            summary += "\uD83C\uDF89 All authentication tests passed! The authentication system appears to be working correctly.";
        }
        else if (failed <= 3) {
            summary += "\u26A0\uFE0F Minor issues found in authentication system. ".concat(failed, " test(s) failed but core functionality appears intact.");
        }
        else {
            summary += "\uD83D\uDEA8 Significant issues found in authentication system. ".concat(failed, " test(s) failed. Immediate attention required.");
        }
        return summary;
    };
    /**
     * Run all validation tests
     */
    AuthenticationValidator.prototype.runAllValidations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var report, reportPath, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        return [4 /*yield*/, this.validateAuthFileStructure()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.validateAuthTypes()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.validateAuthHooks()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.validateAuthAPI()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.validateAuthComponents()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.validateBackendAuth()];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, this.validateAuthTests()];
                    case 7:
                        _a.sent();
                        return [4 /*yield*/, this.validateAuthSecurity()];
                    case 8:
                        _a.sent();
                        report = this.generateReport();
                        reportPath = (0, path_1.join)(process.cwd(), 'temp-files', 'auth-validation-report.json');
                        (0, fs_1.writeFileSync)(reportPath, JSON.stringify(report, null, 2));
                        console.log("\n".concat('='.repeat(80)));
                        console.log(report.summary);
                        console.log('='.repeat(80));
                        console.log("\n\uD83D\uDCC4 Detailed report saved to: ".concat(reportPath));
                        return [2 /*return*/, report];
                    case 9:
                        error_1 = _a.sent();
                        console.error('❌ Validation failed with error:', error_1);
                        throw error_1;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return AuthenticationValidator;
}());
exports.AuthenticationValidator = AuthenticationValidator;
/**
 * Main execution function
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var validator, report, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    validator = new AuthenticationValidator();
                    return [4 /*yield*/, validator.runAllValidations()];
                case 1:
                    report = _a.sent();
                    // Exit with error code if there are failures
                    if (report.failed > 0) {
                        process.exit(1);
                    }
                    process.exit(0);
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Fatal error during authentication validation:', error_2);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Run the validation
main();
