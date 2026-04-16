"use strict";
/**
 * Institutional Pricing Page
 *
 * Dedicated pricing page for banks, developers, and institutional investors.
 * Features NPL Recovery packages, annual contracts, and ROI calculator.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstitutionalPricing = InstitutionalPricing;
var react_1 = require("react");
var ROICalculator_1 = require("../components/ROICalculator");
// ============================================================================
// Pricing Plans
// ============================================================================
var INSTITUTIONAL_PLANS = [
    {
        name: 'NPL Recovery',
        description: 'For banks with Non-Performing Loan portfolios',
        price: 'KSh 50,000',
        priceNote: 'per property verification',
        features: [
            'Full title chain audit',
            'Physical & digital registry cross-check',
            'Blockchain-anchored proof of state',
            'Recovery recommendation report',
            'Collateral valuation assessment',
            'Court-ready evidence package',
            'Expert witness coordination',
            'Priority 48-hour turnaround',
        ],
        highlighted: true,
        ctaText: 'Start Verification',
    },
    {
        name: 'Developer Pre-Listing',
        description: 'For developers clearing land banks',
        price: 'KSh 35,000',
        priceNote: 'per property verification',
        features: [
            'Ownership verification',
            'Encumbrance check',
            'Survey confirmation',
            'Community dispute check',
            'Digital & physical registry validation',
            'Buyer confidence certificate',
            'Standard 5-day turnaround',
        ],
        highlighted: false,
        ctaText: 'Verify Properties',
    },
    {
        name: 'Enterprise Annual',
        description: 'Annual contract for high-volume clients',
        price: 'From KSh 3M',
        priceNote: 'per year (100+ verifications)',
        features: [
            'All NPL Recovery features',
            'Dedicated account manager',
            'Custom integration APIs',
            'Portfolio dashboard access',
            'Bulk CSV upload',
            'Real-time monitoring alerts',
            'Quarterly business reviews',
            'On-site training',
            'SLA guarantees',
        ],
        highlighted: false,
        ctaText: 'Contact Sales',
    },
];
// ============================================================================
// Case Studies
// ============================================================================
var CASE_STUDIES = [
    {
        bank: 'Leading Commercial Bank',
        stat: '23%',
        description: 'improvement in NPL recovery rate',
        quote: 'TripleCheck identified title issues on 8 properties that would have cost us KSh 180M in failed recoveries.',
    },
    {
        bank: 'Regional Credit Union',
        stat: 'KSh 45M',
        description: 'fraud prevented in first year',
        quote: 'The blockchain proof was crucial in court. The judge accepted it as evidence of the original registry state.',
    },
];
// ============================================================================
// Component
// ============================================================================
function InstitutionalPricing() {
    return (<div className="institutional-pricing">
      {/* Hero Section */}
      <section className="institutional-pricing__hero">
        <div className="institutional-pricing__hero-content">
          <div className="institutional-pricing__badge">For Financial Institutions</div>
          <h1 className="institutional-pricing__title">
            Protect Your Collateral.
            <br />
            <span className="institutional-pricing__title-highlight">Maximize Recovery.</span>
          </h1>
          <p className="institutional-pricing__subtitle">
            Enterprise-grade property verification for banks, developers, and institutional investors.
            Blockchain-anchored proofs that hold up in court.
          </p>
          <div className="institutional-pricing__hero-stats">
            <div className="institutional-pricing__stat">
              <div className="institutional-pricing__stat-value">95%</div>
              <div className="institutional-pricing__stat-label">Fraud Detection Rate</div>
            </div>
            <div className="institutional-pricing__stat">
              <div className="institutional-pricing__stat-value">12%</div>
              <div className="institutional-pricing__stat-label">Avg. Recovery Improvement</div>
            </div>
            <div className="institutional-pricing__stat">
              <div className="institutional-pricing__stat-value">48h</div>
              <div className="institutional-pricing__stat-label">Priority Turnaround</div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="institutional-pricing__problem">
        <div className="institutional-pricing__container">
          <h2 className="institutional-pricing__section-title">The Digital Transition Problem</h2>
          <div className="institutional-pricing__problem-grid">
            <div className="institutional-pricing__problem-card">
              <div className="institutional-pricing__problem-icon">⚠️</div>
              <h3>Registry Loopholes</h3>
              <p>
                Kenya's digital land registry transition created a window where records exist in both formats.
                Bad actors exploit this to modify records or create fraudulent entries.
              </p>
            </div>
            <div className="institutional-pricing__problem-card">
              <div className="institutional-pricing__problem-icon">📊</div>
              <h3>NPL Recovery Risk</h3>
              <p>
                8% of NPL properties have title issues discovered only after expensive recovery attempts.
                Average loss: KSh 15M per property.
              </p>
            </div>
            <div className="institutional-pricing__problem-card institutional-pricing__problem-card--solution">
              <div className="institutional-pricing__problem-icon">✅</div>
              <h3>TripleCheck Solution</h3>
              <p>
                Blockchain-anchored snapshots of both physical and digital registry state.
                Detect mismatches before you commit to recovery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="institutional-pricing__plans">
        <div className="institutional-pricing__container">
          <h2 className="institutional-pricing__section-title">Choose Your Package</h2>
          <div className="institutional-pricing__plans-grid">
            {INSTITUTIONAL_PLANS.map(function (plan, index) { return (<div key={index} className={"institutional-pricing__plan ".concat(plan.highlighted ? 'institutional-pricing__plan--highlighted' : '')}>
                {plan.highlighted && (<div className="institutional-pricing__plan-badge">Most Popular</div>)}
                <h3 className="institutional-pricing__plan-name">{plan.name}</h3>
                <p className="institutional-pricing__plan-description">{plan.description}</p>
                <div className="institutional-pricing__plan-price">
                  <span className="institutional-pricing__plan-price-value">{plan.price}</span>
                  <span className="institutional-pricing__plan-price-note">{plan.priceNote}</span>
                </div>
                <ul className="institutional-pricing__plan-features">
                  {plan.features.map(function (feature, featureIndex) { return (<li key={featureIndex} className="institutional-pricing__plan-feature">
                      <span className="institutional-pricing__plan-feature-icon">✓</span>
                      {feature}
                    </li>); })}
                </ul>
                <button className="institutional-pricing__plan-cta">{plan.ctaText}</button>
              </div>); })}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="institutional-pricing__roi-section">
        <div className="institutional-pricing__container">
          <h2 className="institutional-pricing__section-title">Calculate Your ROI</h2>
          <p className="institutional-pricing__section-subtitle">
            See how TripleCheck verification improves your NPL recovery
          </p>
          <ROICalculator_1.ROICalculator />
        </div>
      </section>

      {/* Case Studies */}
      <section className="institutional-pricing__case-studies">
        <div className="institutional-pricing__container">
          <h2 className="institutional-pricing__section-title">Client Results</h2>
          <div className="institutional-pricing__case-studies-grid">
            {CASE_STUDIES.map(function (study, index) { return (<div key={index} className="institutional-pricing__case-study">
                <div className="institutional-pricing__case-study-stat">{study.stat}</div>
                <div className="institutional-pricing__case-study-description">
                  {study.description}
                </div>
                <blockquote className="institutional-pricing__case-study-quote">
                  "{study.quote}"
                </blockquote>
                <cite className="institutional-pricing__case-study-bank">— {study.bank}</cite>
              </div>); })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="institutional-pricing__final-cta">
        <div className="institutional-pricing__container">
          <h2 className="institutional-pricing__final-cta-title">
            Ready to Protect Your Portfolio?
          </h2>
          <p className="institutional-pricing__final-cta-subtitle">
            Schedule a demo with your NPL data. We'll show you exactly which properties have risk.
          </p>
          <div className="institutional-pricing__final-cta-buttons">
            <button className="institutional-pricing__cta-button institutional-pricing__cta-button--primary">
              Schedule Demo
            </button>
            <button className="institutional-pricing__cta-button institutional-pricing__cta-button--secondary">
              Download Capability Deck
            </button>
          </div>
        </div>
      </section>

      {/* Styles */}
      <style>{"\n        .institutional-pricing {\n          min-height: 100vh;\n          background: #0a0a0a;\n          color: #fff;\n          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;\n        }\n\n        .institutional-pricing__container {\n          max-width: 1200px;\n          margin: 0 auto;\n          padding: 0 2rem;\n        }\n\n        /* Hero */\n        .institutional-pricing__hero {\n          padding: 6rem 2rem;\n          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);\n          text-align: center;\n        }\n\n        .institutional-pricing__badge {\n          display: inline-block;\n          padding: 0.5rem 1rem;\n          background: rgba(74, 222, 128, 0.1);\n          border: 1px solid rgba(74, 222, 128, 0.3);\n          border-radius: 20px;\n          color: #4ade80;\n          font-size: 0.875rem;\n          font-weight: 500;\n          margin-bottom: 1.5rem;\n        }\n\n        .institutional-pricing__title {\n          font-size: 3.5rem;\n          font-weight: 800;\n          line-height: 1.1;\n          margin: 0 0 1.5rem 0;\n        }\n\n        .institutional-pricing__title-highlight {\n          background: linear-gradient(90deg, #4ade80, #22d3ee);\n          -webkit-background-clip: text;\n          -webkit-text-fill-color: transparent;\n        }\n\n        .institutional-pricing__subtitle {\n          font-size: 1.25rem;\n          color: #94a3b8;\n          max-width: 600px;\n          margin: 0 auto 3rem;\n        }\n\n        .institutional-pricing__hero-stats {\n          display: flex;\n          justify-content: center;\n          gap: 4rem;\n        }\n\n        .institutional-pricing__stat {\n          text-align: center;\n        }\n\n        .institutional-pricing__stat-value {\n          font-size: 2.5rem;\n          font-weight: 800;\n          color: #4ade80;\n        }\n\n        .institutional-pricing__stat-label {\n          font-size: 0.875rem;\n          color: #64748b;\n        }\n\n        /* Problem Section */\n        .institutional-pricing__problem {\n          padding: 5rem 0;\n          background: #0f0f0f;\n        }\n\n        .institutional-pricing__section-title {\n          font-size: 2rem;\n          font-weight: 700;\n          text-align: center;\n          margin: 0 0 1rem 0;\n        }\n\n        .institutional-pricing__section-subtitle {\n          text-align: center;\n          color: #94a3b8;\n          margin-bottom: 3rem;\n        }\n\n        .institutional-pricing__problem-grid {\n          display: grid;\n          grid-template-columns: repeat(3, 1fr);\n          gap: 2rem;\n          margin-top: 3rem;\n        }\n\n        .institutional-pricing__problem-card {\n          background: rgba(255, 255, 255, 0.03);\n          border: 1px solid rgba(255, 255, 255, 0.1);\n          border-radius: 12px;\n          padding: 2rem;\n        }\n\n        .institutional-pricing__problem-card--solution {\n          background: rgba(74, 222, 128, 0.05);\n          border-color: rgba(74, 222, 128, 0.2);\n        }\n\n        .institutional-pricing__problem-icon {\n          font-size: 2rem;\n          margin-bottom: 1rem;\n        }\n\n        .institutional-pricing__problem-card h3 {\n          font-size: 1.25rem;\n          margin: 0 0 0.75rem 0;\n        }\n\n        .institutional-pricing__problem-card p {\n          color: #94a3b8;\n          margin: 0;\n          line-height: 1.6;\n        }\n\n        /* Plans */\n        .institutional-pricing__plans {\n          padding: 5rem 0;\n        }\n\n        .institutional-pricing__plans-grid {\n          display: grid;\n          grid-template-columns: repeat(3, 1fr);\n          gap: 2rem;\n          margin-top: 3rem;\n        }\n\n        .institutional-pricing__plan {\n          background: rgba(255, 255, 255, 0.02);\n          border: 1px solid rgba(255, 255, 255, 0.1);\n          border-radius: 16px;\n          padding: 2rem;\n          position: relative;\n          transition: all 0.3s ease;\n        }\n\n        .institutional-pricing__plan:hover {\n          transform: translateY(-4px);\n          border-color: rgba(255, 255, 255, 0.2);\n        }\n\n        .institutional-pricing__plan--highlighted {\n          background: rgba(74, 222, 128, 0.05);\n          border-color: rgba(74, 222, 128, 0.3);\n        }\n\n        .institutional-pricing__plan-badge {\n          position: absolute;\n          top: -12px;\n          left: 50%;\n          transform: translateX(-50%);\n          background: linear-gradient(90deg, #4ade80, #22d3ee);\n          color: #0a0a0a;\n          padding: 0.25rem 1rem;\n          border-radius: 12px;\n          font-size: 0.75rem;\n          font-weight: 600;\n        }\n\n        .institutional-pricing__plan-name {\n          font-size: 1.5rem;\n          font-weight: 700;\n          margin: 0 0 0.5rem 0;\n        }\n\n        .institutional-pricing__plan-description {\n          color: #64748b;\n          margin: 0 0 1.5rem 0;\n        }\n\n        .institutional-pricing__plan-price {\n          margin-bottom: 1.5rem;\n        }\n\n        .institutional-pricing__plan-price-value {\n          font-size: 2rem;\n          font-weight: 800;\n          color: #4ade80;\n        }\n\n        .institutional-pricing__plan-price-note {\n          display: block;\n          font-size: 0.875rem;\n          color: #64748b;\n        }\n\n        .institutional-pricing__plan-features {\n          list-style: none;\n          padding: 0;\n          margin: 0 0 2rem 0;\n        }\n\n        .institutional-pricing__plan-feature {\n          display: flex;\n          align-items: center;\n          gap: 0.75rem;\n          padding: 0.5rem 0;\n          font-size: 0.875rem;\n          color: #e2e8f0;\n        }\n\n        .institutional-pricing__plan-feature-icon {\n          color: #4ade80;\n          font-weight: bold;\n        }\n\n        .institutional-pricing__plan-cta {\n          width: 100%;\n          padding: 1rem;\n          background: linear-gradient(90deg, #4ade80, #22d3ee);\n          border: none;\n          border-radius: 8px;\n          color: #0a0a0a;\n          font-size: 1rem;\n          font-weight: 600;\n          cursor: pointer;\n          transition: all 0.2s ease;\n        }\n\n        .institutional-pricing__plan-cta:hover {\n          transform: translateY(-2px);\n          box-shadow: 0 4px 20px rgba(74, 222, 128, 0.4);\n        }\n\n        /* ROI Section */\n        .institutional-pricing__roi-section {\n          padding: 5rem 0;\n          background: #0f0f0f;\n        }\n\n        /* Case Studies */\n        .institutional-pricing__case-studies {\n          padding: 5rem 0;\n        }\n\n        .institutional-pricing__case-studies-grid {\n          display: grid;\n          grid-template-columns: repeat(2, 1fr);\n          gap: 2rem;\n          margin-top: 3rem;\n        }\n\n        .institutional-pricing__case-study {\n          background: rgba(255, 255, 255, 0.02);\n          border: 1px solid rgba(255, 255, 255, 0.1);\n          border-radius: 12px;\n          padding: 2rem;\n        }\n\n        .institutional-pricing__case-study-stat {\n          font-size: 3rem;\n          font-weight: 800;\n          color: #4ade80;\n        }\n\n        .institutional-pricing__case-study-description {\n          color: #94a3b8;\n          margin-bottom: 1.5rem;\n        }\n\n        .institutional-pricing__case-study-quote {\n          font-style: italic;\n          color: #e2e8f0;\n          margin: 0 0 1rem 0;\n          padding-left: 1rem;\n          border-left: 2px solid #4ade80;\n        }\n\n        .institutional-pricing__case-study-bank {\n          color: #64748b;\n          font-size: 0.875rem;\n        }\n\n        /* Final CTA */\n        .institutional-pricing__final-cta {\n          padding: 5rem 0;\n          background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%);\n          text-align: center;\n        }\n\n        .institutional-pricing__final-cta-title {\n          font-size: 2.5rem;\n          font-weight: 800;\n          margin: 0 0 1rem 0;\n        }\n\n        .institutional-pricing__final-cta-subtitle {\n          color: #94a3b8;\n          margin: 0 0 2rem 0;\n        }\n\n        .institutional-pricing__final-cta-buttons {\n          display: flex;\n          justify-content: center;\n          gap: 1rem;\n        }\n\n        .institutional-pricing__cta-button {\n          padding: 1rem 2rem;\n          border-radius: 8px;\n          font-size: 1rem;\n          font-weight: 600;\n          cursor: pointer;\n          transition: all 0.2s ease;\n        }\n\n        .institutional-pricing__cta-button--primary {\n          background: linear-gradient(90deg, #4ade80, #22d3ee);\n          border: none;\n          color: #0a0a0a;\n        }\n\n        .institutional-pricing__cta-button--secondary {\n          background: transparent;\n          border: 1px solid rgba(255, 255, 255, 0.2);\n          color: #fff;\n        }\n\n        /* Responsive */\n        @media (max-width: 1024px) {\n          .institutional-pricing__plans-grid,\n          .institutional-pricing__problem-grid {\n            grid-template-columns: 1fr;\n          }\n\n          .institutional-pricing__hero-stats {\n            flex-direction: column;\n            gap: 1.5rem;\n          }\n\n          .institutional-pricing__title {\n            font-size: 2.5rem;\n          }\n        }\n\n        @media (max-width: 768px) {\n          .institutional-pricing__case-studies-grid {\n            grid-template-columns: 1fr;\n          }\n\n          .institutional-pricing__final-cta-buttons {\n            flex-direction: column;\n            align-items: center;\n          }\n        }\n      "}</style>
    </div>);
}
exports.default = InstitutionalPricing;
