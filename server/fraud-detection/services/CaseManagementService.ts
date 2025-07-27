import { Logger } from '../utils/Logger';
import { DatabaseService } from './DatabaseService';
import { EventEmitter } from 'events';

export interface InvestigationCase {
  id: string;
  alertId: string;
  caseNumber: string;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'pending_review' | 'escalated' | 'closed';
  category: FraudCategory;
  subcategories: FraudCategory[];
  
  // Case details
  estimatedLoss: number;
  actualLoss?: number;
  propertiesInvolved: string[];
  participantsInvolved: CaseParticipant[];
  jurisdictions: string[];
  
  // Timeline
  createdAt: Date;
  assignedAt?: Date;
  dueDate: Date;
  closedAt?: Date;
  lastActivity: Date;
  
  // Assignment
  assignedTo: string;
  assignedBy: string;
  investigationTeam: TeamMember[];
  
  // Evidence and documentation
  evidence: CaseEvidence[];
  documents: CaseDocument[];
  notes: CaseNote[];
  activities: CaseActivity[];
  
  // Relationships
  relatedCases: string[];
  parentCase?: string;
  childCases: string[];
  
  // Compliance and reporting
  regulatoryReports: RegulatoryReport[];
  lawEnforcementNotifications: LENotification[];
  
  // Metrics
  investigationHours: number;
  complexity: number;
  publicityRisk: 'low' | 'medium' | 'high';
  
  metadata: Record<string, any>;
}

export interface CaseParticipant {
  id: string;
  name: string;
  type: 'suspect' | 'victim' | 'witness' | 'professional' | 'entity';
  role: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'cleared' | 'charged' | 'convicted';
  contactInfo?: ContactInfo;
  background: ParticipantBackground;
  involvement: string;
  cooperationLevel: 'cooperative' | 'uncooperative' | 'hostile' | 'unknown';
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  address?: string;
  attorney?: string;
}

export interface ParticipantBackground {
  priorIncidents: number;
  professionalLicenses: string[];
  criminalHistory: boolean;
  civilLitigationHistory: boolean;
  creditIssues: boolean;
  associatedEntities: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'lead_investigator' | 'analyst' | 'legal_counsel' | 'compliance_officer' | 'technical_specialist';
  department: string;
  assignedDate: Date;
  hoursAllocated: number;
  hoursSpent: number;
}

export interface CaseEvidence {
  id: string;
  type: 'document' | 'financial' | 'digital' | 'witness_statement' | 'expert_analysis' | 'surveillance';
  description: string;
  source: string;
  collectedBy: string;
  collectedDate: Date;
  chainOfCustody: CustodyRecord[];
  admissible: boolean;
  confidentialityLevel: 'public' | 'internal' | 'restricted' | 'classified';
  hash: string;
  metadata: Record<string, any>;
}

export interface CustodyRecord {
  transferredBy: string;
  transferredTo: string;
  transferDate: Date;
  purpose: string;
  location: string;
  condition: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedDate: Date;
  version: number;
  tags: string[];
  accessLevel: 'public' | 'internal' | 'restricted';
  hash: string;
  path: string;
}

export interface CaseNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'general' | 'interview' | 'analysis' | 'legal' | 'strategy';
  createdAt: Date;
  updatedAt: Date;
  confidential: boolean;
  tags: string[];
}

export interface CaseActivity {
  id: string;
  type: 'created' | 'assigned' | 'status_change' | 'evidence_added' | 'note_added' | 'escalated' | 'closed';
  description: string;
  performedBy: string;
  performedAt: Date;
  details: Record<string, any>;
}

export interface RegulatoryReport {
  id: string;
  type: 'SAR' | 'CTR' | 'FBAR' | 'Form_8300' | 'State_Report';
  agency: string;
  filedBy: string;
  filedDate: Date;
  reportNumber: string;
  status: 'draft' | 'filed' | 'acknowledged' | 'under_review';
  dueDate: Date;
  content: Record<string, any>;
}

export interface LENotification {
  id: string;
  agency: string;
  contactPerson: string;
  notifiedBy: string;
  notifiedDate: Date;
  method: 'email' | 'phone' | 'secure_portal' | 'in_person';
  urgency: 'routine' | 'priority' | 'urgent';
  response?: string;
  responseDate?: Date;
}

export type FraudCategory = string; // Reuse from main engine

export class CaseManagementService extends EventEmitter {
  private logger: Logger;
  private database: DatabaseService;
  private activeCases: Map<string, InvestigationCase> = new Map();
  private caseQueue: InvestigationCase[] = [];
  private assignmentRules: AssignmentRule[] = [];

  constructor() {
    super();
    this.logger = new Logger('CaseManagementService');
    this.database = new DatabaseService();
    this.initializeAssignmentRules();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Case Management Service...');
    
    await this.database.initialize();
    await this.loadActiveCases();
    
    // Start periodic tasks
    this.startPeriodicTasks();
    
    this.logger.info('Case Management Service initialized');
  }

  private async loadActiveCases(): Promise<void> {
    const cases = await this.database.getActiveCases();
    cases.forEach(caseData => {
      this.activeCases.set(caseData.id, caseData);
    });
    
    this.logger.info(`Loaded ${cases.length} active cases`);
  }

  async createInvestigationCase(params: {
    alertId: string;
    priority: InvestigationCase['priority'];
    assignedTo?: string;
    dueDate?: Date;
  }): Promise<InvestigationCase> {
    
    this.logger.info(`Creating investigation case for alert: ${params.alertId}`);
    
    try {
      // Get alert details
      const alert = await this.database.getAlert(params.alertId);
      if (!alert) {
        throw new Error(`Alert ${params.alertId} not found`);
      }

      // Generate case number
      const caseNumber = await this.generateCaseNumber();
      
      // Determine assignment
      const assignedTo = params.assignedTo || await this.autoAssignCase(alert, params.priority);
      
      // Calculate due date
      const dueDate = params.dueDate || this.calculateDueDate(params.priority);
      
      const investigationCase: InvestigationCase = {
        id: `CASE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        alertId: params.alertId,
        caseNumber,
        title: this.generateCaseTitle(alert),
        description: this.generateCaseDescription(alert),
        priority: params.priority,
        status: 'open',
        category: alert.category,
        subcategories: alert.subcategories || [],
        
        estimatedLoss: alert.estimatedLoss || 0,
        propertiesInvolved: alert.propertyId ? [alert.propertyId] : [],
        participantsInvolved: this.extractParticipants(alert),
        jurisdictions: alert.jurisdiction || [],
        
        createdAt: new Date(),
        assignedAt: new Date(),
        dueDate,
        lastActivity: new Date(),
        
        assignedTo,
        assignedBy: 'system',
        investigationTeam: await this.assembleInvestigationTeam(alert, params.priority),
        
        evidence: this.convertAlertEvidence(alert.evidence || []),
        documents: [],
        notes: [],
        activities: [{
          id: `ACT-${Date.now()}`,
          type: 'created',
          description: 'Investigation case created from fraud alert',
          performedBy: 'system',
          performedAt: new Date(),
          details: { alertId: params.alertId, priority: params.priority }
        }],
        
        relatedCases: await this.findRelatedCases(alert),
        childCases: [],
        
        regulatoryReports: [],
        lawEnforcementNotifications: [],
        
        investigationHours: 0,
        complexity: this.calculateComplexity(alert),
        publicityRisk: this.assessPublicityRisk(alert),
        
        metadata: {
          createdFrom: 'fraud_alert',
          mlModelVersions: alert.mlModelVersions || {},
          originalConfidence: alert.confidence
        }
      };

      // Save to database
      await this.database.saveInvestigationCase(investigationCase);
      
      // Add to active cases
      this.activeCases.set(investigationCase.id, investigationCase);
      
      // Emit event
      this.emit('case_created', investigationCase);
      
      // Auto-generate regulatory reports if required
      if (this.requiresImmediateReporting(investigationCase)) {
        await this.initiateRegulatoryReporting(investigationCase);
      }
      
      this.logger.info(`Investigation case created: ${investigationCase.caseNumber}`);
      return investigationCase;
      
    } catch (error) {
      this.logger.error('Failed to create investigation case', error);
      throw error;
    }
  }

  async updateCaseStatus(caseId: string, newStatus: InvestigationCase['status'], updatedBy: string, notes?: string): Promise<void> {
    const investigationCase = this.activeCases.get(caseId);
    if (!investigationCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    const oldStatus = investigationCase.status;
    investigationCase.status = newStatus;
    investigationCase.lastActivity = new Date();

    // Add activity record
    investigationCase.activities.push({
      id: `ACT-${Date.now()}`,
      type: 'status_change',
      description: `Status changed from ${oldStatus} to ${newStatus}`,
      performedBy: updatedBy,
      performedAt: new Date(),
      details: { oldStatus, newStatus, notes }
    });

    // Handle status-specific actions
    switch (newStatus) {
      case 'investigating':
        investigationCase.assignedAt = new Date();
        break;
      case 'escalated':
        await this.handleCaseEscalation(investigationCase, updatedBy);
        break;
      case 'closed':
        investigationCase.closedAt = new Date();
        this.activeCases.delete(caseId);
        break;
    }

    // Save to database
    await this.database.updateInvestigationCase(investigationCase);
    
    // Emit event
    this.emit('case_status_changed', { caseId, oldStatus, newStatus, updatedBy });
    
    this.logger.info(`Case ${investigationCase.caseNumber} status changed to ${newStatus}`);
  }

  async addEvidence(caseId: string, evidence: Omit<CaseEvidence, 'id'>, addedBy: string): Promise<void> {
    const investigationCase = this.activeCases.get(caseId);
    if (!investigationCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    const caseEvidence: CaseEvidence = {
      id: `EVD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...evidence,
      chainOfCustody: [{
        transferredBy: 'system',
        transferredTo: addedBy,
        transferDate: new Date(),
        purpose: 'evidence_collection',
        location: 'digital_repository',
        condition: 'original'
      }]
    };

    investigationCase.evidence.push(caseEvidence);
    investigationCase.lastActivity = new Date();

    // Add activity record
    investigationCase.activities.push({
      id: `ACT-${Date.now()}`,
      type: 'evidence_added',
      description: `Evidence added: ${evidence.type} - ${evidence.description}`,
      performedBy: addedBy,
      performedAt: new Date(),
      details: { evidenceId: caseEvidence.id, evidenceType: evidence.type }
    });

    await this.database.updateInvestigationCase(investigationCase);
    this.emit('evidence_added', { caseId, evidenceId: caseEvidence.id, addedBy });
    
    this.logger.info(`Evidence added to case ${investigationCase.caseNumber}`);
  }

  async addNote(caseId: string, note: Omit<CaseNote, 'id' | 'createdAt' | 'updatedAt'>, authorId: string): Promise<void> {
    const investigationCase = this.activeCases.get(caseId);
    if (!investigationCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    const caseNote: CaseNote = {
      id: `NOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...note,
      authorId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    investigationCase.notes.push(caseNote);
    investigationCase.lastActivity = new Date();

    // Add activity record
    investigationCase.activities.push({
      id: `ACT-${Date.now()}`,
      type: 'note_added',
      description: `Note added: ${note.type}`,
      performedBy: authorId,
      performedAt: new Date(),
      details: { noteId: caseNote.id, noteType: note.type }
    });

    await this.database.updateInvestigationCase(investigationCase);
    this.emit('note_added', { caseId, noteId: caseNote.id, authorId });
  }

  async assignCase(caseId: string, assignedTo: string, assignedBy: string): Promise<void> {
    const investigationCase = this.activeCases.get(caseId);
    if (!investigationCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    const oldAssignee = investigationCase.assignedTo;
    investigationCase.assignedTo = assignedTo;
    investigationCase.assignedBy = assignedBy;
    investigationCase.assignedAt = new Date();
    investigationCase.lastActivity = new Date();

    // Add activity record
    investigationCase.activities.push({
      id: `ACT-${Date.now()}`,
      type: 'assigned',
      description: `Case reassigned from ${oldAssignee} to ${assignedTo}`,
      performedBy: assignedBy,
      performedAt: new Date(),
      details: { oldAssignee, newAssignee: assignedTo }
    });

    await this.database.updateInvestigationCase(investigationCase);
    this.emit('case_assigned', { caseId, assignedTo, assignedBy, oldAssignee });
    
    this.logger.info(`Case ${investigationCase.caseNumber} assigned to ${assignedTo}`);
  }

  async escalateCase(caseId: string, escalatedBy: string, reason: string): Promise<void> {
    const investigationCase = this.activeCases.get(caseId);
    if (!investigationCase) {
      throw new Error(`Case ${caseId} not found`);
    }

    // Update priority if not already critical
    if (investigationCase.priority !== 'critical') {
      investigationCase.priority = 'high';
    }

    await this.updateCaseStatus(caseId, 'escalated', escalatedBy, reason);
    await this.handleCaseEscalation(investigationCase, escalatedBy);
    
    this.logger.info(`Case ${investigationCase.caseNumber} escalated by ${escalatedBy}`);
  }

  private async handleCaseEscalation(investigationCase: InvestigationCase, escalatedBy: string): Promise<void> {
    // Notify senior investigators
    await this.notifySeniorInvestigators(investigationCase, escalatedBy);
    
    // Generate law enforcement notification if threshold met
    if (investigationCase.estimatedLoss > 1000000) {
      await this.generateLawEnforcementNotification(investigationCase, escalatedBy);
    }
    
    // Expedite regulatory reporting
    if (this.requiresExpeditedReporting(investigationCase)) {
      await this.expediteRegulatoryReporting(investigationCase);
    }
  }

  private async generateCaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const sequence = await this.database.getNextCaseSequence(year);
    return `FC-${year}-${sequence.toString().padStart(6, '0')}`;
  }

  private generateCaseTitle(alert: any): string {
    const categoryMap: Record<string, string> = {
      'property_flipping_artificial_inflation': 'Property Flipping Fraud Investigation',
      'mortgage_fraud_income_misrepresentation': 'Mortgage Fraud Investigation',
      'cash_money_laundering': 'Money Laundering Investigation',
      'synthetic_identity_creation': 'Synthetic Identity Fraud Investigation',
      'professional_fraud': 'Professional Services Fraud Investigation'
    };
    
    return categoryMap[alert.category] || 'Real Estate Fraud Investigation';
  }

  private generateCaseDescription(alert: any): string {
    return `Investigation initiated based on fraud detection alert ${alert.id}. ` +
           `Confidence level: ${alert.confidence}%. ` +
           `Estimated loss: $${alert.estimatedLoss?.toLocaleString() || 'Unknown'}.`;
  }

  private async autoAssignCase(alert: any, priority: InvestigationCase['priority']): Promise<string> {
    // Find available investigator based on workload and expertise
    const investigators = await this.database.getAvailableInvestigators();
    
    // Apply assignment rules
    for (const rule of this.assignmentRules) {
      if (rule.matches(alert, priority)) {
        const assignee = rule.assign(investigators);
        if (assignee) return assignee;
      }
    }
    
    // Default assignment - least loaded investigator
    const leastLoaded = investigators.reduce((min, inv) => 
      inv.activeCases < min.activeCases ? inv : min
    );
    
    return leastLoaded.id;
  }

  private calculateDueDate(priority: InvestigationCase['priority']): Date {
    const now = new Date();
    const dueDateMap = {
      'critical': 1, // 1 day
      'high': 3,     // 3 days
      'medium': 7,   // 1 week
      'low': 14      // 2 weeks
    };
    
    const days = dueDateMap[priority];
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private async assembleInvestigationTeam(alert: any, priority: InvestigationCase['priority']): Promise<TeamMember[]> {
    const team: TeamMember[] = [];
    
    // Always include lead investigator (assigned person)
    // Additional team members based on case complexity and priority
    
    if (priority === 'critical' || alert.estimatedLoss > 5000000) {
      // Add legal counsel for high-value cases
      const legalCounsel = await this.database.getAvailableLegalCounsel();
      if (legalCounsel) {
        team.push({
          id: legalCounsel.id,
          name: legalCounsel.name,
          role: 'legal_counsel',
          department: 'Legal',
          assignedDate: new Date(),
          hoursAllocated: 20,
          hoursSpent: 0
        });
      }
    }
    
    // Add compliance officer for regulatory violations
    if (alert.category.includes('aml_violations') || alert.category.includes('respa_violations')) {
      const complianceOfficer = await this.database.getAvailableComplianceOfficer();
      if (complianceOfficer) {
        team.push({
          id: complianceOfficer.id,
          name: complianceOfficer.name,
          role: 'compliance_officer',
          department: 'Compliance',
          assignedDate: new Date(),
          hoursAllocated: 15,
          hoursSpent: 0
        });
      }
    }
    
    return team;
  }

  private extractParticipants(alert: any): CaseParticipant[] {
    const participants: CaseParticipant[] = [];
    
    if (alert.participants) {
      alert.participants.forEach((participant: any) => {
        participants.push({
          id: participant.id,
          name: participant.name,
          type: this.mapParticipantType(participant.type),
          role: participant.role || 'unknown',
          riskLevel: this.mapRiskLevel(participant.riskScore),
          status: 'active',
          background: {
            priorIncidents: participant.previousIncidents || 0,
            professionalLicenses: participant.professionalLicenses?.map((l: any) => l.number) || [],
            criminalHistory: false,
            civilLitigationHistory: false,
            creditIssues: false,
            associatedEntities: []
          },
          involvement: 'Under investigation',
          cooperationLevel: 'unknown'
        });
      });
    }
    
    return participants;
  }

  private mapParticipantType(type: string): CaseParticipant['type'] {
    const typeMap: Record<string, CaseParticipant['type']> = {
      'individual': 'suspect',
      'entity': 'entity',
      'professional': 'professional'
    };
    
    return typeMap[type] || 'suspect';
  }

  private mapRiskLevel(riskScore: number): CaseParticipant['riskLevel'] {
    if (riskScore >= 90) return 'critical';
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  private convertAlertEvidence(alertEvidence: any[]): CaseEvidence[] {
    return alertEvidence.map(evidence => ({
      id: `EVD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: evidence.type,
      description: evidence.description,
      source: 'fraud_detection_system',
      collectedBy: 'system',
      collectedDate: new Date(),
      chainOfCustody: [],
      admissible: true,
      confidentialityLevel: 'internal',
      hash: evidence.hash || '',
      metadata: evidence.metadata || {}
    }));
  }

  private async findRelatedCases(alert: any): Promise<string[]> {
    // Find cases involving same participants, properties, or patterns
    const relatedCases = await this.database.findRelatedCases({
      propertyId: alert.propertyId,
      participants: alert.participants?.map((p: any) => p.id) || [],
      category: alert.category
    });
    
    return relatedCases.map(c => c.id);
  }

  private calculateComplexity(alert: any): number {
    let complexity = 0;
    
    // Base complexity from category
    const categoryComplexity: Record<string, number> = {
      'cash_money_laundering': 8,
      'investment_ponzi_schemes': 9,
      'coordinated_bid_rigging': 7,
      'synthetic_identity_creation': 6,
      'property_flipping_artificial_inflation': 4
    };
    
    complexity += categoryComplexity[alert.category] || 3;
    
    // Add complexity for multiple jurisdictions
    if (alert.jurisdiction && alert.jurisdiction.length > 1) {
      complexity += alert.jurisdiction.length;
    }
    
    // Add complexity for multiple participants
    if (alert.participants && alert.participants.length > 3) {
      complexity += Math.floor(alert.participants.length / 3);
    }
    
    return Math.min(10, complexity);
  }

  private assessPublicityRisk(alert: any): InvestigationCase['publicityRisk'] {
    if (alert.estimatedLoss > 10000000) return 'high';
    if (alert.estimatedLoss > 1000000) return 'medium';
    return 'low';
  }

  private requiresImmediateReporting(investigationCase: InvestigationCase): boolean {
    return investigationCase.estimatedLoss > 50000 || 
           investigationCase.category.includes('money_laundering') ||
           investigationCase.priority === 'critical';
  }

  private requiresExpeditedReporting(investigationCase: InvestigationCase): boolean {
    return investigationCase.estimatedLoss > 1000000 || 
           investigationCase.priority === 'critical';
  }

  private async initiateRegulatoryReporting(investigationCase: InvestigationCase): Promise<void> {
    // Generate SAR for money laundering cases
    if (investigationCase.category.includes('money_laundering')) {
      await this.generateSAR(investigationCase);
    }
    
    // Generate state reports as required
    await this.generateStateReports(investigationCase);
  }

  private async expediteRegulatoryReporting(investigationCase: InvestigationCase): Promise<void> {
    // Expedite existing reports
    for (const report of investigationCase.regulatoryReports) {
      if (report.status === 'draft') {
        await this.expediteReport(report);
      }
    }
  }

  private async generateSAR(investigationCase: InvestigationCase): Promise<void> {
    const sar: RegulatoryReport = {
      id: `SAR-${Date.now()}`,
      type: 'SAR',
      agency: 'FinCEN',
      filedBy: 'system',
      filedDate: new Date(),
      reportNumber: await this.generateSARNumber(),
      status: 'draft',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      content: {
        caseId: investigationCase.id,
        suspiciousActivity: investigationCase.description,
        estimatedLoss: investigationCase.estimatedLoss,
        participants: investigationCase.participantsInvolved
      }
    };
    
    investigationCase.regulatoryReports.push(sar);
    await this.database.updateInvestigationCase(investigationCase);
  }

  private async generateStateReports(investigationCase: InvestigationCase): Promise<void> {
    // Generate state-specific reports based on jurisdictions
    for (const jurisdiction of investigationCase.jurisdictions) {
      const stateReport = await this.createStateReport(investigationCase, jurisdiction);
      investigationCase.regulatoryReports.push(stateReport);
    }
    
    await this.database.updateInvestigationCase(investigationCase);
  }

  private async createStateReport(investigationCase: InvestigationCase, jurisdiction: string): Promise<RegulatoryReport> {
    return {
      id: `STATE-${Date.now()}-${jurisdiction}`,
      type: 'State_Report',
      agency: `${jurisdiction} Real Estate Commission`,
      filedBy: 'system',
      filedDate: new Date(),
      reportNumber: await this.generateStateReportNumber(jurisdiction),
      status: 'draft',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      content: {
        caseId: investigationCase.id,
        jurisdiction,
        fraudType: investigationCase.category,
        participants: investigationCase.participantsInvolved.filter(p => 
          p.type === 'professional'
        )
      }
    };
  }

  private async generateLawEnforcementNotification(investigationCase: InvestigationCase, notifiedBy: string): Promise<void> {
    const notification: LENotification = {
      id: `LE-${Date.now()}`,
      agency: 'FBI Financial Crimes Unit',
      contactPerson: 'Special Agent in Charge',
      notifiedBy,
      notifiedDate: new Date(),
      method: 'secure_portal',
      urgency: investigationCase.priority === 'critical' ? 'urgent' : 'priority'
    };
    
    investigationCase.lawEnforcementNotifications.push(notification);
    await this.database.updateInvestigationCase(investigationCase);
    
    this.emit('law_enforcement_notified', { caseId: investigationCase.id, notification });
  }

  private async notifySeniorInvestigators(investigationCase: InvestigationCase, escalatedBy: string): Promise<void> {
    // Implementation would send notifications to senior staff
    this.logger.info(`Senior investigators notified for case ${investigationCase.caseNumber}`);
  }

  private async expediteReport(report: RegulatoryReport): Promise<void> {
    // Implementation would expedite report processing
    report.dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  private async generateSARNumber(): Promise<string> {
    const sequence = await this.database.getNextSARSequence();
    return `SAR-${new Date().getFullYear()}-${sequence.toString().padStart(8, '0')}`;
  }

  private async generateStateReportNumber(jurisdiction: string): Promise<string> {
    const sequence = await this.database.getNextStateReportSequence(jurisdiction);
    return `${jurisdiction}-${new Date().getFullYear()}-${sequence.toString().padStart(6, '0')}`;
  }

  private initializeAssignmentRules(): void {
    // Initialize case assignment rules
    this.assignmentRules = [
      // High-value cases to senior investigators
      {
        matches: (alert: any, priority: string) => alert.estimatedLoss > 5000000,
        assign: (investigators: any[]) => investigators.find(inv => inv.level === 'senior')?.id
      },
      // Money laundering cases to AML specialists
      {
        matches: (alert: any, priority: string) => alert.category.includes('money_laundering'),
        assign: (investigators: any[]) => investigators.find(inv => inv.specialization === 'AML')?.id
      },
      // Professional fraud to licensing specialists
      {
        matches: (alert: any, priority: string) => alert.category.includes('professional_fraud'),
        assign: (investigators: any[]) => investigators.find(inv => inv.specialization === 'professional')?.id
      }
    ];
  }

  private startPeriodicTasks(): void {
    // Check for overdue cases every hour
    setInterval(() => {
      this.checkOverdueCases();
    }, 60 * 60 * 1000);
    
    // Generate periodic reports every day
    setInterval(() => {
      this.generatePeriodicReports();
    }, 24 * 60 * 60 * 1000);
  }

  private async checkOverdueCases(): Promise<void> {
    const now = new Date();
    
    for (const [caseId, investigationCase] of this.activeCases.entries()) {
      if (investigationCase.dueDate < now && investigationCase.status !== 'closed') {
        this.logger.warn(`Case ${investigationCase.caseNumber} is overdue`);
        this.emit('case_overdue', { caseId, investigationCase });
        
        // Auto-escalate critical overdue cases
        if (investigationCase.priority === 'critical') {
          await this.escalateCase(caseId, 'system', 'Automatic escalation - overdue critical case');
        }
      }
    }
  }

  private async generatePeriodicReports(): Promise<void> {
    try {
      const metrics = await this.getCaseMetrics();
      this.emit('periodic_report', metrics);
      this.logger.info('Periodic case management report generated');
    } catch (error) {
      this.logger.error('Failed to generate periodic report', error);
    }
  }

  async getCaseMetrics(): Promise<any> {
    const activeCases = Array.from(this.activeCases.values());
    
    return {
      totalActiveCases: activeCases.length,
      casesByStatus: this.groupCasesByStatus(activeCases),
      casesByPriority: this.groupCasesByPriority(activeCases),
      averageResolutionTime: await this.calculateAverageResolutionTime(),
      overdueCases: activeCases.filter(c => c.dueDate < new Date()).length,
      totalEstimatedLoss: activeCases.reduce((sum, c) => sum + c.estimatedLoss, 0),
      investigationHours: activeCases.reduce((sum, c) => sum + c.investigationHours, 0)
    };
  }

  private groupCasesByStatus(cases: InvestigationCase[]): Record<string, number> {
    return cases.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupCasesByPriority(cases: InvestigationCase[]): Record<string, number> {
    return cases.reduce((acc, c) => {
      acc[c.priority] = (acc[c.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private async calculateAverageResolutionTime(): Promise<number> {
    const closedCases = await this.database.getRecentlyClosedCases(30); // Last 30 days
    
    if (closedCases.length === 0) return 0;
    
    const totalTime = closedCases.reduce((sum, c) => {
      const resolutionTime = c.closedAt!.getTime() - c.createdAt.getTime();
      return sum + resolutionTime;
    }, 0);
    
    return totalTime / closedCases.length / (24 * 60 * 60 * 1000); // Convert to days
  }

  async getCase(caseId: string): Promise<InvestigationCase | null> {
    return this.activeCases.get(caseId) || await this.database.getInvestigationCase(caseId);
  }

  async searchCases(criteria: any): Promise<InvestigationCase[]> {
    return await this.database.searchInvestigationCases(criteria);
  }

  async getStatus(): Promise<any> {
    return {
      activeCases: this.activeCases.size,
      queuedCases: this.caseQueue.length,
      assignmentRules: this.assignmentRules.length,
      lastActivity: new Date()
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Case Management Service...');
    
    this.activeCases.clear();
    this.caseQueue = [];
    
    await this.database.shutdown();
    
    this.logger.info('Case Management Service shutdown complete');
  }
}

interface AssignmentRule {
  matches: (alert: any, priority: string) => boolean;
  assign: (investigators: any[]) => string | undefined;
}