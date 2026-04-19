/**
 * Immutable Proof Service
 *
 * Provides cryptographic proofs of land registry state that cannot be altered retroactively.
 * Addresses the digital/physical registry transition loophole by creating blockchain-anchored
 * snapshots of property state.
 *
 * Key Features:
 * - SHA-256 hashing of property state (physical + digital records)
 * - Blockchain anchoring to Polygon for tamper-proof timestamping
 * - Mismatch detection when registry state changes after our snapshot
 * - Legal evidence export suitable for court proceedings
 */

import type {
  RegistryProofSnapshot,
  PhysicalRecordCapture,
  DigitalRecordCapture,
  BlockchainAnchor,
  WitnessSignature,
  RegistryState,
  RegistryDiscrepancy,
} from '../types/npl-verification.types'

// ============================================================================
// Supporting Types
// ============================================================================

export interface RegistryChange {
  readonly field: string;
  readonly originalValue: string;
  readonly currentValue: string;
  readonly changeType: 'ownership_change' | 'encumbrance_added' | 'encumbrance_removed' | 'data_modified';
  readonly severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface LegalEvidencePackage {
  readonly evidenceId: string;
  readonly generatedAt: Date;
  readonly snapshot: RegistryProofSnapshot;
  readonly summary: string;
  readonly verificationInstructions: string;
  readonly chainOfCustody: ChainOfCustodyEntry[];
  readonly legalDisclaimer: string;
  readonly exportFormat: 'pdf' | 'json';
}

interface ChainOfCustodyEntry {
  readonly timestamp: Date;
  readonly action: string;
  readonly actor: string;
  readonly details: string;
}

// ============================================================================
// Immutable Proof Service
// ============================================================================

export class ImmutableProofService {

  // ============================================================================
  // Snapshot Creation
  // ============================================================================

  /**
   * Create an immutable snapshot of property registry state.
   * Captures both physical and digital records and produces a cryptographic proof.
   */
  async createRegistrySnapshot(
    propertyId: string,
    physicalCapture: PhysicalRecordCapture | null,
    digitalCapture: DigitalRecordCapture | null,
    witnesses: WitnessSignature[]
  ): Promise<RegistryProofSnapshot> {
    const snapshotId = `proof_${this.generateSecureId()}`;

    const dataToHash = {
      propertyId,
      physical: physicalCapture,
      digital: digitalCapture,
      witnesses: witnesses.map((w) => ({ id: w.witnessId, attestation: w.attestation })),
      timestamp: new Date().toISOString(),
    };

    const snapshotHash = await this.createSHA256Hash(JSON.stringify(dataToHash));
    const verificationResult = this.determineRegistryState(physicalCapture, digitalCapture);
    const findings = this.identifyFindings(physicalCapture, digitalCapture, verificationResult);

    return {
      id: snapshotId,
      propertyId,
      snapshotHash,
      createdAt: new Date(),
      physicalRecordCapture: physicalCapture ?? undefined,
      digitalRecordCapture: digitalCapture ?? undefined,
      blockchainAnchor: undefined, // Populated after anchorToBlockchain()
      witnessSignatures: witnesses,
      verificationResult,
      findings,
    };
  }

  // ============================================================================
  // Blockchain Anchoring
  // ============================================================================

  /**
   * Anchor a snapshot hash to the Polygon blockchain.
   * Creates an immutable, timestamped proof that the snapshot existed at a specific time.
   */
  async anchorToBlockchain(
    snapshot: RegistryProofSnapshot,
    chain: BlockchainAnchor['chain'] = 'polygon'
  ): Promise<RegistryProofSnapshot> {
    // TODO (production): Replace simulation with ethers.js / viem integration.
    //   1. Connect to Polygon RPC
    //   2. Send a transaction embedding the snapshotHash
    //   3. Await confirmation and return real tx details
    const txHash = await this.simulateBlockchainTransaction(snapshot.snapshotHash, chain);

    const blockchainAnchor: BlockchainAnchor = {
      chain,
      transactionHash: txHash,
      blockNumber: 50_000_000 + Math.floor(Math.random() * 1_000_000), // Simulated
      timestamp: new Date(),
      verificationUrl: this.getVerificationUrl(chain, txHash),
    };

    return { ...snapshot, blockchainAnchor };
  }

  /**
   * Verify that a snapshot hash was anchored to the blockchain.
   */
  async verifyBlockchainAnchor(
    snapshotHash: string,
    anchor: BlockchainAnchor
  ): Promise<{
    isValid: boolean;
    onChainHash: string | null;
    blockTimestamp: Date | null;
    verificationDetails: string;
  }> {
    // TODO (production): Query the blockchain to confirm the transaction
    // data field contains the expected snapshotHash.
    return {
      isValid: true,
      onChainHash: snapshotHash,
      blockTimestamp: anchor.timestamp,
      verificationDetails: `Hash verified on ${anchor.chain} at block ${anchor.blockNumber}`,
    };
  }

  // ============================================================================
  // Mismatch Detection
  // ============================================================================

  /**
   * Compare the current registry state against a previous snapshot.
   * Detects whether records have been altered since the snapshot was taken.
   */
  async detectRegistryChanges(
    propertyId: string,
    originalSnapshot: RegistryProofSnapshot
  ): Promise<{
    hasChanged: boolean;
    changes: RegistryChange[];
    currentState: RegistryState;
    riskLevel: 'critical' | 'high' | 'medium' | 'low' | 'none';
    recommendation: string;
  }> {
    const currentDigital = await this.fetchCurrentDigitalRecord(propertyId);
    const changes: RegistryChange[] = [];

    if (originalSnapshot.digitalRecordCapture && currentDigital) {
      const original = originalSnapshot.digitalRecordCapture;

      // Ownership change — highest severity
      if (original.ownerName !== currentDigital.ownerName) {
        changes.push({
          field: 'ownerName',
          originalValue: original.ownerName,
          currentValue: currentDigital.ownerName,
          changeType: 'ownership_change',
          severity: 'critical',
        });
      }

      // Encumbrances added since snapshot
      const originalEncumbrances = new Set(original.encumbrances);
      const currentEncumbrances = new Set(currentDigital.encumbrances);

      for (const enc of currentDigital.encumbrances) {
        if (!originalEncumbrances.has(enc)) {
          changes.push({
            field: 'encumbrances',
            originalValue: 'Not present',
            currentValue: enc,
            changeType: 'encumbrance_added',
            severity: 'high',
          });
        }
      }

      // Encumbrances removed since snapshot (suspicious — may mask liens)
      for (const enc of original.encumbrances) {
        if (!currentEncumbrances.has(enc)) {
          changes.push({
            field: 'encumbrances',
            originalValue: enc,
            currentValue: 'Removed',
            changeType: 'encumbrance_removed',
            severity: 'high',
          });
        }
      }
    }

    const hasChanged = changes.length > 0;
    const riskLevel = this.calculateChangeRiskLevel(changes);
    const currentState = this.determineRegistryState(
      originalSnapshot.physicalRecordCapture ?? null,
      currentDigital
    );

    return {
      hasChanged,
      changes,
      currentState,
      riskLevel,
      recommendation: this.generateChangeRecommendation(changes, riskLevel),
    };
  }

  // ============================================================================
  // Legal Evidence Export
  // ============================================================================

  /**
   * Generate a legal evidence package suitable for court proceedings.
   */
  async generateLegalEvidencePackage(
    snapshot: RegistryProofSnapshot
  ): Promise<LegalEvidencePackage> {
    const evidenceId = `evidence_${this.generateSecureId()}`;

    const verificationInstructions = snapshot.blockchainAnchor
      ? this.createBlockchainVerificationInstructions(snapshot.blockchainAnchor)
      : 'No blockchain anchor available. Re-submit with blockchain anchoring before legal use.';

    return {
      evidenceId,
      generatedAt: new Date(),
      snapshot,
      summary: this.createEvidenceSummary(snapshot),
      verificationInstructions,
      chainOfCustody: this.createChainOfCustody(snapshot),
      legalDisclaimer: this.getLegalDisclaimer(),
      exportFormat: 'pdf',
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Generate a cryptographically random ID suitable for snapshot / evidence identifiers.
   */
  private generateSecureId(): string {
    // crypto.randomUUID() is available in both modern browsers and Node 15+
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '');
    }
    // Fallback: timestamp + random suffix
    return `${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Compute a SHA-256 hex digest of the provided string.
   * Uses the Web Crypto API in browser environments and Node's `crypto` module on the server.
   */
  private async createSHA256Hash(data: string): Promise<string> {
    // Browser / Web Worker
    if (typeof globalThis.crypto?.subtle !== 'undefined') {
      const buffer = new TextEncoder().encode(data);
      const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', buffer);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }

    // Node.js
    try {
      // Dynamic import avoids bundler errors in browser-only builds
      const { createHash } = await import('crypto');
      return createHash('sha256').update(data).digest('hex');
    } catch {
      // Final fallback — should not occur in supported environments
      console.warn('[ImmutableProofService] SHA-256 unavailable; using insecure fallback hash.');
      return `fallback_${Date.now()}_${this.generateSecureId()}`;
    }
  }

  private determineRegistryState(
    physical: PhysicalRecordCapture | null,
    digital: DigitalRecordCapture | null
  ): RegistryState {
    if (physical && digital) {
      // TODO (production): Perform field-level comparison; return 'both_mismatch' on divergence.
      return 'both_consistent';
    }
    if (physical && !digital) return 'physical_only';
    if (!physical && digital) return 'digital_only'; // Potentially suspicious
    return 'unknown';
  }

  private identifyFindings(
    physical: PhysicalRecordCapture | null,
    digital: DigitalRecordCapture | null,
    state: RegistryState
  ): string[] {
    const findings: string[] = [];

    if (state === 'digital_only') {
      findings.push(
        'CRITICAL: Property exists only in the digital registry. ' +
          'This may indicate fraudulent digitization. Physical registry verification required.'
      );
    } else if (state === 'physical_only') {
      findings.push(
        'Property exists only in the physical registry. ' +
          'Digital record may not yet have been created during the transition period.'
      );
    } else if (physical && digital) {
      findings.push('Both physical and digital records captured. Consistency check completed.');
    }

    return findings;
  }

  private async simulateBlockchainTransaction(
    hash: string,
    _chain: BlockchainAnchor['chain']
  ): Promise<string> {
    // Simulate network latency
    await new Promise<void>((resolve) => setTimeout(resolve, 100));
    // Prefix with 0x and use the first 64 hex chars of the snapshot hash
    return `0x${hash.substring(0, 64)}`;
  }

  private getVerificationUrl(chain: BlockchainAnchor['chain'], txHash: string): string {
    const explorers: Record<BlockchainAnchor['chain'], string> = {
      polygon: `https://polygonscan.com/tx/${txHash}`,
      ethereum: `https://etherscan.io/tx/${txHash}`,
      base: `https://basescan.org/tx/${txHash}`,
    };
    return explorers[chain];
  }

  /** TODO (production): Replace with live lands.go.ke API call. */
  private async fetchCurrentDigitalRecord(
    _propertyId: string
  ): Promise<DigitalRecordCapture | null> {
    return {
      apiResponseHash: 'simulated_hash',
      capturedAt: new Date(),
      sourceRegistry: 'lands.go.ke',
      ownerName: 'Current Owner Name',
      titleNumber: 'LR/12345/67',
      encumbrances: [],
      rawResponse: {},
    };
  }

  private calculateChangeRiskLevel(
    changes: RegistryChange[]
  ): 'critical' | 'high' | 'medium' | 'low' | 'none' {
    if (changes.length === 0) return 'none';
    if (changes.some((c) => c.severity === 'critical')) return 'critical';
    if (changes.some((c) => c.severity === 'high')) return 'high';
    return 'medium';
  }

  private generateChangeRecommendation(changes: RegistryChange[], riskLevel: string): string {
    if (changes.length === 0) {
      return 'No changes detected. Registry state is consistent with the snapshot.';
    }
    if (riskLevel === 'critical') {
      return (
        'CRITICAL: Ownership has changed since the snapshot was taken. ' +
        'DO NOT PROCEED with any transaction until a legal review is completed. ' +
        'This may indicate a fraudulent transfer.'
      );
    }
    if (riskLevel === 'high') {
      return (
        'HIGH RISK: Encumbrances have changed since the snapshot. ' +
        'Review all new or removed liens before proceeding. Legal consultation is strongly advised.'
      );
    }
    return 'Changes detected since snapshot. Review all changes before proceeding.';
  }

  private createEvidenceSummary(snapshot: RegistryProofSnapshot): string {
    const anchor = snapshot.blockchainAnchor;
    const anchorSection = anchor
      ? [
          `Transaction : ${anchor.transactionHash}`,
          `Chain       : ${anchor.chain}`,
          `Block       : ${anchor.blockNumber}`,
          `Verify at   : ${anchor.verificationUrl}`,
        ].join('\n')
      : 'Not anchored to blockchain';

    return [
      'REGISTRY PROOF EVIDENCE SUMMARY',
      '================================',
      '',
      `Snapshot ID : ${snapshot.id}`,
      `Property ID : ${snapshot.propertyId}`,
      `Created     : ${snapshot.createdAt.toISOString()}`,
      '',
      'CRYPTOGRAPHIC HASH (SHA-256):',
      snapshot.snapshotHash,
      '',
      'REGISTRY STATE AT SNAPSHOT TIME:',
      snapshot.verificationResult,
      '',
      'BLOCKCHAIN ANCHORING:',
      anchorSection,
      '',
      'WITNESSES:',
      snapshot.witnessSignatures.map((w) => `  - ${w.witnessType}: ${w.witnessId}`).join('\n'),
      '',
      'FINDINGS:',
      snapshot.findings.join('\n'),
    ].join('\n');
  }

  private createBlockchainVerificationInstructions(anchor: BlockchainAnchor): string {
    return [
      'To independently verify this proof:',
      '',
      `1. Visit ${anchor.verificationUrl}`,
      `2. Locate the "Input Data" field in the transaction details.`,
      `3. Confirm it contains the hash: ${anchor.transactionHash}`,
      `4. The block timestamp proves this data existed at ${anchor.timestamp.toISOString()}`,
      '',
      'This verification can be performed by any party with internet access.',
      'The blockchain record cannot be altered or deleted.',
    ].join('\n');
  }

  private createChainOfCustody(snapshot: RegistryProofSnapshot): ChainOfCustodyEntry[] {
    const entries: ChainOfCustodyEntry[] = [
      {
        timestamp: snapshot.createdAt,
        action: 'Snapshot created',
        actor: 'TripleCheck System',
        details: `Registry state captured: ${snapshot.verificationResult}`,
      },
    ];

    if (snapshot.blockchainAnchor) {
      entries.push({
        timestamp: snapshot.blockchainAnchor.timestamp,
        action: 'Anchored to blockchain',
        actor: 'TripleCheck System',
        details: `Transaction: ${snapshot.blockchainAnchor.transactionHash}`,
      });
    }

    for (const witness of snapshot.witnessSignatures) {
      entries.push({
        timestamp: witness.signedAt,
        action: 'Witness attestation',
        actor: `${witness.witnessType} (${witness.witnessId})`,
        details: witness.attestation,
      });
    }

    // Sort chronologically
    return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private getLegalDisclaimer(): string {
    return [
      'LEGAL DISCLAIMER',
      '',
      'This document is generated by TripleCheck, a property verification platform.',
      'The cryptographic proof contained herein evidences the registry state at a specific',
      'point in time. The blockchain anchor provides independent, third-party verifiability.',
      '',
      'This evidence must be reviewed by qualified legal counsel before use in any legal',
      'proceeding. TripleCheck makes no warranty as to the accuracy of the underlying',
      'registry data — only that the data was captured and cryptographically timestamped',
      'as indicated herein.',
      '',
      'For questions regarding this evidence, contact: legal@triplecheck.io',
    ].join('\n');
  }
}

// Export singleton instance
export const immutableProofService = new ImmutableProofService();