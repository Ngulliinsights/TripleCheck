/**
 * Registry Mismatch Detector
 *
 * Specialized service for detecting discrepancies between physical and digital
 * land registry records during Kenya's transition period.
 *
 * Key Features:
 * - Physical vs. digital record comparison with field-level severity grading
 * - Digitization timeline analysis (when, by whom, and under what conditions)
 * - Anomaly detection for suspicious digitization patterns
 * - Integration with a known-disputed-property registry
 */

import type {
  RegistryState,
  RegistryDiscrepancy,
  RegistryProofSnapshot,
} from '../types/npl-verification.types'

// ============================================================================
// Supporting Types
// ============================================================================

interface PhysicalRecordData {
  readonly ownerName: string;
  readonly titleNumber: string;
  readonly sizeAcres: number;
  readonly encumbrances: string[];
  readonly lastVerifiedDate: Date;
  readonly registryOffice: string;
}

interface DigitalRecordData {
  readonly ownerName: string;
  readonly titleNumber: string;
  readonly sizeAcres: number;
  readonly encumbrances: string[];
  readonly lastUpdated: Date;
  readonly sourceRegistry: string;
}

interface ComparisonResult {
  readonly titleNumber: string;
  readonly registryState: RegistryState;
  readonly discrepancies: RegistryDiscrepancy[];
  readonly warnings: string[];
  readonly riskLevel: 'critical' | 'high' | 'medium' | 'low';
  readonly recommendation: string;
  readonly knownDisputeMatch: DisputedPropertyRecord | null;
}

export interface DisputedPropertyRecord {
  readonly titleNumber: string;
  readonly caseReference: string;
  readonly parties: string[];
  readonly disputeType: 'ownership_conflict' | 'boundary_dispute' | 'fraud' | 'encumbrance';
  readonly status: 'pending' | 'resolved' | 'appeal';
  readonly ruling?: string;
  readonly rulingDate?: Date;
  readonly keyLearning?: string;
}

interface DigitizationRecord {
  readonly titleNumber: string;
  readonly digitizedAt: Date;
  readonly digitizedBy: string;
  readonly batchSize?: number;
  readonly ownershipChangedDuringDigitization: boolean;
  readonly verificationMethod: 'physical_scan' | 'data_entry' | 'bulk_import';
}

interface DigitizationRedFlag {
  readonly type: 'unusual_timing' | 'unknown_actor' | 'bulk_processing' | 'ownership_change';
  readonly description: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
}

interface DigitizationAnalysis {
  readonly titleNumber: string;
  readonly digitizationRecord: DigitizationRecord | null;
  readonly redFlags: DigitizationRedFlag[];
  readonly overallRisk: 'critical' | 'high' | 'medium' | 'low';
  readonly recommendation: string;
}

interface PropertyAnomaly {
  readonly type: 'bulk_digitization' | 'concentrated_ownership' | 'pattern_match';
  readonly affectedProperties: string[];
  readonly description: string;
  readonly riskScore: number; // 0-10
}

interface AnomalyReport {
  readonly totalPropertiesAnalyzed: number;
  readonly anomaliesDetected: number;
  readonly anomalies: PropertyAnomaly[];
  readonly highRiskCount: number;
  readonly recommendation: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Minimum batch size that triggers a bulk-processing red flag. */
const BULK_BATCH_THRESHOLD = 50;

/** Maximum properties a single owner can hold before triggering concentration anomaly. */
const CONCENTRATED_OWNERSHIP_THRESHOLD = 10;

/** Minimum daily digitization volume before flagging a bulk-digitization anomaly. */
const DAILY_VOLUME_ANOMALY_THRESHOLD = 20;

// ============================================================================
// Registry Mismatch Detector
// ============================================================================

export class RegistryMismatchDetector {
  private readonly knownDisputedProperties = new Map<string, DisputedPropertyRecord>();

  // Extend this set via `addVerifiedOfficer()` for runtime configurability
  private readonly verifiedOfficers = new Set<string>(['JKN-001', 'JKN-002', 'NRB-001', 'MSA-001']);

  constructor() {
    this.initializeKnownDisputes();
  }

  // ============================================================================
  // Physical vs. Digital Comparison
  // ============================================================================

  /**
   * Compare a physical deed record against its corresponding digital registry entry.
   * Returns all discrepancies with severity grades and a risk-level summary.
   */
  async comparePhysicalAndDigital(
    titleNumber: string,
    physicalData: PhysicalRecordData,
    digitalData: DigitalRecordData
  ): Promise<ComparisonResult> {
    const discrepancies: RegistryDiscrepancy[] = [];
    const warnings: string[] = [];

    // 1. Owner name — most critical field
    if (this.normalizeText(physicalData.ownerName) !== this.normalizeText(digitalData.ownerName)) {
      discrepancies.push({
        field: 'ownerName',
        physicalValue: physicalData.ownerName,
        digitalValue: digitalData.ownerName,
        severity: 'critical',
        possibleCause: this.analyzeOwnerDiscrepancy(physicalData.ownerName, digitalData.ownerName),
      });
    }

    // 2. Title number format
    if (physicalData.titleNumber !== digitalData.titleNumber) {
      discrepancies.push({
        field: 'titleNumber',
        physicalValue: physicalData.titleNumber,
        digitalValue: digitalData.titleNumber,
        severity: 'high',
        possibleCause:
          'Title number format mismatch between systems — may indicate fraud or a data-migration error.',
      });
    }

    // 3. Land area — allow a 5 % tolerance for survey rounding
    if (physicalData.sizeAcres > 0) {
      const variancePct =
        (Math.abs(physicalData.sizeAcres - digitalData.sizeAcres) / physicalData.sizeAcres) * 100;
      if (variancePct > 5) {
        discrepancies.push({
          field: 'sizeAcres',
          physicalValue: String(physicalData.sizeAcres),
          digitalValue: String(digitalData.sizeAcres),
          severity: variancePct > 20 ? 'critical' : 'medium',
          possibleCause:
            'Size discrepancy may indicate fraudulent subdivision or a data-entry error.',
        });
      }
    }

    // 4. Encumbrances — each missing from digital is critical; extra in digital is a warning
    const digitalEncumbrances = new Set(digitalData.encumbrances);
    const physicalEncumbrances = new Set(physicalData.encumbrances);

    for (const enc of physicalData.encumbrances) {
      if (!digitalEncumbrances.has(enc)) {
        discrepancies.push({
          field: 'encumbrances',
          physicalValue: enc,
          digitalValue: 'Not in digital record',
          severity: 'high',
          possibleCause:
            'Encumbrance may have been fraudulently omitted during digitization.',
        });
      }
    }

    for (const enc of digitalData.encumbrances) {
      if (!physicalEncumbrances.has(enc)) {
        warnings.push(`Digital record carries encumbrance not present in physical deed: "${enc}"`);
      }
    }

    const disputeMatch = this.checkAgainstKnownDisputes(titleNumber);

    return {
      titleNumber,
      registryState: this.determineRegistryState(discrepancies),
      discrepancies,
      warnings,
      riskLevel: this.calculateRiskLevel(discrepancies, disputeMatch),
      recommendation: this.generateRecommendation(discrepancies, disputeMatch),
      knownDisputeMatch: disputeMatch,
    };
  }

  // ============================================================================
  // Digitization Timeline Analysis
  // ============================================================================

  /**
   * Analyse when and how a property was digitized.
   * Suspicious patterns include: weekend/after-hours entry, unknown officers,
   * large batches, and ownership changes coinciding with digitization.
   */
  async analyzeDigitizationTimeline(titleNumber: string): Promise<DigitizationAnalysis> {
    const record = await this.fetchDigitizationRecord(titleNumber);
    const redFlags: DigitizationRedFlag[] = [];

    if (record) {
      const { digitizedAt, digitizedBy, batchSize, ownershipChangedDuringDigitization } = record;
      const dayOfWeek = digitizedAt.getDay();
      const hour = digitizedAt.getHours();

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        redFlags.push({
          type: 'unusual_timing',
          description: 'Property was digitized on a weekend.',
          severity: 'medium',
        });
      }

      if (hour < 8 || hour > 17) {
        redFlags.push({
          type: 'unusual_timing',
          description: `Property was digitized outside business hours (${digitizedAt.toTimeString().substring(0, 5)}).`,
          severity: 'medium',
        });
      }

      if (!this.verifiedOfficers.has(digitizedBy)) {
        redFlags.push({
          type: 'unknown_actor',
          description: `Digitizing officer "${digitizedBy}" is not in the verified-officer list.`,
          severity: 'high',
        });
      }

      if (batchSize !== undefined && batchSize > BULK_BATCH_THRESHOLD) {
        redFlags.push({
          type: 'bulk_processing',
          description: `Part of a large batch (${batchSize} properties) — elevated risk of mass-fraud.`,
          severity: 'medium',
        });
      }

      // Highest severity: ownership mutated at the exact moment of digitization
      if (ownershipChangedDuringDigitization) {
        redFlags.push({
          type: 'ownership_change',
          description: 'Ownership was modified during the digitization process.',
          severity: 'critical',
        });
      }
    }

    return {
      titleNumber,
      digitizationRecord: record,
      redFlags,
      overallRisk: this.assessDigitizationRisk(redFlags),
      recommendation: this.generateDigitizationRecommendation(redFlags),
    };
  }

  // ============================================================================
  // Anomaly Detection
  // ============================================================================

  /**
   * Scan a property portfolio for systemic anomalies:
   * - High-volume digitization on a single date (bulk fraud signal)
   * - Concentrated ownership across many titles
   */
  async detectAnomalies(
    properties: Array<{ titleNumber: string; digitalData: DigitalRecordData; digitizedAt?: Date }>
  ): Promise<AnomalyReport> {
    const anomalies: PropertyAnomaly[] = [];

    // 1. Bulk-digitization detection — group by actual digitization date where available
    const byDate = new Map<string, string[]>();
    for (const prop of properties) {
      // Use provided digitization date; fall back to current date (simulated)
      const dateKey = (prop.digitizedAt ?? new Date()).toISOString().split('T')[0];
      const bucket = byDate.get(dateKey) ?? [];
      bucket.push(prop.titleNumber);
      byDate.set(dateKey, bucket);
    }

    for (const [date, titles] of byDate) {
      if (titles.length >= DAILY_VOLUME_ANOMALY_THRESHOLD) {
        anomalies.push({
          type: 'bulk_digitization',
          affectedProperties: titles,
          description: `${titles.length} properties digitized on ${date} — unusually high daily volume.`,
          riskScore: Math.min(titles.length / 10, 10),
        });
      }
    }

    // 2. Concentrated-ownership detection
    const ownerProperties = new Map<string, string[]>();
    for (const prop of properties) {
      const owner = this.normalizeText(prop.digitalData.ownerName);
      const bucket = ownerProperties.get(owner) ?? [];
      bucket.push(prop.titleNumber);
      ownerProperties.set(owner, bucket);
    }

    for (const [owner, titles] of ownerProperties) {
      if (titles.length > CONCENTRATED_OWNERSHIP_THRESHOLD) {
        anomalies.push({
          type: 'concentrated_ownership',
          affectedProperties: titles,
          description: `"${owner}" appears as owner on ${titles.length} properties.`,
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
          ? 'Review all flagged properties with enhanced due diligence.'
          : 'No anomalies detected in the current dataset.',
    };
  }

  // ============================================================================
  // Disputed Property Registry
  // ============================================================================

  /**
   * Check whether a title number matches a known disputed property.
   */
  checkAgainstKnownDisputes(titleNumber: string): DisputedPropertyRecord | null {
    return this.knownDisputedProperties.get(titleNumber) ?? null;
  }

  /**
   * Register a disputed property record so future verifications can flag it.
   */
  registerDisputedProperty(record: DisputedPropertyRecord): void {
    this.knownDisputedProperties.set(record.titleNumber, record);
  }

  /**
   * Add a verified digitization officer at runtime (e.g., on server startup from a config store).
   */
  addVerifiedOfficer(officerId: string): void {
    this.verifiedOfficers.add(officerId);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private initializeKnownDisputes(): void {
    // Seed with high-profile case: Mwangi vs. Mount Pleasant
    this.registerDisputedProperty({
      titleNumber: 'LR_MUTHAIGA_001',
      caseReference: 'ELC Case 123/2024',
      parties: ['James Mwangi', 'Mount Pleasant Ltd'],
      disputeType: 'ownership_conflict',
      status: 'resolved',
      ruling: 'Nemo dat quod non habet — the 2013 seller (Moi) did not hold title at the time of transfer.',
      rulingDate: new Date('2025-10-15'),
      keyLearning: 'A full historical audit is required; the digital record was modified during the transition period.',
    });
  }

  /** Lowercase, collapse whitespace for fuzzy name comparison. */
  private normalizeText(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private analyzeOwnerDiscrepancy(physical: string, digital: string): string {
    const normPhysical = this.normalizeText(physical);
    const normDigital = this.normalizeText(digital);

    // Partial match — abbreviation or spelling variation
    if (normPhysical.includes(normDigital) || normDigital.includes(normPhysical)) {
      return 'Partial name match — likely an abbreviation or spelling variation; verify manually.';
    }

    // Company vs. individual mismatch
    const companyTokens = ['ltd', 'limited', 'company', 'corp', 'inc'];
    const physIsCompany = companyTokens.some((t) => normPhysical.includes(t));
    const digIsCompany  = companyTokens.some((t) => normDigital.includes(t));

    if (physIsCompany !== digIsCompany) {
      return 'CRITICAL: Company vs. individual mismatch — possible fraudulent transfer of beneficial ownership.';
    }

    return 'Complete name mismatch — requires urgent investigation.';
  }

  private determineRegistryState(discrepancies: RegistryDiscrepancy[]): RegistryState {
    if (discrepancies.length === 0) return 'both_consistent';
    return 'both_mismatch';
  }

  private calculateRiskLevel(
    discrepancies: RegistryDiscrepancy[],
    disputeMatch: DisputedPropertyRecord | null
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (disputeMatch)                                            return 'critical';
    if (discrepancies.some((d) => d.severity === 'critical'))   return 'critical';
    if (discrepancies.some((d) => d.severity === 'high'))        return 'high';
    if (discrepancies.length > 0)                                return 'medium';
    return 'low';
  }

  private generateRecommendation(
    discrepancies: RegistryDiscrepancy[],
    disputeMatch: DisputedPropertyRecord | null
  ): string {
    if (disputeMatch) {
      return (
        `CRITICAL: This property is listed in a known dispute (${disputeMatch.caseReference}). ` +
        `Ruling: ${disputeMatch.ruling ?? 'Pending'}. ` +
        'DO NOT PROCEED without a full legal review.'
      );
    }
    if (discrepancies.some((d) => d.severity === 'critical')) {
      return (
        'CRITICAL discrepancies detected between physical and digital records. ' +
        'Obtain a blockchain-anchored proof and seek legal consultation before any transaction.'
      );
    }
    if (discrepancies.length > 0) {
      return 'Discrepancies detected. Physical registry verification and full documentation are required.';
    }
    return 'Physical and digital records are consistent. Proceed with standard due diligence.';
  }

  /** TODO (production): Fetch from government digitization audit logs via secure API. */
  private async fetchDigitizationRecord(
    titleNumber: string
  ): Promise<DigitizationRecord | null> {
    return {
      titleNumber,
      digitizedAt: new Date('2023-06-15T14:30:00'),
      digitizedBy: 'JKN-001',
      batchSize: 12,
      ownershipChangedDuringDigitization: false,
      verificationMethod: 'physical_scan',
    };
  }

  private assessDigitizationRisk(
    redFlags: DigitizationRedFlag[]
  ): 'critical' | 'high' | 'medium' | 'low' {
    if (redFlags.some((f) => f.severity === 'critical')) return 'critical';
    if (redFlags.some((f) => f.severity === 'high'))     return 'high';
    if (redFlags.length > 2)                             return 'medium';
    return 'low'; // Covers both 1–2 flags and 0 flags
  }

  private generateDigitizationRecommendation(redFlags: DigitizationRedFlag[]): string {
    if (redFlags.length === 0) {
      return 'Digitization process appears normal. Standard verification is recommended.';
    }
    if (redFlags.some((f) => f.severity === 'critical')) {
      return (
        'CRITICAL: Ownership was changed during digitization — a major fraud indicator. ' +
        'Physical deed verification is mandatory before any transaction.'
      );
    }
    return `${redFlags.length} red flag(s) detected in the digitization process. Enhanced due diligence is required.`;
  }
}

// Export singleton instance
export const registryMismatchDetector = new RegistryMismatchDetector();