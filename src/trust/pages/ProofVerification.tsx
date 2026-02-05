/**
 * Proof Verification Page
 *
 * User-facing page showing blockchain-anchored proof of registry state.
 * Includes proof timeline, blockchain verification links, and mismatch alerts.
 */

import React, { useState, useEffect } from 'react'
import type {
  RegistryProofSnapshot,
  RegistryState,
} from '../../trust/types/npl-verification.types'

// ============================================================================
// Mock Data (would come from API)
// ============================================================================

const MOCK_SNAPSHOT: RegistryProofSnapshot = {
  id: 'proof_1738756726_abc123xyz',
  propertyId: 'prop_LR_KIAMBU_2024_001',
  snapshotHash: 'a7b9c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
  createdAt: new Date('2026-01-15T10:30:00'),
  physicalRecordCapture: {
    photographUrl: '/images/deed_photo.jpg',
    scannedDocumentUrl: '/documents/deed_scan.pdf',
    capturedAt: new Date('2026-01-15T09:45:00'),
    capturedBy: 'SRV_001',
    location: { latitude: -1.2864, longitude: 36.8172, accuracy: 5 },
    registryOffice: 'Kiambu Lands Office',
    bookNumber: 'VOL 2847',
    pageNumber: '45',
  },
  digitalRecordCapture: {
    apiResponseHash: 'digital_hash_xyz789',
    capturedAt: new Date('2026-01-15T10:00:00'),
    sourceRegistry: 'lands.go.ke',
    ownerName: 'John Kamau Mwangi',
    titleNumber: 'LR/KIAMBU/2024/001',
    encumbrances: ['Mortgage - KCB Bank'],
    rawResponse: {},
  },
  blockchainAnchor: {
    chain: 'polygon',
    transactionHash: '0xa7b9c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    blockNumber: 52847391,
    timestamp: new Date('2026-01-15T10:35:00'),
    verificationUrl: 'https://polygonscan.com/tx/0xa7b9c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
  },
  witnessSignatures: [
    {
      witnessId: 'LAW_001',
      witnessType: 'legal_expert',
      signature: 'sig_abc123',
      signedAt: new Date('2026-01-15T11:00:00'),
      attestation: 'I confirm the physical and digital records match as of verification date.',
    },
    {
      witnessId: 'SRV_001',
      witnessType: 'surveyor',
      signature: 'sig_xyz789',
      signedAt: new Date('2026-01-15T09:50:00'),
      attestation: 'Property boundaries verified and documented.',
    },
  ],
  verificationResult: 'both_consistent',
  findings: [
    'Physical and digital records match.',
    'One active mortgage encumbrance noted.',
    'No disputes found in community records.',
  ],
};

// ============================================================================
// Component
// ============================================================================

export function ProofVerification(): React.ReactElement {
  const [snapshot, setSnapshot] = useState<RegistryProofSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStateMatch, setCurrentStateMatch] = useState<boolean | null>(null);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setSnapshot(MOCK_SNAPSHOT);
      setCurrentStateMatch(true); // Simulated - would compare with current registry
      setLoading(false);
    }, 500);
  }, []);

  const getRegistryStateLabel = (state: RegistryState): { label: string; color: string } => {
    const states: Record<RegistryState, { label: string; color: string }> = {
      both_consistent: { label: 'Consistent', color: '#4ade80' },
      both_mismatch: { label: 'MISMATCH DETECTED', color: '#ef4444' },
      physical_only: { label: 'Physical Only', color: '#f59e0b' },
      digital_only: { label: 'Digital Only (Suspicious)', color: '#ef4444' },
      unknown: { label: 'Unknown', color: '#64748b' },
    };
    return states[state];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateHash = (hash: string): string => {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
  };

  if (loading) {
    return (
      <div className="proof-verification proof-verification--loading">
        <div className="proof-verification__loader">Loading proof...</div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="proof-verification proof-verification--error">
        <h2>Proof Not Found</h2>
        <p>The requested proof could not be loaded.</p>
      </div>
    );
  }

  const stateInfo = getRegistryStateLabel(snapshot.verificationResult);

  return (
    <div className="proof-verification">
      {/* Header */}
      <header className="proof-verification__header">
        <div className="proof-verification__header-content">
          <span className="proof-verification__badge">Registry Proof</span>
          <h1 className="proof-verification__title">Property Verification Proof</h1>
          <p className="proof-verification__property-id">
            Property: <strong>{snapshot.propertyId}</strong>
          </p>
        </div>
      </header>

      {/* Status Banner */}
      <div
        className="proof-verification__status"
        style={{ backgroundColor: stateInfo.color + '15', borderColor: stateInfo.color }}
      >
        <span
          className="proof-verification__status-dot"
          style={{ backgroundColor: stateInfo.color }}
        />
        <span className="proof-verification__status-text">
          Registry State: <strong style={{ color: stateInfo.color }}>{stateInfo.label}</strong>
        </span>
        {currentStateMatch !== null && (
          <span className="proof-verification__current-match">
            {currentStateMatch ? '✓ Current state matches' : '⚠️ Current state has changed'}
          </span>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="proof-verification__grid">
        {/* Left Column - Proof Details */}
        <div className="proof-verification__main">
          {/* Snapshot Hash */}
          <section className="proof-verification__section">
            <h2 className="proof-verification__section-title">Cryptographic Proof</h2>
            <div className="proof-verification__hash-card">
              <div className="proof-verification__hash-label">SHA-256 Hash</div>
              <code className="proof-verification__hash-value">{snapshot.snapshotHash}</code>
              <button
                className="proof-verification__copy-btn"
                onClick={() => navigator.clipboard.writeText(snapshot.snapshotHash)}
              >
                Copy Hash
              </button>
            </div>
          </section>

          {/* Blockchain Anchor */}
          {snapshot.blockchainAnchor && (
            <section className="proof-verification__section">
              <h2 className="proof-verification__section-title">Blockchain Anchor</h2>
              <div className="proof-verification__blockchain-card">
                <div className="proof-verification__blockchain-row">
                  <span className="proof-verification__blockchain-label">Chain</span>
                  <span className="proof-verification__blockchain-value">
                    {snapshot.blockchainAnchor.chain.toUpperCase()}
                  </span>
                </div>
                <div className="proof-verification__blockchain-row">
                  <span className="proof-verification__blockchain-label">Transaction</span>
                  <a
                    href={snapshot.blockchainAnchor.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="proof-verification__blockchain-link"
                  >
                    {truncateHash(snapshot.blockchainAnchor.transactionHash)}
                    <span className="proof-verification__external-icon">↗</span>
                  </a>
                </div>
                <div className="proof-verification__blockchain-row">
                  <span className="proof-verification__blockchain-label">Block</span>
                  <span className="proof-verification__blockchain-value">
                    #{snapshot.blockchainAnchor.blockNumber.toLocaleString()}
                  </span>
                </div>
                <div className="proof-verification__blockchain-row">
                  <span className="proof-verification__blockchain-label">Timestamp</span>
                  <span className="proof-verification__blockchain-value">
                    {formatDate(snapshot.blockchainAnchor.timestamp)}
                  </span>
                </div>
                <a
                  href={snapshot.blockchainAnchor.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="proof-verification__verify-btn"
                >
                  Verify on Polygonscan
                </a>
              </div>
            </section>
          )}

          {/* Findings */}
          <section className="proof-verification__section">
            <h2 className="proof-verification__section-title">Findings</h2>
            <ul className="proof-verification__findings">
              {snapshot.findings.map((finding, index) => (
                <li key={index} className="proof-verification__finding">
                  {finding}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right Column - Timeline & Witnesses */}
        <div className="proof-verification__sidebar">
          {/* Timeline */}
          <section className="proof-verification__section">
            <h2 className="proof-verification__section-title">Proof Timeline</h2>
            <div className="proof-verification__timeline">
              {snapshot.physicalRecordCapture && (
                <div className="proof-verification__timeline-item">
                  <div className="proof-verification__timeline-dot" />
                  <div className="proof-verification__timeline-content">
                    <div className="proof-verification__timeline-time">
                      {formatDate(snapshot.physicalRecordCapture.capturedAt)}
                    </div>
                    <div className="proof-verification__timeline-title">
                      Physical Record Captured
                    </div>
                    <div className="proof-verification__timeline-detail">
                      At {snapshot.physicalRecordCapture.registryOffice}
                    </div>
                  </div>
                </div>
              )}

              {snapshot.digitalRecordCapture && (
                <div className="proof-verification__timeline-item">
                  <div className="proof-verification__timeline-dot" />
                  <div className="proof-verification__timeline-content">
                    <div className="proof-verification__timeline-time">
                      {formatDate(snapshot.digitalRecordCapture.capturedAt)}
                    </div>
                    <div className="proof-verification__timeline-title">
                      Digital Record Captured
                    </div>
                    <div className="proof-verification__timeline-detail">
                      From {snapshot.digitalRecordCapture.sourceRegistry}
                    </div>
                  </div>
                </div>
              )}

              <div className="proof-verification__timeline-item">
                <div className="proof-verification__timeline-dot" />
                <div className="proof-verification__timeline-content">
                  <div className="proof-verification__timeline-time">
                    {formatDate(snapshot.createdAt)}
                  </div>
                  <div className="proof-verification__timeline-title">Snapshot Created</div>
                  <div className="proof-verification__timeline-detail">
                    Hash: {truncateHash(snapshot.snapshotHash)}
                  </div>
                </div>
              </div>

              {snapshot.blockchainAnchor && (
                <div className="proof-verification__timeline-item">
                  <div
                    className="proof-verification__timeline-dot"
                    style={{ backgroundColor: '#4ade80' }}
                  />
                  <div className="proof-verification__timeline-content">
                    <div className="proof-verification__timeline-time">
                      {formatDate(snapshot.blockchainAnchor.timestamp)}
                    </div>
                    <div className="proof-verification__timeline-title">Anchored to Blockchain</div>
                    <div className="proof-verification__timeline-detail">
                      Block #{snapshot.blockchainAnchor.blockNumber.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Witnesses */}
          <section className="proof-verification__section">
            <h2 className="proof-verification__section-title">Witness Attestations</h2>
            <div className="proof-verification__witnesses">
              {snapshot.witnessSignatures.map((witness, index) => (
                <div key={index} className="proof-verification__witness">
                  <div className="proof-verification__witness-header">
                    <span className="proof-verification__witness-type">
                      {witness.witnessType.replace('_', ' ')}
                    </span>
                    <span className="proof-verification__witness-id">{witness.witnessId}</span>
                  </div>
                  <p className="proof-verification__witness-attestation">
                    "{witness.attestation}"
                  </p>
                  <div className="proof-verification__witness-date">
                    Signed: {formatDate(witness.signedAt)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Actions */}
      <div className="proof-verification__actions">
        <button className="proof-verification__action-btn proof-verification__action-btn--primary">
          Download Legal Evidence Package (PDF)
        </button>
        <button className="proof-verification__action-btn proof-verification__action-btn--secondary">
          Request Updated Check
        </button>
      </div>

      {/* Styles */}
      <style>{`
        .proof-verification {
          min-height: 100vh;
          background: #f8fafc;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .proof-verification--loading,
        .proof-verification--error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          color: #64748b;
        }

        .proof-verification__header {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          padding: 3rem 2rem;
          color: #fff;
        }

        .proof-verification__header-content {
          max-width: 1200px;
          margin: 0 auto;
        }

        .proof-verification__badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: rgba(74, 222, 128, 0.2);
          border-radius: 12px;
          color: #4ade80;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .proof-verification__title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .proof-verification__property-id {
          color: #94a3b8;
          margin: 0;
        }

        .proof-verification__status {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 2rem;
          border-left: 4px solid;
          max-width: 1200px;
          margin: 2rem auto;
          border-radius: 0 8px 8px 0;
        }

        .proof-verification__status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .proof-verification__status-text {
          flex: 1;
          font-size: 1rem;
        }

        .proof-verification__current-match {
          font-size: 0.875rem;
          color: #64748b;
        }

        .proof-verification__grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem 2rem;
        }

        .proof-verification__section {
          background: #fff;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .proof-verification__section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
          color: #1e293b;
        }

        .proof-verification__hash-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
        }

        .proof-verification__hash-label {
          font-size: 0.75rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
        }

        .proof-verification__hash-value {
          display: block;
          font-size: 0.75rem;
          font-family: 'Monaco', 'Consolas', monospace;
          word-break: break-all;
          color: #1e293b;
          background: #e2e8f0;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }

        .proof-verification__copy-btn {
          background: #e2e8f0;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .proof-verification__copy-btn:hover {
          background: #cbd5e1;
        }

        .proof-verification__blockchain-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
        }

        .proof-verification__blockchain-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .proof-verification__blockchain-row:last-of-type {
          border-bottom: none;
        }

        .proof-verification__blockchain-label {
          color: #64748b;
          font-size: 0.875rem;
        }

        .proof-verification__blockchain-value {
          font-weight: 500;
          font-size: 0.875rem;
        }

        .proof-verification__blockchain-link {
          color: #3b82f6;
          text-decoration: none;
          font-family: 'Monaco', 'Consolas', monospace;
          font-size: 0.8rem;
        }

        .proof-verification__blockchain-link:hover {
          text-decoration: underline;
        }

        .proof-verification__external-icon {
          margin-left: 0.25rem;
        }

        .proof-verification__verify-btn {
          display: block;
          text-align: center;
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          color: #0a0a0a;
          padding: 0.75rem;
          border-radius: 6px;
          font-weight: 600;
          text-decoration: none;
          margin-top: 1rem;
          transition: transform 0.2s;
        }

        .proof-verification__verify-btn:hover {
          transform: translateY(-2px);
        }

        .proof-verification__findings {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .proof-verification__finding {
          padding: 0.75rem;
          background: #f0fdf4;
          border-left: 3px solid #4ade80;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          color: #166534;
        }

        .proof-verification__timeline {
          position: relative;
          padding-left: 1.5rem;
        }

        .proof-verification__timeline::before {
          content: '';
          position: absolute;
          left: 5px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: #e2e8f0;
        }

        .proof-verification__timeline-item {
          position: relative;
          padding-bottom: 1.5rem;
        }

        .proof-verification__timeline-dot {
          position: absolute;
          left: -1.5rem;
          top: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid #fff;
          box-shadow: 0 0 0 2px #e2e8f0;
        }

        .proof-verification__timeline-time {
          font-size: 0.75rem;
          color: #64748b;
        }

        .proof-verification__timeline-title {
          font-weight: 600;
          color: #1e293b;
          margin: 0.25rem 0;
        }

        .proof-verification__timeline-detail {
          font-size: 0.875rem;
          color: #64748b;
        }

        .proof-verification__witnesses {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .proof-verification__witness {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1rem;
        }

        .proof-verification__witness-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .proof-verification__witness-type {
          text-transform: capitalize;
          font-weight: 600;
          color: #1e293b;
        }

        .proof-verification__witness-id {
          font-size: 0.75rem;
          color: #64748b;
          font-family: 'Monaco', 'Consolas', monospace;
        }

        .proof-verification__witness-attestation {
          font-style: italic;
          color: #475569;
          font-size: 0.875rem;
          margin: 0 0 0.5rem 0;
        }

        .proof-verification__witness-date {
          font-size: 0.75rem;
          color: #94a3b8;
        }

        .proof-verification__actions {
          display: flex;
          gap: 1rem;
          max-width: 1200px;
          margin: 0 auto 2rem;
          padding: 0 2rem;
        }

        .proof-verification__action-btn {
          flex: 1;
          padding: 1rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .proof-verification__action-btn--primary {
          background: #1e293b;
          border: none;
          color: #fff;
        }

        .proof-verification__action-btn--primary:hover {
          background: #0f172a;
        }

        .proof-verification__action-btn--secondary {
          background: #fff;
          border: 1px solid #e2e8f0;
          color: #1e293b;
        }

        .proof-verification__action-btn--secondary:hover {
          background: #f8fafc;
        }

        @media (max-width: 1024px) {
          .proof-verification__grid {
            grid-template-columns: 1fr;
          }

          .proof-verification__actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default ProofVerification;
