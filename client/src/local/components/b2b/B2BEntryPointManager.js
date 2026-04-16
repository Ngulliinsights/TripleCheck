"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2BEntryPointManager = B2BEntryPointManager;
var react_1 = require("react");
var B2BCommunityInsightsPrompt_1 = require("./B2BCommunityInsightsPrompt");
var B2BContextualPrompt_1 = require("./B2BContextualPrompt");
var B2BFraudReportPrompt_1 = require("./B2BFraudReportPrompt");
var B2BLeadCapture_1 = require("./B2BLeadCapture");
function B2BEntryPointManager(_a) {
    var _b, _c, _d;
    var entryPoint = _a.entryPoint, className = _a.className;
    var _e = (0, react_1.useState)(false), showLeadCapture = _e[0], setShowLeadCapture = _e[1];
    var _f = (0, react_1.useState)(0), engagementScore = _f[0], setEngagementScore = _f[1];
    // Calculate engagement score based on user behavior
    (0, react_1.useEffect)(function () {
        var calculateEngagement = function () {
            if (!entryPoint.userBehavior)
                return 0;
            var _a = entryPoint.userBehavior, timeOnPage = _a.timeOnPage, scrollDepth = _a.scrollDepth, interactionCount = _a.interactionCount;
            // Scoring algorithm
            var score = 0;
            // Time on page (max 40 points)
            if (timeOnPage > 120)
                score += 40; // 2+ minutes
            else if (timeOnPage > 60)
                score += 25; // 1+ minute
            else if (timeOnPage > 30)
                score += 15; // 30+ seconds
            // Scroll depth (max 30 points)
            if (scrollDepth > 80)
                score += 30; // 80%+ scroll
            else if (scrollDepth > 50)
                score += 20; // 50%+ scroll
            else if (scrollDepth > 25)
                score += 10; // 25%+ scroll
            // Interaction count (max 30 points)
            if (interactionCount > 5)
                score += 30; // 5+ interactions
            else if (interactionCount > 3)
                score += 20; // 3+ interactions
            else if (interactionCount > 1)
                score += 10; // 1+ interactions
            return score;
        };
        var score = calculateEngagement();
        setEngagementScore(score);
        // Show lead capture for highly engaged users
        if (score > 60) {
            var timer_1 = setTimeout(function () {
                setShowLeadCapture(true);
            }, 3000); // 3 second delay
            return function () { return clearTimeout(timer_1); };
        }
    }, [entryPoint.userBehavior]);
    // Track entry point analytics
    (0, react_1.useEffect)(function () {
        if (window === null || window === void 0 ? void 0 : window.gtag) {
            window.gtag('event', 'b2b_entry_point', {
                event_category: 'B2B',
                event_label: entryPoint.source,
                custom_parameters: {
                    engagement_score: engagementScore,
                    context: JSON.stringify(entryPoint.context)
                }
            });
        }
    }, [entryPoint.source, engagementScore, entryPoint.context]);
    var renderEntryPointPrompt = function () {
        var _a, _b, _c, _d, _e;
        switch (entryPoint.source) {
            case 'fraud_report':
                return (<B2BFraudReportPrompt_1.B2BFraudReportPrompt className={className} fraudData={(_a = entryPoint.context) === null || _a === void 0 ? void 0 : _a.fraudData} variant="inline"/>);
            case 'community_insights':
                return (<B2BCommunityInsightsPrompt_1.B2BCommunityInsightsPrompt className={className} insightsData={(_b = entryPoint.context) === null || _b === void 0 ? void 0 : _b.insightsData} variant="inline" context="insights_report"/>);
            case 'property_verification':
                return (<B2BContextualPrompt_1.B2BContextualPrompt className={className} context="verification_complete" propertyValue={(_c = entryPoint.context) === null || _c === void 0 ? void 0 : _c.propertyValue} riskScore={(_d = entryPoint.context) === null || _d === void 0 ? void 0 : _d.riskScore}/>);
            case 'search_results':
                // Show different prompts based on search context
                if ((_e = entryPoint.context) === null || _e === void 0 ? void 0 : _e.highValueResults) {
                    return (<B2BContextualPrompt_1.B2BContextualPrompt className={className} context="high_value_property" propertyValue={entryPoint.context.averageValue}/>);
                }
                return null;
            default:
                return null;
        }
    };
    var getLeadCaptureTrigger = function () {
        switch (entryPoint.source) {
            case 'fraud_report':
                return 'fraud_detected';
            case 'community_insights':
                return 'high_usage';
            case 'property_verification':
                return 'verification_complete';
            default:
                return 'manual';
        }
    };
    return (<div className="space-y-4">
      {renderEntryPointPrompt()}
      
      {showLeadCapture && (<B2BLeadCapture_1.B2BLeadCapture trigger={getLeadCaptureTrigger()} userMetrics={{
                verificationsThisMonth: ((_b = entryPoint.context) === null || _b === void 0 ? void 0 : _b.verificationsCount) || 0,
                averagePropertyValue: ((_c = entryPoint.context) === null || _c === void 0 ? void 0 : _c.averagePropertyValue) || 0,
                businessIndicators: ["".concat(entryPoint.source, "_user"), 'high_engagement'],
                totalVerifications: ((_d = entryPoint.context) === null || _d === void 0 ? void 0 : _d.totalVerifications) || 0
            }}/>)}
    </div>);
}
