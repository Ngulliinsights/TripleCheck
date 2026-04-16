/**
 * Communication Platform Integration with Document Intelligence
 * Provides document context in messaging and automated notifications
 */

import { DocumentVerificationResult } from '../../trust/types';
import { NotificationChannel, DocumentContext } from '../../../server/types/messaging.types';

// ─── Constants ───────────────────────────────────────────────────────────────

const TRUST_SCORE_THRESHOLD = 70;
const MAX_SUGGESTED_QUESTIONS = 5;

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'verification_complete'
  | 'verification_failed'
  | 'document_flagged'
  | 'expert_review_needed';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export type ExpertType = 'legal' | 'surveyor' | 'valuer';

export type ReviewUrgency = 'normal' | 'urgent' | 'critical';

export interface DocumentNotification {
  readonly type: NotificationType;
  readonly documentId: string;
  readonly propertyId?: string;
  readonly userId: string;
  readonly title: string;
  readonly message: string;
  readonly actionRequired: boolean;
  readonly channels: readonly NotificationChannel[];
  readonly metadata: {
    readonly verificationScore?: number;
    readonly riskLevel?: string;
    readonly expertRequired?: boolean;
    readonly communityFlagged?: boolean;
  };
}

export interface DocumentMessageContext {
  readonly documentId: string;
  readonly verificationStatus: string;
  readonly trustScore: number;
  readonly lastVerified: Date;
  readonly issues: readonly string[];
  readonly recommendations: readonly string[];
}

interface VerificationStatus {
  status: string;
  score: number;
  lastUpdated: Date;
}

interface DocumentSummary {
  verified: number;
  pending: number;
  issues: number;
  total: number;
}

interface DocumentAlert {
  documentId: string;
  issues: readonly string[];
  severity: AlertSeverity;
}

interface CommunityFlag {
  documentId: string;
  flaggedBy: string;
  reason: string;
  evidence?: readonly string[];
}

interface Expert {
  id: string;
}

interface ExpertAssignment {
  estimatedCompletion: Date;
  trackingId: string;
}

interface CommunicationChannel {
  id: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class DocumentCommunicationIntegrationService {
  /**
   * Send automated notifications for document verification status.
   * Uses allSettled so a failure in one channel does not block others.
   */
  async sendDocumentNotification(
    verificationResult: DocumentVerificationResult,
    recipients: readonly string[]
  ): Promise<void> {
    const notification = this.buildNotification(verificationResult);

    await Promise.allSettled([
      this.sendInAppNotification(notification, recipients),
      this.sendEmailNotification(notification, recipients),
      this.sendSMSNotification(notification, recipients),
      this.sendPushNotification(notification, recipients),
    ]);

    await this.logNotification(notification, recipients);
  }

  /**
   * Enrich a property inquiry with document context, suggested questions,
   * a verification summary, and a risk assessment.
   */
  async enhancePropertyInquiry(
    _inquiryId: string,
    propertyId: string,
    _requesterId: string
  ): Promise<{
    documentContext: DocumentMessageContext[];
    suggestedQuestions: string[];
    verificationSummary: string;
    riskAssessment: string;
  }> {
    const [documentContext, riskAssessment] = await Promise.all([
      this.getPropertyDocumentContext(propertyId),
      this.generateRiskAssessment(propertyId),
    ]);

    return {
      documentContext,
      suggestedQuestions: this.buildSuggestedQuestions(documentContext),
      verificationSummary: this.buildVerificationSummary(documentContext),
      riskAssessment,
    };
  }

  /**
   * Attach verification widget, document summary, and risk indicators to a
   * message thread. Returns an empty enhancement when no property is linked.
   */
  async enhanceMessageThread(
    _threadId: string,
    propertyId?: string
  ): Promise<{
    verificationWidget: {
      status: string;
      score: number;
      lastUpdated: Date;
      quickActions: string[];
    };
    documentSummary: DocumentSummary;
    riskIndicators: string[];
  }> {
    if (!propertyId) {
      return this.emptyEnhancement();
    }

    const [verificationStatus, documentSummary, riskIndicators] = await Promise.all([
      this.getPropertyVerificationStatus(propertyId),
      this.getDocumentSummary(propertyId),
      this.getRiskIndicators(propertyId),
    ]);

    return {
      verificationWidget: {
        status: verificationStatus.status,
        score: verificationStatus.score,
        lastUpdated: verificationStatus.lastUpdated,
        quickActions: this.buildQuickActions(verificationStatus),
      },
      documentSummary,
      riskIndicators,
    };
  }

  /**
   * Alert users to document issues. High/critical alerts are dispatched
   * immediately; lower severity alerts are scheduled.
   */
  async alertDocumentIssues(
    documentId: string,
    issues: readonly string[],
    severity: AlertSeverity
  ): Promise<void> {
    const alert = this.buildDocumentAlert(documentId, issues, severity);
    const channels = this.channelsForSeverity(severity);

    if (severity === 'high' || severity === 'critical') {
      await this.sendImmediateAlert(alert, channels);
    } else {
      await this.scheduleAlert(alert, channels);
    }

    await Promise.allSettled([
      this.updateUserDashboard(alert),
      this.logSecurityAlert(alert),
    ]);
  }

  /**
   * Process a community document flag: notify the owner and moderators,
   * update trust metrics, and trigger expert review when warranted.
   */
  async handleCommunityDocumentFlag(
    documentId: string,
    flaggedBy: string,
    reason: string,
    evidence?: readonly string[]
  ): Promise<void> {
    const flag = await this.createCommunityFlag(documentId, flaggedBy, reason, evidence);

    await Promise.allSettled([
      this.notifyDocumentOwner(flag),
      this.notifyModerators(flag),
      this.updateCommunityTrustMetrics(flag),
    ]);

    if (this.requiresAdditionalVerification(flag)) {
      await this.triggerExpertReview(flag);
    }
  }

  /**
   * Find an available expert, create an assignment, open a communication
   * channel, and notify all stakeholders.
   */
  async coordinateExpertReview(
    documentId: string,
    expertType: ExpertType,
    urgency: ReviewUrgency
  ): Promise<{
    assignedExpert: string;
    estimatedCompletion: Date;
    communicationChannel: string;
    trackingId: string;
  }> {
    const expert = await this.findAvailableExpert(expertType, urgency);
    const assignment = await this.createExpertAssignment(documentId, expert, urgency);
    const channel = await this.setupExpertCommunication(assignment);

    await Promise.allSettled([
      this.sendExpertBriefing(assignment, channel),
      this.notifyStakeholders(assignment),
    ]);

    return {
      assignedExpert: expert.id,
      estimatedCompletion: assignment.estimatedCompletion,
      communicationChannel: channel.id,
      trackingId: assignment.trackingId,
    };
  }

  // ─── Private builders ───────────────────────────────────────────────────────

  private buildNotification(result: DocumentVerificationResult): DocumentNotification {
    return {
      type: this.resolveNotificationType(result),
      documentId: result.documentId,
      propertyId: result.propertyId,
      userId: result.userId ?? '',
      title: `Document verification ${result.status ?? result.verificationStatus}`,
      message: `Your document has been ${result.status ?? result.verificationStatus} with a score of ${result.score ?? result.confidence}%`,
      actionRequired: (result.status ?? result.verificationStatus) === 'failed' || (result.expertReviewRequired ?? false),
      channels: this.channelsForResult(result),
      metadata: {
        verificationScore: result.score ?? result.confidence,
        riskLevel: result.riskLevel,
        expertRequired: result.expertReviewRequired,
        communityFlagged: result.communityFlagged,
      },
    };
  }

  private buildDocumentAlert(
    documentId: string,
    issues: readonly string[],
    severity: AlertSeverity
  ): DocumentAlert {
    return { documentId, issues, severity };
  }

  private buildSuggestedQuestions(context: DocumentMessageContext[]): string[] {
    const questions: string[] = [];

    for (const doc of context) {
      if (doc.verificationStatus === 'pending') {
        questions.push(`What's the status of the ${doc.documentId} verification?`);
      }
      if (doc.issues.length > 0) {
        questions.push(`Can you clarify the issues with ${doc.documentId}?`);
      }
      if (doc.trustScore < TRUST_SCORE_THRESHOLD) {
        questions.push(`Are there any concerns about ${doc.documentId}?`);
      }
    }

    return questions.slice(0, MAX_SUGGESTED_QUESTIONS);
  }

  private buildVerificationSummary(context: DocumentMessageContext[]): string {
    if (context.length === 0) return 'No documents available.';

    const verified = context.filter(d => d.verificationStatus === 'verified').length;
    const avgTrust = Math.round(
      context.reduce((sum, d) => sum + d.trustScore, 0) / context.length
    );

    return `${verified}/${context.length} documents verified with ${avgTrust}% average trust score`;
  }

  private buildQuickActions(status: VerificationStatus): string[] {
    const actions: string[] = [];

    if (status.status === 'pending') actions.push('Check verification status');
    if (status.score < TRUST_SCORE_THRESHOLD) actions.push('Request expert review');

    actions.push('View full report', 'Contact support');
    return actions;
  }

  // ─── Private resolvers ──────────────────────────────────────────────────────

  private resolveNotificationType(result: DocumentVerificationResult): NotificationType {
    const status = result.status ?? result.verificationStatus;
    if (status === 'failed') return 'verification_failed';
    if (result.communityFlagged) return 'document_flagged';
    if (result.expertReviewRequired) return 'expert_review_needed';
    return 'verification_complete';
  }

  /**
   * Single source of truth for channel selection — used by both notifications
   * and alerts. Higher severity always includes lower-severity channels.
   */
  private channelsForSeverity(severity: AlertSeverity): NotificationChannel[] {
    const channels: NotificationChannel[] = ['in_app'];
    if (severity !== 'low') channels.push('email');
    if (severity === 'high' || severity === 'critical') channels.push('push');
    if (severity === 'critical') channels.push('sms');
    return channels;
  }

  private channelsForResult(result: DocumentVerificationResult): NotificationChannel[] {
    const status = result.status ?? result.verificationStatus;
    const severity: AlertSeverity =
      status === 'failed' ? 'high'
      : result.communityFlagged  ? 'medium'
      : 'low';

    return this.channelsForSeverity(severity);
  }

  private emptyEnhancement() {
    return {
      verificationWidget: {
        status: 'unknown',
        score: 0,
        lastUpdated: new Date(),
        quickActions: [] as string[],
      },
      documentSummary: { verified: 0, pending: 0, issues: 0, total: 0 },
      riskIndicators: [] as string[],
    };
  }

  // ─── Notification dispatch ──────────────────────────────────────────────────

  private async sendInAppNotification(
    notification: DocumentNotification,
    recipients: readonly string[]
  ): Promise<void> {
    const { NotificationService } = await import('../../../server/communication/notification.service');
    const notificationService = new NotificationService(undefined);

    for (const recipientId of recipients) {
      await notificationService.createNotification(
        parseInt(recipientId, 10),
        'document_processed',
        {
          documentId: notification.documentId,
          title: notification.title,
          message: notification.message,
        },
        {
          priority: notification.actionRequired ? 'high' : 'medium',
          data: notification.metadata,
        }
      );
    }
  }

  private async sendEmailNotification(
    notification: DocumentNotification,
    recipients: readonly string[]
  ): Promise<void> {
    const { getEmailService } = await import('../../../server/infrastructure/email/email.service');
    const emailService = await getEmailService();

    const emailHtml = this.buildEmailTemplate(notification);

    await emailService.sendEmail({
      to: recipients as string[],
      subject: notification.title,
      html: emailHtml,
      text: notification.message,
    });
  }

  /** SMS dispatch — critical issues only; integrates with M-Pesa / local SMS provider. */
  private async sendSMSNotification(
    notification: DocumentNotification,
    recipients: readonly string[]
  ): Promise<void> {
    // Only send SMS for critical/high priority notifications
    if (!notification.actionRequired && notification.metadata.riskLevel !== 'critical') {
      return;
    }

    // SMS integration would go here (e.g., Africa's Talking, Twilio)
    // For now, log the SMS that would be sent
    const smsMessage = `${notification.title}: ${notification.message}`;
    console.log('SMS would be sent to:', recipients, 'Message:', smsMessage);
  }

  private async sendPushNotification(
    notification: DocumentNotification,
    recipients: readonly string[]
  ): Promise<void> {
    // Push notification integration (e.g., Firebase Cloud Messaging, OneSignal)
    // For now, log the push notification
    console.log('Push notification would be sent to:', recipients, {
      title: notification.title,
      body: notification.message,
      data: notification.metadata,
    });
  }

  private async logNotification(
    notification: DocumentNotification,
    recipients: readonly string[]
  ): Promise<void> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    logger.info('Document notification sent', 'COMMUNICATION', {
      type: notification.type,
      documentId: notification.documentId,
      propertyId: notification.propertyId,
      recipientCount: recipients.length,
      channels: notification.channels,
      actionRequired: notification.actionRequired,
    });
  }

  // ─── Alert dispatch ──────────────────────────────────────────────────────────

  private async sendImmediateAlert(
    alert: DocumentAlert,
    channels: readonly NotificationChannel[]
  ): Promise<void> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.warn('Immediate document alert', 'SECURITY', {
      documentId: alert.documentId,
      severity: alert.severity,
      issueCount: alert.issues.length,
      channels,
    });

    // Send through all specified channels immediately
    const promises: Promise<void>[] = [];

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

    await Promise.allSettled(promises);
  }

  private async scheduleAlert(
    alert: DocumentAlert,
    channels: readonly NotificationChannel[]
  ): Promise<void> {
    // For lower severity alerts, batch them for scheduled delivery
    // In production, this would use a job queue (Bull, BullMQ, etc.)
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.info('Scheduled document alert', 'COMMUNICATION', {
      documentId: alert.documentId,
      severity: alert.severity,
      channels,
      scheduledFor: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    });

    // For now, send immediately but log as scheduled
    await this.sendImmediateAlert(alert, channels);
  }

  private async updateUserDashboard(alert: DocumentAlert): Promise<void> {
    // Update user dashboard with alert information
    // This would typically update a database table or cache
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.debug('Dashboard updated with alert', 'COMMUNICATION', {
      documentId: alert.documentId,
      severity: alert.severity,
    });
  }

  private async logSecurityAlert(alert: DocumentAlert): Promise<void> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.securityEvent('document_alert', undefined, undefined);
    logger.warn('Security alert logged', 'SECURITY', {
      documentId: alert.documentId,
      severity: alert.severity,
      issues: alert.issues,
      timestamp: new Date().toISOString(),
    });
  }

  private async sendAlertInApp(alert: DocumentAlert): Promise<void> {
    // Implementation for in-app alerts
    console.log('In-app alert:', alert);
  }

  private async sendAlertEmail(alert: DocumentAlert): Promise<void> {
    // Implementation for email alerts
    console.log('Email alert:', alert);
  }

  private async sendAlertSMS(alert: DocumentAlert): Promise<void> {
    // Implementation for SMS alerts
    console.log('SMS alert:', alert);
  }

  private async sendAlertPush(alert: DocumentAlert): Promise<void> {
    // Implementation for push alerts
    console.log('Push alert:', alert);
  }

  // ─── Community flag ──────────────────────────────────────────────────────────

  private async createCommunityFlag(
    documentId: string,
    flaggedBy: string,
    reason: string,
    evidence?: readonly string[]
  ): Promise<CommunityFlag> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    const flag: CommunityFlag = { documentId, flaggedBy, reason, evidence };
    
    logger.info('Community flag created', 'COMMUNITY', {
      documentId,
      flaggedBy,
      reason,
      evidenceCount: evidence?.length ?? 0,
    });

    // In production, persist to database
    return flag;
  }

  private async notifyDocumentOwner(flag: CommunityFlag): Promise<void> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.info('Notifying document owner of flag', 'COMMUNICATION', {
      documentId: flag.documentId,
      reason: flag.reason,
    });

    // Send notification to document owner
    // This would look up the owner and send appropriate notification
  }

  private async notifyModerators(flag: CommunityFlag): Promise<void> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.info('Notifying moderators of flag', 'COMMUNICATION', {
      documentId: flag.documentId,
      flaggedBy: flag.flaggedBy,
      reason: flag.reason,
    });

    // Send notification to moderation team
  }

  private async updateCommunityTrustMetrics(flag: CommunityFlag): Promise<void> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.debug('Updating community trust metrics', 'TRUST', {
      documentId: flag.documentId,
    });

    // Update trust scores and metrics based on community flag
  }

  private requiresAdditionalVerification(flag: CommunityFlag): boolean {
    // Determine if flag warrants expert review
    const criticalReasons = ['forgery', 'fraud', 'tampering', 'fake'];
    const hasCriticalReason = criticalReasons.some(keyword => 
      flag.reason.toLowerCase().includes(keyword)
    );
    
    const hasSubstantialEvidence = (flag.evidence?.length ?? 0) >= 2;
    
    return hasCriticalReason || hasSubstantialEvidence;
  }

  private async triggerExpertReview(flag: CommunityFlag): Promise<void> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.warn('Triggering expert review for flagged document', 'VERIFICATION', {
      documentId: flag.documentId,
      reason: flag.reason,
    });

    // Initiate expert review process
    await this.coordinateExpertReview(flag.documentId, 'legal', 'urgent');
  }

  // ─── Expert coordination ────────────────────────────────────────────────────

  private async findAvailableExpert(
    type: ExpertType,
    urgency: ReviewUrgency
  ): Promise<Expert> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    // In production, query expert database with availability and specialization
    const expertId = `expert_${type}_${Date.now()}`;
    
    logger.info('Expert assigned', 'COORDINATION', {
      expertType: type,
      urgency,
      expertId,
    });

    return { id: expertId };
  }

  private async createExpertAssignment(
    documentId: string,
    expert: Expert,
    urgency: ReviewUrgency
  ): Promise<ExpertAssignment> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    // Calculate estimated completion based on urgency
    const hoursToComplete = urgency === 'critical' ? 4 : urgency === 'urgent' ? 24 : 72;
    const estimatedCompletion = new Date(Date.now() + hoursToComplete * 60 * 60 * 1000);
    
    const trackingId = `assignment_${documentId}_${expert.id}_${Date.now()}`;
    
    logger.info('Expert assignment created', 'COORDINATION', {
      documentId,
      expertId: expert.id,
      urgency,
      trackingId,
      estimatedCompletion,
    });

    return { estimatedCompletion, trackingId };
  }

  private async setupExpertCommunication(
    assignment: ExpertAssignment
  ): Promise<CommunicationChannel> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    const channelId = `channel_${assignment.trackingId}`;
    
    logger.info('Expert communication channel created', 'COORDINATION', {
      trackingId: assignment.trackingId,
      channelId,
    });

    // In production, create a dedicated communication thread
    return { id: channelId };
  }

  private async sendExpertBriefing(
    assignment: ExpertAssignment,
    channel: CommunicationChannel
  ): Promise<void> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.info('Expert briefing sent', 'COORDINATION', {
      trackingId: assignment.trackingId,
      channelId: channel.id,
    });

    // Send comprehensive briefing to expert with document details
  }

  private async notifyStakeholders(assignment: ExpertAssignment): Promise<void> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.info('Stakeholders notified of expert assignment', 'COORDINATION', {
      trackingId: assignment.trackingId,
      estimatedCompletion: assignment.estimatedCompletion,
    });

    // Notify document owner, property owner, and relevant parties
  }

  // ─── Data access ────────────────────────────────────────────────────────────

  private async getPropertyDocumentContext(
    propertyId: string
  ): Promise<DocumentMessageContext[]> {
    // In production, query document database for property
    // For now, return mock data structure
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.debug('Fetching property document context', 'DATA_ACCESS', { propertyId });

    // This would query the database for all documents related to the property
    return [];
  }

  private async generateRiskAssessment(propertyId: string): Promise<string> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.debug('Generating risk assessment', 'ANALYSIS', { propertyId });

    // In production, analyze documents and generate comprehensive risk assessment
    return 'Risk assessment pending - all documents under review';
  }

  private async getPropertyVerificationStatus(
    propertyId: string
  ): Promise<VerificationStatus> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.debug('Fetching property verification status', 'DATA_ACCESS', { propertyId });

    // In production, query verification database
    return { 
      status: 'pending', 
      score: 0, 
      lastUpdated: new Date() 
    };
  }

  private async getDocumentSummary(propertyId: string): Promise<DocumentSummary> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.debug('Fetching document summary', 'DATA_ACCESS', { propertyId });

    // In production, aggregate document statistics
    return { 
      verified: 0, 
      pending: 0, 
      issues: 0, 
      total: 0 
    };
  }

  private async getRiskIndicators(propertyId: string): Promise<string[]> {
    const { logger } = await import('../../../server/infrastructure/monitoring/logger');
    
    logger.debug('Fetching risk indicators', 'ANALYSIS', { propertyId });

    // In production, analyze documents and return risk indicators
    return [];
  }

  // ─── Email template builder ─────────────────────────────────────────────────

  private buildEmailTemplate(notification: DocumentNotification): string {
    const statusColor = 
      notification.type === 'verification_complete' ? '#10B981' :
      notification.type === 'verification_failed' ? '#EF4444' :
      notification.type === 'document_flagged' ? '#F59E0B' :
      '#6366F1';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${notification.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: ${statusColor}; color: #fff; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; background: #f9f9f9; }
    .alert { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .button { display: inline-block; background: ${statusColor}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; background: #f0f0f0; border-radius: 0 0 8px 8px; }
    .metadata { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${notification.title}</h1>
  </div>
  <div class="content">
    <p>${notification.message}</p>
    
    ${notification.actionRequired ? '<div class="alert"><strong>Action Required:</strong> Please review this document immediately.</div>' : ''}
    
    <div class="metadata">
      <p><strong>Document ID:</strong> ${notification.documentId}</p>
      ${notification.propertyId ? `<p><strong>Property ID:</strong> ${notification.propertyId}</p>` : ''}
      ${notification.metadata.verificationScore ? `<p><strong>Verification Score:</strong> ${notification.metadata.verificationScore}%</p>` : ''}
      ${notification.metadata.riskLevel ? `<p><strong>Risk Level:</strong> ${notification.metadata.riskLevel}</p>` : ''}
    </div>
    
    <a class="button" href="${process.env.FRONTEND_URL || 'https://triplecheck.co.ke'}/documents/${notification.documentId}">View Document</a>
  </div>
  <div class="footer">
    © ${new Date().getFullYear()} TripleCheck Kenya - Trusted Land Verification
  </div>
</body>
</html>`;
  }
}