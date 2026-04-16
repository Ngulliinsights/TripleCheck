"use strict";
/**
 * Navigation Utilities for User Journey Tracking and Conversion Optimization
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNavigationTracking = exports.navigationUtils = exports.NavigationTracker = void 0;
var user_journeys_1 = require("../config/user-journeys");
var NavigationTracker = /** @class */ (function () {
    function NavigationTracker() {
        this.navigationHistory = [];
        this.sessionId = this.generateSessionId();
        this.initializeTracking();
    }
    NavigationTracker.getInstance = function () {
        if (!NavigationTracker.instance) {
            NavigationTracker.instance = new NavigationTracker();
        }
        return NavigationTracker.instance;
    };
    NavigationTracker.prototype.generateSessionId = function () {
        return "session_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    NavigationTracker.prototype.initializeTracking = function () {
        var _this = this;
        // Track page navigation
        if (typeof window !== 'undefined') {
            var originalPushState_1 = history.pushState;
            var originalReplaceState_1 = history.replaceState;
            history.pushState = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                _this.trackNavigation(window.location.pathname, args[2]);
                return originalPushState_1.apply(history, args);
            };
            history.replaceState = function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                _this.trackNavigation(window.location.pathname, args[2]);
                return originalReplaceState_1.apply(history, args);
            };
            window.addEventListener('popstate', function () {
                _this.trackNavigation(_this.getLastPage(), window.location.pathname);
            });
        }
    };
    NavigationTracker.prototype.trackNavigation = function (from, to, conversionGoal) {
        var _a;
        var event = {
            from: from,
            to: to,
            timestamp: Date.now(),
            userType: (_a = this.currentUserType) !== null && _a !== void 0 ? _a : undefined,
            conversionGoal: conversionGoal !== null && conversionGoal !== void 0 ? conversionGoal : undefined,
            sessionId: this.sessionId
        };
        this.navigationHistory.push(event);
        this.analyzeUserJourney(event);
        // Send to analytics if available
        this.sendToAnalytics(event);
    };
    NavigationTracker.prototype.setUserType = function (userType) {
        this.currentUserType = userType;
    };
    NavigationTracker.prototype.getLastPage = function () {
        var lastEvent = this.navigationHistory[this.navigationHistory.length - 1];
        return lastEvent ? lastEvent.to : '/';
    };
    NavigationTracker.prototype.analyzeUserJourney = function (event) {
        var _this = this;
        // Find matching user journey
        var matchingJourney = user_journeys_1.USER_JOURNEYS.find(function (journey) {
            return journey.entryPoints.some(function (entry) { return _this.matchesPattern(entry, event.from); }) ||
                journey.keyPages.some(function (page) { return _this.matchesPattern(page.page, event.to); });
        });
        if (matchingJourney) {
            this.optimizeForJourney(matchingJourney, event);
        }
    };
    NavigationTracker.prototype.matchesPattern = function (pattern, path) {
        if (pattern.includes('*')) {
            var regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(path);
        }
        return pattern === path;
    };
    NavigationTracker.prototype.optimizeForJourney = function (journey, event) {
        // Get page-specific conversion config
        var pageConfig = user_journeys_1.PAGE_CONVERSION_CONFIG[event.to];
        if (pageConfig) {
            // Trigger conversion optimizations
            this.triggerConversionOptimizations(pageConfig, journey);
        }
    };
    NavigationTracker.prototype.triggerConversionOptimizations = function (pageConfig, journey) {
        // This would integrate with your conversion optimization system
        console.log('Optimizing for conversion:', {
            page: pageConfig,
            journey: journey.name,
            primaryCTA: pageConfig.primaryCTA
        });
    };
    NavigationTracker.prototype.sendToAnalytics = function (event) {
        // Integration with analytics platforms
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'page_view', {
                page_path: event.to,
                page_referrer: event.from,
                user_type: event.userType,
                session_id: event.sessionId
            });
        }
    };
    NavigationTracker.prototype.getNavigationHistory = function () {
        return __spreadArray([], this.navigationHistory, true);
    };
    NavigationTracker.prototype.getCurrentJourney = function () {
        var _this = this;
        var currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
        return user_journeys_1.USER_JOURNEYS.find(function (journey) {
            return journey.keyPages.some(function (page) { return _this.matchesPattern(page.page, currentPath); });
        });
    };
    NavigationTracker.prototype.getConversionPath = function () {
        return this.navigationHistory.map(function (event) { return event.to; });
    };
    NavigationTracker.prototype.isDropOffPoint = function (path) {
        return user_journeys_1.JOURNEY_TRACKING.dropOffPoints.includes(path);
    };
    return NavigationTracker;
}());
exports.NavigationTracker = NavigationTracker;
// Navigation helper functions
exports.navigationUtils = {
    // Get optimal next page based on current journey
    getNextRecommendedPage: function (currentPage, userType) {
        var journey = user_journeys_1.USER_JOURNEYS.find(function (j) {
            return j.userType === userType &&
                j.keyPages.some(function (p) { return p.page === currentPage; });
        });
        if (journey) {
            var currentStep = journey.keyPages.find(function (p) { return p.page === currentPage; });
            return (currentStep === null || currentStep === void 0 ? void 0 : currentStep.nextSteps[0]) || null;
        }
        return null;
    },
    // Get conversion-optimized CTA text
    getOptimalCTA: function (page, position) {
        if (position === void 0) { position = 'primary'; }
        var config = user_journeys_1.PAGE_CONVERSION_CONFIG[page];
        return config ? config["".concat(position, "CTA")] : 'Get Started';
    },
    // Check if user is in a conversion funnel
    isInConversionFunnel: function (path) {
        return Object.values(user_journeys_1.JOURNEY_TRACKING.conversionPaths)
            .some(function (pathArray) { return pathArray.includes(path); });
    },
    // Get exit intent offer for current page
    getExitIntentOffer: function (page) {
        var config = user_journeys_1.PAGE_CONVERSION_CONFIG[page];
        return (config === null || config === void 0 ? void 0 : config.exitIntentOffer) || null;
    },
    // Generate breadcrumb navigation
    generateBreadcrumbs: function (currentPath) {
        var pathSegments = currentPath.split('/').filter(Boolean);
        var breadcrumbs = [{ label: 'Home', href: '/' }];
        var currentHref = '';
        pathSegments.forEach(function (segment, index) {
            currentHref += "/".concat(segment);
            // Convert segment to readable label
            var label = segment
                .split('-')
                .map(function (word) { return word.charAt(0).toUpperCase() + word.slice(1); })
                .join(' ');
            breadcrumbs.push({
                label: label,
                href: currentHref
            });
        });
        return breadcrumbs;
    }
};
// React hook for navigation tracking
var useNavigationTracking = function () {
    var tracker = NavigationTracker.getInstance();
    return {
        trackNavigation: tracker.trackNavigation.bind(tracker),
        setUserType: tracker.setUserType.bind(tracker),
        getCurrentJourney: tracker.getCurrentJourney.bind(tracker),
        getNavigationHistory: tracker.getNavigationHistory.bind(tracker),
        isDropOffPoint: tracker.isDropOffPoint.bind(tracker)
    };
};
exports.useNavigationTracking = useNavigationTracking;
exports.default = NavigationTracker;
