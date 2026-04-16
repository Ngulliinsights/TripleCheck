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
exports.default = PropertyPhotosPage;
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var images_1 = require("../../local/components/images");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var use_toast_1 = require("../../local/hooks/use-toast");
var useSafeQuery_1 = require("../../local/hooks/useSafeQuery");
// Photography tips for user guidance
var PHOTO_TIPS = [
    {
        icon: <lucide_react_1.Camera className="w-5 h-5 text-blue-500"/>,
        title: "Use Natural Light",
        description: "Take photos during the day with plenty of natural light for the best results",
    },
    {
        icon: <lucide_react_1.Camera className="w-5 h-5 text-green-500"/>,
        title: "Show Space",
        description: "Capture wide angles to show the full room and make spaces appear larger",
    },
    {
        icon: <lucide_react_1.Camera className="w-5 h-5 text-yellow-500"/>,
        title: "Highlight Features",
        description: "Focus on unique selling points like views, fixtures, or architectural details",
    },
    {
        icon: <lucide_react_1.Camera className="w-5 h-5 text-purple-500"/>,
        title: "Stage the Space",
        description: "Clean, de-clutter, and arrange furniture to make rooms look inviting",
    },
];
function PropertyPhotosPage() {
    var _this = this;
    var _a = (0, react_1.useState)(""), selectedProperty = _a[0], setSelectedProperty = _a[1];
    var _b = (0, react_1.useState)([]), images = _b[0], setImages = _b[1];
    var toast = (0, use_toast_1.useToast)().toast;
    var queryClient = (0, react_query_1.useQueryClient)();
    // Fetch user's properties
    var _c = (0, useSafeQuery_1.useSafePropertiesQuery)(undefined, {
        context: "property-photos",
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    }), properties = _c.data, isLoading = _c.isLoading, error = _c.error;
    // Upload mutation for final submission
    var uploadMutation = (0, react_query_1.useMutation)({
        mutationFn: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var _propertyId = _b.propertyId, images = _b.images;
            return __generator(this, function (_c) {
                // Mock API call - replace with actual implementation
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var _a, _b;
                        // Using crypto.getRandomValues for better randomness in production
                        var randomArray = new Uint32Array(1);
                        var randomValue;
                        if ((_a = globalThis.crypto) === null || _a === void 0 ? void 0 : _a.getRandomValues) {
                            globalThis.crypto.getRandomValues(randomArray);
                            randomValue = (_b = randomArray[0]) !== null && _b !== void 0 ? _b : 0;
                        }
                        else {
                            // Fallback for environments without crypto - using a more predictable approach for testing
                            randomValue = Date.now() % 0xffffffff;
                        }
                        var shouldFail = randomValue / (0xffffffff + 1) < 0.1; // 10% failure rate for testing
                        setTimeout(function () {
                            if (shouldFail) {
                                reject(new Error("Upload failed due to network error"));
                            }
                            else {
                                resolve({
                                    success: true,
                                    uploadedImages: images,
                                });
                            }
                        }, 2000);
                    })];
            });
        }); },
        onSuccess: function (data) {
            toast({
                title: "Photos uploaded successfully",
                description: "".concat(data.uploadedImages.length, " photos have been uploaded to your property"),
            });
            queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
            setImages([]);
        },
        onError: function (error) {
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload photos. Please try again.",
                variant: "destructive",
            });
        },
    });
    // Handle final upload to property
    var handleUpload = (0, react_1.useCallback)(function () {
        if (!selectedProperty) {
            toast({
                title: "Select a property",
                description: "Please select a property to upload photos to",
                variant: "destructive",
            });
            return;
        }
        var uploadableImages = images.filter(function (img) { return img.status === "uploaded"; });
        if (uploadableImages.length === 0) {
            toast({
                title: "No photos ready",
                description: "Please wait for photos to finish uploading or add new photos",
                variant: "destructive",
            });
            return;
        }
        uploadMutation.mutate({
            propertyId: selectedProperty,
            images: uploadableImages,
        });
    }, [selectedProperty, images, uploadMutation, toast]);
    // Format location string helper
    var formatLocation = (0, react_1.useCallback)(function (location) {
        if (typeof location === 'string') {
            return location;
        }
        return "".concat(location.address, ", ").concat(location.city, ", ").concat(location.state, ", ").concat(location.country);
    }, []);
    // Convert property images to BaseImage format for ImageViewer
    var convertToBaseImages = (0, react_1.useCallback)(function (property) {
        if (!property.imageUrls || property.imageUrls.length === 0)
            return [];
        return property.imageUrls.map(function (url, index) {
            var baseImage = {
                id: "".concat(property.id, "-").concat(index),
                src: url,
                alt: "".concat(property.title, " - Image ").concat(index + 1),
            };
            // Only add caption if it has a value to satisfy exactOptionalPropertyTypes
            if (index === 0) {
                baseImage.caption = "Main photo";
            }
            return baseImage;
        });
    }, []);
    // Render property selection
    var renderPropertySelection = (0, react_1.useCallback)(function () {
        if (isLoading) {
            return (<div className="col-span-full text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading properties...</p>
        </div>);
        }
        if (error) {
            return (<div className="col-span-full text-center py-8">
          <lucide_react_1.AlertTriangle className="w-16 h-16 mx-auto text-red-500 mb-4"/>
          <h3 className="text-lg font-medium mb-2">
            Failed to load properties
          </h3>
          <p className="text-muted-foreground">
            There was an error loading your properties. Please try again.
          </p>
        </div>);
        }
        if (!properties || properties.length === 0) {
            return (<div className="col-span-full text-center py-8">
          <lucide_react_1.Image className="w-16 h-16 mx-auto text-muted-foreground mb-4"/>
          <h3 className="text-lg font-medium mb-2">No properties found</h3>
          <p className="text-muted-foreground">
            You need to list a property before you can upload photos.
          </p>
        </div>);
        }
        return (<div className="contents">
        {properties.map(function (property) {
                var _a, _b;
                // Type assertion to ensure property matches our expected interface
                var typedProperty = property;
                return (<card_1.Card key={typedProperty.id} className={"cursor-pointer transition-all hover:shadow-md ".concat(selectedProperty === typedProperty.id ?
                        "ring-2 ring-primary"
                        : "")} onClick={function () { return setSelectedProperty(String(typedProperty.id)); }}>
              <card_1.CardContent className="p-4">
                <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                  {(typedProperty.imageUrls &&
                        typedProperty.imageUrls.length > 0) ?
                        <images_1.ImageGallery images={convertToBaseImages(typedProperty)} {...images_1.IMAGE_COMPONENT_PRESETS.SIMPLE_VIEWER} className="h-full"/>
                        : <div className="w-full h-full flex items-center justify-center">
                      <lucide_react_1.Image className="w-8 h-8 text-gray-400"/>
                    </div>}
                </div>
                <h3 className="font-medium mb-1">{typedProperty.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {formatLocation(typedProperty.location)}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-primary">
                    KES {typedProperty.price.toLocaleString()}
                  </span>
                  <badge_1.Badge variant={(((_a = typedProperty.imageUrls) === null || _a === void 0 ? void 0 : _a.length) || 0) > 0 ?
                        "default"
                        : "secondary"}>
                    {((_b = typedProperty.imageUrls) === null || _b === void 0 ? void 0 : _b.length) || 0} photos
                  </badge_1.Badge>
                </div>
              </card_1.CardContent>
            </card_1.Card>);
            })}
      </div>);
    }, [
        isLoading,
        error,
        properties,
        selectedProperty,
        formatLocation,
        convertToBaseImages,
    ]);
    return (<div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Property Photo Management</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload high-quality photos to showcase your properties. Great photos
            can increase inquiries by up to 300% and help your listings stand
            out.
          </p>
        </div>

        {/* Property Selection */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Select Property</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {renderPropertySelection()}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {selectedProperty && (<card_1.Card>
            <card_1.CardHeader className="flex flex-row items-center justify-between">
              <card_1.CardTitle>Upload Photos</card_1.CardTitle>
              {images.length > 0 && (<button_1.Button onClick={handleUpload} disabled={!images.some(function (img) { return img.status === "uploaded"; }) ||
                    uploadMutation.isPending}>
                  {uploadMutation.isPending ?
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                    : <>
                      <lucide_react_1.Image className="w-4 h-4 mr-2"/>
                      Upload to Property
                    </>}
                </button_1.Button>)}
            </card_1.CardHeader>
            <card_1.CardContent>
              <images_1.PropertyImageVault maxFileSize={10 * 1024 * 1024} // 10MB
         acceptedFormats={["image/jpeg", "image/png", "image/webp"]} maxFiles={20} allowReorder={true} allowAnnotation={true} allowPrimaryFlag={true} onChange={setImages} onError={function (error) {
                toast({
                    title: "Upload Error",
                    description: error,
                    variant: "destructive",
                });
            }} defaultDocumentType="property_photo" showWorkflowProgress={true}/>
            </card_1.CardContent>
          </card_1.Card>)}

        {/* Photography Tips */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Zap className="w-5 h-5"/>
              Photography Tips
            </card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {PHOTO_TIPS.map(function (tip, index) { return (<div key={index} className="flex items-start gap-3">
                  {tip.icon}
                  <div>
                    <h3 className="font-medium mb-1">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {tip.description}
                    </p>
                  </div>
                </div>); })}
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
