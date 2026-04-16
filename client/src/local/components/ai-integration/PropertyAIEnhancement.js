"use strict";
/**
 * Property AI Enhancement Component
 *
 * Displays AI-powered enhancements for property listings including
 * valuation, risk assessment, fraud detection, and market insights.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyAIEnhancement = PropertyAIEnhancement;
var react_1 = require("react");
var card_1 = require("../ui/card");
var badge_1 = require("../ui/badge");
var button_1 = require("../ui/button");
var tabs_1 = require("../ui/tabs");
var progress_1 = require("../ui/progress");
var alert_1 = require("../ui/alert");
var skeleton_1 = require("../ui/skeleton");
var lucide_react_1 = require("lucide-react");
var useAIIntegration_1 = require("../../hooks/useAIIntegration");
var unified_utils_1 = require("../../utils/images/unified-utils");
function PropertyAIEnhancement(_a) {
    var _b, _c, _d;
    var property = _a.property, _e = _a.showFullAnalysis, showFullAnalysis = _e === void 0 ? true : _e, _f = _a.enableAutoRefresh, enableAutoRefresh = _f === void 0 ? false : _f, _g = _a.className, className = _g === void 0 ? '' : _g;
    var _h = (0, react_1.useState)('overview'), activeTab = _h[0], setActiveTab = _h[1];
    var _j = (0, useAIIntegration_1.usePropertyAI)(property, {
        enableValuation: true,
        enableRiskAssessment: true,
        enableFraudDetection: true,
        enableInsights: true,
        autoRefresh: enableAutoRefresh,
        refreshInterval: 300000 // 5 minutes
    }), data = _j.data, isLoading = _j.isLoading, error = _j.error, refresh = _j.refresh;
    if (isLoading) {
        return <PropertyAIEnhancementSkeleton />;
    }
    if (error) {
        return (<alert_1.Alert variant="destructive">
        <lucide_react_1.AlertTriangle className="h-4 w-4"/>
        <alert_1.AlertDescription>
          Failed to load AI analysis. Please try again.
          <button_1.Button variant="outline" size="sm" onClick={refresh} className="ml-2">
            <lucide_react_1.RefreshCw className="h-4 w-4 mr-1"/>
            Retry
          </button_1.Button>
        </alert_1.AlertDescription>
      </alert_1.Alert>);
    }
    var enhancement = data.enhancement;
    var valuation = data.valuation;
    var riskAssessment = data.riskAssessment;
    var fraudAnalysis = data.fraudAnalysis;
    return (<div className={"space-y-4 ".concat(className)}>
      {/* AI Enhancement Overview */}
      <card_1.Card>
        <card_1.CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <card_1.CardTitle className="text-lg font-semibold flex items-center">
            <lucide_react_1.Brain className="h-5 w-5 mr-2 text-blue-600"/>
            AI Property Analysis
          </card_1.CardTitle>
          <div className="flex items-center space-x-2">
            {data.trustScoreAdjustment && (<badge_1.Badge variant={data.trustScoreAdjustment.adjustment >= 0 ? 'default' : 'destructive'}>
                Trust Score: {data.trustScoreAdjustment.adjustedScore}
                {data.trustScoreAdjustment.adjustment !== 0 && (<span className="ml-1">
                    ({data.trustScoreAdjustment.adjustment > 0 ? '+' : ''}{data.trustScoreAdjustment.adjustment})
                  </span>)}
              </badge_1.Badge>)}
            <button_1.Button variant="outline" size="sm" onClick={refresh}>
              <lucide_react_1.RefreshCw className="h-4 w-4"/>
            </button_1.Button>
          </div>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Valuation Summary */}
            {valuation && (<div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <lucide_react_1.DollarSign className="h-5 w-5 text-green-600"/>
                </div>
                <div>
                  <p className="text-sm font-medium">AI Valuation</p>
                  <p className="text-lg font-bold text-green-600">
                    {(0, unified_utils_1.formatCurrency)(valuation.estimatedValue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Confidence: {Math.round(valuation.confidence * 100)}%
                  </p>
                </div>
              </div>)}

            {/* Risk Assessment Summary */}
            {riskAssessment && (<div className="flex items-center space-x-3">
                <div className={"p-2 rounded-lg ".concat(riskAssessment.overallRisk === 'low' ? 'bg-green-100' :
                riskAssessment.overallRisk === 'medium' ? 'bg-yellow-100' : 'bg-red-100')}>
                  <lucide_react_1.Shield className={"h-5 w-5 ".concat(riskAssessment.overallRisk === 'low' ? 'text-green-600' :
                riskAssessment.overallRisk === 'medium' ? 'text-yellow-600' : 'text-red-600')}/>
                </div>
                <div>
                  <p className="text-sm font-medium">Risk Level</p>
                  <p className={"text-lg font-bold capitalize ".concat(riskAssessment.overallRisk === 'low' ? 'text-green-600' :
                riskAssessment.overallRisk === 'medium' ? 'text-yellow-600' : 'text-red-600')}>
                    {riskAssessment.overallRisk}
                  </p>
                  <p className="text-xs text-gray-500">
                    Score: {riskAssessment.riskScore}/100
                  </p>
                </div>
              </div>)}

            {/* Fraud Detection Summary */}
            {fraudAnalysis && (<div className="flex items-center space-x-3">
                <div className={"p-2 rounded-lg ".concat(fraudAnalysis.riskLevel === 'low' ? 'bg-green-100' :
                fraudAnalysis.riskLevel === 'medium' ? 'bg-yellow-100' : 'bg-red-100')}>
                  <lucide_react_1.Eye className={"h-5 w-5 ".concat(fraudAnalysis.riskLevel === 'low' ? 'text-green-600' :
                fraudAnalysis.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600')}/>
                </div>
                <div>
                  <p className="text-sm font-medium">Fraud Risk</p>
                  <p className={"text-lg font-bold capitalize ".concat(fraudAnalysis.riskLevel === 'low' ? 'text-green-600' :
                fraudAnalysis.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600')}>
                    {fraudAnalysis.riskLevel}
                  </p>
                  <p className="text-xs text-gray-500">
                    Confidence: {Math.round(fraudAnalysis.confidence * 100)}%
                  </p>
                </div>
              </div>)}
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Detailed Analysis Tabs */}
      {showFullAnalysis && (<card_1.Card>
          <card_1.CardContent className="p-0">
            <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
              <tabs_1.TabsList className="grid w-full grid-cols-4">
                <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="valuation">Valuation</tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="risk">Risk Analysis</tabs_1.TabsTrigger>
                <tabs_1.TabsTrigger value="insights">Market Insights</tabs_1.TabsTrigger>
              </tabs_1.TabsList>

              <tabs_1.TabsContent value="overview" className="p-6">
                <AIOverviewTab enhancement={enhancement} valuation={valuation} riskAssessment={riskAssessment} fraudAnalysis={fraudAnalysis}/>
              </tabs_1.TabsContent>

              <tabs_1.TabsContent value="valuation" className="p-6">
                <AIValuationTab valuation={valuation}/>
              </tabs_1.TabsContent>

              <tabs_1.TabsContent value="risk" className="p-6">
                <AIRiskTab riskAssessment={riskAssessment} fraudAnalysis={fraudAnalysis}/>
              </tabs_1.TabsContent>

              <tabs_1.TabsContent value="insights" className="p-6">
                <AIInsightsTab insights={(_c = (_b = data.enhancement) === null || _b === void 0 ? void 0 : _b.aiEnhancements) === null || _c === void 0 ? void 0 : _c.marketInsights} recommendations={(_d = enhancement === null || enhancement === void 0 ? void 0 : enhancement.aiEnhancements) === null || _d === void 0 ? void 0 : _d.recommendations}/>
              </tabs_1.TabsContent>
            </tabs_1.Tabs>
          </card_1.CardContent>
        </card_1.Card>)}
    </div>);
}
// Overview Tab Component
function AIOverviewTab(_a) {
    var _b, _c;
    var enhancement = _a.enhancement, valuation = _a.valuation, riskAssessment = _a.riskAssessment, fraudAnalysis = _a.fraudAnalysis;
    return (<div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">AI Analysis Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Metrics */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-base">Key Metrics</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-3">
              {valuation && (<div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated Value</span>
                  <span className="font-semibold">{(0, unified_utils_1.formatCurrency)(valuation.estimatedValue)}</span>
                </div>)}
              {riskAssessment && (<div className="flex justify-between">
                  <span className="text-sm text-gray-600">Risk Score</span>
                  <span className="font-semibold">{riskAssessment.riskScore}/100</span>
                </div>)}
              {fraudAnalysis && (<div className="flex justify-between">
                  <span className="text-sm text-gray-600">Fraud Risk</span>
                  <badge_1.Badge variant={fraudAnalysis.riskLevel === 'low' ? 'default' : 'destructive'}>
                    {fraudAnalysis.riskLevel}
                  </badge_1.Badge>
                </div>)}
            </card_1.CardContent>
          </card_1.Card>

          {/* AI Recommendations */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-base">AI Recommendations</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              {((_b = enhancement === null || enhancement === void 0 ? void 0 : enhancement.aiEnhancements) === null || _b === void 0 ? void 0 : _b.recommendations) ? (<div className="space-y-2">
                  <p className="text-sm text-blue-600 font-medium">
                    {enhancement.aiEnhancements.recommendations.pricingOptimization}
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {(_c = enhancement.aiEnhancements.recommendations.marketingTips) === null || _c === void 0 ? void 0 : _c.slice(0, 3).map(function (tip, index) { return (<li key={index} className="flex items-start">
                        <lucide_react_1.CheckCircle className="h-3 w-3 text-green-500 mt-0.5 mr-2 flex-shrink-0"/>
                        {tip}
                      </li>); })}
                  </ul>
                </div>) : (<p className="text-sm text-gray-500">No recommendations available</p>)}
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
// Valuation Tab Component
function AIValuationTab(_a) {
    var _b;
    var valuation = _a.valuation;
    if (!valuation) {
        return (<div className="text-center py-8">
        <p className="text-gray-500">Valuation data not available</p>
      </div>);
    }
    return (<div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Property Valuation Analysis</h3>
        
        {/* Valuation Summary */}
        <card_1.Card className="mb-4">
          <card_1.CardContent className="pt-6">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-green-600">
                {(0, unified_utils_1.formatCurrency)(valuation.estimatedValue)}
              </p>
              <p className="text-sm text-gray-600">
                Confidence: {Math.round(valuation.confidence * 100)}%
              </p>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Range: {(0, unified_utils_1.formatCurrency)(valuation.valueRange.min)}</span>
              <span>{(0, unified_utils_1.formatCurrency)(valuation.valueRange.max)}</span>
            </div>
            <progress_1.Progress value={50} className="mt-2"/>
          </card_1.CardContent>
        </card_1.Card>

        {/* Valuation Factors */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="text-base">Valuation Factors</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-3">
              {(_b = valuation.factors) === null || _b === void 0 ? void 0 : _b.map(function (factor, index) { return (<div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={"w-2 h-2 rounded-full ".concat(factor.impact === 'positive' ? 'bg-green-500' :
                factor.impact === 'negative' ? 'bg-red-500' : 'bg-gray-400')}/>
                    <span className="text-sm font-medium">{factor.factor}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">
                      Weight: {Math.round(factor.weight * 100)}%
                    </span>
                  </div>
                </div>); })}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Market Comparison */}
        {valuation.marketComparison && (<card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-base">Market Comparison</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Average Price</p>
                  <p className="font-semibold">{(0, unified_utils_1.formatCurrency)(valuation.marketComparison.averagePrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Price/Sqft</p>
                  <p className="font-semibold">{(0, unified_utils_1.formatCurrency)(valuation.marketComparison.pricePerSqft)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Market Trend</p>
                  <badge_1.Badge variant={valuation.marketComparison.marketTrend === 'rising' ? 'default' : 'secondary'}>
                    {valuation.marketComparison.marketTrend}
                  </badge_1.Badge>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>)}
      </div>
    </div>);
}
// Risk Analysis Tab Component
function AIRiskTab(_a) {
    var _b, _c;
    var riskAssessment = _a.riskAssessment, fraudAnalysis = _a.fraudAnalysis;
    return (<div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Risk Analysis</h3>
        
        {/* Risk Assessment */}
        {riskAssessment && (<card_1.Card className="mb-4">
            <card_1.CardHeader>
              <card_1.CardTitle className="text-base flex items-center">
                <lucide_react_1.Shield className="h-4 w-4 mr-2"/>
                Risk Assessment
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Overall Risk Level</span>
                <badge_1.Badge variant={riskAssessment.overallRisk === 'low' ? 'default' : 'destructive'}>
                  {riskAssessment.overallRisk.toUpperCase()}
                </badge_1.Badge>
              </div>
              
              <div className="space-y-3">
                {(_b = riskAssessment.riskFactors) === null || _b === void 0 ? void 0 : _b.map(function (factor, index) { return (<div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{factor.risk}</span>
                      <badge_1.Badge variant={factor.severity === 'low' ? 'default' : 'destructive'}>
                        {factor.severity}
                      </badge_1.Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{factor.mitigation}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>Likelihood: {Math.round(factor.likelihood * 100)}%</span>
                    </div>
                  </div>); })}
              </div>
            </card_1.CardContent>
          </card_1.Card>)}

        {/* Fraud Analysis */}
        {fraudAnalysis && (<card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-base flex items-center">
                <lucide_react_1.Eye className="h-4 w-4 mr-2"/>
                Fraud Detection
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Fraud Risk Level</span>
                <badge_1.Badge variant={fraudAnalysis.riskLevel === 'low' ? 'default' : 'destructive'}>
                  {fraudAnalysis.riskLevel.toUpperCase()}
                </badge_1.Badge>
              </div>
              
              {((_c = fraudAnalysis.detectedPatterns) === null || _c === void 0 ? void 0 : _c.length) > 0 ? (<div className="space-y-2">
                  <p className="text-sm font-medium">Detected Patterns:</p>
                  {fraudAnalysis.detectedPatterns.map(function (pattern, index) { return (<div key={index} className="flex items-start space-x-2">
                      <lucide_react_1.AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5"/>
                      <div>
                        <p className="text-sm font-medium">{pattern.pattern}</p>
                        <p className="text-xs text-gray-600">{pattern.description}</p>
                      </div>
                    </div>); })}
                </div>) : (<div className="flex items-center space-x-2 text-green-600">
                  <lucide_react_1.CheckCircle className="h-4 w-4"/>
                  <span className="text-sm">No fraud indicators detected</span>
                </div>)}
            </card_1.CardContent>
          </card_1.Card>)}
      </div>
    </div>);
}
// Market Insights Tab Component
function AIInsightsTab(_a) {
    var _b, _c, _d, _e;
    var insights = _a.insights, recommendations = _a.recommendations;
    return (<div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Market Insights & Recommendations</h3>
        
        {/* Market Position */}
        {insights && (<card_1.Card className="mb-4">
            <card_1.CardHeader>
              <card_1.CardTitle className="text-base flex items-center">
                <lucide_react_1.BarChart3 className="h-4 w-4 mr-2"/>
                Market Position
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <p className="text-sm mb-4">{insights.marketPosition}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Key Strengths</p>
                  <ul className="space-y-1">
                    {(_b = insights.keyStrengths) === null || _b === void 0 ? void 0 : _b.map(function (strength, index) { return (<li key={index} className="flex items-start text-sm">
                        <lucide_react_1.CheckCircle className="h-3 w-3 text-green-500 mt-0.5 mr-2 flex-shrink-0"/>
                        {strength}
                      </li>); })}
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Areas of Concern</p>
                  <ul className="space-y-1">
                    {(_c = insights.areasOfConcern) === null || _c === void 0 ? void 0 : _c.map(function (concern, index) { return (<li key={index} className="flex items-start text-sm">
                        <lucide_react_1.Info className="h-3 w-3 text-yellow-500 mt-0.5 mr-2 flex-shrink-0"/>
                        {concern}
                      </li>); })}
                  </ul>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>)}

        {/* AI Recommendations */}
        {recommendations && (<card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-base flex items-center">
                <lucide_react_1.Brain className="h-4 w-4 mr-2"/>
                AI Recommendations
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Pricing Optimization</p>
                  <p className="text-sm text-blue-600">{recommendations.pricingOptimization}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Marketing Tips</p>
                  <ul className="space-y-1">
                    {(_d = recommendations.marketingTips) === null || _d === void 0 ? void 0 : _d.map(function (tip, index) { return (<li key={index} className="flex items-start text-sm">
                        <lucide_react_1.TrendingUp className="h-3 w-3 text-blue-500 mt-0.5 mr-2 flex-shrink-0"/>
                        {tip}
                      </li>); })}
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">Risk Mitigation</p>
                  <ul className="space-y-1">
                    {(_e = recommendations.riskMitigation) === null || _e === void 0 ? void 0 : _e.map(function (action, index) { return (<li key={index} className="flex items-start text-sm">
                        <lucide_react_1.Shield className="h-3 w-3 text-green-500 mt-0.5 mr-2 flex-shrink-0"/>
                        {action}
                      </li>); })}
                  </ul>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>)}
      </div>
    </div>);
}
// Loading Skeleton Component
function PropertyAIEnhancementSkeleton() {
    return (<div className="space-y-4">
      <card_1.Card>
        <card_1.CardHeader>
          <skeleton_1.Skeleton className="h-6 w-48"/>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(function (i) { return (<div key={i} className="flex items-center space-x-3">
                <skeleton_1.Skeleton className="h-10 w-10 rounded-lg"/>
                <div className="space-y-2">
                  <skeleton_1.Skeleton className="h-4 w-20"/>
                  <skeleton_1.Skeleton className="h-6 w-24"/>
                  <skeleton_1.Skeleton className="h-3 w-16"/>
                </div>
              </div>); })}
          </div>
        </card_1.CardContent>
      </card_1.Card>
      
      <card_1.Card>
        <card_1.CardContent className="p-6">
          <skeleton_1.Skeleton className="h-10 w-full mb-4"/>
          <div className="space-y-4">
            {[1, 2, 3].map(function (i) { return (<skeleton_1.Skeleton key={i} className="h-20 w-full"/>); })}
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
