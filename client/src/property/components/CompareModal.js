"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareModal = CompareModal;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var button_1 = require("../../local/components/ui/button");
var compare_utils_1 = require("../../local/utils/compare-utils");
var contexts_1 = require("../contexts");
var ComparisonRow = react_1.default.memo(function (_a) {
    var label = _a.label, icon = _a.icon, values = _a.values;
    return (<div className="grid gap-4 py-3 border-b border-border/40 comparison-grid">
    <div className="flex items-center gap-2 text-sm font-medium">
      {icon}
      {label}
    </div>
    {values.map(function (value, index) { return (<div key={index} className="text-sm flex items-center justify-center p-2 rounded bg-gray-50">
        {value !== null && value !== void 0 ? value : "—"}
      </div>); })}
  </div>);
});
ComparisonRow.displayName = "ComparisonRow";
function CompareModal(_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose;
    var selectedProperties = (0, contexts_1.usePropertyCompare)().selectedProperties;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var modalRef = (0, react_1.useRef)(null);
    // ── Derived data (hooks must precede any early return) ──────────────────────
    var formattedData = (0, react_1.useMemo)(function () {
        if (!selectedProperties.length)
            return null;
        return {
            properties: selectedProperties,
            propertyCount: selectedProperties.length,
            propertyIds: selectedProperties.map(function (p) { return p.id; }).join(","),
        };
    }, [selectedProperties]);
    /** CSS custom property drives the comparison grid layout. */
    var gridColumnsStyle = (0, react_1.useMemo)(function () {
        var cols = formattedData && formattedData.properties.length >= 2
            ? "200px repeat(".concat(formattedData.properties.length, ", 1fr)")
            : "200px 1fr";
        return { "--grid-columns": cols };
    }, [formattedData]);
    var handleKeyDown = (0, react_1.useCallback)(function (event) {
        if (event.key === "Escape")
            onClose();
    }, [onClose]);
    var handleClose = (0, react_1.useCallback)(function (event) {
        event === null || event === void 0 ? void 0 : event.preventDefault();
        event === null || event === void 0 ? void 0 : event.stopPropagation();
        onClose();
    }, [onClose]);
    var handleViewFullComparison = (0, react_1.useCallback)(function () {
        if (!formattedData)
            return;
        navigate("/compare?properties=".concat(formattedData.propertyIds));
        onClose();
    }, [formattedData, navigate, onClose]);
    (0, react_1.useEffect)(function () {
        var _a;
        if (!isOpen)
            return;
        document.addEventListener("keydown", handleKeyDown);
        (_a = modalRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        return function () { return document.removeEventListener("keydown", handleKeyDown); };
    }, [isOpen, handleKeyDown]);
    // ── Early returns ───────────────────────────────────────────────────────────
    if (!isOpen)
        return null;
    if (!formattedData || formattedData.properties.length < 2) {
        return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="insufficient-properties-title" ref={modalRef} tabIndex={-1}>
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" role="document">
          <div className="text-center">
            <h3 id="insufficient-properties-title" className="text-lg font-semibold mb-2">
              Not Enough Properties
            </h3>
            <p className="text-gray-600 mb-4">
              You need at least 2 properties to compare. Please select more properties and try again.
            </p>
            <button_1.Button onClick={handleClose}>Close</button_1.Button>
          </div>
        </div>
      </div>);
    }
    var properties = formattedData.properties;
    // ── Render helpers ──────────────────────────────────────────────────────────
    var bedroomValues = properties.map(function (p) {
        var v = (0, compare_utils_1.getFeatureValue)(p, "bedrooms");
        return v ? String(v) : null;
    });
    var bathroomValues = properties.map(function (p) {
        var v = (0, compare_utils_1.getFeatureValue)(p, "bathrooms");
        return v ? String(v) : null;
    });
    var areaValues = properties.map(function (p) {
        var v = (0, compare_utils_1.getFeatureValue)(p, "squareFeet");
        return v ? "".concat(Number(v).toLocaleString(), " sq ft") : null;
    });
    var parkingValues = properties.map(function (p) {
        var v = (0, compare_utils_1.getFeatureValue)(p, "parkingSpaces");
        return v ? "".concat(v, " spaces") : null;
    });
    var yearValues = properties.map(function (p) {
        var v = (0, compare_utils_1.getFeatureValue)(p, "yearBuilt");
        return v ? String(v) : null;
    });
    // ── JSX ─────────────────────────────────────────────────────────────────────
    return (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="comparison-modal-title" ref={modalRef} tabIndex={-1}>
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col" role="document">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 id="comparison-modal-title" className="text-2xl font-bold">
            Property Comparison
          </h2>
          <button_1.Button variant="ghost" size="sm" onClick={handleClose} aria-label="Close comparison modal" className="hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 focus:outline-none">
            <lucide_react_1.X className="w-5 h-5"/>
          </button_1.Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto min-h-0" style={gridColumnsStyle}>
          <div className="p-6">
            {/* Property headers */}
            <div className="grid gap-4 mb-6 comparison-grid">
              <div aria-hidden="true"/>
              {properties.map(function (property) {
            var imgSrc = (0, compare_utils_1.safeGetPropertyImage)(property);
            var title = (0, compare_utils_1.getComparePropertyTitle)(property);
            return (<div key={property.id} className="text-center">
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {imgSrc ? (<img src={imgSrc} alt={title} width={300} height={200} className="w-full h-full object-cover" loading="lazy"/>) : (<div className="w-full h-full flex items-center justify-center">
                          <lucide_react_1.Home className="w-12 h-12 text-gray-400"/>
                        </div>)}
                    </div>
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">{title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {(0, compare_utils_1.formatCompareLocation)(property.location)}
                    </p>
                    {(0, compare_utils_1.getVerificationBadge)(property.verificationStatus)}
                  </div>);
        })}
            </div>

            {/* Comparison rows */}
            <div className="space-y-1" aria-label="Property comparison data">
              <ComparisonRow label="Price" icon={<lucide_react_1.DollarSign className="w-4 h-4"/>} values={properties.map(function (p) { return (0, compare_utils_1.formatComparePrice)(p.price); })}/>
              <ComparisonRow label="Location" icon={<lucide_react_1.MapPin className="w-4 h-4"/>} values={properties.map(function (p) { return (0, compare_utils_1.formatCompareLocation)(p.location); })}/>
              <ComparisonRow label="Bedrooms" icon={<lucide_react_1.Bed className="w-4 h-4"/>} values={bedroomValues}/>
              <ComparisonRow label="Bathrooms" icon={<lucide_react_1.Bath className="w-4 h-4"/>} values={bathroomValues}/>
              <ComparisonRow label="Area" icon={<lucide_react_1.Home className="w-4 h-4"/>} values={areaValues}/>
              <ComparisonRow label="Parking" icon={<lucide_react_1.Car className="w-4 h-4"/>} values={parkingValues}/>
              <ComparisonRow label="Year Built" icon={<lucide_react_1.Calendar className="w-4 h-4"/>} values={yearValues}/>
              <ComparisonRow label="Status" icon={<lucide_react_1.Shield className="w-4 h-4"/>} values={properties.map(function (p) { return (0, compare_utils_1.getVerificationBadge)(p.verificationStatus); })}/>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
          <p className="text-sm text-gray-600">
            Comparing {properties.length} properties
          </p>
          <div className="flex gap-3">
            <button_1.Button variant="outline" onClick={handleClose}>
              Close
            </button_1.Button>
            <button_1.Button onClick={handleViewFullComparison}>View Full Comparison</button_1.Button>
          </div>
        </div>
      </div>
    </div>);
}
