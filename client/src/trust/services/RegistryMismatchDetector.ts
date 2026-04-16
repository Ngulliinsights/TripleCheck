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

import type {
  RegistryState,
  RegistryDiscrepancy,
  RegistryProofSnapshot,
} from '../types/npl-verification.types'

// ============================================================================
// Registry Mismatch Detector
// ============================================================================

export class RegistryMismatchDetector {
  private readonly knownDisputedProperties = new Map<string, DisputedPropertyRecord>();

  constructor() {
    // Initialize with known high-profile cases
    this.initializeKnownDisputes();
  }

  // ============================================================================
  // Physical vs Digital Comparison
  // ============================================================================

  /**
   * Compare physical deed records against digital registry entries
   */
  async comparePhysicalAndDigital(
    titleNumber: string,
    physicalData: PhysicalRecordData,
    digitalData: DigitalRecordData
  ): Promise<ComparisonResult> {
    const discrepancies: RegistryDiscrepancy[] = [];
    const warnings: string[] = [];

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

    // Compare size/area
    const sizeDifference = Math.abs(physicalData.sizeAcres - digitalData.sizeAcres);
    const sizeVariance = (sizeDifference / physicalData.sizeAcres) * 100;
    if (sizeVariance > 5) {
      discrepancies.push({
        field: 'sizeAcres',
        physicalValue: String(physicalData.sizeAcres),
        digitalValue: String(digitalData.sizeAcres),
        severity: sizeVariance > 20 ? 'critical' : 'medium',
        possibleCause: 'Size discrepancy may indicate subdivision or data entry error',
      });
    }

    // Compare encumbrances
    const physicalEncumbrances = new Set(physicalData.encumbrances);
    const digitalEncumbrances = new Set(digitalData.encumbrances);

    for (const enc of physicalData.encumbrances) {
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

    for (const enc of digitalData.encumbrances) {
      if (!physicalEncumbrances.has(enc)) {
        warnings.push(`Digital record shows encumbrance not in physical: ${enc}`);
      }
    }

    // Determine overall state
    const registryState = this.determineRegistryState(discrepancies);

    // Check against known disputes
    const disputeMatch = this.checkAgainstKnownDisputes(titleNumber);

    return {
      titleNumber,
      registryState,
      discrepancies,
      warnings,
      riskLevel: this.calculateRiskLevel(discrepancies, disputeMatch),
      recommendation: this.generateRecommendation(discrepancies, disputeMatch),
      knownDisputeMatch: disputeMatch,
    };
  }

  // ============================================================================
  // Transition Timeline Analysis
  // ============================================================================

  /**
   * Analyze when and how a property was digitized
   * Suspicious patterns include: rush digitization, unauthorized officers, bulk changes
   */
  async analyzeDigitizationTimeline(titleNumber: string): Promise<DigitizationAnalysis> {
    // In production, would fetch from government audit logs
    const digitizationRecord = await this.fetchDigitizationRecord(titleNumber);

    const redFlags: DigitizationRedFlag[] = [];

    // Check for suspicious patterns
    if (digitizationRecord) {
      // Red flag: Digitized on weekend or holiday
      const dayOfWeek = digitizationRecord.digitizedAt.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        redFlags.push({
          type: 'unusual_timing',
          description: 'Property was digitized on a weekend',
          severity: 'medium',
        });
      }

      // Red flag: Digitized outside business hours
      const hour = digitizationRecord.digitizedAt.getHours();
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
      if (
        digitizationRecord.batchSize &&
        digitizationRecord.batchSize > 50
      ) {
        redFlags.push({
          type: 'bulk_processing',
          description: `Part of large batch (${digitizationRecord.batchSize} properties)`,
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

    return {
      titleNumber,
      digitizationRecord,
      redFlags,
      overallRisk: this.assessDigitizationRisk(redFlags),
      recommendation: this.generateDigitizationRecommendation(redFlags),
    };
  }

  // ============================================================================
  // Anomaly Detection
  // ============================================================================

  /**
   * Detect suspicious patterns in property records
   */
  async detectAnomalies(
    properties: Array<{ titleNumber: string; digitalData: DigitalRecordData }>
  ): Promise<AnomalyReport> {
    const anomalies: PropertyAnomaly[] = [];

    // Group by digitization date to find bulk operations
    const byDate = new Map<string, string[]>();
    for (const prop of properties) {
      // Would get digitization date from record
      const dateKey = new Date().toISOString().split('T')[0]; // Simulated
      if (!byDate.has(dateKey)) byDate.set(dateKey, []);
      byDate.get(dateKey)!.push(prop.titleNumber);
    }

    // Flag dates with unusually high volume
    for (const [date, titles] of byDate) {
      if (titles.length > 20) {
        anomalies.push({
          type: 'bulk_digitization',
          affectedProperties: titles,
          description: `${titles.length} properties digitized on ${date}`,
          riskScore: Math.min(titles.length / 10, 10),
        });
      }
    }

    // Check for duplicate ownership claims
    const ownerProperties = new Map<string, string[]>();
    for (const prop of properties) {
      const owner = this.normalizeText(prop.digitalData.ownerName);
      if (!ownerProperties.has(owner)) ownerProperties.set(owner, []);
      ownerProperties.get(owner)!.push(prop.titleNumber);
    }

    // Flag owners with suspiciously many properties
    for (const [owner, titles] of ownerProperties) {
      if (titles.length > 10) {
        anomalies.push({
          type: 'concentrated_ownership',
          affectedProperties: titles,
          description: `${owner} appears as owner on ${titles.length} properties`,
          riskScore: titles.length > 50 ? 10 : 5,
        });
      }
    }

    return {
      totalPropertiesAnalyzed: properties.length,
      anomaliesDetected: anomalies.length,
      anomalies,
      highRiskCount: anomalies.filter((a) => a.riskScore >= 7).length,
      recommendation:
        anomalies.length > 0
          ? 'Review flagged properties with enhanced due diligence'
          : 'No anomalies detected in current dataset',
    };
  }

  // ============================================================================
  // Court Case Integration
  // ============================================================================

  /**
   * Check if property is involved in known disputes
   */
  checkAgainstKnownDisputes(titleNumber: string): DisputedPropertyRecord | null {
    return this.knownDisputedProperties.get(titleNumber) || null;
  }

  /**
   * Add a known disputed property to the registry
   */
  registerDisputedProperty(record: DisputedPropertyRecord): void {
    this.knownDisputedProperties.set(record.titleNumber, record);
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private initializeKnownDisputes(): void {
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
  }

  private normalizeText(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private analyzeOwnerDiscrepancy(physical: string, digital: string): string {
    // Check for common patterns
    if (
      this.normalizeText(physical).includes(this.normalizeText(digital)) ||
      this.normalizeText(digital).includes(this.normalizeText(physical))
    ) {
      return 'Partial name match - may be abbreviation or spelling variation';
    }

    // Company vs individual
    const companyIndicators = ['ltd', 'limited', 'company', 'corp', 'inc'];
    const physicalIsCompany = companyIndicators.some((i) =>
      physical.toLowerCase().includes(i)
    );
    const digitalIsCompany = companyIndicators.some((i) =>
      digital.toLowerCase().includes(i)
    );

    if (physicalIsCompany !== digitalIsCompany) {
      return 'CRITICAL: Company vs Individual mismatch - possible fraudulent transfer';
    }

    return 'Complete name mismatch - requires urgent investigation';
  }

  private determineRegistryState(discrepancies: RegistryDiscrepancy[]): RegistryState {
    if (discrepancies.length === 0) return 'both_consistent';

    const hasCritical = discrepancies.some((d) => d.severity === 'critical');
    if (hasCritical) return 'both_mismatch';

    return 'both_mismatch';
  }

  private calculateRiskLevel(
    discrepancies: RegistryDiscrepancy[],
    disputeMatch: DisputedPropertyRecord | null
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (disputeMatch) return 'critical';
    if (discrepancies.some((d) => d.severity === 'critical')) return 'critical';
    if (discrepancies.some((d) => d.severity === 'high')) return 'high';
    if (discrepancies.length > 0) return 'medium';
    return 'low';
  }

  private generateRecommendation(
    discrepancies: RegistryDiscrepancy[],
    disputeMatch: DisputedPropertyRecord | null
  ): string {
    if (disputeMatch) {
      return `CRITICAL: This property is involved in known dispute (${disputeMatch.caseReference}). ` +
        `Ruling: ${disputeMatch.ruling}. ` +
        'DO NOT PROCEED without full legal review.';
    }

    if (discrepancies.some((d) => d.severity === 'critical')) {
      return 'CRITICAL discrepancies detected between physical and digital records. ' +
        'Recommend obtaining blockchain-anchored proof and legal consultation before any transaction.';
    }

    if (discrepancies.length > 0) {
      return 'Discrepancies detected. Recommend physical registry verification and documentation.';
    }

    return 'Physical and digital records are consistent. Proceed with standard due diligence.';
  }

  private async fetchDigitizationRecord(
    titleNumber: string
  ): Promise<DigitizationRecord | null> {
    // In production, would fetch from government audit logs
    // Simulated response
    return {
      titleNumber,
      digitizedAt: new Date('2023-06-15T14:30:00'),
      digitizedBy: 'JKN-001',
      batchSize: 12,
      ownershipChangedDuringDigitization: false,
      verificationMethod: 'physical_scan',
    };
  }

  private isKnownDigitizationOfficer(officerId: string): boolean {
    // In production, maintain verified officer list
    const knownOfficers = ['JKN-001', 'JKN-002', 'NRB-001', 'MSA-001'];
    return knownOfficers.includes(officerId);
  }

  private assessDigitizationRisk(
    redFlags: DigitizationRedFlag[]
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (redFlags.some((f) => f.severity === 'critical')) return 'critical';
    if (redFlags.some((f) => f.severity === 'high')) return 'high';
    if (redFlags.length > 2) return 'medium';
    if (redFlags.length > 0) return 'low';
    return 'low';
  }

  private generateDigitizationRecommendation(redFlags: DigitizationRedFlag[]): string {
    if (redFlags.length === 0) {
      return 'Digitization process appears normal. Standard verification recommended.';
    }

    if (redFlags.some((f) => f.severity === 'critical')) {
      return 'CRITICAL: Ownership changed during digitization. ' +
        'This is a major fraud indicator. Require physical deed verification.';
    }

    return `${redFlags.length} red flags detected in digitization process. ` +
      'Enhanced due diligence recommended.';
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface PhysicalRecordData {
  ownerName: string;
  titleNumber: string;
  sizeAcres: number;
  encumbrances: string[];
  lastVerifiedDate: Date;
  registryOffice: string;
}

interface DigitalRecordData {
  ownerName: string;
  titleNumber: string;
  sizeAcres: number;
  encumbrances: string[];
  lastUpdated: Date;
  sourceRegistry: string;
}

interface ComparisonResult {
  titleNumber: string;
  registryState: RegistryState;
  discrepancies: RegistryDiscrepancy[];
  warnings: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
  knownDisputeMatch: DisputedPropertyRecord | null;
}

interface DisputedPropertyRecord {
  titleNumber: string;
  caseReference: string;
  parties: string[];
  disputeType: 'ownership_conflict' | 'boundary_dispute' | 'fraud' | 'encumbrance';
  status: 'pending' | 'resolved' | 'appeal';
  ruling?: string;
  rulingDate?: Date;
  keyLearning?: string;
}

interface DigitizationRecord {
  titleNumber: string;
  digitizedAt: Date;
  digitizedBy: string;
  batchSize?: number;
  ownershipChangedDuringDigitization: boolean;
  verificationMethod: 'physical_scan' | 'data_entry' | 'bulk_import';
}

interface DigitizationRedFlag {
  type: 'unusual_timing' | 'unknown_actor' | 'bulk_processing' | 'ownership_change';
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface DigitizationAnalysis {
  titleNumber: string;
  digitizationRecord: DigitizationRecord | null;
  redFlags: DigitizationRedFlag[];
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

interface PropertyAnomaly {
  type: 'bulk_digitization' | 'concentrated_ownership' | 'pattern_match';
  affectedProperties: string[];
  description: string;
  riskScore: number;
}

interface AnomalyReport {
  totalPropertiesAnalyzed: number;
  anomaliesDetected: number;
  anomalies: PropertyAnomaly[];
  highRiskCount: number;
  recommendation: string;
}

// Export singleton instance
export const registryMismatchDetector = new RegistryMismatchDetector();
