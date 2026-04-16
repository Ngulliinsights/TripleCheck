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
exports.default = PropertyEdit;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../../local/components/ui/button");
var input_1 = require("../../local/components/ui/input");
var card_1 = require("../../local/components/ui/card");
var badge_1 = require("../../local/components/ui/badge");
var textarea_1 = require("../../local/components/ui/textarea");
var label_1 = require("../../local/components/ui/label");
var select_1 = require("../../local/components/ui/select");
var checkbox_1 = require("../../local/components/ui/checkbox");
var use_toast_1 = require("../../local/hooks/use-toast");
var images_1 = require("../../local/components/images");
// Mock property data
var mockProperty = {
    id: 'prop-123',
    title: 'Modern 3BR Apartment in Westlands',
    description: 'Beautiful modern apartment with stunning city views, located in the heart of Westlands. Features include modern kitchen, spacious living areas, and access to building amenities.',
    propertyType: 'apartment',
    price: 15000000,
    currency: 'KES',
    location: {
        address: '123 Westlands Road',
        city: 'Nairobi',
        county: 'Nairobi',
        country: 'Kenya'
    },
    features: {
        bedrooms: 3,
        bathrooms: 2,
        area: 1200,
        parkingSpaces: 1,
        yearBuilt: 2020
    },
    amenities: ['parking', 'security', 'gym', 'pool', 'wifi'],
    images: [
        {
            id: 'img-1',
            url: '/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg',
            alt: 'Living room view',
            isPrimary: true
        },
        {
            id: 'img-2',
            url: '/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg',
            alt: 'Kitchen view',
            isPrimary: false
        }
    ],
    status: 'active',
    verificationStatus: 'verified',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    ownerId: 'user-123'
};
var propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'land', label: 'Land' },
    { value: 'commercial', label: 'Commercial' }
];
var availableAmenities = [
    { id: 'parking', label: 'Parking' },
    { id: 'security', label: '24/7 Security' },
    { id: 'gym', label: 'Gym/Fitness Center' },
    { id: 'pool', label: 'Swimming Pool' },
    { id: 'wifi', label: 'WiFi' },
    { id: 'garden', label: 'Garden' },
    { id: 'balcony', label: 'Balcony/Terrace' },
    { id: 'furnished', label: 'Furnished' },
    { id: 'elevator', label: 'Elevator' },
    { id: 'backup-power', label: 'Backup Power' }
];
var statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'sold', label: 'Sold', color: 'bg-blue-100 text-blue-800' },
    { value: 'rented', label: 'Rented', color: 'bg-purple-100 text-purple-800' }
];
function PropertyEdit() {
    var _this = this;
    var id = (0, react_router_dom_1.useParams)().id;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)(mockProperty), property = _a[0], setProperty = _a[1];
    var _b = (0, react_1.useState)(false), isLoading = _b[0], setIsLoading = _b[1];
    var _c = (0, react_1.useState)(false), isSaving = _c[0], setIsSaving = _c[1];
    var _d = (0, react_1.useState)(false), hasChanges = _d[0], setHasChanges = _d[1];
    // Load property data
    (0, react_1.useEffect)(function () {
        if (id) {
            setIsLoading(true);
            // Simulate API call
            setTimeout(function () {
                setProperty(mockProperty);
                setIsLoading(false);
            }, 1000);
        }
    }, [id]);
    var updateProperty = (0, react_1.useCallback)(function (key, value) {
        setProperty(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
        setHasChanges(true);
    }, []);
    var updateNestedProperty = (0, react_1.useCallback)(function (parentKey, childKey, value) {
        setProperty(function (prev) {
            var _a, _b;
            return (__assign(__assign({}, prev), (_a = {}, _a[parentKey] = __assign(__assign({}, prev[parentKey]), (_b = {}, _b[childKey] = value, _b)), _a)));
        });
        setHasChanges(true);
    }, []);
    var toggleAmenity = (0, react_1.useCallback)(function (amenityId) {
        setProperty(function (prev) { return (__assign(__assign({}, prev), { amenities: prev.amenities.includes(amenityId)
                ? prev.amenities.filter(function (id) { return id !== amenityId; })
                : __spreadArray(__spreadArray([], prev.amenities, true), [amenityId], false) })); });
        setHasChanges(true);
    }, []);
    var handleSave = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsSaving(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 2:
                    // Simulate API call
                    _a.sent();
                    setHasChanges(false);
                    toast({
                        title: 'Property updated successfully',
                        description: 'Your changes have been saved.',
                    });
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: 'Failed to save changes',
                        description: 'Please try again later.',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setIsSaving(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [toast]);
    var handlePreview = (0, react_1.useCallback)(function () {
        // Open property in new tab for preview
        window.open("/property/".concat(property.id), '_blank');
    }, [property.id]);
    var handleBack = (0, react_1.useCallback)(function () {
        if (hasChanges) {
            var confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
            if (!confirmed)
                return;
        }
        navigate(-1);
    }, [hasChanges, navigate]);
    var getStatusBadge = function (status) {
        var statusConfig = statusOptions.find(function (s) { return s.value === status; });
        return statusConfig ? (<badge_1.Badge className={statusConfig.color}>{statusConfig.label}</badge_1.Badge>) : null;
    };
    var getVerificationIcon = function (status) {
        switch (status) {
            case 'verified':
                return <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>;
            case 'pending':
                return <lucide_react_1.Clock className="w-4 h-4 text-yellow-500"/>;
            case 'flagged':
                return <lucide_react_1.AlertCircle className="w-4 h-4 text-red-500"/>;
            default:
                return <lucide_react_1.AlertCircle className="w-4 h-4 text-gray-500"/>;
        }
    };
    if (isLoading) {
        return (<div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property...</p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button_1.Button variant="ghost" size="sm" onClick={handleBack}>
                <lucide_react_1.ArrowLeft className="w-4 h-4 mr-2"/>
                Back
              </button_1.Button>
              <div>
                <h1 className="text-xl font-semibold">Edit Property</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>ID: {property.id}</span>
                  {getStatusBadge(property.status)}
                  <div className="flex items-center gap-1">
                    {getVerificationIcon(property.verificationStatus)}
                    <span className="capitalize">{property.verificationStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button_1.Button variant="outline" onClick={handlePreview}>
                <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
                Preview
              </button_1.Button>
              <button_1.Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                <lucide_react_1.Save className="w-4 h-4 mr-2"/>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button_1.Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Home className="w-5 h-5"/>
                  Basic Information
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div>
                  <label_1.Label htmlFor="title">Property Title</label_1.Label>
                  <input_1.Input id="title" value={property.title} onChange={function (e) { return updateProperty('title', e.target.value); }} placeholder="Enter property title"/>
                </div>

                <div>
                  <label_1.Label htmlFor="description">Description</label_1.Label>
                  <textarea_1.Textarea id="description" value={property.description} onChange={function (e) { return updateProperty('description', e.target.value); }} placeholder="Describe your property" rows={4}/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label_1.Label htmlFor="property-type">Property Type</label_1.Label>
                    <select_1.Select value={property.propertyType} onValueChange={function (value) { return updateProperty('propertyType', value); }}>
                      <select_1.SelectTrigger>
                        <select_1.SelectValue />
                      </select_1.SelectTrigger>
                      <select_1.SelectContent>
                        {propertyTypes.map(function (type) { return (<select_1.SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </select_1.SelectItem>); })}
                      </select_1.SelectContent>
                    </select_1.Select>
                  </div>

                  <div>
                    <label_1.Label htmlFor="status">Status</label_1.Label>
                    <select_1.Select value={property.status} onValueChange={function (value) { return updateProperty('status', value); }}>
                      <select_1.SelectTrigger>
                        <select_1.SelectValue />
                      </select_1.SelectTrigger>
                      <select_1.SelectContent>
                        {statusOptions.map(function (status) { return (<select_1.SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </select_1.SelectItem>); })}
                      </select_1.SelectContent>
                    </select_1.Select>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Location */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.MapPin className="w-5 h-5"/>
                  Location
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div>
                  <label_1.Label htmlFor="address">Address</label_1.Label>
                  <input_1.Input id="address" value={property.location.address} onChange={function (e) { return updateNestedProperty('location', 'address', e.target.value); }} placeholder="Street address"/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label_1.Label htmlFor="city">City</label_1.Label>
                    <input_1.Input id="city" value={property.location.city} onChange={function (e) { return updateNestedProperty('location', 'city', e.target.value); }} placeholder="City"/>
                  </div>

                  <div>
                    <label_1.Label htmlFor="county">County</label_1.Label>
                    <input_1.Input id="county" value={property.location.county} onChange={function (e) { return updateNestedProperty('location', 'county', e.target.value); }} placeholder="County"/>
                  </div>

                  <div>
                    <label_1.Label htmlFor="country">Country</label_1.Label>
                    <input_1.Input id="country" value={property.location.country} onChange={function (e) { return updateNestedProperty('location', 'country', e.target.value); }} placeholder="Country"/>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Pricing */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.DollarSign className="w-5 h-5"/>
                  Pricing
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label_1.Label htmlFor="price">Price</label_1.Label>
                    <input_1.Input id="price" type="number" value={property.price} onChange={function (e) { return updateProperty('price', parseInt(e.target.value) || 0); }} placeholder="Enter price"/>
                  </div>

                  <div>
                    <label_1.Label htmlFor="currency">Currency</label_1.Label>
                    <select_1.Select value={property.currency} onValueChange={function (value) { return updateProperty('currency', value); }}>
                      <select_1.SelectTrigger>
                        <select_1.SelectValue />
                      </select_1.SelectTrigger>
                      <select_1.SelectContent>
                        <select_1.SelectItem value="KES">KES - Kenyan Shilling</select_1.SelectItem>
                        <select_1.SelectItem value="USD">USD - US Dollar</select_1.SelectItem>
                        <select_1.SelectItem value="EUR">EUR - Euro</select_1.SelectItem>
                      </select_1.SelectContent>
                    </select_1.Select>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Features */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Property Features</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label_1.Label htmlFor="bedrooms">Bedrooms</label_1.Label>
                    <input_1.Input id="bedrooms" type="number" value={property.features.bedrooms} onChange={function (e) { return updateNestedProperty('features', 'bedrooms', parseInt(e.target.value) || 0); }} min="0"/>
                  </div>

                  <div>
                    <label_1.Label htmlFor="bathrooms">Bathrooms</label_1.Label>
                    <input_1.Input id="bathrooms" type="number" value={property.features.bathrooms} onChange={function (e) { return updateNestedProperty('features', 'bathrooms', parseInt(e.target.value) || 0); }} min="0"/>
                  </div>

                  <div>
                    <label_1.Label htmlFor="area">Area (sqm)</label_1.Label>
                    <input_1.Input id="area" type="number" value={property.features.area} onChange={function (e) { return updateNestedProperty('features', 'area', parseInt(e.target.value) || 0); }} min="0"/>
                  </div>

                  <div>
                    <label_1.Label htmlFor="parking">Parking Spaces</label_1.Label>
                    <input_1.Input id="parking" type="number" value={property.features.parkingSpaces} onChange={function (e) { return updateNestedProperty('features', 'parkingSpaces', parseInt(e.target.value) || 0); }} min="0"/>
                  </div>
                </div>

                <div>
                  <label_1.Label htmlFor="year-built">Year Built (Optional)</label_1.Label>
                  <input_1.Input id="year-built" type="number" value={property.features.yearBuilt || ''} onChange={function (e) { return updateNestedProperty('features', 'yearBuilt', parseInt(e.target.value) || undefined); }} placeholder="e.g., 2020" min="1900" max={new Date().getFullYear()}/>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Amenities */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Amenities</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableAmenities.map(function (amenity) { return (<div key={amenity.id} className="flex items-center space-x-2">
                      <checkbox_1.Checkbox id={amenity.id} checked={property.amenities.includes(amenity.id)} onCheckedChange={function () { return toggleAmenity(amenity.id); }}/>
                      <label_1.Label htmlFor={amenity.id} className="text-sm">
                        {amenity.label}
                      </label_1.Label>
                    </div>); })}
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Images */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  <lucide_react_1.Image className="w-5 h-5"/>
                  Property Images
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <images_1.PropertyImageGallery images={property.images.map(function (img) { return ({
            id: img.id,
            src: img.url,
            alt: img.alt,
            category: 'property'
        }); })} onImagesChange={function (images) {
            // Update property images
            var updatedImages = images.map(function (img, index) { return ({
                id: img.id,
                url: img.src,
                alt: img.alt,
                isPrimary: index === 0
            }); });
            updateProperty('images', updatedImages);
        }} maxImages={20} allowReorder={true}/>
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Property Status */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Property Status</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status:</span>
                  {getStatusBadge(property.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification:</span>
                  <div className="flex items-center gap-1">
                    {getVerificationIcon(property.verificationStatus)}
                    <span className="text-sm capitalize">{property.verificationStatus}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Created: {new Date(property.createdAt).toLocaleDateString()}</p>
                  <p>Updated: {new Date(property.updatedAt).toLocaleDateString()}</p>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Quick Actions */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Quick Actions</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-2">
                <button_1.Button variant="outline" className="w-full justify-start" onClick={handlePreview}>
                  <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
                  Preview Property
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Upload className="w-4 h-4 mr-2"/>
                  Upload Documents
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <lucide_react_1.Trash2 className="w-4 h-4 mr-2"/>
                  Delete Property
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>

            {/* Save Changes */}
            {hasChanges && (<card_1.Card className="border-yellow-200 bg-yellow-50">
                <card_1.CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-800 mb-3">
                    <lucide_react_1.AlertCircle className="w-4 h-4"/>
                    <span className="text-sm font-medium">Unsaved Changes</span>
                  </div>
                  <p className="text-xs text-yellow-700 mb-4">
                    You have unsaved changes. Don't forget to save your work.
                  </p>
                  <button_1.Button onClick={handleSave} disabled={isSaving} className="w-full">
                    <lucide_react_1.Save className="w-4 h-4 mr-2"/>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button_1.Button>
                </card_1.CardContent>
              </card_1.Card>)}
          </div>
        </div>
      </div>
    </div>);
}
