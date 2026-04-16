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
exports.default = PropertyRiskAssessment;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
function PropertyRiskAssessment(_a) {
    var _this = this;
    var propertyId = _a.propertyId;
    var _b = (0, react_1.useState)(null), assessment = _b[0], setAssessment = _b[1];
    var _c = (0, react_1.useState)(true), loading = _c[0], setLoading = _c[1];
    var _d = (0, react_1.useState)(null), error = _d[0], setError = _d[1];
    (0, react_1.useEffect)(function () {
        fetchRiskAssessment();
    }, [propertyId]);
    var fetchRiskAssessment = function () { return __awaiter(_this, void 0, void 0, function () {
        var communityResponse, communityData, riskAssessment, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setLoading(true);
                    setError(null);
                    return [4 /*yield*/, fetch("/api/community/intelligence/".concat(propertyId))];
                case 1:
                    communityResponse = _a.sent();
                    return [4 /*yield*/, communityResponse.json()];
                case 2:
                    communityData = _a.sent();
                    if (!communityData.success) {
                        throw new Error(communityData.error || 'Failed to fetch community intelligence');
                    }
                    riskAssessment = createRiskAssessment(communityData.data);
                    setAssessment(riskAssessment);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    setError(err_1 instanceof Error ? err_1.message : 'Failed to load risk assessment');
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var createRiskAssessment = function (communityData) {
        var _a, _b, _c;
        var riskFactors = [];
        var totalRisk = 0;
        // Analyze community score
        if (communityData.communityScore < 40) {
            riskFactors.push({
                category: 'community',
                severity: 'high',
                description: 'Low community trust score',
                impact: 30,
                recommendation: 'Investigate community concerns and verify property details'
            });
            totalRisk += 30;
        }
        else if (communityData.communityScore < 60) {
            riskFactors.push({
                category: 'community',
                severity: 'medium',
                description: 'Moderate community trust score',
                impact: 15,
                recommendation: 'Review community feedback and verify key details'
            });
            totalRisk += 15;
        }
        // Analyze owner trust score
        if (communityData.ownerTrustScore < 30) {
            riskFactors.push({
                category: 'ownership',
                severity: 'high',
                description: 'Owner has low trust score',
                impact: 25,
                recommendation: 'Thoroughly verify owner identity and property ownership'
            });
            totalRisk += 25;
        }
        // Analyze review patterns
        if (communityData.reviewCount === 0) {
            riskFactors.push({
                category: 'community',
                severity: 'medium',
                description: 'No community reviews available',
                impact: 10,
                recommendation: 'Seek additional verification from local sources'
            });
            totalRisk += 10;
        }
        else if (communityData.verifiedReviews === 0) {
            riskFactors.push({
                category: 'community',
                severity: 'medium',
                description: 'No verified reviews',
                impact: 15,
                recommendation: 'Request verified reviews or additional documentation'
            });
            totalRisk += 15;
        }
        // Analyze risk indicators
        communityData.riskIndicators.forEach(function (indicator) {
            riskFactors.push({
                category: 'documentation',
                severity: 'medium',
                description: indicator,
                impact: 10,
                recommendation: 'Address this concern before proceeding'
            });
            totalRisk += 10;
        });
        // Determine risk level
        var riskLevel;
        if (totalRisk >= 70)
            riskLevel = 'critical';
        else if (totalRisk >= 50)
            riskLevel = 'high';
        else if (totalRisk >= 30)
            riskLevel = 'medium';
        else
            riskLevel = 'low';
        return {
            overallRiskScore: Math.min(totalRisk, 100),
            riskLevel: riskLevel,
            riskFactors: riskFactors,
            communityIntelligence: {
                communityScore: communityData.communityScore,
                reviewCount: communityData.reviewCount,
                averageRating: communityData.averageRating,
                verifiedReviews: communityData.verifiedReviews,
                riskIndicators: communityData.riskIndicators
            },
            marketAnalysis: {
                priceVsMarket: ((_a = communityData.neighborhoodInsights) === null || _a === void 0 ? void 0 : _a.averagePrice) ?
                    (100 / communityData.neighborhoodInsights.averagePrice) * 100 : 100,
                marketTrend: ((_b = communityData.neighborhoodInsights) === null || _b === void 0 ? void 0 : _b.marketTrend) || 'stable',
                comparableProperties: ((_c = communityData.neighborhoodInsights) === null || _c === void 0 ? void 0 : _c.propertyCount) || 0,
                daysOnMarket: 30 // Mock data
            },
            lastUpdated: communityData.lastUpdated
        };
    };
    var getRiskLevelColor = function (level) {
        switch (level) {
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };
    var getSeverityColor = function (severity) {
        switch (severity) {
            case 'low': return 'text-yellow-600 bg-yellow-100';
            case 'medium': return 'text-orange-600 bg-orange-100';
            case 'high': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    var getCategoryIcon = function (category) {
        switch (category) {
            case 'pricing': return <lucide_react_1.TrendingUp className="w-4 h-4"/>;
            case 'ownership': return <lucide_react_1.Users className="w-4 h-4"/>;
            case 'documentation': return <lucide_react_1.Shield className="w-4 h-4"/>;
            case 'community': return <lucide_react_1.Users className="w-4 h-4"/>;
            case 'market': return <lucide_react_1.MapPin className="w-4 h-4"/>;
            default: return <lucide_react_1.AlertTriangle className="w-4 h-4"/>;
        }
    };
    if (loading) {
        return (<div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>);
    }
    if (error) {
        return (<div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <lucide_react_1.AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4"/>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Load Risk Assessment
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={fetchRiskAssessment} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
            Try Again
          </button>
        </div>
      </div>);
    }
    if (!assessment) {
        return null;
    }
    return (<div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Property Risk Assessment
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <lucide_react_1.Clock className="w-4 h-4"/>
              <span>Last updated: {new Date(assessment.lastUpdated).toLocaleString()}</span>
            </div>
          </div>
          <div className={"px-4 py-2 rounded-lg border font-semibold ".concat(getRiskLevelColor(assessment.riskLevel))}>
            {assessment.riskLevel.toUpperCase()} RISK
          </div>
        </div>
      </div>

      {/* Risk Score */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Overall Risk Score</h3>
          <span className="text-2xl font-bold text-gray-900">
            {assessment.overallRiskScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className={"h-3 rounded-full ".concat(assessment.overallRiskScore >= 70 ? 'bg-red-500' :
            assessment.overallRiskScore >= 50 ? 'bg-orange-500' :
                assessment.overallRiskScore >= 30 ? 'bg-yellow-500' :
                    'bg-green-500')} style={{ width: "".concat(assessment.overallRiskScore, "%") }}/>
        </div>
      </div>

      {/* Risk Factors */}
      {assessment.riskFactors.length > 0 && (<div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Risk Factors</h3>
          <div className="space-y-4">
            {assessment.riskFactors.map(function (factor, index) { return (<div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getCategoryIcon(factor.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {factor.description}
                      </h4>
                      <span className={"px-2 py-1 rounded-full text-xs font-medium ".concat(getSeverityColor(factor.severity))}>
                        {factor.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Impact: {factor.impact} points
                    </p>
                    <p className="text-sm text-blue-600">
                      <strong>Recommendation:</strong> {factor.recommendation}
                    </p>
                  </div>
                </div>
              </div>); })}
          </div>
        </div>)}

      {/* Community Intelligence Summary */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold mb-4">Community Intelligence</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.communityIntelligence.communityScore}
            </div>
            <div className="text-sm text-gray-600">Community Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.communityIntelligence.reviewCount}
            </div>
            <div className="text-sm text-gray-600">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.communityIntelligence.averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.communityIntelligence.verifiedReviews}
            </div>
            <div className="text-sm text-gray-600">Verified</div>
          </div>
        </div>
      </div>

      {/* Market Analysis */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Market Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.marketAnalysis.priceVsMarket.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">vs Market Avg</div>
          </div>
          <div className="text-center">
            <div className={"text-2xl font-bold capitalize ".concat(assessment.marketAnalysis.marketTrend === 'rising' ? 'text-green-600' :
            assessment.marketAnalysis.marketTrend === 'declining' ? 'text-red-600' :
                'text-gray-900')}>
              {assessment.marketAnalysis.marketTrend}
            </div>
            <div className="text-sm text-gray-600">Market Trend</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.marketAnalysis.comparableProperties}
            </div>
            <div className="text-sm text-gray-600">Comparables</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.marketAnalysis.daysOnMarket}
            </div>
            <div className="text-sm text-gray-600">Days on Market</div>
          </div>
        </div>
      </div>
    </div>);
}
