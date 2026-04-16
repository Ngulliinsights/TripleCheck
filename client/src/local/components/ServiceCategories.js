"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceCategories = ServiceCategories;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("./ui/badge");
var button_1 = require("./ui/button");
var card_1 = require("./ui/card");
// Progressive disclosure service categories - Thunes-inspired
var SERVICE_CATEGORIES = [
    {
        id: "verify",
        name: "Verify",
        description: "Comprehensive property and document verification services",
        icon: <lucide_react_1.Shield className="w-8 h-8"/>,
        color: "text-orange-400",
        bgColor: "bg-orange-400",
        stats: {
            label: "Properties Verified",
            value: "250K+",
        },
        contextualInfo: {
            title: "Protect Your Investment",
            description: "Connect to our verification network and enable comprehensive property checks, fraud detection, and legal compliance validation for Kenya properties.",
            benefits: [
                "AI-powered fraud detection",
                "Government registry validation",
                "Legal compliance checks",
                "Expert review process",
            ],
        },
        subServices: [
            {
                id: "basic-verification",
                name: "Basic Property Check",
                description: "Essential ownership and legal status verification",
                duration: "2-4 hours",
                price: "KES 2,500",
                features: ["Ownership validation", "Basic fraud check", "Legal status"],
                cta: {
                    text: "Start Basic Check",
                    action: "services/basic-checks",
                },
            },
            {
                id: "comprehensive-verification",
                name: "Comprehensive Verification",
                description: "Full property verification with expert review",
                duration: "24-48 hours",
                price: "KES 8,500",
                popular: true,
                features: [
                    "Complete ownership history",
                    "Advanced fraud detection",
                    "Expert legal review",
                    "Market analysis",
                ],
                cta: {
                    text: "Get Full Verification",
                    action: "services/comprehensive-verification",
                },
            },
            {
                id: "document-authentication",
                name: "Document Authentication",
                description: "Verify authenticity of property documents",
                duration: "1-2 hours",
                price: "KES 1,500",
                features: [
                    "Digital forensics",
                    "Signature verification",
                    "Compliance check",
                ],
                cta: {
                    text: "Authenticate Documents",
                    action: "services/document-auth",
                },
            },
        ],
    },
    {
        id: "discover",
        name: "Discover",
        description: "Find and connect with verified properties and professionals",
        icon: <lucide_react_1.Search className="w-8 h-8"/>,
        color: "text-blue-400",
        bgColor: "bg-blue-400",
        stats: {
            label: "Active Listings",
            value: "125K+",
        },
        contextualInfo: {
            title: "Find Your Perfect Match",
            description: "Reach new opportunities and connect with verified properties, professionals, and market insights tailored to your needs.",
            benefits: [
                "AI-powered property matching",
                "Verified professional network",
                "Real-time market insights",
                "Comprehensive property database",
            ],
        },
        subServices: [
            {
                id: "property-search",
                name: "Property Search",
                description: "Browse verified properties with AI matching",
                duration: "Instant",
                features: [
                    "AI-powered matching",
                    "Verified listings only",
                    "Market insights",
                ],
                cta: {
                    text: "Search Properties",
                    action: "properties",
                },
            },
            {
                id: "professional-network",
                name: "Find Professionals",
                description: "Connect with verified real estate experts",
                duration: "5 minutes",
                features: [
                    "Verified professionals",
                    "Rating system",
                    "Direct communication",
                ],
                cta: {
                    text: "Find Experts",
                    action: "find-professionals",
                },
            },
            {
                id: "market-insights",
                name: "Market Analysis",
                description: "Get comprehensive market data and trends",
                duration: "Real-time",
                popular: true,
                features: [
                    "Price trends",
                    "Neighborhood analysis",
                    "Investment insights",
                    "Market forecasts",
                ],
                cta: {
                    text: "View Market Data",
                    action: "analytics/market",
                },
            },
        ],
    },
];
/**
 * Progressive Disclosure Service Categories with Natural Hover Behavior
 * Features hover-to-preview and click-to-expand interactions that follow human expectations
 */
function ServiceCategories(_a) {
    var _b = _a.className, className = _b === void 0 ? "" : _b, onServiceSelect = _a.onServiceSelect;
    // Separate states for hover preview and full expansion
    var _c = (0, react_1.useState)(null), hoveredCategory = _c[0], setHoveredCategory = _c[1];
    var _d = (0, react_1.useState)(null), activeCategory = _d[0], setActiveCategory = _d[1];
    var _e = (0, react_1.useState)(null), expandedSubService = _e[0], setExpandedSubService = _e[1];
    // Handle category hover - shows preview of first sub-service
    var handleCategoryHover = (0, react_1.useCallback)(function (categoryId) {
        // Only show hover preview if no category is actively expanded
        if (!activeCategory) {
            setHoveredCategory(categoryId);
        }
    }, [activeCategory]);
    // Handle category click - full expansion with all sub-services
    var handleCategoryClick = (0, react_1.useCallback)(function (categoryId) {
        var newActiveCategory = activeCategory === categoryId ? null : categoryId;
        setActiveCategory(newActiveCategory);
        setExpandedSubService(null); // Reset sub-service expansion
        // Clear hover state when clicking
        if (newActiveCategory) {
            setHoveredCategory(null);
        }
    }, [activeCategory]);
    var handleSubServiceClick = (0, react_1.useCallback)(function (subServiceId) {
        setExpandedSubService(expandedSubService === subServiceId ? null : subServiceId);
    }, [expandedSubService]);
    var handleServiceAction = (0, react_1.useCallback)(function (categoryId, subServiceId, action) {
        onServiceSelect === null || onServiceSelect === void 0 ? void 0 : onServiceSelect(categoryId, subServiceId, action);
    }, [onServiceSelect]);
    // Helper function to determine which category info to show in the sidebar
    // This replaces the complex nested ternary that ESLint flagged
    var getDisplayCategory = function () {
        if (activeCategory) {
            return (SERVICE_CATEGORIES.find(function (cat) { return cat.id === activeCategory; }) || null);
        }
        if (hoveredCategory) {
            return (SERVICE_CATEGORIES.find(function (cat) { return cat.id === hoveredCategory; }) || null);
        }
        return null;
    };
    var displayCategory = getDisplayCategory();
    // Helper function to get card styling classes
    // This breaks down the complex nested ternary for better readability
    var getCardStyling = function (category, isActive, isHovered) {
        var baseClasses = "relative h-48 transition-all duration-500 ease-out cursor-pointer overflow-hidden";
        if (isActive) {
            return "".concat(baseClasses, " ").concat(category.bgColor, " shadow-2xl shadow-").concat(category.bgColor, "/25 scale-105 border-0");
        }
        if (isHovered) {
            return "".concat(baseClasses, " bg-slate-700 border-slate-500 scale-[1.02] shadow-lg");
        }
        return "".concat(baseClasses, " bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:scale-[1.02]");
    };
    // Helper function to get icon styling
    var getIconStyling = function (category, isActive, isHovered) {
        var baseClasses = "inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all duration-300";
        if (isActive) {
            return "".concat(baseClasses, " bg-white/20 text-white scale-110");
        }
        if (isHovered) {
            return "".concat(baseClasses, " ").concat(category.bgColor, " text-white scale-105");
        }
        return "".concat(baseClasses, " bg-slate-700 text-slate-300");
    };
    // Helper function to get title styling
    var getTitleStyling = function (_isActive, _isHovered) {
        var baseClasses = "text-2xl font-bold mb-2 transition-colors duration-300";
        // Both active and hovered states use white text, so we can simplify this
        return "".concat(baseClasses, " text-white");
    };
    // Helper function to get stats styling
    var getStatsStyling = function (isActive, isHovered) {
        var baseClasses = "text-sm font-medium transition-colors duration-300";
        if (isActive) {
            return "".concat(baseClasses, " text-white/90");
        }
        if (isHovered) {
            return "".concat(baseClasses, " text-white/80");
        }
        return "".concat(baseClasses, " text-slate-400");
    };
    return (<div className={"py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 ".concat(className)}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Our Kenya property capabilities
          </h2>
          <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
            Comprehensive verification and discovery solutions designed for
            Kenya&apos;s property market.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Categories */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SERVICE_CATEGORIES.map(function (category) {
            var isActive = activeCategory === category.id;
            var isHovered = hoveredCategory === category.id && !activeCategory;
            var shouldShowPreview = isHovered && !isActive;
            return (<div key={category.id} className="relative">
                      {/* Main Category Card */}
                      <card_1.Card className={getCardStyling(category, isActive, isHovered)} onClick={function () { return handleCategoryClick(category.id); }} onMouseEnter={function () { return handleCategoryHover(category.id); }} onMouseLeave={function () { return handleCategoryHover(null); }}>
                        <card_1.CardContent className="p-8 h-full flex flex-col justify-center items-center text-center">
                          {/* Icon */}
                          <div className={getIconStyling(category, isActive, isHovered)}>
                            {category.icon}
                          </div>

                          {/* Title */}
                          <h3 className={getTitleStyling(isActive, isHovered)}>
                            {category.name}
                          </h3>

                          {/* Stats */}
                          {category.stats && (<div className={getStatsStyling(isActive, isHovered)}>
                              {category.stats.value} {category.stats.label}
                            </div>)}

                          {/* Hover hint - only show when hovering and not active */}
                          {shouldShowPreview && (<div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs text-white/70 animate-pulse">
                              Click to explore all options
                            </div>)}
                        </card_1.CardContent>
                      </card_1.Card>

                      {/* Preview on Hover - Show first sub-service only */}
                      {shouldShowPreview && category.subServices[0] && (<div className="mt-4 animate-slide-up">
                          <div className="bg-slate-700/90 backdrop-blur-sm rounded-lg p-4 border border-slate-500">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white text-sm">
                                  {category.subServices[0].name}
                                </span>
                                {category.subServices[0].popular && (<badge_1.Badge className="bg-yellow-500 text-yellow-900 text-xs">
                                    <lucide_react_1.Star className="w-3 h-3 mr-1"/>
                                    Popular
                                  </badge_1.Badge>)}
                              </div>
                              {category.subServices[0].price && (<span className="text-sm font-medium text-slate-300">
                                  {category.subServices[0].price}
                                </span>)}
                            </div>
                            <p className="text-slate-300 text-xs mb-2">
                              {category.subServices[0].description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <lucide_react_1.Clock className="w-3 h-3"/>
                                {category.subServices[0].duration}
                              </div>
                              {category.subServices.length > 1 && (<span className="text-slate-400">
                                  +{category.subServices.length - 1} more
                                  options
                                </span>)}
                            </div>
                          </div>
                        </div>)}

                      {/* Full Sub-Services Expansion on Click */}
                      {isActive && (<div className="mt-4 space-y-3 animate-slide-up">
                          {category.subServices.map(function (subService) {
                        var isExpanded = expandedSubService === subService.id;
                        return (<div key={subService.id} className="relative">
                                {/* Sub-Service Button */}
                                <button onClick={function (e) {
                                e.stopPropagation();
                                handleSubServiceClick(subService.id);
                            }} className={"\n                                    w-full text-left p-4 rounded-lg transition-all duration-300 flex items-center justify-between\n                                    ".concat(isExpanded ?
                                "".concat(category.bgColor, " text-white shadow-lg")
                                : "bg-slate-700 hover:bg-slate-600 text-slate-200", "\n                                  ")}>
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium">
                                      {subService.name}
                                    </span>
                                    {subService.popular && (<badge_1.Badge className="bg-yellow-500 text-yellow-900 text-xs">
                                        <lucide_react_1.Star className="w-3 h-3 mr-1"/>
                                        Popular
                                      </badge_1.Badge>)}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {subService.price && (<span className="text-sm font-medium">
                                        {subService.price}
                                      </span>)}
                                    {isExpanded ?
                                <lucide_react_1.Minus className="w-4 h-4"/>
                                : <lucide_react_1.Plus className="w-4 h-4"/>}
                                  </div>
                                </button>

                                {/* Sub-Service Details */}
                                {isExpanded && (<div className="mt-2 p-4 bg-slate-800 rounded-lg border border-slate-600 animate-slide-up">
                                    <p className="text-slate-300 text-sm mb-3">
                                      {subService.description}
                                    </p>

                                    <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
                                      <div className="flex items-center gap-1">
                                        <lucide_react_1.Clock className="w-3 h-3"/>
                                        {subService.duration}
                                      </div>
                                      {subService.price && (<div className="flex items-center gap-1">
                                          <lucide_react_1.TrendingUp className="w-3 h-3"/>
                                          {subService.price}
                                        </div>)}
                                    </div>

                                    <div className="space-y-1 mb-4">
                                      {subService.features.map(function (feature, index) { return (<div key={index} className="flex items-center gap-2 text-sm">
                                            <lucide_react_1.CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0"/>
                                            <span className="text-slate-300">
                                              {feature}
                                            </span>
                                          </div>); })}
                                    </div>

                                    <button_1.Button onClick={function (e) {
                                    e.stopPropagation();
                                    handleServiceAction(category.id, subService.id, subService.cta.action);
                                }} className={"w-full ".concat(category.bgColor, " hover:opacity-90 transition-opacity duration-200")}>
                                      {subService.cta.text}
                                      <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
                                    </button_1.Button>
                                  </div>)}
                              </div>);
                    })}
                        </div>)}
                    </div>);
        })}
              </div>
            </div>

            {/* Right Column - Contextual Information */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {displayCategory ?
            <card_1.Card className="bg-slate-800 border-slate-600 transition-all duration-300">
                    <card_1.CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-xl font-bold text-white">
                          {displayCategory.contextualInfo.title}
                        </h3>
                        {hoveredCategory && !activeCategory && (<badge_1.Badge variant="outline" className="text-xs text-slate-400 border-slate-500">
                            Preview
                          </badge_1.Badge>)}
                      </div>
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        {displayCategory.contextualInfo.description}
                      </p>

                      <div className="space-y-3">
                        {displayCategory.contextualInfo.benefits.map(function (benefit, index) { return (<div key={index} className="flex items-center gap-3">
                              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0"/>
                              <span className="text-slate-300 text-sm">
                                {benefit}
                              </span>
                            </div>); })}
                      </div>

                      {hoveredCategory && !activeCategory && (<div className="mt-4 pt-4 border-t border-slate-600">
                          <p className="text-slate-400 text-xs text-center">
                            Click on &quot;{displayCategory.name}&quot; to see
                            all available services
                          </p>
                        </div>)}
                    </card_1.CardContent>
                  </card_1.Card>
            : <card_1.Card className="bg-slate-800 border-slate-600">
                    <card_1.CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <lucide_react_1.ArrowRight className="w-6 h-6 text-slate-400"/>
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-white">
                        Explore Our Services
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Hover over a service category to preview options, or
                        click to explore all available services and features.
                      </p>
                    </card_1.CardContent>
                  </card_1.Card>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
