"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadButton = exports.ViewButton = exports.ShareButton = exports.SaveButton = exports.ActionButton = exports.ViewAllButton = exports.ReadMoreButton = exports.RefreshButton = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("./button");
exports.RefreshButton = (0, react_1.memo)(function (_a) {
    var onClick = _a.onClick, _b = _a.isLoading, isLoading = _b === void 0 ? false : _b, label = _a.label, _c = _a.variant, variant = _c === void 0 ? "coral-outline" : _c, _d = _a.size, size = _d === void 0 ? "sm" : _d, _e = _a.className, className = _e === void 0 ? "" : _e;
    return (<button_1.Button onClick={onClick} variant={variant} size={size} disabled={isLoading} className={className}>
    <lucide_react_1.RefreshCw className={"w-4 h-4 mr-2 ".concat(isLoading ? 'animate-spin' : '')}/>
    {isLoading ? 'Refreshing...' : (label || 'Refresh')}
  </button_1.Button>);
});
exports.ReadMoreButton = (0, react_1.memo)(function (_a) {
    var onClick = _a.onClick, _b = _a.label, label = _b === void 0 ? "Read More" : _b, _c = _a.variant, variant = _c === void 0 ? "coral" : _c, _d = _a.size, size = _d === void 0 ? "sm" : _d, _e = _a.className, className = _e === void 0 ? "" : _e, _f = _a.showArrow, showArrow = _f === void 0 ? true : _f;
    return (<button_1.Button onClick={onClick} variant={variant} size={size} className={"".concat(className, " ").concat(showArrow ? 'group' : '')}>
    {label}
    {showArrow && (<lucide_react_1.ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300"/>)}
  </button_1.Button>);
});
exports.ViewAllButton = (0, react_1.memo)(function (_a) {
    var onClick = _a.onClick, _b = _a.label, label = _b === void 0 ? "View All" : _b, _c = _a.variant, variant = _c === void 0 ? "coral" : _c, _d = _a.size, size = _d === void 0 ? "lg" : _d, _e = _a.className, className = _e === void 0 ? "" : _e;
    return (<button_1.Button onClick={onClick} variant={variant} size={size} className={"px-8 py-3 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl ".concat(className)}>
    {label}
    <lucide_react_1.ArrowRight className="w-5 h-5 ml-2"/>
  </button_1.Button>);
});
exports.ActionButton = (0, react_1.memo)(function (_a) {
    var onClick = _a.onClick, Icon = _a.icon, label = _a.label, _b = _a.variant, variant = _b === void 0 ? "outline" : _b, _c = _a.size, size = _c === void 0 ? "default" : _c, _d = _a.className, className = _d === void 0 ? "" : _d;
    return (<button_1.Button onClick={onClick} variant={variant} size={size} className={"w-full ".concat(className)}>
    <Icon className="w-4 h-4 mr-2"/>
    {label}
  </button_1.Button>);
});
// Pre-configured common action buttons
exports.SaveButton = (0, react_1.memo)(function (props) { return <exports.ActionButton {...props} icon={lucide_react_1.Heart} label="Save to Favorites"/>; });
exports.ShareButton = (0, react_1.memo)(function (props) { return <exports.ActionButton {...props} icon={lucide_react_1.Share2} label="Share"/>; });
exports.ViewButton = (0, react_1.memo)(function (props) { return <exports.ActionButton {...props} icon={lucide_react_1.Eye} label="View Details"/>; });
exports.DownloadButton = (0, react_1.memo)(function (props) { return <exports.ActionButton {...props} icon={lucide_react_1.Download} label="Download"/>; });
exports.RefreshButton.displayName = "RefreshButton";
exports.ReadMoreButton.displayName = "ReadMoreButton";
exports.ViewAllButton.displayName = "ViewAllButton";
exports.ActionButton.displayName = "ActionButton";
exports.SaveButton.displayName = "SaveButton";
exports.ShareButton.displayName = "ShareButton";
exports.ViewButton.displayName = "ViewButton";
exports.DownloadButton.displayName = "DownloadButton";
