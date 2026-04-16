"use strict";
/**
 * Mock Hugging Face API Client for Testing
 * Uses realistic mock data instead of actual API calls
 * Optimized for TypeScript safety and functionality
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleTestData = exports.mockLandVerificationAI = exports.mockHuggingFaceClient = exports.MockHuggingFaceApiClient = void 0;
var mock_ai_data_1 = require("./mock-ai-data");
// Type-safe error simulation - using a class for proper property assignment
var MockApiError = /** @class */ (function (_super) {
    __extends(MockApiError, _super);
    function MockApiError(message, errorType) {
        var _this = _super.call(this, message) || this;
        _this.isSimulated = true;
        _this.name = 'MockApiError';
        _this.errorType = errorType;
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(_this, MockApiError.prototype);
        return _this;
    }
    return MockApiError;
}(Error));
// Utility type guards for runtime type safety
function isValidLabel(value) {
    return typeof value === 'string' && value.trim().length > 0;
}
function isValidConfidence(value) {
    return typeof value === 'number' && value >= 0 && value <= 1;
}
// Safe extraction utilities that guarantee return types
var safeExtractors = {
    /**
     * Extracts a label with guaranteed string return
     * This function encapsulates all the label extraction logic and ensures
     * we always get a valid string, which eliminates the TypeScript error
     *
     * The key improvement here is the explicit return type annotation
     * combined with comprehensive fallback handling
     */
    extractLabel: function (result, fallback) {
        if (fallback === void 0) { fallback = 'unknown'; }
        // Early return for direct string values
        if (isValidLabel(result)) {
            return result;
        }
        if (typeof result === 'object' && result !== null) {
            var obj = result;
            // Direct label property
            if ('label' in obj && isValidLabel(obj.label)) {
                return obj.label;
            }
            // Labels array (common in ML APIs)
            if ('labels' in obj && Array.isArray(obj.labels) && obj.labels.length > 0) {
                var firstLabel = obj.labels[0];
                if (typeof firstLabel === 'object' && firstLabel !== null && 'label' in firstLabel) {
                    var labelValue = firstLabel.label;
                    if (isValidLabel(labelValue)) {
                        return labelValue;
                    }
                }
                // Handle case where labels array contains direct string values
                if (isValidLabel(firstLabel)) {
                    return firstLabel;
                }
            }
            // Handle classification results that might have a 'class' or 'category' field
            var alternativeKeys = ['class', 'category', 'type', 'classification'];
            for (var _i = 0, alternativeKeys_1 = alternativeKeys; _i < alternativeKeys_1.length; _i++) {
                var key = alternativeKeys_1[_i];
                if (key in obj && isValidLabel(obj[key])) {
                    return obj[key];
                }
            }
        }
        // This fallback ensures we ALWAYS return a valid string
        return fallback;
    },
    /**
     * Extracts confidence with guaranteed number return
     * Includes range validation to ensure confidence stays within [0, 1]
     */
    extractConfidence: function (result, fallback) {
        if (fallback === void 0) { fallback = 0.5; }
        if (isValidConfidence(result)) {
            return result;
        }
        if (typeof result === 'object' && result !== null) {
            var obj = result;
            // Direct confidence property
            if ('confidence' in obj && isValidConfidence(obj.confidence)) {
                return obj.confidence;
            }
            // Score property (alternative naming)
            if ('score' in obj && isValidConfidence(obj.score)) {
                return obj.score;
            }
            // Labels array with confidence
            if ('labels' in obj && Array.isArray(obj.labels) && obj.labels.length > 0) {
                var firstLabel = obj.labels[0];
                if (typeof firstLabel === 'object' && firstLabel !== null) {
                    var labelObj = firstLabel;
                    if ('confidence' in labelObj && isValidConfidence(labelObj.confidence)) {
                        return labelObj.confidence;
                    }
                    if ('score' in labelObj && isValidConfidence(labelObj.score)) {
                        return labelObj.score;
                    }
                }
            }
        }
        // Ensure fallback is within valid range
        return Math.max(0, Math.min(1, fallback));
    },
    /**
     * Extracts translated text with guaranteed string return
     */
    extractTranslatedText: function (result, originalText) {
        if (typeof result === 'string') {
            return result;
        }
        if (typeof result === 'object' && result !== null) {
            var obj = result;
            var textKeys = ['translatedText', 'translation', 'text', 'output'];
            for (var _i = 0, textKeys_1 = textKeys; _i < textKeys_1.length; _i++) {
                var key = textKeys_1[_i];
                if (key in obj && typeof obj[key] === 'string') {
                    return obj[key];
                }
            }
        }
        return originalText; // Fallback to original if translation fails
    }
};
var MockHuggingFaceApiClient = /** @class */ (function () {
    function MockHuggingFaceApiClient(config) {
        if (config === void 0) { config = {}; }
        var _a, _b, _c;
        this.config = {
            useMockData: (_a = config.useMockData) !== null && _a !== void 0 ? _a : true,
            errorRate: Math.max(0, Math.min(1, (_b = config.errorRate) !== null && _b !== void 0 ? _b : 0.05)),
            simulateNetworkDelay: (_c = config.simulateNetworkDelay) !== null && _c !== void 0 ? _c : true
        };
    }
    /**
     * Simulates API call behavior with proper error handling and delays
     * This method ensures consistent behavior across all mock operations
     */
    MockHuggingFaceApiClient.prototype.simulateApiCall = function (operation, processingType) {
        return __awaiter(this, void 0, void 0, function () {
            var delay_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.simulateNetworkDelay) return [3 /*break*/, 2];
                        delay_1 = (0, mock_ai_data_1.simulateProcessingDelay)(processingType);
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // Simulate occasional API errors based on configured rate
                        if (Math.random() < this.config.errorRate) {
                            throw new MockApiError("Mock API error: ".concat(processingType, " service temporarily unavailable"), processingType);
                        }
                        return [4 /*yield*/, operation()];
                    case 3: 
                    // Execute the operation (could be sync or async)
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Analyzes property documents with enhanced type safety
     * Ensures the returned data always matches DocumentAnalysisResult interface
     */
    MockHuggingFaceApiClient.prototype.analyzePropertyDocument = function (imageBase64_1) {
        return __awaiter(this, arguments, void 0, function (imageBase64, documentType) {
            if (documentType === void 0) { documentType = 'deed'; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.simulateApiCall(function () {
                        // Type-safe document ID mapping
                        var documentIdMap = {
                            deed: 'deed_001',
                            survey: 'survey_001',
                            permit: 'permit_001',
                            contract: 'deed_001' // Fallback to deed for contract
                        };
                        var docId = documentIdMap[documentType];
                        var result = mock_ai_data_1.mockAIResponses.documentOCR(docId);
                        // Ensure the result conforms to DocumentAnalysisResult
                        return __assign(__assign({}, result), { 
                            // Add any missing properties with safe defaults if needed
                            confidence: safeExtractors.extractConfidence(result.confidence, 0.85) });
                    }, 'ocr')];
            });
        });
    };
    /**
     * Analyzes land images with consistent random selection
     */
    MockHuggingFaceApiClient.prototype.analyzeLandImage = function (imageBase64) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.simulateApiCall(function () {
                        var imageId = "sat_00".concat(Math.floor(Math.random() * 3) + 1);
                        var result = mock_ai_data_1.mockAIResponses.imageAnalysis(imageId);
                        return __assign(__assign({}, result), { confidence: safeExtractors.extractConfidence(result, 0.80) });
                    }, 'image')];
            });
        });
    };
    /**
     * Classifies legal documents with proper text validation
     * FIXED: This method now properly handles the type safety issue
     *
     * The key improvement is ensuring that both label and score
     * are extracted using our safe extractors, and we construct the
     * return object in a way that TypeScript can verify matches the interface
     */
    MockHuggingFaceApiClient.prototype.classifyLegalDocument = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.simulateApiCall(function () {
                        // Validate input text early
                        if (!text || text.trim().length === 0) {
                            // Return a properly typed result for empty input
                            return {
                                label: 'unknown',
                                score: 0.1
                            };
                        }
                        // Get the mock response
                        var mockResult = mock_ai_data_1.mockAIResponses.documentClassification(text);
                        // Use safe extractors to guarantee proper types
                        // These methods are guaranteed to return the correct types
                        var extractedLabel = safeExtractors.extractLabel(mockResult, 'unknown');
                        var extractedConfidence = safeExtractors.extractConfidence(mockResult, 0.5);
                        // Construct the result object with explicit type satisfaction
                        var result = {
                            label: extractedLabel, // Now guaranteed to be string
                            score: extractedConfidence // Now guaranteed to be number in valid range
                        };
                        return result;
                    }, 'classification')];
            });
        });
    };
    /**
     * Generic text classification with candidate labels
     * Ensures type safety for all possible return values
     */
    MockHuggingFaceApiClient.prototype.classifyText = function (text, candidateLabels) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.simulateApiCall(function () {
                        // Handle edge cases with proper typing
                        if (!candidateLabels || candidateLabels.length === 0) {
                            return {
                                label: 'unknown',
                                score: 0.1
                            };
                        }
                        // Pick a random label from candidates with varying confidence
                        var randomIndex = Math.floor(Math.random() * candidateLabels.length);
                        var selectedLabel = candidateLabels[randomIndex];
                        var confidence = 0.6 + Math.random() * 0.35; // 0.6 to 0.95
                        return {
                            label: selectedLabel, // Guaranteed to be string from candidateLabels
                            score: Math.min(confidence, 0.95)
                        };
                    }, 'classification')];
            });
        });
    };
    /**
     * Analyzes property review sentiment with intelligent keyword detection
     * Enhanced with more sophisticated sentiment analysis logic
     */
    MockHuggingFaceApiClient.prototype.analyzePropertyReviewSentiment = function (review) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.simulateApiCall(function () {
                        // Enhanced sentiment analysis with more comprehensive word lists
                        var positiveWords = [
                            'excellent', 'great', 'good', 'amazing', 'perfect', 'recommended',
                            'wonderful', 'fantastic', 'outstanding', 'superb', 'brilliant',
                            'love', 'satisfied', 'pleased', 'happy', 'delighted', 'impressive',
                            'quality', 'professional', 'reliable', 'trustworthy', 'efficient'
                        ];
                        var negativeWords = [
                            'terrible', 'bad', 'awful', 'disappointing', 'worst', 'horrible',
                            'disgusting', 'unacceptable', 'frustrated', 'angry', 'hate',
                            'poor', 'inadequate', 'unsatisfied', 'regret', 'waste', 'scam',
                            'unprofessional', 'unreliable', 'delayed', 'overpriced', 'rude'
                        ];
                        var lowerReview = review.toLowerCase();
                        // More sophisticated scoring that considers word frequency and position
                        var positiveMatches = positiveWords.filter(function (word) { return lowerReview.includes(word); });
                        var negativeMatches = negativeWords.filter(function (word) { return lowerReview.includes(word); });
                        var positiveScore = positiveMatches.length;
                        var negativeScore = negativeMatches.length;
                        // Determine sentiment with explicit typing
                        var label;
                        var confidence;
                        if (positiveScore > negativeScore) {
                            label = 'LABEL_2'; // Positive
                            confidence = Math.min(0.75 + (positiveScore * 0.05), 0.95);
                        }
                        else if (negativeScore > positiveScore) {
                            label = 'LABEL_0'; // Negative  
                            confidence = Math.min(0.75 + (negativeScore * 0.05), 0.95);
                        }
                        else {
                            label = 'LABEL_1'; // Neutral
                            confidence = 0.65;
                        }
                        return {
                            label: label,
                            score: confidence
                        };
                    }, 'sentiment')];
            });
        });
    };
    /**
     * Translates text with proper language validation
     */
    MockHuggingFaceApiClient.prototype.translateText = function (text_1) {
        return __awaiter(this, arguments, void 0, function (text, targetLanguage, sourceLanguage) {
            if (targetLanguage === void 0) { targetLanguage = 'en'; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.simulateApiCall(function () {
                        var mockResult = mock_ai_data_1.mockAIResponses.translation(text, targetLanguage);
                        var translatedText = safeExtractors.extractTranslatedText(mockResult, text);
                        var confidence = safeExtractors.extractConfidence(mockResult, 0.85);
                        return {
                            translation_text: translatedText,
                            sourceLanguage: sourceLanguage || 'auto',
                            targetLanguage: targetLanguage,
                            confidence: confidence
                        };
                    }, 'translation')];
            });
        });
    };
    /**
     * Extracts property information with guaranteed answer format
     */
    MockHuggingFaceApiClient.prototype.extractPropertyInfo = function (propertyDescription, question) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.simulateApiCall(function () {
                        var result = mock_ai_data_1.mockAIResponses.questionAnswering(propertyDescription, question);
                        // Handle different response formats from mock data
                        if (typeof result === 'object' && result !== null) {
                            var obj = result;
                            // Modern format with 'answer' property
                            if ('answer' in obj && typeof obj.answer === 'string') {
                                return {
                                    answer: obj.answer,
                                    confidence: safeExtractors.extractConfidence(obj.confidence, 0.7)
                                };
                            }
                            // Legacy format with 'a' property
                            if ('a' in obj && typeof obj.a === 'string') {
                                return {
                                    answer: obj.a,
                                    confidence: safeExtractors.extractConfidence(obj.confidence, 0.7)
                                };
                            }
                        }
                        // Fallback for unexpected formats
                        return {
                            answer: 'Information not available',
                            confidence: 0.1
                        };
                    }, 'qa')];
            });
        });
    };
    /**
     * Summarizes property documents with guaranteed string return
     */
    MockHuggingFaceApiClient.prototype.summarizePropertyDocument = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.simulateApiCall(function () {
                        var result = mock_ai_data_1.mockAIResponses.summarization(text);
                        // Handle case where result is already a string
                        if (typeof result === 'string') {
                            return result;
                        }
                        // Handle object results with various summary property names
                        if (typeof result === 'object' && result !== null) {
                            var obj = result;
                            var summaryKeys = ['summary', 'text', 'content', 'summaryText', 'output'];
                            for (var _i = 0, summaryKeys_1 = summaryKeys; _i < summaryKeys_1.length; _i++) {
                                var key = summaryKeys_1[_i];
                                if (key in obj && typeof obj[key] === 'string') {
                                    return obj[key];
                                }
                            }
                        }
                        // Ultimate fallback
                        return 'Summary not available';
                    }, 'summary')];
            });
        });
    };
    /**
     * Detects fraud indicators with strict type compliance
     */
    MockHuggingFaceApiClient.prototype.detectFraudIndicators = function (documentText) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.simulateApiCall(function () {
                        var result = mock_ai_data_1.mockAIResponses.fraudDetection(documentText);
                        // Ensure proper risk level typing with validation
                        var validRiskLevels = ['low', 'medium', 'high'];
                        var resultRiskLevel = typeof result === 'object' && result !== null ?
                            result.riskLevel : undefined;
                        var riskLevel = validRiskLevels.includes(resultRiskLevel)
                            ? resultRiskLevel
                            : 'medium'; // Safe default
                        // Extract and filter indicators safely
                        var rawIndicators = typeof result === 'object' && result !== null ?
                            result.indicators : [];
                        var indicators = Array.isArray(rawIndicators)
                            ? rawIndicators.filter(function (indicator) {
                                return typeof indicator === 'string' && indicator.trim().length > 0;
                            })
                            : [];
                        var confidence = safeExtractors.extractConfidence(typeof result === 'object' && result !== null ?
                            result.confidence : undefined, 0.5);
                        return {
                            riskLevel: riskLevel,
                            indicators: indicators,
                            confidence: confidence
                        };
                    }, 'fraud')];
            });
        });
    };
    /**
     * Utility method for testing error simulation
     */
    MockHuggingFaceApiClient.prototype.testErrorSimulation = function () {
        return __awaiter(this, arguments, void 0, function (processingType) {
            var error_1;
            if (processingType === void 0) { processingType = 'test'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.simulateApiCall(function () { return true; }, processingType)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, error_1.isSimulated === true];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return MockHuggingFaceApiClient;
}());
exports.MockHuggingFaceApiClient = MockHuggingFaceApiClient;
// Export mock instance with default configuration
exports.mockHuggingFaceClient = new MockHuggingFaceApiClient();
// Export utility functions for testing with enhanced type safety
exports.mockLandVerificationAI = {
    /**
     * Analyze property documents with type-safe wrapper
     */
    analyzePropertyDocument: function (imageBase64, documentType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.mockHuggingFaceClient.analyzePropertyDocument(imageBase64, documentType)];
            });
        });
    },
    /**
     * Analyze land images with validation
     */
    analyzeLandImage: function (imageBase64) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!imageBase64) {
                    throw new Error('Image data is required');
                }
                return [2 /*return*/, exports.mockHuggingFaceClient.analyzeLandImage(imageBase64)];
            });
        });
    },
    /**
     * Classify legal documents with input validation
     */
    classifyLegalDocument: function (text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!text || text.trim().length === 0) {
                    throw new Error('Document text is required');
                }
                return [2 /*return*/, exports.mockHuggingFaceClient.classifyLegalDocument(text)];
            });
        });
    },
    /**
     * Analyze property reviews with sentiment analysis
     */
    analyzePropertyReview: function (review) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.mockHuggingFaceClient.analyzePropertyReviewSentiment(review)];
            });
        });
    },
    /**
     * Translate property descriptions with language validation
     */
    translatePropertyDescription: function (text, targetLanguage) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.mockHuggingFaceClient.translateText(text, targetLanguage)];
            });
        });
    },
    /**
     * Extract property details with Q&A functionality
     */
    extractPropertyDetails: function (description, question) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.mockHuggingFaceClient.extractPropertyInfo(description, question)];
            });
        });
    },
    /**
     * Summarize documents with guaranteed string output
     */
    summarizeDocument: function (text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.mockHuggingFaceClient.summarizePropertyDocument(text)];
            });
        });
    },
    /**
     * Check document authenticity with fraud detection
     */
    checkDocumentAuthenticity: function (text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.mockHuggingFaceClient.detectFraudIndicators(text)];
            });
        });
    },
};
// Export sample data for easy testing
var mock_ai_data_2 = require("./mock-ai-data");
Object.defineProperty(exports, "sampleTestData", { enumerable: true, get: function () { return mock_ai_data_2.sampleTestData; } });
