"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2BCommunityInsightsPrompt = B2BCommunityInsightsPrompt;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../ui/badge");
var button_1 = require("../ui/button");
var card_1 = require("../ui/card");
var utils_1 = require("../../lib/utils");
function B2BCommunityInsightsPrompt(_a) {
    var className = _a.className, insightsData = _a.insightsData, _b = _a.variant, variant = _b === void 0 ? 'inline' : _b, _c = _a.context, context = _c === void 0 ? 'community_page' : _c;
    var _d = (0, react_1.useState)(false), isExpanded = _d[0], setIsExpanded = _d[1];
    var handleAPIInterest = function () {
        // Track community insights API interest
        if (window === null || window === void 0 ? void 0 : window.gtag) {
            window.gtag('event', 'community_api_interest', {
                event_category: 'B2B',
                event_label: 'community_insights_prompt',
                custom_parameters: {
                    community_score: insightsData === null || insightsData === void 0 ? void 0 : insightsData.communityScore,
                    total_reports: insightsData === null || insightsData === void 0 ? void 0 : insightsData.totalReports,
                    verified_users: insightsData === null || insightsData === void 0 ? void 0 : insightsData.verifiedUsers,
                    context: context,
                    variant: variant
                }
            });
        }
        window.location.href = '/api-demo?focus=community-intelligence';
    };
    var getCommunityScoreColor = function (score) {
        if (score >= 80)
            return 'text-green-600 bg-green-100';
        if (score >= 60)
            return 'text-blue-600 bg-blue-100';
        if (score >= 40)
            return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };
    var getCommunityScoreText = function (score) {
        if (score >= 80)
            return 'Excellent';
        if (score >= 60)
            return 'Good';
        if (score >= 40)
            return 'Fair';
        return 'Needs Attention';
    };
    if (variant === 'banner') {
        return (<div className={(0, utils_1.cn)('bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4', className)}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <lucide_react_1.Users className="w-6 h-6"/>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Community Intelligence API</h3>
                <p className="text-purple-100">
                  Access community insights like these through our enterprise API
                </p>
              </div>
              {insightsData && (<div className="hidden md:flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg">{insightsData.communityScore}</div>
                    <div className="text-purple-200">Community Score</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{insightsData.totalReports}</div>
                    <div className="text-purple-200">Reports</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{insightsData.verifiedUsers}</div>
                    <div className="text-purple-200">Verified Users</div>
                  </div>
                </div>)}
            </div>
            <button_1.Button onClick={handleAPIInterest} className="bg-white text-purple-600 hover:bg-gray-100">
              Explore API
              <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
            </button_1.Button>
          </div>
        </div>
      </div>);
    }
    if (variant === 'widget') {
        return (<card_1.Card className={(0, utils_1.cn)('w-full max-w-sm shadow-lg border-l-4 border-l-purple-500', className)}>
        <card_1.CardHeader className="pb-3">
          <card_1.CardTitle className="text-lg flex items-center">
            <lucide_react_1.BarChart3 className="w-5 h-5 text-purple-500 mr-2"/>
            Community API
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          {insightsData && (<div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {insightsData.communityScore}
                </div>
                <div className="text-xs text-gray-600">Community Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {insightsData.totalReports}
                </div>
                <div className="text-xs text-gray-600">Total Reports</div>
              </div>
            </div>)}

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
              Enterprise Access
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Get community intelligence data through our API for your platform
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>✓ Real-time data</span>
              <span>✓ Location-based</span>
            </div>
            <button_1.Button size="sm" onClick={handleAPIInterest} className="w-full text-xs bg-purple-600 hover:bg-purple-700">
              Learn More
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    // Default inline variant
    return (<card_1.Card className={(0, utils_1.cn)('border-l-4 border-l-purple-500 shadow-sm', className)}>
      <card_1.CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <lucide_react_1.Users className="w-5 h-5 text-purple-600"/>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Community Intelligence Available
              </h4>
              {insightsData && (<div className="flex items-center space-x-4 mb-2">
                  <badge_1.Badge className={getCommunityScoreColor(insightsData.communityScore)}>
                    {getCommunityScoreText(insightsData.communityScore)}
                  </badge_1.Badge>
                  <span className="text-sm text-gray-600">
                    {insightsData.totalReports} community reports
                  </span>
                  {insightsData.location && (<span className="text-sm text-gray-600 flex items-center">
                      <lucide_react_1.MapPin className="w-3 h-3 mr-1"/>
                      {insightsData.location}
                    </span>)}
                </div>)}
              <p className="text-sm text-gray-600 mb-3">
                <strong>For Businesses:</strong> Access community intelligence data through our API. 
                Real estate platforms and insurers use this for risk assessment.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <lucide_react_1.MessageSquare className="w-3 h-3 mr-1"/>
                  <span>Community reports</span>
                </div>
                <div className="flex items-center">
                  <lucide_react_1.TrendingUp className="w-3 h-3 mr-1"/>
                  <span>Trend analysis</span>
                </div>
                <div className="flex items-center">
                  <lucide_react_1.BarChart3 className="w-3 h-3 mr-1"/>
                  <span>Risk scoring</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <button_1.Button size="sm" onClick={handleAPIInterest} className="bg-purple-600 hover:bg-purple-700 text-white">
              API Demo
              <lucide_react_1.ArrowRight className="w-3 h-3 ml-1"/>
            </button_1.Button>
            {!isExpanded && (<button onClick={function () { return setIsExpanded(true); }} className="text-xs text-purple-600 hover:text-purple-800">
                Learn more
              </button>)}
          </div>
        </div>

        {isExpanded && (<div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-purple-50 rounded-lg p-3">
              <h5 className="font-semibold text-purple-900 mb-2 text-sm">
                Community Intelligence API Features
              </h5>
              <ul className="text-xs text-purple-800 space-y-1">
                <li>• Real-time community sentiment analysis</li>
                <li>• Location-based risk scoring</li>
                <li>• Historical trend data</li>
                <li>• Verified user insights</li>
                <li>• Custom reporting dashboards</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-700">Starting at $500/month</span>
                  <span className="text-purple-700">Enterprise volume discounts</span>
                </div>
              </div>
            </div>
          </div>)}
      </card_1.CardContent>
    </card_1.Card>);
}
