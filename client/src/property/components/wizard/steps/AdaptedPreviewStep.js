"use strict";
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
exports.AdaptedPreviewStep = AdaptedPreviewStep;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var badge_1 = require("../../../../local/components/ui/badge");
var card_1 = require("../../../../local/components/ui/card");
function AdaptedPreviewStep(_a) {
    var _b, _c, _d;
    var data = _a.data, onUpdate = _a.onUpdate, onValidation = _a.onValidation;
    // Preview step is always valid
    (0, react_1.useEffect)(function () {
        onValidation === null || onValidation === void 0 ? void 0 : onValidation(true);
    }, [onValidation]);
    var formatPrice = function (price) {
        return price ? "KSH ".concat(price.toLocaleString()) : "Price not set";
    };
    var formatLocation = function () {
        var _a = data.location, address = _a.address, city = _a.city, county = _a.county, state = _a.state;
        var parts = [address, city, county || state].filter(Boolean);
        return parts.join(", ") || "Location not set";
    };
    var getFeatures = function () {
        var features = data.features || [];
        var amenities = data.amenities || [];
        // Combine and deduplicate
        var allFeatures = __spreadArray([], new Set(__spreadArray(__spreadArray([], features, true), amenities, true)), true);
        return allFeatures;
    };
    return (<div className="space-y-6">
      <div className="text-center">
        <lucide_react_1.CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4"/>
        <h3 className="text-2xl font-bold mb-2">Review Your Listing</h3>
        <p className="text-muted-foreground">
          Please review all information before submitting your property listing.
        </p>
      </div>

      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Property Summary</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Basic Information</h4>
              <p className="text-sm text-muted-foreground">
                Title: {data.title || "Not set"}
              </p>
              <p className="text-sm text-muted-foreground">
                Type: {data.propertyType || "Not set"}
              </p>
              <p className="text-sm text-muted-foreground">
                Price: {formatPrice(data.price)}
              </p>
              <p className="text-sm text-muted-foreground">
                Size: {data.area || "Not set"}
                {data.area && typeof data.area === "number" ? " sqm" : ""}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Location</h4>
              <p className="text-sm text-muted-foreground">
                {formatLocation()}
              </p>
              {data.bedrooms && data.bathrooms && (<>
                  <p className="text-sm text-muted-foreground">
                    Bedrooms: {data.bedrooms}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bathrooms: {data.bathrooms}
                  </p>
                </>)}
            </div>
          </div>

          {data.description && (<div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {data.description}
              </p>
            </div>)}

          {getFeatures().length > 0 && (<div>
              <h4 className="font-medium mb-2">Features & Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {getFeatures().map(function (feature) { return (<badge_1.Badge key={feature} variant="secondary">
                    {feature}
                  </badge_1.Badge>); })}
              </div>
            </div>)}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Images</h4>
              <p className="text-sm text-muted-foreground">
                {(((_b = data.images) === null || _b === void 0 ? void 0 : _b.length) || 0) + (((_c = data.imageUrls) === null || _c === void 0 ? void 0 : _c.length) || 0)}{" "}
                photos uploaded
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Documents</h4>
              <p className="text-sm text-muted-foreground">
                {((_d = data.documents) === null || _d === void 0 ? void 0 : _d.length) || 0} documents uploaded
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Verification</h4>
              <p className="text-sm text-muted-foreground">
                {[data.titleDeed, data.surveyPlan, data.ownershipProof].filter(Boolean).length}{" "}
                verification documents
              </p>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Next Steps</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Your listing will be reviewed within 24 hours</li>
          <li>• You'll receive email updates on the verification status</li>
          <li>• Once approved, your property will be live on the platform</li>
        </ul>
      </div>
    </div>);
}
