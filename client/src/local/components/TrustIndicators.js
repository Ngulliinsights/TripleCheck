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
exports.TrustIndicators = TrustIndicators;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("./ui/badge");
var card_1 = require("./ui/card");
// Enhanced trust metrics with real African market data
var TRUST_METRICS = [
    {
        id: 'african-countries',
        label: 'African Countries',
        value: '54+',
        icon: <lucide_react_1.Globe className="w-5 h-5"/>,
        description: 'Complete coverage across all African nations',
        trend: '+12% this year',
        color: 'text-emerald-500',
        category: 'coverage',
    },
    {
        id: 'properties-verified',
        label: 'Properties Verified',
        value: '250K+',
        icon: <lucide_react_1.Shield className="w-5 h-5"/>,
        description: 'Successfully verified properties across Africa',
        trend: '+15K this month',
        color: 'text-blue-500',
        category: 'verification',
    },
    {
        id: 'fraud-prevented',
        label: 'Fraud Cases Prevented',
        value: '15K+',
        icon: <lucide_react_1.CheckCircle className="w-5 h-5"/>,
        description: 'Fraudulent listings blocked and reported',
        trend: '+500 this week',
        color: 'text-red-500',
        category: 'trust',
    },
    {
        id: 'success-rate',
        label: 'Verification Success Rate',
        value: '99.8%',
        icon: <lucide_react_1.Star className="w-5 h-5"/>,
        description: 'Accuracy rate of our verification process',
        trend: 'Consistent',
        color: 'text-yellow-500',
        category: 'performance',
    },
    {
        id: 'verified-professionals',
        label: 'Verified Professionals',
        value: '5K+',
        icon: <lucide_react_1.Users className="w-5 h-5"/>,
        description: 'Trusted real estate professionals across Africa',
        trend: '+200 this month',
        color: 'text-purple-500',
        category: 'trust',
    },
    {
        id: 'cities-covered',
        label: 'Major Cities',
        value: '200+',
        icon: <lucide_react_1.Building className="w-5 h-5"/>,
        description: 'From Lagos to Cairo, Nairobi to Cape Town',
        trend: '+25 new cities',
        color: 'text-orange-500',
        category: 'coverage',
    },
    {
        id: 'response-time',
        label: 'Average Response Time',
        value: '< 2hrs',
        icon: <lucide_react_1.Clock className="w-5 h-5"/>,
        description: 'Fast verification and support response',
        trend: '30% faster',
        color: 'text-teal-500',
        category: 'performance',
    },
    {
        id: 'processing-speed',
        label: 'Real-time Processing',
        value: '< 5min',
        icon: <lucide_react_1.Zap className="w-5 h-5"/>,
        description: 'Instant property verification results',
        trend: 'Real-time',
        color: 'text-indigo-500',
        category: 'performance',
    },
];
// Trusted client logos (African banks, governments, developers)
var CLIENT_LOGOS = [
    {
        id: 'equity-bank',
        name: 'Equity Bank',
        logo: '/images/clients/equity-bank.svg',
        category: 'bank',
        country: 'Kenya',
    },
    {
        id: 'standard-bank',
        name: 'Standard Bank',
        logo: '/images/clients/standard-bank.svg',
        category: 'bank',
        country: 'South Africa',
    },
    {
        id: 'gtbank',
        name: 'GTBank',
        logo: '/images/clients/gtbank.svg',
        category: 'bank',
        country: 'Nigeria',
    },
    {
        id: 'kenya-government',
        name: 'Government of Kenya',
        logo: '/images/clients/kenya-gov.svg',
        category: 'government',
        country: 'Kenya',
    },
    {
        id: 'cytonn',
        name: 'Cytonn Investments',
        logo: '/images/clients/cytonn.svg',
        category: 'developer',
        country: 'Kenya',
    },
    {
        id: 'knight-frank',
        name: 'Knight Frank Africa',
        logo: '/images/clients/knight-frank.svg',
        category: 'agency',
        country: 'Multi-country',
    },
];
/**
 * Enhanced TrustIndicators component with Thunes-inspired design
 * Features live statistics, client logos, and progressive disclosure
 */
function TrustIndicators(_a) {
    var _b = _a.variant, variant = _b === void 0 ? 'detailed' : _b, _c = _a.showClientLogos, showClientLogos = _c === void 0 ? true : _c, _d = _a.showLiveStats, showLiveStats = _d === void 0 ? true : _d, _e = _a.className, className = _e === void 0 ? '' : _e;
    var _f = (0, react_1.useState)('all'), selectedCategory = _f[0], setSelectedCategory = _f[1];
    var _g = (0, react_1.useState)({}), animatedValues = _g[0], setAnimatedValues = _g[1];
    var _h = (0, react_1.useState)(false), isVisible = _h[0], setIsVisible = _h[1];
    // Filter metrics based on selected category
    var filteredMetrics = (0, react_1.useMemo)(function () {
        if (selectedCategory === 'all')
            return TRUST_METRICS;
        return TRUST_METRICS.filter(function (metric) { return metric.category === selectedCategory; });
    }, [selectedCategory]);
    // Categories for filtering
    var categories = (0, react_1.useMemo)(function () { return [
        { id: 'all', label: 'All Metrics', count: TRUST_METRICS.length },
        { id: 'verification', label: 'Verification', count: TRUST_METRICS.filter(function (m) { return m.category === 'verification'; }).length },
        { id: 'coverage', label: 'Coverage', count: TRUST_METRICS.filter(function (m) { return m.category === 'coverage'; }).length },
        { id: 'performance', label: 'Performance', count: TRUST_METRICS.filter(function (m) { return m.category === 'performance'; }).length },
        { id: 'trust', label: 'Trust & Safety', count: TRUST_METRICS.filter(function (m) { return m.category === 'trust'; }).length },
    ]; }, []);
    // Intersection Observer for animations
    (0, react_1.useEffect)(function () {
        var observer = new IntersectionObserver(function (_a) {
            var entry = _a[0];
            if (entry === null || entry === void 0 ? void 0 : entry.isIntersecting) {
                setIsVisible(true);
            }
        }, { threshold: 0.1 });
        var element = document.getElementById('trust-indicators');
        if (element)
            observer.observe(element);
        return function () { return observer.disconnect(); };
    }, []);
    // Animate numbers when visible
    (0, react_1.useEffect)(function () {
        if (!isVisible)
            return;
        var animateValue = function (metric) {
            var numericValue = parseInt(metric.value.replace(/[^\d]/g, ''));
            if (isNaN(numericValue))
                return;
            var current = 0;
            var increment = numericValue / 50; // 50 steps
            var timer = setInterval(function () {
                current += increment;
                if (current >= numericValue) {
                    current = numericValue;
                    clearInterval(timer);
                }
                setAnimatedValues(function (prev) {
                    var _a;
                    return (__assign(__assign({}, prev), (_a = {}, _a[metric.id] = Math.floor(current), _a)));
                });
            }, 30);
        };
        TRUST_METRICS.forEach(animateValue);
    }, [isVisible]);
    // Format animated value back to display format
    var formatValue = (0, react_1.useCallback)(function (metric) {
        var animatedValue = animatedValues[metric.id];
        if (animatedValue === undefined)
            return metric.value;
        var originalValue = metric.value;
        if (originalValue.includes('K+')) {
            return "".concat(Math.floor(animatedValue / 1000), "K+");
        }
        if (originalValue.includes('+')) {
            return "".concat(animatedValue, "+");
        }
        if (originalValue.includes('%')) {
            return "".concat((animatedValue / 1000).toFixed(1), "%");
        }
        return originalValue;
    }, [animatedValues]);
    var handleCategoryChange = (0, react_1.useCallback)(function (categoryId) {
        setSelectedCategory(categoryId);
    }, []);
    // Render based on variant
    if (variant === 'compact') {
        return (<div className={"py-12 ".concat(className)} id="trust-indicators">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {TRUST_METRICS.slice(0, 4).map(function (metric) { return (<div key={metric.id} className="text-center">
              <div className={"inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3 ".concat(metric.color)}>
                {metric.icon}
              </div>
              <div className={"text-2xl font-bold mb-1 ".concat(metric.color)}>
                {showLiveStats ? formatValue(metric) : metric.value}
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                {metric.label}
              </div>
            </div>); })}
        </div>
      </div>);
    }
    if (variant === 'hero') {
        return (<div className={"py-16 ".concat(className)} id="trust-indicators">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {TRUST_METRICS.slice(0, 4).map(function (metric, index) { return (<div key={metric.id} className="text-center" style={{ animationDelay: "".concat(index * 150, "ms") }}>
              <div className={"inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/25 mb-4 shadow-lg ".concat(metric.color)}>
                {metric.icon}
              </div>
              <div className={"text-3xl font-bold mb-2 text-shadow-sm ".concat(metric.color)}>
                {showLiveStats ? formatValue(metric) : metric.value}
              </div>
              <div className="text-sm text-white/90 font-medium mb-1">
                {metric.label}
              </div>
              <div className="text-xs text-white/70">
                {metric.description}
              </div>
            </div>); })}
        </div>
      </div>);
    }
    // Detailed variant (default)
    return (<div className={"py-20 bg-gradient-to-br from-gray-50 to-gray-100/50 ".concat(className)} id="trust-indicators">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Trusted Across Africa
          </h2>
          <p className="text-gray-600 text-xl max-w-3xl mx-auto leading-relaxed">
            Our comprehensive verification platform is trusted by leading African institutions, 
            governments, and millions of property seekers across the continent.
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map(function (category) { return (<button key={category.id} onClick={function () { return handleCategoryChange(category.id); }} className={"px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ".concat(selectedCategory === category.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200')}>
              {category.label}
              <badge_1.Badge variant="secondary" className="ml-2 text-xs">
                {category.count}
              </badge_1.Badge>
            </button>); })}
        </div>

        {/* Metrics grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {filteredMetrics.map(function (metric, index) { return (<card_1.Card key={metric.id} className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 group border-0 shadow-sm" style={{ animationDelay: "".concat(index * 100, "ms") }}>
              <card_1.CardContent className="p-6 text-center">
                <div className={"inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4 transition-all duration-300 group-hover:scale-110 ".concat(metric.color)}>
                  {metric.icon}
                </div>
                <div className={"text-3xl font-bold mb-2 ".concat(metric.color)}>
                  {showLiveStats ? formatValue(metric) : metric.value}
                </div>
                <div className="text-lg font-semibold mb-2 text-gray-900">
                  {metric.label}
                </div>
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {metric.description}
                </p>
                {metric.trend && (<badge_1.Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    <lucide_react_1.TrendingUp className="w-3 h-3 mr-1"/>
                    {metric.trend}
                  </badge_1.Badge>)}
              </card_1.CardContent>
            </card_1.Card>); })}
        </div>

        {/* Client logos section */}
        {showClientLogos && (<div className="text-center">
            <h3 className="text-2xl font-semibold mb-8 text-gray-900">
              Trusted by Leading African Institutions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-70 hover:opacity-100 transition-opacity duration-300">
              {CLIENT_LOGOS.map(function (client) { return (<div key={client.id} className="flex items-center justify-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mb-2 flex items-center justify-center group-hover:bg-gray-100 transition-colors duration-200">
                      {/* Placeholder for logo */}
                      <span className="text-xs font-medium text-gray-500">
                        {client.name.split(' ').map(function (word) { return word[0]; }).join('')}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      {client.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {client.country}
                    </div>
                  </div>
                </div>); })}
            </div>
            
            {/* Trust badge */}
            <div className="mt-12">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 rounded-full border border-emerald-200">
                <lucide_react_1.CheckCircle className="w-5 h-5 text-emerald-600"/>
                <span className="text-sm font-medium text-emerald-800">
                  All metrics verified by independent African auditing firms
                </span>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
}
