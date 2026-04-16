"use strict";
/**
 * Hugging Face API Client for Land Verification App
 * Free tier APIs for testing functionality
 */
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
exports.landVerificationAI = exports.huggingFaceClient = exports.HuggingFaceApiClient = void 0;
var unified_api_client_1 = require("../../local/services/unified-api-client");
var HuggingFaceApiClient = /** @class */ (function () {
    function HuggingFaceApiClient(config) {
        if (config === void 0) { config = {}; }
        this.baseUrl = 'https://api-inference.huggingface.co';
        this.config = __assign({ baseUrl: 'https://api-inference.huggingface.co' }, config);
    }
    HuggingFaceApiClient.prototype.makeRequest = function (endpoint_1, data_1) {
        return __awaiter(this, arguments, void 0, function (endpoint, data, options) {
            var headers, response;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        headers = {
                            'Content-Type': 'application/json',
                        };
                        // Add auth header if API key is provided
                        if (this.config.apiKey) {
                            headers.Authorization = "Bearer ".concat(this.config.apiKey);
                        }
                        return [4 /*yield*/, unified_api_client_1.apiClient.post("".concat(this.config.baseUrl).concat(endpoint), data, {
                                headers: headers,
                                timeout: options.timeout || 30000
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    /**
     * Analyze property documents using OCR and NER
     */
    HuggingFaceApiClient.prototype.analyzePropertyDocument = function (imageBase64_1) {
        return __awaiter(this, arguments, void 0, function (imageBase64, documentType) {
            var ocrResult, extractedText, nerResult, entities, error_1;
            var _a, _b;
            if (documentType === void 0) { documentType = 'deed'; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest('/models/microsoft/trocr-base-printed', {
                                inputs: imageBase64,
                            })];
                    case 1:
                        ocrResult = _c.sent();
                        extractedText = ((_a = ocrResult[0]) === null || _a === void 0 ? void 0 : _a.generated_text) || '';
                        return [4 /*yield*/, this.makeRequest('/models/dbmdz/bert-large-cased-finetuned-conll03-english', {
                                inputs: extractedText,
                            })];
                    case 2:
                        nerResult = _c.sent();
                        entities = ((_b = nerResult[0]) === null || _b === void 0 ? void 0 : _b.map(function (entity) { return ({
                            label: entity.entity_group,
                            text: entity.word,
                            confidence: entity.score,
                        }); })) || [];
                        return [2 /*return*/, {
                                text: extractedText,
                                confidence: 0.85, // Average confidence
                                entities: entities,
                            }];
                    case 3:
                        error_1 = _c.sent();
                        console.error('Document analysis failed:', error_1);
                        throw new Error('Failed to analyze property document');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze satellite/aerial images for land verification
     */
    HuggingFaceApiClient.prototype.analyzeLandImage = function (imageBase64) {
        return __awaiter(this, void 0, void 0, function () {
            var result, labels, topLabels, description, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest('/models/google/vit-base-patch16-224', {
                                inputs: imageBase64,
                            })];
                    case 1:
                        result = _a.sent();
                        labels = result.map(function (item) { return ({
                            label: item.label,
                            confidence: item.score,
                        }); });
                        topLabels = labels.slice(0, 3).map(function (l) { return l.label; }).join(', ');
                        description = "Land appears to contain: ".concat(topLabels);
                        return [2 /*return*/, {
                                labels: labels,
                                description: description,
                            }];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Land image analysis failed:', error_2);
                        throw new Error('Failed to analyze land image');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Classify legal documents
     */
    HuggingFaceApiClient.prototype.classifyLegalDocument = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var result, classification, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest('/models/nlpaueb/legal-bert-base-uncased', {
                                inputs: text,
                            })];
                    case 1:
                        result = _b.sent();
                        classification = (_a = result[0]) === null || _a === void 0 ? void 0 : _a[0];
                        if (!classification) {
                            throw new Error('No classification result');
                        }
                        return [2 /*return*/, {
                                label: classification.label,
                                confidence: classification.score,
                            }];
                    case 2:
                        error_3 = _b.sent();
                        console.error('Legal document classification failed:', error_3);
                        // Fallback to general text classification
                        return [2 /*return*/, this.classifyText(text, [
                                'property_deed',
                                'survey_report',
                                'building_permit',
                                'contract',
                                'legal_notice',
                            ])];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * General text classification with custom labels
     */
    HuggingFaceApiClient.prototype.classifyText = function (text, candidateLabels) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest('/models/facebook/bart-large-mnli', {
                                inputs: text,
                                parameters: {
                                    candidate_labels: candidateLabels,
                                },
                            })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, {
                                label: result.labels[0],
                                confidence: result.scores[0],
                            }];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Text classification failed:', error_4);
                        throw new Error('Failed to classify text');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze property reviews sentiment
     */
    HuggingFaceApiClient.prototype.analyzePropertyReviewSentiment = function (review) {
        return __awaiter(this, void 0, void 0, function () {
            var result, sentiment, error_5;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest('/models/cardiffnlp/twitter-roberta-base-sentiment-latest', {
                                inputs: review,
                            })];
                    case 1:
                        result = _b.sent();
                        sentiment = (_a = result[0]) === null || _a === void 0 ? void 0 : _a[0];
                        if (!sentiment) {
                            throw new Error('No sentiment result');
                        }
                        return [2 /*return*/, {
                                label: sentiment.label,
                                confidence: sentiment.score,
                            }];
                    case 2:
                        error_5 = _b.sent();
                        console.error('Sentiment analysis failed:', error_5);
                        throw new Error('Failed to analyze sentiment');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Translate property descriptions
     */
    HuggingFaceApiClient.prototype.translateText = function (text_1) {
        return __awaiter(this, arguments, void 0, function (text, targetLanguage, sourceLanguage) {
            var modelName, result, error_6;
            var _a;
            if (targetLanguage === void 0) { targetLanguage = 'en'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        modelName = "Helsinki-NLP/opus-mt-".concat(sourceLanguage || 'auto', "-").concat(targetLanguage);
                        // Common translation models
                        if (!sourceLanguage) {
                            // Use multilingual model for auto-detection
                            modelName = 'facebook/mbart-large-50-many-to-many-mmt';
                        }
                        return [4 /*yield*/, this.makeRequest("/models/".concat(modelName), {
                                inputs: text,
                            })];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, {
                                translatedText: ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.translation_text) || text,
                                sourceLanguage: sourceLanguage || 'auto',
                                targetLanguage: targetLanguage,
                            }];
                    case 2:
                        error_6 = _b.sent();
                        console.error('Translation failed:', error_6);
                        throw new Error('Failed to translate text');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extract information from property descriptions using Q&A
     */
    HuggingFaceApiClient.prototype.extractPropertyInfo = function (propertyDescription, question) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest('/models/deepset/roberta-base-squad2', {
                                inputs: {
                                    question: question,
                                    context: propertyDescription,
                                },
                            })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, {
                                answer: result.answer,
                                confidence: result.score,
                            }];
                    case 2:
                        error_7 = _a.sent();
                        console.error('Property info extraction failed:', error_7);
                        throw new Error('Failed to extract property information');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate property description summary
     */
    HuggingFaceApiClient.prototype.summarizePropertyDocument = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_8;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest('/models/facebook/bart-large-cnn', {
                                inputs: text,
                                parameters: {
                                    max_length: 150,
                                    min_length: 50,
                                },
                            })];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.summary_text) || 'Unable to generate summary'];
                    case 2:
                        error_8 = _b.sent();
                        console.error('Summarization failed:', error_8);
                        throw new Error('Failed to summarize document');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Detect potential fraud indicators in property documents
     */
    HuggingFaceApiClient.prototype.detectFraudIndicators = function (documentText) {
        return __awaiter(this, void 0, void 0, function () {
            var suspiciousPatterns, classification, riskLevel, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        suspiciousPatterns = [
                            'fraudulent_document',
                            'forged_signature',
                            'altered_dates',
                            'suspicious_pricing',
                            'fake_credentials',
                        ];
                        return [4 /*yield*/, this.classifyText(documentText, suspiciousPatterns)];
                    case 1:
                        classification = _a.sent();
                        riskLevel = classification.confidence > 0.7 ? 'high' :
                            classification.confidence > 0.4 ? 'medium' : 'low';
                        return [2 /*return*/, {
                                riskLevel: riskLevel,
                                indicators: classification.confidence > 0.4 ? [classification.label] : [],
                                confidence: classification.confidence,
                            }];
                    case 2:
                        error_9 = _a.sent();
                        console.error('Fraud detection failed:', error_9);
                        return [2 /*return*/, {
                                riskLevel: 'low',
                                indicators: [],
                                confidence: 0,
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return HuggingFaceApiClient;
}());
exports.HuggingFaceApiClient = HuggingFaceApiClient;
// Export singleton instance
exports.huggingFaceClient = new HuggingFaceApiClient();
// Export utility functions for common use cases
exports.landVerificationAI = {
    analyzePropertyDocument: function (imageBase64, documentType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.huggingFaceClient.analyzePropertyDocument(imageBase64, documentType)];
            });
        });
    },
    analyzeLandImage: function (imageBase64) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.huggingFaceClient.analyzeLandImage(imageBase64)];
            });
        });
    },
    classifyLegalDocument: function (text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.huggingFaceClient.classifyLegalDocument(text)];
            });
        });
    },
    analyzePropertyReview: function (review) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.huggingFaceClient.analyzePropertyReviewSentiment(review)];
            });
        });
    },
    translatePropertyDescription: function (text, targetLanguage) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.huggingFaceClient.translateText(text, targetLanguage)];
            });
        });
    },
    extractPropertyDetails: function (description, question) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.huggingFaceClient.extractPropertyInfo(description, question)];
            });
        });
    },
    summarizeDocument: function (text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.huggingFaceClient.summarizePropertyDocument(text)];
            });
        });
    },
    checkDocumentAuthenticity: function (text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, exports.huggingFaceClient.detectFraudIndicators(text)];
            });
        });
    },
};
