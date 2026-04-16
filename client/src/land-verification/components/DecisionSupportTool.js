"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionSupportTool = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var RISK_EXPLANATIONS = {
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
var DECISION_FRAMEWORKS = {
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
var DecisionSupportTool = function (_a) {
    var riskFactors = _a.riskFactors, propertyValue = _a.propertyValue, _b = _a.userRiskTolerance, userRiskTolerance = _b === void 0 ? 'medium' : _b, onDecisionMade = _a.onDecisionMade;
    var _c = (0, react_1.useState)(null), selectedRisk = _c[0], setSelectedRisk = _c[1];
    var _d = (0, react_1.useState)(null), showExplanation = _d[0], setShowExplanation = _d[1];
    var _e = (0, react_1.useState)(null), activeScenario = _e[0], setActiveScenario = _e[1];
    var riskAnalysis = (0, react_1.useMemo)(function () {
        var categoryRisks = riskFactors.reduce(function (acc, risk) {
            if (!acc[risk.category])
                acc[risk.category] = [];
            acc[risk.category].push(risk);
            return acc;
        }, {});
        var overallRiskScore = riskFactors.reduce(function (total, risk) {
            var severityWeight = { low: 1, medium: 2, high: 3, critical: 4 }[risk.severity];
            return total + (severityWeight * risk.confidence * risk.likelihood);
        }, 0) / Math.max(riskFactors.length, 1);
        var framework = DECISION_FRAMEWORKS[userRiskTolerance];
        var recommendation = 'proceed';
        if (overallRiskScore > framework.thresholds.additional) {
            recommendation = 'avoid';
        }
        else if (overallRiskScore > framework.thresholds.caution) {
            recommendation = 'additional_verification';
        }
        else if (overallRiskScore > framework.thresholds.proceed) {
            recommendation = 'proceed_with_caution';
        }
        return {
            categoryRisks: categoryRisks,
            overallRiskScore: overallRiskScore,
            recommendation: recommendation,
            framework: framework
        };
    }, [riskFactors, userRiskTolerance]);
    var generateScenarios = function () {
        var overallRiskScore = riskAnalysis.overallRiskScore, recommendation = riskAnalysis.recommendation;
        var baseScenario = {
            id: 'current',
            title: 'Current Risk Assessment',
            description: 'Based on all available verification data',
            riskLevel: overallRiskScore > 75 ? 'critical' : overallRiskScore > 50 ? 'high' : overallRiskScore > 25 ? 'medium' : 'low',
            recommendation: recommendation,
            reasoning: [],
            mitigationSteps: []
        };
        // Generate reasoning based on risk factors
        var criticalRisks = riskFactors.filter(function (r) { return r.severity === 'critical'; });
        var highRisks = riskFactors.filter(function (r) { return r.severity === 'high'; });
        if (criticalRisks.length > 0) {
            baseScenario.reasoning.push("".concat(criticalRisks.length, " critical risk factor(s) identified"));
        }
        if (highRisks.length > 0) {
            baseScenario.reasoning.push("".concat(highRisks.length, " high-severity risk factor(s) present"));
        }
        // Generate mitigation steps
        riskFactors.forEach(function (risk) {
            var _a;
            if (risk.mitigation) {
                (_a = baseScenario.mitigationSteps).push.apply(_a, risk.mitigation);
            }
        });
        // Remove duplicates
        baseScenario.mitigationSteps = __spreadArray([], new Set(baseScenario.mitigationSteps), true);
        return [baseScenario];
    };
    var scenarios = generateScenarios();
    var getRiskIcon = function (severity) {
        switch (severity) {
            case 'critical': return <lucide_react_1.AlertTriangle className="h-5 w-5 text-red-600"/>;
            case 'high': return <lucide_react_1.AlertTriangle className="h-5 w-5 text-orange-600"/>;
            case 'medium': return <lucide_react_1.Info className="h-5 w-5 text-yellow-600"/>;
            case 'low': return <lucide_react_1.CheckCircle className="h-5 w-5 text-green-600"/>;
            default: return <lucide_react_1.Info className="h-5 w-5 text-gray-600"/>;
        }
    };
    var getRecommendationColor = function (recommendation) {
        switch (recommendation) {
            case 'proceed': return 'text-green-800 bg-green-100';
            case 'proceed_with_caution': return 'text-yellow-800 bg-yellow-100';
            case 'additional_verification': return 'text-orange-800 bg-orange-100';
            case 'avoid': return 'text-red-800 bg-red-100';
            default: return 'text-gray-800 bg-gray-100';
        }
    };
    var renderRiskExplanation = function (riskId) {
        var explanation = showExplanation && RISK_EXPLANATIONS[showExplanation];
        if (!explanation)
            return null;
        var factor = explanation.factors[riskId];
        if (!factor)
            return null;
        return (<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
        <h4 className="font-medium text-blue-900 mb-2">Risk Explanation</h4>
        <p className="text-blue-800 mb-3">{factor.explanation}</p>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Warning Signs</h5>
            <ul className="text-sm text-blue-800 list-disc list-inside">
              {factor.indicators.map(function (indicator, index) { return (<li key={index}>{indicator}</li>); })}
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Potential Consequences</h5>
            <ul className="text-sm text-blue-800 list-disc list-inside">
              {factor.consequences.map(function (consequence, index) { return (<li key={index}>{consequence}</li>); })}
            </ul>
          </div>
        </div>
      </div>);
    };
    return (<div className="space-y-6">
      {/* Risk Tolerance Framework */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">
          Decision Framework: {riskAnalysis.framework.name}
        </h3>
        <p className="text-gray-700 text-sm mb-3">{riskAnalysis.framework.description}</p>
        <div className="flex flex-wrap gap-2">
          {riskAnalysis.framework.considerations.map(function (consideration, index) { return (<span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {consideration}
            </span>); })}
        </div>
      </div>

      {/* Risk Factor Analysis */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Risk Factor Analysis</h3>
        <div className="space-y-4">
          {Object.entries(riskAnalysis.categoryRisks).map(function (_a) {
            var _b, _c;
            var category = _a[0], risks = _a[1];
            return (<div key={category} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {((_b = RISK_EXPLANATIONS[category]) === null || _b === void 0 ? void 0 : _b.title) || category}
                </h4>
                <button onClick={function () { return setShowExplanation(showExplanation === category ? null : category); }} className="text-blue-600 hover:text-blue-800">
                  <lucide_react_1.HelpCircle className="h-4 w-4"/>
                </button>
              </div>
              
              {showExplanation === category && (<div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                  <p className="text-blue-800 text-sm">
                    {(_c = RISK_EXPLANATIONS[category]) === null || _c === void 0 ? void 0 : _c.description}
                  </p>
                </div>)}
              
              <div className="space-y-2">
                {risks.map(function (risk) { return (<div key={risk.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={function () { return setSelectedRisk((selectedRisk === null || selectedRisk === void 0 ? void 0 : selectedRisk.id) === risk.id ? null : risk); }}>
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
                      
                      {(selectedRisk === null || selectedRisk === void 0 ? void 0 : selectedRisk.id) === risk.id && risk.mitigation && (<div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <h5 className="text-sm font-medium text-green-900 mb-1">Mitigation Options</h5>
                          <ul className="text-sm text-green-800 list-disc list-inside">
                            {risk.mitigation.map(function (step, index) { return (<li key={index}>{step}</li>); })}
                          </ul>
                        </div>)}
                    </div>
                  </div>); })}
              </div>
            </div>);
        })}
        </div>
      </div>

      {/* Decision Scenarios */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Decision Recommendations</h3>
        <div className="space-y-4">
          {scenarios.map(function (scenario) { return (<div key={scenario.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">{scenario.title}</h4>
                <span className={"px-2 py-1 rounded text-sm font-medium ".concat(getRecommendationColor(scenario.recommendation))}>
                  {scenario.recommendation.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <p className="text-gray-700 text-sm mb-3">{scenario.description}</p>
              
              {scenario.reasoning.length > 0 && (<div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-900 mb-1">Key Factors</h5>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {scenario.reasoning.map(function (reason, index) { return (<li key={index}>{reason}</li>); })}
                  </ul>
                </div>)}
              
              {scenario.mitigationSteps.length > 0 && (<div className="mb-3">
                  <h5 className="text-sm font-medium text-gray-900 mb-1">Recommended Actions</h5>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {scenario.mitigationSteps.slice(0, 5).map(function (step, index) { return (<li key={index}>{step}</li>); })}
                  </ul>
                </div>)}
              
              {onDecisionMade && (<button onClick={function () { return onDecisionMade(scenario.recommendation, scenario.reasoning); }} className="mt-3 bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">
                  Accept This Recommendation
                </button>)}
            </div>); })}
        </div>
      </div>
    </div>);
};
exports.DecisionSupportTool = DecisionSupportTool;
exports.default = exports.DecisionSupportTool;
