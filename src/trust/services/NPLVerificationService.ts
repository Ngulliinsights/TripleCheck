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
// NPL Verification Service
// ============================================================================

export class NPLVerificationService {
  private readonly apiBaseUrl = '/api/npl';

  // ============================================================================
  // Collateral Valuation
  // ============================================================================

  /**
   * Assess current market value of collateral property
   */
  async assessCollateralValue(
    propertyId: string,
    loanDetails: {
      originalLoanAmount: number;
      outstandingBalance: number;
      loanOriginDate: Date;
    }
  ): Promise<{
    currentMarketValue: number;
    loanToValueRatio: number;
    valuationConfidence: number;
    comparableProperties: ComparableProperty[];
    marketTrend: MarketConditions['trend'];
    recommendations: string[];
  }> {
    // In production, this would call property valuation APIs
    // For now, simulate with business logic

    const marketValue = await this.fetchMarketValue(propertyId);
    const comparables = await this.fetchComparableProperties(propertyId);

    const ltvRatio = (loanDetails.outstandingBalance / marketValue) * 100;
    const daysSinceLoan = Math.floor(
      (Date.now() - loanDetails.loanOriginDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate confidence based on available data
    const valuationConfidence = this.calculateValuationConfidence(
      comparables.length,
      daysSinceLoan
    );

    // Determine market trend from comparables
    const marketTrend = this.analyzeMarketTrend(comparables);

    // Generate recommendations
    const recommendations = this.generateValuationRecommendations(
      ltvRatio,
      marketTrend,
      valuationConfidence
    );

    return {
      currentMarketValue: marketValue,
      loanToValueRatio: ltvRatio,
      valuationConfidence,
      comparableProperties: comparables,
      marketTrend,
      recommendations,
    };
  }

  // ============================================================================
  // Title Chain Audit
  // ============================================================================

  /**
   * Perform deep historical ownership verification
   * Key for detecting fraudulent transfers (e.g., Mwangi vs Mount Pleasant case)
   */
  async auditTitleChain(propertyId: string): Promise<{
    ownershipHistory: OwnershipRecord[];
    chainIntegrity: 'valid' | 'broken' | 'suspicious';
    gaps: TitleGap[];
    fraudIndicators: FraudIndicator[];
    registryConsistency: 'consistent' | 'mismatch' | 'unknown';
  }> {
    // Fetch ownership history from multiple sources
    const digitalHistory = await this.fetchDigitalOwnershipHistory(propertyId);
    const physicalHistory = await this.fetchPhysicalOwnershipHistory(propertyId);

    // Compare and find gaps
    const gaps = this.identifyTitleGaps(digitalHistory, physicalHistory);
    const fraudIndicators = this.detectFraudIndicators(digitalHistory, physicalHistory);

    // Determine chain integrity
    let chainIntegrity: 'valid' | 'broken' | 'suspicious' = 'valid';
    if (gaps.length > 0) {
      chainIntegrity = gaps.some((g) => g.severity === 'critical') ? 'broken' : 'suspicious';
    }

    // Check registry consistency
    const registryConsistency = this.checkRegistryConsistency(digitalHistory, physicalHistory);

    return {
      ownershipHistory: this.mergeOwnershipHistories(digitalHistory, physicalHistory),
      chainIntegrity,
      gaps,
      fraudIndicators,
      registryConsistency,
    };
  }

  // ============================================================================
  // Recovery Recommendation Engine
  // ============================================================================

  /**
   * Generate AI-powered recovery recommendation
   */
  async generateRecoveryRecommendation(
    nplProperty: NPLProperty,
    marketConditions: MarketConditions,
    riskAssessment: NPLRiskAssessment
  ): Promise<RecoveryRecommendation> {
    const recoveryRate = this.estimateRecoveryRate(nplProperty, marketConditions, riskAssessment);
    const action = this.determineOptimalAction(nplProperty, recoveryRate, riskAssessment);
    const timeToRecovery = this.estimateTimeToRecovery(action, marketConditions);
    const risks = this.identifyRecoveryRisks(nplProperty, action, riskAssessment);
    const alternatives = this.generateAlternativeActions(nplProperty, action, marketConditions);

    return {
      action,
      estimatedRecoveryAmount: nplProperty.outstandingBalance * (recoveryRate / 100),
      estimatedRecoveryRate: recoveryRate,
      confidence: this.calculateRecommendationConfidence(riskAssessment),
      rationale: this.generateRationale(action, nplProperty, marketConditions),
      timeToRecovery,
      marketConditions,
      risks,
      alternativeActions: alternatives,
    };
  }

  /**
   * Determine optimal recovery action based on multiple factors
   */
  private determineOptimalAction(
    property: NPLProperty,
    recoveryRate: number,
    riskAssessment: NPLRiskAssessment
  ): RecoveryAction {
    // Critical risk factors
    if (riskAssessment.registryRisk.level === 'critical') {
      return 'legal_action'; // Registry issues require legal resolution
    }

    if (riskAssessment.titleRisk.level === 'critical') {
      return 'legal_action';
    }

    // Recovery rate-based decisions
    if (recoveryRate < 20) {
      return 'write_off';
    }

    if (recoveryRate < 40) {
      return property.daysInDefault > 365 ? 'auction' : 'hold';
    }

    if (recoveryRate < 60) {
      return property.daysInDefault > 180 ? 'sell_marketed' : 'restructure_loan';
    }

    if (recoveryRate < 80) {
      return 'sell_marketed';
    }

    // High recovery potential
    return 'sell_immediate';
  }

  // ============================================================================
  // Bulk Operations
  // ============================================================================

  /**
   * Process bulk NPL property upload from CSV
   */
  async processBulkUpload(
    bankId: string,
    records: NPLImportRow[]
  ): Promise<NPLBulkUpload> {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errors: NPLBulkUpload['errors'] = [];
    let processedCount = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        // Validate and transform row
        const validated = this.validateImportRow(row, i + 2); // +2 for header row
        if (validated.errors.length > 0) {
          errors.push(...validated.errors);
          continue;
        }

        // Create NPL property record
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

    return {
      uploadId,
      bankId,
      fileName: 'bulk_upload.csv',
      uploadedAt: new Date(),
      totalRecords: records.length,
      processedRecords: processedCount,
      failedRecords: errors.length,
      status: errors.length === 0 ? 'completed' : (processedCount > 0 ? 'completed' : 'failed'),
      errors,
    };
  }

  // ============================================================================
  // Portfolio Analytics
  // ============================================================================

  /**
   * Generate portfolio summary for bank dashboard
   */
  async generatePortfolioSummary(properties: NPLProperty[]): Promise<PortfolioSummary> {
    const totalOutstandingBalance = properties.reduce((sum, p) => sum + p.outstandingBalance, 0);

    // Calculate estimated recovery for completed verifications
    let totalEstimatedRecovery = 0;
    for (const prop of properties) {
      if (prop.recoveryRecommendation) {
        totalEstimatedRecovery += prop.recoveryRecommendation.estimatedRecoveryAmount;
      }
    }

    const byStatus = this.groupBy(properties, 'verificationStatus');
    const byPriority = this.groupBy(properties, 'verificationPriority');

    const propertiesWithRegistryIssues = properties.filter(
      (p) => p.riskAssessment?.registryRisk.level === 'critical' ||
             p.riskAssessment?.registryRisk.level === 'high'
    ).length;

    return {
      totalProperties: properties.length,
      totalOutstandingBalance,
      totalEstimatedRecovery,
      averageRecoveryRate: totalOutstandingBalance > 0
        ? (totalEstimatedRecovery / totalOutstandingBalance) * 100
        : 0,
      byStatus: this.countByKey(byStatus),
      byPriority: this.countByKey(byPriority),
      byRiskLevel: this.countRiskLevels(properties),
      propertiesWithRegistryIssues,
    };
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private async fetchMarketValue(propertyId: string): Promise<number> {
    // Simulated - would call valuation API
    return 15000000; // KES 15M
  }

  private async fetchComparableProperties(propertyId: string): Promise<ComparableProperty[]> {
    // Simulated - would fetch from property database
    return [
      { propertyId: 'comp_1', soldPrice: 14500000, soldDate: new Date('2025-11-15'), distanceKm: 0.5 },
      { propertyId: 'comp_2', soldPrice: 16000000, soldDate: new Date('2025-10-20'), distanceKm: 1.2 },
    ];
  }

  private calculateValuationConfidence(comparableCount: number, daysSinceLoan: number): number {
    let confidence = 50;
    confidence += Math.min(comparableCount * 10, 30);
    confidence += daysSinceLoan < 180 ? 10 : 0;
    return Math.min(confidence, 95);
  }

  private analyzeMarketTrend(comparables: ComparableProperty[]): MarketConditions['trend'] {
    if (comparables.length < 2) return 'stable';
    // Simplified trend analysis
    return 'stable';
  }

  private generateValuationRecommendations(
    ltvRatio: number,
    marketTrend: MarketConditions['trend'],
    confidence: number
  ): string[] {
    const recommendations: string[] = [];
    if (ltvRatio > 100) {
      recommendations.push('Property is underwater - consider restructuring or write-off');
    }
    if (marketTrend === 'declining') {
      recommendations.push('Market is declining - expedite sale to preserve value');
    }
    if (confidence < 70) {
      recommendations.push('Low confidence in valuation - recommend physical inspection');
    }
    return recommendations;
  }

  private async fetchDigitalOwnershipHistory(propertyId: string): Promise<OwnershipRecord[]> {
    return [];
  }

  private async fetchPhysicalOwnershipHistory(propertyId: string): Promise<OwnershipRecord[]> {
    return [];
  }

  private identifyTitleGaps(digital: OwnershipRecord[], physical: OwnershipRecord[]): TitleGap[] {
    return [];
  }

  private detectFraudIndicators(digital: OwnershipRecord[], physical: OwnershipRecord[]): FraudIndicator[] {
    return [];
  }

  private checkRegistryConsistency(digital: OwnershipRecord[], physical: OwnershipRecord[]): 'consistent' | 'mismatch' | 'unknown' {
    return 'unknown';
  }

  private mergeOwnershipHistories(digital: OwnershipRecord[], physical: OwnershipRecord[]): OwnershipRecord[] {
    return [...digital, ...physical];
  }

  private estimateRecoveryRate(
    property: NPLProperty,
    market: MarketConditions,
    risk: NPLRiskAssessment
  ): number {
    let baseRate = 70;

    // Adjust for market conditions
    if (market.trend === 'declining') baseRate -= 15;
    if (market.trend === 'rising') baseRate += 10;

    // Adjust for risk
    if (risk.overallRiskLevel === 'critical') baseRate -= 30;
    if (risk.overallRiskLevel === 'high') baseRate -= 20;

    // Adjust for registry issues
    if (risk.registryRisk.level === 'critical') baseRate -= 25;

    return Math.max(baseRate, 10);
  }

  private calculateRecommendationConfidence(risk: NPLRiskAssessment): number {
    let confidence = 85;
    if (risk.overallRiskLevel === 'critical') confidence -= 30;
    if (risk.overallRiskLevel === 'high') confidence -= 15;
    return Math.max(confidence, 40);
  }

  private generateRationale(
    action: RecoveryAction,
    property: NPLProperty,
    market: MarketConditions
  ): string {
    const rationales: Record<RecoveryAction, string> = {
      sell_immediate: `Quick sale recommended due to ${market.trend} market and ${property.daysInDefault} days in default.`,
      sell_marketed: `Full marketing campaign recommended to maximize recovery in a ${market.demandLevel} demand market.`,
      restructure_loan: `Loan restructuring may preserve relationship and recover more than forced sale.`,
      write_off: `Property value unlikely to recover loan balance. Write-off minimizes further losses.`,
      hold: `Market conditions suggest waiting for improvement before sale.`,
      legal_action: `Title or registry issues require legal resolution before recovery action.`,
      auction: `Auction recommended to accelerate recovery after extended default period.`,
    };
    return rationales[action];
  }

  private estimateTimeToRecovery(action: RecoveryAction, market: MarketConditions): RecoveryRecommendation['timeToRecovery'] {
    const estimates: Record<RecoveryAction, { min: number; max: number; likely: number }> = {
      sell_immediate: { min: 1, max: 3, likely: 2 },
      sell_marketed: { min: 3, max: 9, likely: 6 },
      restructure_loan: { min: 6, max: 24, likely: 12 },
      write_off: { min: 1, max: 3, likely: 1 },
      hold: { min: 12, max: 36, likely: 18 },
      legal_action: { min: 12, max: 48, likely: 24 },
      auction: { min: 2, max: 6, likely: 3 },
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
    property: NPLProperty,
    action: RecoveryAction,
    risk: NPLRiskAssessment
  ): RecoveryRisk[] {
    const risks: RecoveryRisk[] = [];

    if (risk.registryRisk.level !== 'low') {
      risks.push({
        type: 'registry_mismatch',
        severity: risk.registryRisk.level === 'critical' ? 'high' : 'medium',
        description: 'Physical and digital registry records may not match',
        mitigationStrategy: 'Obtain blockchain-anchored proof before proceeding',
      });
    }

    return risks;
  }

  private generateAlternativeActions(
    property: NPLProperty,
    primaryAction: RecoveryAction,
    market: MarketConditions
  ): RecoveryRecommendation['alternativeActions'] {
    return [];
  }

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
        error: 'Outstanding balance must be positive',
        rawValue: String(row.outstanding_balance),
      });
    }

    return { data: row, errors };
  }

  private async createNPLProperty(bankId: string, data: NPLImportRow): Promise<void> {
    // Would create record in database
  }

  private groupBy<T, K extends keyof T>(items: T[], key: K): Record<string, T[]> {
    return items.reduce((acc, item) => {
      const k = String(item[key]);
      if (!acc[k]) acc[k] = [];
      acc[k].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  }

  private countByKey<T>(grouped: Record<string, T[]>): Record<string, number> {
    return Object.entries(grouped).reduce((acc, [key, items]) => {
      acc[key] = items.length;
      return acc;
    }, {} as Record<string, number>);
  }

  private countRiskLevels(properties: NPLProperty[]): Record<string, number> {
    return properties.reduce((acc, p) => {
      const level = p.riskAssessment?.overallRiskLevel || 'unknown';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface ComparableProperty {
  propertyId: string;
  soldPrice: number;
  soldDate: Date;
  distanceKm: number;
}

interface OwnershipRecord {
  ownerId: string;
  ownerName: string;
  acquisitionDate: Date;
  disposalDate?: Date;
  acquisitionType: 'purchase' | 'inheritance' | 'gift' | 'court_order' | 'unknown';
  source: 'digital' | 'physical';
  documentReference?: string;
}

interface TitleGap {
  fromDate: Date;
  toDate: Date;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface FraudIndicator {
  type: string;
  description: string;
  confidence: number;
  evidence: string[];
}

// Export singleton instance
export const nplVerificationService = new NPLVerificationService();
