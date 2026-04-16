/**
 * Institutional Pricing Page
 *
 * Dedicated pricing page for banks, developers, and institutional investors.
 * Features NPL Recovery packages, annual contracts, and ROI calculator.
 */

import React from 'react'
import { ROICalculator } from '../components/ROICalculator'

// ============================================================================
// Types
// ============================================================================

interface InstitutionalPlan {
  name: string;
  description: string;
  price: string;
  priceNote: string;
  features: string[];
  highlighted: boolean;
  ctaText: string;
}

// ============================================================================
// Pricing Plans
// ============================================================================

const INSTITUTIONAL_PLANS: InstitutionalPlan[] = [
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

const CASE_STUDIES = [
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

export function InstitutionalPricing(): React.ReactElement {
  return (
    <div className="institutional-pricing">
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
            {INSTITUTIONAL_PLANS.map((plan, index) => (
              <div
                key={index}
                className={`institutional-pricing__plan ${
                  plan.highlighted ? 'institutional-pricing__plan--highlighted' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="institutional-pricing__plan-badge">Most Popular</div>
                )}
                <h3 className="institutional-pricing__plan-name">{plan.name}</h3>
                <p className="institutional-pricing__plan-description">{plan.description}</p>
                <div className="institutional-pricing__plan-price">
                  <span className="institutional-pricing__plan-price-value">{plan.price}</span>
                  <span className="institutional-pricing__plan-price-note">{plan.priceNote}</span>
                </div>
                <ul className="institutional-pricing__plan-features">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="institutional-pricing__plan-feature">
                      <span className="institutional-pricing__plan-feature-icon">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <button className="institutional-pricing__plan-cta">{plan.ctaText}</button>
              </div>
            ))}
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
          <ROICalculator />
        </div>
      </section>

      {/* Case Studies */}
      <section className="institutional-pricing__case-studies">
        <div className="institutional-pricing__container">
          <h2 className="institutional-pricing__section-title">Client Results</h2>
          <div className="institutional-pricing__case-studies-grid">
            {CASE_STUDIES.map((study, index) => (
              <div key={index} className="institutional-pricing__case-study">
                <div className="institutional-pricing__case-study-stat">{study.stat}</div>
                <div className="institutional-pricing__case-study-description">
                  {study.description}
                </div>
                <blockquote className="institutional-pricing__case-study-quote">
                  "{study.quote}"
                </blockquote>
                <cite className="institutional-pricing__case-study-bank">— {study.bank}</cite>
              </div>
            ))}
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
      <style>{`
        .institutional-pricing {
          min-height: 100vh;
          background: #0a0a0a;
          color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .institutional-pricing__container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Hero */
        .institutional-pricing__hero {
          padding: 6rem 2rem;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%);
          text-align: center;
        }

        .institutional-pricing__badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(74, 222, 128, 0.1);
          border: 1px solid rgba(74, 222, 128, 0.3);
          border-radius: 20px;
          color: #4ade80;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }

        .institutional-pricing__title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 1.5rem 0;
        }

        .institutional-pricing__title-highlight {
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .institutional-pricing__subtitle {
          font-size: 1.25rem;
          color: #94a3b8;
          max-width: 600px;
          margin: 0 auto 3rem;
        }

        .institutional-pricing__hero-stats {
          display: flex;
          justify-content: center;
          gap: 4rem;
        }

        .institutional-pricing__stat {
          text-align: center;
        }

        .institutional-pricing__stat-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #4ade80;
        }

        .institutional-pricing__stat-label {
          font-size: 0.875rem;
          color: #64748b;
        }

        /* Problem Section */
        .institutional-pricing__problem {
          padding: 5rem 0;
          background: #0f0f0f;
        }

        .institutional-pricing__section-title {
          font-size: 2rem;
          font-weight: 700;
          text-align: center;
          margin: 0 0 1rem 0;
        }

        .institutional-pricing__section-subtitle {
          text-align: center;
          color: #94a3b8;
          margin-bottom: 3rem;
        }

        .institutional-pricing__problem-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .institutional-pricing__problem-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 2rem;
        }

        .institutional-pricing__problem-card--solution {
          background: rgba(74, 222, 128, 0.05);
          border-color: rgba(74, 222, 128, 0.2);
        }

        .institutional-pricing__problem-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }

        .institutional-pricing__problem-card h3 {
          font-size: 1.25rem;
          margin: 0 0 0.75rem 0;
        }

        .institutional-pricing__problem-card p {
          color: #94a3b8;
          margin: 0;
          line-height: 1.6;
        }

        /* Plans */
        .institutional-pricing__plans {
          padding: 5rem 0;
        }

        .institutional-pricing__plans-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .institutional-pricing__plan {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          position: relative;
          transition: all 0.3s ease;
        }

        .institutional-pricing__plan:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .institutional-pricing__plan--highlighted {
          background: rgba(74, 222, 128, 0.05);
          border-color: rgba(74, 222, 128, 0.3);
        }

        .institutional-pricing__plan-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          color: #0a0a0a;
          padding: 0.25rem 1rem;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .institutional-pricing__plan-name {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
        }

        .institutional-pricing__plan-description {
          color: #64748b;
          margin: 0 0 1.5rem 0;
        }

        .institutional-pricing__plan-price {
          margin-bottom: 1.5rem;
        }

        .institutional-pricing__plan-price-value {
          font-size: 2rem;
          font-weight: 800;
          color: #4ade80;
        }

        .institutional-pricing__plan-price-note {
          display: block;
          font-size: 0.875rem;
          color: #64748b;
        }

        .institutional-pricing__plan-features {
          list-style: none;
          padding: 0;
          margin: 0 0 2rem 0;
        }

        .institutional-pricing__plan-feature {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
          font-size: 0.875rem;
          color: #e2e8f0;
        }

        .institutional-pricing__plan-feature-icon {
          color: #4ade80;
          font-weight: bold;
        }

        .institutional-pricing__plan-cta {
          width: 100%;
          padding: 1rem;
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          border: none;
          border-radius: 8px;
          color: #0a0a0a;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .institutional-pricing__plan-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(74, 222, 128, 0.4);
        }

        /* ROI Section */
        .institutional-pricing__roi-section {
          padding: 5rem 0;
          background: #0f0f0f;
        }

        /* Case Studies */
        .institutional-pricing__case-studies {
          padding: 5rem 0;
        }

        .institutional-pricing__case-studies-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          margin-top: 3rem;
        }

        .institutional-pricing__case-study {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 2rem;
        }

        .institutional-pricing__case-study-stat {
          font-size: 3rem;
          font-weight: 800;
          color: #4ade80;
        }

        .institutional-pricing__case-study-description {
          color: #94a3b8;
          margin-bottom: 1.5rem;
        }

        .institutional-pricing__case-study-quote {
          font-style: italic;
          color: #e2e8f0;
          margin: 0 0 1rem 0;
          padding-left: 1rem;
          border-left: 2px solid #4ade80;
        }

        .institutional-pricing__case-study-bank {
          color: #64748b;
          font-size: 0.875rem;
        }

        /* Final CTA */
        .institutional-pricing__final-cta {
          padding: 5rem 0;
          background: linear-gradient(135deg, #1a1a2e 0%, #0a0a0a 100%);
          text-align: center;
        }

        .institutional-pricing__final-cta-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 0 0 1rem 0;
        }

        .institutional-pricing__final-cta-subtitle {
          color: #94a3b8;
          margin: 0 0 2rem 0;
        }

        .institutional-pricing__final-cta-buttons {
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        .institutional-pricing__cta-button {
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .institutional-pricing__cta-button--primary {
          background: linear-gradient(90deg, #4ade80, #22d3ee);
          border: none;
          color: #0a0a0a;
        }

        .institutional-pricing__cta-button--secondary {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #fff;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .institutional-pricing__plans-grid,
          .institutional-pricing__problem-grid {
            grid-template-columns: 1fr;
          }

          .institutional-pricing__hero-stats {
            flex-direction: column;
            gap: 1.5rem;
          }

          .institutional-pricing__title {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 768px) {
          .institutional-pricing__case-studies-grid {
            grid-template-columns: 1fr;
          }

          .institutional-pricing__final-cta-buttons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}

export default InstitutionalPricing;
