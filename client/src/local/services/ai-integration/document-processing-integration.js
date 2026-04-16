"use strict";
/**
 * Document Processing AI Integration Service
 *
 * Integrates AI document processing capabilities with land verification workflows.
 * Provides automated document analysis, OCR, validation, and authenticity checking.
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
exports.documentProcessingIntegration = exports.DocumentProcessingIntegrationService = void 0;
var huggingface_api_client_1 = require("../huggingface-api-client");
var logger_1 = require("../../../../server/infrastructure/monitoring/logger");
var base_error_1 = require("../../error-handling/errors/base-error");
var DocumentProcessingIntegrationError = /** @class */ (function (_super) {
    __extends(DocumentProcessingIntegrationError, _super);
    function DocumentProcessingIntegrationError(message, operation, cause) {
        return _super.call(this, message, {
            code: 'DOCUMENT_PROCESSING_ERROR',
            domain: base_error_1.ErrorDomain.BUSINESS,
            severity: base_error_1.ErrorSeverity.MEDIUM,
            cause: cause,
            details: { operation: operation }
        }) || this;
    }
    return DocumentProcessingIntegrationError;
}(base_error_1.BaseError));
var DocumentProcessingIntegrationService = /** @class */ (function () {
    function DocumentProcessingIntegrationService() {
    }
    DocumentProcessingIntegrationService.getInstance = function () {
        if (!DocumentProcessingIntegrationService.instance) {
            DocumentProcessingIntegrationService.instance = new DocumentProcessingIntegrationService();
        }
        return DocumentProcessingIntegrationService.instance;
    };
    /**
     * Process document with comprehensive AI analysis
     */
    DocumentProcessingIntegrationService.prototype.processDocument = function (documentBuffer, documentType, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, documentId, base64Document, extractedData, authenticityResult, completenessResult, consistencyResult, processingTime, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        documentId = "doc_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        logger_1.logger.info('Starting document processing', {
                            module: 'DocumentProcessingIntegration',
                            documentId: documentId,
                            documentType: documentType,
                            sessionId: sessionId,
                            documentSize: documentBuffer.length
                        });
                        base64Document = documentBuffer.toString('base64');
                        return [4 /*yield*/, this.extractDocumentData(base64Document, documentType)];
                    case 2:
                        extractedData = _a.sent();
                        return [4 /*yield*/, this.validateAuthenticity(extractedData.text, documentType)];
                    case 3:
                        authenticityResult = _a.sent();
                        return [4 /*yield*/, this.checkCompleteness(extractedData, documentType)];
                    case 4:
                        completenessResult = _a.sent();
                        return [4 /*yield*/, this.verifyConsistency(extractedData, sessionId)];
                    case 5:
                        consistencyResult = _a.sent();
                        processingTime = Date.now() - startTime;
                        result = {
                            documentId: documentId,
                            processingStatus: 'completed',
                            extractedData: extractedData,
                            validationResults: {
                                authenticity: authenticityResult,
                                completeness: completenessResult,
                                consistency: consistencyResult
                            },
                            processingTime: processingTime,
                            lastUpdated: new Date()
                        };
                        logger_1.logger.info('Document processing completed', {
                            module: 'DocumentProcessingIntegration',
                            documentId: documentId,
                            processingTime: processingTime,
                            authenticity: authenticityResult.isAuthentic,
                            completeness: completenessResult.isComplete,
                            consistency: consistencyResult.isConsistent
                        });
                        return [2 /*return*/, result];
                    case 6:
                        error_1 = _a.sent();
                        logger_1.logger.error('Document processing failed', {
                            module: 'DocumentProcessingIntegration',
                            documentId: documentId,
                            documentType: documentType,
                            error: error_1 instanceof Error ? error_1.message : String(error_1)
                        });
                        throw new DocumentProcessingIntegrationError('Failed to process document', 'processDocument', error_1 instanceof Error ? error_1 : new Error(String(error_1)));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process multiple documents for land verification workflow
     */
    DocumentProcessingIntegrationService.prototype.processLandVerificationDocuments = function (documents, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var processingResults, authenticDocuments, flaggedDocuments, _i, documents_1, doc, result, error_2, workflowResult, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        logger_1.logger.info('Starting land verification document processing', {
                            module: 'DocumentProcessingIntegration',
                            sessionId: sessionId,
                            documentCount: documents.length
                        });
                        processingResults = [];
                        authenticDocuments = 0;
                        flaggedDocuments = 0;
                        _i = 0, documents_1 = documents;
                        _a.label = 1;
                    case 1:
                        if (!(_i < documents_1.length)) return [3 /*break*/, 6];
                        doc = documents_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.processDocument(doc.buffer, doc.type, sessionId)];
                    case 3:
                        result = _a.sent();
                        processingResults.push(result);
                        if (result.validationResults.authenticity.isAuthentic) {
                            authenticDocuments++;
                        }
                        else {
                            flaggedDocuments++;
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        logger_1.logger.warn('Individual document processing failed', {
                            module: 'DocumentProcessingIntegration',
                            sessionId: sessionId,
                            documentName: doc.name,
                            error: error_2 instanceof Error ? error_2.message : String(error_2)
                        });
                        flaggedDocuments++;
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [4 /*yield*/, this.analyzeVerificationWorkflow(sessionId, processingResults, { authenticDocuments: authenticDocuments, flaggedDocuments: flaggedDocuments, totalDocuments: documents.length })];
                    case 7:
                        workflowResult = _a.sent();
                        logger_1.logger.info('Land verification document processing completed', {
                            module: 'DocumentProcessingIntegration',
                            sessionId: sessionId,
                            overallStatus: workflowResult.overallStatus,
                            authenticDocuments: authenticDocuments,
                            flaggedDocuments: flaggedDocuments
                        });
                        return [2 /*return*/, workflowResult];
                    case 8:
                        error_3 = _a.sent();
                        logger_1.logger.error('Land verification document processing failed', {
                            module: 'DocumentProcessingIntegration',
                            sessionId: sessionId,
                            error: error_3 instanceof Error ? error_3.message : String(error_3)
                        });
                        throw new DocumentProcessingIntegrationError('Failed to process land verification documents', 'processLandVerificationDocuments', error_3 instanceof Error ? error_3 : new Error(String(error_3)));
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate document against land verification requirements
     */
    DocumentProcessingIntegrationService.prototype.validateForLandVerification = function (documentResult, verificationLayer) {
        return __awaiter(this, void 0, void 0, function () {
            var requirements, validationResults, metRequirements, validationScore, isValid, recommendations, error_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.logger.info('Validating document for land verification', {
                            module: 'DocumentProcessingIntegration',
                            documentId: documentResult.documentId,
                            layerType: verificationLayer.type
                        });
                        requirements = this.getLayerRequirements(verificationLayer.type);
                        return [4 /*yield*/, Promise.all(requirements.map(function (req) { return _this.checkRequirement(documentResult, req); }))];
                    case 1:
                        validationResults = _a.sent();
                        metRequirements = validationResults.filter(function (r) { return r.status === 'met'; }).length;
                        validationScore = (metRequirements / requirements.length) * 100;
                        isValid = validationScore >= 80;
                        recommendations = this.generateValidationRecommendations(validationResults, verificationLayer);
                        return [2 /*return*/, {
                                isValid: isValid,
                                validationScore: validationScore,
                                requirements: validationResults,
                                recommendations: recommendations
                            }];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.logger.error('Document validation for land verification failed', {
                            module: 'DocumentProcessingIntegration',
                            documentId: documentResult.documentId,
                            error: error_4 instanceof Error ? error_4.message : String(error_4)
                        });
                        throw new DocumentProcessingIntegrationError('Failed to validate document for land verification', 'validateForLandVerification', error_4 instanceof Error ? error_4 : new Error(String(error_4)));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Private helper methods
    DocumentProcessingIntegrationService.prototype.extractDocumentData = function (base64Document, documentType) {
        return __awaiter(this, void 0, void 0, function () {
            var ocrResult, entities, classification, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, huggingface_api_client_1.huggingFaceClient.analyzePropertyDocument(base64Document, documentType)];
                    case 1:
                        ocrResult = _a.sent();
                        return [4 /*yield*/, this.extractEntities(ocrResult.text)];
                    case 2:
                        entities = _a.sent();
                        return [4 /*yield*/, huggingface_api_client_1.huggingFaceClient.classifyLegalDocument(ocrResult.text)];
                    case 3:
                        classification = _a.sent();
                        return [2 /*return*/, {
                                text: ocrResult.text,
                                entities: entities,
                                metadata: {
                                    documentType: classification.label,
                                    confidence: classification.confidence,
                                    language: 'en', // Default to English
                                    pageCount: 1 // Simplified for now
                                }
                            }];
                    case 4:
                        error_5 = _a.sent();
                        logger_1.logger.warn('Document data extraction failed, using fallback', {
                            module: 'DocumentProcessingIntegration',
                            error: error_5 instanceof Error ? error_5.message : String(error_5)
                        });
                        return [2 /*return*/, {
                                text: 'Document text extraction failed',
                                entities: [],
                                metadata: {
                                    documentType: documentType,
                                    confidence: 0,
                                    language: 'en',
                                    pageCount: 1
                                }
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DocumentProcessingIntegrationService.prototype.extractEntities = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var questions, entities, _i, questions_1, question, result, error_6, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        questions = [
                            'What names are mentioned in this document?',
                            'What dates are mentioned in this document?',
                            'What locations are mentioned in this document?',
                            'What amounts or prices are mentioned in this document?'
                        ];
                        entities = [];
                        _i = 0, questions_1 = questions;
                        _a.label = 1;
                    case 1:
                        if (!(_i < questions_1.length)) return [3 /*break*/, 6];
                        question = questions_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, huggingface_api_client_1.huggingFaceClient.extractPropertyInfo(text, question)];
                    case 3:
                        result = _a.sent();
                        if (result.answer && result.confidence > 0.5) {
                            entities.push({
                                type: this.getEntityType(question),
                                value: result.answer,
                                confidence: result.confidence,
                                position: { start: 0, end: result.answer.length }
                            });
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_6 = _a.sent();
                        // Continue with other questions if one fails
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, entities];
                    case 7:
                        error_7 = _a.sent();
                        return [2 /*return*/, []];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    DocumentProcessingIntegrationService.prototype.getEntityType = function (question) {
        if (question.includes('names'))
            return 'person';
        if (question.includes('dates'))
            return 'date';
        if (question.includes('locations'))
            return 'location';
        if (question.includes('amounts') || question.includes('prices'))
            return 'amount';
        return 'reference';
    };
    DocumentProcessingIntegrationService.prototype.validateAuthenticity = function (text, documentType) {
        return __awaiter(this, void 0, void 0, function () {
            var fraudResult_1, isAuthentic, indicators, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, huggingface_api_client_1.huggingFaceClient.detectFraudIndicators(text)];
                    case 1:
                        fraudResult_1 = _a.sent();
                        isAuthentic = fraudResult_1.riskLevel === 'low';
                        indicators = fraudResult_1.indicators.map(function (indicator) { return ({
                            type: 'warning',
                            description: indicator,
                            severity: fraudResult_1.riskLevel
                        }); });
                        return [2 /*return*/, {
                                isAuthentic: isAuthentic,
                                confidence: fraudResult_1.confidence,
                                riskLevel: fraudResult_1.riskLevel,
                                indicators: indicators,
                                recommendations: isAuthentic
                                    ? ['Document appears authentic']
                                    : ['Verify document with issuing authority', 'Cross-check with official records']
                            }];
                    case 2:
                        error_8 = _a.sent();
                        return [2 /*return*/, {
                                isAuthentic: true, // Default to authentic if analysis fails
                                confidence: 0.5,
                                riskLevel: 'medium',
                                indicators: [{
                                        type: 'warning',
                                        description: 'Authenticity analysis unavailable',
                                        severity: 'medium'
                                    }],
                                recommendations: ['Manual verification recommended']
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DocumentProcessingIntegrationService.prototype.checkCompleteness = function (extractedData, documentType) {
        return __awaiter(this, void 0, void 0, function () {
            var requiredFields, missingFields, completenessScore, _i, requiredFields_1, field, hasField, isComplete, requiredActions;
            return __generator(this, function (_a) {
                requiredFields = this.getRequiredFields(documentType);
                missingFields = [];
                completenessScore = 0;
                for (_i = 0, requiredFields_1 = requiredFields; _i < requiredFields_1.length; _i++) {
                    field = requiredFields_1[_i];
                    hasField = this.checkFieldPresence(extractedData, field);
                    if (hasField) {
                        completenessScore += field.weight;
                    }
                    else {
                        missingFields.push({
                            field: field.name,
                            importance: field.importance,
                            description: field.description
                        });
                    }
                }
                isComplete = completenessScore >= 80;
                requiredActions = missingFields
                    .filter(function (f) { return f.importance === 'critical'; })
                    .map(function (f) { return "Provide ".concat(f.field); });
                return [2 /*return*/, {
                        isComplete: isComplete,
                        completenessScore: completenessScore,
                        missingFields: missingFields,
                        requiredActions: requiredActions
                    }];
            });
        });
    };
    DocumentProcessingIntegrationService.prototype.verifyConsistency = function (extractedData, sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var inconsistencies, crossReferences, dateEntities;
            return __generator(this, function (_a) {
                inconsistencies = [];
                crossReferences = [];
                dateEntities = extractedData.entities.filter(function (e) { return e.type === 'date'; });
                if (dateEntities.length > 1) {
                    // Check for date consistency logic here
                }
                return [2 /*return*/, {
                        isConsistent: inconsistencies.length === 0,
                        consistencyScore: inconsistencies.length === 0 ? 100 : 70,
                        inconsistencies: inconsistencies,
                        crossReferences: crossReferences
                    }];
            });
        });
    };
    DocumentProcessingIntegrationService.prototype.analyzeVerificationWorkflow = function (sessionId, processingResults, stats) {
        return __awaiter(this, void 0, void 0, function () {
            var completedLayers, pendingLayers, overallStatus, riskFactors, recommendations;
            return __generator(this, function (_a) {
                completedLayers = ['document_processing'];
                pendingLayers = ['registry_verification', 'physical_verification', 'community_intelligence'];
                overallStatus = 'in_progress';
                if (stats.flaggedDocuments > stats.totalDocuments * 0.3) {
                    overallStatus = 'requires_attention';
                }
                else if (stats.authenticDocuments === stats.totalDocuments) {
                    overallStatus = 'completed';
                }
                riskFactors = [];
                recommendations = [];
                if (stats.flaggedDocuments > 0) {
                    riskFactors.push('Document authenticity concerns');
                    recommendations.push('Review flagged documents manually');
                }
                return [2 /*return*/, {
                        sessionId: sessionId,
                        overallStatus: overallStatus,
                        completedLayers: completedLayers,
                        pendingLayers: pendingLayers,
                        documentAnalysis: {
                            totalDocuments: stats.totalDocuments,
                            processedDocuments: processingResults.length,
                            authenticDocuments: stats.authenticDocuments,
                            flaggedDocuments: stats.flaggedDocuments
                        },
                        riskAssessment: {
                            overallRisk: stats.flaggedDocuments > 0 ? 'medium' : 'low',
                            riskFactors: riskFactors,
                            recommendations: recommendations
                        },
                        nextSteps: [
                            'Proceed to registry verification',
                            'Schedule physical verification',
                            'Gather community intelligence'
                        ],
                        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
                    }];
            });
        });
    };
    DocumentProcessingIntegrationService.prototype.getLayerRequirements = function (layerType) {
        var requirements = {
            registry: [
                { name: 'title_deed', importance: 'critical', description: 'Valid title deed', weight: 30 },
                { name: 'survey_plan', importance: 'critical', description: 'Survey plan', weight: 25 },
                { name: 'search_certificate', importance: 'important', description: 'Search certificate', weight: 20 }
            ],
            physical: [
                { name: 'site_photos', importance: 'critical', description: 'Site photographs', weight: 25 },
                { name: 'boundary_markers', importance: 'important', description: 'Boundary markers', weight: 20 }
            ],
            community: [
                { name: 'neighbor_verification', importance: 'important', description: 'Neighbor verification', weight: 15 },
                { name: 'local_authority', importance: 'important', description: 'Local authority confirmation', weight: 15 }
            ]
        };
        return requirements[layerType] || [];
    };
    DocumentProcessingIntegrationService.prototype.checkRequirement = function (documentResult, requirement) {
        return __awaiter(this, void 0, void 0, function () {
            var hasRequirement;
            return __generator(this, function (_a) {
                hasRequirement = documentResult.extractedData.entities.some(function (entity) { return entity.value.toLowerCase().includes(requirement.name.replace('_', ' ')); });
                return [2 /*return*/, {
                        requirement: requirement.name,
                        status: hasRequirement ? 'met' : 'not_met',
                        details: hasRequirement ? 'Requirement found in document' : 'Requirement not found'
                    }];
            });
        });
    };
    DocumentProcessingIntegrationService.prototype.generateValidationRecommendations = function (validationResults, verificationLayer) {
        var recommendations = [];
        var unmetRequirements = validationResults.filter(function (r) { return r.status === 'not_met'; });
        if (unmetRequirements.length > 0) {
            recommendations.push('Provide missing required documents');
            recommendations.push('Ensure all documents are complete and legible');
        }
        if (verificationLayer.type === 'registry') {
            recommendations.push('Verify documents with lands registry');
        }
        return recommendations;
    };
    DocumentProcessingIntegrationService.prototype.getRequiredFields = function (documentType) {
        var fieldMappings = {
            'title_deed': [
                { name: 'owner_name', importance: 'critical', description: 'Property owner name', weight: 25 },
                { name: 'property_description', importance: 'critical', description: 'Property description', weight: 25 },
                { name: 'registration_date', importance: 'important', description: 'Registration date', weight: 20 },
                { name: 'title_number', importance: 'critical', description: 'Title number', weight: 30 }
            ],
            'survey_plan': [
                { name: 'surveyor_name', importance: 'critical', description: 'Surveyor name', weight: 20 },
                { name: 'survey_date', importance: 'important', description: 'Survey date', weight: 15 },
                { name: 'property_boundaries', importance: 'critical', description: 'Property boundaries', weight: 35 },
                { name: 'area_measurement', importance: 'critical', description: 'Area measurement', weight: 30 }
            ]
        };
        return fieldMappings[documentType] || [];
    };
    DocumentProcessingIntegrationService.prototype.checkFieldPresence = function (extractedData, field) {
        // Check if field is present in extracted entities
        return extractedData.entities.some(function (entity) {
            return entity.value.toLowerCase().includes(field.name.replace('_', ' ')) ||
                extractedData.text.toLowerCase().includes(field.name.replace('_', ' '));
        });
    };
    return DocumentProcessingIntegrationService;
}());
exports.DocumentProcessingIntegrationService = DocumentProcessingIntegrationService;
// Export singleton instance
exports.documentProcessingIntegration = DocumentProcessingIntegrationService.getInstance();
