import { EventEmitter } from 'events';

import { Logger } from '../utils/Logger';

import { DatabaseService } from './DatabaseService';

export interface ComplianceCheck {
  regulation: string;
  compliant: boolean;
  violations: ComplianceViolation[];
  riskFactors: RiskFactor[];
  recommendations: string[];
  lastChecked: Date;
  nextReview: Date;
}

export interface ComplianceViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  regulation: string;
  section: string;
  evidence: string[];
  potentialPenalty: string;
  remediation: string[];
}

export interface RiskFactor {
  category: string;
  description: string;
  weight: number;
  evidence: string[];
}

export interface SuspiciousActivityReport {
  id: string;
  reportNumber: string;
  type: 'SAR' | 'CTR' | 'FBAR' | 'Form_8300';
  status: 'draft' | 'pending_review' | 'filed' | 'acknowledged';
  filingDeadline: Date;
  filedDate?: Date;
  acknowledgmentDate?: Date;
  
  // Report content
  suspiciousActivity: SuspiciousActivity;
  involvedParties: ReportParty[];
  transactions: ReportTransaction[];
  narrative: string;
  
  // Metadata
  preparedBy: string;
  reviewedBy?: string;
  approvedBy?: string;
  filedBy?: string;
  
  // Compliance tracking
  regulatoryRequirements: string[];
  attachments: ReportAttachment[];
  followUpRequired: boolean;
  followUpDate?: Date;
}

export interface SuspiciousActivity {
  type: string;
  description: string;
  dateRange: { start: Date; end: Date };
  totalAmount: number;
  currency: string;
  suspicionReasons: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface ReportParty {
  id: string;
  type: 'subject' | 'beneficiary' | 'conductor' | 'witness';
  name: string;
  address?: string;
  identification: PartyIdentification;
  occupation?: string;
  relationship?: string;
  suspicionLevel: 'low' | 'medium' | 'high';
}

export interface PartyIdentification {
  type: 'SSN' | 'EIN' | 'ITIN' | 'Passport' | 'Driver_License' | 'Other';
  number: string;
  issuingAuthority?: string;
  expirationDate?: Date;
  verified: boolean;
}

export interface ReportTransaction {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  type: string;
  description: string;
  fromAccount?: string;
  toAccount?: string;
  method: string;
  location?: string;
  suspicious: boolean;
  suspicionReasons?: string[];
}

export interface ReportAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  hash: string;
  uploadDate: Date;
  description: string;
}

export interface RegulatoryFramework {
  id: string;
  name: string;
  jurisdiction: string;
  applicableTransactionTypes: string[];
  reportingThresholds: ReportingThreshold[];
  filingDeadlines: FilingDeadline[];
  penaltyStructure: PenaltyStructure[];
  lastUpdated: Date;
}

export interface ReportingThreshold {
  transactionType: string;
  amount: number;
  currency: string;
  timeframe: string;
  aggregationRules: string[];
}

export interface FilingDeadline {
  reportType: string;
  deadline: string; // e.g., "30 days from detection"
  expeditedDeadline?: string; // e.g., "immediately for critical cases"
  businessDaysOnly: boolean;
}

export interface PenaltyStructure {
  violationType: string;
  civilPenalty: { min: number; max: number };
  criminalPenalty?: string;
  additionalConsequences: string[];
}

export class ComplianceReportingService extends EventEmitter {
  private logger: Logger;
  private database: DatabaseService;
  private regulatoryFrameworks: Map<string, RegulatoryFramework> = new Map();
  private pendingReports: Map<string, SuspiciousActivityReport> = new Map();
  private complianceRules: ComplianceRule[] = [];

  constructor() {
    super();
    this.logger = new Logger('ComplianceReportingService');
    this.database = new DatabaseService();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Compliance Reporting Service...');
    
    await this.database.initialize();
    await this.loadRegulatoryFrameworks();
    await this.initializeComplianceRules();
    await this.loadPendingReports();
    
    // Start periodic compliance monitoring
    this.startPeriodicMonitoring();
    
    this.logger.info('Compliance Reporting Service initialized');
  }

  private async loadRegulatoryFrameworks(): Promise<void> {
    // Load regulatory frameworks for different jurisdictions
    const frameworks: RegulatoryFramework[] = [
      {
        id: 'us_bsa',
        name: 'Bank Secrecy Act (BSA)',
        jurisdiction: 'United States',
        applicableTransactionTypes: ['cash', 'wire_transfer', 'real_estate'],
        reportingThresholds: [
          {
            transactionType: 'cash',
            amount: 10000,
            currency: 'USD',
            timeframe: 'single_transaction',
            aggregationRules: ['same_day_aggregation', 'related_party_aggregation']
          },
          {
            transactionType: 'suspicious_activity',
            amount: 5000,
            currency: 'USD',
            timeframe: 'any',
            aggregationRules: ['pattern_based']
          }
        ],
        filingDeadlines: [
          {
            reportType: 'SAR',
            deadline: '30 calendar days',
            expeditedDeadline: 'immediately',
            businessDaysOnly: false
          },
          {
            reportType: 'CTR',
            deadline: '15 calendar days',
            businessDaysOnly: false
          }
        ],
        penaltyStructure: [
          {
            violationType: 'willful_failure_to_file',
            civilPenalty: { min: 25000, max: 100000 },
            criminalPenalty: 'Up to 5 years imprisonment',
            additionalConsequences: ['License revocation', 'Regulatory sanctions']
          }
        ],
        lastUpdated: new Date()
      },
      {
        id: 'us_respa',
        name: 'Real Estate Settlement Procedures Act (RESPA)',
        jurisdiction: 'United States',
        applicableTransactionTypes: ['real_estate_settlement', 'mortgage'],
        reportingThresholds: [
          {
            transactionType: 'kickback',
            amount: 0, // Any amount
            currency: 'USD',
            timeframe: 'any',
            aggregationRules: []
          }
        ],
        filingDeadlines: [
          {
            reportType: 'violation_report',
            deadline: '30 calendar days',
            businessDaysOnly: false
          }
        ],
        penaltyStructure: [
          {
            violationType: 'kickback_violation',
            civilPenalty: { min: 0, max: 10000 },
            additionalConsequences: ['Treble damages', 'Attorney fees']
          }
        ],
        lastUpdated: new Date()
      }
    ];

    frameworks.forEach(framework => {
      this.regulatoryFrameworks.set(framework.id, framework);
    });

    this.logger.info(`Loaded ${frameworks.length} regulatory frameworks`);
  }

  private async initializeComplianceRules(): void {
    this.complianceRules = [
      // AML Compliance Rules
      {
        id: 'aml_cash_threshold',
        name: 'AML Cash Transaction Threshold',
        regulation: 'us_bsa',
        condition: (transaction: any) => 
          transaction.paymentMethod === 'cash' && transaction.amount >= 10000,
        action: 'require_ctr_filing',
        severity: 'high'
      },
      {
        id: 'aml_suspicious_pattern',
        name: 'AML Suspicious Pattern Detection',
        regulation: 'us_bsa',
        condition: (transaction: any) => 
          transaction.suspiciousPatterns && transaction.suspiciousPatterns.length > 0,
        action: 'require_sar_filing',
        severity: 'high'
      },
      
      // RESPA Compliance Rules
      {
        id: 'respa_kickback_detection',
        name: 'RESPA Kickback Detection',
        regulation: 'us_respa',
        condition: (transaction: any) => 
          transaction.undisclosedReferralFees || transaction.yieldSpreadPremium,
        action: 'require_violation_report',
        severity: 'medium'
      },
      {
        id: 'respa_dual_representation',
        name: 'RESPA Dual Representation Disclosure',
        regulation: 'us_respa',
        condition: (transaction: any) => 
          transaction.agent?.dualRepresentation && !transaction.agent.disclosed,
        action: 'require_disclosure_review',
        severity: 'medium'
      },
      
      // Fair Housing Compliance Rules
      {
        id: 'fair_housing_discrimination',
        name: 'Fair Housing Discrimination Detection',
        regulation: 'us_fair_housing',
        condition: (transaction: any) => 
          transaction.discriminatoryPractices && transaction.discriminatoryPractices.length > 0,
        action: 'require_investigation',
        severity: 'critical'
      }
    ];

    this.logger.info(`Initialized ${this.complianceRules.length} compliance rules`);
  }

  private async loadPendingReports(): Promise<void> {
    const reports = await this.database.getPendingComplianceReports();
    reports.forEach(report => {
      this.pendingReports.set(report.id, report);
    });
    
    this.logger.info(`Loaded ${reports.length} pending compliance reports`);
  }

  async checkAMLCompliance(transactionData: any): Promise<ComplianceCheck> {
    this.logger.info(`Checking AML compliance for transaction: ${transactionData.id}`);
    
    const violations: ComplianceViolation[] = [];
    const riskFactors: RiskFactor[] = [];
    const recommendations: string[] = [];

    // Check cash transaction thresholds
    if (transactionData.paymentMethod === 'cash' && transactionData.amount >= 10000) {
      if (!transactionData.ctrFiled) {
        violations.push({
          id: `AML-CTR-${Date.now()}`,
          type: 'missing_ctr',
          severity: 'high',
          description: 'Cash transaction over $10,000 requires CTR filing',
          regulation: 'BSA Section 103.22',
          section: '103.22(a)',
          evidence: [`cash_amount_${transactionData.amount}`],
          potentialPenalty: 'Up to $100,000 civil penalty',
          remediation: ['File CTR within 15 days', 'Implement cash monitoring procedures']
        });
      }
    }

    // Check for suspicious activity patterns
    if (transactionData.suspiciousPatterns) {
      for (const pattern of transactionData.suspiciousPatterns) {
        if (pattern.riskScore > 0.7) {
          violations.push({
            id: `AML-SAR-${Date.now()}`,
            type: 'suspicious_activity',
            severity: 'high',
            description: `Suspicious activity pattern detected: ${pattern.type}`,
            regulation: 'BSA Section 103.18',
            section: '103.18(a)',
            evidence: [`pattern_${pattern.type}`, `risk_score_${pattern.riskScore}`],
            potentialPenalty: 'Up to $100,000 civil penalty',
            remediation: ['File SAR within 30 days', 'Enhanced monitoring']
          });

          riskFactors.push({
            category: 'Suspicious Activity',
            description: pattern.description,
            weight: pattern.riskScore,
            evidence: [`pattern_${pattern.type}`]
          });
        }
      }
    }

    // Check source of funds verification
    if (transactionData.amount > 50000 && !transactionData.sourceVerified) {
      riskFactors.push({
        category: 'Source Verification',
        description: 'Large transaction without verified source of funds',
        weight: 0.6,
        evidence: [`unverified_source_${transactionData.amount}`]
      });

      recommendations.push('Verify source of funds for large transactions');
    }

    // Check for structuring patterns
    if (transactionData.structuringIndicators) {
      violations.push({
        id: `AML-STRUCT-${Date.now()}`,
        type: 'structuring',
        severity: 'critical',
        description: 'Transaction structuring to avoid reporting requirements',
        regulation: 'BSA Section 103.11',
        section: '103.11(gg)',
        evidence: transactionData.structuringIndicators,
        potentialPenalty: 'Up to $500,000 civil penalty and criminal charges',
        remediation: ['File SAR immediately', 'Report to law enforcement']
      });
    }

    const compliant = violations.length === 0;
    
    if (!compliant) {
      recommendations.push('Immediate compliance review required');
      recommendations.push('Consider legal consultation');
    }

    return {
      regulation: 'AML/BSA',
      compliant,
      violations,
      riskFactors,
      recommendations,
      lastChecked: new Date(),
      nextReview: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  async checkRESPACompliance(transactionData: any): Promise<ComplianceCheck> {
    this.logger.info(`Checking RESPA compliance for transaction: ${transactionData.id}`);
    
    const violations: ComplianceViolation[] = [];
    const riskFactors: RiskFactor[] = [];
    const recommendations: string[] = [];

    // Check for undisclosed referral fees
    if (transactionData.referralFees && !transactionData.referralFeesDisclosed) {
      violations.push({
        id: `RESPA-REF-${Date.now()}`,
        type: 'undisclosed_referral_fee',
        severity: 'medium',
        description: 'Referral fees not properly disclosed to consumer',
        regulation: 'RESPA Section 8',
        section: '8(a)',
        evidence: [`referral_fee_${transactionData.referralFees.amount}`],
        potentialPenalty: 'Up to $10,000 civil penalty plus treble damages',
        remediation: ['Provide proper disclosure', 'Refund undisclosed fees']
      });
    }

    // Check for kickback arrangements
    if (transactionData.kickbackIndicators) {
      violations.push({
        id: `RESPA-KICK-${Date.now()}`,
        type: 'kickback_arrangement',
        severity: 'high',
        description: 'Potential kickback arrangement detected',
        regulation: 'RESPA Section 8',
        section: '8(a)',
        evidence: transactionData.kickbackIndicators,
        potentialPenalty: 'Up to $10,000 civil penalty plus treble damages',
        remediation: ['Cease kickback arrangements', 'Provide consumer remediation']
      });
    }

    // Check yield spread premium disclosure
    if (transactionData.yieldSpreadPremium && !transactionData.yspDisclosed) {
      violations.push({
        id: `RESPA-YSP-${Date.now()}`,
        type: 'undisclosed_ysp',
        severity: 'medium',
        description: 'Yield spread premium not properly disclosed',
        regulation: 'RESPA Section 8',
        section: '8(b)',
        evidence: [`ysp_amount_${transactionData.yieldSpreadPremium}`],
        potentialPenalty: 'Civil penalties and consumer remediation',
        remediation: ['Provide YSP disclosure', 'Consumer education']
      });
    }

    // Check for affiliated business arrangements
    if (transactionData.affiliatedBusinessArrangement && !transactionData.abaDisclosure) {
      riskFactors.push({
        category: 'Affiliated Business',
        description: 'Affiliated business arrangement without proper disclosure',
        weight: 0.5,
        evidence: ['missing_aba_disclosure']
      });

      recommendations.push('Ensure proper ABA disclosure is provided');
    }

    const compliant = violations.length === 0;
    
    if (!compliant) {
      recommendations.push('RESPA compliance review required');
      recommendations.push('Consumer notification may be required');
    }

    return {
      regulation: 'RESPA',
      compliant,
      violations,
      riskFactors,
      recommendations,
      lastChecked: new Date(),
      nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
    };
  }

  async generateSuspiciousActivityReport(alert: any): Promise<SuspiciousActivityReport> {
    this.logger.info(`Generating SAR for alert: ${alert.id}`);
    
    const reportNumber = await this.generateSARNumber();
    const filingDeadline = this.calculateFilingDeadline('SAR', alert.severity);
    
    const sar: SuspiciousActivityReport = {
      id: `SAR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      reportNumber,
      type: 'SAR',
      status: 'draft',
      filingDeadline,
      
      suspiciousActivity: {
        type: alert.category,
        description: alert.description || 'Suspicious activity detected by automated fraud detection system',
        dateRange: {
          start: alert.timeframe?.incidentStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: alert.timeframe?.incidentEnd || new Date()
        },
        totalAmount: alert.estimatedLoss || 0,
        currency: 'USD',
        suspicionReasons: this.extractSuspicionReasons(alert),
        riskLevel: this.mapAlertSeverityToRiskLevel(alert.severity)
      },
      
      involvedParties: this.extractReportParties(alert),
      transactions: this.extractReportTransactions(alert),
      narrative: this.generateSARNarrative(alert),
      
      preparedBy: 'fraud_detection_system',
      
      regulatoryRequirements: ['BSA Section 103.18', 'FinCEN SAR Requirements'],
      attachments: [],
      followUpRequired: alert.severity === 'critical',
      followUpDate: alert.severity === 'critical' ? 
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined
    };

    // Save to database
    await this.database.saveSuspiciousActivityReport(sar);
    this.pendingReports.set(sar.id, sar);
    
    // Emit event
    this.emit('sar_generated', { sarId: sar.id, alertId: alert.id });
    
    this.logger.info(`SAR generated: ${sar.reportNumber}`);
    return sar;
  }

  private extractSuspicionReasons(alert: any): string[] {
    const reasons: string[] = [];
    
    if (alert.evidence) {
      alert.evidence.forEach((evidence: any) => {
        reasons.push(evidence.description);
      });
    }
    
    if (alert.riskFactors) {
      alert.riskFactors.forEach((factor: any) => {
        reasons.push(factor.description);
      });
    }
    
    // Add category-specific reasons
    const categoryReasons: Record<string, string[]> = {
      'cash_money_laundering': [
        'Large cash transaction without clear business purpose',
        'Source of funds could not be verified',
        'Transaction patterns consistent with money laundering'
      ],
      'mortgage_fraud_income_misrepresentation': [
        'Income documentation appears falsified',
        'Employment verification failed',
        'Debt-to-income ratio exceeds lending standards'
      ],
      'synthetic_identity_creation': [
        'Identity verification failed multiple checks',
        'Credit history inconsistent with claimed identity',
        'Biometric verification anomalies detected'
      ]
    };
    
    if (categoryReasons[alert.category]) {
      reasons.push(...categoryReasons[alert.category]);
    }
    
    return reasons;
  }

  private mapAlertSeverityToRiskLevel(severity: string): SuspiciousActivity['riskLevel'] {
    const severityMap: Record<string, SuspiciousActivity['riskLevel']> = {
      'critical': 'critical',
      'high': 'high',
      'medium': 'medium',
      'low': 'low'
    };
    
    return severityMap[severity] || 'medium';
  }

  private extractReportParties(alert: any): ReportParty[] {
    const parties: ReportParty[] = [];
    
    if (alert.participants) {
      alert.participants.forEach((participant: any, index: number) => {
        parties.push({
          id: participant.id,
          type: index === 0 ? 'subject' : 'conductor', // First participant is usually the subject
          name: participant.name,
          address: participant.address,
          identification: {
            type: 'SSN', // Default, would be determined from actual data
            number: participant.identificationNumber || 'Unknown',
            verified: participant.verificationStatus === 'verified'
          },
          occupation: participant.occupation,
          suspicionLevel: this.mapRiskScoreToSuspicionLevel(participant.riskScore)
        });
      });
    }
    
    return parties;
  }

  private mapRiskScoreToSuspicionLevel(riskScore: number): ReportParty['suspicionLevel'] {
    if (riskScore >= 80) return 'high';
    if (riskScore >= 60) return 'medium';
    return 'low';
  }

  private extractReportTransactions(alert: any): ReportTransaction[] {
    const transactions: ReportTransaction[] = [];
    
    if (alert.transactionId) {
      // Would fetch actual transaction details from database
      transactions.push({
        id: alert.transactionId,
        date: new Date(),
        amount: alert.estimatedLoss || 0,
        currency: 'USD',
        type: 'real_estate_transaction',
        description: 'Real estate transaction flagged by fraud detection system',
        method: 'unknown',
        suspicious: true,
        suspicionReasons: this.extractSuspicionReasons(alert)
      });
    }
    
    return transactions;
  }

  private generateSARNarrative(alert: any): string {
    let narrative = `On ${new Date().toLocaleDateString()}, our automated fraud detection system identified suspicious activity `;
    narrative += `related to ${alert.category.replace(/_/g, ' ')}. `;
    
    if (alert.confidence) {
      narrative += `The system assigned a confidence level of ${alert.confidence}% to this detection. `;
    }
    
    if (alert.description) {
      narrative += `${alert.description} `;
    }
    
    if (alert.evidence && alert.evidence.length > 0) {
      narrative += `Evidence supporting this determination includes: `;
      alert.evidence.forEach((evidence: any, index: number) => {
        narrative += `${index + 1}) ${evidence.description}; `;
      });
    }
    
    if (alert.estimatedLoss) {
      narrative += `The estimated financial impact is $${alert.estimatedLoss.toLocaleString()}. `;
    }
    
    narrative += `This matter has been referred for investigation and appropriate regulatory reporting. `;
    narrative += `Additional information will be provided as the investigation progresses.`;
    
    return narrative;
  }

  private calculateFilingDeadline(reportType: string, severity: string): Date {
    const now = new Date();
    
    // Expedited filing for critical cases
    if (severity === 'critical') {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
    }
    
    // Standard deadlines
    const deadlineMap: Record<string, number> = {
      'SAR': 30, // 30 days
      'CTR': 15, // 15 days
      'FBAR': 30, // 30 days
      'Form_8300': 15 // 15 days
    };
    
    const days = deadlineMap[reportType] || 30;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private async generateSARNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const sequence = await this.database.getNextSARSequence();
    return `${year}${sequence.toString().padStart(8, '0')}`;
  }

  async reviewAndFileReport(reportId: string, reviewedBy: string, approved: boolean): Promise<void> {
    const report = this.pendingReports.get(reportId);
    if (!report) {
      throw new Error(`Report ${reportId} not found`);
    }

    report.reviewedBy = reviewedBy;
    
    if (approved) {
      report.status = 'filed';
      report.filedDate = new Date();
      report.filedBy = reviewedBy;
      
      // Submit to regulatory agency (placeholder)
      await this.submitToRegulatoryAgency(report);
      
      this.emit('report_filed', { reportId, reportNumber: report.reportNumber });
      this.logger.info(`Report filed: ${report.reportNumber}`);
    } else {
      report.status = 'draft';
      this.logger.info(`Report returned for revision: ${report.reportNumber}`);
    }
    
    await this.database.updateSuspiciousActivityReport(report);
  }

  private async submitToRegulatoryAgency(report: SuspiciousActivityReport): Promise<void> {
    // Placeholder for actual regulatory submission
    // In production, this would integrate with FinCEN BSA E-Filing System
    this.logger.info(`Submitting ${report.type} ${report.reportNumber} to regulatory agency`);
    
    // Simulate submission delay
    setTimeout(() => {
      report.acknowledgmentDate = new Date();
      report.status = 'acknowledged';
      this.emit('report_acknowledged', { reportId: report.id });
    }, 5000);
  }

  private startPeriodicMonitoring(): void {
    // Check for overdue reports every hour
    setInterval(() => {
      this.checkOverdueReports();
    }, 60 * 60 * 1000);
    
    // Generate compliance metrics daily
    setInterval(() => {
      this.generateComplianceMetrics();
    }, 24 * 60 * 60 * 1000);
  }

  private async checkOverdueReports(): Promise<void> {
    const now = new Date();
    
    for (const [reportId, report] of this.pendingReports.entries()) {
      if (report.filingDeadline < now && report.status !== 'filed') {
        this.logger.warn(`Report ${report.reportNumber} is overdue`);
        this.emit('report_overdue', { reportId, report });
        
        // Auto-escalate overdue critical reports
        if (report.suspiciousActivity.riskLevel === 'critical') {
          await this.escalateOverdueReport(report);
        }
      }
    }
  }

  private async escalateOverdueReport(report: SuspiciousActivityReport): Promise<void> {
    this.logger.warn(`Escalating overdue critical report: ${report.reportNumber}`);
    
    // Notify compliance officers
    this.emit('critical_report_overdue', { 
      reportId: report.id, 
      reportNumber: report.reportNumber,
      daysOverdue: Math.floor((Date.now() - report.filingDeadline.getTime()) / (24 * 60 * 60 * 1000))
    });
  }

  private async generateComplianceMetrics(): Promise<void> {
    try {
      const metrics = {
        totalReports: this.pendingReports.size,
        reportsByStatus: this.groupReportsByStatus(),
        reportsByType: this.groupReportsByType(),
        overdueReports: this.getOverdueReports().length,
        averageFilingTime: await this.calculateAverageFilingTime(),
        complianceRate: await this.calculateComplianceRate()
      };
      
      this.emit('compliance_metrics', metrics);
      this.logger.info('Compliance metrics generated');
    } catch (error) {
      this.logger.error('Failed to generate compliance metrics', error);
    }
  }

  private groupReportsByStatus(): Record<string, number> {
    const statusCounts: Record<string, number> = {};
    
    for (const report of this.pendingReports.values()) {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    }
    
    return statusCounts;
  }

  private groupReportsByType(): Record<string, number> {
    const typeCounts: Record<string, number> = {};
    
    for (const report of this.pendingReports.values()) {
      typeCounts[report.type] = (typeCounts[report.type] || 0) + 1;
    }
    
    return typeCounts;
  }

  private getOverdueReports(): SuspiciousActivityReport[] {
    const now = new Date();
    return Array.from(this.pendingReports.values()).filter(
      report => report.filingDeadline < now && report.status !== 'filed'
    );
  }

  private async calculateAverageFilingTime(): Promise<number> {
    const filedReports = await this.database.getRecentlyFiledReports(30); // Last 30 days
    
    if (filedReports.length === 0) return 0;
    
    const totalTime = filedReports.reduce((sum, report) => {
      if (report.filedDate) {
        const filingTime = report.filedDate.getTime() - report.filingDeadline.getTime();
        return sum + filingTime;
      }
      return sum;
    }, 0);
    
    return totalTime / filedReports.length / (24 * 60 * 60 * 1000); // Convert to days
  }

  private async calculateComplianceRate(): Promise<number> {
    const totalReports = await this.database.getTotalReportsCount(30); // Last 30 days
    const timelyReports = await this.database.getTimelyFiledReportsCount(30);
    
    return totalReports > 0 ? (timelyReports / totalReports) * 100 : 100;
  }

  async getComplianceStatus(): Promise<any> {
    return {
      pendingReports: this.pendingReports.size,
      overdueReports: this.getOverdueReports().length,
      regulatoryFrameworks: this.regulatoryFrameworks.size,
      complianceRules: this.complianceRules.length,
      lastCheck: new Date()
    };
  }

  async getStatus(): Promise<any> {
    return await this.getComplianceStatus();
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Compliance Reporting Service...');
    
    this.regulatoryFrameworks.clear();
    this.pendingReports.clear();
    this.complianceRules = [];
    
    await this.database.shutdown();
    
    this.logger.info('Compliance Reporting Service shutdown complete');
  }
}

interface ComplianceRule {
  id: string;
  name: string;
  regulation: string;
  condition: (transaction: any) => boolean;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}