"use strict";
/**
 * Streaming JSON Processor
 * Handles large JSON files by processing them in chunks to avoid memory issues
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
exports.streamingProcessor = exports.StreamingJSONProcessor = void 0;
var fs_1 = require("fs");
var stream_1 = require("stream");
var promises_1 = require("stream/promises");
var StreamingJSONProcessor = /** @class */ (function () {
    function StreamingJSONProcessor(options) {
        if (options === void 0) { options = {}; }
        this.options = {
            chunkSize: options.chunkSize || 1000,
            encoding: options.encoding || 'utf8',
            highWaterMark: options.highWaterMark || 16 * 1024, // 16KB
        };
    }
    /**
     * Process a JSON array file in chunks
     */
    StreamingJSONProcessor.prototype.processJSONArray = function (inputPath, processor, outputPath) {
        return __awaiter(this, void 0, void 0, function () {
            var readStream, buffer, itemCount, currentChunk, inArray, bracketDepth, inString, escapeNext, processChunk, writeStream, transform;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        readStream = (0, fs_1.createReadStream)(inputPath, {
                            encoding: this.options.encoding,
                            highWaterMark: this.options.highWaterMark,
                        });
                        buffer = '';
                        itemCount = 0;
                        currentChunk = [];
                        inArray = false;
                        bracketDepth = 0;
                        inString = false;
                        escapeNext = false;
                        processChunk = function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(currentChunk.length > 0)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, processor(currentChunk)];
                                    case 1:
                                        _a.sent();
                                        itemCount += currentChunk.length;
                                        currentChunk = [];
                                        _a.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); };
                        writeStream = outputPath ? (0, fs_1.createWriteStream)(outputPath) : null;
                        if (writeStream) {
                            writeStream.write('[');
                        }
                        transform = new stream_1.Transform({
                            objectMode: false,
                            transform: function (chunk, _encoding, callback) { return __awaiter(_this, void 0, void 0, function () {
                                var i, char, objectStart, objectBrackets, objectStr, parsedObject, parseError_1, lastCompleteObject, error_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 11, , 12]);
                                            buffer += chunk.toString();
                                            i = 0;
                                            _a.label = 1;
                                        case 1:
                                            if (!(i < buffer.length)) return [3 /*break*/, 10];
                                            char = buffer[i];
                                            if (escapeNext) {
                                                escapeNext = false;
                                                i++;
                                                return [3 /*break*/, 1];
                                            }
                                            if (char === '\\' && inString) {
                                                escapeNext = true;
                                                i++;
                                                return [3 /*break*/, 1];
                                            }
                                            if (char === '"' && !escapeNext) {
                                                inString = !inString;
                                            }
                                            if (!!inString) return [3 /*break*/, 9];
                                            if (!(char === '[')) return [3 /*break*/, 2];
                                            inArray = true;
                                            bracketDepth++;
                                            return [3 /*break*/, 9];
                                        case 2:
                                            if (!(char === ']')) return [3 /*break*/, 3];
                                            bracketDepth--;
                                            if (bracketDepth === 0) {
                                                inArray = false;
                                            }
                                            return [3 /*break*/, 9];
                                        case 3:
                                            if (!(char === '{' && inArray)) return [3 /*break*/, 4];
                                            bracketDepth++;
                                            return [3 /*break*/, 9];
                                        case 4:
                                            if (!(char === '}' && inArray)) return [3 /*break*/, 9];
                                            bracketDepth--;
                                            if (!(bracketDepth === 1)) return [3 /*break*/, 9];
                                            objectStart = i;
                                            objectBrackets = 1;
                                            while (objectStart > 0 && objectBrackets > 0) {
                                                objectStart--;
                                                if (buffer[objectStart] === '}' && !this.isInString(buffer, objectStart)) {
                                                    objectBrackets++;
                                                }
                                                else if (buffer[objectStart] === '{' && !this.isInString(buffer, objectStart)) {
                                                    objectBrackets--;
                                                }
                                            }
                                            _a.label = 5;
                                        case 5:
                                            _a.trys.push([5, 8, , 9]);
                                            objectStr = buffer.substring(objectStart, i + 1);
                                            parsedObject = JSON.parse(objectStr);
                                            currentChunk.push(parsedObject);
                                            if (!(currentChunk.length >= this.options.chunkSize)) return [3 /*break*/, 7];
                                            return [4 /*yield*/, processChunk()];
                                        case 6:
                                            _a.sent();
                                            _a.label = 7;
                                        case 7: return [3 /*break*/, 9];
                                        case 8:
                                            parseError_1 = _a.sent();
                                            // Skip invalid JSON objects
                                            console.warn('Failed to parse JSON object:', parseError_1);
                                            return [3 /*break*/, 9];
                                        case 9:
                                            i++;
                                            return [3 /*break*/, 1];
                                        case 10:
                                            lastCompleteObject = buffer.lastIndexOf('}');
                                            if (lastCompleteObject > -1 && lastCompleteObject < buffer.length - 1) {
                                                buffer = buffer.substring(lastCompleteObject + 1);
                                            }
                                            else if (!inArray) {
                                                buffer = '';
                                            }
                                            callback();
                                            return [3 /*break*/, 12];
                                        case 11:
                                            error_1 = _a.sent();
                                            callback(error_1);
                                            return [3 /*break*/, 12];
                                        case 12: return [2 /*return*/];
                                    }
                                });
                            }); },
                            flush: function (callback) { return __awaiter(_this, void 0, void 0, function () {
                                var error_2;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 2, , 3]);
                                            // Process any remaining items
                                            return [4 /*yield*/, processChunk()];
                                        case 1:
                                            // Process any remaining items
                                            _a.sent();
                                            if (writeStream) {
                                                writeStream.write(']');
                                                writeStream.end();
                                            }
                                            console.log("Processed ".concat(itemCount, " items total"));
                                            callback();
                                            return [3 /*break*/, 3];
                                        case 2:
                                            error_2 = _a.sent();
                                            callback(error_2);
                                            return [3 /*break*/, 3];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }
                        });
                        return [4 /*yield*/, (0, promises_1.pipeline)(readStream, transform)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if a character position is inside a string
     */
    StreamingJSONProcessor.prototype.isInString = function (buffer, position) {
        var inString = false;
        var escapeNext = false;
        for (var i = 0; i < position; i++) {
            var char = buffer[i];
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            if (char === '\\' && inString) {
                escapeNext = true;
                continue;
            }
            if (char === '"') {
                inString = !inString;
            }
        }
        return inString;
    };
    /**
     * Process a JSON Lines file (one JSON object per line)
     */
    StreamingJSONProcessor.prototype.processJSONLines = function (inputPath, processor) {
        return __awaiter(this, void 0, void 0, function () {
            var readStream, buffer, currentChunk, lineCount, processChunk, transform;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        readStream = (0, fs_1.createReadStream)(inputPath, {
                            encoding: this.options.encoding,
                        });
                        buffer = '';
                        currentChunk = [];
                        lineCount = 0;
                        processChunk = function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!(currentChunk.length > 0)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, processor(currentChunk)];
                                    case 1:
                                        _a.sent();
                                        lineCount += currentChunk.length;
                                        currentChunk = [];
                                        _a.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        }); };
                        transform = new stream_1.Transform({
                            objectMode: false,
                            transform: function (chunk, _encoding, callback) { return __awaiter(_this, void 0, void 0, function () {
                                var lines, _i, lines_1, line, trimmedLine, parsedObject, parseError_2, error_3;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 8, , 9]);
                                            buffer += chunk.toString();
                                            lines = buffer.split('\n');
                                            // Keep the last line in buffer (might be incomplete)
                                            buffer = lines.pop() || '';
                                            _i = 0, lines_1 = lines;
                                            _a.label = 1;
                                        case 1:
                                            if (!(_i < lines_1.length)) return [3 /*break*/, 7];
                                            line = lines_1[_i];
                                            trimmedLine = line.trim();
                                            if (!trimmedLine) return [3 /*break*/, 6];
                                            _a.label = 2;
                                        case 2:
                                            _a.trys.push([2, 5, , 6]);
                                            parsedObject = JSON.parse(trimmedLine);
                                            currentChunk.push(parsedObject);
                                            if (!(currentChunk.length >= this.options.chunkSize)) return [3 /*break*/, 4];
                                            return [4 /*yield*/, processChunk()];
                                        case 3:
                                            _a.sent();
                                            _a.label = 4;
                                        case 4: return [3 /*break*/, 6];
                                        case 5:
                                            parseError_2 = _a.sent();
                                            console.warn('Failed to parse JSON line:', parseError_2);
                                            return [3 /*break*/, 6];
                                        case 6:
                                            _i++;
                                            return [3 /*break*/, 1];
                                        case 7:
                                            callback();
                                            return [3 /*break*/, 9];
                                        case 8:
                                            error_3 = _a.sent();
                                            callback(error_3);
                                            return [3 /*break*/, 9];
                                        case 9: return [2 /*return*/];
                                    }
                                });
                            }); },
                            flush: function (callback) { return __awaiter(_this, void 0, void 0, function () {
                                var parsedObject, error_4;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 2, , 3]);
                                            // Process the last line if it exists
                                            if (buffer.trim()) {
                                                try {
                                                    parsedObject = JSON.parse(buffer.trim());
                                                    currentChunk.push(parsedObject);
                                                }
                                                catch (parseError) {
                                                    console.warn('Failed to parse final JSON line:', parseError);
                                                }
                                            }
                                            // Process any remaining items
                                            return [4 /*yield*/, processChunk()];
                                        case 1:
                                            // Process any remaining items
                                            _a.sent();
                                            console.log("Processed ".concat(lineCount, " lines total"));
                                            callback();
                                            return [3 /*break*/, 3];
                                        case 2:
                                            error_4 = _a.sent();
                                            callback(error_4);
                                            return [3 /*break*/, 3];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }
                        });
                        return [4 /*yield*/, (0, promises_1.pipeline)(readStream, transform)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Convert a large JSON array to JSON Lines format
     */
    StreamingJSONProcessor.prototype.convertArrayToLines = function (inputPath, outputPath) {
        return __awaiter(this, void 0, void 0, function () {
            var writeStream, isFirst;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        writeStream = (0, fs_1.createWriteStream)(outputPath);
                        isFirst = true;
                        return [4 /*yield*/, this.processJSONArray(inputPath, function (items) { return __awaiter(_this, void 0, void 0, function () {
                                var _i, items_1, item;
                                return __generator(this, function (_a) {
                                    for (_i = 0, items_1 = items; _i < items_1.length; _i++) {
                                        item = items_1[_i];
                                        if (!isFirst) {
                                            writeStream.write('\n');
                                        }
                                        writeStream.write(JSON.stringify(item));
                                        isFirst = false;
                                    }
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        writeStream.end();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get statistics about a JSON file
     */
    StreamingJSONProcessor.prototype.getFileStats = function (inputPath) {
        return __awaiter(this, void 0, void 0, function () {
            var fs, stats, totalItems;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('fs/promises'); })];
                    case 1:
                        fs = _a.sent();
                        return [4 /*yield*/, fs.stat(inputPath)];
                    case 2:
                        stats = _a.sent();
                        totalItems = 0;
                        return [4 /*yield*/, this.processJSONArray(inputPath, function (items) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    totalItems += items.length;
                                    return [2 /*return*/];
                                });
                            }); })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, {
                                totalItems: totalItems,
                                fileSize: stats.size,
                                estimatedMemoryUsage: stats.size * 2, // Rough estimate
                            }];
                }
            });
        });
    };
    return StreamingJSONProcessor;
}());
exports.StreamingJSONProcessor = StreamingJSONProcessor;
// Export default instance
exports.streamingProcessor = new StreamingJSONProcessor();
