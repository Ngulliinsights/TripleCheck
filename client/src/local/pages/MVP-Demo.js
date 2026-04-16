"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MVPDemo;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var DocumentAuthentication_1 = require("../../trust/components/DocumentAuthentication");
var PropertyRiskAssessment_1 = require("../../trust/components/PropertyRiskAssessment");
function MVPDemo() {
    var _this = this;
    var _a;
    var _b = (0, react_1.useState)('fraud-detection'), activeDemo = _b[0], setActiveDemo = _b[1];
    var demoPropertyId = (0, react_1.useState)(1)[0]; // Mock property ID for demo
    var navigate = (0, react_router_dom_1.useNavigate)();
    var demoSections = [
        {
            id: 'fraud-detection',
            title: 'Fraud Detection',
            icon: <lucide_react_1.Shield className="w-5 h-5"/>,
            description: 'Analyze actual property data for fraud patterns'
        },
        {
            id: 'document-auth',
            title: 'Document Authentication',
            icon: <lucide_react_1.FileText className="w-5 h-5"/>,
            description: 'Real document verification with AI analysis'
        },
        {
            id: 'community-intel',
            title: 'Community Intelligence',
            icon: <lucide_react_1.Users className="w-5 h-5"/>,
            description: 'Leverage community reviews and feedback'
        },
        {
            id: 'risk-assessment',
            title: 'Risk Assessment',
            icon: <lucide_react_1.TrendingUp className="w-5 h-5"/>,
            description: 'Comprehensive property risk analysis'
        },
        {
            id: 'dashboard',
            title: 'User Dashboard',
            icon: <lucide_react_1.TrendingUp className="w-5 h-5"/>,
            description: 'Full platform dashboard experience'
        }
    ];
    var FraudDetectionDemo = function () {
        var _a, _b;
        var _c = (0, react_1.useState)(false), loading = _c[0], setLoading = _c[1];
        var _d = (0, react_1.useState)(null), results = _d[0], setResults = _d[1];
        var runFraudDetection = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch('/api/fraud-intelligence/trends?period=month')];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        setResults(data.data);
                        return [3 /*break*/, 6];
                    case 4:
                        error_1 = _a.sent();
                        console.error('Fraud detection failed:', error_1);
                        return [3 /*break*/, 6];
                    case 5:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        return (<div className="space-y-6">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <lucide_react_1.Shield className="w-8 h-8 text-red-600"/>
            <div>
              <h3 className="text-xl font-semibold text-red-900">Real Fraud Detection</h3>
              <p className="text-red-700">Using actual property data to identify suspicious patterns</p>
            </div>
          </div>
          
          <div className="mb-4">
            <button onClick={runFraudDetection} disabled={loading} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Analyzing Properties...' : 'Run Fraud Analysis'}
            </button>
          </div>

          {results && (<div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-3">Analysis Results</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-2xl font-bold text-red-600">{((_a = results.summary) === null || _a === void 0 ? void 0 : _a.totalCases) || 0}</div>
                  <div className="text-sm text-gray-600">Suspicious Properties</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    KES {((((_b = results.summary) === null || _b === void 0 ? void 0 : _b.totalAmount) || 0) / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-600">Total Value at Risk</div>
                </div>
              </div>
              
              {results.trends && results.trends.length > 0 && (<div>
                  <h5 className="font-medium mb-2">Fraud Trends</h5>
                  <div className="space-y-2">
                    {results.trends.map(function (trend, index) { return (<div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="capitalize">{trend.type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{trend.totalCases} cases</span>
                          <span className={"text-sm font-medium ".concat(trend.change > 0 ? 'text-red-600' : 'text-green-600')}>
                            {trend.change > 0 ? '+' : ''}{trend.change}%
                          </span>
                        </div>
                      </div>); })}
                  </div>
                </div>)}
            </div>)}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <lucide_react_1.CheckCircle className="w-5 h-5 text-blue-600 mt-0.5"/>
            <div>
              <h4 className="font-medium text-blue-900">What&apos;s Real Here</h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Analyzes actual property data from our database</li>
                <li>• Compares prices against location averages</li>
                <li>• Detects duplicate listings and suspicious patterns</li>
                <li>• Identifies properties with missing images or descriptions</li>
                <li>• Tracks owner listing patterns for anomalies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>);
    };
    var CommunityIntelligenceDemo = function () {
        var _a = (0, react_1.useState)(false), loading = _a[0], setLoading = _a[1];
        var _b = (0, react_1.useState)(null), intelligence = _b[0], setIntelligence = _b[1];
        var loadCommunityIntelligence = function () { return __awaiter(_this, void 0, void 0, function () {
            var response, data, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoading(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch("/api/community/intelligence/".concat(demoPropertyId))];
                    case 2:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        setIntelligence(data.data);
                        return [3 /*break*/, 6];
                    case 4:
                        error_2 = _a.sent();
                        console.error('Community intelligence failed:', error_2);
                        return [3 /*break*/, 6];
                    case 5:
                        setLoading(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        }); };
        return (<div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <lucide_react_1.Users className="w-8 h-8 text-blue-600"/>
            <div>
              <h3 className="text-xl font-semibold text-blue-900">Community Intelligence</h3>
              <p className="text-blue-700">Real community feedback and neighborhood insights</p>
            </div>
          </div>
          
          <div className="mb-4">
            <button onClick={loadCommunityIntelligence} disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Loading Intelligence...' : 'Load Community Data'}
            </button>
          </div>

          {intelligence && (<div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-3">Community Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-blue-600">{intelligence.communityScore}</div>
                  <div className="text-sm text-gray-600">Community Score</div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-green-600">{intelligence.reviewCount}</div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-yellow-600">{intelligence.averageRating.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-purple-600">{intelligence.ownerTrustScore}</div>
                  <div className="text-sm text-gray-600">Owner Trust</div>
                </div>
              </div>

              {intelligence.riskIndicators && intelligence.riskIndicators.length > 0 && (<div>
                  <h5 className="font-medium mb-2 text-orange-600">Risk Indicators</h5>
                  <div className="space-y-1">
                    {intelligence.riskIndicators.map(function (indicator, index) { return (<div key={index} className="flex items-center gap-2 text-sm">
                        <lucide_react_1.AlertTriangle className="w-4 h-4 text-orange-500"/>
                        <span>{indicator}</span>
                      </div>); })}
                  </div>
                </div>)}
            </div>)}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <lucide_react_1.CheckCircle className="w-5 h-5 text-green-600 mt-0.5"/>
            <div>
              <h4 className="font-medium text-green-900">What&apos;s Real Here</h4>
              <ul className="text-sm text-green-800 mt-2 space-y-1">
                <li>• Uses actual review data from our database</li>
                <li>• Calculates real owner trust scores</li>
                <li>• Analyzes neighborhood price trends</li>
                <li>• Detects suspicious review patterns</li>
                <li>• Provides market comparison data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>);
    };
    return (<div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              TripleCheck Platform Demo
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Experience our comprehensive property verification platform with real fraud detection, 
              document authentication, and community intelligence capabilities.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <div className="flex items-start gap-3">
                <lucide_react_1.CheckCircle className="w-5 h-5 text-blue-600 mt-0.5"/>
                <div>
                  <h3 className="font-medium text-blue-900">Full Platform Access</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Test all features including document verification, fraud detection, community intelligence, 
                    and access the complete user dashboard - no signup required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {demoSections.map(function (section) { return (<button key={section.id} onClick={function () { return setActiveDemo(section.id); }} className={"flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ".concat(activeDemo === section.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}>
                {section.icon}
                <span className="font-medium">{section.title}</span>
              </button>); })}
          </div>
          <p className="text-muted-foreground mt-2">
            {(_a = demoSections.find(function (s) { return s.id === activeDemo; })) === null || _a === void 0 ? void 0 : _a.description}
          </p>
        </div>

        {/* Demo Content */}
        <div className="space-y-8">
          {activeDemo === 'fraud-detection' && <FraudDetectionDemo />}
          
          {activeDemo === 'document-auth' && (<div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <lucide_react_1.CheckCircle className="w-5 h-5 text-green-600 mt-0.5"/>
                  <div>
                    <h4 className="font-medium text-green-900">Real Document Authentication</h4>
                    <p className="text-sm text-green-800 mt-1">
                      Upload actual documents to see real metadata analysis, file signature verification, 
                      and tampering detection. No more fake progress bars.
                    </p>
                  </div>
                </div>
              </div>
              <DocumentAuthentication_1.default />
            </div>)}
          
          {activeDemo === 'community-intel' && <CommunityIntelligenceDemo />}
          
          {activeDemo === 'risk-assessment' && (<div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <lucide_react_1.CheckCircle className="w-5 h-5 text-purple-600 mt-0.5"/>
                  <div>
                    <h4 className="font-medium text-purple-900">Comprehensive Risk Assessment</h4>
                    <p className="text-sm text-purple-800 mt-1">
                      Combines real community intelligence, market analysis, and property data 
                      to provide actionable risk insights.
                    </p>
                  </div>
                </div>
              </div>
              <PropertyRiskAssessment_1.default propertyId={demoPropertyId}/>
            </div>)}
          
          {activeDemo === 'dashboard' && (<div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <lucide_react_1.CheckCircle className="w-5 h-5 text-blue-600 mt-0.5"/>
                  <div>
                    <h4 className="font-medium text-blue-900">Full Platform Experience</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Access the complete user dashboard with property management, verification history, 
                      and account features - no authentication required for this demo.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-8 text-center">
                <lucide_react_1.TrendingUp className="w-16 h-16 text-primary mx-auto mb-4"/>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Experience the Full Dashboard
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  See how users manage their properties, track verifications, view analytics, 
                  and access all platform features in our comprehensive dashboard.
                </p>
                <button onClick={function () { return navigate('/dashboard'); }} className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
                  Open Dashboard
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  Opens in the same window • Full functionality available
                </p>
              </div>
            </div>)}
        </div>

        {/* Platform Features */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Capabilities</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <lucide_react_1.CheckCircle className="w-4 h-4 text-green-600 mt-0.5"/>
                  <span>Advanced fraud detection and pattern analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <lucide_react_1.CheckCircle className="w-4 h-4 text-green-600 mt-0.5"/>
                  <span>Document authentication and verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <lucide_react_1.CheckCircle className="w-4 h-4 text-green-600 mt-0.5"/>
                  <span>Community intelligence and market insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <lucide_react_1.CheckCircle className="w-4 h-4 text-green-600 mt-0.5"/>
                  <span>Comprehensive risk assessment tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <lucide_react_1.CheckCircle className="w-4 h-4 text-green-600 mt-0.5"/>
                  <span>Integrated payment processing</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Capabilities</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <lucide_react_1.TrendingUp className="w-4 h-4 text-blue-600 mt-0.5"/>
                  <span>Machine learning-powered pattern recognition</span>
                </li>
                <li className="flex items-start gap-2">
                  <lucide_react_1.TrendingUp className="w-4 h-4 text-blue-600 mt-0.5"/>
                  <span>Government registry integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <lucide_react_1.TrendingUp className="w-4 h-4 text-blue-600 mt-0.5"/>
                  <span>Expert network coordination</span>
                </li>
                <li className="flex items-start gap-2">
                  <lucide_react_1.TrendingUp className="w-4 h-4 text-blue-600 mt-0.5"/>
                  <span>Blockchain verification infrastructure</span>
                </li>
                <li className="flex items-start gap-2">
                  <lucide_react_1.TrendingUp className="w-4 h-4 text-blue-600 mt-0.5"/>
                  <span>Real-time monitoring and alerts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>);
}
