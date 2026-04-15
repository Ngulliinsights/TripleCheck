import { AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'
import React, { useState, useMemo } from 'react'

export interface RiskFactor {
  id: string;
  category: 'ownership' | 'government' | 'legal' | 'physical' | 'community';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  impact: string;
  likelihood: number;
  mitigation?: string[];
}

export interface DecisionScenario {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: 'proceed' | 'proceed_with_caution' | 'additional_verification' | 'avoid';
  reasoning: string[];
  mitigationSteps: string[];
  costImplications?: string;
  timeImplications?: string;
}

interface DecisionSupportToolProps {
  riskFactors: RiskFactor[];
  propertyValue?: number;
  userRiskTolerance?: 'low' | 'medium' | 'high';
  onDecisionMade?: (decision: string, reasoning: string[]) => void;
}

const RISK_EXPLANATIONS = {
  ownership: {
    title: 'Ownership Risks',
    description: 'Risks related to the legitimacy and clarity of property ownership',
    factors: {
      'forged-documents': {
        explanation: 'Documents may be fake or altered, making ownership claims invalid',
        indicators: ['Inconsistent signatures', 'Poor document quality', 'Missing official stamps'],
        consequences: ['Complete loss of investment', 'Legal prosecution risk', 'Inability to transfer ownership']
      },
      'chain-of-title': {
        explanation: 'Gaps or inconsistencies in the ownership history',
        indicators: ['Missing transfer documents', 'Unexplained ownership changes', 'Conflicting records'],
        consequences: ['Future ownership disputes', 'Difficulty in selling', 'Legal challenges']
      },
      'unauthorized-transfer': {
        explanation: 'Property may have been sold without proper authorization',
        indicators: ['Missing consent documents', 'Suspicious transaction timing', 'Below-market pricing'],
        consequences: ['Ownership reversal', 'Financial loss', 'Legal complications']
      }
    }
  },
  government: {
    title: 'Government Designation Risks',
    description: 'Risks from government claims or planned acquisitions',
    factors: {
      'riparian-reserve': {
        explanation: 'Property may fall within water body buffer zones',
        indicators: ['Proximity to rivers/lakes', 'Wetland characteristics', 'Seasonal flooding'],
        consequences: ['Development restrictions', 'Forced relocation', 'Compensation disputes']
      },
      'road-reserve': {
        explanation: 'Property may be affected by planned road expansions',
        indicators: ['Transportation master plans', 'Survey markers', 'Government notices'],
        consequences: ['Partial land acquisition', 'Reduced property value', 'Construction disruption']
      },
      'utility-corridor': {
        explanation: 'Property may have utility right-of-way claims',
        indicators: ['Power line proximity', 'Utility easements', 'Infrastructure plans'],
        consequences: ['Access restrictions', 'Development limitations', 'Safety concerns']
      }
    }
  },
  legal: {
    title: 'Legal History Risks',
    description: 'Risks from past or ongoing legal disputes',
    factors: {
      'active-disputes': {
        explanation: 'Property is subject to ongoing court cases',
        indicators: ['Court case numbers', 'Legal notices', 'Injunction orders'],
        consequences: ['Transaction delays', 'Ownership uncertainty', 'Legal costs']
      },
      'historical-claims': {
        explanation: 'Previous disputes may resurface',
        indicators: ['Settled cases', 'Withdrawn claims', 'Family disputes'],
        consequences: ['Future legal challenges', 'Ownership complications', 'Additional verification needs']
      },
      'succession-issues': {
        explanation: 'Family inheritance disputes affecting ownership',
        indicators: ['Multiple claimants', 'Incomplete succession', 'Family conflicts'],
        consequences: ['Ownership challenges', 'Legal proceedings', 'Transaction complications']
      }
    }
  },
  physical: {
    title: 'Physical Verification Risks',
    description: 'Risks from physical property characteristics and boundaries',
    factors: {
      'boundary-disputes': {
        explanation: 'Unclear or contested property boundaries',
        indicators: ['Missing boundary markers', 'Neighbor disputes', 'Survey discrepancies'],
        consequences: ['Reduced usable area', 'Neighbor conflicts', 'Development restrictions']
      },
      'encroachment': {
        explanation: 'Unauthorized occupation of property portions',
        indicators: ['Informal structures', 'Cultivation activities', 'Access roads'],
        consequences: ['Legal eviction processes', 'Compensation claims', 'Delayed possession']
      },
      'survey-discrepancies': {
        explanation: 'Inconsistencies between documents and physical reality',
        indicators: ['Measurement differences', 'Feature mismatches', 'Coordinate errors'],
        consequences: ['Title deed corrections', 'Survey costs', 'Transaction delays']
      }
    }
  },
  community: {
    title: 'Community Intelligence Risks',
    description: 'Risks identified through local community knowledge',
    factors: {
      'local-disputes': {
        explanation: 'Community-reported conflicts or concerns',
        indicators: ['Neighbor complaints', 'Historical conflicts', 'Cultural sensitivities'],
        consequences: ['Social tensions', 'Access difficulties', 'Community resistance']
      },
      'customary-claims': {
        explanation: 'Traditional or customary land use claims',
        indicators: ['Ancestral connections', 'Traditional practices', 'Community resistance'],
        consequences: ['Cultural conflicts', 'Legal challenges', 'Social complications']
      },
      'reputation-issues': {
        explanation: 'Negative community perception of property or seller',
        indicators: ['Community warnings', 'Seller reputation', 'Historical problems'],
        consequences: ['Social isolation', 'Future sale difficulties', 'Community conflicts']
      }
    }
  }
};

const DECISION_FRAMEWORKS = {
  low: {
    name: 'Conservative Approach',
    description: 'Minimize risk, prioritize security over opportunity',
    thresholds: { proceed: 20, caution: 40, additional: 60 },
    considerations: ['Long-term security', 'Minimal legal exposure', 'Clear ownership chain']
  },
  medium: {
    name: 'Balanced Approach',
    description: 'Balance risk and opportunity with appropriate mitigation',
    thresholds: { proceed: 35, caution: 55, additional: 75 },
    considerations: ['Risk-return balance', 'Manageable mitigation', 'Professional guidance']
  },
  high: {
    name: 'Opportunistic Approach',
    description: 'Accept higher risk for potential rewards',
    thresholds: { proceed: 50, caution: 70, additional: 85 },
    considerations: ['High return potential', 'Risk mitigation capability', 'Market opportunities']
  }
};

export const DecisionSupportTool: React.FC<DecisionSupportToolProps> = ({
  riskFactors,
  propertyValue,
  userRiskTolerance = 'medium',
  onDecisionMade
}) => {
  const [selectedRisk, setSelectedRisk] = useState<RiskFactor | null>(null);
  const [showExplanation, setShowExplanation] = useState<string | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const riskAnalysis = useMemo(() => {
    const categoryRisks = riskFactors.reduce((acc, risk) => {
      if (!acc[risk.category]) acc[risk.category] = [];
      acc[risk.category].push(risk);
      return acc;
    }, {} as Record<string, RiskFactor[]>);

    const overallRiskScore = riskFactors.reduce((total, risk) => {
      const severityWeight = { low: 1, medium: 2, high: 3, critical: 4 }[risk.severity];
      return total + (severityWeight * risk.confidence * risk.likelihood);
    }, 0) / Math.max(riskFactors.length, 1);

    const framework = DECISION_FRAMEWORKS[userRiskTolerance];
    let recommendation: DecisionScenario['recommendation'] = 'proceed';
    
    if (overallRiskScore > framework.thresholds.additional) {
      recommendation = 'avoid';
    } else if (overallRiskScore > framework.thresholds.caution) {
      recommendation = 'additional_verification';
    } else if (overallRiskScore > framework.thresholds.proceed) {
      recommendation = 'proceed_with_caution';
    }

    return {
      categoryRisks,
      overallRiskScore,
      recommendation,
      framework
    };
  }, [riskFactors, userRiskTolerance]);

  const generateScenarios = (): DecisionScenario[] => {
    const { overallRiskScore, recommendation } = riskAnalysis;
    
    const baseScenario: DecisionScenario = {
      id: 'current',
      title: 'Current Risk Assessment',
      description: 'Based on all available verification data',
      riskLevel: overallRiskScore > 75 ? 'critical' : overallRiskScore > 50 ? 'high' : overallRiskScore > 25 ? 'medium' : 'low',
      recommendation,
      reasoning: [],
      mitigationSteps: []
    };

    // Generate reasoning based on risk factors
    const criticalRisks = riskFactors.filter(r => r.severity === 'critical');
    const highRisks = riskFactors.filter(r => r.severity === 'high');
    
    if (criticalRisks.length > 0) {
      baseScenario.reasoning.push(`${criticalRisks.length} critical risk factor(s) identified`);
    }
    if (highRisks.length > 0) {
      baseScenario.reasoning.push(`${highRisks.length} high-severity risk factor(s) present`);
    }
    
    // Generate mitigation steps
    riskFactors.forEach(risk => {
      if (risk.mitigation) {
        baseScenario.mitigationSteps.push(...risk.mitigation);
      }
    });

    // Remove duplicates
    baseScenario.mitigationSteps = [...new Set(baseScenario.mitigationSteps)];

    return [baseScenario];
  };

  const scenarios = generateScenarios();

  const getRiskIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'medium': return <Info className="h-5 w-5 text-yellow-600" />;
      case 'low': return <CheckCircle className="h-5 w-5 text-green-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'proceed': return 'text-green-800 bg-green-100';
      case 'proceed_with_caution': return 'text-yellow-800 bg-yellow-100';
      case 'additional_verification': return 'text-orange-800 bg-orange-100';
      case 'avoid': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  const renderRiskExplanation = (riskId: string) => {
    const explanation = showExplanation && RISK_EXPLANATIONS[showExplanation as keyof typeof RISK_EXPLANATIONS];
    if (!explanation) return null;

    const factor = explanation.factors[riskId as keyof typeof explanation.factors] as any;
    if (!factor) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
        <h4 className="font-medium text-blue-900 mb-2">Risk Explanation</h4>
        <p className="text-blue-800 mb-3">{factor.explanation}</p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Warning Signs</h5>
            <ul className="text-sm text-blue-800 list-disc list-inside">
              {factor.indicators.map((indicator: any, index: number) => (
                <li key={index}>{indicator}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Potential Consequences</h5>
            <ul className="text-sm text-blue-800 list-disc list-inside">
              {factor.consequences.map((consequence: any, index: number) => (
                <li key={index}>{consequence}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Risk Tolerance Framework */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          Decision Framework: {riskAnalysis.framework.name}
        </h3>
        <p className="text-gray-700 text-sm mb-3">{riskAnalysis.framework.description}</p>
        <div className="flex flex-wrap gap-2">
          {riskAnalysis.framework.considerations.map((consideration, index) => (
            <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {consideration}
            </span>
          ))}
        </div>
      </div>

      {/* Risk Factor Analysis */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Risk Factor Analysis</h3>
        <div className="space-y-4">
          {Object.entries(riskAnalysis.categoryRisks).map(([category, risks]) => (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {RISK_EXPLANATIONS[category as keyof typeof RISK_EXPLANATIONS]?.title || category}
                </h4>
                <button
                  onClick={() => setShowExplanation(showExplanation === category ? null : category)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
              
              {showExplanation === category && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                  <p className="text-blue-800 text-sm">
                    {RISK_EXPLANATIONS[category as keyof typeof RISK_EXPLANATIONS]?.description}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                {risks.map(risk => (
                  <div
                    key={risk.id}
                    className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => setSelectedRisk(selectedRisk?.id === risk.id ? null : risk)}
                  >
                    {getRiskIcon(risk.severity)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">{risk.description}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            Confidence: {Math.round(risk.confidence * 100)}%
                          </span>
                          <span className="text-xs text-gray-500">
                            Likelihood: {Math.round(risk.likelihood * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{risk.impact}</p>
                      
                      {selectedRisk?.id === risk.id && risk.mitigation && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <h5 className="text-sm font-medium text-green-900 mb-1">Mitigation Options</h5>
                          <ul className="text-sm text-green-800 list-disc list-inside">
                            {risk.mitigation.map((step, index) => (
                              <li key={index}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Scenarios */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Decision Recommendations</h3>
        <div className="space-y-4">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{scenario.title}</h4>
                <span className={`px-2 py-1 rounded text-sm font-medium ${getRecommendationColor(scenario.recommendation)}`}>
                  {scenario.recommendation.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <p className="text-gray-700 text-sm mb-3">{scenario.description}</p>
              
              {scenario.reasoning.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-900 mb-1">Key Factors</h5>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {scenario.reasoning.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {scenario.mitigationSteps.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-900 mb-1">Recommended Actions</h5>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {scenario.mitigationSteps.slice(0, 5).map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {onDecisionMade && (
                <button
                  onClick={() => onDecisionMade(scenario.recommendation, scenario.reasoning)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Accept This Recommendation
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DecisionSupportTool;