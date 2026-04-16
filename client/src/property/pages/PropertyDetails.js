"use strict";
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
exports.default = PropertyDetails;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
// Import shared components and utilities
var shared_1 = require("../../shared");
var PhotoManagementButton_1 = require("../../local/components/property/PhotoManagementButton");
var PropertyDetailsSkeleton_1 = require("../../local/components/skeletons/PropertyDetailsSkeleton");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var useSafeQuery_1 = require("../../local/hooks/useSafeQuery");
var formatters_1 = require("../../local/utils/formatters");
// Constants
var NOT_SPECIFIED = "Not specified";
// Convert images to ImageGallery format
var convertToGalleryImages = function (images, title) {
    return images.map(function (url, index) { return ({
        id: "property-".concat(index),
        src: url,
        alt: "".concat(title, " - View ").concat(index + 1),
        category: "property",
    }); });
};
var PropertyImageGallery = function (_a) {
    var images = _a.images;
    var _b = (0, react_1.useState)(0), selectedImageIndex = _b[0], setSelectedImageIndex = _b[1];
    var _c = (0, react_1.useState)(false), showFullscreen = _c[0], setShowFullscreen = _c[1];
    var handleImageClick = (0, react_1.useCallback)(function (index) {
        setSelectedImageIndex(index);
    }, []);
    var handleFullscreenToggle = (0, react_1.useCallback)(function () {
        setShowFullscreen(!showFullscreen);
    }, [showFullscreen]);
    var handlePrevious = (0, react_1.useCallback)(function () {
        setSelectedImageIndex(function (prev) { return (prev > 0 ? prev - 1 : images.length - 1); });
    }, [images.length]);
    var handleNext = (0, react_1.useCallback)(function () {
        setSelectedImageIndex(function (prev) { return (prev < images.length - 1 ? prev + 1 : 0); });
    }, [images.length]);
    // Keyboard navigation for fullscreen
    react_1.default.useEffect(function () {
        if (!showFullscreen)
            return;
        var handleKeyDown = function (e) {
            switch (e.key) {
                case "Escape":
                    setShowFullscreen(false);
                    break;
                case "ArrowLeft":
                    handlePrevious();
                    break;
                case "ArrowRight":
                    handleNext();
                    break;
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return function () { return document.removeEventListener("keydown", handleKeyDown); };
    }, [showFullscreen, handlePrevious, handleNext]);
    if (images.length === 0) {
        return (<card_1.Card className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-2">📷</div>
        <p className="text-gray-500">No images available</p>
      </card_1.Card>);
    }
    var selectedImage = images[selectedImageIndex];
    if (!selectedImage) {
        return (<card_1.Card className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-2">📷</div>
        <p className="text-gray-500">No images available</p>
      </card_1.Card>);
    }
    return (<div className="space-y-4">
      {/* Main Image Display */}
      <card_1.Card className="overflow-hidden">
        <div className="relative aspect-video bg-gray-100">
          <img src={selectedImage.src} alt={selectedImage.alt} className="w-full h-full object-cover"/>

          {/* Image Navigation Overlay */}
          {images.length > 1 && (<>
              <button onClick={handlePrevious} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors" aria-label="Previous image">
                <lucide_react_1.ArrowLeft className="w-5 h-5"/>
              </button>
              <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors" aria-label="Next image">
                <lucide_react_1.ArrowLeft className="w-5 h-5 rotate-180"/>
              </button>
            </>)}

          {/* Image Counter and Fullscreen Button */}
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {selectedImageIndex + 1} of {images.length}
          </div>

          <button onClick={handleFullscreenToggle} className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors" aria-label="View fullscreen" title="View fullscreen">
            <lucide_react_1.ZoomIn className="w-4 h-4"/>
          </button>
        </div>
      </card_1.Card>

      {/* Thumbnail Strip */}
      {images.length > 1 && (<div className="flex gap-2 overflow-x-auto pb-2">
          {images.map(function (image, index) { return (<button key={image.id} onClick={function () { return handleImageClick(index); }} className={"flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ".concat(index === selectedImageIndex ?
                    "border-primary shadow-md"
                    : "border-gray-200 hover:border-gray-300")}>
              <img src={image.src} alt={image.alt} className="w-full h-full object-cover"/>
            </button>); })}
        </div>)}

      {/* Fullscreen Modal */}
      {showFullscreen && (<div className="fixed inset-0 z-50 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button onClick={function () { return setShowFullscreen(false); }} className="absolute top-12 left-1/2 -translate-x-1/2 z-50 p-3 bg-black/90 backdrop-blur-sm text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-xl border-2 border-white/20 hover:border-red-400" aria-label="Close fullscreen">
              <lucide_react_1.X className="w-6 h-6"/>
            </button>

            {/* Main fullscreen image */}
            <img src={selectedImage.src} alt={selectedImage.alt} className="max-w-full max-h-full object-contain"/>

            {/* Navigation in fullscreen */}
            {images.length > 1 && (<>
                <button onClick={handlePrevious} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors" aria-label="Previous image">
                  <lucide_react_1.ArrowLeft className="w-6 h-6"/>
                </button>
                <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors" aria-label="Next image">
                  <lucide_react_1.ArrowLeft className="w-6 h-6 rotate-180"/>
                </button>
              </>)}

            {/* Image counter in fullscreen */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
              {selectedImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>)}
    </div>);
};
var RelatedPropertiesCarousel = function (_a) {
    var currentPropertyId = _a.currentPropertyId;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _b = (0, react_1.useState)(0), currentSlide = _b[0], setCurrentSlide = _b[1];
    var _c = (0, react_1.useState)(true), isAutoPlaying = _c[0], setIsAutoPlaying = _c[1];
    // Mock related properties data - replace with actual API call
    var relatedProperties = (0, react_1.useMemo)(function () {
        var mockRelated = [
            {
                id: "related-1",
                title: "Similar Property in Westlands",
                image: 
                // cspell:disable-next-line
                "/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg",
                price: 12000000,
                type: "apartment",
                location: "Westlands, Nairobi",
            },
            {
                id: "related-2",
                title: "Nearby Villa in Karen",
                // cspell:disable-next-line
                image: "/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg",
                price: 38000000,
                type: "house",
                location: "Karen, Nairobi",
            },
            {
                id: "related-3",
                title: "Modern Apartment Complex",
                image: "/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg",
                price: 18000000,
                type: "apartment",
                location: "Kilimani, Nairobi",
            },
            {
                id: "related-4",
                title: "Executive Townhouse",
                image: 
                // cspell:disable-next-line
                "/assets/Residential/etienne-beauregard-riverin-B0aCvAVSX8E-unsplash.jpg",
                price: 25000000,
                type: "house",
                // cspell:disable-next-line - Lavington is a real location in Nairobi
                location: "Lavington, Nairobi",
            },
            {
                id: "related-5",
                title: "Luxury Penthouse",
                image: "/assets/Commercial/ash-lab-ka4HDVIti78-unsplash.jpg",
                price: 55000000,
                type: "apartment",
                location: "Westlands, Nairobi",
            },
        ];
        // Filter out current property and return related ones
        return mockRelated.filter(function (prop) { return prop.id !== currentPropertyId; });
    }, [currentPropertyId]);
    var itemsPerSlide = 3;
    var totalSlides = Math.ceil(relatedProperties.length / itemsPerSlide);
    var handleSlideChange = (0, react_1.useCallback)(function (newSlide) {
        setCurrentSlide(newSlide);
        setIsAutoPlaying(false); // Stop auto-play when user manually navigates
    }, []);
    var handlePrevSlide = (0, react_1.useCallback)(function () {
        var newSlide = currentSlide > 0 ? currentSlide - 1 : totalSlides - 1;
        handleSlideChange(newSlide);
    }, [currentSlide, totalSlides, handleSlideChange]);
    var handleNextSlide = (0, react_1.useCallback)(function () {
        var newSlide = currentSlide < totalSlides - 1 ? currentSlide + 1 : 0;
        handleSlideChange(newSlide);
    }, [currentSlide, totalSlides, handleSlideChange]);
    var handlePropertyClick = (0, react_1.useCallback)(function (propertyId) {
        navigate("/property/".concat(propertyId));
    }, [navigate]);
    // Auto-play functionality
    react_1.default.useEffect(function () {
        if (!isAutoPlaying || totalSlides <= 1)
            return;
        var interval = setInterval(function () {
            setCurrentSlide(function (prev) { return (prev < totalSlides - 1 ? prev + 1 : 0); });
        }, 4000); // Change slide every 4 seconds
        return function () { return clearInterval(interval); };
    }, [isAutoPlaying, totalSlides]);
    if (relatedProperties.length === 0) {
        return null;
    }
    var currentSlideProperties = relatedProperties.slice(currentSlide * itemsPerSlide, (currentSlide + 1) * itemsPerSlide);
    return (<div className="mt-8">
      <card_1.Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <lucide_react_1.Heart className="w-5 h-5 text-primary"/>
            Related Properties
          </h3>

          {totalSlides > 1 && (<div className="flex items-center gap-2">
              <button onClick={function () { return setIsAutoPlaying(!isAutoPlaying); }} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"} title={isAutoPlaying ? "Pause" : "Play"}>
                {isAutoPlaying ?
                <lucide_react_1.Pause className="w-4 h-4"/>
                : <lucide_react_1.Play className="w-4 h-4"/>}
              </button>
              <button onClick={handlePrevSlide} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" aria-label="Previous slide">
                <lucide_react_1.ArrowLeft className="w-4 h-4"/>
              </button>
              <span className="text-sm text-gray-500">
                {currentSlide + 1} / {totalSlides}
              </span>
              <button onClick={handleNextSlide} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" aria-label="Next slide">
                <lucide_react_1.ArrowLeft className="w-4 h-4 rotate-180"/>
              </button>
            </div>)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onMouseEnter={function () { return setIsAutoPlaying(false); }} onMouseLeave={function () { return setIsAutoPlaying(true); }}>
          {currentSlideProperties.map(function (property) { return (<div key={property.id} onClick={function () { return handlePropertyClick(property.id); }} onKeyDown={function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handlePropertyClick(property.id);
                }
            }} role="button" tabIndex={0} className="group cursor-pointer bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/50">
              <div className="relative aspect-video overflow-hidden">
                <img src={property.image} alt={property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"/>
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium">
                  {property.type}
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-1 group-hover:text-primary transition-colors">
                  {property.title}
                </h4>
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <lucide_react_1.MapPin className="w-3 h-3"/>
                  {property.location}
                </p>
                <p className="text-lg font-bold text-primary">
                  {(0, formatters_1.formatPrice)(property.price)}
                </p>
              </div>
            </div>); })}
        </div>

        {/* Slide indicators */}
        {totalSlides > 1 && (<div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: totalSlides }).map(function (_, index) { return (<button key={index} onClick={function () { return handleSlideChange(index); }} className={"w-2 h-2 rounded-full transition-colors ".concat(index === currentSlide ? "bg-primary" : "bg-gray-300")} aria-label={"Go to slide ".concat(index + 1)}/>); })}
          </div>)}
      </card_1.Card>
    </div>);
};
// Helper function to render error states
var renderErrorState = function (propertyId, error, handleBack) { return (<div className="min-h-screen bg-background flex items-center justify-center">
    <card_1.Card className="p-8 text-center max-w-md">
      <card_1.CardContent>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {!propertyId ? "Property Not Found" : "Error Loading Property"}
        </h2>
        <p className="text-muted-foreground mb-4">
          {!propertyId ?
        "No property ID was provided in the URL."
        : "Failed to load property details. Please try again."}
        </p>
        <div className="flex gap-2 justify-center">
          <button_1.Button onClick={handleBack} variant="outline">
            Go Back
          </button_1.Button>
          {error && (<button_1.Button onClick={function () { return window.location.reload(); }}>Try Again</button_1.Button>)}
        </div>
      </card_1.CardContent>
    </card_1.Card>
  </div>); };
// Helper function to render loading state
var renderLoadingState = function () { return (<div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8">
      <PropertyDetailsSkeleton_1.default />
    </div>
  </div>); };
// Helper function to create share data
var createShareData = function (property) {
    var shareData = {
        title: property.title || "Property Details",
        url: window.location.href,
    };
    if (property.description) {
        shareData.text = property.description;
    }
    return shareData;
};
// Helper function to get badge variant for verification status
var getVerificationBadgeVariant = function (status) {
    if (status === "verified")
        return "default";
    if (status === "pending")
        return "secondary";
    return "destructive";
};
// Helper function to render property features header
var renderPropertyFeaturesHeader = function (isLandProperty, landFeatures, normalizedProperty) {
    var _a;
    if (isLandProperty && landFeatures) {
        return (<>
        {landFeatures.size && (<div className="flex items-center gap-1">
            <lucide_react_1.Square className="w-4 h-4"/>
            <span>{landFeatures.size}</span>
          </div>)}
        {landFeatures.landUse && (<div className="flex items-center gap-1">
            <lucide_react_1.TreePine className="w-4 h-4"/>
            <span className="capitalize">{landFeatures.landUse}</span>
          </div>)}
        {landFeatures.waterAccess && (<div className="flex items-center gap-1">
            <lucide_react_1.Droplets className="w-4 h-4"/>
            <span>Water Access</span>
          </div>)}
        {landFeatures.electricity && (<div className="flex items-center gap-1">
            <lucide_react_1.Zap className="w-4 h-4"/>
            <span>Electricity</span>
          </div>)}
      </>);
    }
    // Regular property features
    return (<>
      {normalizedProperty.type === "residential" &&
            normalizedProperty.features && (<>
            {normalizedProperty.features.bedrooms && (<div className="flex items-center gap-1">
                <lucide_react_1.Bed className="w-4 h-4"/>
                <span>{normalizedProperty.features.bedrooms} Bedrooms</span>
              </div>)}
            {normalizedProperty.features.bathrooms && (<div className="flex items-center gap-1">
                <lucide_react_1.Bath className="w-4 h-4"/>
                <span>{normalizedProperty.features.bathrooms} Bathrooms</span>
              </div>)}
          </>)}
      {((_a = normalizedProperty.features) === null || _a === void 0 ? void 0 : _a.area) && (<div className="flex items-center gap-1">
          <lucide_react_1.Square className="w-4 h-4"/>
          <span>
            {typeof normalizedProperty.features.area === "number" ?
                normalizedProperty.features.area.toLocaleString()
                : String(normalizedProperty.features.area)}{" "}
            {normalizedProperty.type === "land" ? "acres" : "sqm"}
          </span>
        </div>)}
    </>);
};
// Helper function to handle share functionality
var handleShareAction = function (property) { return __awaiter(void 0, void 0, void 0, function () {
    var shareData, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(navigator.share && property)) return [3 /*break*/, 5];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                shareData = createShareData(property);
                return [4 /*yield*/, navigator.share(shareData)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                // Handle share cancellation or errors
                if (error_1 instanceof Error &&
                    error_1.name !== "AbortError" &&
                    process.env.NODE_ENV === "development") {
                    console.error("Share failed:", error_1);
                }
                return [3 /*break*/, 4];
            case 4: return [3 /*break*/, 6];
            case 5:
                // Fallback to clipboard
                navigator.clipboard.writeText(window.location.href);
                _a.label = 6;
            case 6: return [2 /*return*/];
        }
    });
}); };
// Helper function to normalize property data
var useNormalizedProperty = function (property) {
    return (0, react_1.useMemo)(function () {
        var _a;
        if (!property)
            return null;
        // Determine property type based on available data
        var propertyType = typeof ((_a = property.features) === null || _a === void 0 ? void 0 : _a.propertyType) === "string" ?
            property.features.propertyType.toLowerCase()
            : "residential";
        var type = ["commercial", "land"].includes(propertyType) ?
            propertyType
            : "residential";
        return (0, shared_1.normalizeProperty)(property, type);
    }, [property]);
};
/**
 * Migrated PropertyDetails page using shared architecture
 * This version uses shared components and utilities for consistency
 */
function PropertyDetails(_a) {
    var _b, _c;
    var id = _a.id;
    var params = (0, react_router_dom_1.useParams)();
    var navigate = (0, react_router_dom_1.useNavigate)();
    var propertyId = id || params.id || "";
    // State for interactions
    var _d = (0, react_1.useState)(false), isFavorited = _d[0], setIsFavorited = _d[1];
    // Use property hook for data fetching
    var _e = (0, useSafeQuery_1.useSafePropertyQuery)(propertyId), property = _e.data, isLoading = _e.isLoading, error = _e.error;
    // Debug logging
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log("PropertyDetails Debug:", {
            propertyId: propertyId,
            isLoading: isLoading,
            error: error === null || error === void 0 ? void 0 : error.message,
            hasProperty: !!property,
            propertyData: property,
        });
    }
    // Handle back navigation
    var handleBack = (0, react_1.useCallback)(function () {
        navigate(-1);
    }, [navigate]);
    // Handle favorite toggle
    var handleFavoriteToggle = (0, react_1.useCallback)(function () {
        setIsFavorited(function (prev) { return !prev; });
        // Implement favorite API call when backend is ready
    }, []);
    // Handle share functionality
    var handleShare = (0, react_1.useCallback)(function () { return property && handleShareAction(property); }, [property]);
    // Normalize property data for consistent rendering
    var normalizedProperty = useNormalizedProperty(property);
    // Detect if this is a land property
    var isLandProperty = (0, react_1.useMemo)(function () {
        var landProperty = property;
        return ((property === null || property === void 0 ? void 0 : property.type) === "land" ||
            (property === null || property === void 0 ? void 0 : property.propertyType) === "land" ||
            (landProperty === null || landProperty === void 0 ? void 0 : landProperty.landFeatures) !== undefined);
    }, [property]);
    // Get land-specific features if available
    var landFeatures = (0, react_1.useMemo)(function () {
        return property === null || property === void 0 ? void 0 : property.landFeatures;
    }, [property]);
    // Get land verification data if available
    var landVerification = (0, react_1.useMemo)(function () {
        return property === null || property === void 0 ? void 0 : property.verification;
    }, [property]);
    // Early returns for different states
    if (isLoading)
        return renderLoadingState();
    if (error || !propertyId)
        return renderErrorState(propertyId, error, handleBack);
    if (!normalizedProperty) {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <card_1.Card className="p-8 text-center max-w-md">
          <card_1.CardContent>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Property Not Available
            </h2>
            <p className="text-muted-foreground mb-4">
              This property is no longer available or has been removed.
            </p>
            <button_1.Button onClick={handleBack} variant="outline">
              Go Back
            </button_1.Button>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }
    var galleryImages = convertToGalleryImages(normalizedProperty.images || [], normalizedProperty.title);
    return (<div className="min-h-screen bg-background">
      {/* Header with navigation */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button_1.Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-2">
              <lucide_react_1.ArrowLeft className="w-4 h-4"/>
              Back
            </button_1.Button>

            <div className="flex items-center gap-2">
              <button_1.Button variant="ghost" size="sm" onClick={handleFavoriteToggle} className={"flex items-center gap-2 ".concat(isFavorited ? "text-red-500" : "")}>
                <lucide_react_1.Heart className={"w-4 h-4 ".concat(isFavorited ? "fill-current" : "")}/>
                {isFavorited ? "Favorited" : "Favorite"}
              </button_1.Button>

              <button_1.Button variant="ghost" size="sm" onClick={handleShare} className="flex items-center gap-2">
                <lucide_react_1.Share2 className="w-4 h-4"/>
                Share
              </button_1.Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Property Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                {normalizedProperty.title}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <lucide_react_1.MapPin className="w-4 h-4"/>
                <span>
                  {typeof normalizedProperty.location === "string" ?
            normalizedProperty.location
            : ((_b = normalizedProperty.location) === null || _b === void 0 ? void 0 : _b.address) || "Location ".concat(NOT_SPECIFIED.toLowerCase())}
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-2">
                {(0, formatters_1.formatPrice)(typeof normalizedProperty.price === "number" ?
            normalizedProperty.price
            : parseFloat(String(normalizedProperty.price)) || 0)}
              </div>
              {normalizedProperty.verificationStatus === "verified" && (<badge_1.Badge className="bg-green-100 text-green-800">
                  <lucide_react_1.Shield className="w-3 h-3 mr-1"/>
                  Verified
                </badge_1.Badge>)}
            </div>
          </div>

          {/* Property Features */}
          <div className="flex flex-wrap gap-4 text-sm">
            {renderPropertyFeaturesHeader(isLandProperty, landFeatures, normalizedProperty)}

            <div className="flex items-center gap-1">
              <lucide_react_1.Calendar className="w-4 h-4"/>
              <span>
                Listed {(0, formatters_1.formatDate)(normalizedProperty.createdAt || new Date())}
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Image Gallery with Expanded View */}
        <div className="mb-8">
          <PropertyImageGallery images={galleryImages} propertyTitle={normalizedProperty.title}/>

          {/* Related Properties Carousel */}
          <RelatedPropertiesCarousel currentPropertyId={String(normalizedProperty.id)}/>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Description</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {normalizedProperty.description}
                </p>
              </card_1.CardContent>
            </card_1.Card>

            {/* Features & Amenities */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>
                  {isLandProperty ? "Land Features" : "Features & Amenities"}
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                {isLandProperty && landFeatures ?
            // Land-specific features
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size:</span>
                          <span className="font-medium">
                            {landFeatures.size || NOT_SPECIFIED}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Soil Type:
                          </span>
                          <span className="font-medium">
                            {landFeatures.soilType || NOT_SPECIFIED}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Land Use:
                          </span>
                          <span className="font-medium capitalize">
                            {landFeatures.landUse || NOT_SPECIFIED}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Topography:
                          </span>
                          <span className="font-medium capitalize">
                            {landFeatures.topography || NOT_SPECIFIED}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Water Access:
                          </span>
                          <div className="flex items-center gap-1">
                            <lucide_react_1.Droplets className="h-4 w-4"/>
                            <span className="font-medium">
                              {landFeatures.waterAccess ?
                    "Available"
                    : "Not Available"}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Road Access:
                          </span>
                          <div className="flex items-center gap-1">
                            <lucide_react_1.Car className="h-4 w-4"/>
                            <span className="font-medium">
                              {landFeatures.roadAccess ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">
                            Electricity:
                          </span>
                          <div className="flex items-center gap-1">
                            <lucide_react_1.Zap className="h-4 w-4"/>
                            <span className="font-medium">
                              {landFeatures.electricity ?
                    "Available"
                    : "Not Available"}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Drainage:
                          </span>
                          <span className="font-medium capitalize">
                            {landFeatures.drainage || NOT_SPECIFIED}
                          </span>
                        </div>
                      </div>
                      {landFeatures.vegetation && (<div className="col-span-full mt-4 pt-4 border-t">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Vegetation:
                            </span>
                            <span className="font-medium">
                              {landFeatures.vegetation}
                            </span>
                          </div>
                        </div>)}
                    </div>
            // Regular property features
            : <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {normalizedProperty.features &&
                    Object.entries(normalizedProperty.features).map(function (_a) {
                        var key = _a[0], value = _a[1];
                        if (typeof value === "boolean" && value) {
                            return (<div key={key} className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"/>
                                  <span className="text-sm capitalize">
                                    {key.replace(/([A-Z])/g, " $1").trim()}
                                  </span>
                                </div>);
                        }
                        return null;
                    })}
                    </div>}
              </card_1.CardContent>
            </card_1.Card>

            {/* Land Verification Section (only for land properties) */}
            {isLandProperty && landVerification && (<card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="flex items-center gap-2">
                    <lucide_react_1.Shield className="h-5 w-5"/>
                    Land Verification Status
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Title Deed:
                        </span>
                        <badge_1.Badge variant={getVerificationBadgeVariant(landVerification.titleDeedStatus)}>
                          {landVerification.titleDeedStatus}
                        </badge_1.Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Survey Status:
                        </span>
                        <badge_1.Badge variant={landVerification.surveyStatus === "completed" ?
                "default"
                : "secondary"}>
                          {landVerification.surveyStatus}
                        </badge_1.Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Boundary Status:
                        </span>
                        <badge_1.Badge variant={landVerification.boundaryStatus === "clear" ?
                "default"
                : "destructive"}>
                          {landVerification.boundaryStatus}
                        </badge_1.Badge>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Land Rights:
                        </span>
                        <span className="font-medium capitalize">
                          {landVerification.landRights || NOT_SPECIFIED}
                        </span>
                      </div>
                      {landVerification.registrationNumber && (<div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Registration #:
                          </span>
                          <span className="font-medium">
                            {landVerification.registrationNumber}
                          </span>
                        </div>)}
                      {landVerification.lastSurveyDate && (<div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Last Survey:
                          </span>
                          <span className="font-medium">
                            {(0, formatters_1.formatDate)(landVerification.lastSurveyDate)}
                          </span>
                        </div>)}
                    </div>
                  </div>

                  {landVerification.encumbrances &&
                landVerification.encumbrances.length > 0 && (<div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2">Encumbrances:</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground">
                          {landVerification.encumbrances.map(function (encumbrance, index) { return (<li key={index}>{encumbrance}</li>); })}
                        </ul>
                      </div>)}
                </card_1.CardContent>
              </card_1.Card>)}

            {/* Photo Management */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Property Photos</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <PhotoManagementButton_1.EnhancedPhotoManagementButton propertyId={String(normalizedProperty.id)} propertyType={normalizedProperty.type} photoCount={((_c = normalizedProperty.images) === null || _c === void 0 ? void 0 : _c.length) || 0} maxPhotos={20}/>
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Agent */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Contact Agent</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                {normalizedProperty.owner ?
            <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <lucide_react_1.User className="w-6 h-6 text-primary"/>
                      </div>
                      <div>
                        <div className="font-medium">
                          {normalizedProperty.owner.name || "Unknown Agent"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Property Agent
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button_1.Button className="w-full flex items-center gap-2" onClick={function () {
                    /* Contact functionality to be implemented */
                }}>
                        <lucide_react_1.Phone className="w-4 h-4"/>
                        Call Agent
                      </button_1.Button>

                      <button_1.Button variant="outline" className="w-full flex items-center gap-2">
                        <lucide_react_1.Mail className="w-4 h-4"/>
                        Send Message
                      </button_1.Button>
                    </div>
                  </div>
            : <div className="text-center text-muted-foreground">
                    <p>Contact information not available</p>
                  </div>}
              </card_1.CardContent>
            </card_1.Card>

            {/* Property Stats */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Property Statistics</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Views</span>
                  <span className="font-medium">
                    {(property === null || property === void 0 ? void 0 : property.viewCount) || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trust Score</span>
                  <span className="font-medium">
                    {normalizedProperty.trustScore || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium capitalize">
                    {normalizedProperty.status || "available"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {(0, formatters_1.formatDate)(normalizedProperty.updatedAt || new Date())}
                  </span>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Verification Status */}
            {normalizedProperty.verificationStatus === "verified" && (<card_1.Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <card_1.CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <lucide_react_1.Shield className="w-5 h-5 text-green-600"/>
                    <div>
                      <div className="font-medium text-green-800 dark:text-green-400">
                        Verified Property
                      </div>
                      <div className="text-sm text-green-700 dark:text-green-300">
                        This property has been verified by TripleCheck
                      </div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>)}
          </div>
        </div>
      </div>
    </div>);
}
// Export display name for debugging
PropertyDetails.displayName = "PropertyDetails";
