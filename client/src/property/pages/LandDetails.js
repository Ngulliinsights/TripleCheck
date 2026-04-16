"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LandDetails;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var date_utils_1 = require("../../local/utils/date-utils");
var formatters_1 = require("../../local/utils/formatters");
var useUnifiedProperty_1 = require("../hooks/useUnifiedProperty");
// Constants
var NOT_SPECIFIED = "Not specified";
// Convert images to ImageGallery format for land properties
var convertToLandGalleryImages = function (images, title) {
    return images.map(function (url, index) { return ({
        id: "land-".concat(index),
        src: url,
        alt: "".concat(title, " - View ").concat(index + 1),
        category: "land",
    }); });
};
var LandImageGallery = function (_a) {
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
        <div className="text-gray-400 text-4xl mb-2">🏞️</div>
        <p className="text-gray-500">No land images available</p>
      </card_1.Card>);
    }
    var selectedImage = images[selectedImageIndex];
    if (!selectedImage) {
        return (<card_1.Card className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-2">🏞️</div>
        <p className="text-gray-500">No land images available</p>
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
          <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <lucide_react_1.TreePine className="w-4 h-4"/>
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
                    "border-green-500 shadow-md"
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
              <lucide_react_1.TreePine className="w-4 h-4"/>
              {selectedImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>)}
    </div>);
};
var RelatedLandsCarousel = function (_a) {
    var currentLandId = _a.currentLandId;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _b = (0, react_1.useState)(0), currentSlide = _b[0], setCurrentSlide = _b[1];
    var _c = (0, react_1.useState)(true), isAutoPlaying = _c[0], setIsAutoPlaying = _c[1];
    // Mock related lands data - replace with actual API call
    var relatedLands = (0, react_1.useMemo)(function () {
        return [
            {
                id: "land-1",
                title: "Agricultural Land in Nakuru",
                image: "/assets/Land/agricultural-land-1.jpg",
                price: 5000000,
                size: "5 acres",
                landUse: "agricultural",
                location: "Nakuru County",
            },
            {
                id: "land-2",
                title: "Residential Plot in Kiambu",
                image: "/assets/Land/residential-plot-1.jpg",
                price: 8000000,
                size: "0.5 acres",
                landUse: "residential",
                location: "Kiambu County",
            },
            {
                id: "land-3",
                title: "Commercial Land in Mombasa",
                image: "/assets/Land/commercial-land-1.jpg",
                price: 15000000,
                size: "2 acres",
                landUse: "commercial",
                location: "Mombasa County",
            },
            {
                id: "land-4",
                title: "Mixed Use Land in Eldoret",
                image: "/assets/Land/mixed-use-land-1.jpg",
                price: 12000000,
                size: "3 acres",
                landUse: "mixed",
                location: "Uasin Gishu County",
            },
        ].filter(function (land) { return land.id !== currentLandId; });
    }, [currentLandId]);
    var itemsPerSlide = 3;
    var totalSlides = Math.ceil(relatedLands.length / itemsPerSlide);
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
    var handleLandClick = (0, react_1.useCallback)(function (landId) {
        navigate("/property/".concat(landId));
    }, [navigate]);
    // Auto-play functionality
    react_1.default.useEffect(function () {
        if (!isAutoPlaying || totalSlides <= 1)
            return;
        var interval = setInterval(function () {
            setCurrentSlide(function (prev) { return (prev < totalSlides - 1 ? prev + 1 : 0); });
        }, 5000); // Change slide every 5 seconds
        return function () { return clearInterval(interval); };
    }, [isAutoPlaying, totalSlides]);
    if (relatedLands.length === 0) {
        return null;
    }
    var currentSlideProperties = relatedLands.slice(currentSlide * itemsPerSlide, (currentSlide + 1) * itemsPerSlide);
    return (<div className="mt-8">
      <card_1.Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <lucide_react_1.TreePine className="w-5 h-5 text-green-600"/>
              Related Land Properties
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Similar land properties you might be interested in
            </p>
          </div>

          {totalSlides > 1 && (<div className="flex items-center gap-2">
              <button onClick={function () { return setIsAutoPlaying(!isAutoPlaying); }} className="p-2 rounded-full bg-green-50 hover:bg-green-100 transition-colors" aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"} title={isAutoPlaying ? "Pause" : "Play"}>
                {isAutoPlaying ?
                <lucide_react_1.Pause className="w-4 h-4 text-green-600"/>
                : <lucide_react_1.Play className="w-4 h-4 text-green-600"/>}
              </button>
              <button onClick={handlePrevSlide} className="p-2 rounded-full bg-green-50 hover:bg-green-100 transition-colors" aria-label="Previous slide">
                <lucide_react_1.ArrowLeft className="w-4 h-4 text-green-600"/>
              </button>
              <span className="text-sm text-gray-500">
                {currentSlide + 1} / {totalSlides}
              </span>
              <button onClick={handleNextSlide} className="p-2 rounded-full bg-green-50 hover:bg-green-100 transition-colors" aria-label="Next slide">
                <lucide_react_1.ArrowLeft className="w-4 h-4 rotate-180 text-green-600"/>
              </button>
            </div>)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" onMouseEnter={function () { return setIsAutoPlaying(false); }} onMouseLeave={function () { return setIsAutoPlaying(true); }}>
          {currentSlideProperties.map(function (land) { return (<div key={land.id} onClick={function () { return handleLandClick(land.id); }} onKeyDown={function (e) {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleLandClick(land.id);
                }
            }} role="button" tabIndex={0} className="group cursor-pointer bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-green-500/50">
              <div className="relative aspect-video overflow-hidden">
                <img src={land.image} alt={land.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200"/>
                <div className="absolute top-2 right-2 bg-green-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <lucide_react_1.TreePine className="w-3 h-3"/>
                  {land.size}
                </div>
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium capitalize">
                  {land.landUse}
                </div>
              </div>

              <div className="p-4">
                <h4 className="font-medium text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                  {land.title}
                </h4>
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <lucide_react_1.MapPin className="w-3 h-3"/>
                  {land.location}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-green-600">
                    {(0, formatters_1.formatPrice)(land.price)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <lucide_react_1.Droplets className="w-3 h-3"/>
                    <span>Water access</span>
                  </div>
                </div>
              </div>
            </div>); })}
        </div>

        {/* Slide indicators */}
        {totalSlides > 1 && (<div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: totalSlides }).map(function (_, index) { return (<button key={index} onClick={function () { return handleSlideChange(index); }} className={"w-2 h-2 rounded-full transition-colors ".concat(index === currentSlide ? "bg-green-600" : "bg-gray-300")} aria-label={"Go to slide ".concat(index + 1)}/>); })}
          </div>)}
      </card_1.Card>
    </div>);
};
function LandDetails(_a) {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    var id = _a.id;
    var params = (0, react_router_dom_1.useParams)();
    var navigate = (0, react_router_dom_1.useNavigate)();
    var landId = id || params.id || "";
    // Use the unified property hook for land properties
    var useLandProperty = (0, useUnifiedProperty_1.useUnifiedProperty)().useLandProperty;
    var _w = useLandProperty(landId), land = _w.data, isLoading = _w.isLoading, error = _w.error;
    var hasValidData = Boolean(land);
    // Loading state with accessible design
    if (isLoading) {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <lucide_react_1.Loader2 className="w-6 h-6 animate-spin"/>
          <span>Loading land details...</span>
        </div>
      </div>);
    }
    // Error state with helpful messaging and navigation
    if (error || !hasValidData || !land) {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Land Property Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The land property you&apos;re looking for does not exist or has been
            removed.
          </p>
          <button_1.Button type="button" onClick={function () { return window.history.back(); }}>
            Go Back
          </button_1.Button>
        </div>
      </div>);
    }
    // Utility functions for consistent styling and formatting
    var formatPrice = function (price) {
        return new Intl.NumberFormat("en-KE", {
            style: "currency",
            currency: "KES",
            minimumFractionDigits: 0,
        }).format(price);
    };
    var getTrustScoreColor = function (score) {
        if (score >= 80)
            return "text-green-600";
        if (score >= 60)
            return "text-yellow-600";
        return "text-red-600";
    };
    var getVerificationBadge = function (status) {
        var variants = {
            verified: "default",
            pending: "secondary",
            unverified: "outline",
            flagged: "destructive",
        };
        return variants[status] || "outline";
    };
    var getRiskBadge = function (level) {
        var variants = {
            low: "default",
            medium: "secondary",
            high: "destructive",
        };
        return variants[level] || "outline";
    };
    return (<div className="container mx-auto px-4 navbar-offset pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{land.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <lucide_react_1.MapPin className="h-4 w-4"/>
                <span>
                  {land.location.address}, {land.location.city}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <badge_1.Badge variant={getVerificationBadge(land.verificationStatus)}>
                  <lucide_react_1.Shield className="h-3 w-3 mr-1"/>
                  {land.verificationStatus}
                </badge_1.Badge>
                <badge_1.Badge variant={getRiskBadge(land.riskLevel)}>
                  Risk: {land.riskLevel}
                </badge_1.Badge>
              </div>
            </div>
          </div>

          {/* Enhanced Land Image Gallery */}
          <LandImageGallery images={convertToLandGalleryImages(land.images || [], land.title)} landTitle={land.title}/>

          {/* Related Lands Carousel */}
          <RelatedLandsCarousel currentLandId={String(land.id)}/>

          {/* Description */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Description</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {land.description}
              </p>
            </card_1.CardContent>
          </card_1.Card>

          {/* Land Features */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.TreePine className="h-5 w-5"/>
                Land Features
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">
                      {((_b = land.landFeatures) === null || _b === void 0 ? void 0 : _b.size) || NOT_SPECIFIED}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Soil Type:</span>
                    <span className="font-medium">
                      {((_c = land.landFeatures) === null || _c === void 0 ? void 0 : _c.soilType) || NOT_SPECIFIED}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Land Use:</span>
                    <span className="font-medium capitalize">
                      {((_d = land.landFeatures) === null || _d === void 0 ? void 0 : _d.landUse) || NOT_SPECIFIED}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Topography:</span>
                    <span className="font-medium capitalize">
                      {((_e = land.landFeatures) === null || _e === void 0 ? void 0 : _e.topography) || NOT_SPECIFIED}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Water Access:</span>
                    <div className="flex items-center gap-1">
                      <lucide_react_1.Droplets className="h-4 w-4"/>
                      <span className="font-medium">
                        {((_f = land.landFeatures) === null || _f === void 0 ? void 0 : _f.waterAccess) ?
            "Available"
            : "Not Available"}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Road Access:</span>
                    <span className="font-medium">
                      {((_g = land.landFeatures) === null || _g === void 0 ? void 0 : _g.roadAccess) ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Electricity:</span>
                    <span className="font-medium">
                      {((_h = land.landFeatures) === null || _h === void 0 ? void 0 : _h.electricity) ?
            "Available"
            : "Not Available"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Drainage:</span>
                    <span className="font-medium capitalize">
                      {((_j = land.landFeatures) === null || _j === void 0 ? void 0 : _j.drainage) || NOT_SPECIFIED}
                    </span>
                  </div>
                </div>
              </div>

              {((_k = land.landFeatures) === null || _k === void 0 ? void 0 : _k.vegetation) && (<div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vegetation:</span>
                    <span className="font-medium">
                      {land.landFeatures.vegetation}
                    </span>
                  </div>
                </div>)}
            </card_1.CardContent>
          </card_1.Card>

          {/* Land Verification */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.FileCheck className="h-5 w-5"/>
                Land Verification Status
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title Deed:</span>
                    <badge_1.Badge variant={getVerificationBadge(((_l = land.verification) === null || _l === void 0 ? void 0 : _l.titleDeedStatus) || "unverified")}>
                      {((_m = land.verification) === null || _m === void 0 ? void 0 : _m.titleDeedStatus) || "unverified"}
                    </badge_1.Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Survey Status:
                    </span>
                    <badge_1.Badge variant={((_o = land.verification) === null || _o === void 0 ? void 0 : _o.surveyStatus) === "completed" ?
            "default"
            : "secondary"}>
                      {((_p = land.verification) === null || _p === void 0 ? void 0 : _p.surveyStatus) || "pending"}
                    </badge_1.Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Boundary Status:
                    </span>
                    <badge_1.Badge variant={((_q = land.verification) === null || _q === void 0 ? void 0 : _q.boundaryStatus) === "clear" ?
            "default"
            : "destructive"}>
                      {((_r = land.verification) === null || _r === void 0 ? void 0 : _r.boundaryStatus) || "unmarked"}
                    </badge_1.Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Land Rights:</span>
                    <span className="font-medium capitalize">
                      {((_s = land.verification) === null || _s === void 0 ? void 0 : _s.landRights) || NOT_SPECIFIED}
                    </span>
                  </div>
                  {((_t = land.verification) === null || _t === void 0 ? void 0 : _t.registrationNumber) && (<div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Registration #:
                      </span>
                      <span className="font-medium">
                        {land.verification.registrationNumber}
                      </span>
                    </div>)}
                  {((_u = land.verification) === null || _u === void 0 ? void 0 : _u.lastSurveyDate) && (<div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Last Survey:
                      </span>
                      <span className="font-medium">
                        {(0, date_utils_1.formatDate)(land.verification.lastSurveyDate)}
                      </span>
                    </div>)}
                </div>
              </div>

              {((_v = land.verification) === null || _v === void 0 ? void 0 : _v.encumbrances) &&
            land.verification.encumbrances.length > 0 && (<div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-2">Encumbrances:</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground">
                      {land.verification.encumbrances.map(function (encumbrance, index) { return (<li key={index}>{encumbrance}</li>); })}
                    </ul>
                  </div>)}
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price & Actions */}
          <card_1.Card>
            <card_1.CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-4">
                {formatPrice(land.price)}
              </div>
              <div className="space-y-3">
                <button_1.Button type="button" className="w-full" size="lg">
                  Contact Owner
                </button_1.Button>
                <button_1.Button type="button" variant="outline" className="w-full">
                  Schedule Viewing
                </button_1.Button>
                <button_1.Button type="button" variant="outline" className="w-full">
                  Request Verification
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Trust Score */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.Shield className="h-5 w-5"/>
                Trust Score
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="text-center">
                <div className={"text-4xl font-bold ".concat(getTrustScoreColor(land.trustScore))}>
                  {land.trustScore}%
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Based on verification status, owner reputation, and community
                  feedback
                </p>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Owner Information */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.User className="h-5 w-5"/>
                Owner Information
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <div>
                <div className="font-medium">{land.owner.name}</div>
                {land.owner.verified && (<badge_1.Badge variant="default" className="mt-1">
                    <lucide_react_1.Shield className="h-3 w-3 mr-1"/>
                    Verified Owner
                  </badge_1.Badge>)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <lucide_react_1.Phone className="h-4 w-4"/>
                  <span>{land.owner.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <lucide_react_1.Mail className="h-4 w-4"/>
                  <span>{land.owner.email}</span>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Owner Trust Score:
                  </span>
                  <span className={"font-medium ".concat(getTrustScoreColor(land.owner.trustScore))}>
                    {land.owner.trustScore}%
                  </span>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Land Photo Management */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center gap-2">
                <lucide_react_1.TreePine className="w-5 h-5"/>
                Land Photo Management
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Showcase your land with high-quality photos to attract serious
                buyers
              </p>
              <button_1.Button type="button" className="w-full" onClick={function () { return navigate("/property/photos"); }}>
                <lucide_react_1.TreePine className="w-4 h-4 mr-2"/>
                Manage Land Photos
              </button_1.Button>
              <div className="text-xs text-muted-foreground text-center">
                Upload aerial views, boundary markers, and land features
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Property Details */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Property Details</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Listed:</span>
                <span>{(0, date_utils_1.formatDate)(land.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updated:</span>
                <span>{(0, date_utils_1.formatDate)(land.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property ID:</span>
                <span className="font-mono">{land.id}</span>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
