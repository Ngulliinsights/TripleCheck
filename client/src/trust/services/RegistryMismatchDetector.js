"use strict";
/**
 * Registry Mismatch Detector
 *
 * Specialized service for detecting discrepancies between physical and digital
 * land registry records during Kenya's transition period.
 *
 * Key Features:
 * - Physical vs Digital record comparison
 * - Transition timeline analysis (when property was digitized and by whom)
 * - Anomaly detection for suspicious digitization patterns
 * - Integration with known disputed properties
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
exports.registryMismatchDetector = exports.RegistryMismatchDetector = void 0;
// ============================================================================
// Registry Mismatch Detector
// ============================================================================
var RegistryMismatchDetector = /** @class */ (function () {
    function RegistryMismatchDetector() {
        this.knownDisputedProperties = new Map();
        // Initialize with known high-profile cases
        this.initializeKnownDisputes();
    }
    // ============================================================================
    // Physical vs Digital Comparison
    // ============================================================================
    /**
     * Compare physical deed records against digital registry entries
     */
    RegistryMismatchDetector.prototype.comparePhysicalAndDigital = function (titleNumber, physicalData, digitalData) {
        return __awaiter(this, void 0, void 0, function () {
            var discrepancies, warnings, sizeDifference, sizeVariance, physicalEncumbrances, digitalEncumbrances, _i, _a, enc, _b, _c, enc, registryState, disputeMatch;
            return __generator(this, function (_d) {
                discrepancies = [];
                warnings = [];
                // Compare owner name
                if (this.normalizeText(physicalData.ownerName) !== this.normalizeText(digitalData.ownerName)) {
                    discrepancies.push({
                        field: 'ownerName',
                        physicalValue: physicalData.ownerName,
                        digitalValue: digitalData.ownerName,
                        severity: 'critical',
                        possibleCause: this.analyzeOwnerDiscrepancy(physicalData.ownerName, digitalData.ownerName),
                    });
                }
                // Compare title number format
                if (physicalData.titleNumber !== digitalData.titleNumber) {
                    discrepancies.push({
                        field: 'titleNumber',
                        physicalValue: physicalData.titleNumber,
                        digitalValue: digitalData.titleNumber,
                        severity: 'high',
                        possibleCause: 'Title number format may differ between systems or could indicate fraud',
                    });
                }
                sizeDifference = Math.abs(physicalData.sizeAcres - digitalData.sizeAcres);
                sizeVariance = (sizeDifference / physicalData.sizeAcres) * 100;
                if (sizeVariance > 5) {
                    discrepancies.push({
                        field: 'sizeAcres',
                        physicalValue: String(physicalData.sizeAcres),
                        digitalValue: String(digitalData.sizeAcres),
                        severity: sizeVariance > 20 ? 'critical' : 'medium',
                        possibleCause: 'Size discrepancy may indicate subdivision or data entry error',
                    });
                }
                physicalEncumbrances = new Set(physicalData.encumbrances);
                digitalEncumbrances = new Set(digitalData.encumbrances);
                for (_i = 0, _a = physicalData.encumbrances; _i < _a.length; _i++) {
                    enc = _a[_i];
                    if (!digitalEncumbrances.has(enc)) {
                        discrepancies.push({
                            field: 'encumbrances',
                            physicalValue: enc,
                            digitalValue: 'Not in digital record',
                            severity: 'high',
                            possibleCause: 'Encumbrance may have been fraudulently removed during digitization',
                        });
                    }
                }
                for (_b = 0, _c = digitalData.encumbrances; _b < _c.length; _b++) {
                    enc = _c[_b];
                    if (!physicalEncumbrances.has(enc)) {
                        warnings.push("Digital record shows encumbrance not in physical: ".concat(enc));
                    }
                }
                registryState = this.determineRegistryState(discrepancies);
                disputeMatch = this.checkAgainstKnownDisputes(titleNumber);
                return [2 /*return*/, {
                        titleNumber: titleNumber,
                        registryState: registryState,
                        discrepancies: discrepancies,
                        warnings: warnings,
                        riskLevel: this.calculateRiskLevel(discrepancies, disputeMatch),
                        recommendation: this.generateRecommendation(discrepancies, disputeMatch),
                        knownDisputeMatch: disputeMatch,
                    }];
            });
        });
    };
    // ============================================================================
    // Transition Timeline Analysis
    // ============================================================================
    /**
     * Analyze when and how a property was digitized
     * Suspicious patterns include: rush digitization, unauthorized officers, bulk changes
     */
    RegistryMismatchDetector.prototype.analyzeDigitizationTimeline = function (titleNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var digitizationRecord, redFlags, dayOfWeek, hour;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fetchDigitizationRecord(titleNumber)];
                    case 1:
                        digitizationRecord = _a.sent();
                        redFlags = [];
                        // Check for suspicious patterns
                        if (digitizationRecord) {
                            dayOfWeek = digitizationRecord.digitizedAt.getDay();
                            if (dayOfWeek === 0 || dayOfWeek === 6) {
                                redFlags.push({
                                    type: 'unusual_timing',
                                    description: 'Property was digitized on a weekend',
                                    severity: 'medium',
                                });
                            }
                            hour = digitizationRecord.digitizedAt.getHours();
                            if (hour < 8 || hour > 17) {
                                redFlags.push({
                                    type: 'unusual_timing',
                                    description: 'Property was digitized outside normal business hours',
                                    severity: 'medium',
                                });
                            }
                            // Red flag: Officer not in known list
                            if (!this.isKnownDigitizationOfficer(digitizationRecord.digitizedBy)) {
                                redFlags.push({
                                    type: 'unknown_actor',
                                    description: 'Digitizing officer not in verified list',
                                    severity: 'high',
                                });
                            }
                            // Red flag: Bulk digitization batch (potential mass fraud)
                            if (digitizationRecord.batchSize &&
                                digitizationRecord.batchSize > 50) {
                                redFlags.push({
                                    type: 'bulk_processing',
                                    description: "Part of large batch (".concat(digitizationRecord.batchSize, " properties)"),
                                    severity: 'medium',
                                });
                            }
                            // Red flag: Ownership changed at time of digitization
                            if (digitizationRecord.ownershipChangedDuringDigitization) {
                                redFlags.push({
                                    type: 'ownership_change',
                                    description: 'Ownership was modified during digitization process',
                                    severity: 'critical',
                                });
                            }
                        }
                        return [2 /*return*/, {
                                titleNumber: titleNumber,
                                digitizationRecord: digitizationRecord,
                                redFlags: redFlags,
                                overallRisk: this.assessDigitizationRisk(redFlags),
                                recommendation: this.generateDigitizationRecommendation(redFlags),
                            }];
                }
            });
        });
    };
    // ============================================================================
    // Anomaly Detection
    // ============================================================================
    /**
     * Detect suspicious patterns in property records
     */
    RegistryMismatchDetector.prototype.detectAnomalies = function (properties) {
        return __awaiter(this, void 0, void 0, function () {
            var anomalies, byDate, _i, properties_1, prop, dateKey, _a, byDate_1, _b, date, titles, ownerProperties, _c, properties_2, prop, owner, _d, ownerProperties_1, _e, owner, titles;
            return __generator(this, function (_f) {
                anomalies = [];
                byDate = new Map();
                for (_i = 0, properties_1 = properties; _i < properties_1.length; _i++) {
                    prop = properties_1[_i];
                    dateKey = new Date().toISOString().split('T')[0];
                    if (!byDate.has(dateKey))
                        byDate.set(dateKey, []);
                    byDate.get(dateKey).push(prop.titleNumber);
                }
                // Flag dates with unusually high volume
                for (_a = 0, byDate_1 = byDate; _a < byDate_1.length; _a++) {
                    _b = byDate_1[_a], date = _b[0], titles = _b[1];
                    if (titles.length > 20) {
                        anomalies.push({
                            type: 'bulk_digitization',
                            affectedProperties: titles,
                            description: "".concat(titles.length, " properties digitized on ").concat(date),
                            riskScore: Math.min(titles.length / 10, 10),
                        });
                    }
                }
                ownerProperties = new Map();
                for (_c = 0, properties_2 = properties; _c < properties_2.length; _c++) {
                    prop = properties_2[_c];
                    owner = this.normalizeText(prop.digitalData.ownerName);
                    if (!ownerProperties.has(owner))
                        ownerProperties.set(owner, []);
                    ownerProperties.get(owner).push(prop.titleNumber);
                }
                // Flag owners with suspiciously many properties
                for (_d = 0, ownerProperties_1 = ownerProperties; _d < ownerProperties_1.length; _d++) {
                    _e = ownerProperties_1[_d], owner = _e[0], titles = _e[1];
                    if (titles.length > 10) {
                        anomalies.push({
                            type: 'concentrated_ownership',
                            affectedProperties: titles,
                            description: "".concat(owner, " appears as owner on ").concat(titles.length, " properties"),
                            riskScore: titles.length > 50 ? 10 : 5,
                        });
                    }
                }
                return [2 /*return*/, {
                        totalPropertiesAnalyzed: properties.length,
                        anomaliesDetected: anomalies.length,
                        anomalies: anomalies,
                        highRiskCount: anomalies.filter(function (a) { return a.riskScore >= 7; }).length,
                        recommendation: anomalies.length > 0
                            ? 'Review flagged properties with enhanced due diligence'
                            : 'No anomalies detected in current dataset',
                    }];
            });
        });
    };
    // ============================================================================
    // Court Case Integration
    // ============================================================================
    /**
     * Check if property is involved in known disputes
     */
    RegistryMismatchDetector.prototype.checkAgainstKnownDisputes = function (titleNumber) {
        return this.knownDisputedProperties.get(titleNumber) || null;
    };
    /**
     * Add a known disputed property to the registry
     */
    RegistryMismatchDetector.prototype.registerDisputedProperty = function (record) {
        this.knownDisputedProperties.set(record.titleNumber, record);
    };
    // ============================================================================
    // Private Helper Methods
    // ============================================================================
    RegistryMismatchDetector.prototype.initializeKnownDisputes = function () {
        // Initialize with high-profile cases like Mwangi vs Mount Pleasant
        this.knownDisputedProperties.set('LR_MUTHAIGA_001', {
            titleNumber: 'LR_MUTHAIGA_001',
            caseReference: 'ELC Case 123/2024',
            parties: ['James Mwangi', 'Mount Pleasant Ltd'],
            disputeType: 'ownership_conflict',
            status: 'resolved',
            ruling: 'Nemo dat quod non habet - seller (Moi) did not own property in 2013',
            rulingDate: new Date('2025-10-15'),
            keyLearning: 'Historical audit required - digital record was modified during transition',
        });
    };
    RegistryMismatchDetector.prototype.normalizeText = function (text) {
        return text.toLowerCase().trim().replace(/\s+/g, ' ');
    };
    RegistryMismatchDetector.prototype.analyzeOwnerDiscrepancy = function (physical, digital) {
        // Check for common patterns
        if (this.normalizeText(physical).includes(this.normalizeText(digital)) ||
            this.normalizeText(digital).includes(this.normalizeText(physical))) {
            return 'Partial name match - may be abbreviation or spelling variation';
        }
        // Company vs individual
        var companyIndicators = ['ltd', 'limited', 'company', 'corp', 'inc'];
        var physicalIsCompany = companyIndicators.some(function (i) {
            return physical.toLowerCase().includes(i);
        });
        var digitalIsCompany = companyIndicators.some(function (i) {
            return digital.toLowerCase().includes(i);
        });
        if (physicalIsCompany !== digitalIsCompany) {
            return 'CRITICAL: Company vs Individual mismatch - possible fraudulent transfer';
        }
        return 'Complete name mismatch - requires urgent investigation';
    };
    RegistryMismatchDetector.prototype.determineRegistryState = function (discrepancies) {
        if (discrepancies.length === 0)
            return 'both_consistent';
        var hasCritical = discrepancies.some(function (d) { return d.severity === 'critical'; });
        if (hasCritical)
            return 'both_mismatch';
        return 'both_mismatch';
    };
    RegistryMismatchDetector.prototype.calculateRiskLevel = function (discrepancies, disputeMatch) {
        if (disputeMatch)
            return 'critical';
        if (discrepancies.some(function (d) { return d.severity === 'critical'; }))
            return 'critical';
        if (discrepancies.some(function (d) { return d.severity === 'high'; }))
            return 'high';
        if (discrepancies.length > 0)
            return 'medium';
        return 'low';
    };
    RegistryMismatchDetector.prototype.generateRecommendation = function (discrepancies, disputeMatch) {
        if (disputeMatch) {
            return "CRITICAL: This property is involved in known dispute (".concat(disputeMatch.caseReference, "). ") +
                "Ruling: ".concat(disputeMatch.ruling, ". ") +
                'DO NOT PROCEED without full legal review.';
        }
        if (discrepancies.some(function (d) { return d.severity === 'critical'; })) {
            return 'CRITICAL discrepancies detected between physical and digital records. ' +
                'Recommend obtaining blockchain-anchored proof and legal consultation before any transaction.';
        }
        if (discrepancies.length > 0) {
            return 'Discrepancies detected. Recommend physical registry verification and documentation.';
        }
        return 'Physical and digital records are consistent. Proceed with standard due diligence.';
    };
    RegistryMismatchDetector.prototype.fetchDigitizationRecord = function (titleNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In production, would fetch from government audit logs
                // Simulated response
                return [2 /*return*/, {
                        titleNumber: titleNumber,
                        digitizedAt: new Date('2023-06-15T14:30:00'),
                        digitizedBy: 'JKN-001',
                        batchSize: 12,
                        ownershipChangedDuringDigitization: false,
                        verificationMethod: 'physical_scan',
                    }];
            });
        });
    };
    RegistryMismatchDetector.prototype.isKnownDigitizationOfficer = function (officerId) {
        // In production, maintain verified officer list
        var knownOfficers = ['JKN-001', 'JKN-002', 'NRB-001', 'MSA-001'];
        return knownOfficers.includes(officerId);
    };
    RegistryMismatchDetector.prototype.assessDigitizationRisk = function (redFlags) {
        if (redFlags.some(function (f) { return f.severity === 'critical'; }))
            return 'critical';
        if (redFlags.some(function (f) { return f.severity === 'high'; }))
            return 'high';
        if (redFlags.length > 2)
            return 'medium';
        if (redFlags.length > 0)
            return 'low';
        return 'low';
    };
    RegistryMismatchDetector.prototype.generateDigitizationRecommendation = function (redFlags) {
        if (redFlags.length === 0) {
            return 'Digitization process appears normal. Standard verification recommended.';
        }
        if (redFlags.some(function (f) { return f.severity === 'critical'; })) {
            return 'CRITICAL: Ownership changed during digitization. ' +
                'This is a major fraud indicator. Require physical deed verification.';
        }
        return "".concat(redFlags.length, " red flags detected in digitization process. ") +
            'Enhanced due diligence recommended.';
    };
    return RegistryMismatchDetector;
}());
exports.RegistryMismatchDetector = RegistryMismatchDetector;
// Export singleton instance
exports.registryMismatchDetector = new RegistryMismatchDetector();
