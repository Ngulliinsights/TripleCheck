"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2BFraudReportBanner = B2BFraudReportBanner;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../ui/button");
var utils_1 = require("../../lib/utils");
function B2BFraudReportBanner(_a) {
    var className = _a.className, fraudStats = _a.fraudStats;
    var handleAPIInterest = function () {
        if (window === null || window === void 0 ? void 0 : window.gtag) {
            window.gtag('event', 'fraud_banner_click', {
                event_category: 'B2B',
                event_label: 'fraud_report_banner'
            });
        }
        window.location.href = '/api-demo?focus=fraud-detection';
    };
    return (<div className={(0, utils_1.cn)('bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white py-8 relative overflow-hidden', className)}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}/>
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="bg-white/20 p-4 rounded-xl">
              <lucide_react_1.Shield className="w-8 h-8"/>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Enterprise Fraud Detection API
              </h2>
              <p className="text-red-100 text-lg max-w-2xl">
                The same powerful fraud detection you see in our reports, now available as an API 
                for banks, insurance companies, and real estate platforms.
              </p>
            </div>
          </div>

          {fraudStats && (<div className="hidden lg:flex items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{fraudStats.totalReports.toLocaleString()}</div>
                <div className="text-red-200 text-sm">Reports Generated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{fraudStats.fraudPrevented.toLocaleString()}</div>
                <div className="text-red-200 text-sm">Fraud Cases Prevented</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{fraudStats.accuracyRate}%</div>
                <div className="text-red-200 text-sm">Accuracy Rate</div>
              </div>
            </div>)}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-red-100 mb-4 sm:mb-0">
            <div className="flex items-center">
              <lucide_react_1.AlertTriangle className="w-4 h-4 mr-2"/>
              <span>Real-time fraud detection</span>
            </div>
            <div className="flex items-center">
              <lucide_react_1.TrendingUp className="w-4 h-4 mr-2"/>
              <span>95% accuracy rate</span>
            </div>
            <div className="flex items-center">
              <lucide_react_1.Building2 className="w-4 h-4 mr-2"/>
              <span>Enterprise-ready</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <button_1.Button onClick={handleAPIInterest} className="bg-white text-red-600 hover:bg-red-50 font-semibold">
              Explore Fraud API
              <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
            </button_1.Button>
            <button_1.Button variant="outline" onClick={function () { return window.location.href = '/contact-sales?focus=fraud-detection'; }} className="border-white text-white hover:bg-white/10">
              Contact Sales
            </button_1.Button>
          </div>
        </div>
      </div>
    </div>);
}
