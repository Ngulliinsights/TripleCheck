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
exports.useB2BEntryPoints = useB2BEntryPoints;
var react_1 = require("react");
function useB2BEntryPoints() {
    var _a = (0, react_1.useState)([]), activeEntryPoints = _a[0], setActiveEntryPoints = _a[1];
    var _b = (0, react_1.useState)({
        timeOnPage: 0,
        scrollDepth: 0,
        interactionCount: 0,
        pageViews: 0,
        sessionDuration: 0
    }), userBehavior = _b[0], setUserBehavior = _b[1];
    var sessionStartTime = (0, react_1.useState)(Date.now())[0];
    // Track user behavior
    (0, react_1.useEffect)(function () {
        var timeInterval;
        var scrollListener;
        var clickListener;
        var startTracking = function () {
            // Track time on page
            timeInterval = setInterval(function () {
                setUserBehavior(function (prev) { return (__assign(__assign({}, prev), { timeOnPage: Math.floor((Date.now() - sessionStartTime) / 1000), sessionDuration: Math.floor((Date.now() - sessionStartTime) / 1000) })); });
            }, 1000);
            // Track scroll depth
            scrollListener = function () {
                var scrollTop = window.pageYOffset;
                var docHeight = document.documentElement.scrollHeight - window.innerHeight;
                var scrollPercent = Math.floor((scrollTop / docHeight) * 100);
                setUserBehavior(function (prev) { return (__assign(__assign({}, prev), { scrollDepth: Math.max(prev.scrollDepth, scrollPercent) })); });
            };
            // Track interactions
            clickListener = function () {
                setUserBehavior(function (prev) { return (__assign(__assign({}, prev), { interactionCount: prev.interactionCount + 1 })); });
            };
            window.addEventListener('scroll', scrollListener, { passive: true });
            document.addEventListener('click', clickListener, { passive: true });
        };
        startTracking();
        return function () {
            if (timeInterval)
                clearInterval(timeInterval);
            if (scrollListener)
                window.removeEventListener('scroll', scrollListener);
            if (clickListener)
                document.removeEventListener('click', clickListener);
        };
    }, [sessionStartTime]);
    // Detect entry point based on current page and context
    var detectEntryPoint = (0, react_1.useCallback)(function (pathname, context) {
        var entryPoints = [];
        // Fraud report entry point
        if (pathname.includes('fraud') || (context === null || context === void 0 ? void 0 : context.fraudDetected)) {
            entryPoints.push({
                source: 'fraud_report',
                priority: 'high',
                triggers: ['fraud_detected', 'high_risk_score'],
                context: {
                    fraudData: context === null || context === void 0 ? void 0 : context.fraudData,
                    riskScore: context === null || context === void 0 ? void 0 : context.riskScore
                }
            });
        }
        // Community insights entry point
        if (pathname.includes('community') || (context === null || context === void 0 ? void 0 : context.communityData)) {
            entryPoints.push({
                source: 'community_insights',
                priority: 'medium',
                triggers: ['community_engagement', 'insights_viewed'],
                context: {
                    insightsData: context === null || context === void 0 ? void 0 : context.insightsData,
                    communityScore: context === null || context === void 0 ? void 0 : context.communityScore
                }
            });
        }
        // Property verification entry point
        if (pathname.includes('verification') || (context === null || context === void 0 ? void 0 : context.verificationComplete)) {
            entryPoints.push({
                source: 'property_verification',
                priority: 'high',
                triggers: ['verification_complete', 'high_value_property'],
                context: {
                    propertyValue: context === null || context === void 0 ? void 0 : context.propertyValue,
                    verificationResult: context === null || context === void 0 ? void 0 : context.verificationResult
                }
            });
        }
        // Search results entry point
        if (pathname.includes('search') || pathname.includes('properties')) {
            entryPoints.push({
                source: 'search_results',
                priority: 'low',
                triggers: ['multiple_searches', 'high_value_results'],
                context: {
                    searchResults: context === null || context === void 0 ? void 0 : context.searchResults,
                    averageValue: context === null || context === void 0 ? void 0 : context.averageValue
                }
            });
        }
        // Homepage entry point (fallback)
        if (pathname === '/' || entryPoints.length === 0) {
            entryPoints.push({
                source: 'homepage',
                priority: 'low',
                triggers: ['time_on_site', 'multiple_page_views'],
                context: context || {}
            });
        }
        return entryPoints;
    }, []);
    // Update active entry points
    var updateEntryPoints = (0, react_1.useCallback)(function (pathname, context) {
        var detectedEntryPoints = detectEntryPoint(pathname, context);
        // Sort by priority and filter duplicates
        var sortedEntryPoints = detectedEntryPoints
            .sort(function (a, b) {
            var priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
            .filter(function (point, index, arr) {
            return arr.findIndex(function (p) { return p.source === point.source; }) === index;
        });
        setActiveEntryPoints(sortedEntryPoints);
    }, [detectEntryPoint]);
    // Check if triggers are met for showing B2B messaging
    var shouldShowB2BMessaging = (0, react_1.useCallback)(function (entryPoint) {
        var triggers = entryPoint.triggers, priority = entryPoint.priority;
        var timeOnPage = userBehavior.timeOnPage, scrollDepth = userBehavior.scrollDepth, interactionCount = userBehavior.interactionCount;
        // High priority entry points (fraud, verification)
        if (priority === 'high') {
            return timeOnPage > 30 || scrollDepth > 50 || interactionCount > 2;
        }
        // Medium priority entry points (community insights)
        if (priority === 'medium') {
            return timeOnPage > 60 || scrollDepth > 70 || interactionCount > 3;
        }
        // Low priority entry points (search, homepage)
        if (priority === 'low') {
            return timeOnPage > 120 || scrollDepth > 80 || interactionCount > 5;
        }
        return false;
    }, [userBehavior]);
    // Get the best entry point for B2B messaging
    var getBestEntryPoint = (0, react_1.useCallback)(function () {
        var qualifiedEntryPoints = activeEntryPoints.filter(shouldShowB2BMessaging);
        if (qualifiedEntryPoints.length === 0)
            return null;
        // Return highest priority entry point
        return qualifiedEntryPoints[0];
    }, [activeEntryPoints, shouldShowB2BMessaging]);
    // Track entry point analytics
    var trackEntryPointEngagement = (0, react_1.useCallback)(function (entryPoint, action) {
        if (window === null || window === void 0 ? void 0 : window.gtag) {
            window.gtag('event', 'b2b_entry_point_engagement', {
                event_category: 'B2B',
                event_label: "".concat(entryPoint.source, "_").concat(action),
                custom_parameters: {
                    priority: entryPoint.priority,
                    time_on_page: userBehavior.timeOnPage,
                    scroll_depth: userBehavior.scrollDepth,
                    interaction_count: userBehavior.interactionCount,
                    triggers: entryPoint.triggers.join(',')
                }
            });
        }
    }, [userBehavior]);
    // Calculate engagement score
    var getEngagementScore = (0, react_1.useCallback)(function () {
        var timeOnPage = userBehavior.timeOnPage, scrollDepth = userBehavior.scrollDepth, interactionCount = userBehavior.interactionCount;
        var score = 0;
        // Time scoring (0-40 points)
        if (timeOnPage > 180)
            score += 40;
        else if (timeOnPage > 120)
            score += 30;
        else if (timeOnPage > 60)
            score += 20;
        else if (timeOnPage > 30)
            score += 10;
        // Scroll scoring (0-30 points)
        if (scrollDepth > 90)
            score += 30;
        else if (scrollDepth > 70)
            score += 25;
        else if (scrollDepth > 50)
            score += 20;
        else if (scrollDepth > 25)
            score += 10;
        // Interaction scoring (0-30 points)
        if (interactionCount > 10)
            score += 30;
        else if (interactionCount > 7)
            score += 25;
        else if (interactionCount > 5)
            score += 20;
        else if (interactionCount > 3)
            score += 15;
        else if (interactionCount > 1)
            score += 10;
        return Math.min(score, 100); // Cap at 100
    }, [userBehavior]);
    return {
        activeEntryPoints: activeEntryPoints,
        userBehavior: userBehavior,
        updateEntryPoints: updateEntryPoints,
        shouldShowB2BMessaging: shouldShowB2BMessaging,
        getBestEntryPoint: getBestEntryPoint,
        trackEntryPointEngagement: trackEntryPointEngagement,
        getEngagementScore: getEngagementScore
    };
}
