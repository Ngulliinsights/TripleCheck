"use strict";
/**
 * Proof Verification Page
 *
 * User-facing page showing blockchain-anchored proof of registry state.
 * Includes proof timeline, blockchain verification links, and mismatch alerts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProofVerification = ProofVerification;
var react_1 = require("react");
// ============================================================================
// Mock Data (would come from API)
// ============================================================================
var MOCK_SNAPSHOT = {
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
function ProofVerification() {
    var _a = (0, react_1.useState)(null), snapshot = _a[0], setSnapshot = _a[1];
    var _b = (0, react_1.useState)(true), loading = _b[0], setLoading = _b[1];
    var _c = (0, react_1.useState)(null), currentStateMatch = _c[0], setCurrentStateMatch = _c[1];
    (0, react_1.useEffect)(function () {
        // Simulate loading
        setTimeout(function () {
            setSnapshot(MOCK_SNAPSHOT);
            setCurrentStateMatch(true); // Simulated - would compare with current registry
            setLoading(false);
        }, 500);
    }, []);
    var getRegistryStateLabel = function (state) {
        var states = {
            both_consistent: { label: 'Consistent', color: '#4ade80' },
            both_mismatch: { label: 'MISMATCH DETECTED', color: '#ef4444' },
            physical_only: { label: 'Physical Only', color: '#f59e0b' },
            digital_only: { label: 'Digital Only (Suspicious)', color: '#ef4444' },
            unknown: { label: 'Unknown', color: '#64748b' },
        };
        return states[state];
    };
    var formatDate = function (date) {
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    var truncateHash = function (hash) {
        return "".concat(hash.substring(0, 10), "...").concat(hash.substring(hash.length - 8));
    };
    if (loading) {
        return (<div className="proof-verification proof-verification--loading">
        <div className="proof-verification__loader">Loading proof...</div>
      </div>);
    }
    if (!snapshot) {
        return (<div className="proof-verification proof-verification--error">
        <h2>Proof Not Found</h2>
        <p>The requested proof could not be loaded.</p>
      </div>);
    }
    var stateInfo = getRegistryStateLabel(snapshot.verificationResult);
    return (<div className="proof-verification">
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
      <div className="proof-verification__status" style={{ backgroundColor: stateInfo.color + '15', borderColor: stateInfo.color }}>
        <span className="proof-verification__status-dot" style={{ backgroundColor: stateInfo.color }}/>
        <span className="proof-verification__status-text">
          Registry State: <strong style={{ color: stateInfo.color }}>{stateInfo.label}</strong>
        </span>
        {currentStateMatch !== null && (<span className="proof-verification__current-match">
            {currentStateMatch ? '✓ Current state matches' : '⚠️ Current state has changed'}
          </span>)}
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
              <button className="proof-verification__copy-btn" onClick={function () { return navigator.clipboard.writeText(snapshot.snapshotHash); }}>
                Copy Hash
              </button>
            </div>
          </section>

          {/* Blockchain Anchor */}
          {snapshot.blockchainAnchor && (<section className="proof-verification__section">
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
                  <a href={snapshot.blockchainAnchor.verificationUrl} target="_blank" rel="noopener noreferrer" className="proof-verification__blockchain-link">
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
                <a href={snapshot.blockchainAnchor.verificationUrl} target="_blank" rel="noopener noreferrer" className="proof-verification__verify-btn">
                  Verify on Polygonscan
                </a>
              </div>
            </section>)}

          {/* Findings */}
          <section className="proof-verification__section">
            <h2 className="proof-verification__section-title">Findings</h2>
            <ul className="proof-verification__findings">
              {snapshot.findings.map(function (finding, index) { return (<li key={index} className="proof-verification__finding">
                  {finding}
                </li>); })}
            </ul>
          </section>
        </div>

        {/* Right Column - Timeline & Witnesses */}
        <div className="proof-verification__sidebar">
          {/* Timeline */}
          <section className="proof-verification__section">
            <h2 className="proof-verification__section-title">Proof Timeline</h2>
            <div className="proof-verification__timeline">
              {snapshot.physicalRecordCapture && (<div className="proof-verification__timeline-item">
                  <div className="proof-verification__timeline-dot"/>
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
                </div>)}

              {snapshot.digitalRecordCapture && (<div className="proof-verification__timeline-item">
                  <div className="proof-verification__timeline-dot"/>
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
                </div>)}

              <div className="proof-verification__timeline-item">
                <div className="proof-verification__timeline-dot"/>
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

              {snapshot.blockchainAnchor && (<div className="proof-verification__timeline-item">
                  <div className="proof-verification__timeline-dot" style={{ backgroundColor: '#4ade80' }}/>
                  <div className="proof-verification__timeline-content">
                    <div className="proof-verification__timeline-time">
                      {formatDate(snapshot.blockchainAnchor.timestamp)}
                    </div>
                    <div className="proof-verification__timeline-title">Anchored to Blockchain</div>
                    <div className="proof-verification__timeline-detail">
                      Block #{snapshot.blockchainAnchor.blockNumber.toLocaleString()}
                    </div>
                  </div>
                </div>)}
            </div>
          </section>

          {/* Witnesses */}
          <section className="proof-verification__section">
            <h2 className="proof-verification__section-title">Witness Attestations</h2>
            <div className="proof-verification__witnesses">
              {snapshot.witnessSignatures.map(function (witness, index) { return (<div key={index} className="proof-verification__witness">
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
                </div>); })}
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
      <style>{"\n        .proof-verification {\n          min-height: 100vh;\n          background: #f8fafc;\n          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;\n        }\n\n        .proof-verification--loading,\n        .proof-verification--error {\n          display: flex;\n          flex-direction: column;\n          align-items: center;\n          justify-content: center;\n          min-height: 400px;\n          color: #64748b;\n        }\n\n        .proof-verification__header {\n          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);\n          padding: 3rem 2rem;\n          color: #fff;\n        }\n\n        .proof-verification__header-content {\n          max-width: 1200px;\n          margin: 0 auto;\n        }\n\n        .proof-verification__badge {\n          display: inline-block;\n          padding: 0.25rem 0.75rem;\n          background: rgba(74, 222, 128, 0.2);\n          border-radius: 12px;\n          color: #4ade80;\n          font-size: 0.75rem;\n          font-weight: 600;\n          margin-bottom: 1rem;\n          text-transform: uppercase;\n          letter-spacing: 0.5px;\n        }\n\n        .proof-verification__title {\n          font-size: 2rem;\n          font-weight: 700;\n          margin: 0 0 0.5rem 0;\n        }\n\n        .proof-verification__property-id {\n          color: #94a3b8;\n          margin: 0;\n        }\n\n        .proof-verification__status {\n          display: flex;\n          align-items: center;\n          gap: 1rem;\n          padding: 1rem 2rem;\n          border-left: 4px solid;\n          max-width: 1200px;\n          margin: 2rem auto;\n          border-radius: 0 8px 8px 0;\n        }\n\n        .proof-verification__status-dot {\n          width: 12px;\n          height: 12px;\n          border-radius: 50%;\n        }\n\n        .proof-verification__status-text {\n          flex: 1;\n          font-size: 1rem;\n        }\n\n        .proof-verification__current-match {\n          font-size: 0.875rem;\n          color: #64748b;\n        }\n\n        .proof-verification__grid {\n          display: grid;\n          grid-template-columns: 2fr 1fr;\n          gap: 2rem;\n          max-width: 1200px;\n          margin: 0 auto;\n          padding: 0 2rem 2rem;\n        }\n\n        .proof-verification__section {\n          background: #fff;\n          border-radius: 12px;\n          padding: 1.5rem;\n          margin-bottom: 1.5rem;\n          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);\n        }\n\n        .proof-verification__section-title {\n          font-size: 1.125rem;\n          font-weight: 600;\n          margin: 0 0 1rem 0;\n          color: #1e293b;\n        }\n\n        .proof-verification__hash-card {\n          background: #f8fafc;\n          border-radius: 8px;\n          padding: 1rem;\n        }\n\n        .proof-verification__hash-label {\n          font-size: 0.75rem;\n          color: #64748b;\n          text-transform: uppercase;\n          letter-spacing: 0.5px;\n          margin-bottom: 0.5rem;\n        }\n\n        .proof-verification__hash-value {\n          display: block;\n          font-size: 0.75rem;\n          font-family: 'Monaco', 'Consolas', monospace;\n          word-break: break-all;\n          color: #1e293b;\n          background: #e2e8f0;\n          padding: 0.75rem;\n          border-radius: 4px;\n          margin-bottom: 0.75rem;\n        }\n\n        .proof-verification__copy-btn {\n          background: #e2e8f0;\n          border: none;\n          padding: 0.5rem 1rem;\n          border-radius: 6px;\n          font-size: 0.875rem;\n          cursor: pointer;\n          transition: background 0.2s;\n        }\n\n        .proof-verification__copy-btn:hover {\n          background: #cbd5e1;\n        }\n\n        .proof-verification__blockchain-card {\n          background: #f8fafc;\n          border-radius: 8px;\n          padding: 1rem;\n        }\n\n        .proof-verification__blockchain-row {\n          display: flex;\n          justify-content: space-between;\n          padding: 0.5rem 0;\n          border-bottom: 1px solid #e2e8f0;\n        }\n\n        .proof-verification__blockchain-row:last-of-type {\n          border-bottom: none;\n        }\n\n        .proof-verification__blockchain-label {\n          color: #64748b;\n          font-size: 0.875rem;\n        }\n\n        .proof-verification__blockchain-value {\n          font-weight: 500;\n          font-size: 0.875rem;\n        }\n\n        .proof-verification__blockchain-link {\n          color: #3b82f6;\n          text-decoration: none;\n          font-family: 'Monaco', 'Consolas', monospace;\n          font-size: 0.8rem;\n        }\n\n        .proof-verification__blockchain-link:hover {\n          text-decoration: underline;\n        }\n\n        .proof-verification__external-icon {\n          margin-left: 0.25rem;\n        }\n\n        .proof-verification__verify-btn {\n          display: block;\n          text-align: center;\n          background: linear-gradient(90deg, #4ade80, #22d3ee);\n          color: #0a0a0a;\n          padding: 0.75rem;\n          border-radius: 6px;\n          font-weight: 600;\n          text-decoration: none;\n          margin-top: 1rem;\n          transition: transform 0.2s;\n        }\n\n        .proof-verification__verify-btn:hover {\n          transform: translateY(-2px);\n        }\n\n        .proof-verification__findings {\n          list-style: none;\n          padding: 0;\n          margin: 0;\n        }\n\n        .proof-verification__finding {\n          padding: 0.75rem;\n          background: #f0fdf4;\n          border-left: 3px solid #4ade80;\n          margin-bottom: 0.5rem;\n          font-size: 0.875rem;\n          color: #166534;\n        }\n\n        .proof-verification__timeline {\n          position: relative;\n          padding-left: 1.5rem;\n        }\n\n        .proof-verification__timeline::before {\n          content: '';\n          position: absolute;\n          left: 5px;\n          top: 0;\n          bottom: 0;\n          width: 2px;\n          background: #e2e8f0;\n        }\n\n        .proof-verification__timeline-item {\n          position: relative;\n          padding-bottom: 1.5rem;\n        }\n\n        .proof-verification__timeline-dot {\n          position: absolute;\n          left: -1.5rem;\n          top: 0;\n          width: 12px;\n          height: 12px;\n          border-radius: 50%;\n          background: #3b82f6;\n          border: 2px solid #fff;\n          box-shadow: 0 0 0 2px #e2e8f0;\n        }\n\n        .proof-verification__timeline-time {\n          font-size: 0.75rem;\n          color: #64748b;\n        }\n\n        .proof-verification__timeline-title {\n          font-weight: 600;\n          color: #1e293b;\n          margin: 0.25rem 0;\n        }\n\n        .proof-verification__timeline-detail {\n          font-size: 0.875rem;\n          color: #64748b;\n        }\n\n        .proof-verification__witnesses {\n          display: flex;\n          flex-direction: column;\n          gap: 1rem;\n        }\n\n        .proof-verification__witness {\n          background: #f8fafc;\n          border-radius: 8px;\n          padding: 1rem;\n        }\n\n        .proof-verification__witness-header {\n          display: flex;\n          justify-content: space-between;\n          margin-bottom: 0.5rem;\n        }\n\n        .proof-verification__witness-type {\n          text-transform: capitalize;\n          font-weight: 600;\n          color: #1e293b;\n        }\n\n        .proof-verification__witness-id {\n          font-size: 0.75rem;\n          color: #64748b;\n          font-family: 'Monaco', 'Consolas', monospace;\n        }\n\n        .proof-verification__witness-attestation {\n          font-style: italic;\n          color: #475569;\n          font-size: 0.875rem;\n          margin: 0 0 0.5rem 0;\n        }\n\n        .proof-verification__witness-date {\n          font-size: 0.75rem;\n          color: #94a3b8;\n        }\n\n        .proof-verification__actions {\n          display: flex;\n          gap: 1rem;\n          max-width: 1200px;\n          margin: 0 auto 2rem;\n          padding: 0 2rem;\n        }\n\n        .proof-verification__action-btn {\n          flex: 1;\n          padding: 1rem;\n          border-radius: 8px;\n          font-size: 1rem;\n          font-weight: 600;\n          cursor: pointer;\n          transition: all 0.2s;\n        }\n\n        .proof-verification__action-btn--primary {\n          background: #1e293b;\n          border: none;\n          color: #fff;\n        }\n\n        .proof-verification__action-btn--primary:hover {\n          background: #0f172a;\n        }\n\n        .proof-verification__action-btn--secondary {\n          background: #fff;\n          border: 1px solid #e2e8f0;\n          color: #1e293b;\n        }\n\n        .proof-verification__action-btn--secondary:hover {\n          background: #f8fafc;\n        }\n\n        @media (max-width: 1024px) {\n          .proof-verification__grid {\n            grid-template-columns: 1fr;\n          }\n\n          .proof-verification__actions {\n            flex-direction: column;\n          }\n        }\n      "}</style>
    </div>);
}
exports.default = ProofVerification;
