"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhotoManagementButton = PhotoManagementButton;
exports.EnhancedPhotoManagementButton = EnhancedPhotoManagementButton;
exports.CompactPhotoManagementButton = CompactPhotoManagementButton;
exports.LandPhotoManagementButton = LandPhotoManagementButton;
exports.ResidentialPhotoManagementButton = ResidentialPhotoManagementButton;
exports.CommercialPhotoManagementButton = CommercialPhotoManagementButton;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var badge_1 = require("../ui/badge");
var button_1 = require("../ui/button");
/**
 * Shared photo management button component
 * Provides consistent photo management functionality across all property types
 */
function PhotoManagementButton(_a) {
    var propertyId = _a.propertyId, propertyType = _a.propertyType, _b = _a.variant, variant = _b === void 0 ? "outline" : _b, _c = _a.size, size = _c === void 0 ? "default" : _c, _d = _a.className, className = _d === void 0 ? "" : _d, _e = _a.photoCount, photoCount = _e === void 0 ? 0 : _e, _f = _a.showPhotoCount, showPhotoCount = _f === void 0 ? true : _f, _g = _a.disabled, disabled = _g === void 0 ? false : _g;
    var navigate = (0, react_router_dom_1.useNavigate)();
    // Navigate to property photos page
    var handlePhotoManagement = (0, react_1.useCallback)(function () {
        if (disabled)
            return;
        // Navigate to the appropriate photo management page based on property type
        var photoPath = "/property/".concat(propertyId, "/photos");
        navigate(photoPath, {
            state: {
                propertyType: propertyType,
                propertyId: propertyId,
                returnPath: window.location.pathname,
            },
        });
    }, [propertyId, propertyType, navigate, disabled]);
    // Get appropriate icon based on photo count
    var getIcon = function () {
        if (photoCount === 0) {
            return lucide_react_1.Upload;
        }
        else if (photoCount < 5) {
            return lucide_react_1.Camera;
        }
        else {
            return lucide_react_1.Image;
        }
    };
    // Get button text based on photo count and property type
    var getButtonText = function () {
        if (photoCount === 0) {
            return "Add Photos";
        }
        else {
            return "Manage Photos";
        }
    };
    // Get variant styling based on photo status
    var getVariant = function () {
        if (photoCount === 0) {
            return "default"; // Encourage photo upload
        }
        return variant || "outline";
    };
    // Helper function to get icon size based on button size
    var getIconSize = function (buttonSize) {
        switch (buttonSize) {
            case "sm":
                return "w-3 h-3";
            case "lg":
                return "w-5 h-5";
            default:
                return "w-4 h-4";
        }
    };
    var Icon = getIcon();
    var buttonText = getButtonText();
    var buttonVariant = getVariant();
    return (<div className="flex items-center gap-2">
      <button_1.Button variant={buttonVariant} size={size} onClick={handlePhotoManagement} disabled={disabled} className={"flex items-center gap-2 ".concat(className)}>
        <Icon className={getIconSize(size)}/>
        <span>{buttonText}</span>
      </button_1.Button>

      {/* Photo count badge */}
      {showPhotoCount && photoCount > 0 && (<badge_1.Badge variant={photoCount >= 5 ? "default" : "secondary"} className="flex items-center gap-1">
          <lucide_react_1.Image className="w-3 h-3"/>
          {photoCount}
        </badge_1.Badge>)}

      {/* Photo status indicator */}
      {photoCount === 0 && (<badge_1.Badge variant="outline" className="text-muted-foreground">
          No photos
        </badge_1.Badge>)}
    </div>);
}
function EnhancedPhotoManagementButton(_a) {
    var propertyId = _a.propertyId, propertyType = _a.propertyType, _b = _a.photoCount, photoCount = _b === void 0 ? 0 : _b, _c = _a.maxPhotos, maxPhotos = _c === void 0 ? 20 : _c, _d = _a.className, className = _d === void 0 ? "" : _d;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var handlePhotoManagement = (0, react_1.useCallback)(function () {
        navigate("/property/".concat(propertyId, "/photos"), {
            state: {
                propertyType: propertyType,
                propertyId: propertyId,
                returnPath: window.location.pathname,
            },
        });
    }, [propertyId, propertyType, navigate]);
    // Calculate photo completion percentage
    var completionPercentage = Math.min((photoCount / 5) * 100, 100); // 5 photos = 100%
    var isComplete = photoCount >= 5;
    var isFull = photoCount >= maxPhotos;
    return (<div className={"space-y-2 ".concat(className)}>
      {/* Main button */}
      <button_1.Button variant={photoCount === 0 ? "default" : "outline"} onClick={handlePhotoManagement} className="w-full flex items-center gap-2" disabled={isFull}>
        {photoCount === 0 ?
            <>
            <lucide_react_1.Upload className="w-4 h-4"/>
            Add Property Photos
          </>
            : <>
            <lucide_react_1.Edit3 className="w-4 h-4"/>
            Manage Photos ({photoCount})
          </>}
      </button_1.Button>

      {/* Progress indicator */}
      {photoCount > 0 && (<div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Photo completion</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className={"h-2 rounded-full transition-all duration-300 ".concat(isComplete ? "bg-green-500" : "bg-blue-500")} style={{ width: "".concat(completionPercentage, "%") }}/>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {photoCount} of {maxPhotos} photos
            </span>
            {isComplete && (<badge_1.Badge variant="default" className="text-xs">
                Complete
              </badge_1.Badge>)}
          </div>
        </div>)}

      {/* Photo tips */}
      {photoCount < 5 && (<div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          💡 Add at least 5 high-quality photos to increase property visibility
        </div>)}
    </div>);
}
function CompactPhotoManagementButton(_a) {
    var propertyId = _a.propertyId, propertyType = _a.propertyType, _b = _a.photoCount, photoCount = _b === void 0 ? 0 : _b;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var handleClick = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        e.stopPropagation();
        navigate("/property/".concat(propertyId, "/photos"), {
            state: {
                propertyType: propertyType,
                propertyId: propertyId,
                returnPath: window.location.pathname,
            },
        });
    }, [propertyId, propertyType, navigate]);
    return (<button_1.Button variant="ghost" size="sm" onClick={handleClick} className="flex items-center gap-1 text-xs">
      {photoCount === 0 ?
            <>
          <lucide_react_1.Upload className="w-3 h-3"/>
          Add
        </>
            : <>
          <lucide_react_1.Image className="w-3 h-3"/>
          {photoCount}
        </>}
    </button_1.Button>);
}
/**
 * Property type specific photo management buttons
 */
function LandPhotoManagementButton(props) {
    return <PhotoManagementButton {...props} propertyType="land"/>;
}
function ResidentialPhotoManagementButton(props) {
    return <PhotoManagementButton {...props} propertyType="residential"/>;
}
function CommercialPhotoManagementButton(props) {
    return <PhotoManagementButton {...props} propertyType="commercial"/>;
}
// Export with display names for debugging
PhotoManagementButton.displayName = "PhotoManagementButton";
EnhancedPhotoManagementButton.displayName = "EnhancedPhotoManagementButton";
CompactPhotoManagementButton.displayName = "CompactPhotoManagementButton";
exports.default = PhotoManagementButton;
