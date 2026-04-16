"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskAssessmentDisplay = RiskAssessmentDisplay;
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
var useLandVerification_1 = require("../hooks/useLandVerification");
var RISK_LEVEL_CONFIG = {
    low: {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: lucide_react_1.Shield,
        description: 'Low risk - Property appears safe for transaction'
    },
    medium: {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: lucide_react_1.Info,
        description: 'Medium risk - Some concerns identified, proceed with caution'
    },
    high: {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: lucide_react_1.AlertTriangle,
        description: 'High risk - Significant issues found, expert review recommended'
    },
    critical: {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: lucide_react_1.XCircle,
        description: 'Critical risk - Do not proceed without resolving major issues'
    }
};
var SEVERITY_COLORS = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
};
var PRIORITY_COLORS = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
};
function RiskAssessmentDisplay(_a) {
    var sessionId = _a.sessionId, onRecommendationAction = _a.onRecommendationAction, _b = _a.showActions, showActions = _b === void 0 ? true : _b;
    var toast = (0, use_toast_1.useToast)().toast;
    var _c = (0, react_1.useState)('overview'), selectedTab = _c[0], setSelectedTab = _c[1];
    var _d = (0, react_1.useState)(null), expandedRiskFactor = _d[0], setExpandedRiskFactor = _d[1];
    var useRiskAssessment = (0, useLandVerification_1.useLandVerification)().useRiskAssessment;
    var _e = useRiskAssessment(sessionId), assessment = _e.data, isLoading = _e.isLoading, error = _e.error;
    var handleRecommendationAction = function (action, recommendation) {
        if (onRecommendationAction) {
            onRecommendationAction(action);
        }
        toast({
            title: "Action Initiated",
            description: "".concat(action, " for \"").concat(recommendation.title, "\" has been started."),
        });
    };
    var handleExportReport = function () {
        // In a real implementation, this would generate and download a PDF report
        toast({
            title: "Report Export",
            description: "Risk assessment report is being generated and will be downloaded shortly.",
        });
    };
    var handleShareReport = function () {
        // In a real implementation, this would open a share dialog
        toast({
            title: "Share Report",
            description: "Share link has been copied to clipboard.",
        });
    };
    if (isLoading) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <lucide_react_1.Clock className="h-5 w-5 animate-spin"/>
            <span>Loading risk assessment...</span>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    if (error) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="text-center">
            <lucide_react_1.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Risk Assessment
            </h3>
            <p className="text-gray-600">
              Unable to retrieve risk assessment data. Please try again.
            </p>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    if (!assessment) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="text-center text-gray-500">
            No risk assessment available yet. Complete verification layers to generate assessment.
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    var riskConfig = RISK_LEVEL_CONFIG[assessment.riskLevel];
    var RiskIcon = riskConfig.icon;
    return (<div className="space-y-6">
      {/* Risk Overview Card */}
      <card_1.Card className={"".concat(riskConfig.bgColor, " ").concat(riskConfig.borderColor, " border-2")}>
        <card_1.CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={"p-3 rounded-full bg-white ".concat(riskConfig.color)}>
                <RiskIcon className="h-6 w-6"/>
              </div>
              <div>
                <card_1.CardTitle className={"text-xl ".concat(riskConfig.color)}>
                  {assessment.riskLevel.toUpperCase()} RISK
                </card_1.CardTitle>
                <card_1.CardDescription className="text-gray-700">
                  {riskConfig.description}
                </card_1.CardDescription>
              </div>
            </div>
            {showActions && (<div className="flex items-center space-x-2">
                <button_1.Button variant="outline" size="sm" onClick={handleShareReport}>
                  <lucide_react_1.Share2 className="h-4 w-4 mr-1"/>
                  Share
                </button_1.Button>
                <button_1.Button variant="outline" size="sm" onClick={handleExportReport}>
                  <lucide_react_1.Download className="h-4 w-4 mr-1"/>
                  Export
                </button_1.Button>
              </div>)}
          </div>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {assessment.overallRiskScore}
              </div>
              <div className="text-sm text-gray-600">Risk Score</div>
              <div className="text-xs text-gray-500">out of 100</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(assessment.confidence * 100)}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
              <div className="text-xs text-gray-500">assessment accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {assessment.riskFactors.length}
              </div>
              <div className="text-sm text-gray-600">Risk Factors</div>
              <div className="text-xs text-gray-500">identified issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {assessment.recommendations.length}
              </div>
              <div className="text-sm text-gray-600">Recommendations</div>
              <div className="text-xs text-gray-500">action items</div>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Detailed Analysis Tabs */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Detailed Risk Analysis</card_1.CardTitle>
          <card_1.CardDescription>
            Comprehensive breakdown of risk factors and recommendations
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <tabs_1.Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <tabs_1.TabsList className="grid w-full grid-cols-3">
              <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="risks">Risk Factors</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="recommendations">Recommendations</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                {/* Risk Score Breakdown */}
                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-lg">Risk Score Breakdown</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="space-y-3">
                      {assessment.riskFactors.map(function (factor) { return (<div key={factor.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <badge_1.Badge className={SEVERITY_COLORS[factor.severity]}>
                              {factor.severity}
                            </badge_1.Badge>
                            <span className="text-sm font-medium">{factor.category}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-24">
                              <progress_1.Progress value={factor.impact} className="h-2"/>
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {factor.impact}/100
                            </span>
                          </div>
                        </div>); })}
                    </div>
                  </card_1.CardContent>
                </card_1.Card>

                {/* Assessment Metadata */}
                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-lg">Assessment Details</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium text-gray-700">Assessment Date</div>
                        <div className="text-gray-900">
                          {new Date(assessment.assessmentDate).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Valid Until</div>
                        <div className="text-gray-900">
                          {new Date(assessment.validUntil).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Session ID</div>
                        <div className="text-gray-900 font-mono text-xs">
                          {assessment.sessionId}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-700">Assessment ID</div>
                        <div className="text-gray-900 font-mono text-xs">
                          {assessment.id}
                        </div>
                      </div>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>
              </div>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="risks" className="space-y-4">
              <div className="space-y-4">
                {assessment.riskFactors.map(function (factor) { return (<card_1.Card key={factor.id} className="cursor-pointer" onClick={function () {
                return setExpandedRiskFactor(expandedRiskFactor === factor.id ? null : factor.id);
            }}>
                    <card_1.CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <badge_1.Badge className={SEVERITY_COLORS[factor.severity]}>
                              {factor.severity}
                            </badge_1.Badge>
                            <h4 className="font-semibold text-gray-900">
                              {factor.category}
                            </h4>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">
                            {factor.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Impact: {factor.impact}/100</span>
                            <span>Likelihood: {factor.likelihood}/100</span>
                            <span>Confidence: {Math.round(factor.confidence * 100)}%</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {factor.impact > 70 && <lucide_react_1.TrendingUp className="h-4 w-4 text-red-500"/>}
                          {factor.impact < 30 && <lucide_react_1.TrendingDown className="h-4 w-4 text-green-500"/>}
                        </div>
                      </div>

                      <framer_motion_1.AnimatePresence>
                        {expandedRiskFactor === factor.id && (<framer_motion_1.motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-4 pt-4 border-t border-gray-200">
                            <div className="space-y-3">
                              {factor.evidence.length > 0 && (<div>
                                  <h5 className="font-medium text-gray-900 mb-2">Evidence</h5>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                    {factor.evidence.map(function (evidence, index) { return (<li key={index}>{evidence}</li>); })}
                                  </ul>
                                </div>)}
                              
                              {factor.mitigation && (<div>
                                  <h5 className="font-medium text-gray-900 mb-2">Mitigation</h5>
                                  <p className="text-sm text-gray-600">{factor.mitigation}</p>
                                </div>)}
                            </div>
                          </framer_motion_1.motion.div>)}
                      </framer_motion_1.AnimatePresence>
                    </card_1.CardContent>
                  </card_1.Card>); })}
              </div>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="recommendations" className="space-y-4">
              <div className="space-y-4">
                {assessment.recommendations.map(function (recommendation) { return (<card_1.Card key={recommendation.id}>
                    <card_1.CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <badge_1.Badge className={PRIORITY_COLORS[recommendation.priority]}>
                              {recommendation.priority}
                            </badge_1.Badge>
                            <h4 className="font-semibold text-gray-900">
                              {recommendation.title}
                            </h4>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {recommendation.description}
                          </p>
                        </div>
                      </div>

                      {recommendation.actionItems.length > 0 && (<div className="mb-4">
                          <h5 className="font-medium text-gray-900 mb-2">Action Items</h5>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {recommendation.actionItems.map(function (item, index) { return (<li key={index}>{item}</li>); })}
                          </ul>
                        </div>)}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {recommendation.estimatedCost && (<div className="flex items-center space-x-1">
                              <lucide_react_1.DollarSign className="h-3 w-3"/>
                              <span>Est. Cost: ${recommendation.estimatedCost.toLocaleString()}</span>
                            </div>)}
                          {recommendation.estimatedTime && (<div className="flex items-center space-x-1">
                              <lucide_react_1.Calendar className="h-3 w-3"/>
                              <span>Est. Time: {recommendation.estimatedTime} hours</span>
                            </div>)}
                        </div>

                        {showActions && (<div className="flex items-center space-x-2">
                            <button_1.Button size="sm" variant="outline" onClick={function () { return handleRecommendationAction('Schedule', recommendation); }}>
                              Schedule
                            </button_1.Button>
                            <button_1.Button size="sm" onClick={function () { return handleRecommendationAction('Implement', recommendation); }}>
                              Implement
                            </button_1.Button>
                          </div>)}
                      </div>
                    </card_1.CardContent>
                  </card_1.Card>); })}
              </div>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </card_1.CardContent>
      </card_1.Card>

      {/* Action Summary */}
      {showActions && assessment.recommendations.length > 0 && (<alert_1.Alert>
          <lucide_react_1.Info className="h-4 w-4"/>
          <alert_1.AlertTitle>Next Steps</alert_1.AlertTitle>
          <alert_1.AlertDescription>
            Based on this risk assessment, we recommend addressing{' '}
            <strong>{assessment.recommendations.filter(function (r) { return r.priority === 'urgent' || r.priority === 'high'; }).length}</strong>{' '}
            high-priority items before proceeding with the transaction.
          </alert_1.AlertDescription>
        </alert_1.Alert>)}
    </div>);
}
exports.default = RiskAssessmentDisplay;
