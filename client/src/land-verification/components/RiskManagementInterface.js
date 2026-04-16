"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.default = RiskManagementInterface;
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var tabs_1 = require("../../local/components/ui/tabs");
var utils_1 = require("../../local/lib/utils");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var RecommendationEngine_1 = require("./RecommendationEngine");
var RiskAssessmentDisplay_1 = require("./RiskAssessmentDisplay");
var RiskFactorAnalysis_1 = require("./RiskFactorAnalysis");
var RiskProfileVisualization_1 = require("./RiskProfileVisualization");
var RiskWeightingControls_1 = require("./RiskWeightingControls");
var ScenarioModelingTool_1 = require("./ScenarioModelingTool");
function RiskManagementInterface(_a) {
    var _this = this;
    var sessionId = _a.sessionId, riskAssessment = _a.riskAssessment, onUpdateRiskWeights = _a.onUpdateRiskWeights, onRecalculateRisk = _a.onRecalculateRisk, onExportReport = _a.onExportReport, onSaveConfiguration = _a.onSaveConfiguration, onShareAnalysis = _a.onShareAnalysis, className = _a.className;
    var _b = (0, react_1.useState)('overview'), activeTab = _b[0], setActiveTab = _b[1];
    var _c = (0, react_1.useState)(false), isRecalculating = _c[0], setIsRecalculating = _c[1];
    var _d = (0, react_1.useState)({
        weights: {
            ownership: 0.3,
            government: 0.25,
            legal: 0.2,
            physical: 0.15,
            community: 0.1
        },
        thresholds: {
            critical: 80,
            high: 60,
            medium: 40,
            low: 0
        },
        preferences: {
            riskTolerance: 'medium',
            analysisDepth: 'detailed',
            autoRefresh: false,
            alertsEnabled: true
        }
    }), configuration = _d[0], setConfiguration = _d[1];
    var calculateRiskTrend = function (factors) {
        // This would typically analyze historical data
        // For now, return a mock trend based on current factors
        var highRiskFactors = factors.filter(function (f) { return f.severity === 'critical' || f.severity === 'high'; }).length;
        var totalFactors = factors.length;
        if (totalFactors === 0)
            return 'stable';
        var highRiskRatio = highRiskFactors / totalFactors;
        if (highRiskRatio > 0.5)
            return 'increasing';
        if (highRiskRatio < 0.2)
            return 'decreasing';
        return 'stable';
    };
    // Calculate derived metrics
    var riskMetrics = (0, react_1.useMemo)(function () {
        var factors = riskAssessment.riskFactors;
        var criticalCount = factors.filter(function (f) { return f.severity === 'critical'; }).length;
        var highCount = factors.filter(function (f) { return f.severity === 'high'; }).length;
        var mediumCount = factors.filter(function (f) { return f.severity === 'medium'; }).length;
        var lowCount = factors.filter(function (f) { return f.severity === 'low'; }).length;
        var totalFactors = factors.length;
        var averageImpact = totalFactors > 0
            ? factors.reduce(function (sum, f) { return sum + f.impact; }, 0) / totalFactors
            : 0;
        var riskTrend = calculateRiskTrend(factors);
        return {
            totalFactors: totalFactors,
            criticalCount: criticalCount,
            highCount: highCount,
            mediumCount: mediumCount,
            lowCount: lowCount,
            averageImpact: averageImpact,
            riskTrend: riskTrend,
            interactionCount: riskAssessment.riskInteractions.length,
            recommendationCount: riskAssessment.recommendations.length
        };
    }, [riskAssessment]);
    var handleRecalculateRisk = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsRecalculating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, onRecalculateRisk()];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    setIsRecalculating(false);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [onRecalculateRisk]);
    var handleUpdateWeights = (0, react_1.useCallback)(function (weights) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setConfiguration(function (prev) { return (__assign(__assign({}, prev), { weights: weights })); });
                    return [4 /*yield*/, onUpdateRiskWeights(weights)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [onUpdateRiskWeights]);
    var handleSaveConfiguration = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, onSaveConfiguration(configuration)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [configuration, onSaveConfiguration]);
    var handleExportReport = (0, react_1.useCallback)(function (format) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, onExportReport(format)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [onExportReport]);
    var getRiskLevelColor = function (level) {
        switch (level) {
            case 'low':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'high':
                return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'critical':
                return 'text-red-600 bg-red-50 border-red-200';
        }
    };
    var getTrendIcon = function (trend) {
        switch (trend) {
            case 'increasing':
                return <lucide_react_1.TrendingUp className="h-4 w-4 text-red-600"/>;
            case 'decreasing':
                return <lucide_react_1.TrendingUp className="h-4 w-4 text-green-600 rotate-180"/>;
            default:
                return <lucide_react_1.Target className="h-4 w-4 text-blue-600"/>;
        }
    };
    return (<div className={(0, utils_1.cn)('space-y-6', className)}>
      {/* Header Section */}
      <card_1.Card>
        <card_1.CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.BarChart3 className="h-5 w-5"/>
                Risk Management Dashboard
              </card_1.CardTitle>
              <card_1.CardDescription>
                Comprehensive risk analysis and scenario modeling for property verification
              </card_1.CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button_1.Button variant="outline" size="sm" onClick={handleRecalculateRisk} disabled={isRecalculating}>
                <lucide_react_1.RefreshCw className={(0, utils_1.cn)('h-4 w-4', isRecalculating && 'animate-spin')}/>
                {isRecalculating ? 'Updating...' : 'Refresh'}
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={handleSaveConfiguration}>
                <lucide_react_1.Save className="h-4 w-4"/>
                Save Config
              </button_1.Button>
              <button_1.Button variant="outline" size="sm" onClick={onShareAnalysis}>
                <lucide_react_1.Share className="h-4 w-4"/>
                Share
              </button_1.Button>
            </div>
          </div>

          {/* Risk Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <card_1.Card>
              <card_1.CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{riskAssessment.overallRiskScore}/100</div>
                <div className="text-sm text-muted-foreground">Overall Risk</div>
                <badge_1.Badge className={(0, utils_1.cn)('mt-1 text-xs', getRiskLevelColor(riskAssessment.riskLevel))}>
                  {riskAssessment.riskLevel.toUpperCase()}
                </badge_1.Badge>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{riskMetrics.totalFactors}</div>
                <div className="text-sm text-muted-foreground">Risk Factors</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {getTrendIcon(riskMetrics.riskTrend)}
                  <span className="text-xs capitalize">{riskMetrics.riskTrend}</span>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{Math.round(riskAssessment.confidence * 100)}%</div>
                <div className="text-sm text-muted-foreground">Confidence</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {riskMetrics.interactionCount} interactions
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card>
              <card_1.CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{riskMetrics.recommendationCount}</div>
                <div className="text-sm text-muted-foreground">Actions</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {riskAssessment.recommendations.filter(function (r) { return r.priority === 'critical' || r.priority === 'high'; }).length} urgent
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </card_1.CardHeader>
      </card_1.Card>

      {/* Critical Alerts */}
      {riskAssessment.riskLevel === 'critical' && (<alert_1.Alert>
          <lucide_react_1.AlertTriangle className="h-4 w-4"/>
          <alert_1.AlertDescription>
            <strong>Critical Risk Detected:</strong> This property has critical risk factors that require immediate attention. 
            Review the detailed analysis and take recommended actions before proceeding.
          </alert_1.AlertDescription>
        </alert_1.Alert>)}

      {/* Main Interface Tabs */}
      <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
        <tabs_1.TabsList className="grid w-full grid-cols-5">
          <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="analysis">Factor Analysis</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="visualization">Visualization</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="scenarios">Scenarios</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="recommendations">Actions</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        <tabs_1.TabsContent value="overview" className="space-y-6">
          <RiskAssessmentDisplay_1.default assessment={riskAssessment} onRefresh={handleRecalculateRisk} onExportReport={function () { return handleExportReport('pdf'); }} onViewDetails={function (factorId) {
            // Handle factor detail view
            console.log('View factor details:', factorId);
        }}/>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RiskFactorAnalysis_1.default riskFactors={riskAssessment.riskFactors} riskInteractions={riskAssessment.riskInteractions} onFactorUpdate={function (factorId, updates) {
            // Handle factor updates
            console.log('Update factor:', factorId, updates);
        }}/>
            </div>
            <div>
              <RiskWeightingControls_1.default currentWeights={configuration.weights} onWeightsChange={handleUpdateWeights} onResetWeights={function () {
            var defaultWeights = {
                ownership: 0.3,
                government: 0.25,
                legal: 0.2,
                physical: 0.15,
                community: 0.1
            };
            handleUpdateWeights(defaultWeights);
        }}/>
            </div>
          </div>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="visualization" className="space-y-6">
          <RiskProfileVisualization_1.default riskFactors={riskAssessment.riskFactors} riskInteractions={riskAssessment.riskInteractions} onUpdateWeights={handleUpdateWeights} onRecalculateRisk={handleRecalculateRisk} onExportAnalysis={function () { return handleExportReport('excel'); }}/>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="scenarios" className="space-y-6">
          <ScenarioModelingTool_1.default baselineRiskFactors={riskAssessment.riskFactors} onRunScenario={function (scenario) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Mock scenario execution
                return [2 /*return*/, {
                        scenarioId: scenario.id,
                        projectedRiskScore: riskAssessment.overallRiskScore + Math.random() * 20 - 10,
                        impactAnalysis: {
                            riskChange: Math.random() * 30 - 15,
                            affectedFactors: scenario.modifications.length,
                            confidenceLevel: 0.8
                        },
                        recommendations: [
                            {
                                id: 'rec-1',
                                priority: 'high',
                                category: 'mitigation',
                                title: 'Scenario-based recommendation',
                                description: 'Based on the scenario analysis, consider this action',
                                actionItems: ['Action 1', 'Action 2'],
                                estimatedCost: 50000,
                                estimatedTimeframe: '2-4 weeks'
                            }
                        ]
                    }];
            });
        }); }} onSaveScenario={function (scenario) {
            console.log('Save scenario:', scenario);
        }}/>
        </tabs_1.TabsContent>

        <tabs_1.TabsContent value="recommendations" className="space-y-6">
          <RecommendationEngine_1.default recommendations={riskAssessment.recommendations} riskFactors={riskAssessment.riskFactors} onImplementAction={function (recommendationId, actionId) {
            console.log('Implement action:', recommendationId, actionId);
        }} onDismissRecommendation={function (recommendationId) {
            console.log('Dismiss recommendation:', recommendationId);
        }} onRequestExpertHelp={function (recommendationId) {
            console.log('Request expert help:', recommendationId);
        }}/>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>

      {/* Export Options */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="text-base">Export & Reporting</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="flex items-center gap-2">
            <button_1.Button variant="outline" size="sm" onClick={function () { return handleExportReport('pdf'); }}>
              <lucide_react_1.Download className="h-4 w-4 mr-2"/>
              PDF Report
            </button_1.Button>
            <button_1.Button variant="outline" size="sm" onClick={function () { return handleExportReport('excel'); }}>
              <lucide_react_1.Download className="h-4 w-4 mr-2"/>
              Excel Analysis
            </button_1.Button>
            <button_1.Button variant="outline" size="sm" onClick={function () { return handleExportReport('json'); }}>
              <lucide_react_1.Download className="h-4 w-4 mr-2"/>
              Raw Data
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
