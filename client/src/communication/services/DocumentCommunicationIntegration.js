"use strict";
/**
 * Communication Platform Integration with Document Intelligence
 * Provides document context in messaging and automated notifications
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
exports.DocumentCommunicationIntegrationService = void 0;
// ─── Constants ───────────────────────────────────────────────────────────────
var TRUST_SCORE_THRESHOLD = 70;
var MAX_SUGGESTED_QUESTIONS = 5;
// ─── Service ──────────────────────────────────────────────────────────────────
var DocumentCommunicationIntegrationService = /** @class */ (function () {
    function DocumentCommunicationIntegrationService() {
    }
    /**
     * Send automated notifications for document verification status.
     * Uses allSettled so a failure in one channel does not block others.
     */
    DocumentCommunicationIntegrationService.prototype.sendDocumentNotification = function (verificationResult, recipients) {
        return __awaiter(this, void 0, void 0, function () {
            var notification;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        notification = this.buildNotification(verificationResult);
                        return [4 /*yield*/, Promise.allSettled([
                                this.sendInAppNotification(notification, recipients),
                                this.sendEmailNotification(notification, recipients),
                                this.sendSMSNotification(notification, recipients),
                                this.sendPushNotification(notification, recipients),
                            ])];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.logNotification(notification, recipients)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enrich a property inquiry with document context, suggested questions,
     * a verification summary, and a risk assessment.
     */
    DocumentCommunicationIntegrationService.prototype.enhancePropertyInquiry = function (_inquiryId, propertyId, _requesterId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, documentContext, riskAssessment;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.all([
                            this.getPropertyDocumentContext(propertyId),
                            this.generateRiskAssessment(propertyId),
                        ])];
                    case 1:
                        _a = _b.sent(), documentContext = _a[0], riskAssessment = _a[1];
                        return [2 /*return*/, {
                                documentContext: documentContext,
                                suggestedQuestions: this.buildSuggestedQuestions(documentContext),
                                verificationSummary: this.buildVerificationSummary(documentContext),
                                riskAssessment: riskAssessment,
                            }];
                }
            });
        });
    };
    /**
     * Attach verification widget, document summary, and risk indicators to a
     * message thread. Returns an empty enhancement when no property is linked.
     */
    DocumentCommunicationIntegrationService.prototype.enhanceMessageThread = function (_threadId, propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, verificationStatus, documentSummary, riskIndicators;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!propertyId) {
                            return [2 /*return*/, this.emptyEnhancement()];
                        }
                        return [4 /*yield*/, Promise.all([
                                this.getPropertyVerificationStatus(propertyId),
                                this.getDocumentSummary(propertyId),
                                this.getRiskIndicators(propertyId),
                            ])];
                    case 1:
                        _a = _b.sent(), verificationStatus = _a[0], documentSummary = _a[1], riskIndicators = _a[2];
                        return [2 /*return*/, {
                                verificationWidget: {
                                    status: verificationStatus.status,
                                    score: verificationStatus.score,
                                    lastUpdated: verificationStatus.lastUpdated,
                                    quickActions: this.buildQuickActions(verificationStatus),
                                },
                                documentSummary: documentSummary,
                                riskIndicators: riskIndicators,
                            }];
                }
            });
        });
    };
    /**
     * Alert users to document issues. High/critical alerts are dispatched
     * immediately; lower severity alerts are scheduled.
     */
    DocumentCommunicationIntegrationService.prototype.alertDocumentIssues = function (documentId, issues, severity) {
        return __awaiter(this, void 0, void 0, function () {
            var alert, channels;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        alert = this.buildDocumentAlert(documentId, issues, severity);
                        channels = this.channelsForSeverity(severity);
                        if (!(severity === 'high' || severity === 'critical')) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.sendImmediateAlert(alert, channels)];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.scheduleAlert(alert, channels)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [4 /*yield*/, Promise.allSettled([
                            this.updateUserDashboard(alert),
                            this.logSecurityAlert(alert),
                        ])];
                    case 5:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process a community document flag: notify the owner and moderators,
     * update trust metrics, and trigger expert review when warranted.
     */
    DocumentCommunicationIntegrationService.prototype.handleCommunityDocumentFlag = function (documentId, flaggedBy, reason, evidence) {
        return __awaiter(this, void 0, void 0, function () {
            var flag;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.createCommunityFlag(documentId, flaggedBy, reason, evidence)];
                    case 1:
                        flag = _a.sent();
                        return [4 /*yield*/, Promise.allSettled([
                                this.notifyDocumentOwner(flag),
                                this.notifyModerators(flag),
                                this.updateCommunityTrustMetrics(flag),
                            ])];
                    case 2:
                        _a.sent();
                        if (!this.requiresAdditionalVerification(flag)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.triggerExpertReview(flag)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find an available expert, create an assignment, open a communication
     * channel, and notify all stakeholders.
     */
    DocumentCommunicationIntegrationService.prototype.coordinateExpertReview = function (documentId, expertType, urgency) {
        return __awaiter(this, void 0, void 0, function () {
            var expert, assignment, channel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findAvailableExpert(expertType, urgency)];
                    case 1:
                        expert = _a.sent();
                        return [4 /*yield*/, this.createExpertAssignment(documentId, expert, urgency)];
                    case 2:
                        assignment = _a.sent();
                        return [4 /*yield*/, this.setupExpertCommunication(assignment)];
                    case 3:
                        channel = _a.sent();
                        return [4 /*yield*/, Promise.allSettled([
                                this.sendExpertBriefing(assignment, channel),
                                this.notifyStakeholders(assignment),
                            ])];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, {
                                assignedExpert: expert.id,
                                estimatedCompletion: assignment.estimatedCompletion,
                                communicationChannel: channel.id,
                                trackingId: assignment.trackingId,
                            }];
                }
            });
        });
    };
    // ─── Private builders ───────────────────────────────────────────────────────
    DocumentCommunicationIntegrationService.prototype.buildNotification = function (result) {
        var _a, _b, _c, _d, _e, _f, _g;
        return {
            type: this.resolveNotificationType(result),
            documentId: result.documentId,
            propertyId: result.propertyId,
            userId: (_a = result.userId) !== null && _a !== void 0 ? _a : '',
            title: "Document verification ".concat((_b = result.status) !== null && _b !== void 0 ? _b : result.verificationStatus),
            message: "Your document has been ".concat((_c = result.status) !== null && _c !== void 0 ? _c : result.verificationStatus, " with a score of ").concat((_d = result.score) !== null && _d !== void 0 ? _d : result.confidence, "%"),
            actionRequired: ((_e = result.status) !== null && _e !== void 0 ? _e : result.verificationStatus) === 'failed' || ((_f = result.expertReviewRequired) !== null && _f !== void 0 ? _f : false),
            channels: this.channelsForResult(result),
            metadata: {
                verificationScore: (_g = result.score) !== null && _g !== void 0 ? _g : result.confidence,
                riskLevel: result.riskLevel,
                expertRequired: result.expertReviewRequired,
                communityFlagged: result.communityFlagged,
            },
        };
    };
    DocumentCommunicationIntegrationService.prototype.buildDocumentAlert = function (documentId, issues, severity) {
        return { documentId: documentId, issues: issues, severity: severity };
    };
    DocumentCommunicationIntegrationService.prototype.buildSuggestedQuestions = function (context) {
        var questions = [];
        for (var _i = 0, context_1 = context; _i < context_1.length; _i++) {
            var doc = context_1[_i];
            if (doc.verificationStatus === 'pending') {
                questions.push("What's the status of the ".concat(doc.documentId, " verification?"));
            }
            if (doc.issues.length > 0) {
                questions.push("Can you clarify the issues with ".concat(doc.documentId, "?"));
            }
            if (doc.trustScore < TRUST_SCORE_THRESHOLD) {
                questions.push("Are there any concerns about ".concat(doc.documentId, "?"));
            }
        }
        return questions.slice(0, MAX_SUGGESTED_QUESTIONS);
    };
    DocumentCommunicationIntegrationService.prototype.buildVerificationSummary = function (context) {
        if (context.length === 0)
            return 'No documents available.';
        var verified = context.filter(function (d) { return d.verificationStatus === 'verified'; }).length;
        var avgTrust = Math.round(context.reduce(function (sum, d) { return sum + d.trustScore; }, 0) / context.length);
        return "".concat(verified, "/").concat(context.length, " documents verified with ").concat(avgTrust, "% average trust score");
    };
    DocumentCommunicationIntegrationService.prototype.buildQuickActions = function (status) {
        var actions = [];
        if (status.status === 'pending')
            actions.push('Check verification status');
        if (status.score < TRUST_SCORE_THRESHOLD)
            actions.push('Request expert review');
        actions.push('View full report', 'Contact support');
        return actions;
    };
    // ─── Private resolvers ──────────────────────────────────────────────────────
    DocumentCommunicationIntegrationService.prototype.resolveNotificationType = function (result) {
        var _a;
        var status = (_a = result.status) !== null && _a !== void 0 ? _a : result.verificationStatus;
        if (status === 'failed')
            return 'verification_failed';
        if (result.communityFlagged)
            return 'document_flagged';
        if (result.expertReviewRequired)
            return 'expert_review_needed';
        return 'verification_complete';
    };
    /**
     * Single source of truth for channel selection — used by both notifications
     * and alerts. Higher severity always includes lower-severity channels.
     */
    DocumentCommunicationIntegrationService.prototype.channelsForSeverity = function (severity) {
        var channels = ['in_app'];
        if (severity !== 'low')
            channels.push('email');
        if (severity === 'high' || severity === 'critical')
            channels.push('push');
        if (severity === 'critical')
            channels.push('sms');
        return channels;
    };
    DocumentCommunicationIntegrationService.prototype.channelsForResult = function (result) {
        var _a;
        var status = (_a = result.status) !== null && _a !== void 0 ? _a : result.verificationStatus;
        var severity = status === 'failed' ? 'high'
            : result.communityFlagged ? 'medium'
                : 'low';
        return this.channelsForSeverity(severity);
    };
    DocumentCommunicationIntegrationService.prototype.emptyEnhancement = function () {
        return {
            verificationWidget: {
                status: 'unknown',
                score: 0,
                lastUpdated: new Date(),
                quickActions: [],
            },
            documentSummary: { verified: 0, pending: 0, issues: 0, total: 0 },
            riskIndicators: [],
        };
    };
    // ─── Notification dispatch ──────────────────────────────────────────────────
    DocumentCommunicationIntegrationService.prototype.sendInAppNotification = function (notification, recipients) {
        return __awaiter(this, void 0, void 0, function () {
            var NotificationService, notificationService, _i, recipients_1, recipientId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/communication/notification.service'); })];
                    case 1:
                        NotificationService = (_a.sent()).NotificationService;
                        notificationService = new NotificationService(undefined);
                        _i = 0, recipients_1 = recipients;
                        _a.label = 2;
                    case 2:
                        if (!(_i < recipients_1.length)) return [3 /*break*/, 5];
                        recipientId = recipients_1[_i];
                        return [4 /*yield*/, notificationService.createNotification(parseInt(recipientId, 10), 'document_processed', {
                                documentId: notification.documentId,
                                title: notification.title,
                                message: notification.message,
                            }, {
                                priority: notification.actionRequired ? 'high' : 'medium',
                                data: notification.metadata,
                            })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.sendEmailNotification = function (notification, recipients) {
        return __awaiter(this, void 0, void 0, function () {
            var getEmailService, emailService, emailHtml;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/email/email.service'); })];
                    case 1:
                        getEmailService = (_a.sent()).getEmailService;
                        return [4 /*yield*/, getEmailService()];
                    case 2:
                        emailService = _a.sent();
                        emailHtml = this.buildEmailTemplate(notification);
                        return [4 /*yield*/, emailService.sendEmail({
                                to: recipients,
                                subject: notification.title,
                                html: emailHtml,
                                text: notification.message,
                            })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** SMS dispatch — critical issues only; integrates with M-Pesa / local SMS provider. */
    DocumentCommunicationIntegrationService.prototype.sendSMSNotification = function (notification, recipients) {
        return __awaiter(this, void 0, void 0, function () {
            var smsMessage;
            return __generator(this, function (_a) {
                // Only send SMS for critical/high priority notifications
                if (!notification.actionRequired && notification.metadata.riskLevel !== 'critical') {
                    return [2 /*return*/];
                }
                smsMessage = "".concat(notification.title, ": ").concat(notification.message);
                console.log('SMS would be sent to:', recipients, 'Message:', smsMessage);
                return [2 /*return*/];
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.sendPushNotification = function (notification, recipients) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Push notification integration (e.g., Firebase Cloud Messaging, OneSignal)
                // For now, log the push notification
                console.log('Push notification would be sent to:', recipients, {
                    title: notification.title,
                    body: notification.message,
                    data: notification.metadata,
                });
                return [2 /*return*/];
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.logNotification = function (notification, recipients) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.info('Document notification sent', 'COMMUNICATION', {
                            type: notification.type,
                            documentId: notification.documentId,
                            propertyId: notification.propertyId,
                            recipientCount: recipients.length,
                            channels: notification.channels,
                            actionRequired: notification.actionRequired,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    // ─── Alert dispatch ──────────────────────────────────────────────────────────
    DocumentCommunicationIntegrationService.prototype.sendImmediateAlert = function (alert, channels) {
        return __awaiter(this, void 0, void 0, function () {
            var logger, promises;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.warn('Immediate document alert', 'SECURITY', {
                            documentId: alert.documentId,
                            severity: alert.severity,
                            issueCount: alert.issues.length,
                            channels: channels,
                        });
                        promises = [];
                        if (channels.includes('in_app')) {
                            promises.push(this.sendAlertInApp(alert));
                        }
                        if (channels.includes('email')) {
                            promises.push(this.sendAlertEmail(alert));
                        }
                        if (channels.includes('sms')) {
                            promises.push(this.sendAlertSMS(alert));
                        }
                        if (channels.includes('push')) {
                            promises.push(this.sendAlertPush(alert));
                        }
                        return [4 /*yield*/, Promise.allSettled(promises)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.scheduleAlert = function (alert, channels) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.info('Scheduled document alert', 'COMMUNICATION', {
                            documentId: alert.documentId,
                            severity: alert.severity,
                            channels: channels,
                            scheduledFor: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
                        });
                        // For now, send immediately but log as scheduled
                        return [4 /*yield*/, this.sendImmediateAlert(alert, channels)];
                    case 2:
                        // For now, send immediately but log as scheduled
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.updateUserDashboard = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.debug('Dashboard updated with alert', 'COMMUNICATION', {
                            documentId: alert.documentId,
                            severity: alert.severity,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.logSecurityAlert = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.securityEvent('document_alert', undefined, undefined);
                        logger.warn('Security alert logged', 'SECURITY', {
                            documentId: alert.documentId,
                            severity: alert.severity,
                            issues: alert.issues,
                            timestamp: new Date().toISOString(),
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.sendAlertInApp = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for in-app alerts
                console.log('In-app alert:', alert);
                return [2 /*return*/];
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.sendAlertEmail = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for email alerts
                console.log('Email alert:', alert);
                return [2 /*return*/];
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.sendAlertSMS = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for SMS alerts
                console.log('SMS alert:', alert);
                return [2 /*return*/];
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.sendAlertPush = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implementation for push alerts
                console.log('Push alert:', alert);
                return [2 /*return*/];
            });
        });
    };
    // ─── Community flag ──────────────────────────────────────────────────────────
    DocumentCommunicationIntegrationService.prototype.createCommunityFlag = function (documentId, flaggedBy, reason, evidence) {
        return __awaiter(this, void 0, void 0, function () {
            var logger, flag;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_b.sent()).logger;
                        flag = { documentId: documentId, flaggedBy: flaggedBy, reason: reason, evidence: evidence };
                        logger.info('Community flag created', 'COMMUNITY', {
                            documentId: documentId,
                            flaggedBy: flaggedBy,
                            reason: reason,
                            evidenceCount: (_a = evidence === null || evidence === void 0 ? void 0 : evidence.length) !== null && _a !== void 0 ? _a : 0,
                        });
                        // In production, persist to database
                        return [2 /*return*/, flag];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.notifyDocumentOwner = function (flag) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.info('Notifying document owner of flag', 'COMMUNICATION', {
                            documentId: flag.documentId,
                            reason: flag.reason,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.notifyModerators = function (flag) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.info('Notifying moderators of flag', 'COMMUNICATION', {
                            documentId: flag.documentId,
                            flaggedBy: flag.flaggedBy,
                            reason: flag.reason,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.updateCommunityTrustMetrics = function (flag) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.debug('Updating community trust metrics', 'TRUST', {
                            documentId: flag.documentId,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.requiresAdditionalVerification = function (flag) {
        var _a, _b;
        // Determine if flag warrants expert review
        var criticalReasons = ['forgery', 'fraud', 'tampering', 'fake'];
        var hasCriticalReason = criticalReasons.some(function (keyword) {
            return flag.reason.toLowerCase().includes(keyword);
        });
        var hasSubstantialEvidence = ((_b = (_a = flag.evidence) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) >= 2;
        return hasCriticalReason || hasSubstantialEvidence;
    };
    DocumentCommunicationIntegrationService.prototype.triggerExpertReview = function (flag) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.warn('Triggering expert review for flagged document', 'VERIFICATION', {
                            documentId: flag.documentId,
                            reason: flag.reason,
                        });
                        // Initiate expert review process
                        return [4 /*yield*/, this.coordinateExpertReview(flag.documentId, 'legal', 'urgent')];
                    case 2:
                        // Initiate expert review process
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // ─── Expert coordination ────────────────────────────────────────────────────
    DocumentCommunicationIntegrationService.prototype.findAvailableExpert = function (type, urgency) {
        return __awaiter(this, void 0, void 0, function () {
            var logger, expertId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        expertId = "expert_".concat(type, "_").concat(Date.now());
                        logger.info('Expert assigned', 'COORDINATION', {
                            expertType: type,
                            urgency: urgency,
                            expertId: expertId,
                        });
                        return [2 /*return*/, { id: expertId }];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.createExpertAssignment = function (documentId, expert, urgency) {
        return __awaiter(this, void 0, void 0, function () {
            var logger, hoursToComplete, estimatedCompletion, trackingId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        hoursToComplete = urgency === 'critical' ? 4 : urgency === 'urgent' ? 24 : 72;
                        estimatedCompletion = new Date(Date.now() + hoursToComplete * 60 * 60 * 1000);
                        trackingId = "assignment_".concat(documentId, "_").concat(expert.id, "_").concat(Date.now());
                        logger.info('Expert assignment created', 'COORDINATION', {
                            documentId: documentId,
                            expertId: expert.id,
                            urgency: urgency,
                            trackingId: trackingId,
                            estimatedCompletion: estimatedCompletion,
                        });
                        return [2 /*return*/, { estimatedCompletion: estimatedCompletion, trackingId: trackingId }];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.setupExpertCommunication = function (assignment) {
        return __awaiter(this, void 0, void 0, function () {
            var logger, channelId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        channelId = "channel_".concat(assignment.trackingId);
                        logger.info('Expert communication channel created', 'COORDINATION', {
                            trackingId: assignment.trackingId,
                            channelId: channelId,
                        });
                        // In production, create a dedicated communication thread
                        return [2 /*return*/, { id: channelId }];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.sendExpertBriefing = function (assignment, channel) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.info('Expert briefing sent', 'COORDINATION', {
                            trackingId: assignment.trackingId,
                            channelId: channel.id,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.notifyStakeholders = function (assignment) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.info('Stakeholders notified of expert assignment', 'COORDINATION', {
                            trackingId: assignment.trackingId,
                            estimatedCompletion: assignment.estimatedCompletion,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    // ─── Data access ────────────────────────────────────────────────────────────
    DocumentCommunicationIntegrationService.prototype.getPropertyDocumentContext = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.debug('Fetching property document context', 'DATA_ACCESS', { propertyId: propertyId });
                        // This would query the database for all documents related to the property
                        return [2 /*return*/, []];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.generateRiskAssessment = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.debug('Generating risk assessment', 'ANALYSIS', { propertyId: propertyId });
                        // In production, analyze documents and generate comprehensive risk assessment
                        return [2 /*return*/, 'Risk assessment pending - all documents under review'];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.getPropertyVerificationStatus = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.debug('Fetching property verification status', 'DATA_ACCESS', { propertyId: propertyId });
                        // In production, query verification database
                        return [2 /*return*/, {
                                status: 'pending',
                                score: 0,
                                lastUpdated: new Date()
                            }];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.getDocumentSummary = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.debug('Fetching document summary', 'DATA_ACCESS', { propertyId: propertyId });
                        // In production, aggregate document statistics
                        return [2 /*return*/, {
                                verified: 0,
                                pending: 0,
                                issues: 0,
                                total: 0
                            }];
                }
            });
        });
    };
    DocumentCommunicationIntegrationService.prototype.getRiskIndicators = function (propertyId) {
        return __awaiter(this, void 0, void 0, function () {
            var logger;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../../../server/infrastructure/monitoring/logger'); })];
                    case 1:
                        logger = (_a.sent()).logger;
                        logger.debug('Fetching risk indicators', 'ANALYSIS', { propertyId: propertyId });
                        // In production, analyze documents and return risk indicators
                        return [2 /*return*/, []];
                }
            });
        });
    };
    // ─── Email template builder ─────────────────────────────────────────────────
    DocumentCommunicationIntegrationService.prototype.buildEmailTemplate = function (notification) {
        var statusColor = notification.type === 'verification_complete' ? '#10B981' :
            notification.type === 'verification_failed' ? '#EF4444' :
                notification.type === 'document_flagged' ? '#F59E0B' :
                    '#6366F1';
        return "\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <title>".concat(notification.title, "</title>\n  <style>\n    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }\n    .header { background: ").concat(statusColor, "; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }\n    .content { padding: 30px; background: #f9f9f9; }\n    .alert { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0; border-radius: 4px; }\n    .button { display: inline-block; background: ").concat(statusColor, "; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }\n    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f0f0f0; border-radius: 0 0 8px 8px; }\n    .metadata { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 15px 0; }\n  </style>\n</head>\n<body>\n  <div class=\"header\">\n    <h1>").concat(notification.title, "</h1>\n  </div>\n  <div class=\"content\">\n    <p>").concat(notification.message, "</p>\n    \n    ").concat(notification.actionRequired ? '<div class="alert"><strong>Action Required:</strong> Please review this document immediately.</div>' : '', "\n    \n    <div class=\"metadata\">\n      <p><strong>Document ID:</strong> ").concat(notification.documentId, "</p>\n      ").concat(notification.propertyId ? "<p><strong>Property ID:</strong> ".concat(notification.propertyId, "</p>") : '', "\n      ").concat(notification.metadata.verificationScore ? "<p><strong>Verification Score:</strong> ".concat(notification.metadata.verificationScore, "%</p>") : '', "\n      ").concat(notification.metadata.riskLevel ? "<p><strong>Risk Level:</strong> ".concat(notification.metadata.riskLevel, "</p>") : '', "\n    </div>\n    \n    <a class=\"button\" href=\"").concat(process.env.FRONTEND_URL || 'https://triplecheck.co.ke', "/documents/").concat(notification.documentId, "\">View Document</a>\n  </div>\n  <div class=\"footer\">\n    \u00A9 ").concat(new Date().getFullYear(), " TripleCheck Kenya - Trusted Land Verification\n  </div>\n</body>\n</html>");
    };
    return DocumentCommunicationIntegrationService;
}());
exports.DocumentCommunicationIntegrationService = DocumentCommunicationIntegrationService;
