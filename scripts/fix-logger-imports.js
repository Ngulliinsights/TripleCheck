"use strict";
/**
 * Script to fix logger imports from old location to new location
 * Old: from '../infrastructure/monitoring/logger'
 * New: from '../infrastructure/observability/telemetry'
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
var fs = require("fs");
var path = require("path");
var fixes = [];
function getAllTsFiles(dir, fileList) {
    if (fileList === void 0) { fileList = []; }
    var files = fs.readdirSync(dir);
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var file = files_1[_i];
        var filePath = path.join(dir, file);
        var stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('dist')) {
                getAllTsFiles(filePath, fileList);
            }
        }
        else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}
function fixLoggerImports() {
    return __awaiter(this, void 0, void 0, function () {
        var files, _i, files_2, file, content, lines, modified, newLines, i, line, originalLine, oldImport, report;
        return __generator(this, function (_a) {
            files = getAllTsFiles('server');
            console.log("Found ".concat(files.length, " TypeScript files to process"));
            for (_i = 0, files_2 = files; _i < files_2.length; _i++) {
                file = files_2[_i];
                content = fs.readFileSync(file, 'utf-8');
                lines = content.split('\n');
                modified = false;
                newLines = [];
                for (i = 0; i < lines.length; i++) {
                    line = lines[i];
                    originalLine = line;
                    // Fix logger imports from old monitoring location to new observability location
                    if (line.includes('infrastructure/monitoring/logger')) {
                        oldImport = line;
                        line = line.replace(/(['"])(.*)infrastructure\/monitoring\/logger(['"])/g, function (match, quote1, prefix, quote2) {
                            return "".concat(quote1).concat(prefix, "infrastructure/observability/telemetry").concat(quote2);
                        });
                        if (line !== originalLine) {
                            modified = true;
                            fixes.push({
                                file: file,
                                line: i + 1,
                                oldImport: originalLine.trim(),
                                newImport: line.trim(),
                            });
                        }
                    }
                    newLines.push(line);
                }
                if (modified) {
                    fs.writeFileSync(file, newLines.join('\n'), 'utf-8');
                    console.log("\u2713 Fixed ".concat(file));
                }
            }
            console.log("\n\u2705 Fixed ".concat(fixes.length, " logger imports in ").concat(files.length, " files"));
            report = fixes.map(function (f) {
                return "".concat(f.file, ":").concat(f.line, "\n  OLD: ").concat(f.oldImport, "\n  NEW: ").concat(f.newImport, "\n");
            }).join('\n');
            fs.writeFileSync('logger-import-fixes-report.txt', report);
            console.log('📄 Report written to logger-import-fixes-report.txt');
            return [2 /*return*/];
        });
    });
}
fixLoggerImports().catch(console.error);
