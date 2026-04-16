/**
 * ROI Calculator Component
 *
 * Interactive calculator for banks to see potential savings from TripleCheck
 * NPL verification services. Shows ROI based on portfolio size and recovery rates.
 */

import React, { useState, useMemo } from 'react'

// ============================================================================
// Types
// ============================================================================

interface ROIInputs {
  portfolioSize: number;        // Total NPL portfolio value in KES
  numberOfProperties: number;   // Number of properties in portfolio
  currentRecoveryRate: number;  // Current recovery rate (percentage)
  averageFraudLoss: number;     // Average loss per fraudulent property
}

interface ROIResults {
  currentRecovery: number;
  projectedRecovery: number;
  additionalRecovery: number;
  roiMultiple: number;
  costOfService: number;
  netBenefit: number;
  paybackPeriod: string;
  fraudPropertiesAvoided: number;
}

// ============================================================================
// Constants
// ============================================================================

const TRIPLECHECK_IMPROVEMENT = 0.12; // 12% improvement in recovery rate
const COST_PER_VERIFICATION = 50000; // KES 50,000 per property
const FRAUD_DETECTION_RATE = 0.95; // 95% fraud detection rate
const AVERAGE_FRAUD_RATE = 0.08; // 8% of NPLs have title issues

// ============================================================================
// ROI Calculator Component
// ============================================================================

export function ROICalculator(): React.ReactElement {
  const [inputs, setInputs] = useState<ROIInputs>({
    portfolioSize: 500000000, // KES 500M default
    numberOfProperties: 50,
    currentRecoveryRate: 45,
    averageFraudLoss: 15000000, // KES 15M
  });

  const [showBreakdown, setShowBreakdown] = useState(false);

  const results = useMemo<ROIResults>(() => {
    const currentRecovery = inputs.portfolioSize * (inputs.currentRecoveryRate / 100);
    const projectedRecoveryRate = Math.min(
      inputs.currentRecoveryRate + TRIPLECHECK_IMPROVEMENT * 100,
      95
    );
    const projectedRecovery = inputs.portfolioSize * (projectedRecoveryRate / 100);
    const additionalRecovery = projectedRecovery - currentRecovery;

    // Fraud avoidance savings
    const expectedFraudProperties = Math.round(inputs.numberOfProperties * AVERAGE_FRAUD_RATE);
    const fraudPropertiesAvoided = Math.round(expectedFraudProperties * FRAUD_DETECTION_RATE);
    const fraudSavings = fraudPropertiesAvoided * inputs.averageFraudLoss;

    // Total benefit
    const totalBenefit = additionalRecovery + fraudSavings;

    // Cost
    const costOfService = inputs.numberOfProperties * COST_PER_VERIFICATION;

    // ROI
    const netBenefit = totalBenefit - costOfService;
    const roiMultiple = costOfService > 0 ? totalBenefit / costOfService : 0;

    // Payback period
    let paybackPeriod = 'Immediate';
    if (netBenefit < 0) {
      paybackPeriod = 'N/A';
    } else if (roiMultiple < 2) {
      paybackPeriod = '6-12 months';
    } else if (roiMultiple < 5) {
      paybackPeriod = '3-6 months';
    }

    return {
      currentRecovery,
      projectedRecovery,
      additionalRecovery,
      roiMultiple,
      costOfService,
      netBenefit,
      paybackPeriod,
      fraudPropertiesAvoided,
    };
  }, [inputs]);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000000) {
      return `KSh ${(amount / 1000000000).toFixed(1)}B`;
    }
    if (amount >= 1000000) {
      return `KSh ${(amount / 1000000).toFixed(1)}M`;
    }
    return `KSh ${(amount / 1000).toFixed(0)}K`;
  };

  const handleInputChange = (field: keyof ROIInputs, value: string) => {
    const numValue = parseFloat(value) || 0;
    setInputs((prev) => ({ ...prev, [field]: numValue }));
  };

  return (
    <div className="roi-calculator">
      {/* Header */}
      <div className="roi-calculator__header">
        <h2 className="roi-calculator__title">ROI Calculator</h2>
        <p className="roi-calculator__subtitle">
          See how TripleCheck verification improves your NPL recovery
        </p>
      </div>

      {/* Input Section */}
      <div className="roi-calculator__inputs">
        <div className="roi-calculator__input-group">
          <label className="roi-calculator__label">
            Total NPL Portfolio Value
            <span className="roi-calculator__hint">Outstanding balance across all NPLs</span>
          </label>
          <div className="roi-calculator__input-wrapper">
            <span className="roi-calculator__currency">KSh</span>
            <input
              type="number"
              className="roi-calculator__input"
              value={inputs.portfolioSize}
              onChange={(e) => handleInputChange('portfolioSize', e.target.value)}
              min={0}
            />
          </div>
        </div>

        <div className="roi-calculator__input-group">
          <label className="roi-calculator__label">
            Number of Properties
            <span className="roi-calculator__hint">Properties in your NPL portfolio</span>
          </label>
          <input
            type="number"
            className="roi-calculator__input"
            value={inputs.numberOfProperties}
            onChange={(e) => handleInputChange('numberOfProperties', e.target.value)}
            min={1}
          />
        </div>

        <div className="roi-calculator__input-group">
          <label className="roi-calculator__label">
            Current Recovery Rate
            <span className="roi-calculator__hint">Your current NPL recovery percentage</span>
          </label>
          <div className="roi-calculator__input-wrapper">
            <input
              type="number"
              className="roi-calculator__input"
              value={inputs.currentRecoveryRate}
              onChange={(e) => handleInputChange('currentRecoveryRate', e.target.value)}
              min={0}
              max={100}
            />
            <span className="roi-calculator__suffix">%</span>
          </div>
        </div>

        <div className="roi-calculator__input-group">
          <label className="roi-calculator__label">
            Average Fraud Loss per Property
            <span className="roi-calculator__hint">Typical loss when title issues are discovered late</span>
          </label>
          <div className="roi-calculator__input-wrapper">
            <span className="roi-calculator__currency">KSh</span>
            <input
              type="number"
              className="roi-calculator__input"
              value={inputs.averageFraudLoss}
              onChange={(e) => handleInputChange('averageFraudLoss', e.target.value)}
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="roi-calculator__results">
        {/* Primary ROI Display */}
        <div className="roi-calculator__primary-result">
          <div className="roi-calculator__roi-value">
            {results.roiMultiple.toFixed(1)}x
          </div>
          <div className="roi-calculator__roi-label">Return on Investment</div>
        </div>

        {/* Key Metrics */}
        <div className="roi-calculator__metrics">
          <div className="roi-calculator__metric">
            <div className="roi-calculator__metric-value roi-calculator__metric-value--positive">
              {formatCurrency(results.additionalRecovery)}
            </div>
            <div className="roi-calculator__metric-label">Additional Recovery</div>
          </div>

          <div className="roi-calculator__metric">
            <div className="roi-calculator__metric-value">
              {formatCurrency(results.costOfService)}
            </div>
            <div className="roi-calculator__metric-label">Service Cost</div>
          </div>

          <div className="roi-calculator__metric">
            <div className={`roi-calculator__metric-value ${
              results.netBenefit > 0 ? 'roi-calculator__metric-value--positive' : 'roi-calculator__metric-value--negative'
            }`}>
              {formatCurrency(results.netBenefit)}
            </div>
            <div className="roi-calculator__metric-label">Net Benefit</div>
          </div>

          <div className="roi-calculator__metric">
            <div className="roi-calculator__metric-value">
              {results.paybackPeriod}
            </div>
            <div className="roi-calculator__metric-label">Payback Period</div>
          </div>
        </div>

        {/* Visual Comparison */}
        <div className="roi-calculator__comparison">
          <h3 className="roi-calculator__comparison-title">Recovery Comparison</h3>
          <div className="roi-calculator__bars">
            <div className="roi-calculator__bar-group">
              <div className="roi-calculator__bar-label">Current</div>
              <div className="roi-calculator__bar-container">
                <div
                  className="roi-calculator__bar roi-calculator__bar--current"
                  style={{ width: `${(results.currentRecovery / inputs.portfolioSize) * 100}%` }}
                />
              </div>
              <div className="roi-calculator__bar-value">{formatCurrency(results.currentRecovery)}</div>
            </div>

            <div className="roi-calculator__bar-group">
              <div className="roi-calculator__bar-label">With TripleCheck</div>
              <div className="roi-calculator__bar-container">
                <div
                  className="roi-calculator__bar roi-calculator__bar--projected"
                  style={{ width: `${(results.projectedRecovery / inputs.portfolioSize) * 100}%` }}
                />
              </div>
              <div className="roi-calculator__bar-value">{formatCurrency(results.projectedRecovery)}</div>
            </div>
          </div>
        </div>

        {/* Fraud Prevention Callout */}
        {results.fraudPropertiesAvoided > 0 && (
          <div className="roi-calculator__callout">
            <div className="roi-calculator__callout-icon">🛡️</div>
            <div className="roi-calculator__callout-content">
              <div className="roi-calculator__callout-title">
                {results.fraudPropertiesAvoided} Fraudulent Properties Detected
              </div>
              <div className="roi-calculator__callout-text">
                Early detection prevents average losses of {formatCurrency(inputs.averageFraudLoss)} per property
              </div>
            </div>
          </div>
        )}

        {/* Breakdown Toggle */}
        <button
          className="roi-calculator__breakdown-toggle"
          onClick={() => setShowBreakdown(!showBreakdown)}
        >
          {showBreakdown ? 'Hide Detailed Breakdown' : 'Show Detailed Breakdown'}
        </button>

        {/* Detailed Breakdown */}
        {showBreakdown && (
          <div className="roi-calculator__breakdown">
            <h4 className="roi-calculator__breakdown-title">Calculation Details</h4>
            <table className="roi-calculator__breakdown-table">
              <tbody>
                <tr>
                  <td>Portfolio Size</td>
                  <td>{formatCurrency(inputs.portfolioSize)}</td>
                </tr>
                <tr>
                  <td>Current Recovery Rate</td>
                  <td>{inputs.currentRecoveryRate}%</td>
                </tr>
                <tr>
                  <td>Projected Recovery Rate</td>
                  <td>{(inputs.currentRecoveryRate + TRIPLECHECK_IMPROVEMENT * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                  <td>TripleCheck Improvement</td>
                  <td>+{(TRIPLECHECK_IMPROVEMENT * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                  <td>Fraud Detection Rate</td>
                  <td>{(FRAUD_DETECTION_RATE * 100).toFixed(0)}%</td>
                </tr>
                <tr>
                  <td>Cost per Verification</td>
                  <td>{formatCurrency(COST_PER_VERIFICATION)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="roi-calculator__cta">
        <button className="roi-calculator__cta-button roi-calculator__cta-button--primary">
          Schedule Demo with Your Data
        </button>
        <button className="roi-calculator__cta-button roi-calculator__cta-button--secondary">
          Download PDF Report
        </button>
      </div>

      {/* Styles */}
      <style>{`
        .roi-calculator {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 16px;
          color: #fff;
          font-family: 'Inter', sans-serif;
        }

        .roi-calculator__header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .roi-calculator__title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .roi-calculator__subtitle {
          color: #94a3b8;
          margin: 0;
        }

        .roi-calculator__inputs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .roi-calculator__input-group {
          display: flex;
          flex-direction: column;
        }

        .roi-calculator__label {
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .roi-calculator__hint {
          display: block;
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 400;
        }

        .roi-calculator__input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
        }

        .roi-calculator__currency,
        .roi-calculator__suffix {
          padding: 0 0.75rem;
          color: #64748b;
          font-size: 0.875rem;
        }

        .roi-calculator__input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0.75rem;
          color: #fff;
          font-size: 1rem;
          outline: none;
        }

        .roi-calculator__input:focus {
          box-shadow: inset 0 0 0 2px #4ade80;
        }

        .roi-calculator__results {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }

        .roi-calculator__primary-result {
          text-align: center;
          margin-bottom: 2rem;
        }

        .roi-calculator__roi-value {
          font-size: 4rem;
          font-weight: 800;
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .roi-calculator__roi-label {
          font-size: 1rem;
          color: #94a3b8;
        }

        .roi-calculator__metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .roi-calculator__metric {
          text-align: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .roi-calculator__metric-value {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .roi-calculator__metric-value--positive {
          color: #4ade80;
        }

        .roi-calculator__metric-value--negative {
          color: #f87171;
        }

        .roi-calculator__metric-label {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .roi-calculator__comparison {
          margin-bottom: 1.5rem;
        }

        .roi-calculator__comparison-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .roi-calculator__bar-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }

        .roi-calculator__bar-label {
          width: 120px;
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .roi-calculator__bar-container {
          flex: 1;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .roi-calculator__bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.5s ease;
        }

        .roi-calculator__bar--current {
          background: #64748b;
        }

        .roi-calculator__bar--projected {
          background: linear-gradient(90deg, #4ade80, #22d3ee);
        }

        .roi-calculator__bar-value {
          width: 100px;
          text-align: right;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .roi-calculator__callout {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.2);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .roi-calculator__callout-icon {
          font-size: 2rem;
        }

        .roi-calculator__callout-title {
          font-weight: 600;
          color: #4ade80;
        }

        .roi-calculator__callout-text {
          font-size: 0.875rem;
          color: #94a3b8;
        }

        .roi-calculator__breakdown-toggle {
          width: 100%;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #94a3b8;
          padding: 0.75rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s ease;
        }

        .roi-calculator__breakdown-toggle:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
        }

        .roi-calculator__breakdown {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .roi-calculator__breakdown-title {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }

        .roi-calculator__breakdown-table {
          width: 100%;
          font-size: 0.875rem;
        }

        .roi-calculator__breakdown-table td {
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .roi-calculator__breakdown-table td:last-child {
          text-align: right;
          color: #4ade80;
        }

        .roi-calculator__cta {
          display: flex;
          gap: 1rem;
        }

        .roi-calculator__cta-button {
          flex: 1;
          padding: 1rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .roi-calculator__cta-button--primary {
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          border: none;
          color: #1a1a2e;
        }

        .roi-calculator__cta-button--primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(74, 222, 128, 0.4);
        }

        .roi-calculator__cta-button--secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        .roi-calculator__cta-button--secondary:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        @media (max-width: 768px) {
          .roi-calculator__inputs {
            grid-template-columns: 1fr;
          }

          .roi-calculator__metrics {
            grid-template-columns: repeat(2, 1fr);
          }

          .roi-calculator__cta {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default ROICalculator;
