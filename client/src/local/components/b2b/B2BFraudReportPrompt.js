"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2BFraudReportPrompt = B2BFraudReportPrompt;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../ui/badge");
var button_1 = require("../ui/button");
var card_1 = require("../ui/card");
var utils_1 = require("../../lib/utils");
function B2BFraudReportPrompt(_a) {
    var className = _a.className, fraudData = _a.fraudData, _b = _a.variant, variant = _b === void 0 ? 'inline' : _b;
    var _c = (0, react_1.useState)(false), isExpanded = _c[0], setIsExpanded = _c[1];
    var handleAPIInterest = function () {
        var _a;
        // Track fraud report API interest
        if (window === null || window === void 0 ? void 0 : window.gtag) {
            window.gtag('event', 'fraud_api_interest', {
                event_category: 'B2B',
                event_label: 'fraud_report_prompt',
                custom_parameters: {
                    risk_score: fraudData === null || fraudData === void 0 ? void 0 : fraudData.riskScore,
                    fraud_indicators: ((_a = fraudData === null || fraudData === void 0 ? void 0 : fraudData.fraudIndicators) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    property_value: fraudData === null || fraudData === void 0 ? void 0 : fraudData.propertyValue,
                    variant: variant
                }
            });
        }
        window.location.href = '/api-demo?focus=fraud-detection';
    };
    var getRiskLevelColor = function (score) {
        if (score < 0.3)
            return 'text-green-600 bg-green-100';
        if (score < 0.7)
            return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };
    var getRiskLevelText = function (score) {
        if (score < 0.3)
            return 'Low Risk';
        if (score < 0.7)
            return 'Medium Risk';
        return 'High Risk';
    };
    if (variant === 'modal') {
        return (<div className={(0, utils_1.cn)('fixed inset-0 bg-black/50 flex items-center justify-center z-50', className)}>
        <card_1.Card className="w-full max-w-2xl mx-4 shadow-2xl">
          <card_1.CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 p-3 rounded-lg">
                  <lucide_react_1.Shield className="w-6 h-6 text-red-600"/>
                </div>
                <div>
                  <card_1.CardTitle className="text-xl">Fraud Detection Complete</card_1.CardTitle>
                  <p className="text-sm text-gray-600">
                    Advanced AI analysis detected potential risks
                  </p>
                </div>
              </div>
              <button onClick={function () { return setIsExpanded(false); }} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-4">
              {fraudData && (<div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Risk Assessment</span>
                    <badge_1.Badge className={getRiskLevelColor(fraudData.riskScore)}>
                      {getRiskLevelText(fraudData.riskScore)}
                    </badge_1.Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {Math.round(fraudData.riskScore * 100)}% Risk Score
                  </div>
                  {fraudData.fraudIndicators.length > 0 && (<div className="text-sm text-gray-600">
                      {fraudData.fraudIndicators.length} fraud indicators detected
                    </div>)}
                </div>)}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <lucide_react_1.Building2 className="w-4 h-4 mr-2"/>
                  Enterprise Fraud Detection API
                </h4>
                <p className="text-sm text-blue-800 mb-4">
                  Process thousands of fraud analyses like this automatically. Banks and insurance 
                  companies use our API to prevent fraud at scale.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-900">95%</div>
                    <div className="text-xs text-blue-700">Accuracy Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-900">10 sec</div>
                    <div className="text-xs text-blue-700">Analysis Time</div>
                  </div>
                </div>
                <button_1.Button onClick={handleAPIInterest} className="w-full bg-blue-600 hover:bg-blue-700">
                  See Fraud Detection API
                  <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
                </button_1.Button>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }
    if (variant === 'sidebar') {
        return (<card_1.Card className={(0, utils_1.cn)('w-80 shadow-lg border-l-4 border-l-red-500', className)}>
        <card_1.CardHeader className="pb-3">
          <card_1.CardTitle className="text-lg flex items-center">
            <lucide_react_1.AlertTriangle className="w-5 h-5 text-red-500 mr-2"/>
            Fraud Analysis
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          {fraudData && (<div className="text-center">
              <div className={(0, utils_1.cn)('text-3xl font-bold mb-1', fraudData.riskScore > 0.7 ? 'text-red-600' :
                    fraudData.riskScore > 0.3 ? 'text-yellow-600' : 'text-green-600')}>
                {Math.round(fraudData.riskScore * 100)}%
              </div>
              <div className="text-sm text-gray-600">Risk Score</div>
            </div>)}

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
              Enterprise API Available
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Automate fraud detection for your platform with our API
            </p>
            <button_1.Button size="sm" onClick={handleAPIInterest} className="w-full text-xs bg-blue-600 hover:bg-blue-700">
              Learn More
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    // Default inline variant
    return (<card_1.Card className={(0, utils_1.cn)('border-l-4 border-l-red-500 shadow-sm', className)}>
      <card_1.CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <lucide_react_1.Shield className="w-5 h-5 text-red-600"/>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Fraud Detection Complete
              </h4>
              {fraudData && (<div className="text-sm text-gray-600 mb-2">
                  Risk Score: <span className="font-medium">{Math.round(fraudData.riskScore * 100)}%</span>
                  {fraudData.fraudIndicators.length > 0 && (<span className="ml-2">
                      • {fraudData.fraudIndicators.length} indicators found
                    </span>)}
                </div>)}
              <p className="text-sm text-gray-600 mb-3">
                <strong>For Businesses:</strong> Process fraud detection at scale with our API. 
                Banks and insurers prevent millions in losses.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <lucide_react_1.TrendingUp className="w-3 h-3 mr-1"/>
                  <span>95% accuracy</span>
                </div>
                <div className="flex items-center">
                  <lucide_react_1.Eye className="w-3 h-3 mr-1"/>
                  <span>Real-time analysis</span>
                </div>
              </div>
            </div>
          </div>
          <button_1.Button size="sm" onClick={handleAPIInterest} className="bg-red-600 hover:bg-red-700 text-white">
            API Demo
            <lucide_react_1.ArrowRight className="w-3 h-3 ml-1"/>
          </button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
