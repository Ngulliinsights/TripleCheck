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
exports.default = HomePage;
/* ------------------------------------------------------------------ */
/*  Imports                                                           */
/* ------------------------------------------------------------------ */
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var CompareBar_1 = require("../../property/components/CompareBar");
var CompareModal_1 = require("../../property/components/CompareModal");
var CommunityInsights_1 = require("../components/CommunityInsights");
var Hero_1 = require("../components/hero/Hero");
var NewsBlog_1 = require("../components/NewsBlog");
var property_1 = require("../components/property");
var ServiceCategories_1 = require("../components/ServiceCategories");
var Testimonials_1 = require("../components/Testimonials");
var badge_1 = require("../components/ui/badge");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
var skeleton_1 = require("../components/ui/skeleton");
var VideoModal_1 = require("../components/VideoModal");
var useNavigationSpacing_1 = require("../hooks/useNavigationSpacing");
var useSafeQuery_1 = require("../hooks/useSafeQuery");
/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */
var DEMO_VIDEO_URL = "https://youtu.be/IjhSHyfQpaQ";
var SKELETON_COUNT = 6;
var STALE_TIME = 5 * 60 * 1000;
var TRUST_METRICS = [
    {
        id: "countries",
        label: "African Countries",
        value: "0",
        icon: <lucide_react_1.Globe className="w-5 h-5"/>,
        color: "text-emerald-500",
        description: "Preparing for Africa-wide coverage",
    },
    {
        id: "properties",
        label: "Properties Verified",
        value: "0",
        icon: <lucide_react_1.Shield className="w-5 h-5"/>,
        color: "text-blue-500",
        description: "Ready to verify properties",
    },
    {
        id: "fraud",
        label: "Fraud Cases Prevented",
        value: "0",
        icon: <lucide_react_1.CheckCircle className="w-5 h-5"/>,
        color: "text-red-500",
        description: "Fraud prevention system ready",
    },
    {
        id: "success",
        label: "Success Rate",
        value: "0%",
        icon: <lucide_react_1.Star className="w-5 h-5"/>,
        color: "text-yellow-500",
        description: "Verification system launching soon",
    },
];
var ANIMATION_DELAYS = [
    "animation-delay-0",
    "animation-delay-100",
    "animation-delay-200",
    "animation-delay-300",
    "animation-delay-400",
    "animation-delay-500",
];
/** Validated action → route map. Prevents object-injection attacks. */
var ROUTE_MAP = new Map([
    ["primary_cta", "/land-verification"],
    ["premium_access", "/pricing"],
    ["market_insights", "/analytics"],
    ["search_properties", "/properties"],
    ["check_fraud", "/trust/fraud-detection"],
]);
/* ------------------------------------------------------------------ */
/*  Utility Functions                                                 */
/* ------------------------------------------------------------------ */
var getDelayClass = function (idx) { var _a; return (_a = ANIMATION_DELAYS[idx % ANIMATION_DELAYS.length]) !== null && _a !== void 0 ? _a : ANIMATION_DELAYS[0]; };
var parseSearchQuery = function (search) { var _a; return (_a = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search).get("search")) !== null && _a !== void 0 ? _a : ""; };
var getRoute = function (action) { var _a; return (_a = ROUTE_MAP.get(action)) !== null && _a !== void 0 ? _a : "/"; };
/* ------------------------------------------------------------------ */
/*  Property Transformer                                              */
/* ------------------------------------------------------------------ */
var toNormalized = function (p) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var location = typeof p.location === "string" ? p.location : (_b = (_a = p.location) === null || _a === void 0 ? void 0 : _a.address) !== null && _b !== void 0 ? _b : "Location not specified";
    var category = p.type === "commercial" ? "commercial"
        : p.type === "land" ? "land"
            : "residential";
    var toDateStr = function (d) {
        return !d ? new Date().toISOString() : d instanceof Date ? d.toISOString() : d;
    };
    var normalizeStatus = function (s) {
        var valid = ["available", "under-offer", "sold", "rented", "pending"];
        return valid.includes(s)
            ? s
            : "available";
    };
    var normalizeVerification = function (s) {
        if (!s)
            return undefined;
        if (s === "draft")
            return "pending";
        var valid = ["verified", "pending", "unverified", "flagged"];
        return valid.includes(s)
            ? s
            : "unverified";
    };
    var base = {
        id: String(p.id),
        title: p.title,
        description: p.description,
        price: typeof p.price === "string" ? parseFloat(p.price) || 0 : p.price,
        location: location,
        images: (_d = (_c = p.images) !== null && _c !== void 0 ? _c : p.imageUrls) !== null && _d !== void 0 ? _d : [],
        verified: p.verificationStatus === "verified",
        type: (_f = (_e = p.type) !== null && _e !== void 0 ? _e : p.propertyType) !== null && _f !== void 0 ? _f : "property",
        category: category,
        features: __assign({ bedrooms: p.bedrooms, bathrooms: p.bathrooms, squareFeet: (_g = p.size) !== null && _g !== void 0 ? _g : p.area, propertyType: (_h = p.propertyType) !== null && _h !== void 0 ? _h : p.type }, p.features),
        createdAt: toDateStr(p.createdAt),
        status: normalizeStatus(p.status),
    };
    // Append optional fields only when defined (satisfies exactOptionalPropertyTypes)
    if (p.updatedAt)
        base.updatedAt = toDateStr(p.updatedAt);
    if (p.viewCount !== undefined)
        base.views = p.viewCount;
    if (p.trustScore !== undefined)
        base.trustScore = p.trustScore;
    if (p.coordinates)
        base.coordinates = p.coordinates;
    var vs = normalizeVerification(p.verificationStatus);
    if (vs !== undefined)
        base.verificationStatus = vs;
    return base;
};
/* ------------------------------------------------------------------ */
/*  Sub-Components                                                    */
/* ------------------------------------------------------------------ */
var PricingCard = (0, react_1.memo)(function (_a) {
    var _b;
    var plan = _a.plan, index = _a.index;
    return (<card_1.Card className={"h-full relative transition-all duration-300 hover:scale-[1.02] group ".concat(plan.isPopular
            ? "border-2 border-secondary shadow-xl ring-2 ring-secondary/20"
            : "border shadow-sm hover:border-primary/30", " ").concat(getDelayClass(index))} role="article" aria-label={"".concat(plan.name, " pricing plan")}>
    {plan.isPopular && (<badge_1.Badge variant="coral" className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-semibold">
        MOST POPULAR
      </badge_1.Badge>)}

    <card_1.CardHeader className="pb-4">
      <card_1.CardTitle className="text-2xl font-bold group-hover:text-primary duration-300">
        {plan.name}
      </card_1.CardTitle>
      <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-bold">{plan.price}</span>
        {plan.price !== "Custom" && (<span className="text-sm text-muted-foreground">/month</span>)}
      </div>
    </card_1.CardHeader>

    <card_1.CardContent>
      <ul className="space-y-3 text-sm mb-6">
        {plan.features.map(function (feature) { return (<li key={feature} className="flex gap-3">
            <lucide_react_1.CheckCircle className="w-4 h-4 text-status-success mt-0.5 shrink-0" aria-hidden="true"/>
            <span className="text-muted-foreground">{feature}</span>
          </li>); })}
      </ul>

      {plan.africanFocus && (<div className="mb-6 p-3 bg-muted/30 rounded-lg">
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <lucide_react_1.Globe className="w-3 h-3" aria-hidden="true"/>
            African Focus
          </h4>
          <ul className="space-y-1 text-xs">
            {plan.africanFocus.map(function (focus) { return (<li key={focus} className="flex items-center gap-2">
                <div className="w-1 h-1 bg-secondary rounded-full" aria-hidden="true"/>
                <span>{focus}</span>
              </li>); })}
          </ul>
        </div>)}

      <button_1.Button variant={plan.buttonVariant} className="w-full font-semibold" aria-label={"Get started with ".concat(plan.name, " plan")}>
        {(_b = plan.buttonText) !== null && _b !== void 0 ? _b : "Get Started"}
        <lucide_react_1.ArrowRight className="w-4 h-4 ml-2" aria-hidden="true"/>
      </button_1.Button>
    </card_1.CardContent>
  </card_1.Card>);
});
PricingCard.displayName = "PricingCard";
/* ------------------------------------------------------------------ */
var skeletonKeys = Array.from({ length: SKELETON_COUNT }, function (_, i) { return i; });
var PropertyGrid = (0, react_1.memo)(function (_a) {
    var _b;
    var properties = _a.properties, isLoading = _a.isLoading, error = _a.error;
    if (isLoading) {
        return (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" role="status" aria-label="Loading properties">
        {skeletonKeys.map(function (i) { return (<card_1.Card key={"skeleton-".concat(i)} className="overflow-hidden">
            <skeleton_1.Skeleton className="h-48 w-full rounded-lg"/>
            <div className="p-4 space-y-2">
              <skeleton_1.Skeleton className="h-4 w-3/4"/>
              <skeleton_1.Skeleton className="h-4 w-1/2"/>
            </div>
          </card_1.Card>); })}
      </div>);
    }
    if (error) {
        return (<div className="text-center py-16" role="alert" aria-live="polite">
        <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
          <lucide_react_1.Search className="w-8 h-8 text-destructive" aria-hidden="true"/>
        </div>
        <h3 className="text-xl font-semibold mb-2">Unable to Load Properties</h3>
        <p className="text-muted-foreground mb-6">
          {(_b = error.message) !== null && _b !== void 0 ? _b : "We're having trouble loading properties. Please try again."}
        </p>
        <button_1.Button onClick={function () { return window.location.reload(); }} aria-label="Retry loading properties">
          Try Again
        </button_1.Button>
      </div>);
    }
    if (!(properties === null || properties === void 0 ? void 0 : properties.length)) {
        return (<div className="text-center py-16" role="status">
        <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
          <lucide_react_1.Search className="w-8 h-8 text-muted-foreground" aria-hidden="true"/>
        </div>
        <h3 className="text-xl font-semibold mb-2">No Properties Found</h3>
        <p className="text-muted-foreground">
          Adjust your filters or browse all available properties.
        </p>
      </div>);
    }
    return (<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {properties.map(function (property, index) { return (<div key={property.id} className={"animate-fade-in ".concat(getDelayClass(index))}>
          <property_1.PropertyCard property={toNormalized(property)}/>
        </div>); })}
    </div>);
});
PropertyGrid.displayName = "PropertyGrid";
/* ------------------------------------------------------------------ */
var TrustMetric = (0, react_1.memo)(function (_a) {
    var metric = _a.metric, idx = _a.idx;
    return (<div className={"text-center group ".concat(getDelayClass(idx))}>
      <div className="glass-card p-6 hover:glass-card-hover transition-all duration-300">
        <div className={"inline-flex items-center justify-center w-16 h-16 rounded-full bg-glass-secondary mb-4 transition-transform duration-300 group-hover:scale-110 ".concat(metric.color)} aria-hidden="true">
          {metric.icon}
        </div>
        <div className={"text-3xl font-bold mb-2 ".concat(metric.color)}>{metric.value}</div>
        <div className="text-sm font-medium">{metric.label}</div>
        <div className="text-xs text-glass-medium">{metric.description}</div>
      </div>
    </div>);
});
TrustMetric.displayName = "TrustMetric";
/* ------------------------------------------------------------------ */
/*  Main Page Component                                               */
/* ------------------------------------------------------------------ */
function HomePage() {
    var search = (0, react_router_dom_1.useLocation)().search;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var pageClassName = (0, useNavigationSpacing_1.usePageSpacing)().pageClassName;
    var _a = (0, react_1.useState)({ video: false, compare: false }), modals = _a[0], setModals = _a[1];
    var searchQuery = (0, react_1.useMemo)(function () { return parseSearchQuery(search); }, [search]);
    var _b = (0, useSafeQuery_1.useSafePropertiesQuery)(searchQuery ? { search: searchQuery } : {}, { staleTime: STALE_TIME, context: "home", enabled: true }), properties = _b.data, isLoading = _b.isLoading, error = _b.error;
    var handleHeroSearch = (0, react_1.useCallback)(function (query, location) {
        var params = new URLSearchParams();
        if (query.trim())
            params.set("search", query.trim());
        if (location === null || location === void 0 ? void 0 : location.trim())
            params.set("location", location.trim());
        navigate("/?".concat(params), { replace: true });
    }, [navigate]);
    var handleHeroCta = (0, react_1.useCallback)(function (_, action) {
        if (action === "watch_demo") {
            setModals(function (prev) { return (__assign(__assign({}, prev), { video: true })); });
            return;
        }
        navigate(getRoute(action));
    }, [navigate]);
    var closeModal = (0, react_1.useCallback)(function (key) { return setModals(function (prev) {
        var _a;
        return (__assign(__assign({}, prev), (_a = {}, _a[key] = false, _a)));
    }); }, []);
    var propertyGridProps = { properties: properties, isLoading: isLoading, error: error };
    return (<>
      <div className={"min-h-screen bg-dark-gradient-primary ".concat(pageClassName)}>
        <Hero_1.EnhancedHero variant="A" onSearchSubmit={handleHeroSearch} onCtaClick={handleHeroCta}/>

        {searchQuery && (<section className="py-20 bg-dark-gradient-secondary" aria-label="Search results">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-4 text-center">
                Results for &ldquo;{searchQuery}&rdquo;
              </h2>
              <PropertyGrid {...propertyGridProps}/>
            </div>
          </section>)}

        <section className="py-20 bg-dark-gradient-accent" aria-label="Trust indicators">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6 text-center">
              Launching Soon Across Africa
            </h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {TRUST_METRICS.map(function (metric, idx) { return (<TrustMetric key={metric.id} metric={metric} idx={idx}/>); })}
            </div>
          </div>
        </section>

        <ServiceCategories_1.ServiceCategories />
        <CommunityInsights_1.default />
        <Testimonials_1.Testimonials variant="carousel" showStats autoPlay/>
        <NewsBlog_1.NewsBlog />

        <section className="py-24 bg-dark-gradient-primary" aria-label="Featured properties">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold mb-6 text-center">
              Verified African Properties
            </h2>
            <PropertyGrid {...propertyGridProps}/>
            <div className="text-center mt-12">
              <button_1.Button size="lg" onClick={function () { return navigate("/properties"); }} aria-label="View all available properties">
                View All Properties
                <lucide_react_1.ArrowRight className="w-4 h-4 ml-2" aria-hidden="true"/>
              </button_1.Button>
            </div>
          </div>
        </section>

        <section className="py-24 bg-dark-gradient-accent" aria-label="Call to action">
          <div className="text-center max-w-3xl mx-auto px-4">
            <h2 className="text-4xl font-bold mb-4">Ready to Secure Your Investment?</h2>
            <button_1.Button size="lg" onClick={function () { return navigate("/demo"); }} aria-label="Try our live demo">
              Try Live Demo
            </button_1.Button>
          </div>
        </section>
      </div>

      <CompareBar_1.CompareBar onQuickCompare={function () { return setModals(function (prev) { return (__assign(__assign({}, prev), { compare: true })); }); }}/>
      <CompareModal_1.CompareModal isOpen={modals.compare} onClose={function () { return closeModal("compare"); }}/>
      <VideoModal_1.VideoModal isOpen={modals.video} onClose={function () { return closeModal("video"); }} videoUrl={DEMO_VIDEO_URL} title="TripleCheck Demo"/>
    </>);
}
