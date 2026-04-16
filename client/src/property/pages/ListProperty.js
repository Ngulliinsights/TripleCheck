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
exports.default = ListPropertyPage;
var useOptimisticMutation_1 = require("../../local/hooks/useOptimisticMutation");
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var queryClient_1 = require("../../infrastructure/api/queryClient");
var images_1 = require("../../local/components/images");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var label_1 = require("../../local/components/ui/label");
var select_1 = require("../../local/components/ui/select");
var tabs_1 = require("../../local/components/ui/tabs");
var textarea_1 = require("../../local/components/ui/textarea");
var use_toast_1 = require("../../local/hooks/use-toast");
var propertyImages_1 = require("../utils/propertyImages");
/* =========================================================================
   CONSTANTS & CONFIG
   ========================================================================= */
var STEPS = [
    { id: 1, label: "Basic Details", icon: lucide_react_1.Home },
    { id: 2, label: "Features", icon: lucide_react_1.Building },
    { id: 3, label: "Location", icon: lucide_react_1.Map },
    { id: 4, label: "Photos & Documents", icon: lucide_react_1.Upload },
];
var API_PROPERTIES_ENDPOINT = "/api/properties";
var TEXT_RED_500_CLASS = "text-red-500";
var BORDER_RED_200_CLASS = "border-red-200";
var DOCUMENT_FORMAT_TEXT = "PDF, JPG, PNG (max 5MB)";
var INITIAL_PROPERTY_DATA = {
    title: "",
    type: "apartment",
    price: "",
    beds: "",
    baths: "",
    area: "",
    location: "",
    description: "",
    ownershipStatus: "freehold",
    selectedImages: [],
};
/* -------------------------------------------------------------------------
   Sidebar data
   ------------------------------------------------------------------------- */
var LISTING_BENEFITS = [
    {
        id: "verified-buyers",
        text: "Access to verified buyers and tenants with proven trust scores",
    },
    {
        id: "blockchain-verified",
        text: "Blockchain-verified listing that increases buyer confidence",
    },
    {
        id: "priority-placement",
        text: "Priority placement in search results with verification badge",
    },
    {
        id: "build-reputation",
        text: "Build your reputation with a transparent track record",
    },
    {
        id: "reduced-time",
        text: "Reduced time to close deals through trusted platform",
    },
];
var LISTING_PACKAGES = [
    {
        id: "standard",
        name: "Standard Listing",
        price: "KES 2,500",
        period: "30-day listing period",
        features: [
            { id: "period", feature: "30-day listing period" },
            { id: "badge", feature: "Basic verification badge" },
            { id: "photos", feature: "Up to 10 photos" },
            { id: "placement", feature: "Standard search placement" },
        ],
    },
    {
        id: "premium",
        name: "Premium Listing",
        price: "KES 7,500",
        period: "90-day listing period",
        badge: "Best Value",
        isPopular: true,
        features: [
            { id: "period", feature: "90-day listing period" },
            { id: "badge", feature: "Premium verification badge" },
            { id: "photos", feature: "Unlimited photos + virtual tour" },
            { id: "featured", feature: "Featured in homepage carousel" },
            { id: "social", feature: "Social media promotion" },
            { id: "support", feature: "Priority customer support" },
        ],
    },
];
/* =========================================================================
   MAIN PAGE COMPONENT
   ========================================================================= */
function ListPropertyPage() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    var queryClient = (0, react_query_1.useQueryClient)();
    var _a = (0, react_1.useState)(1), currentStep = _a[0], setCurrentStep = _a[1];
    var _b = (0, react_1.useState)(INITIAL_PROPERTY_DATA), propertyData = _b[0], setPropertyData = _b[1];
    /* ---------------------------------------------------------------------
       Helper Components (defined inside main component)
       --------------------------------------------------------------------- */
    var BenefitsList = function (_a) {
        var benefits = _a.benefits;
        return (<div className="space-y-4" role="list">
      {benefits.map(function (benefit) { return (<div key={benefit.id} className="flex items-start" role="listitem">
          <lucide_react_1.Check className="text-green-500 h-5 w-5 mr-3 flex-shrink-0 mt-0.5" aria-hidden="true"/>
          <span className="text-sm text-gray-700">{benefit.text}</span>
        </div>); })}
    </div>);
    };
    var PackageCard = function (_a) {
        var pkg = _a.package, _b = _a.isActive, _isActive = _b === void 0 ? false : _b;
        var cardClasses = pkg.isPopular ?
            "bg-blue-50 p-4 rounded-lg border border-blue-200"
            : "bg-gray-50 p-4 rounded-lg border";
        var titleClasses = pkg.isPopular ?
            "font-semibold text-[#2C5282]"
            : "font-semibold text-gray-900";
        var priceClasses = pkg.isPopular ?
            "text-2xl font-bold mt-1 text-[#2C5282]"
            : "text-2xl font-bold mt-1 text-gray-900";
        return (<div className={cardClasses}>
        <div className="text-center mb-3">
          <h4 className={titleClasses}>{pkg.name}</h4>
          <div className={priceClasses}>{pkg.price}</div>
          {pkg.badge && (<div className="text-xs text-blue-600 bg-blue-100 inline-block px-2 py-1 rounded mt-1">
              {pkg.badge}
            </div>)}
        </div>
        <div className="space-y-2" role="list">
          {pkg.features.map(function (feature) { return (<div key={feature.id} className="flex items-center text-sm" role="listitem">
              <lucide_react_1.Check className="text-green-500 h-4 w-4 mr-2 flex-shrink-0" aria-hidden="true"/>
              <span>{feature.feature}</span>
            </div>); })}
        </div>
      </div>);
    };
    var PropertyListingSidebar = function () { return (<div className="space-y-6">
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="text-lg">Why List With Us?</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <BenefitsList benefits={LISTING_BENEFITS}/>
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <lucide_react_1.Info className="text-[#2C5282] h-5 w-5 mr-3 flex-shrink-0 mt-0.5" aria-hidden="true"/>
              <div>
                <h4 className="font-medium text-[#2C5282] mb-1">
                  Verification Process
                </h4>
                <p className="text-sm text-gray-700">
                  All listings undergo rigorous verification, including document
                  authentication and ownership validation. This typically takes
                  24-48 hours and ensures buyer confidence.
                </p>
              </div>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="text-lg">Listing Packages</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent>
          <tabs_1.Tabs defaultValue="standard" className="w-full">
            <tabs_1.TabsList className="grid w-full grid-cols-2">
              <tabs_1.TabsTrigger value="standard">Standard</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="premium">Premium</tabs_1.TabsTrigger>
            </tabs_1.TabsList>
            {LISTING_PACKAGES.map(function (pkg) { return (<tabs_1.TabsContent key={pkg.id} value={pkg.id} className="mt-4">
                <PackageCard package={pkg}/>
              </tabs_1.TabsContent>); })}
          </tabs_1.Tabs>
        </card_1.CardContent>
      </card_1.Card>
    </div>); };
    /* ---------------------------------------------------------------------
       Event handlers
       --------------------------------------------------------------------- */
    var handleInputChange = (0, react_1.useCallback)(function (e) {
        var _a = e.target, name = _a.name, value = _a.value;
        setPropertyData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
    }, []);
    var handleSelectChange = (0, react_1.useCallback)(function (name, value) {
        setPropertyData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[name] = value, _a)));
        });
    }, []);
    var handleImagesChange = (0, react_1.useCallback)(function (images) {
        setPropertyData(function (prev) { return (__assign(__assign({}, prev), { selectedImages: images })); });
    }, []);
    var validateStep1 = (0, react_1.useCallback)(function () {
        var missingFields = [];
        if (!propertyData.title.trim())
            missingFields.push("Property Title");
        if (!propertyData.type)
            missingFields.push("Property Type");
        if (!propertyData.price.trim())
            missingFields.push("Price");
        return missingFields;
    }, [propertyData.title, propertyData.type, propertyData.price]);
    var validateStep2 = (0, react_1.useCallback)(function () {
        var missingFields = [];
        if (!propertyData.beds.trim())
            missingFields.push("Bedrooms");
        if (!propertyData.baths.trim())
            missingFields.push("Bathrooms");
        if (!propertyData.area.trim())
            missingFields.push("Area");
        return missingFields;
    }, [propertyData.beds, propertyData.baths, propertyData.area]);
    var validateStep3 = (0, react_1.useCallback)(function () {
        var missingFields = [];
        if (!propertyData.location.trim())
            missingFields.push("Location");
        if (!propertyData.description.trim())
            missingFields.push("Description");
        return missingFields;
    }, [propertyData.location, propertyData.description]);
    var validateCurrentStep = (0, react_1.useCallback)(function () {
        var missingFields = [];
        if (currentStep === 1)
            missingFields = validateStep1();
        else if (currentStep === 2)
            missingFields = validateStep2();
        else if (currentStep === 3)
            missingFields = validateStep3();
        return { isValid: missingFields.length === 0, missingFields: missingFields };
    }, [currentStep, validateStep1, validateStep2, validateStep3]);
    var handleStepChange = (0, react_1.useCallback)(function (step) {
        if (step < currentStep) {
            setCurrentStep(step);
            return;
        }
        var validation = validateCurrentStep();
        if (validation.isValid) {
            setCurrentStep(step);
        }
        else {
            toast({
                title: "Please complete required fields",
                description: "Missing: ".concat(validation.missingFields.join(", ")),
                variant: "destructive",
            });
        }
    }, [currentStep, validateCurrentStep, toast]);
    /* ---------------------------------------------------------------------
       Mutation
       --------------------------------------------------------------------- */
    var createPropertyMutation = (0, useOptimisticMutation_1.useOptimisticMutation)({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/, (0, queryClient_1.apiRequest)("POST", API_PROPERTIES_ENDPOINT, data)];
        }); }); },
        queryKey: [API_PROPERTIES_ENDPOINT],
        optimisticUpdate: function (oldData, variables) {
            var newProperty = __assign(__assign({ id: "temp-".concat(Date.now()) }, variables), { createdAt: new Date().toISOString(), status: "pending" });
            return Array.isArray(oldData) ? __spreadArray(__spreadArray([], oldData, true), [newProperty], false) : [newProperty];
        },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: [API_PROPERTIES_ENDPOINT] });
            toast({
                title: "Property submitted successfully",
                description: "Your property listing is now pending verification.",
            });
            setPropertyData(INITIAL_PROPERTY_DATA);
            setCurrentStep(1);
        },
        onError: function (error) {
            return toast({
                title: "Failed to submit property",
                description: error.message || "Please check your connection and try again.",
                variant: "destructive",
            });
        },
    });
    /* ---------------------------------------------------------------------
       Submission
       --------------------------------------------------------------------- */
    var handleSubmit = (0, react_1.useCallback)(function (e) { return __awaiter(_this, void 0, void 0, function () {
        var validation, numericValues, formattedData;
        return __generator(this, function (_a) {
            e.preventDefault();
            validation = validateCurrentStep();
            if (!validation.isValid) {
                toast({
                    title: "Missing required information",
                    description: "Please complete: ".concat(validation.missingFields.join(", ")),
                    variant: "destructive",
                });
                return [2 /*return*/];
            }
            numericValues = {
                price: parseInt(propertyData.price, 10),
                beds: parseInt(propertyData.beds, 10),
                baths: parseInt(propertyData.baths, 10),
                area: parseInt(propertyData.area, 10),
            };
            if (isNaN(numericValues.price) || numericValues.price <= 0) {
                toast({
                    title: "Invalid price",
                    description: "Please enter a valid price amount.",
                    variant: "destructive",
                });
                return [2 /*return*/];
            }
            if (isNaN(numericValues.beds) ||
                numericValues.beds < 0 ||
                isNaN(numericValues.baths) ||
                numericValues.baths < 0 ||
                isNaN(numericValues.area) ||
                numericValues.area <= 0) {
                toast({
                    title: "Invalid property features",
                    description: "Please enter valid numbers for bedrooms, bathrooms, and area.",
                    variant: "destructive",
                });
                return [2 /*return*/];
            }
            formattedData = {
                ownerId: 1, // Note: Using placeholder ID - integrate with auth system
                title: propertyData.title.trim(),
                description: propertyData.description.trim(),
                location: propertyData.location.trim(),
                price: numericValues.price,
                imageUrls: (0, propertyImages_1.imagesToUrls)(propertyData.selectedImages),
                features: {
                    bedrooms: numericValues.beds,
                    bathrooms: numericValues.baths,
                    squareFeet: numericValues.area,
                    parkingSpaces: 1,
                    yearBuilt: new Date().getFullYear(),
                    amenities: [],
                },
            };
            createPropertyMutation.mutate(formattedData);
            return [2 /*return*/];
        });
    }); }, [propertyData, validateCurrentStep, toast, createPropertyMutation]);
    var handleNextStep = (0, react_1.useCallback)(function () {
        var validation = validateCurrentStep();
        if (validation.isValid && currentStep < 4)
            setCurrentStep(currentStep + 1);
        else if (!validation.isValid)
            toast({
                title: "Complete required fields",
                description: "Missing: ".concat(validation.missingFields.join(", ")),
                variant: "destructive",
            });
    }, [currentStep, validateCurrentStep, toast]);
    var handlePreviousStep = (0, react_1.useCallback)(function () {
        if (currentStep > 1)
            setCurrentStep(currentStep - 1);
    }, [currentStep]);
    /* ---------------------------------------------------------------------
       Render
       --------------------------------------------------------------------- */
    return (<div className="bg-background min-h-screen navbar-offset">
      <div className="container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-primary">
            List Your Property
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Add your property to our trusted platform and reach verified buyers
            and tenants. All listings undergo our verification process to
            maintain trust in our ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main form area */}
          <div className="lg:col-span-2">
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Property Information</card_1.CardTitle>
                <div className="text-sm text-gray-500">
                  Step {currentStep} of {STEPS.length}
                </div>
              </card_1.CardHeader>

              <card_1.CardContent>
                <nav className="flex mb-6 border-b">
                  {STEPS.map(function (_a) {
            var id = _a.id, label = _a.label, Icon = _a.icon;
            return (<button key={id} type="button" className={"flex items-center px-4 py-2 transition-colors duration-200 ".concat(currentStep === id ?
                    "text-[#2C5282] border-b-2 border-[#2C5282] bg-blue-50"
                    : "text-gray-500 hover:text-gray-700")} onClick={function () { return handleStepChange(id); }} aria-current={currentStep === id ? "step" : undefined}>
                      <Icon className="mr-2 h-4 w-4"/>
                      <span className="text-sm font-medium">{label}</span>
                    </button>);
        })}
                </nav>

                <form onSubmit={handleSubmit} noValidate>
                  {/* ===== ENHANCED STEP 1: BASIC DETAILS ===== */}
                  {currentStep === 1 && (<div className="space-y-8">
                      {/* Section Header */}
                      <div className="border-b border-gray-100 pb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Basic Property Information
                        </h3>
                        <p className="text-sm text-gray-600">
                          Tell us about your property&apos;s key details
                        </p>
                      </div>

                      <div className="space-y-6">
                        <label_1.Label htmlFor="title" className="text-sm font-semibold text-gray-800 block mb-3">
                          Property Title{" "}
                          <span className="text-red-500 font-normal">*</span>
                        </label_1.Label>
                        <input_1.Input id="title" name="title" value={propertyData.title} onChange={handleInputChange} placeholder="e.g., Modern 3BR Apartment in Kileleshwa with Garden View" className={"h-12 text-base border-2 transition-all duration-200 ".concat(!propertyData.title.trim() ?
                "border-red-200 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-primary focus:ring-primary/20")} required aria-describedby="title-help"/>
                        <p id="title-help" className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          💡 <strong>Tip:</strong> Include key features like
                          number of bedrooms, location, and unique selling
                          points
                        </p>
                      </div>

                      <div className="space-y-6">
                        <label_1.Label htmlFor="type" className="text-sm font-semibold text-gray-800 block mb-3">
                          Property Type{" "}
                          <span className="text-red-500 font-normal">*</span>
                        </label_1.Label>
                        <select_1.Select value={propertyData.type} onValueChange={function (value) {
                return handleSelectChange("type", value);
            }}>
                          <select_1.SelectTrigger className="h-12 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200">
                            <select_1.SelectValue placeholder="Choose your property type"/>
                          </select_1.SelectTrigger>
                          <select_1.SelectContent>
                            <select_1.SelectItem value="apartment" className="py-3">
                              <div className="flex items-center space-x-2">
                                <span>🏢</span>
                                <span>Apartment</span>
                              </div>
                            </select_1.SelectItem>
                            <select_1.SelectItem value="house" className="py-3">
                              <div className="flex items-center space-x-2">
                                <span>🏠</span>
                                <span>House</span>
                              </div>
                            </select_1.SelectItem>
                            <select_1.SelectItem value="villa" className="py-3">
                              <div className="flex items-center space-x-2">
                                <span>🏡</span>
                                <span>Villa</span>
                              </div>
                            </select_1.SelectItem>
                            <select_1.SelectItem value="townhouse" className="py-3">
                              <div className="flex items-center space-x-2">
                                <span>🏘️</span>
                                <span>Townhouse</span>
                              </div>
                            </select_1.SelectItem>
                            <select_1.SelectItem value="land" className="py-3">
                              <div className="flex items-center space-x-2">
                                <span>🌍</span>
                                <span>Land</span>
                              </div>
                            </select_1.SelectItem>
                            <select_1.SelectItem value="commercial" className="py-3">
                              <div className="flex items-center space-x-2">
                                <span>🏢</span>
                                <span>Commercial</span>
                              </div>
                            </select_1.SelectItem>
                          </select_1.SelectContent>
                        </select_1.Select>
                      </div>

                      <div className="space-y-6">
                        <label_1.Label htmlFor="price" className="text-sm font-semibold text-gray-800 block mb-3">
                          Price (KES){" "}
                          <span className="text-red-500 font-normal">*</span>
                        </label_1.Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                            KES
                          </span>
                          <input_1.Input id="price" name="price" type="number" value={propertyData.price} onChange={handleInputChange} placeholder="5,000,000" min="0" step="1000" className={"h-12 text-base pl-12 border-2 transition-all duration-200 ".concat(!propertyData.price.trim() ?
                "border-red-200 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-primary focus:ring-primary/20")} required/>
                        </div>
                        <div className="text-sm text-gray-600 bg-green-50 p-3 rounded-lg border-l-4 border-green-400">
                          💰 <strong>Market Value:</strong>{" "}
                          {propertyData.price ?
                "~$".concat(Math.round(parseInt(propertyData.price) / 130).toLocaleString(), " USD")
                : "Enter price to see USD equivalent"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label_1.Label htmlFor="ownershipStatus" className="text-sm font-medium">
                          Ownership Status{" "}
                          <span className={TEXT_RED_500_CLASS}>*</span>
                        </label_1.Label>
                        <select_1.Select value={propertyData.ownershipStatus} onValueChange={function (value) {
                return handleSelectChange("ownershipStatus", value);
            }}>
                          <select_1.SelectTrigger>
                            <select_1.SelectValue placeholder="Select ownership status"/>
                          </select_1.SelectTrigger>
                          <select_1.SelectContent>
                            <select_1.SelectItem value="freehold">Freehold</select_1.SelectItem>
                            <select_1.SelectItem value="leasehold">Leasehold</select_1.SelectItem>
                            <select_1.SelectItem value="sharehold">Sharehold</select_1.SelectItem>
                          </select_1.SelectContent>
                        </select_1.Select>
                      </div>
                    </div>)}

                  {/* ===== STEP 2: FEATURES ===== */}
                  {currentStep === 2 && (<div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label_1.Label htmlFor="beds" className="text-sm font-medium">
                            Bedrooms{" "}
                            <span className={TEXT_RED_500_CLASS}>*</span>
                          </label_1.Label>
                          <input_1.Input id="beds" name="beds" type="number" value={propertyData.beds} onChange={handleInputChange} min="0" max="20" className={!propertyData.beds.trim() ?
                BORDER_RED_200_CLASS
                : ""} required/>
                        </div>
                        <div className="space-y-2">
                          <label_1.Label htmlFor="baths" className="text-sm font-medium">
                            Bathrooms{" "}
                            <span className={TEXT_RED_500_CLASS}>*</span>
                          </label_1.Label>
                          <input_1.Input id="baths" name="baths" type="number" value={propertyData.baths} onChange={handleInputChange} min="0" max="20" className={!propertyData.baths.trim() ?
                BORDER_RED_200_CLASS
                : ""} required/>
                        </div>
                        <div className="space-y-2">
                          <label_1.Label htmlFor="area" className="text-sm font-medium">
                            Area (sq. ft){" "}
                            <span className={TEXT_RED_500_CLASS}>*</span>
                          </label_1.Label>
                          <input_1.Input id="area" name="area" type="number" value={propertyData.area} onChange={handleInputChange} min="1" step="1" className={!propertyData.area.trim() ?
                BORDER_RED_200_CLASS
                : ""} required/>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label_1.Label className="text-sm font-medium">Amenities</label_1.Label>
                        <p className="text-xs text-gray-500">
                          Select all amenities available in your property
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {[
                { id: "swimming-pool", label: "Swimming Pool" },
                { id: "gym", label: "Gym" },
                { id: "security", label: "24/7 Security" },
                { id: "parking", label: "Parking" },
                { id: "balcony", label: "Balcony" },
                { id: "garden", label: "Garden" },
                { id: "elevator", label: "Elevator" },
                { id: "backup-power", label: "Backup Power" },
                { id: "water-backup", label: "Water Backup" },
            ].map(function (_a) {
                var id = _a.id, label = _a.label;
                return (<div key={id} className="flex items-center space-x-2">
                              <input type="checkbox" id={id} className="rounded border-gray-300 text-[#2C5282] focus:ring-[#2C5282]" aria-label={label}/>
                              <label_1.Label htmlFor={id} className="text-sm">
                                {label}
                              </label_1.Label>
                            </div>);
            })}
                        </div>
                      </div>
                    </div>)}

                  {/* ===== STEP 3: LOCATION ===== */}
                  {currentStep === 3 && (<div className="space-y-6">
                      <div className="space-y-2">
                        <label_1.Label htmlFor="location" className="text-sm font-medium">
                          Address/Location{" "}
                          <span className={TEXT_RED_500_CLASS}>*</span>
                        </label_1.Label>
                        <input_1.Input id="location" name="location" value={propertyData.location} onChange={handleInputChange} placeholder="e.g., Kileleshwa, Nairobi" className={!propertyData.location.trim() ?
                BORDER_RED_200_CLASS
                : ""} required/>
                        <p className="text-xs text-gray-500">
                          Include neighborhood, estate name, and city for better
                          visibility
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label_1.Label htmlFor="description" className="text-sm font-medium">
                          Property Description{" "}
                          <span className={TEXT_RED_500_CLASS}>*</span>
                        </label_1.Label>
                        <textarea_1.Textarea id="description" name="description" value={propertyData.description} onChange={handleInputChange} placeholder="Provide a detailed description of your property, including unique features, nearby amenities, and what makes it special..." rows={6} className={"".concat(!propertyData.description.trim() ? BORDER_RED_200_CLASS : "", " resize-none")} maxLength={1000} required/>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>
                            Be detailed and highlight unique selling points
                          </span>
                          <span>{propertyData.description.length}/1000</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label_1.Label className="text-sm font-medium">
                          Property Location
                        </label_1.Label>
                        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <lucide_react_1.Map className="h-12 w-12 mx-auto text-gray-400 mb-3"/>
                            <p className="text-gray-500 font-medium mb-2">
                              Interactive map coming soon
                            </p>
                            <p className="text-sm text-gray-400 mb-4">
                              Pin your exact property location for better
                              visibility
                            </p>
                            <button_1.Button type="button" variant="outline" size="sm">
                              <lucide_react_1.Map className="h-4 w-4 mr-2"/>
                              Set Location on Map
                            </button_1.Button>
                          </div>
                        </div>
                      </div>
                    </div>)}

                  {/* ===== STEP 4: DOCUMENTS ===== */}
                  {currentStep === 4 && (<div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Required Documents
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                          Upload the following documents to verify your property
                          ownership. All documents are encrypted and securely
                          stored.
                        </p>

                        <div className="space-y-4">
                          {[
                {
                    title: "Title Deed / Ownership Documents",
                    description: "Original title deed or certificate of title",
                    format: DOCUMENT_FORMAT_TEXT,
                    required: true,
                },
                {
                    title: "Land Rate Receipt",
                    description: "Recent land rates payment receipt",
                    format: DOCUMENT_FORMAT_TEXT,
                    required: true,
                },
                {
                    title: "National ID / Passport",
                    description: "Government-issued identification",
                    format: DOCUMENT_FORMAT_TEXT,
                    required: true,
                },
            ].map(function (doc, index) { return (<div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center mb-1">
                                    <h4 className="font-medium text-gray-900">
                                      {doc.title}
                                    </h4>
                                    {doc.required && (<span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                        Required
                                      </span>)}
                                  </div>
                                  <p className="text-sm text-gray-600 mb-1">
                                    {doc.description}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {doc.format}
                                  </p>
                                </div>
                                <button_1.Button type="button" variant="outline" size="sm">
                                  <lucide_react_1.Upload className="h-4 w-4 mr-2"/>
                                  Upload
                                </button_1.Button>
                              </div>
                            </div>); })}
                        </div>

                        {/* Property Images Section */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-900 mb-1">
                              Property Photos
                            </h4>
                            <p className="text-sm text-gray-600">
                              Add high-quality photos to showcase your property
                            </p>
                          </div>
                          <images_1.PropertyImageGallery images={propertyData.selectedImages.map(function (img) { return ({
                id: img.id,
                src: img.url,
                alt: img.alt,
            }); })} onImageClick={function (_img, _idx) {
                // Handle image click if needed
            }} onImageUpload={function (files) {
                // Handle new image uploads
                var newImages = Array.from(files).map(function (file, index) { return ({
                    id: "upload-".concat(Date.now(), "-").concat(index),
                    url: URL.createObjectURL(file),
                    alt: file.name,
                    category: "residential",
                }); });
                handleImagesChange(__spreadArray(__spreadArray([], propertyData.selectedImages, true), newImages, true));
            }} onImageDelete={function (id) {
                var updatedImages = propertyData.selectedImages.filter(function (img) { return img.id !== id; });
                handleImagesChange(updatedImages);
            }} className="rounded-lg"/>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <input type="checkbox" id="terms" className="mt-1 rounded border-gray-300 text-[#2C5282] focus:ring-[#2C5282]" aria-label="Terms and conditions agreement" required/>
                          <div>
                            <label_1.Label htmlFor="terms" className="font-medium text-gray-900">
                              I confirm that all information is accurate and
                              complete
                            </label_1.Label>
                            <p className="text-sm text-gray-600 mt-1">
                              By submitting this listing, you confirm that all
                              information provided is accurate, you have the
                              legal right to list this property, and you agree
                              to our terms of service and privacy policy.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>)}

                  {/* ===== NAVIGATION ===== */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t">
                    {currentStep > 1 ?
            <button_1.Button type="button" variant="outline" onClick={handlePreviousStep}>
                        ← Previous
                      </button_1.Button>
            : <div />}

                    {currentStep < 4 ?
            <button_1.Button type="button" onClick={handleNextStep}>
                        Next →
                      </button_1.Button>
            : <button_1.Button type="submit" disabled={createPropertyMutation.isPending} className="flex items-center min-w-[140px]">
                        {createPropertyMutation.isPending ?
                    <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"/>
                            Submitting...
                          </>
                    : "Submit Property"}
                      </button_1.Button>}
                  </div>
                </form>
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* ===== SIDEBAR ===== */}
          <PropertyListingSidebar />
        </div>
      </div>
    </div>);
}
