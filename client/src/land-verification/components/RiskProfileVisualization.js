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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RiskProfileVisualization;
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var select_1 = require("../../local/components/ui/select");
var slider_1 = require("../../local/components/ui/slider");
var tabs_1 = require("../../local/components/ui/tabs");
var utils_1 = require("../../local/lib/utils");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var DEFAULT_RISK_WEIGHTS = [
    { category: 'ownership', weight: 0.3, adjustable: true },
    { category: 'government', weight: 0.25, adjustable: true },
    { category: 'legal', weight: 0.2, adjustable: true },
    { category: 'physical', weight: 0.15, adjustable: true },
    { category: 'community', weight: 0.1, adjustable: true }
];
var RISK_COLORS = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444'
};
var CATEGORY_COLORS = {
    ownership: '#3b82f6',
    government: '#8b5cf6',
    legal: '#ef4444',
    physical: '#10b981',
    community: '#f59e0b'
};
function RiskProfileVisualization(_a) {
    var riskFactors = _a.riskFactors, riskInteractions = _a.riskInteractions, onUpdateWeights = _a.onUpdateWeights, onRecalculateRisk = _a.onRecalculateRisk, onExportAnalysis = _a.onExportAnalysis, className = _a.className;
    var _b = (0, react_1.useState)(DEFAULT_RISK_WEIGHTS), riskWeights = _b[0], setRiskWeights = _b[1];
    var _c = (0, react_1.useState)('current'), selectedTimeframe = _c[0], setSelectedTimeframe = _c[1];
    var _d = (0, react_1.useState)('overview'), viewMode = _d[0], setViewMode = _d[1];
    // Calculate risk distribution by category
    var riskDistribution = (0, react_1.useMemo)(function () {
        var distribution = {
            ownership: { count: 0, totalImpact: 0, avgSeverity: 0 },
            government: { count: 0, totalImpact: 0, avgSeverity: 0 },
            legal: { count: 0, totalImpact: 0, avgSeverity: 0 },
            physical: { count: 0, totalImpact: 0, avgSeverity: 0 },
            community: { count: 0, totalImpact: 0, avgSeverity: 0 }
        };
        riskFactors.forEach(function (factor) {
            var category = factor.category;
            if (distribution[category]) {
                distribution[category].count++;
                distribution[category].totalImpact += factor.impact;
            }
        });
        // Calculate averages
        Object.keys(distribution).forEach(function (key) {
            var category = key;
            if (distribution[category].count > 0) {
                distribution[category].avgSeverity = distribution[category].totalImpact / distribution[category].count;
            }
        });
        return distribution;
    }, [riskFactors]);
    // Calculate weighted risk score
    var weightedRiskScore = (0, react_1.useMemo)(function () {
        var totalScore = 0;
        var totalWeight = 0;
        riskWeights.forEach(function (weight) {
            var categoryData = riskDistribution[weight.category];
            if (categoryData.count > 0) {
                totalScore += categoryData.avgSeverity * weight.weight;
                totalWeight += weight.weight;
            }
        });
        return totalWeight > 0 ? (totalScore / totalWeight) * 10 : 0; // Scale to 0-100
    }, [riskDistribution, riskWeights]);
    var handleWeightChange = function (category, newWeight) {
        var updatedWeights = riskWeights.map(function (w) {
            return w.category === category ? __assign(__assign({}, w), { weight: newWeight / 100 }) : w;
        });
        setRiskWeights(updatedWeights);
        var weightMap = updatedWeights.reduce(function (acc, w) {
            acc[w.category] = w.weight;
            return acc;
        }, {});
        onUpdateWeights(weightMap);
    };
    var resetWeights = function () {
        setRiskWeights(DEFAULT_RISK_WEIGHTS);
        var weightMap = DEFAULT_RISK_WEIGHTS.reduce(function (acc, w) {
            acc[w.category] = w.weight;
            return acc;
        }, {});
        onUpdateWeights(weightMap);
    };
    var getRiskLevel = function (score) {
        if (score >= 80)
            return 'critical';
        if (score >= 60)
            return 'high';
        if (score >= 40)
            return 'medium';
        return 'low';
    };
    var RiskGauge = function (_a) {
        var score = _a.score, _b = _a.size, size = _b === void 0 ? 120 : _b;
        var riskLevel = getRiskLevel(score);
        var circumference = 2 * Math.PI * (size / 2 - 10);
        var strokeDasharray = circumference;
        var strokeDashoffset = circumference - (score / 100) * circumference;
        return (<div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 10} stroke="#e5e7eb" strokeWidth="8" fill="transparent"/>
          <circle cx={size / 2} cy={size / 2} r={size / 2 - 10} stroke={RISK_COLORS[riskLevel]} strokeWidth="8" fill="transparent" strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-500"/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(score)}</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {riskLevel}
          </span>
        </div>
      </div>);
    };
    var CategoryChart = function () { return (<div className="space-y-4">
      {Object.entries(riskDistribution).map(function (_a) {
            var _b;
            var category = _a[0], data = _a[1];
            var categoryKey = category;
            var weight = ((_b = riskWeights.find(function (w) { return w.category === categoryKey; })) === null || _b === void 0 ? void 0 : _b.weight) || 0;
            var weightedScore = data.avgSeverity * weight * 100;
            return (<div key={category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[categoryKey] }}/>
                <span className="font-medium capitalize">{category}</span>
                <badge_1.Badge variant="outline" className="text-xs">
                  {data.count} factors
                </badge_1.Badge>
              </div>
              <span className="text-sm font-medium">
                {Math.round(weightedScore)}/100
              </span>
            </div>
            <progress_1.Progress value={weightedScore} className="h-2" style={{
                    '--progress-background': CATEGORY_COLORS[categoryKey]
                }}/>
          </div>);
        })}
    </div>); };
    var WeightControls = function () { return (<div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Risk Category Weights</h4>
        <button_1.Button variant="outline" size="sm" onClick={resetWeights}>
          Reset to Default
        </button_1.Button>
      </div>
      
      {riskWeights.map(function (weight) { return (<div key={weight.category} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium capitalize">{weight.category}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(weight.weight * 100)}%
            </span>
          </div>
          <slider_1.Slider value={[weight.weight * 100]} onValueChange={function (_a) {
            var value = _a[0];
            return handleWeightChange(weight.category, value);
        }} max={100} step={5} disabled={!weight.adjustable} className="w-full"/>
        </div>); })}
      
      <div className="text-xs text-muted-foreground">
        Total weight: {Math.round(riskWeights.reduce(function (sum, w) { return sum + w.weight; }, 0) * 100)}%
      </div>
    </div>); };
    var InteractionMatrix = function () { return (<div className="space-y-4">
      <h4 className="font-medium">Risk Interactions</h4>
      {riskInteractions.length > 0 ? (<div className="space-y-3">
          {riskInteractions.map(function (interaction) { return (<card_1.Card key={interaction.id}>
              <card_1.CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <badge_1.Badge variant="outline" className="capitalize">
                    {interaction.interactionType}
                  </badge_1.Badge>
                  <div className="flex items-center gap-1">
                    {interaction.impactMultiplier > 1 ? (<lucide_react_1.TrendingUp className="h-4 w-4 text-red-600"/>) : (<lucide_react_1.TrendingDown className="h-4 w-4 text-green-600"/>)}
                    <span className="text-sm font-medium">
                      {interaction.impactMultiplier.toFixed(1)}x
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {interaction.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <div className="flex items-center gap-2">
                    <progress_1.Progress value={interaction.confidence * 100} className="h-1 w-16"/>
                    <span className="text-xs">
                      {Math.round(interaction.confidence * 100)}%
                    </span>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>); })}
        </div>) : (<div className="text-center py-8 text-muted-foreground">
          <lucide_react_1.Target className="h-12 w-12 mx-auto mb-4 opacity-50"/>
          <p>No risk interactions detected</p>
        </div>)}
    </div>); };
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <card_1.CardTitle>Risk Profile Analysis</card_1.CardTitle>
            <card_1.CardDescription>
              Interactive visualization and analysis of property risk factors
            </card_1.CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select_1.Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <select_1.SelectTrigger className="w-32">
                <select_1.SelectValue />
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="current">Current</select_1.SelectItem>
                <select_1.SelectItem value="30d">30 Days</select_1.SelectItem>
                <select_1.SelectItem value="90d">90 Days</select_1.SelectItem>
                <select_1.SelectItem value="1y">1 Year</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
            <button_1.Button variant="outline" size="sm" onClick={onRecalculateRisk}>
              <lucide_react_1.RefreshCw className="h-4 w-4"/>
            </button_1.Button>
            <button_1.Button variant="outline" size="sm" onClick={onExportAnalysis}>
              <lucide_react_1.Download className="h-4 w-4"/>
            </button_1.Button>
          </div>
        </div>
      </card_1.CardHeader>

      <card_1.CardContent>
        <tabs_1.Tabs value={viewMode} onValueChange={setViewMode}>
          <tabs_1.TabsList className="grid w-full grid-cols-3">
            <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="detailed">Detailed Analysis</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="trends">Risk Trends</tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          <tabs_1.TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Gauge */}
              <card_1.Card>
                <card_1.CardHeader className="pb-3">
                  <card_1.CardTitle className="text-base">Overall Risk Score</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="flex justify-center">
                  <RiskGauge score={weightedRiskScore}/>
                </card_1.CardContent>
              </card_1.Card>

              {/* Risk Distribution */}
              <card_1.Card>
                <card_1.CardHeader className="pb-3">
                  <card_1.CardTitle className="text-base">Risk by Category</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <CategoryChart />
                </card_1.CardContent>
              </card_1.Card>

              {/* Quick Stats */}
              <card_1.Card>
                <card_1.CardHeader className="pb-3">
                  <card_1.CardTitle className="text-base">Risk Summary</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {riskFactors.filter(function (f) { return f.severity === 'critical' || f.severity === 'high'; }).length}
                      </div>
                      <div className="text-xs text-muted-foreground">High Risk</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {riskFactors.filter(function (f) { return f.severity === 'medium'; }).length}
                      </div>
                      <div className="text-xs text-muted-foreground">Medium Risk</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {riskFactors.filter(function (f) { return f.severity === 'low'; }).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Low Risk</div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="text-center">
                      <div className="text-lg font-bold">{riskInteractions.length}</div>
                      <div className="text-xs text-muted-foreground">Risk Interactions</div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </div>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="detailed" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-base flex items-center gap-2">
                    <lucide_react_1.Settings className="h-4 w-4"/>
                    Weight Configuration
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <WeightControls />
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-base flex items-center gap-2">
                    <lucide_react_1.Target className="h-4 w-4"/>
                    Risk Interactions
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <InteractionMatrix />
                </card_1.CardContent>
              </card_1.Card>
            </div>

            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-base">Risk Factor Details</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-3">
                  {riskFactors.map(function (factor) { return (<div key={factor.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{factor.category}</span>
                          <badge_1.Badge className={(0, utils_1.cn)('text-xs', factor.severity === 'critical' ? 'bg-red-100 text-red-800' :
                factor.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    factor.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800')}>
                            {factor.severity}
                          </badge_1.Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{factor.impact}/10</div>
                        <div className="text-xs text-muted-foreground">Impact</div>
                      </div>
                    </div>); })}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="trends" className="space-y-6">
            <div className="text-center py-12 text-muted-foreground">
              <lucide_react_1.BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50"/>
              <h3 className="text-lg font-semibold mb-2">Risk Trend Analysis</h3>
              <p className="mb-4">
                Historical risk trend analysis would be displayed here with interactive charts
              </p>
              <div className="text-sm">
                Features would include:
                <ul className="mt-2 space-y-1">
                  <li>• Risk score evolution over time</li>
                  <li>• Category-specific trend analysis</li>
                  <li>• Predictive risk modeling</li>
                  <li>• Comparative analysis with similar properties</li>
                </ul>
              </div>
            </div>
          </tabs_1.TabsContent>
        </tabs_1.Tabs>
      </card_1.CardContent>
    </card_1.Card>);
}
