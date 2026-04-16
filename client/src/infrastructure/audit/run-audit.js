#!/usr/bin/env tsx
"use strict";
/**
 * Simple audit runner to analyze project structure for redundancies
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
exports.ProjectStructureAnalyzer = void 0;
var fs = require("fs");
var path = require("path");
var ProjectStructureAnalyzer = /** @class */ (function () {
    function ProjectStructureAnalyzer(projectRoot) {
        if (projectRoot === void 0) { projectRoot = '.'; }
        this.excludePaths = ['node_modules', 'dist', 'build', '.git', 'coverage', 'reports', '.venv', '__pycache__', 'playwright-report', 'test-results'];
        this.projectRoot = projectRoot;
    }
    ProjectStructureAnalyzer.prototype.analyzeProject = function () {
        return __awaiter(this, void 0, void 0, function () {
            var analysis, allFiles, specificIssues, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('🔍 Analyzing project structure for redundancies...');
                        analysis = {
                            redundantFiles: [],
                            duplicateComponents: [],
                            unusedFiles: [],
                            structuralIssues: [],
                            recommendations: []
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.getAllFiles()];
                    case 2:
                        allFiles = _b.sent();
                        // Check for redundant files
                        analysis.redundantFiles = this.findRedundantFiles(allFiles);
                        // Check for duplicate components
                        analysis.duplicateComponents = this.findDuplicateComponents(allFiles);
                        // Check for structural issues
                        analysis.structuralIssues = this.findStructuralIssues(allFiles);
                        specificIssues = this.analyzeSpecificRedundancies(allFiles);
                        (_a = analysis.structuralIssues).push.apply(_a, specificIssues);
                        // Generate recommendations
                        analysis.recommendations = this.generateRecommendations(analysis);
                        this.printAnalysis(analysis);
                        return [2 /*return*/, analysis];
                    case 3:
                        error_1 = _b.sent();
                        console.error('❌ Analysis failed:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ProjectStructureAnalyzer.prototype.getAllFiles = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, walkDir;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        files = [];
                        walkDir = function (dir) { return __awaiter(_this, void 0, void 0, function () {
                            var items, _loop_1, this_1, _i, items_1, item, error_2;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 6, , 7]);
                                        return [4 /*yield*/, fs.promises.readdir(dir, { withFileTypes: true })];
                                    case 1:
                                        items = _a.sent();
                                        _loop_1 = function (item) {
                                            var fullPath, relativePath;
                                            return __generator(this, function (_b) {
                                                switch (_b.label) {
                                                    case 0:
                                                        fullPath = path.join(dir, item.name);
                                                        relativePath = path.relative(this_1.projectRoot, fullPath);
                                                        if (this_1.excludePaths.some(function (excluded) { return relativePath.includes(excluded); })) {
                                                            return [2 /*return*/, "continue"];
                                                        }
                                                        if (!item.isDirectory()) return [3 /*break*/, 2];
                                                        return [4 /*yield*/, walkDir(fullPath)];
                                                    case 1:
                                                        _b.sent();
                                                        return [3 /*break*/, 3];
                                                    case 2:
                                                        if (item.isFile()) {
                                                            files.push(relativePath);
                                                        }
                                                        _b.label = 3;
                                                    case 3: return [2 /*return*/];
                                                }
                                            });
                                        };
                                        this_1 = this;
                                        _i = 0, items_1 = items;
                                        _a.label = 2;
                                    case 2:
                                        if (!(_i < items_1.length)) return [3 /*break*/, 5];
                                        item = items_1[_i];
                                        return [5 /*yield**/, _loop_1(item)];
                                    case 3:
                                        _a.sent();
                                        _a.label = 4;
                                    case 4:
                                        _i++;
                                        return [3 /*break*/, 2];
                                    case 5: return [3 /*break*/, 7];
                                    case 6:
                                        error_2 = _a.sent();
                                        console.warn("Warning: Could not read directory ".concat(dir));
                                        return [3 /*break*/, 7];
                                    case 7: return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, walkDir(this.projectRoot)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, files];
                }
            });
        });
    };
    ProjectStructureAnalyzer.prototype.findRedundantFiles = function (files) {
        var redundant = [];
        // Check for duplicate TypeScript/JavaScript files
        var jsFiles = files.filter(function (f) { return /\.(js|ts|jsx|tsx)$/.test(f); });
        var fileGroups = new Map();
        for (var _i = 0, jsFiles_1 = jsFiles; _i < jsFiles_1.length; _i++) {
            var file = jsFiles_1[_i];
            var baseName = path.basename(file, path.extname(file));
            var dir = path.dirname(file);
            var key = "".concat(dir, "/").concat(baseName);
            if (!fileGroups.has(key)) {
                fileGroups.set(key, []);
            }
            fileGroups.get(key).push(file);
        }
        // Find groups with multiple files (potential duplicates)
        for (var _a = 0, fileGroups_1 = fileGroups; _a < fileGroups_1.length; _a++) {
            var _b = fileGroups_1[_a], key = _b[0], group = _b[1];
            if (group.length > 1) {
                // Check if we have both .ts and .js versions
                var hasTs = group.some(function (f) { return f.endsWith('.ts') || f.endsWith('.tsx'); });
                var hasJs = group.some(function (f) { return f.endsWith('.js') || f.endsWith('.jsx'); });
                if (hasTs && hasJs) {
                    redundant.push.apply(redundant, group.filter(function (f) { return f.endsWith('.js') || f.endsWith('.jsx'); }));
                }
            }
        }
        // Check for test files without corresponding source files
        var testFiles = files.filter(function (f) { return /\.(test|spec)\.(js|ts|jsx|tsx)$/.test(f); });
        for (var _c = 0, testFiles_1 = testFiles; _c < testFiles_1.length; _c++) {
            var testFile = testFiles_1[_c];
            var sourceFile = testFile.replace(/\.(test|spec)\./, '.');
            if (!files.includes(sourceFile)) {
                redundant.push(testFile);
            }
        }
        return redundant;
    };
    ProjectStructureAnalyzer.prototype.findDuplicateComponents = function (files) {
        var duplicates = [];
        var componentFiles = files.filter(function (f) {
            return /\.(tsx|jsx)$/.test(f) &&
                !f.includes('test') &&
                !f.includes('spec');
        });
        var componentNames = new Map();
        for (var _i = 0, componentFiles_1 = componentFiles; _i < componentFiles_1.length; _i++) {
            var file = componentFiles_1[_i];
            var baseName = path.basename(file, path.extname(file));
            if (!componentNames.has(baseName)) {
                componentNames.set(baseName, []);
            }
            componentNames.get(baseName).push(file);
        }
        // Find components with same name in different locations
        for (var _a = 0, componentNames_1 = componentNames; _a < componentNames_1.length; _a++) {
            var _b = componentNames_1[_a], name_1 = _b[0], locations = _b[1];
            if (locations.length > 1) {
                duplicates.push("Component \"".concat(name_1, "\" found in multiple locations: ").concat(locations.join(', ')));
            }
        }
        return duplicates;
    };
    ProjectStructureAnalyzer.prototype.findStructuralIssues = function (files) {
        var issues = [];
        // Check for deeply nested directories
        var maxDepth = 6;
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            var depth = file.split(path.sep).length;
            if (depth > maxDepth) {
                issues.push("Deeply nested file (".concat(depth, " levels): ").concat(file));
            }
        }
        // Check for inconsistent naming patterns
        var componentFiles = files.filter(function (f) { return /\.(tsx|jsx)$/.test(f); });
        var inconsistentNaming = [];
        for (var _a = 0, componentFiles_2 = componentFiles; _a < componentFiles_2.length; _a++) {
            var file = componentFiles_2[_a];
            var baseName = path.basename(file, path.extname(file));
            // Check for PascalCase component names
            if (!/^[A-Z][a-zA-Z0-9]*$/.test(baseName) && !baseName.includes('.')) {
                inconsistentNaming.push(file);
            }
        }
        if (inconsistentNaming.length > 0) {
            issues.push("Components with inconsistent naming: ".concat(inconsistentNaming.slice(0, 5).join(', ')).concat(inconsistentNaming.length > 5 ? " and ".concat(inconsistentNaming.length - 5, " more") : ''));
        }
        // Check for missing index files in directories with multiple components
        var directories = new Map();
        for (var _b = 0, componentFiles_3 = componentFiles; _b < componentFiles_3.length; _b++) {
            var file = componentFiles_3[_b];
            var dir = path.dirname(file);
            if (!directories.has(dir)) {
                directories.set(dir, []);
            }
            directories.get(dir).push(file);
        }
        for (var _c = 0, directories_1 = directories; _c < directories_1.length; _c++) {
            var _d = directories_1[_c], dir = _d[0], dirFiles = _d[1];
            if (dirFiles.length > 2 && !files.includes(path.join(dir, 'index.ts')) && !files.includes(path.join(dir, 'index.tsx'))) {
                issues.push("Directory with multiple components missing index file: ".concat(dir));
            }
        }
        return issues;
    };
    ProjectStructureAnalyzer.prototype.analyzeSpecificRedundancies = function (files) {
        var specificIssues = [];
        // Check for compiled files in source directories
        var compiledInSrc = files.filter(function (f) {
            return f.startsWith('src/') && (f.endsWith('.js') || f.endsWith('.d.ts'));
        });
        if (compiledInSrc.length > 0) {
            specificIssues.push("".concat(compiledInSrc.length, " compiled files found in src/ directory"));
        }
        // Check for duplicate hook patterns
        var hookFiles = files.filter(function (f) { return f.includes('hooks/') && f.endsWith('.ts'); });
        var hookNames = new Map();
        for (var _i = 0, hookFiles_1 = hookFiles; _i < hookFiles_1.length; _i++) {
            var file = hookFiles_1[_i];
            var baseName = path.basename(file, '.ts');
            if (!hookNames.has(baseName)) {
                hookNames.set(baseName, []);
            }
            hookNames.get(baseName).push(file);
        }
        for (var _a = 0, hookNames_1 = hookNames; _a < hookNames_1.length; _a++) {
            var _b = hookNames_1[_a], name_2 = _b[0], locations = _b[1];
            if (locations.length > 1) {
                specificIssues.push("Hook \"".concat(name_2, "\" duplicated in: ").concat(locations.join(', ')));
            }
        }
        // Check for similar service patterns
        var serviceFiles = files.filter(function (f) { return f.includes('service') && f.endsWith('.ts'); });
        var servicePatterns = new Map();
        for (var _c = 0, serviceFiles_1 = serviceFiles; _c < serviceFiles_1.length; _c++) {
            var file = serviceFiles_1[_c];
            var baseName = path.basename(file, '.ts').toLowerCase();
            var pattern = baseName.replace(/service|api|client/, '').replace(/-/g, '');
            if (!servicePatterns.has(pattern)) {
                servicePatterns.set(pattern, []);
            }
            servicePatterns.get(pattern).push(file);
        }
        for (var _d = 0, servicePatterns_1 = servicePatterns; _d < servicePatterns_1.length; _d++) {
            var _e = servicePatterns_1[_d], pattern = _e[0], locations = _e[1];
            if (locations.length > 1 && pattern.length > 2) {
                specificIssues.push("Similar services for \"".concat(pattern, "\": ").concat(locations.join(', ')));
            }
        }
        return specificIssues;
    };
    ProjectStructureAnalyzer.prototype.generateRecommendations = function (analysis) {
        var recommendations = [];
        if (analysis.redundantFiles.length > 0) {
            recommendations.push("Remove ".concat(analysis.redundantFiles.length, " redundant files to reduce bundle size"));
        }
        if (analysis.duplicateComponents.length > 0) {
            recommendations.push("Consolidate ".concat(analysis.duplicateComponents.length, " duplicate components into shared components"));
        }
        if (analysis.structuralIssues.length > 0) {
            recommendations.push('Improve project structure organization');
            recommendations.push('Add index files to directories with multiple exports');
            recommendations.push('Follow consistent naming conventions');
        }
        // Specific recommendations based on current project structure
        recommendations.push('Consider consolidating similar hooks in shared/hooks');
        recommendations.push('Merge duplicate type definitions across modules');
        recommendations.push('Standardize component organization patterns');
        recommendations.push('Implement barrel exports for better import paths');
        // Project-specific recommendations
        recommendations.push('Remove compiled .js/.d.ts files from src/ (use build process instead)');
        recommendations.push('Consolidate PropertyMap components (component vs page)');
        recommendations.push('Merge MobileNav implementations into single component');
        recommendations.push('Standardize UserProfile component location');
        recommendations.push('Clean up test files without corresponding source files');
        return recommendations;
    };
    ProjectStructureAnalyzer.prototype.printAnalysis = function (analysis) {
        console.log('\n' + '='.repeat(80));
        console.log('PROJECT STRUCTURE ANALYSIS REPORT');
        console.log('='.repeat(80));
        console.log('\n📊 SUMMARY:');
        console.log("   Redundant Files: ".concat(analysis.redundantFiles.length));
        console.log("   Duplicate Components: ".concat(analysis.duplicateComponents.length));
        console.log("   Structural Issues: ".concat(analysis.structuralIssues.length));
        console.log("   Recommendations: ".concat(analysis.recommendations.length));
        if (analysis.redundantFiles.length > 0) {
            console.log('\n🗑️  REDUNDANT FILES:');
            analysis.redundantFiles.slice(0, 10).forEach(function (file) {
                console.log("   - ".concat(file));
            });
            if (analysis.redundantFiles.length > 10) {
                console.log("   ... and ".concat(analysis.redundantFiles.length - 10, " more"));
            }
        }
        if (analysis.duplicateComponents.length > 0) {
            console.log('\n🔄 DUPLICATE COMPONENTS:');
            analysis.duplicateComponents.slice(0, 5).forEach(function (duplicate) {
                console.log("   - ".concat(duplicate));
            });
        }
        if (analysis.structuralIssues.length > 0) {
            console.log('\n⚠️  STRUCTURAL ISSUES:');
            analysis.structuralIssues.slice(0, 5).forEach(function (issue) {
                console.log("   - ".concat(issue));
            });
        }
        console.log('\n💡 RECOMMENDATIONS:');
        analysis.recommendations.forEach(function (rec, index) {
            console.log("   ".concat(index + 1, ". ").concat(rec));
        });
        console.log('\n' + '='.repeat(80));
    };
    return ProjectStructureAnalyzer;
}());
exports.ProjectStructureAnalyzer = ProjectStructureAnalyzer;
// Run the analysis
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var analyzer, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    analyzer = new ProjectStructureAnalyzer();
                    return [4 /*yield*/, analyzer.analyzeProject()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('Analysis failed:', error_3);
                    process.exit(1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Run if this file is executed directly
main();
