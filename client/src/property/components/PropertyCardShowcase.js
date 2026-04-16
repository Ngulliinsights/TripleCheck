"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.default = PropertyCardShowcase;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var property_1 = require("../../local/components/property");
var badge_1 = require("../../local/components/ui/badge");
var normalizeLandProperty_1 = require("../utils/normalizeLandProperty");
var utils_1 = require("../../local/lib/utils");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var tabs_1 = require("../../local/components/ui/tabs");
var LandCard_1 = require("./LandCard");
var PropertyCardShowcase_module_css_1 = require("./PropertyCardShowcase.module.css");
/* ------------------------------------------------------------------ */
/* Types & Constants                                                  */
/* ------------------------------------------------------------------ */
// Constants to prevent string duplication and magic values
var RESIDENTIAL_TYPE = "residential";
var COMMERCIAL_TYPE = "commercial";
var CONTAINER_HEIGHT = 400;
var DEFAULT_ITEM_HEIGHT = 200;
var VISIBLE_ITEMS_BUFFER = 1;
var STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes
var SAMPLE_DATE = "2024-01-15";
var PropertyCardErrorBoundary = /** @class */ (function (_super) {
    __extends(PropertyCardErrorBoundary, _super);
    function PropertyCardErrorBoundary(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { hasError: false };
        return _this;
    }
    PropertyCardErrorBoundary.getDerivedStateFromError = function (error) {
        return { hasError: true, error: error };
    };
    PropertyCardErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        // Using a more robust logging approach instead of console.error
        this.logError("PropertyCard Error:", { error: error, errorInfo: errorInfo });
    };
    PropertyCardErrorBoundary.prototype.logError = function (message, data) {
        // In production, this would integrate with your logging service
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.error(message, data.error, data.errorInfo);
        }
        // Integrate with error tracking service (e.g., Sentry, LogRocket) in production
    };
    PropertyCardErrorBoundary.prototype.render = function () {
        var _a;
        if (this.state.hasError) {
            var fallbackElement = (<div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600 text-sm">Error loading property card</p>
        </div>);
            return (_a = this.props.fallback) !== null && _a !== void 0 ? _a : fallbackElement;
        }
        return this.props.children;
    };
    return PropertyCardErrorBoundary;
}(react_1.Component));
var ListingCard = function (_a) {
    var property = _a.property, onClick = _a.onClick, _b = _a.className, className = _b === void 0 ? "" : _b;
    // Helper function to safely extract location string
    var getLocationString = (0, react_1.useCallback)(function (location) {
        return typeof location === "string" ? location : location.address;
    }, []);
    // Memoized price formatter for performance
    var formatPrice = (0, react_1.useMemo)(function () {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
        });
    }, []);
    var location = getLocationString(property.location);
    var formattedPrice = formatPrice.format(property.price);
    return (<card_1.Card className={"cursor-pointer transition-all hover:shadow-lg ".concat(className)} onClick={function () { return onClick === null || onClick === void 0 ? void 0 : onClick(property.id); }}>
      <div className="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
        {property.images && property.images.length > 0 ?
            <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" loading="lazy"/>
            : <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image available
          </div>}
      </div>
      <card_1.CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg truncate">{property.title}</h3>
          <badge_1.Badge variant={property.status === "verified" ? "default" : "secondary"}>
            {property.verificationStatus}
          </badge_1.Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-2">{location}</p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">{formattedPrice}</span>
          {property.features && (<div className="text-sm text-muted-foreground">
              {property.features.bedrooms && property.features.bathrooms && (<span>
                  {property.features.bedrooms}BR • {property.features.bathrooms}
                  BA
                </span>)}
            </div>)}
        </div>
      </card_1.CardContent>
    </card_1.Card>);
};
var VirtualizedPropertyList = function (_a) {
    var properties = _a.properties, onPropertyClick = _a.onPropertyClick, _b = _a.itemHeight, itemHeight = _b === void 0 ? DEFAULT_ITEM_HEIGHT : _b, _c = _a.className, className = _c === void 0 ? "" : _c;
    var _d = (0, react_1.useState)(0), scrollTop = _d[0], setScrollTop = _d[1];
    // Memoized calculations for virtualization
    var virtualizedData = (0, react_1.useMemo)(function () {
        var visibleItems = Math.ceil(CONTAINER_HEIGHT / itemHeight);
        var startIndex = Math.floor(scrollTop / itemHeight);
        var endIndex = Math.min(startIndex + visibleItems + VISIBLE_ITEMS_BUFFER, properties.length);
        var visibleProperties = properties.slice(startIndex, endIndex);
        return {
            startIndex: startIndex,
            endIndex: endIndex,
            visibleProperties: visibleProperties,
            totalHeight: properties.length * itemHeight,
        };
    }, [properties, itemHeight, scrollTop]);
    var handleScroll = (0, react_1.useCallback)(function (e) {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);
    var containerStyle = {
        '--total-height': "".concat(virtualizedData.totalHeight, "px"),
    };
    // These inline styles are required for dynamic virtualization values that can't be handled by CSS alone
    return (<div className={(0, utils_1.cn)(PropertyCardShowcase_module_css_1.default.virtualizedContainer, className)} onScroll={handleScroll} 
    // containerStyle contains dynamic total-height which must be calculated at runtime
    style={containerStyle}>
      <div className={PropertyCardShowcase_module_css_1.default.virtualizedContent}>
        {virtualizedData.visibleProperties.map(function (property, index) { return (<div key={property.id} className={(0, utils_1.cn)(PropertyCardShowcase_module_css_1.default.virtualizedItem)} 
        // Dynamic positioning for virtualized items requires runtime calculation
        style={{
                '--item-height': "".concat(itemHeight, "px"),
                '--item-offset': "".concat((virtualizedData.startIndex + index) * itemHeight, "px")
            }}>
            <ListingCard property={__assign(__assign({}, property), { status: property.verificationStatus })} onClick={onPropertyClick} className="h-full"/>
          </div>); })}
      </div>
    </div>);
};
/* ------------------------------------------------------------------ */
/* Mock Data                                                          */
/* ------------------------------------------------------------------ */
var mockProperties = [
    {
        id: "1",
        title: "Modern 3BR Apartment in Westlands",
        description: "Luxurious apartment with stunning city views and modern amenities.",
        location: "Westlands, Nairobi",
        price: 15000000,
        originalPrice: 18000000,
        images: [
            "/assets/Residential/alejandra-cifre-gonzalez-ylyn5r4vxcA-unsplash.jpg",
            "/assets/Residential/alexander-andrews-A3DPhhAL6Zg-unsplash.jpg",
            "/assets/Residential/billy-jo-catbagan-ysUyvjCocWo-unsplash.jpg",
        ],
        type: RESIDENTIAL_TYPE,
        verificationStatus: "verified",
        trustScore: 95,
        features: {
            bedrooms: 3,
            bathrooms: 2,
            squareFeet: 1200,
            propertyType: "Apartment",
        },
        dateAdded: new Date(SAMPLE_DATE),
        viewCount: 245,
        isNew: true,
        isFeatured: true,
    },
    {
        id: "2",
        title: "Commercial Office Space in CBD",
        description: "Prime office space in the heart of Nairobi's Central Business District.",
        location: "CBD, Nairobi",
        price: 45000000,
        images: [
            "/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg",
            "/assets/Commercial/benjamin-cheng-wTZAqLPcTKk-unsplash (1).jpg",
        ],
        type: COMMERCIAL_TYPE,
        verificationStatus: "verified",
        trustScore: 92,
        features: {
            squareFeet: 2500,
            propertyType: "Office",
        },
        dateAdded: new Date("2024-01-10"),
        viewCount: 189,
        isFeatured: true,
    },
    {
        id: "3",
        title: "Family Home in Karen",
        description: "Spacious family home in the prestigious Karen neighborhood.",
        location: "Karen, Nairobi",
        price: 25000000,
        images: [
            "/assets/Residential/caroline-badran-aaONSK4BKxc-unsplash.jpg",
            "/assets/Residential/caroline-badran-nf7iKpydFR4-unsplash.jpg",
        ],
        type: RESIDENTIAL_TYPE,
        verificationStatus: "pending",
        trustScore: 88,
        features: {
            bedrooms: 4,
            bathrooms: 3,
            squareFeet: 2800,
            propertyType: "House",
        },
        dateAdded: new Date("2024-01-08"),
        viewCount: 156,
    },
];
var mockLandProperties = [
    {
        id: "land-1",
        title: "5-Acre Agricultural Land in Kiambu",
        description: "Prime agricultural land with fertile soil, perfect for farming or development.",
        location: "Kiambu County",
        price: 12000000,
        size: "5 acres",
        images: ["/assets/Land/federico-respini-sYffw0LNr7s-unsplash.jpg"],
        verificationStatus: "verified",
        trustScore: 95,
        landType: "agricultural",
        titleDeedStatus: "available",
        lastVerified: SAMPLE_DATE,
        riskLevel: "low",
        features: {
            soilType: "Fertile loam",
            waterAccess: true,
            roadAccess: true,
            electricityAccess: true,
            zoning: "Agricultural",
            developmentPotential: "High",
        },
        dateAdded: new Date(SAMPLE_DATE),
        viewCount: 89,
        isNew: true,
    },
    {
        id: "land-2",
        title: "2-Acre Residential Plot in Nakuru",
        description: "Well-located residential plot with access to utilities and good road network.",
        location: "Nakuru County",
        price: 8500000,
        size: "2 acres",
        images: ["/assets/Land/gautier-pfeiffer-WPapb9IqRKw-unsplash.jpg"],
        verificationStatus: "verified",
        trustScore: 89,
        landType: RESIDENTIAL_TYPE,
        titleDeedStatus: "available",
        lastVerified: "2024-01-18",
        riskLevel: "low",
        features: {
            waterAccess: true,
            roadAccess: true,
            electricityAccess: true,
            zoning: "Residential",
            developmentPotential: "High",
        },
        dateAdded: new Date("2024-01-18"),
        viewCount: 67,
    },
];
/* ------------------------------------------------------------------ */
/* API Functions                                                      */
/* ------------------------------------------------------------------ */
var fetchProperties = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // Simulate API delay with more realistic timing
            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 800); })];
            case 1:
                // Simulate API delay with more realistic timing
                _a.sent();
                return [2 /*return*/, mockProperties];
        }
    });
}); };
var fetchLandProperties = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // Simulate API delay
            return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 600); })];
            case 1:
                // Simulate API delay
                _a.sent();
                return [2 /*return*/, mockLandProperties];
        }
    });
}); };
/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */
function PropertyCardShowcase() {
    var _this = this;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_1.useState)(new Set()), wishlist = _a[0], setWishlist = _a[1];
    // Queries with optimized configuration
    var _b = (0, react_query_1.useQuery)({
        queryKey: ["showcase-properties"],
        queryFn: fetchProperties,
        staleTime: STALE_TIME_MS,
    }), properties = _b.data, propertiesLoading = _b.isLoading;
    var _c = (0, react_query_1.useQuery)({
        queryKey: ["showcase-land"],
        queryFn: fetchLandProperties,
        staleTime: STALE_TIME_MS,
    }), landProperties = _c.data, landLoading = _c.isLoading;
    // Helper method for logging share errors
    var logShareError = (0, react_1.useCallback)(function (message, error) {
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.warn(message, error);
        }
        // Integrate with error tracking service in production
    }, []);
    // Enhanced error handling for share functionality
    var handleSaveProperty = (0, react_1.useCallback)(function (id) {
        setWishlist(function (prev) {
            var newWishlist = new Set(prev);
            if (newWishlist.has(id)) {
                newWishlist.delete(id);
            }
            else {
                newWishlist.add(id);
            }
            return newWishlist;
        });
    }, []);
    var handleShareProperty = (0, react_1.useCallback)(function (id) { return __awaiter(_this, void 0, void 0, function () {
        var property, shareData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    property = (properties === null || properties === void 0 ? void 0 : properties.find(function (p) { return p.id === id; })) ||
                        (landProperties === null || landProperties === void 0 ? void 0 : landProperties.find(function (p) { return p.id === id; }));
                    if (!property)
                        return [2 /*return*/, Promise.resolve()];
                    shareData = {
                        title: property.title,
                        text: "Check out this property: ".concat(property.title),
                        url: "".concat(window.location.origin, "/property/").concat(id),
                    };
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!navigator.share) return [3 /*break*/, 3];
                    return [4 /*yield*/, navigator.share(shareData)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3:
                    if (!navigator.clipboard) return [3 /*break*/, 5];
                    return [4 /*yield*/, navigator.clipboard.writeText(shareData.url)];
                case 4:
                    _a.sent();
                    // Implement proper toast notification system in production
                    // For now, using a more user-friendly approach
                    if (window.confirm) {
                        window.confirm("Link copied to clipboard!");
                    }
                    _a.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    // Enhanced error handling with proper type checking
                    if (error_1 instanceof Error && error_1.name !== "AbortError") {
                        logShareError("Share failed:", error_1);
                    }
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [properties, landProperties, logShareError]);
    var handleViewDetails = (0, react_1.useCallback)(function (id) {
        navigate("/property/".concat(id));
    }, [navigate]);
    var handleVerifyLand = (0, react_1.useCallback)(function (id) {
        navigate("/land-verification/new?landId=".concat(id));
    }, [navigate]);
    // Enhanced property transformation with proper type mapping
    var transformPropertyForCard = (0, react_1.useCallback)(function (property) {
        var _a, _b, _c, _d;
        return ({
            id: property.id,
            title: property.title,
            description: property.description,
            location: typeof property.location === "string" ?
                property.location
                : property.location.address,
            price: property.price,
            images: property.images,
            verified: property.verificationStatus === "verified",
            type: property.type,
            category: property.type,
            features: {
                bedrooms: (_a = property.features) === null || _a === void 0 ? void 0 : _a.bedrooms,
                bathrooms: (_b = property.features) === null || _b === void 0 ? void 0 : _b.bathrooms,
                squareFeet: (_c = property.features) === null || _c === void 0 ? void 0 : _c.squareFeet,
                propertyType: (_d = property.features) === null || _d === void 0 ? void 0 : _d.propertyType,
            },
            createdAt: (property.dateAdded || new Date()).toISOString(),
            status: "available",
            trustScore: property.trustScore,
            verificationStatus: property.verificationStatus,
            views: property.viewCount || 0,
        });
    }, []);
    // Memoized components with performance optimizations
    var propertyCards = (0, react_1.useMemo)(function () {
        if (!properties)
            return [];
        return properties.map(function (property, index) { return (<PropertyCardErrorBoundary key={property.id}>
        <property_1.PropertyCard property={transformPropertyForCard(property)} priority={index < 3} // Above-the-fold optimization
         showQuickActions={true} isInWishlist={wishlist.has(property.id)} onSave={handleSaveProperty} onShare={handleShareProperty} onClick={function (property) { return handleViewDetails(property.id); }} className="h-full"/>
      </PropertyCardErrorBoundary>); });
    }, [
        properties,
        wishlist,
        handleSaveProperty,
        handleShareProperty,
        handleViewDetails,
        transformPropertyForCard,
    ]);
    var listingCards = (0, react_1.useMemo)(function () {
        if (!properties)
            return [];
        return properties.map(function (property) { return (<ListingCard key={property.id} property={__assign(__assign({}, property), { status: property.verificationStatus })} onClick={handleViewDetails} className="h-full"/>); });
    }, [properties, handleViewDetails]);
    var landCards = (0, react_1.useMemo)(function () {
        if (!landProperties)
            return [];
        return landProperties.map(function (property) { return (<LandCard_1.default key={property.id} property={(0, normalizeLandProperty_1.normalizeLandProperty)(property)} showQuickActions={true} showGallery={true} isInWishlist={wishlist.has(property.id)} onSave={handleSaveProperty} onShare={handleShareProperty} onViewDetails={handleViewDetails} onVerify={handleVerifyLand} className="h-full"/>); });
    }, [
        landProperties,
        wishlist,
        handleSaveProperty,
        handleShareProperty,
        handleViewDetails,
        handleVerifyLand,
    ]);
    return (<div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Property Card Component Showcase
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Demonstrating the integration of PropertyCard, ListingCard, and
          EnhancedLandCard with the strategic image foundation components.
        </p>
        <div className="flex justify-center gap-2">
          <badge_1.Badge variant="outline">Image Optimization</badge_1.Badge>
          <badge_1.Badge variant="outline">Performance Optimized</badge_1.Badge>
          <badge_1.Badge variant="outline">Accessibility Ready</badge_1.Badge>
        </div>
      </div>

      {/* Component Showcase Tabs */}
      <tabs_1.Tabs defaultValue="property-card" className="w-full">
        <tabs_1.TabsList className="grid w-full grid-cols-4">
          <tabs_1.TabsTrigger value="property-card">PropertyCard</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="listing-card">ListingCard</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="land-card">LandCard</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="virtualized">Virtualized</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        {/* PropertyCard Showcase */}
        <tabs_1.TabsContent value="property-card" className="space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center justify-between">
                PropertyCard - Premium Features
                <badge_1.Badge>Advanced</badge_1.Badge>
              </card_1.CardTitle>
              <p className="text-muted-foreground">
                Premium property card with advanced image gallery, accessibility
                features, performance optimizations, and B2B contextual prompts.
              </p>
            </card_1.CardHeader>
            <card_1.CardContent>
              {propertiesLoading ?
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map(function (_, i) { return (<div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-[4/3] rounded-lg mb-4"/>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"/>
                        <div className="h-4 bg-gray-200 rounded w-1/2"/>
                      </div>
                    </div>); })}
                </div>
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {propertyCards}
                </div>}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        {/* ListingCard Showcase */}
        <tabs_1.TabsContent value="listing-card" className="space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center justify-between">
                ListingCard - Versatile & Flexible
                <badge_1.Badge variant="secondary">Standard</badge_1.Badge>
              </card_1.CardTitle>
              <p className="text-muted-foreground">
                Flexible property card with compare functionality,
                backward-compatible patterns, and responsive design for various
                contexts.
              </p>
            </card_1.CardHeader>
            <card_1.CardContent>
              {propertiesLoading ?
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map(function (_, i) { return (<div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-video rounded-lg mb-4"/>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"/>
                        <div className="h-4 bg-gray-200 rounded w-1/2"/>
                      </div>
                    </div>); })}
                </div>
            : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listingCards}
                </div>}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        {/* EnhancedLandCard Showcase */}
        <tabs_1.TabsContent value="land-card" className="space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center justify-between">
                EnhancedLandCard - Land Verification Focus
                <badge_1.Badge variant="destructive">Specialized</badge_1.Badge>
              </card_1.CardTitle>
              <p className="text-muted-foreground">
                Specialized land property card with verification status, trust
                scores, risk assessment, and Kenya-specific land features.
              </p>
            </card_1.CardHeader>
            <card_1.CardContent>
              {landLoading ?
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 2 }).map(function (_, i) { return (<div key={i} className="animate-pulse">
                      <div className="bg-gray-200 aspect-[4/3] rounded-lg mb-4"/>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"/>
                        <div className="h-4 bg-gray-200 rounded w-1/2"/>
                        <div className="flex gap-2">
                          <div className="h-6 bg-gray-200 rounded w-16"/>
                          <div className="h-6 bg-gray-200 rounded w-16"/>
                        </div>
                      </div>
                    </div>); })}
                </div>
            : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {landCards}
                </div>}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        {/* Virtualized List Showcase */}
        <tabs_1.TabsContent value="virtualized" className="space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center justify-between">
                VirtualizedPropertyList - Performance at Scale
                <badge_1.Badge variant="outline">Performance</badge_1.Badge>
              </card_1.CardTitle>
              <p className="text-muted-foreground">
                High-performance virtualized list for handling thousands of
                properties with smooth scrolling and memory efficiency.
              </p>
            </card_1.CardHeader>
            <card_1.CardContent>
              {propertiesLoading ?
            <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"/>
                    <p className="text-muted-foreground">
                      Loading virtualized list...
                    </p>
                  </div>
                </div>
            : <div className="h-96 border rounded-lg">
                  <VirtualizedPropertyList properties={properties || []} onPropertyClick={handleViewDetails} itemHeight={DEFAULT_ITEM_HEIGHT} className="h-full"/>
                </div>}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>

      {/* Integration Benefits */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Integration Benefits</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              🖼️
            </div>
            <h3 className="font-semibold">Unified Image Handling</h3>
            <p className="text-sm text-muted-foreground">
              All components use optimized image handling for consistent
              performance, format selection, and land-specific placeholders.
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              ⚡
            </div>
            <h3 className="font-semibold">Performance Optimized</h3>
            <p className="text-sm text-muted-foreground">
              Intersection observers, image preloading, virtualization, and
              memoization for optimal performance.
            </p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              ♿
            </div>
            <h3 className="font-semibold">Accessibility Ready</h3>
            <p className="text-sm text-muted-foreground">
              ARIA labels, keyboard navigation, screen reader support, and
              semantic HTML throughout.
            </p>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Usage Statistics */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Component Usage Statistics</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {(properties === null || properties === void 0 ? void 0 : properties.length) || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Properties Loaded
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {(landProperties === null || landProperties === void 0 ? void 0 : landProperties.length) || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Land Properties
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {wishlist.size}
              </div>
              <div className="text-sm text-muted-foreground">
                Wishlist Items
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">3</div>
              <div className="text-sm text-muted-foreground">
                Component Types
              </div>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button_1.Button onClick={function () { return navigate("/properties"); }}>
          View All Properties
        </button_1.Button>
        <button_1.Button variant="outline" onClick={function () { return navigate("/properties/land"); }}>
          Browse Land Listings
        </button_1.Button>
        <button_1.Button variant="outline" onClick={function () { return navigate("/land-verification"); }}>
          Land Verification
        </button_1.Button>
      </div>
    </div>);
}
