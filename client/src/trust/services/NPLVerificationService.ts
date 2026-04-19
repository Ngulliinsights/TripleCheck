/**
 * NPL Verification Service
 *
 * Provides specialized verification workflow for bank NPL (Non-Performing Loan) recovery.
 * Handles collateral assessment, title chain audits, and recovery recommendations.
 */

import type {
  NPLProperty,
  RecoveryRecommendation,
  RecoveryAction,
  NPLRiskAssessment,
  MarketConditions,
  RecoveryRisk,
  PortfolioSummary,
  NPLBulkUpload,
  NPLImportRow,
  VerificationPriority,
  CollateralType,
  NPLVerificationStatus,
} from '../types/npl-verification.types'

// ============================================================================
// Supporting Types
// ============================================================================

interface ComparableProperty {
  readonly propertyId: string;
  readonly soldPrice: number;
  readonly soldDate: Date;
  readonly distanceKm: number;
}

interface OwnershipRecord {
  readonly ownerId: string;
  readonly ownerName: string;
  readonly acquisitionDate: Date;
  readonly disposalDate?: Date;
  readonly acquisitionType: 'purchase' | 'inheritance' | 'gift' | 'court_order' | 'unknown';
  readonly source: 'digital' | 'physical';
  readonly documentReference?: string;
}

interface TitleGap {
  readonly fromDate: Date;
  readonly toDate: Date;
  readonly description: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
}

interface FraudIndicator {
  readonly type: string;
  readonly description: string;
  readonly confidence: number;
  readonly evidence: string[];
}

// ============================================================================
// NPL Verification Service
// ============================================================================

export class NPLVerificationService {

  // ============================================================================
  // Collateral Valuation
  // ============================================================================

  /**
   * Assess the current market value of a collateral property.
   */
  async assessCollateralValue(
    propertyId: string,
    loanDetails: {
      readonly originalLoanAmount: number;
      readonly outstandingBalance: number;
      readonly loanOriginDate: Date;
    }
  ): Promise<{
    currentMarketValue: number;
    loanToValueRatio: number;
    valuationConfidence: number;
    comparableProperties: ComparableProperty[];
    marketTrend: MarketConditions['trend'];
    recommendations: string[];
  }> {
    const [marketValue, comparables] = await Promise.all([
      this.fetchMarketValue(propertyId),
      this.fetchComparableProperties(propertyId),
    ]);

    const ltvRatio = (loanDetails.outstandingBalance / marketValue) * 100;
    const daysSinceLoan = Math.floor(
      (Date.now() - loanDetails.loanOriginDate.getTime()) / 86_400_000
    );

    const valuationConfidence = this.calculateValuationConfidence(comparables.length, daysSinceLoan);
    const marketTrend = this.analyzeMarketTrend(comparables);

    return {
      currentMarketValue: marketValue,
      loanToValueRatio: ltvRatio,
      valuationConfidence,
      comparableProperties: comparables,
      marketTrend,
      recommendations: this.generateValuationRecommendations(ltvRatio, marketTrend, valuationConfidence),
    };
  }

  // ============================================================================
  // Title Chain Audit
  // ============================================================================

  /**
   * Perform deep historical ownership verification.
   * Key for detecting fraudulent transfers (e.g., Mwangi vs. Mount Pleasant case).
   */
  async auditTitleChain(propertyId: string): Promise<{
    ownershipHistory: OwnershipRecord[];
    chainIntegrity: 'valid' | 'broken' | 'suspicious';
    gaps: TitleGap[];
    fraudIndicators: FraudIndicator[];
    registryConsistency: 'consistent' | 'mismatch' | 'unknown';
  }> {
    const [digitalHistory, physicalHistory] = await Promise.all([
      this.fetchDigitalOwnershipHistory(propertyId),
      this.fetchPhysicalOwnershipHistory(propertyId),
    ]);

    const gaps = this.identifyTitleGaps(digitalHistory, physicalHistory);
    const fraudIndicators = this.detectFraudIndicators(digitalHistory, physicalHistory);

    let chainIntegrity: 'valid' | 'broken' | 'suspicious' = 'valid';
    if (gaps.length > 0) {
      chainIntegrity = gaps.some((g) => g.severity === 'critical') ? 'broken' : 'suspicious';
    }

    return {
      ownershipHistory: this.mergeOwnershipHistories(digitalHistory, physicalHistory),
      chainIntegrity,
      gaps,
      fraudIndicators,
      registryConsistency: this.checkRegistryConsistency(digitalHistory, physicalHistory),
    };
  }

  // ============================================================================
  // Recovery Recommendation Engine
  // ============================================================================

  /**
   * Generate a data-driven recovery recommendation for an NPL property.
   */
  async generateRecoveryRecommendation(
    nplProperty: NPLProperty,
    marketConditions: MarketConditions,
    riskAssessment: NPLRiskAssessment
  ): Promise<RecoveryRecommendation> {
    const recoveryRate = this.estimateRecoveryRate(nplProperty, marketConditions, riskAssessment);
    const action = this.determineOptimalAction(nplProperty, recoveryRate, riskAssessment);

    return {
      action,
      estimatedRecoveryAmount: nplProperty.outstandingBalance * (recoveryRate / 100),
      estimatedRecoveryRate: recoveryRate,
      confidence: this.calculateRecommendationConfidence(riskAssessment),
      rationale: this.generateRationale(action, nplProperty, marketConditions),
      timeToRecovery: this.estimateTimeToRecovery(action, marketConditions),
      marketConditions,
      risks: this.identifyRecoveryRisks(nplProperty, action, riskAssessment),
      alternativeActions: this.generateAlternativeActions(nplProperty, action, marketConditions),
    };
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  /**
   * Process a bulk NPL property upload parsed from CSV.
   */
  async processBulkUpload(
    bankId: string,
    records: NPLImportRow[]
  ): Promise<NPLBulkUpload> {
    const uploadId = `upload_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`;
    const errors: NPLBulkUpload['errors'] = [];
    let processedCount = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const validated = this.validateImportRow(row, i + 2); // +2: 1-indexed + header row
        if (validated.errors.length > 0) {
          errors.push(...validated.errors);
          continue;
        }
        await this.createNPLProperty(bankId, validated.data);
        processedCount++;
      } catch (error) {
        errors.push({
          rowNumber: i + 2,
          field: 'general',
          error: error instanceof Error ? error.message : 'Unknown error',
          rawValue: JSON.stringify(row),
        });
      }
    }

    const status: NPLBulkUpload['status'] =
      errors.length === 0 ? 'completed'
      : processedCount === 0 ? 'failed'
      : 'partial';

    return {
      uploadId,
      bankId,
      fileName: 'bulk_upload.csv',
      uploadedAt: new Date(),
      totalRecords: records.length,
      processedRecords: processedCount,
      failedRecords: errors.length,
      status,
      errors,
    };
  }

  // ============================================================================
  // Portfolio Analytics
  // ============================================================================

  /**
   * Generate an aggregated portfolio summary for the bank dashboard.
   */
  async generatePortfolioSummary(properties: NPLProperty[]): Promise<PortfolioSummary> {
    const totalOutstandingBalance = properties.reduce((sum, p) => sum + p.outstandingBalance, 0);

    const totalEstimatedRecovery = properties.reduce((sum, p) => {
      return sum + (p.recoveryRecommendation?.estimatedRecoveryAmount ?? 0);
    }, 0);

    const propertiesWithRegistryIssues = properties.filter(
      (p) =>
        p.riskAssessment?.registryRisk.level === 'critical' ||
        p.riskAssessment?.registryRisk.level === 'high'
    ).length;

    return {
      totalProperties: properties.length,
      totalOutstandingBalance,
      totalEstimatedRecovery,
      averageRecoveryRate:
        totalOutstandingBalance > 0
          ? (totalEstimatedRecovery / totalOutstandingBalance) * 100
          : 0,
      byStatus: this.countByKey(this.groupBy(properties, 'verificationStatus')),
      byPriority: this.countByKey(this.groupBy(properties, 'verificationPriority')),
      byRiskLevel: this.countRiskLevels(properties),
      propertiesWithRegistryIssues,
    };
  }

  // ============================================================================
  // Private: Recovery Logic
  // ============================================================================

  /**
   * Select the optimal recovery action based on risk assessment and recovery rate.
   */
  private determineOptimalAction(
    property: NPLProperty,
    recoveryRate: number,
    riskAssessment: NPLRiskAssessment
  ): RecoveryAction {
    // Registry or title issues require legal resolution first
    if (
      riskAssessment.registryRisk.level === 'critical' ||
      riskAssessment.titleRisk.level === 'critical'
    ) {
      return 'legal_action';
    }

    if (recoveryRate < 20) return 'write_off';
    if (recoveryRate < 40) return property.daysInDefault > 365 ? 'auction' : 'hold';
    if (recoveryRate < 60) return property.daysInDefault > 180 ? 'sell_marketed' : 'restructure_loan';
    if (recoveryRate < 80) return 'sell_marketed';
    return 'sell_immediate';
  }

  private estimateRecoveryRate(
    property: NPLProperty,
    market: MarketConditions,
    risk: NPLRiskAssessment
  ): number {
    let rate = 70;

    if (market.trend === 'declining') rate -= 15;
    if (market.trend === 'rising')   rate += 10;

    if (risk.overallRiskLevel === 'critical') rate -= 30;
    if (risk.overallRiskLevel === 'high')     rate -= 20;

    if (risk.registryRisk.level === 'critical') rate -= 25;

    return Math.max(rate, 10);
  }

  private calculateRecommendationConfidence(risk: NPLRiskAssessment): number {
    let confidence = 85;
    if (risk.overallRiskLevel === 'critical') confidence -= 30;
    if (risk.overallRiskLevel === 'high')     confidence -= 15;
    return Math.max(confidence, 40);
  }

  private generateRationale(
    action: RecoveryAction,
    property: NPLProperty,
    market: MarketConditions
  ): string {
    const rationales: Record<RecoveryAction, string> = {
      sell_immediate:   `Quick sale recommended given ${market.trend} market conditions and ${property.daysInDefault} days in default.`,
      sell_marketed:    `Full marketing campaign recommended to maximise recovery in a ${market.demandLevel} demand market.`,
      restructure_loan: `Loan restructuring may preserve the banking relationship and recover more than a forced sale.`,
      write_off:        `Collateral value is unlikely to cover the outstanding balance. Write-off minimises further losses.`,
      hold:             `Current market conditions suggest waiting for improvement before initiating a sale.`,
      legal_action:     `Title or registry issues must be resolved legally before any recovery action can proceed.`,
      auction:          `Auction recommended to accelerate recovery following an extended default period.`,
    };
    return rationales[action];
  }

  private estimateTimeToRecovery(
    action: RecoveryAction,
    market: MarketConditions
  ): RecoveryRecommendation['timeToRecovery'] {
    const estimates: Record<RecoveryAction, { min: number; max: number; likely: number }> = {
      sell_immediate:   { min: 1,  max: 3,  likely: 2  },
      sell_marketed:    { min: 3,  max: 9,  likely: 6  },
      restructure_loan: { min: 6,  max: 24, likely: 12 },
      write_off:        { min: 1,  max: 3,  likely: 1  },
      hold:             { min: 12, max: 36, likely: 18 },
      legal_action:     { min: 12, max: 48, likely: 24 },
      auction:          { min: 2,  max: 6,  likely: 3  },
    };
    const est = estimates[action];
    return {
      minMonths: est.min,
      maxMonths: est.max,
      mostLikelyMonths: est.likely,
      factors: [`Market demand: ${market.demandLevel}`, `Market trend: ${market.trend}`],
    };
  }

  private identifyRecoveryRisks(
    _property: NPLProperty,
    _action: RecoveryAction,
    risk: NPLRiskAssessment
  ): RecoveryRisk[] {
    const risks: RecoveryRisk[] = [];

    if (risk.registryRisk.level !== 'low') {
      risks.push({
        type: 'registry_mismatch',
        severity: risk.registryRisk.level === 'critical' ? 'high' : 'medium',
        description: 'Physical and digital registry records may not match.',
        mitigationStrategy: 'Obtain a blockchain-anchored proof before proceeding.',
      });
    }

    return risks;
  }

  private generateAlternativeActions(
    _property: NPLProperty,
    primaryAction: RecoveryAction,
    _market: MarketConditions
  ): RecoveryRecommendation['alternativeActions'] {
    // TODO: Expand with ranked alternatives derived from recoveryRate brackets
    return [];
  }

  // ============================================================================
  // Private: Valuation Helpers
  // ============================================================================

  /** TODO (production): Replace with live property valuation API call. */
  private async fetchMarketValue(_propertyId: string): Promise<number> {
    return 15_000_000; // KES 15M
  }

  /** TODO (production): Replace with live comparable-sales database query. */
  private async fetchComparableProperties(_propertyId: string): Promise<ComparableProperty[]> {
    return [
      { propertyId: 'comp_1', soldPrice: 14_500_000, soldDate: new Date('2025-11-15'), distanceKm: 0.5 },
      { propertyId: 'comp_2', soldPrice: 16_000_000, soldDate: new Date('2025-10-20'), distanceKm: 1.2 },
    ];
  }

  private calculateValuationConfidence(comparableCount: number, daysSinceLoan: number): number {
    let confidence = 50;
    confidence += Math.min(comparableCount * 10, 30);
    confidence += daysSinceLoan < 180 ? 10 : 0;
    return Math.min(confidence, 95);
  }

  /**
   * Derive market trend from the price trajectory of comparable sales.
   * Requires at least 2 comparables; falls back to 'stable'.
   */
  private analyzeMarketTrend(comparables: ComparableProperty[]): MarketConditions['trend'] {
    if (comparables.length < 2) return 'stable';

    // Sort by sale date (oldest first) and compare first vs last price
    const sorted = [...comparables].sort(
      (a, b) => a.soldDate.getTime() - b.soldDate.getTime()
    );
    const oldest = sorted[0].soldPrice;
    const newest = sorted[sorted.length - 1].soldPrice;
    const changePct = ((newest - oldest) / oldest) * 100;

    if (changePct > 5)  return 'rising';
    if (changePct < -5) return 'declining';
    return 'stable';
  }

  private generateValuationRecommendations(
    ltvRatio: number,
    marketTrend: MarketConditions['trend'],
    confidence: number
  ): string[] {
    const recommendations: string[] = [];
    if (ltvRatio > 100) {
      recommendations.push('Property is underwater — consider restructuring or write-off.');
    }
    if (marketTrend === 'declining') {
      recommendations.push('Market is declining — expedite sale to preserve collateral value.');
    }
    if (confidence < 70) {
      recommendations.push('Low valuation confidence — recommend physical inspection and formal appraisal.');
    }
    return recommendations;
  }

  // ============================================================================
  // Private: Title Chain Helpers
  // ============================================================================

  /** TODO (production): Fetch from lands.go.ke digital registry API. */
  private async fetchDigitalOwnershipHistory(_propertyId: string): Promise<OwnershipRecord[]> {
    return [];
  }

  /** TODO (production): Fetch from physical registry scan/OCR pipeline. */
  private async fetchPhysicalOwnershipHistory(_propertyId: string): Promise<OwnershipRecord[]> {
    return [];
  }

  private identifyTitleGaps(
    _digital: OwnershipRecord[],
    _physical: OwnershipRecord[]
  ): TitleGap[] {
    // TODO: Identify date gaps between consecutive ownership records
    return [];
  }

  private detectFraudIndicators(
    _digital: OwnershipRecord[],
    _physical: OwnershipRecord[]
  ): FraudIndicator[] {
    // TODO: Flag rapid transfers, company↔individual flips, back-dated entries, etc.
    return [];
  }

  private checkRegistryConsistency(
    digital: OwnershipRecord[],
    physical: OwnershipRecord[]
  ): 'consistent' | 'mismatch' | 'unknown' {
    if (digital.length === 0 || physical.length === 0) return 'unknown';
    // TODO: Field-level comparison of overlapping ownership periods
    return 'unknown';
  }

  /**
   * Merge digital and physical ownership records, deduplicated by ownerId + source,
   * sorted chronologically by acquisition date.
   */
  private mergeOwnershipHistories(
    digital: OwnershipRecord[],
    physical: OwnershipRecord[]
  ): OwnershipRecord[] {
    const seen = new Set<string>();
    const merged: OwnershipRecord[] = [];

    for (const record of [...digital, ...physical]) {
      const key = `${record.ownerId}::${record.source}::${record.acquisitionDate.toISOString()}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(record);
      }
    }

    return merged.sort((a, b) => a.acquisitionDate.getTime() - b.acquisitionDate.getTime());
  }

  // ============================================================================
  // Private: Bulk Upload Helpers
  // ============================================================================

  private validateImportRow(
    row: NPLImportRow,
    rowNumber: number
  ): { data: NPLImportRow; errors: NPLBulkUpload['errors'] } {
    const errors: NPLBulkUpload['errors'] = [];

    if (!row.loan_id) {
      errors.push({ rowNumber, field: 'loan_id', error: 'Loan ID is required', rawValue: '' });
    }
    if (!row.outstanding_balance || row.outstanding_balance <= 0) {
      errors.push({
        rowNumber,
        field: 'outstanding_balance',
        error: 'Outstanding balance must be a positive number',
        rawValue: String(row.outstanding_balance),
      });
    }

    return { data: row, errors };
  }

  /** TODO (production): Persist NPL property record to the database. */
  private async createNPLProperty(_bankId: string, _data: NPLImportRow): Promise<void> {
    // Integration point: insert into DB via repository layer
  }

  // ============================================================================
  // Private: Generic Utilities
  // ============================================================================

  private groupBy<T, K extends keyof T>(items: T[], key: K): Record<string, T[]> {
    return items.reduce((acc, item) => {
      const k = String(item[key]);
      (acc[k] ??= []).push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  private countByKey<T>(grouped: Record<string, T[]>): Record<string, number> {
    return Object.fromEntries(
      Object.entries(grouped).map(([k, v]) => [k, v.length])
    );
  }

  private countRiskLevels(properties: NPLProperty[]): Record<string, number> {
    return properties.reduce((acc, p) => {
      const level = p.riskAssessment?.overallRiskLevel ?? 'unknown';
      acc[level] = (acc[level] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Export singleton instance
export const nplVerificationService = new NPLVerificationService();