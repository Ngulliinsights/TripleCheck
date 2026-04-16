"use strict";
/**
 * Security Audit Plugin
 *
 * Analyzes security vulnerabilities in UI components and interactions
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
exports.SecurityPlugin = void 0;
var SecurityPlugin = /** @class */ (function () {
    function SecurityPlugin() {
        this.name = 'security-audit';
        this.version = '1.0.0';
        this.description = 'Security vulnerability analysis for UI components';
        this.knownVulnerablePackages = new Set();
    }
    SecurityPlugin.prototype.initialize = function (config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.config = config;
                console.log('🔒 Initializing Security Plugin...');
                // Load known vulnerable packages (would fetch from security databases)
                this.knownVulnerablePackages = new Set([
                    'lodash@4.17.20', // Example vulnerable version
                    'moment@2.29.1', // Example vulnerable version
                    'axios@0.21.0' // Example vulnerable version
                ]);
                console.log('✅ Security vulnerability database loaded');
                return [2 /*return*/];
            });
        });
    };
    SecurityPlugin.prototype.scan = function (elements) {
        return __awaiter(this, void 0, void 0, function () {
            var results, _i, elements_1, element, findings, securityContext, riskScore;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\uD83D\uDD12 Running security analysis on ".concat(elements.length, " elements..."));
                        results = [];
                        _i = 0, elements_1 = elements;
                        _a.label = 1;
                    case 1:
                        if (!(_i < elements_1.length)) return [3 /*break*/, 4];
                        element = elements_1[_i];
                        return [4 /*yield*/, this.analyzeElementSecurity(element)];
                    case 2:
                        findings = _a.sent();
                        if (findings.length > 0) {
                            securityContext = this.analyzeSecurityContext(element);
                            riskScore = this.calculateRiskScore(findings, securityContext);
                            results.push({
                                pluginName: this.name,
                                elementId: element.id || 'unknown',
                                findings: findings,
                                metadata: {
                                    riskScore: riskScore,
                                    securityContext: securityContext,
                                    vulnerabilities: this.extractVulnerabilities(findings),
                                    recommendations: this.generateSecurityRecommendations(element, findings)
                                }
                            });
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        console.log("\u2705 Security analysis complete. Found issues in ".concat(results.length, " elements"));
                        return [2 /*return*/, results];
                }
            });
        });
    };
    SecurityPlugin.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🧹 Cleaning up Security Plugin...');
                return [2 /*return*/];
            });
        });
    };
    SecurityPlugin.prototype.analyzeElementSecurity = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var findings, _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0:
                        findings = [];
                        // Check for XSS vulnerabilities
                        _b = (_a = findings).push;
                        return [4 /*yield*/, this.checkXSSVulnerabilities(element)];
                    case 1:
                        // Check for XSS vulnerabilities
                        _b.apply(_a, [_s.sent()]);
                        // Check for CSRF protection
                        _d = (_c = findings).push;
                        return [4 /*yield*/, this.checkCSRFProtection(element)];
                    case 2:
                        // Check for CSRF protection
                        _d.apply(_c, [_s.sent()]);
                        // Check for injection vulnerabilities
                        _f = (_e = findings).push;
                        return [4 /*yield*/, this.checkInjectionVulnerabilities(element)];
                    case 3:
                        // Check for injection vulnerabilities
                        _f.apply(_e, [_s.sent()]);
                        // Check for data exposure
                        _h = (_g = findings).push;
                        return [4 /*yield*/, this.checkDataExposure(element)];
                    case 4:
                        // Check for data exposure
                        _h.apply(_g, [_s.sent()]);
                        // Check for authentication bypass
                        _k = (_j = findings).push;
                        return [4 /*yield*/, this.checkAuthenticationBypass(element)];
                    case 5:
                        // Check for authentication bypass
                        _k.apply(_j, [_s.sent()]);
                        // Check for insecure transport
                        _m = (_l = findings).push;
                        return [4 /*yield*/, this.checkInsecureTransport(element)];
                    case 6:
                        // Check for insecure transport
                        _m.apply(_l, [_s.sent()]);
                        // Check for vulnerable dependencies
                        _p = (_o = findings).push;
                        return [4 /*yield*/, this.checkVulnerableDependencies(element)];
                    case 7:
                        // Check for vulnerable dependencies
                        _p.apply(_o, [_s.sent()]);
                        if (!(element.type === 'input' && element.props.type === 'file')) return [3 /*break*/, 9];
                        _r = (_q = findings).push;
                        return [4 /*yield*/, this.checkFileUploadSecurity(element)];
                    case 8:
                        _r.apply(_q, [_s.sent()]);
                        _s.label = 9;
                    case 9: return [2 /*return*/, findings.filter(function (f) { return f !== null; })];
                }
            });
        });
    };
    SecurityPlugin.prototype.checkXSSVulnerabilities = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var handlesUserInput, rendersUserContent, hasEval;
            var _a, _b;
            return __generator(this, function (_c) {
                // Check for dangerous innerHTML usage
                if (element.props.dangerouslySetInnerHTML) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'Critical: Component uses dangerouslySetInnerHTML without sanitization',
                            suggestion: 'Sanitize HTML content or use safe alternatives like textContent',
                            autoFixAvailable: false
                        }];
                }
                handlesUserInput = element.type === 'input' ||
                    element.type === 'textarea' ||
                    element.props.contentEditable;
                rendersUserContent = ((_a = element.props.children) === null || _a === void 0 ? void 0 : _a.toString().includes('user')) ||
                    ((_b = element.props.value) === null || _b === void 0 ? void 0 : _b.toString().includes('user'));
                if (handlesUserInput && rendersUserContent) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'High: Potential XSS vulnerability - user input rendered without sanitization',
                            suggestion: 'Implement proper input sanitization and output encoding',
                            autoFixAvailable: false
                        }];
                }
                hasEval = (element.handlers || []).some(function (h) {
                    var _a;
                    return h.handlerName.includes('eval') ||
                        ((_a = h.targetEndpoint) === null || _a === void 0 ? void 0 : _a.includes('eval'));
                });
                if (hasEval) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'Critical: Use of eval() detected - major XSS risk',
                            suggestion: 'Remove eval() usage and use safe alternatives',
                            autoFixAvailable: false
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: 'No XSS vulnerabilities detected'
                    }];
            });
        });
    };
    SecurityPlugin.prototype.checkCSRFProtection = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var hasCSRFToken, isStateChangingForm, stateChangingAPIs, hasCSRFHeader;
            var _a, _b;
            return __generator(this, function (_c) {
                // Check forms for CSRF protection
                if (element.type === 'form') {
                    hasCSRFToken = ((_a = element.props.children) === null || _a === void 0 ? void 0 : _a.toString().includes('csrf')) ||
                        ((_b = element.props.children) === null || _b === void 0 ? void 0 : _b.toString().includes('_token')) ||
                        (element.handlers || []).some(function (h) { return h.handlerName.includes('csrf'); });
                    isStateChangingForm = (element.apiCalls || []).some(function (api) {
                        return api.method === 'POST' || api.method === 'PUT' || api.method === 'DELETE';
                    });
                    if (isStateChangingForm && !hasCSRFToken) {
                        return [2 /*return*/, {
                                passed: false,
                                message: 'High: Form performs state-changing operations without CSRF protection',
                                suggestion: 'Implement CSRF tokens for all state-changing forms',
                                autoFixAvailable: false
                            }];
                    }
                }
                stateChangingAPIs = (element.apiCalls || []).filter(function (api) {
                    return api.method === 'POST' || api.method === 'PUT' || api.method === 'DELETE';
                });
                if (stateChangingAPIs.length > 0) {
                    hasCSRFHeader = stateChangingAPIs.some(function (api) {
                        var _a, _b, _c, _d;
                        return ((_b = (_a = api.requestBody) === null || _a === void 0 ? void 0 : _a.headers) === null || _b === void 0 ? void 0 : _b['X-CSRF-Token']) ||
                            ((_d = (_c = api.requestBody) === null || _c === void 0 ? void 0 : _c.headers) === null || _d === void 0 ? void 0 : _d['X-Requested-With']);
                    });
                    if (!hasCSRFHeader) {
                        return [2 /*return*/, {
                                passed: false,
                                message: 'Medium: State-changing API calls may lack CSRF protection',
                                suggestion: 'Add CSRF tokens or SameSite cookie attributes',
                                autoFixAvailable: false
                            }];
                    }
                }
                return [2 /*return*/, {
                        passed: true,
                        message: 'CSRF protection appears adequate'
                    }];
            });
        });
    };
    SecurityPlugin.prototype.checkInjectionVulnerabilities = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var hasUserInput, makesAPIRequests, hasDirectConcatenation, hasSystemCalls;
            return __generator(this, function (_a) {
                hasUserInput = element.type === 'input' || element.type === 'textarea';
                makesAPIRequests = (element.apiCalls || []).length > 0;
                if (hasUserInput && makesAPIRequests) {
                    hasDirectConcatenation = (element.apiCalls || []).some(function (api) {
                        return api.endpoint.includes('${') || api.endpoint.includes('+');
                    });
                    if (hasDirectConcatenation) {
                        return [2 /*return*/, {
                                passed: false,
                                message: 'High: Potential injection vulnerability - user input in API endpoints',
                                suggestion: 'Use parameterized queries and proper input validation',
                                autoFixAvailable: false
                            }];
                    }
                }
                hasSystemCalls = (element.handlers || []).some(function (h) {
                    return h.handlerName.includes('exec') ||
                        h.handlerName.includes('system') ||
                        h.handlerName.includes('shell');
                });
                if (hasSystemCalls) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'Critical: Potential command injection - system calls detected',
                            suggestion: 'Avoid system calls or implement strict input validation',
                            autoFixAvailable: false
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: 'No injection vulnerabilities detected'
                    }];
            });
        });
    };
    SecurityPlugin.prototype.checkDataExposure = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var sensitiveKeys, hasSensitiveData, hasConsoleLog, usesLocalStorage;
            return __generator(this, function (_a) {
                sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
                hasSensitiveData = Object.keys(element.props).some(function (key) {
                    return sensitiveKeys.some(function (sensitive) { return key.toLowerCase().includes(sensitive); });
                });
                if (hasSensitiveData) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'High: Sensitive data detected in component props',
                            suggestion: 'Avoid passing sensitive data through props, use secure storage',
                            autoFixAvailable: false
                        }];
                }
                hasConsoleLog = (element.handlers || []).some(function (h) {
                    return h.handlerName.includes('console.log') || h.handlerName.includes('console');
                });
                if (hasConsoleLog) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'Medium: Console logging detected - may expose sensitive data',
                            suggestion: 'Remove console.log statements in production code',
                            autoFixAvailable: true
                        }];
                }
                usesLocalStorage = (element.handlers || []).some(function (h) {
                    return h.handlerName.includes('localStorage') || h.handlerName.includes('sessionStorage');
                });
                if (usesLocalStorage && hasSensitiveData) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'High: Sensitive data may be stored in browser storage',
                            suggestion: 'Use secure storage methods for sensitive data',
                            autoFixAvailable: false
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: 'No data exposure issues detected'
                    }];
            });
        });
    };
    SecurityPlugin.prototype.checkAuthenticationBypass = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var isProtectedRoute, hasAuthCheck, protectedAPIs, hasAuthHeader;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                isProtectedRoute = ((_a = element.navigationTarget) === null || _a === void 0 ? void 0 : _a.includes('/dashboard')) ||
                    ((_b = element.navigationTarget) === null || _b === void 0 ? void 0 : _b.includes('/profile')) ||
                    ((_c = element.navigationTarget) === null || _c === void 0 ? void 0 : _c.includes('/admin'));
                if (isProtectedRoute) {
                    hasAuthCheck = (element.handlers || []).some(function (h) {
                        return h.handlerName.includes('auth') ||
                            h.handlerName.includes('login') ||
                            h.dependencies.includes('auth');
                    });
                    if (!hasAuthCheck) {
                        return [2 /*return*/, {
                                passed: false,
                                message: 'High: Navigation to protected route without authentication check',
                                suggestion: 'Implement authentication checks before navigation',
                                autoFixAvailable: false
                            }];
                    }
                }
                protectedAPIs = (element.apiCalls || []).filter(function (api) {
                    return api.endpoint.includes('/api/user') ||
                        api.endpoint.includes('/api/admin') ||
                        api.endpoint.includes('/api/protected');
                });
                if (protectedAPIs.length > 0) {
                    hasAuthHeader = protectedAPIs.some(function (api) {
                        var _a, _b, _c, _d;
                        return ((_b = (_a = api.requestBody) === null || _a === void 0 ? void 0 : _a.headers) === null || _b === void 0 ? void 0 : _b.Authorization) ||
                            ((_d = (_c = api.requestBody) === null || _c === void 0 ? void 0 : _c.headers) === null || _d === void 0 ? void 0 : _d['X-Auth-Token']);
                    });
                    if (!hasAuthHeader) {
                        return [2 /*return*/, {
                                passed: false,
                                message: 'High: Protected API calls without authentication headers',
                                suggestion: 'Add authentication headers to protected API requests',
                                autoFixAvailable: false
                            }];
                    }
                }
                return [2 /*return*/, {
                        passed: true,
                        message: 'Authentication checks appear adequate'
                    }];
            });
        });
    };
    SecurityPlugin.prototype.checkInsecureTransport = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var hasHTTPUrls, hasMixedContent;
            var _a, _b;
            return __generator(this, function (_c) {
                hasHTTPUrls = (element.apiCalls || []).some(function (api) {
                    return api.endpoint.startsWith('http://') && !api.endpoint.includes('localhost');
                });
                if (hasHTTPUrls && process.env.NODE_ENV === 'production') {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'High: HTTP URLs detected in production - data transmitted insecurely',
                            suggestion: 'Use HTTPS for all external communications',
                            autoFixAvailable: true
                        }];
                }
                hasMixedContent = ((_a = element.props.src) === null || _a === void 0 ? void 0 : _a.startsWith('http://')) ||
                    ((_b = element.props.href) === null || _b === void 0 ? void 0 : _b.startsWith('http://'));
                if (hasMixedContent) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'Medium: Mixed content detected - HTTP resources on HTTPS page',
                            suggestion: 'Use HTTPS URLs for all resources',
                            autoFixAvailable: true
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: 'Transport security is adequate'
                    }];
            });
        });
    };
    SecurityPlugin.prototype.checkVulnerableDependencies = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var vulnerableDeps;
            var _this = this;
            return __generator(this, function (_a) {
                vulnerableDeps = (element.dependencies || []).filter(function (dep) {
                    return _this.knownVulnerablePackages.has(dep);
                });
                if (vulnerableDeps.length > 0) {
                    return [2 /*return*/, {
                            passed: false,
                            message: "High: ".concat(vulnerableDeps.length, " vulnerable dependencies detected: ").concat(vulnerableDeps.join(', ')),
                            suggestion: 'Update vulnerable dependencies to secure versions',
                            autoFixAvailable: true
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: 'No known vulnerable dependencies detected'
                    }];
            });
        });
    };
    SecurityPlugin.prototype.checkFileUploadSecurity = function (element) {
        return __awaiter(this, void 0, void 0, function () {
            var hasFileTypeRestriction, hasSizeLimit, allowsExecutables;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                hasFileTypeRestriction = element.props.accept;
                hasSizeLimit = element.props.maxSize || (element.handlers || []).some(function (h) {
                    return h.handlerName.includes('size') || h.handlerName.includes('limit');
                });
                if (!hasFileTypeRestriction) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'High: File upload without type restrictions',
                            suggestion: 'Implement file type validation using accept attribute',
                            autoFixAvailable: true
                        }];
                }
                if (!hasSizeLimit) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'Medium: File upload without size limits',
                            suggestion: 'Implement file size validation to prevent DoS attacks',
                            autoFixAvailable: false
                        }];
                }
                allowsExecutables = ((_a = element.props.accept) === null || _a === void 0 ? void 0 : _a.includes('.exe')) ||
                    ((_b = element.props.accept) === null || _b === void 0 ? void 0 : _b.includes('.bat')) ||
                    ((_c = element.props.accept) === null || _c === void 0 ? void 0 : _c.includes('.sh'));
                if (allowsExecutables) {
                    return [2 /*return*/, {
                            passed: false,
                            message: 'Critical: File upload allows executable files',
                            suggestion: 'Restrict file uploads to safe file types only',
                            autoFixAvailable: true
                        }];
                }
                return [2 /*return*/, {
                        passed: true,
                        message: 'File upload security is adequate'
                    }];
            });
        });
    };
    SecurityPlugin.prototype.analyzeSecurityContext = function (element) {
        return {
            hasAuthentication: (element.handlers || []).some(function (h) { return h.dependencies.includes('auth'); }),
            handlesUserInput: ['input', 'textarea', 'form'].includes(element.type),
            makesAPIRequests: (element.apiCalls || []).length > 0,
            storesData: (element.handlers || []).some(function (h) {
                return h.handlerName.includes('localStorage') || h.handlerName.includes('sessionStorage');
            }),
            hasFileUpload: element.type === 'input' && element.props.type === 'file',
            usesThirdPartyLibraries: (element.dependencies || []).length > 0
        };
    };
    SecurityPlugin.prototype.calculateRiskScore = function (findings, context) {
        var score = 100;
        findings.forEach(function (finding) {
            if (!finding.passed) {
                if (finding.message.includes('Critical'))
                    score -= 30;
                else if (finding.message.includes('High'))
                    score -= 20;
                else if (finding.message.includes('Medium'))
                    score -= 10;
                else
                    score -= 5;
            }
        });
        // Adjust based on context
        if (context.hasAuthentication)
            score -= 5; // Higher risk for auth components
        if (context.handlesUserInput)
            score -= 5; // Higher risk for input handling
        if (context.makesAPIRequests)
            score -= 3; // Higher risk for API interactions
        return Math.max(0, score);
    };
    SecurityPlugin.prototype.extractVulnerabilities = function (findings) {
        var _this = this;
        return findings
            .filter(function (f) { return !f.passed; })
            .map(function (finding) { return ({
            type: _this.categorizeVulnerability(finding.message),
            severity: _this.extractSeverity(finding.message),
            cwe: _this.getCWEId(finding.message),
            description: finding.message,
            impact: _this.assessImpact(finding.message),
            remediation: finding.suggestion || 'No specific remediation provided',
            references: _this.getSecurityReferences(finding.message)
        }); });
    };
    SecurityPlugin.prototype.categorizeVulnerability = function (message) {
        if (message.includes('XSS') || message.includes('innerHTML'))
            return 'xss';
        if (message.includes('CSRF'))
            return 'csrf';
        if (message.includes('injection'))
            return 'injection';
        if (message.includes('data') || message.includes('exposure'))
            return 'data-exposure';
        if (message.includes('auth'))
            return 'auth-bypass';
        if (message.includes('HTTP') || message.includes('transport'))
            return 'insecure-transport';
        return 'data-exposure';
    };
    SecurityPlugin.prototype.extractSeverity = function (message) {
        if (message.includes('Critical'))
            return 'critical';
        if (message.includes('High'))
            return 'high';
        if (message.includes('Medium'))
            return 'medium';
        return 'low';
    };
    SecurityPlugin.prototype.getCWEId = function (message) {
        // Map common vulnerabilities to CWE IDs
        if (message.includes('XSS'))
            return 'CWE-79';
        if (message.includes('CSRF'))
            return 'CWE-352';
        if (message.includes('injection'))
            return 'CWE-89';
        if (message.includes('auth'))
            return 'CWE-287';
        if (message.includes('transport'))
            return 'CWE-319';
        return 'CWE-200'; // Information Exposure
    };
    SecurityPlugin.prototype.assessImpact = function (message) {
        if (message.includes('Critical'))
            return 'Complete system compromise possible';
        if (message.includes('High'))
            return 'Significant security risk';
        if (message.includes('Medium'))
            return 'Moderate security risk';
        return 'Low security risk';
    };
    SecurityPlugin.prototype.getSecurityReferences = function (message) {
        var references = ['https://owasp.org/'];
        if (message.includes('XSS')) {
            references.push('https://owasp.org/www-community/attacks/xss/');
        }
        if (message.includes('CSRF')) {
            references.push('https://owasp.org/www-community/attacks/csrf');
        }
        if (message.includes('injection')) {
            references.push('https://owasp.org/www-community/Injection_Flaws');
        }
        return references;
    };
    SecurityPlugin.prototype.generateSecurityRecommendations = function (element, findings) {
        var recommendations = [];
        var criticalFindings = findings.filter(function (f) { return !f.passed && f.message.includes('Critical'); });
        var highFindings = findings.filter(function (f) { return !f.passed && f.message.includes('High'); });
        if (criticalFindings.length > 0) {
            recommendations.push('Address critical security vulnerabilities immediately');
            recommendations.push('Conduct security code review');
            recommendations.push('Implement security testing in CI/CD pipeline');
        }
        if (highFindings.length > 0) {
            recommendations.push('Implement input validation and sanitization');
            recommendations.push('Add authentication and authorization checks');
            recommendations.push('Use HTTPS for all communications');
        }
        recommendations.push('Regular security audits and dependency updates');
        recommendations.push('Implement Content Security Policy (CSP)');
        return recommendations;
    };
    return SecurityPlugin;
}());
exports.SecurityPlugin = SecurityPlugin;
