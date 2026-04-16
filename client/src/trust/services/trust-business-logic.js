"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustBusinessLogic = exports.FraudAlertSchema = exports.VerificationCheckSchema = exports.TrustScoreSchema = void 0;
var zod_1 = require("zod");
// Trust validation schemas
exports.TrustScoreSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    propertyId: zod_1.z.string().uuid('Invalid property ID').optional(),
    score: zod_1.z.number().int().min(0).max(1000),
    factors: zod_1.z.object({
        documentVerification: zod_1.z.number().min(0).max(100),
        communityFeedback: zod_1.z.number().min(0).max(100),
        transactionHistory: zod_1.z.number().min(0).max(100),
        identityVerification: zod_1.z.number().min(0).max(100),
        propertyVerification: zod_1.z.number().min(0).max(100).optional(),
    }),
    lastUpdated: zod_1.z.date(),
});
exports.VerificationCheckSchema = zod_1.z.object({
    type: zod_1.z.enum(['document', 'identity', 'property', 'financial']),
    status: zod_1.z.enum(['pending', 'verified', 'rejected', 'expired']),
    documentUrl: zod_1.z.string().url().optional(),
    verifiedBy: zod_1.z.string().uuid().optional(),
    verificationDate: zod_1.z.date().optional(),
    expiryDate: zod_1.z.date().optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.FraudAlertSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid('Invalid user ID'),
    propertyId: zod_1.z.string().uuid('Invalid property ID').optional(),
    alertType: zod_1.z.enum(['suspicious_activity', 'fake_documents', 'duplicate_listing', 'payment_fraud']),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    description: zod_1.z.string().min(10).max(1000),
    status: zod_1.z.enum(['active', 'investigating', 'resolved', 'false_positive']),
    reportedBy: zod_1.z.string().uuid().optional(),
});
// Trust business logic implementation
var TrustBusinessLogic = /** @class */ (function () {
    function TrustBusinessLogic() {
    }
    // Calculate comprehensive trust score
    TrustBusinessLogic.calculateTrustScore = function (factors) {
        // Calculate weighted score
        var totalScore = 0;
        var breakdown = {};
        Object.entries(this.TRUST_WEIGHTS).forEach(function (_a) {
            var factor = _a[0], weight = _a[1];
            var factorScore = factors[factor] || 0;
            var weightedScore = factorScore * weight;
            totalScore += weightedScore;
            breakdown[factor] = weightedScore;
        });
        var finalScore = Math.round(totalScore);
        // Determine trust level
        var level = this.getTrustLevel(finalScore);
        // Generate recommendations
        var recommendations = this.generateTrustRecommendations(factors, finalScore);
        return {
            score: finalScore,
            level: level.label,
            color: level.color,
            breakdown: breakdown,
            recommendations: recommendations,
        };
    };
    // Get trust level based on score
    TrustBusinessLogic.getTrustLevel = function (score) {
        for (var _i = 0, _a = Object.values(this.TRUST_LEVELS); _i < _a.length; _i++) {
            var level = _a[_i];
            if (score >= level.min && score <= level.max) {
                return level;
            }
        }
        return this.TRUST_LEVELS.UNVERIFIED;
    };
    // Generate personalized trust improvement recommendations
    TrustBusinessLogic.generateTrustRecommendations = function (factors, currentScore) {
        var recommendations = [];
        // Add verification recommendations
        recommendations.push.apply(recommendations, this.getVerificationRecommendations(factors));
        // Add community recommendations
        recommendations.push.apply(recommendations, this.getCommunityRecommendations(factors));
        // Add overall score recommendations
        recommendations.push.apply(recommendations, this.getScoreBasedRecommendations(currentScore));
        return recommendations.slice(0, 5); // Limit to top 5 recommendations
    };
    TrustBusinessLogic.getVerificationRecommendations = function (factors) {
        var recommendations = [];
        if (factors.documentVerification < 80) {
            recommendations.push('Complete document verification to increase trust score');
            if (factors.documentVerification < 50) {
                recommendations.push('Upload government-issued ID and proof of address');
            }
        }
        if (factors.identityVerification < 80) {
            recommendations.push('Complete identity verification through video call');
            if (factors.identityVerification < 30) {
                recommendations.push('Verify your phone number and email address');
            }
        }
        if (factors.propertyVerification && factors.propertyVerification < 70) {
            recommendations.push('Verify property ownership documents');
            if (factors.propertyVerification < 40) {
                recommendations.push('Schedule property inspection with certified agent');
            }
        }
        return recommendations;
    };
    TrustBusinessLogic.getCommunityRecommendations = function (factors) {
        var recommendations = [];
        if (factors.communityFeedback < 70) {
            recommendations.push('Engage with the community to build positive feedback');
            if (factors.communityFeedback < 40) {
                recommendations.push('Complete your profile and add references');
            }
        }
        if (factors.transactionHistory < 60) {
            recommendations.push('Complete more transactions to build history');
            if (factors.transactionHistory < 20) {
                recommendations.push('Start with smaller transactions to build trust');
            }
        }
        return recommendations;
    };
    TrustBusinessLogic.getScoreBasedRecommendations = function (currentScore) {
        if (currentScore < 500) {
            return ['Focus on basic verification steps first'];
        }
        else if (currentScore < 750) {
            return ['Build community reputation through positive interactions'];
        }
        else if (currentScore < 900) {
            return ['Complete advanced verification for premium status'];
        }
        return [];
    };
    // Fraud detection algorithm
    TrustBusinessLogic.detectFraudRisk = function (data) {
        var riskScore = 0;
        var flags = [];
        var recommendations = [];
        // Analyze different risk factors
        var userRisk = this.analyzeUserRisk(data.userHistory);
        var propertyRisk = this.analyzePropertyRisk(data.propertyData);
        var transactionRisk = this.analyzeTransactionRisk(data.transactionData);
        // Combine risk assessments
        riskScore += userRisk.score;
        flags.push.apply(flags, userRisk.flags);
        recommendations.push.apply(recommendations, userRisk.recommendations);
        riskScore += propertyRisk.score;
        flags.push.apply(flags, propertyRisk.flags);
        recommendations.push.apply(recommendations, propertyRisk.recommendations);
        riskScore += transactionRisk.score;
        flags.push.apply(flags, transactionRisk.flags);
        recommendations.push.apply(recommendations, transactionRisk.recommendations);
        return {
            riskLevel: this.calculateRiskLevel(riskScore),
            riskScore: riskScore,
            flags: flags,
            recommendations: recommendations,
        };
    };
    TrustBusinessLogic.analyzeUserRisk = function (userHistory) {
        var score = 0;
        var flags = [];
        var recommendations = [];
        if (userHistory.length === 0) {
            score += 20;
            flags.push('New user with no transaction history');
            recommendations.push('Require additional verification for new users');
        }
        var recentTransactions = userHistory.filter(function (transaction) {
            return new Date(transaction.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        });
        if (recentTransactions.length > 10) {
            score += 15;
            flags.push('High transaction frequency in recent period');
            recommendations.push('Monitor user activity closely');
        }
        return { score: score, flags: flags, recommendations: recommendations };
    };
    TrustBusinessLogic.analyzePropertyRisk = function (propertyData) {
        var score = 0;
        var flags = [];
        var recommendations = [];
        if (!propertyData)
            return { score: score, flags: flags, recommendations: recommendations };
        if (propertyData.duplicateCount > 0) {
            score += 30;
            flags.push('Property appears in multiple listings');
            recommendations.push('Verify property ownership documents');
        }
        if (propertyData.priceVariance > 50) {
            score += 25;
            flags.push('Property price significantly differs from market value');
            recommendations.push('Request property valuation report');
        }
        if (propertyData.imageAuthenticityScore < 70) {
            score += 20;
            flags.push('Property images may be manipulated or stolen');
            recommendations.push('Request original property photos with timestamp');
        }
        return { score: score, flags: flags, recommendations: recommendations };
    };
    TrustBusinessLogic.analyzeTransactionRisk = function (transactionData) {
        var score = 0;
        var flags = [];
        var recommendations = [];
        if (!transactionData)
            return { score: score, flags: flags, recommendations: recommendations };
        if (transactionData.unusualPaymentMethods) {
            score += 25;
            flags.push('Unusual payment methods requested');
            recommendations.push('Verify payment method legitimacy');
        }
        if (transactionData.urgencyIndicators > 2) {
            score += 20;
            flags.push('High-pressure sales tactics detected');
            recommendations.push('Allow cooling-off period for transactions');
        }
        return { score: score, flags: flags, recommendations: recommendations };
    };
    TrustBusinessLogic.calculateRiskLevel = function (riskScore) {
        if (riskScore >= 80)
            return 'critical';
        if (riskScore >= 60)
            return 'high';
        if (riskScore >= 30)
            return 'medium';
        return 'low';
    };
    // Document verification logic
    TrustBusinessLogic.verifyDocument = function (document) {
        var issues = [];
        var confidence = 100;
        // Basic document type validation
        var validDocumentTypes = ['passport', 'drivers_license', 'national_id', 'utility_bill'];
        if (!validDocumentTypes.includes(document.type)) {
            issues.push('Invalid document type');
            confidence -= 50;
        }
        // Check extracted data quality
        if (!document.extractedData || Object.keys(document.extractedData).length === 0) {
            issues.push('Unable to extract data from document');
            confidence -= 30;
        }
        // Validate required fields based on document type
        var requiredFields = this.getRequiredFieldsForDocument(document.type);
        var missingFields = requiredFields.filter(function (field) { return !(field in document.extractedData) || !document.extractedData[field]; });
        if (missingFields.length > 0) {
            issues.push("Missing required fields: ".concat(missingFields.join(', ')));
            confidence -= missingFields.length * 10;
        }
        // Check for document tampering indicators
        if (document.extractedData.tamperingScore > 30) {
            issues.push('Document may have been tampered with');
            confidence -= 40;
        }
        // Check document expiry
        if (document.extractedData.expiryDate) {
            var expiryDate = new Date(document.extractedData.expiryDate);
            if (expiryDate < new Date()) {
                issues.push('Document has expired');
                confidence -= 60;
            }
        }
        var isValid = confidence >= 70 && issues.length === 0;
        return {
            isValid: isValid,
            confidence: Math.max(0, confidence),
            issues: issues,
            extractedInfo: document.extractedData,
        };
    };
    // Get required fields for document type
    TrustBusinessLogic.getRequiredFieldsForDocument = function (documentType) {
        var _a;
        var fieldMap = {
            passport: ['fullName', 'passportNumber', 'nationality', 'dateOfBirth', 'expiryDate'],
            drivers_license: ['fullName', 'licenseNumber', 'dateOfBirth', 'address', 'expiryDate'],
            national_id: ['fullName', 'idNumber', 'dateOfBirth', 'address'],
            utility_bill: ['fullName', 'address', 'billDate', 'serviceProvider'],
        };
        return (_a = fieldMap[documentType]) !== null && _a !== void 0 ? _a : [];
    };
    // Community trust scoring
    TrustBusinessLogic.calculateCommunityTrust = function (data) {
        var score = 0;
        var factors = {};
        var insights = [];
        // Reference scoring
        var validReferences = data.references.filter(function (ref) { return ref.verified; });
        factors.references = Math.min(validReferences.length * 15, 60);
        score += factors.references;
        if (validReferences.length < 2) {
            insights.push('Add more verified references to improve trust');
        }
        // Review scoring
        var avgRating = data.reviews.length > 0
            ? data.reviews.reduce(function (sum, review) { return sum + review.rating; }, 0) / data.reviews.length
            : 0;
        factors.reviews = Math.round(avgRating * 10);
        score += factors.reviews;
        if (data.reviews.length < 5) {
            insights.push('Encourage more users to leave reviews');
        }
        // Community engagement scoring
        factors.engagement = Math.min(data.communityEngagement.length * 5, 30);
        score += factors.engagement;
        if (data.communityEngagement.length < 3) {
            insights.push('Participate more in community discussions');
        }
        // Penalty for reported issues
        var activePenalties = data.reportedIssues.filter(function (issue) { return issue.status === 'active' || issue.status === 'investigating'; });
        factors.penalties = -activePenalties.length * 20;
        score += factors.penalties;
        if (activePenalties.length > 0) {
            insights.push('Resolve outstanding reported issues');
        }
        return {
            score: Math.max(0, Math.min(100, score)),
            factors: factors,
            insights: insights,
        };
    };
    // Trust score update logic
    TrustBusinessLogic.shouldUpdateTrustScore = function (currentScore, newFactors) {
        var updatedFactors = __assign(__assign({}, currentScore.factors), newFactors);
        var newCalculation = this.calculateTrustScore(updatedFactors);
        var scoreDifference = Math.abs(newCalculation.score - currentScore.score);
        var timeSinceLastUpdate = Date.now() - currentScore.lastUpdated.getTime();
        var daysSinceUpdate = timeSinceLastUpdate / (1000 * 60 * 60 * 24);
        // Update if significant score change or enough time has passed
        var shouldUpdate = scoreDifference >= 10 || daysSinceUpdate >= 7;
        var reason = '';
        if (scoreDifference >= 10) {
            reason = "Significant score change: ".concat(scoreDifference, " points");
        }
        else if (daysSinceUpdate >= 7) {
            reason = 'Regular weekly update';
        }
        else {
            reason = 'No update needed';
        }
        return {
            shouldUpdate: shouldUpdate,
            reason: reason,
            newScore: newCalculation.score,
        };
    };
    // Validate trust operations
    TrustBusinessLogic.validateTrustOperation = function (operation, data, userId) {
        var errors = [];
        try {
            switch (operation) {
                case 'create':
                    exports.TrustScoreSchema.parse(data);
                    break;
                case 'update':
                    // Partial validation for updates
                    if (data.factors) {
                        exports.TrustScoreSchema.shape.factors.parse(data.factors);
                    }
                    break;
                case 'delete':
                    if (!data.id || !data.userId) {
                        errors.push('ID and user ID required for deletion');
                    }
                    break;
            }
            // Check user authorization
            if (data.userId && data.userId !== userId) {
                errors.push('Unauthorized: Cannot modify another user\'s trust data');
            }
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                errors.push.apply(errors, error.errors.map(function (err) { return "".concat(err.path.join('.'), ": ").concat(err.message); }));
            }
            else {
                errors.push('Validation failed');
            }
        }
        return {
            isValid: errors.length === 0,
            errors: errors,
        };
    };
    // Trust score calculation weights
    TrustBusinessLogic.TRUST_WEIGHTS = {
        documentVerification: 0.25,
        communityFeedback: 0.20,
        transactionHistory: 0.25,
        identityVerification: 0.20,
        propertyVerification: 0.10,
    };
    // Trust level thresholds
    TrustBusinessLogic.TRUST_LEVELS = {
        UNVERIFIED: { min: 0, max: 299, label: 'Unverified', color: 'red' },
        BASIC: { min: 300, max: 499, label: 'Basic', color: 'orange' },
        VERIFIED: { min: 500, max: 749, label: 'Verified', color: 'yellow' },
        TRUSTED: { min: 750, max: 899, label: 'Trusted', color: 'green' },
        PREMIUM: { min: 900, max: 1000, label: 'Premium', color: 'blue' },
    };
    return TrustBusinessLogic;
}());
exports.TrustBusinessLogic = TrustBusinessLogic;
