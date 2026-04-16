"use strict";
/**
 * Property Management Integration with Document Intelligence
 * Automatically verify property listing documents and enhance search
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
exports.PropertyDocumentIntegrationService = void 0;
var PropertyDocumentIntegrationService = /** @class */ (function () {
    function PropertyDocumentIntegrationService() {
    }
    /**
     * Automatically verify documents when property is listed
     * This method orchestrates the verification process for all property documents
     */
    PropertyDocumentIntegrationService.prototype.verifyPropertyDocuments = function (property, documents) {
        return __awaiter(this, void 0, void 0, function () {
            var verificationPromises, results;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        verificationPromises = documents.map(function (doc) {
                            return _this.verifyDocument(doc, String(property.id));
                        });
                        return [4 /*yield*/, Promise.allSettled(verificationPromises)];
                    case 1:
                        results = _a.sent();
                        // Synthesize the overall property status from individual document results
                        return [2 /*return*/, this.synthesizePropertyStatus(String(property.id), results)];
                }
            });
        });
    };
    /**
     * Enhanced property search with verification status
     * Combines base property search with verification filtering and ranking
     */
    PropertyDocumentIntegrationService.prototype.enhancePropertySearch = function (searchQuery, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var baseResults, filteredResults;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.searchProperties(searchQuery)];
                    case 1:
                        baseResults = _a.sent();
                        return [4 /*yield*/, this.applyVerificationFilters(baseResults, filters)];
                    case 2:
                        filteredResults = _a.sent();
                        // Sort results prioritizing verification score and trust metrics
                        return [2 /*return*/, this.sortByVerificationTrust(filteredResults)];
                }
            });
        });
    };
    /**
     * Real-time property status updates
     * Handles cascading updates when verification status changes
     */
    PropertyDocumentIntegrationService.prototype.updatePropertyStatus = function (propertyId, verificationResult) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Update the property's verification status in the database
                    return [4 /*yield*/, this.updatePropertyVerification(propertyId, verificationResult)];
                    case 1:
                        // Update the property's verification status in the database
                        _a.sent();
                        // Refresh search index to reflect new verification status
                        return [4 /*yield*/, this.updateSearchIndex(propertyId, verificationResult)];
                    case 2:
                        // Refresh search index to reflect new verification status
                        _a.sent();
                        // Notify stakeholders (agents, buyers, etc.) of status changes
                        return [4 /*yield*/, this.notifyStatusUpdate(propertyId, verificationResult)];
                    case 3:
                        // Notify stakeholders (agents, buyers, etc.) of status changes
                        _a.sent();
                        // Update comparison data for property ranking algorithms
                        return [4 /*yield*/, this.updateComparisonData(propertyId, verificationResult)];
                    case 4:
                        // Update comparison data for property ranking algorithms
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Property comparison with verification context
     * Provides comprehensive comparison including trust metrics
     */
    PropertyDocumentIntegrationService.prototype.comparePropertiesWithVerification = function (propertyIds) {
        return __awaiter(this, void 0, void 0, function () {
            var properties, comparison, recommendations;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPropertiesWithVerification(propertyIds)];
                    case 1:
                        properties = _a.sent();
                        return [4 /*yield*/, this.generateVerificationComparison(properties)];
                    case 2:
                        comparison = _a.sent();
                        return [4 /*yield*/, this.generateComparisonRecommendations(comparison)];
                    case 3:
                        recommendations = _a.sent();
                        return [2 /*return*/, {
                                properties: properties,
                                verificationComparison: {
                                    scores: {},
                                    trustLevels: {},
                                    documentCompleteness: {},
                                    riskAssessment: {}
                                },
                                recommendations: recommendations
                            }];
                }
            });
        });
    };
    /**
     * Property listing enhancement with document intelligence
     * Enriches property data with verification insights
     */
    PropertyDocumentIntegrationService.prototype.enhancePropertyListing = function (property) {
        return __awaiter(this, void 0, void 0, function () {
            var documentStatus, trustScore, fraudRiskAssessment, _a;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0: return [4 /*yield*/, this.getPropertyDocumentStatus(String(property.id))];
                    case 1:
                        documentStatus = _d.sent();
                        return [4 /*yield*/, this.getPropertyTrustScore(String(property.id))];
                    case 2:
                        trustScore = _d.sent();
                        return [4 /*yield*/, this.assessPropertyFraudRisk(String(property.id))];
                    case 3:
                        fraudRiskAssessment = _d.sent();
                        _a = [__assign({}, property)];
                        _b = { 
                            // Map internal status to property verification status
                            verificationStatus: this.mapToPropertyVerificationStatus(documentStatus.overallStatus), verificationScore: documentStatus.verificationScore, trustScore: trustScore, fraudRiskLevel: fraudRiskAssessment.level, verificationBadges: this.generateVerificationBadges(documentStatus) };
                        _c = {
                            documentCompleteness: this.calculateDocumentCompleteness(documentStatus)
                        };
                        return [4 /*yield*/, this.getCommunityValidationScore(String(property.id))];
                    case 4:
                        _c.communityValidation = _d.sent();
                        return [4 /*yield*/, this.getExpertVerificationStatus(String(property.id))];
                    case 5: 
                    // Create enhanced property object with all verification data
                    return [2 /*return*/, __assign.apply(void 0, _a.concat([(_b.enhancedMetadata = (_c.expertVerification = _d.sent(),
                                _c), _b)]))];
                }
            });
        });
    };
    /**
     * Verifies a single document and creates extended result
     * Bridges the gap between our internal needs and external verification service
     */
    PropertyDocumentIntegrationService.prototype.verifyDocument = function (document, propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var baseResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.callDocumentVerificationAPI(document, propertyId)];
                    case 1:
                        baseResult = _a.sent();
                        // Extend the base result with additional properties we need
                        return [2 /*return*/, __assign(__assign({}, baseResult), { score: this.calculateVerificationScore(baseResult), status: this.mapVerificationStatusToDocumentStatus(baseResult.verificationStatus), documentType: this.extractDocumentType(document) })];
                }
            });
        });
    };
    /**
     * Creates the actual verification result by calling external service
     * This method handles the integration with the document verification API
     */
    PropertyDocumentIntegrationService.prototype.callDocumentVerificationAPI = function (document, _propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Integration with document verification service
                // This would call the actual document verification API
                return [2 /*return*/, {
                        id: document.id,
                        documentId: document.id,
                        verificationStatus: 'verified',
                        confidence: 0.85,
                        riskScore: 0.15,
                        findings: [], // Required by DocumentVerificationResult
                        createdAt: new Date(), // Required by DocumentVerificationResult
                        updatedAt: new Date(), // Required by DocumentVerificationResult
                        metadata: {
                            fileSize: document.fileSize,
                            fileType: document.mimeType,
                            checksum: 'placeholder-checksum',
                            uploadedAt: document.uploadedAt
                        }
                    }];
            });
        });
    };
    /**
     * Synthesizes overall property status from individual document verification results
     */
    PropertyDocumentIntegrationService.prototype.synthesizePropertyStatus = function (propertyId, results) {
        // Extract successful verification results
        var successfulResults = results
            .filter(function (result) {
            return result.status === 'fulfilled';
        })
            .map(function (result) { return result.value; });
        // Calculate average verification score across all documents
        var averageScore = successfulResults.length > 0
            ? successfulResults.reduce(function (sum, result) { return sum + result.score; }, 0) / successfulResults.length
            : 0;
        // Determine overall status based on individual document statuses
        var overallStatus = this.determineOverallStatus(successfulResults);
        return {
            propertyId: propertyId,
            documents: {
                titleDeed: this.getDocumentStatus(successfulResults, 'title_deed'),
                saleAgreement: this.getDocumentStatus(successfulResults, 'sale_agreement'),
                surveyReport: this.getDocumentStatus(successfulResults, 'survey_report'),
                complianceCertificate: this.getDocumentStatus(successfulResults, 'compliance_certificate')
            },
            overallStatus: overallStatus,
            verificationScore: Math.round(averageScore),
            lastUpdated: new Date()
        };
    };
    /**
     * Base property search integration
     * Connects with existing property search infrastructure
     */
    PropertyDocumentIntegrationService.prototype.searchProperties = function (_query) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Integration with existing property search
                return [2 /*return*/, []];
            });
        });
    };
    /**
     * Applies verification-based filters to property search results
     */
    PropertyDocumentIntegrationService.prototype.applyVerificationFilters = function (properties, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, properties.filter(function (property) {
                        var _a, _b, _c;
                        // Enhanced property casting for type safety
                        var enhancedProperty = property;
                        // Apply verification status filter
                        if (filters.verificationFilter && !property.verificationStatus) {
                            return false;
                        }
                        // Apply trust score range filter
                        var trustScore = (_a = property.trustScore) !== null && _a !== void 0 ? _a : 0;
                        if (trustScore < filters.trustScoreRange[0] ||
                            trustScore > filters.trustScoreRange[1]) {
                            return false;
                        }
                        // Apply document completeness filter
                        var documentCompleteness = (_c = (_b = enhancedProperty.enhancedMetadata) === null || _b === void 0 ? void 0 : _b.documentCompleteness) !== null && _c !== void 0 ? _c : 0;
                        if (documentCompleteness < filters.documentCompleteness) {
                            return false;
                        }
                        // Apply fraud risk level filter
                        var propertyRiskLevel = enhancedProperty.fraudRiskLevel || 'low';
                        return _this.getFraudRiskLevel(propertyRiskLevel) <= _this.getFraudRiskLevel(filters.fraudRiskLevel);
                    })];
            });
        });
    };
    /**
     * Sorts properties by verification trust metrics
     */
    PropertyDocumentIntegrationService.prototype.sortByVerificationTrust = function (properties) {
        return properties.sort(function (a, b) {
            var enhancedA = a;
            var enhancedB = b;
            // Primary sort: verification score (higher is better)
            var scoreA = enhancedA.verificationScore || 0;
            var scoreB = enhancedB.verificationScore || 0;
            if (scoreA !== scoreB)
                return scoreB - scoreA;
            // Secondary sort: trust score (higher is better)
            var trustA = a.trustScore || 0;
            var trustB = b.trustScore || 0;
            return trustB - trustA;
        });
    };
    /**
     * Determines overall verification status based on individual document results
     */
    PropertyDocumentIntegrationService.prototype.determineOverallStatus = function (results) {
        if (results.length === 0)
            return 'pending';
        // Count different status types
        var rejectedCount = results.filter(function (r) { return r.status === 'rejected'; }).length;
        var pendingCount = results.filter(function (r) { return r.status === 'pending'; }).length;
        var verifiedCount = results.filter(function (r) { return r.status === 'verified'; }).length;
        // Determine overall status with fail-fast logic
        if (rejectedCount > 0)
            return 'failed';
        if (pendingCount > 0)
            return 'pending';
        if (verifiedCount === results.length)
            return 'verified';
        return 'issues';
    };
    /**
     * Retrieves verification status for a specific document type
     */
    PropertyDocumentIntegrationService.prototype.getDocumentStatus = function (results, documentType) {
        var _a;
        var result = results.find(function (r) { return r.documentType === documentType; });
        return (_a = result === null || result === void 0 ? void 0 : result.status) !== null && _a !== void 0 ? _a : 'pending';
    };
    /**
     * Converts fraud risk level to numeric value for comparison
     */
    PropertyDocumentIntegrationService.prototype.getFraudRiskLevel = function (level) {
        switch (level) {
            case 'low':
                return 1;
            case 'medium':
                return 2;
            case 'high':
                return 3;
            default:
                return 0;
        }
    };
    /**
     * Generates verification badges based on property status
     */
    PropertyDocumentIntegrationService.prototype.generateVerificationBadges = function (status) {
        var badges = [];
        // Award badges based on verification score thresholds
        if (status.verificationScore >= 90)
            badges.push('premium-verified');
        if (status.verificationScore >= 75)
            badges.push('verified');
        if (status.documents.titleDeed === 'verified')
            badges.push('title-verified');
        if (status.overallStatus === 'verified')
            badges.push('fully-verified');
        return badges;
    };
    /**
     * Calculates document completeness percentage
     */
    PropertyDocumentIntegrationService.prototype.calculateDocumentCompleteness = function (status) {
        var documents = Object.values(status.documents);
        var completedDocs = documents.filter(function (doc) { return doc === 'verified'; }).length;
        return Math.round((completedDocs / documents.length) * 100);
    };
    /**
     * Maps internal verification status to Property verification status
     */
    PropertyDocumentIntegrationService.prototype.mapToPropertyVerificationStatus = function (status) {
        switch (status) {
            case 'verified':
                return 'verified';
            case 'pending':
                return 'pending';
            case 'issues':
            case 'failed':
                return 'unverified';
            default:
                return 'draft';
        }
    };
    /**
     * Calculates verification score from base verification result
     */
    PropertyDocumentIntegrationService.prototype.calculateVerificationScore = function (result) {
        // Convert confidence to 0-100 score
        return Math.round(result.confidence * 100);
    };
    /**
     * Maps verification status string to DocumentVerificationStatus type
     */
    PropertyDocumentIntegrationService.prototype.mapVerificationStatusToDocumentStatus = function (status) {
        var _a;
        var statusMap = {
            'verified': 'verified',
            'pending': 'pending',
            'failed': 'rejected',
            'suspicious': 'rejected'
        };
        return (_a = statusMap[status]) !== null && _a !== void 0 ? _a : 'pending';
    };
    /**
     * Extracts document type from PropertyDocument
     */
    PropertyDocumentIntegrationService.prototype.extractDocumentType = function (document) {
        // Use the documentType field from PropertyDocument
        switch (document.documentType) {
            case 'title_deed':
                return 'title_deed';
            case 'survey_plan':
                return 'survey_report';
            case 'sale_agreement':
                return 'sale_agreement';
            case 'id_copy':
                return 'compliance_certificate';
            case 'other':
                return 'unknown';
            default:
                return 'unknown';
        }
    };
    // Placeholder integration methods - these would connect to actual services
    PropertyDocumentIntegrationService.prototype.updatePropertyVerification = function (_propertyId, _result) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.updateSearchIndex = function (_propertyId, _result) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.notifyStatusUpdate = function (_propertyId, _result) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.updateComparisonData = function (_propertyId, _result) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.getPropertiesWithVerification = function (_propertyIds) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would fetch properties with verification data
                return [2 /*return*/, []];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.generateVerificationComparison = function (_properties) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would generate comparison metrics
                return [2 /*return*/, {}];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.generateComparisonRecommendations = function (_comparison) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would generate AI-powered recommendations
                return [2 /*return*/, []];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.getPropertyDocumentStatus = function (_propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would fetch current document status
                return [2 /*return*/, {}];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.getPropertyTrustScore = function (_propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would calculate trust score
                return [2 /*return*/, 0];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.assessPropertyFraudRisk = function (_propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would assess fraud risk
                return [2 /*return*/, { level: 'low' }];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.getCommunityValidationScore = function (_propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would fetch community validation metrics
                return [2 /*return*/, 0];
            });
        });
    };
    PropertyDocumentIntegrationService.prototype.getExpertVerificationStatus = function (_propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation would fetch expert verification status
                return [2 /*return*/, 'pending'];
            });
        });
    };
    return PropertyDocumentIntegrationService;
}());
exports.PropertyDocumentIntegrationService = PropertyDocumentIntegrationService;
