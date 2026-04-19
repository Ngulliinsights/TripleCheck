/**
 * NPL (Non-Performing Loan) Verification Types
 *
 * Specialized types for bank NPL recovery verification workflow.
 * Used by banks to assess collateral value and recovery potential.
 */

// ============================================================================
// Core NPL Property Types
// ============================================================================

/**
 * Represents a property that serves as collateral for a non-performing loan
 */
export interface NPLProperty {
  readonly id: string;
  readonly loanId: string;
  readonly bankClientId: string;
  readonly propertyId: string;

  // Loan Details
  readonly originalLoanAmount: number;
  readonly outstandingBalance: number;
  readonly loanCurrency: 'KES' | 'USD' | 'EUR';
  readonly loanOriginDate: Date;
  readonly defaultDate: Date;
  readonly daysInDefault: number;

  // Property Classification
  readonly collateralType: CollateralType;
  readonly propertyClassification: PropertyClassification;

  // Verification Status
  readonly verificationStatus: NPLVerificationStatus;
  readonly verificationPriority: VerificationPriority;
  readonly assignedVerifierId?: string;
  readonly verificationStartDate?: Date;
  readonly verificationCompletedDate?: Date;

  // Results
  readonly recoveryRecommendation?: RecoveryRecommendation;
  readonly riskAssessment?: NPLRiskAssessment;
  readonly registryProof?: RegistryProofSnapshot;
}

export type CollateralType = 'residential' | 'commercial' | 'land' | 'industrial' | 'mixed' | 'agricultural';

export type PropertyClassification =
  | 'prime'        // High-value, central location
  | 'suburban'     // Residential suburbs
  | 'peri-urban'   // Growing areas at city edges
  | 'rural'        // Remote/agricultural
  | 'distressed';  // Known issues

export type NPLVerificationStatus =
  | 'pending_submission'
  | 'submitted'
  | 'in_verification'
  | 'expert_review'
  | 'registry_check'
  | 'community_validation'
  | 'completed'
  | 'disputed'
  | 'on_hold';

export type VerificationPriority = 'critical' | 'high' | 'medium' | 'low';

// ============================================================================
// Recovery Recommendation Types
// ============================================================================

export interface RecoveryRecommendation {
  readonly action: RecoveryAction;
  readonly estimatedRecoveryAmount: number;
  readonly estimatedRecoveryRate: number; // Percentage of outstanding balance
  readonly confidence: number; // 0-100 confidence score
  readonly rationale: string;
  readonly timeToRecovery: TimeToRecovery;
  readonly marketConditions: MarketConditions;
  readonly risks: RecoveryRisk[];
  readonly alternativeActions: AlternativeAction[];
}

export type RecoveryAction =
  | 'sell_immediate'       // Quick sale, potentially below market
  | 'sell_marketed'        // Full marketing for best price
  | 'restructure_loan'     // Work with borrower on new terms
  | 'write_off'           // Unrecoverable, take the loss
  | 'hold'                // Wait for market improvement
  | 'legal_action'        // Pursue through courts
  | 'auction';            // Forced sale via auction

export interface TimeToRecovery {
  readonly minMonths: number;
  readonly maxMonths: number;
  readonly mostLikelyMonths: number;
  readonly factors: string[];
}

export interface MarketConditions {
  readonly trend: 'rising' | 'stable' | 'declining' | 'volatile';
  readonly demandLevel: 'high' | 'moderate' | 'low';
  readonly comparableSalesCount: number;
  readonly averageDaysOnMarket: number;
  readonly pricePerSqftTrend: number; // Percentage change YoY
  readonly localEconomicFactors: string[];
}

export interface RecoveryRisk {
  readonly type: RecoveryRiskType;
  readonly severity: 'high' | 'medium' | 'low';
  readonly description: string;
  readonly mitigationStrategy: string;
}

export type RecoveryRiskType =
  | 'title_defect'
  | 'encumbrance'
  | 'dispute'
  | 'market_decline'
  | 'environmental'
  | 'structural'
  | 'legal'
  | 'political'
  | 'registry_mismatch';  // Critical: physical/digital discrepancy

export interface AlternativeAction {
  readonly action: RecoveryAction;
  readonly estimatedRecovery: number;
  readonly pros: string[];
  readonly cons: string[];
}

// ============================================================================
// Risk Assessment Types
// ============================================================================

export interface NPLRiskAssessment {
  readonly overallRiskLevel: 'critical' | 'high' | 'medium' | 'low';
  readonly overallRiskScore: number; // 0-100
  readonly titleRisk: RiskDimension;
  readonly marketRisk: RiskDimension;
  readonly legalRisk: RiskDimension;
  readonly physicalRisk: RiskDimension;
  readonly registryRisk: RegistryRiskDimension; // Special: digital/physical gap
  readonly fraudRisk: RiskDimension;
  readonly lastAssessmentDate: Date;
  readonly assessedBy: string;
}

export interface RiskDimension {
  readonly score: number; // 0-100
  readonly level: 'critical' | 'high' | 'medium' | 'low';
  readonly factors: string[];
  readonly recommendations: string[];
}

/**
 * Special risk dimension for registry physical/digital transition issues
 */
export interface RegistryRiskDimension extends RiskDimension {
  readonly registryState: RegistryState;
  readonly lastPhysicalCheckDate?: Date;
  readonly lastDigitalCheckDate?: Date;
  readonly discrepanciesFound: RegistryDiscrepancy[];
  readonly proofAvailable: boolean;
}

export type RegistryState =
  | 'physical_only'     // Only exists in paper registry
  | 'digital_only'      // Only exists in digital registry (suspicious)
  | 'both_consistent'   // Both exist and match
  | 'both_mismatch'     // CRITICAL: They don't match
  | 'unknown';          // Not yet checked

export interface RegistryDiscrepancy {
  readonly field: string;
  readonly physicalValue: string;
  readonly digitalValue: string;
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
  readonly possibleCause: string;
}

// ============================================================================
// Registry Proof Types (Blockchain Anchored)
// ============================================================================

/**
 * Immutable proof of registry state at a point in time
 */
export interface RegistryProofSnapshot {
  readonly id: string;
  readonly propertyId: string;
  readonly snapshotHash: string;           // SHA-256 of all data
  readonly createdAt: Date;

  // Sources captured
  readonly physicalRecordCapture?: PhysicalRecordCapture;
  readonly digitalRecordCapture?: DigitalRecordCapture;

  // Blockchain anchoring
  readonly blockchainAnchor?: BlockchainAnchor;

  // Witness attestations
  readonly witnessSignatures: WitnessSignature[];

  // Verification
  readonly verificationResult: RegistryState;
  readonly findings: string[];
}

export interface PhysicalRecordCapture {
  readonly photographUrl: string;
  readonly scannedDocumentUrl: string;
  readonly capturedAt: Date;
  readonly capturedBy: string;           // Witness ID
  readonly location: GeoLocation;
  readonly registryOffice: string;
  readonly bookNumber?: string;
  readonly pageNumber?: string;
}

export interface DigitalRecordCapture {
  readonly apiResponseHash: string;
  readonly capturedAt: Date;
  readonly sourceRegistry: 'lands.go.ke' | 'ardhisasa' | 'county_registry' | 'other';
  readonly ownerName: string;
  readonly titleNumber: string;
  readonly encumbrances: string[];
  readonly rawResponse: Record<string, unknown>;
}

export interface BlockchainAnchor {
  readonly chain: 'polygon' | 'ethereum' | 'base';
  readonly transactionHash: string;
  readonly blockNumber: number;
  readonly timestamp: Date;
  readonly verificationUrl: string; // Polygonscan/Etherscan link
}

export interface WitnessSignature {
  readonly witnessId: string;
  readonly witnessType: 'legal_expert' | 'surveyor' | 'valuer' | 'community_elder';
  readonly signature: string;
  readonly signedAt: Date;
  readonly attestation: string;
}

export interface GeoLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracy: number;
}

// ============================================================================
// Bank Portfolio Types
// ============================================================================

export interface NPLPortfolio {
  readonly bankId: string;
  readonly portfolioName: string;
  readonly properties: NPLProperty[];
  readonly summary: PortfolioSummary;
  readonly lastUpdated: Date;
}

export interface PortfolioSummary {
  readonly totalProperties: number;
  readonly totalOutstandingBalance: number;
  readonly totalEstimatedRecovery: number;
  readonly averageRecoveryRate: number;
  readonly byStatus: Record<NPLVerificationStatus, number>;
  readonly byPriority: Record<VerificationPriority, number>;
  readonly byRiskLevel: Record<string, number>;
  readonly propertiesWithRegistryIssues: number;
}

// ============================================================================
// Bulk Operations
// ============================================================================

export interface NPLBulkUpload {
  readonly uploadId: string;
  readonly bankId: string;
  readonly fileName: string;
  readonly uploadedAt: Date;
  readonly totalRecords: number;
  readonly processedRecords: number;
  readonly failedRecords: number;
  readonly status: 'processing' | 'completed' | 'failed' | 'partial';
  readonly errors: BulkUploadError[];
}

export interface BulkUploadError {
  readonly rowNumber: number;
  readonly field: string;
  readonly error: string;
  readonly rawValue: string;
}

// ============================================================================
// CSV Import Schema
// ============================================================================

export interface NPLImportRow {
  loan_id: string;
  property_reference: string;
  original_amount: number;
  outstanding_balance: number;
  currency: 'KES' | 'USD' | 'EUR';
  loan_origin_date: string;
  default_date: string;
  collateral_type: CollateralType;
  property_classification: PropertyClassification;
  priority: VerificationPriority;
  title_number?: string;
  lr_number?: string;
  county?: string;
  address?: string;
  notes?: string;
}
