"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2BContextualPrompt = B2BContextualPrompt;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../ui/button");
var utils_1 = require("../../lib/utils");
function B2BContextualPrompt(_a) {
    var className = _a.className, context = _a.context, propertyValue = _a.propertyValue, verificationsCount = _a.verificationsCount, riskScore = _a.riskScore;
    var getContextualMessage = function () {
        switch (context) {
            case 'verification_complete':
                return {
                    title: 'Verification Complete!',
                    message: 'Imagine processing hundreds of these automatically through our API',
                    cta: 'See API Demo',
                    icon: <lucide_react_1.Shield className="w-5 h-5 text-green-500"/>
                };
            case 'high_value_property':
                return {
                    title: 'High-Value Property Detected',
                    message: "KES ".concat(propertyValue === null || propertyValue === void 0 ? void 0 : propertyValue.toLocaleString(), " properties need enterprise-grade verification"),
                    cta: 'Get Enterprise API',
                    icon: <lucide_react_1.Building2 className="w-5 h-5 text-blue-500"/>
                };
            case 'frequent_user':
                return {
                    title: "".concat(verificationsCount, " Verifications This Month"),
                    message: 'You could automate this workflow with our business API',
                    cta: 'Upgrade to API',
                    icon: <lucide_react_1.Zap className="w-5 h-5 text-yellow-500"/>
                };
            case 'fraud_detected':
                return {
                    title: 'Fraud Risk Detected',
                    message: "Risk score: ".concat(riskScore, "%. Our API prevents fraud at scale"),
                    cta: 'Learn More',
                    icon: <lucide_react_1.Shield className="w-5 h-5 text-red-500"/>
                };
            default:
                return {
                    title: 'Business API Available',
                    message: 'Integrate this verification power into your platform',
                    cta: 'Get Started',
                    icon: <lucide_react_1.Building2 className="w-5 h-5 text-blue-500"/>
                };
        }
    };
    var _b = getContextualMessage(), title = _b.title, message = _b.message, cta = _b.cta, icon = _b.icon;
    return (<div className={(0, utils_1.cn)('bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 shadow-sm', className)}>
      <div className="flex items-start space-x-3">
        <div className="bg-white p-2 rounded-lg shadow-sm">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-600 mb-3">{message}</p>
          <button_1.Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={function () { return window.location.href = '/api-demo'; }}>
            {cta}
            <lucide_react_1.ArrowRight className="w-4 h-4 ml-1"/>
          </button_1.Button>
        </div>
      </div>
    </div>);
}
