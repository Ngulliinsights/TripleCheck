"use strict";
/**
 * ROI Calculator Component
 *
 * Interactive calculator for banks to see potential savings from TripleCheck
 * NPL verification services. Shows ROI based on portfolio size and recovery rates.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROICalculator = ROICalculator;
var react_1 = require("react");
// ============================================================================
// Constants
// ============================================================================
var TRIPLECHECK_IMPROVEMENT = 0.12; // 12% improvement in recovery rate
var COST_PER_VERIFICATION = 50000; // KES 50,000 per property
var FRAUD_DETECTION_RATE = 0.95; // 95% fraud detection rate
var AVERAGE_FRAUD_RATE = 0.08; // 8% of NPLs have title issues
// ============================================================================
// ROI Calculator Component
// ============================================================================
function ROICalculator() {
    var _a = (0, react_1.useState)({
        portfolioSize: 500000000, // KES 500M default
        numberOfProperties: 50,
        currentRecoveryRate: 45,
        averageFraudLoss: 15000000, // KES 15M
    }), inputs = _a[0], setInputs = _a[1];
    var _b = (0, react_1.useState)(false), showBreakdown = _b[0], setShowBreakdown = _b[1];
    var results = (0, react_1.useMemo)(function () {
        var currentRecovery = inputs.portfolioSize * (inputs.currentRecoveryRate / 100);
        var projectedRecoveryRate = Math.min(inputs.currentRecoveryRate + TRIPLECHECK_IMPROVEMENT * 100, 95);
        var projectedRecovery = inputs.portfolioSize * (projectedRecoveryRate / 100);
        var additionalRecovery = projectedRecovery - currentRecovery;
        // Fraud avoidance savings
        var expectedFraudProperties = Math.round(inputs.numberOfProperties * AVERAGE_FRAUD_RATE);
        var fraudPropertiesAvoided = Math.round(expectedFraudProperties * FRAUD_DETECTION_RATE);
        var fraudSavings = fraudPropertiesAvoided * inputs.averageFraudLoss;
        // Total benefit
        var totalBenefit = additionalRecovery + fraudSavings;
        // Cost
        var costOfService = inputs.numberOfProperties * COST_PER_VERIFICATION;
        // ROI
        var netBenefit = totalBenefit - costOfService;
        var roiMultiple = costOfService > 0 ? totalBenefit / costOfService : 0;
        // Payback period
        var paybackPeriod = 'Immediate';
        if (netBenefit < 0) {
            paybackPeriod = 'N/A';
        }
        else if (roiMultiple < 2) {
            paybackPeriod = '6-12 months';
        }
        else if (roiMultiple < 5) {
            paybackPeriod = '3-6 months';
        }
        return {
            currentRecovery: currentRecovery,
            projectedRecovery: projectedRecovery,
            additionalRecovery: additionalRecovery,
            roiMultiple: roiMultiple,
            costOfService: costOfService,
            netBenefit: netBenefit,
            paybackPeriod: paybackPeriod,
            fraudPropertiesAvoided: fraudPropertiesAvoided,
        };
    }, [inputs]);
    var formatCurrency = function (amount) {
        if (amount >= 1000000000) {
            return "KSh ".concat((amount / 1000000000).toFixed(1), "B");
        }
        if (amount >= 1000000) {
            return "KSh ".concat((amount / 1000000).toFixed(1), "M");
        }
        return "KSh ".concat((amount / 1000).toFixed(0), "K");
    };
    var handleInputChange = function (field, value) {
        var numValue = parseFloat(value) || 0;
        setInputs(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = numValue, _a)));
        });
    };
    return (<div className="roi-calculator">
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
            <input type="number" className="roi-calculator__input" value={inputs.portfolioSize} onChange={function (e) { return handleInputChange('portfolioSize', e.target.value); }} min={0}/>
          </div>
        </div>

        <div className="roi-calculator__input-group">
          <label className="roi-calculator__label">
            Number of Properties
            <span className="roi-calculator__hint">Properties in your NPL portfolio</span>
          </label>
          <input type="number" className="roi-calculator__input" value={inputs.numberOfProperties} onChange={function (e) { return handleInputChange('numberOfProperties', e.target.value); }} min={1}/>
        </div>

        <div className="roi-calculator__input-group">
          <label className="roi-calculator__label">
            Current Recovery Rate
            <span className="roi-calculator__hint">Your current NPL recovery percentage</span>
          </label>
          <div className="roi-calculator__input-wrapper">
            <input type="number" className="roi-calculator__input" value={inputs.currentRecoveryRate} onChange={function (e) { return handleInputChange('currentRecoveryRate', e.target.value); }} min={0} max={100}/>
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
            <input type="number" className="roi-calculator__input" value={inputs.averageFraudLoss} onChange={function (e) { return handleInputChange('averageFraudLoss', e.target.value); }} min={0}/>
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
            <div className={"roi-calculator__metric-value ".concat(results.netBenefit > 0 ? 'roi-calculator__metric-value--positive' : 'roi-calculator__metric-value--negative')}>
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
                <div className="roi-calculator__bar roi-calculator__bar--current" style={{ width: "".concat((results.currentRecovery / inputs.portfolioSize) * 100, "%") }}/>
              </div>
              <div className="roi-calculator__bar-value">{formatCurrency(results.currentRecovery)}</div>
            </div>

            <div className="roi-calculator__bar-group">
              <div className="roi-calculator__bar-label">With TripleCheck</div>
              <div className="roi-calculator__bar-container">
                <div className="roi-calculator__bar roi-calculator__bar--projected" style={{ width: "".concat((results.projectedRecovery / inputs.portfolioSize) * 100, "%") }}/>
              </div>
              <div className="roi-calculator__bar-value">{formatCurrency(results.projectedRecovery)}</div>
            </div>
          </div>
        </div>

        {/* Fraud Prevention Callout */}
        {results.fraudPropertiesAvoided > 0 && (<div className="roi-calculator__callout">
            <div className="roi-calculator__callout-icon">🛡️</div>
            <div className="roi-calculator__callout-content">
              <div className="roi-calculator__callout-title">
                {results.fraudPropertiesAvoided} Fraudulent Properties Detected
              </div>
              <div className="roi-calculator__callout-text">
                Early detection prevents average losses of {formatCurrency(inputs.averageFraudLoss)} per property
              </div>
            </div>
          </div>)}

        {/* Breakdown Toggle */}
        <button className="roi-calculator__breakdown-toggle" onClick={function () { return setShowBreakdown(!showBreakdown); }}>
          {showBreakdown ? 'Hide Detailed Breakdown' : 'Show Detailed Breakdown'}
        </button>

        {/* Detailed Breakdown */}
        {showBreakdown && (<div className="roi-calculator__breakdown">
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
          </div>)}
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
      <style>{"\n        .roi-calculator {\n          max-width: 800px;\n          margin: 0 auto;\n          padding: 2rem;\n          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);\n          border-radius: 16px;\n          color: #fff;\n          font-family: 'Inter', sans-serif;\n        }\n\n        .roi-calculator__header {\n          text-align: center;\n          margin-bottom: 2rem;\n        }\n\n        .roi-calculator__title {\n          font-size: 2rem;\n          font-weight: 700;\n          margin: 0 0 0.5rem 0;\n          background: linear-gradient(90deg, #4ade80, #22d3ee);\n          -webkit-background-clip: text;\n          -webkit-text-fill-color: transparent;\n        }\n\n        .roi-calculator__subtitle {\n          color: #94a3b8;\n          margin: 0;\n        }\n\n        .roi-calculator__inputs {\n          display: grid;\n          grid-template-columns: repeat(2, 1fr);\n          gap: 1.5rem;\n          margin-bottom: 2rem;\n        }\n\n        .roi-calculator__input-group {\n          display: flex;\n          flex-direction: column;\n        }\n\n        .roi-calculator__label {\n          font-size: 0.875rem;\n          font-weight: 500;\n          margin-bottom: 0.5rem;\n        }\n\n        .roi-calculator__hint {\n          display: block;\n          font-size: 0.75rem;\n          color: #64748b;\n          font-weight: 400;\n        }\n\n        .roi-calculator__input-wrapper {\n          display: flex;\n          align-items: center;\n          background: rgba(255, 255, 255, 0.05);\n          border: 1px solid rgba(255, 255, 255, 0.1);\n          border-radius: 8px;\n          overflow: hidden;\n        }\n\n        .roi-calculator__currency,\n        .roi-calculator__suffix {\n          padding: 0 0.75rem;\n          color: #64748b;\n          font-size: 0.875rem;\n        }\n\n        .roi-calculator__input {\n          flex: 1;\n          background: transparent;\n          border: none;\n          padding: 0.75rem;\n          color: #fff;\n          font-size: 1rem;\n          outline: none;\n        }\n\n        .roi-calculator__input:focus {\n          box-shadow: inset 0 0 0 2px #4ade80;\n        }\n\n        .roi-calculator__results {\n          background: rgba(255, 255, 255, 0.03);\n          border-radius: 12px;\n          padding: 1.5rem;\n          margin-bottom: 2rem;\n        }\n\n        .roi-calculator__primary-result {\n          text-align: center;\n          margin-bottom: 2rem;\n        }\n\n        .roi-calculator__roi-value {\n          font-size: 4rem;\n          font-weight: 800;\n          background: linear-gradient(90deg, #4ade80, #22d3ee);\n          -webkit-background-clip: text;\n          -webkit-text-fill-color: transparent;\n        }\n\n        .roi-calculator__roi-label {\n          font-size: 1rem;\n          color: #94a3b8;\n        }\n\n        .roi-calculator__metrics {\n          display: grid;\n          grid-template-columns: repeat(4, 1fr);\n          gap: 1rem;\n          margin-bottom: 2rem;\n        }\n\n        .roi-calculator__metric {\n          text-align: center;\n          padding: 1rem;\n          background: rgba(255, 255, 255, 0.03);\n          border-radius: 8px;\n        }\n\n        .roi-calculator__metric-value {\n          font-size: 1.25rem;\n          font-weight: 700;\n        }\n\n        .roi-calculator__metric-value--positive {\n          color: #4ade80;\n        }\n\n        .roi-calculator__metric-value--negative {\n          color: #f87171;\n        }\n\n        .roi-calculator__metric-label {\n          font-size: 0.75rem;\n          color: #64748b;\n          margin-top: 0.25rem;\n        }\n\n        .roi-calculator__comparison {\n          margin-bottom: 1.5rem;\n        }\n\n        .roi-calculator__comparison-title {\n          font-size: 1rem;\n          font-weight: 600;\n          margin: 0 0 1rem 0;\n        }\n\n        .roi-calculator__bar-group {\n          display: flex;\n          align-items: center;\n          gap: 1rem;\n          margin-bottom: 0.75rem;\n        }\n\n        .roi-calculator__bar-label {\n          width: 120px;\n          font-size: 0.875rem;\n          color: #94a3b8;\n        }\n\n        .roi-calculator__bar-container {\n          flex: 1;\n          height: 24px;\n          background: rgba(255, 255, 255, 0.1);\n          border-radius: 4px;\n          overflow: hidden;\n        }\n\n        .roi-calculator__bar {\n          height: 100%;\n          border-radius: 4px;\n          transition: width 0.5s ease;\n        }\n\n        .roi-calculator__bar--current {\n          background: #64748b;\n        }\n\n        .roi-calculator__bar--projected {\n          background: linear-gradient(90deg, #4ade80, #22d3ee);\n        }\n\n        .roi-calculator__bar-value {\n          width: 100px;\n          text-align: right;\n          font-size: 0.875rem;\n          font-weight: 600;\n        }\n\n        .roi-calculator__callout {\n          display: flex;\n          align-items: center;\n          gap: 1rem;\n          background: rgba(74, 222, 128, 0.1);\n          border: 1px solid rgba(74, 222, 128, 0.2);\n          border-radius: 8px;\n          padding: 1rem;\n          margin-bottom: 1rem;\n        }\n\n        .roi-calculator__callout-icon {\n          font-size: 2rem;\n        }\n\n        .roi-calculator__callout-title {\n          font-weight: 600;\n          color: #4ade80;\n        }\n\n        .roi-calculator__callout-text {\n          font-size: 0.875rem;\n          color: #94a3b8;\n        }\n\n        .roi-calculator__breakdown-toggle {\n          width: 100%;\n          background: transparent;\n          border: 1px solid rgba(255, 255, 255, 0.1);\n          color: #94a3b8;\n          padding: 0.75rem;\n          border-radius: 8px;\n          cursor: pointer;\n          font-size: 0.875rem;\n          transition: all 0.2s ease;\n        }\n\n        .roi-calculator__breakdown-toggle:hover {\n          background: rgba(255, 255, 255, 0.05);\n          color: #fff;\n        }\n\n        .roi-calculator__breakdown {\n          margin-top: 1rem;\n          padding-top: 1rem;\n          border-top: 1px solid rgba(255, 255, 255, 0.1);\n        }\n\n        .roi-calculator__breakdown-title {\n          font-size: 0.875rem;\n          font-weight: 600;\n          margin: 0 0 1rem 0;\n        }\n\n        .roi-calculator__breakdown-table {\n          width: 100%;\n          font-size: 0.875rem;\n        }\n\n        .roi-calculator__breakdown-table td {\n          padding: 0.5rem 0;\n          border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n        }\n\n        .roi-calculator__breakdown-table td:last-child {\n          text-align: right;\n          color: #4ade80;\n        }\n\n        .roi-calculator__cta {\n          display: flex;\n          gap: 1rem;\n        }\n\n        .roi-calculator__cta-button {\n          flex: 1;\n          padding: 1rem;\n          border-radius: 8px;\n          font-size: 1rem;\n          font-weight: 600;\n          cursor: pointer;\n          transition: all 0.2s ease;\n        }\n\n        .roi-calculator__cta-button--primary {\n          background: linear-gradient(90deg, #4ade80, #22d3ee);\n          border: none;\n          color: #1a1a2e;\n        }\n\n        .roi-calculator__cta-button--primary:hover {\n          transform: translateY(-2px);\n          box-shadow: 0 4px 20px rgba(74, 222, 128, 0.4);\n        }\n\n        .roi-calculator__cta-button--secondary {\n          background: transparent;\n          border: 1px solid rgba(255, 255, 255, 0.2);\n          color: #fff;\n        }\n\n        .roi-calculator__cta-button--secondary:hover {\n          background: rgba(255, 255, 255, 0.05);\n        }\n\n        @media (max-width: 768px) {\n          .roi-calculator__inputs {\n            grid-template-columns: 1fr;\n          }\n\n          .roi-calculator__metrics {\n            grid-template-columns: repeat(2, 1fr);\n          }\n\n          .roi-calculator__cta {\n            flex-direction: column;\n          }\n        }\n      "}</style>
    </div>);
}
exports.default = ROICalculator;
