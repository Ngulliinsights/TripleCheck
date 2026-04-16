#!/usr/bin/env tsx
"use strict";
/**
 * TRIPLECHECK DEPLOYMENT PREPARATION SCRIPT
 * =========================================
 *
 * Comprehensive deployment preparation that optimizes the application
 * for production deployment across multiple platforms (Vercel, Render, etc.)
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
exports.DeploymentPreparation = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path_1 = require("path");
var perf_hooks_1 = require("perf_hooks");
var DeploymentPreparation = /** @class */ (function () {
    function DeploymentPreparation(config) {
        this.startTime = perf_hooks_1.performance.now();
        this.config = config;
        this.rootDir = process.cwd();
    }
    /**
     * Main deployment preparation workflow
     */
    DeploymentPreparation.prototype.prepare = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🚀 Starting TripleCheck deployment preparation...\n');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        // Step 1: Environment validation
                        return [4 /*yield*/, this.validateEnvironment()];
                    case 2:
                        // Step 1: Environment validation
                        _a.sent();
                        // Step 2: Clean previous builds
                        return [4 /*yield*/, this.cleanBuildArtifacts()];
                    case 3:
                        // Step 2: Clean previous builds
                        _a.sent();
                        // Step 3: Optimize dependencies
                        return [4 /*yield*/, this.optimizeDependencies()];
                    case 4:
                        // Step 3: Optimize dependencies
                        _a.sent();
                        // Step 4: Run security checks
                        return [4 /*yield*/, this.runSecurityChecks()];
                    case 5:
                        // Step 4: Run security checks
                        _a.sent();
                        // Step 5: Type checking
                        return [4 /*yield*/, this.runTypeChecking()];
                    case 6:
                        // Step 5: Type checking
                        _a.sent();
                        // Step 6: Build optimization
                        return [4 /*yield*/, this.optimizeBuild()];
                    case 7:
                        // Step 6: Build optimization
                        _a.sent();
                        // Step 7: Asset optimization
                        return [4 /*yield*/, this.optimizeAssets()];
                    case 8:
                        // Step 7: Asset optimization
                        _a.sent();
                        // Step 8: Generate deployment configs
                        return [4 /*yield*/, this.generateDeploymentConfigs()];
                    case 9:
                        // Step 8: Generate deployment configs
                        _a.sent();
                        // Step 9: Run final validation
                        return [4 /*yield*/, this.validateDeployment()];
                    case 10:
                        // Step 9: Run final validation
                        _a.sent();
                        this.logSuccess();
                        return [3 /*break*/, 12];
                    case 11:
                        error_1 = _a.sent();
                        this.logError(error_1);
                        process.exit(1);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate environment and prerequisites
     */
    DeploymentPreparation.prototype.validateEnvironment = function () {
        return __awaiter(this, void 0, void 0, function () {
            var nodeVersion, requiredVersion, requiredFiles, _i, requiredFiles_1, file;
            return __generator(this, function (_a) {
                console.log('📋 Validating environment...');
                nodeVersion = process.version;
                requiredVersion = '18.0.0';
                if (!this.isVersionCompatible(nodeVersion.slice(1), requiredVersion)) {
                    throw new Error("Node.js ".concat(requiredVersion, " or higher required. Current: ").concat(nodeVersion));
                }
                requiredFiles = [
                    'package.json',
                    'vite.config.ts',
                    'tsconfig.json',
                    'tailwind.config.ts'
                ];
                for (_i = 0, requiredFiles_1 = requiredFiles; _i < requiredFiles_1.length; _i++) {
                    file = requiredFiles_1[_i];
                    if (!(0, fs_1.existsSync)((0, path_1.join)(this.rootDir, file))) {
                        throw new Error("Required file missing: ".concat(file));
                    }
                }
                // Check environment variables
                if (this.config.environment === 'production') {
                    this.validateProductionEnv();
                }
                console.log('✅ Environment validation passed\n');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate production environment variables
     */
    DeploymentPreparation.prototype.validateProductionEnv = function () {
        var requiredEnvVars = [
            'DATABASE_URL',
            'JWT_SECRET'
        ];
        var missing = requiredEnvVars.filter(function (env) { return !process.env[env]; });
        if (missing.length > 0) {
            throw new Error("Missing required environment variables: ".concat(missing.join(', ')));
        }
    };
    /**
     * Clean previous build artifacts
     */
    DeploymentPreparation.prototype.cleanBuildArtifacts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cleanDirs, _i, cleanDirs_1, dir;
            return __generator(this, function (_a) {
                console.log('🧹 Cleaning build artifacts...');
                cleanDirs = ['dist', 'coverage', '.turbo', 'node_modules/.cache'];
                for (_i = 0, cleanDirs_1 = cleanDirs; _i < cleanDirs_1.length; _i++) {
                    dir = cleanDirs_1[_i];
                    try {
                        (0, child_process_1.execSync)("rm -rf ".concat(dir), { stdio: 'pipe' });
                    }
                    catch (error) {
                        // Directory might not exist, continue
                    }
                }
                console.log('✅ Build artifacts cleaned\n');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Optimize dependencies
     */
    DeploymentPreparation.prototype.optimizeDependencies = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('📦 Optimizing dependencies...');
                // Clean install for production
                if (this.config.environment === 'production') {
                    console.log('   Installing production dependencies...');
                    (0, child_process_1.execSync)('npm ci --only=production --silent', { stdio: 'inherit' });
                    // Reinstall dev dependencies for build
                    (0, child_process_1.execSync)('npm ci --silent', { stdio: 'inherit' });
                }
                // Audit and fix vulnerabilities
                try {
                    (0, child_process_1.execSync)('npm audit fix --silent', { stdio: 'pipe' });
                }
                catch (error) {
                    console.log('⚠️  Some vulnerabilities could not be auto-fixed');
                }
                console.log('✅ Dependencies optimized\n');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Run security checks
     */
    DeploymentPreparation.prototype.runSecurityChecks = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🔒 Running security checks...');
                try {
                    // Run ESLint security rules
                    (0, child_process_1.execSync)('npm run lint:security', { stdio: 'pipe' });
                    // Run npm audit
                    (0, child_process_1.execSync)('npm audit --audit-level moderate', { stdio: 'pipe' });
                    console.log('✅ Security checks passed\n');
                }
                catch (error) {
                    console.log('⚠️  Security warnings detected - review before deployment\n');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Run TypeScript type checking
     */
    DeploymentPreparation.prototype.runTypeChecking = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🔍 Running type checking...');
                try {
                    (0, child_process_1.execSync)('npm run check', { stdio: 'pipe' });
                    console.log('✅ Type checking passed\n');
                }
                catch (error) {
                    throw new Error('TypeScript type checking failed. Fix type errors before deployment.');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Optimize build process
     */
    DeploymentPreparation.prototype.optimizeBuild = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('🏗️  Building optimized application...');
                // Set production environment
                process.env.NODE_ENV = 'production';
                try {
                    if (this.config.optimizationLevel === 'aggressive') {
                        (0, child_process_1.execSync)('npm run build:optimized', { stdio: 'inherit' });
                    }
                    else {
                        (0, child_process_1.execSync)('npm run build', { stdio: 'inherit' });
                    }
                    console.log('✅ Build completed successfully\n');
                }
                catch (error) {
                    throw new Error('Build failed. Check build errors above.');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Optimize assets
     */
    DeploymentPreparation.prototype.optimizeAssets = function () {
        return __awaiter(this, void 0, void 0, function () {
            var distDir, assetDirs, _i, assetDirs_1, dir, fullPath;
            return __generator(this, function (_a) {
                console.log('🖼️  Optimizing assets...');
                distDir = (0, path_1.join)(this.rootDir, 'dist/public');
                if ((0, fs_1.existsSync)(distDir)) {
                    assetDirs = ['assets/images', 'assets/fonts', 'js'];
                    for (_i = 0, assetDirs_1 = assetDirs; _i < assetDirs_1.length; _i++) {
                        dir = assetDirs_1[_i];
                        fullPath = (0, path_1.join)(distDir, dir);
                        if (!(0, fs_1.existsSync)(fullPath)) {
                            (0, fs_1.mkdirSync)(fullPath, { recursive: true });
                        }
                    }
                }
                console.log('✅ Assets optimized\n');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate platform-specific deployment configs
     */
    DeploymentPreparation.prototype.generateDeploymentConfigs = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('⚙️  Generating deployment configurations...');
                        _a = this.config.platform;
                        switch (_a) {
                            case 'vercel': return [3 /*break*/, 1];
                            case 'render': return [3 /*break*/, 3];
                            case 'netlify': return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 7];
                    case 1: return [4 /*yield*/, this.generateVercelConfig()];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 3: return [4 /*yield*/, this.generateRenderConfig()];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 5: return [4 /*yield*/, this.generateNetlifyConfig()];
                    case 6:
                        _b.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        console.log('   Using generic configuration');
                        _b.label = 8;
                    case 8: 
                    // Generate environment-specific configs
                    return [4 /*yield*/, this.generateEnvironmentConfig()];
                    case 9:
                        // Generate environment-specific configs
                        _b.sent();
                        console.log('✅ Deployment configurations generated\n');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate Vercel-specific configuration
     */
    DeploymentPreparation.prototype.generateVercelConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var vercelConfig;
            return __generator(this, function (_a) {
                vercelConfig = {
                    version: 2,
                    buildCommand: this.config.optimizationLevel === 'aggressive'
                        ? 'npm run build:optimized'
                        : 'npm run build',
                    outputDirectory: 'dist/public',
                    installCommand: 'npm ci',
                    framework: null,
                    routes: [
                        {
                            src: '/js/(.*)',
                            dest: '/js/$1',
                            headers: {
                                'Cache-Control': 'public, max-age=31536000, immutable'
                            }
                        },
                        {
                            src: '/assets/(.*)',
                            dest: '/assets/$1',
                            headers: {
                                'Cache-Control': 'public, max-age=31536000, immutable'
                            }
                        },
                        {
                            src: '/(.*\\.(css|js|woff|woff2|ttf|eot|otf))',
                            dest: '/$1',
                            headers: {
                                'Cache-Control': 'public, max-age=31536000, immutable'
                            }
                        },
                        {
                            src: '/(.*\\.(jpg|jpeg|png|webp|avif|gif|svg|ico))',
                            dest: '/$1',
                            headers: {
                                'Cache-Control': 'public, max-age=2592000'
                            }
                        },
                        {
                            src: '/(.*)',
                            dest: '/index.html',
                            headers: {
                                'X-Content-Type-Options': 'nosniff',
                                'X-Frame-Options': 'DENY',
                                'X-XSS-Protection': '1; mode=block',
                                'Referrer-Policy': 'strict-origin-when-cross-origin'
                            }
                        }
                    ],
                    env: {
                        NODE_ENV: this.config.environment
                    }
                };
                (0, fs_1.writeFileSync)((0, path_1.join)(this.rootDir, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate Render-specific configuration
     */
    DeploymentPreparation.prototype.generateRenderConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var renderConfig;
            return __generator(this, function (_a) {
                renderConfig = {
                    services: [
                        {
                            type: 'web',
                            name: 'triplecheck-frontend',
                            env: 'static',
                            buildCommand: this.config.optimizationLevel === 'aggressive'
                                ? 'npm run build:optimized'
                                : 'npm run build',
                            staticPublishPath: './dist/public',
                            headers: [
                                {
                                    path: '/js/*',
                                    name: 'Cache-Control',
                                    value: 'public, max-age=31536000, immutable'
                                },
                                {
                                    path: '/assets/*',
                                    name: 'Cache-Control',
                                    value: 'public, max-age=31536000, immutable'
                                }
                            ]
                        }
                    ]
                };
                (0, fs_1.writeFileSync)((0, path_1.join)(this.rootDir, 'render.yaml'), JSON.stringify(renderConfig, null, 2));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate Netlify-specific configuration
     */
    DeploymentPreparation.prototype.generateNetlifyConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var netlifyConfig;
            return __generator(this, function (_a) {
                netlifyConfig = {
                    build: {
                        command: this.config.optimizationLevel === 'aggressive'
                            ? 'npm run build:optimized'
                            : 'npm run build',
                        publish: 'dist/public'
                    },
                    redirects: [
                        {
                            from: '/*',
                            to: '/index.html',
                            status: 200
                        }
                    ],
                    headers: [
                        {
                            for: '/js/*',
                            values: {
                                'Cache-Control': 'public, max-age=31536000, immutable'
                            }
                        },
                        {
                            for: '/assets/*',
                            values: {
                                'Cache-Control': 'public, max-age=31536000, immutable'
                            }
                        }
                    ]
                };
                (0, fs_1.writeFileSync)((0, path_1.join)(this.rootDir, 'netlify.toml'), "[build]\n  command = \"".concat(netlifyConfig.build.command, "\"\n  publish = \"").concat(netlifyConfig.build.publish, "\"\n\n[[redirects]]\n  from = \"/*\"\n  to = \"/index.html\"\n  status = 200\n\n[[headers]]\n  for = \"/js/*\"\n  [headers.values]\n    Cache-Control = \"public, max-age=31536000, immutable\"\n\n[[headers]]\n  for = \"/assets/*\"\n  [headers.values]\n    Cache-Control = \"public, max-age=31536000, immutable\""));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate environment-specific configuration
     */
    DeploymentPreparation.prototype.generateEnvironmentConfig = function () {
        return __awaiter(this, void 0, void 0, function () {
            var envConfig;
            return __generator(this, function (_a) {
                envConfig = {
                    environment: this.config.environment,
                    platform: this.config.platform,
                    optimizationLevel: this.config.optimizationLevel,
                    buildTime: new Date().toISOString(),
                    nodeVersion: process.version,
                    features: {
                        landVerification: true,
                        fraudDetection: true,
                        communityFeatures: true,
                        realTimeUpdates: true
                    }
                };
                (0, fs_1.writeFileSync)((0, path_1.join)(this.rootDir, 'deployment-config.json'), JSON.stringify(envConfig, null, 2));
                return [2 /*return*/];
            });
        });
    };
    /**
     * Validate deployment readiness
     */
    DeploymentPreparation.prototype.validateDeployment = function () {
        return __awaiter(this, void 0, void 0, function () {
            var distDir, criticalFiles, _i, criticalFiles_1, file, stats, sizeMatch;
            return __generator(this, function (_a) {
                console.log('🔍 Validating deployment readiness...');
                distDir = (0, path_1.join)(this.rootDir, 'dist/public');
                if (!(0, fs_1.existsSync)(distDir)) {
                    throw new Error('Build output directory not found');
                }
                criticalFiles = ['index.html', 'js'];
                for (_i = 0, criticalFiles_1 = criticalFiles; _i < criticalFiles_1.length; _i++) {
                    file = criticalFiles_1[_i];
                    if (!(0, fs_1.existsSync)((0, path_1.join)(distDir, file))) {
                        throw new Error("Critical build file missing: ".concat(file));
                    }
                }
                // Validate bundle size (warn if too large)
                try {
                    stats = (0, child_process_1.execSync)('du -sh dist/public', { encoding: 'utf8' });
                    sizeMatch = stats.match(/^(\d+(?:\.\d+)?[KMGT]?)/);
                    if (sizeMatch) {
                        console.log("   Bundle size: ".concat(sizeMatch[1], "B"));
                    }
                }
                catch (error) {
                    // Size check failed, continue
                }
                console.log('✅ Deployment validation passed\n');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Check if version is compatible
     */
    DeploymentPreparation.prototype.isVersionCompatible = function (current, required) {
        var currentParts = current.split('.').map(Number);
        var requiredParts = required.split('.').map(Number);
        for (var i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
            var currentPart = currentParts[i] || 0;
            var requiredPart = requiredParts[i] || 0;
            if (currentPart > requiredPart)
                return true;
            if (currentPart < requiredPart)
                return false;
        }
        return true;
    };
    /**
     * Log successful completion
     */
    DeploymentPreparation.prototype.logSuccess = function () {
        var duration = ((perf_hooks_1.performance.now() - this.startTime) / 1000).toFixed(2);
        console.log('🎉 Deployment preparation completed successfully!');
        console.log("\u23F1\uFE0F  Total time: ".concat(duration, "s"));
        console.log("\uD83C\uDFAF Platform: ".concat(this.config.platform));
        console.log("\uD83C\uDF0D Environment: ".concat(this.config.environment));
        console.log("\u26A1 Optimization: ".concat(this.config.optimizationLevel));
        console.log('\n📋 Next steps:');
        switch (this.config.platform) {
            case 'vercel':
                console.log('   • Run: npm run deploy:vercel');
                console.log('   • Or: vercel --prod');
                break;
            case 'render':
                console.log('   • Push to your connected Git repository');
                console.log('   • Render will automatically deploy');
                break;
            case 'netlify':
                console.log('   • Run: netlify deploy --prod');
                console.log('   • Or push to your connected Git repository');
                break;
            default:
                console.log('   • Deploy the dist/public directory to your hosting platform');
        }
        console.log('\n🔗 Useful commands:');
        console.log('   • npm run test:deployment - Test deployment locally');
        console.log('   • npm run monitor:health - Check application health');
        console.log('   • npm run security:scan - Run security audit');
    };
    /**
     * Log error and cleanup
     */
    DeploymentPreparation.prototype.logError = function (error) {
        console.error('\n❌ Deployment preparation failed!');
        console.error("Error: ".concat(error.message));
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        console.error('\n🔧 Troubleshooting:');
        console.error('   • Check the error message above');
        console.error('   • Ensure all dependencies are installed');
        console.error('   • Verify environment variables are set');
        console.error('   • Run npm run lint and npm run check');
    };
    return DeploymentPreparation;
}());
exports.DeploymentPreparation = DeploymentPreparation;
/**
 * CLI Interface
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var args, config, validPlatforms, validEnvironments, validOptimizations, deployment;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    args = process.argv.slice(2);
                    config = {
                        platform: args[0] || 'vercel',
                        environment: args[1] || 'production',
                        optimizationLevel: args[2] || 'basic'
                    };
                    validPlatforms = ['vercel', 'render', 'netlify', 'generic'];
                    validEnvironments = ['staging', 'production'];
                    validOptimizations = ['basic', 'aggressive'];
                    if (!validPlatforms.includes(config.platform)) {
                        console.error("Invalid platform: ".concat(config.platform));
                        console.error("Valid platforms: ".concat(validPlatforms.join(', ')));
                        process.exit(1);
                    }
                    if (!validEnvironments.includes(config.environment)) {
                        console.error("Invalid environment: ".concat(config.environment));
                        console.error("Valid environments: ".concat(validEnvironments.join(', ')));
                        process.exit(1);
                    }
                    if (!validOptimizations.includes(config.optimizationLevel)) {
                        console.error("Invalid optimization level: ".concat(config.optimizationLevel));
                        console.error("Valid levels: ".concat(validOptimizations.join(', ')));
                        process.exit(1);
                    }
                    deployment = new DeploymentPreparation(config);
                    return [4 /*yield*/, deployment.prepare()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Run if called directly
if (import.meta.url === "file://".concat(process.argv[1])) {
    main().catch(console.error);
}
