"use strict";
/**
 * CompareBar Component
 *
 * A floating bottom bar that shows selected properties for comparison
 * and provides quick access to the compare page.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompareBar = CompareBar;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var compare_utils_1 = require("../../local/utils/compare-utils");
var contexts_1 = require("../contexts");
function CompareBar(_a) {
    var _b = _a === void 0 ? {} : _a, onQuickCompare = _b.onQuickCompare;
    var selectedProperties = (0, contexts_1.usePropertyCompare)().selectedProperties;
    var _c = (0, contexts_1.usePropertyCompareActions)(), removeFromCompare = _c.removeFromCompare, clearCompare = _c.clearCompare;
    var navigate = (0, react_router_dom_1.useNavigate)();
    if (selectedProperties.length === 0)
        return null;
    var canCompare = selectedProperties.length >= 2;
    var handleCompare = function () {
        if (!canCompare)
            return;
        var ids = selectedProperties.map(function (p) { return p.id; }).join(',');
        navigate("/compare?properties=".concat(ids));
    };
    return (<div className="fixed bottom-0 left-0 right-0 z-40 p-4">
      <card_1.Card className="max-w-6xl mx-auto bg-white/95 backdrop-blur-sm border shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Selected properties */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center gap-2 shrink-0">
                <lucide_react_1.ArrowLeftRight className="w-5 h-5 text-primary"/>
                <span className="font-medium text-sm whitespace-nowrap">
                  Compare ({selectedProperties.length})
                </span>
              </div>

              {/* Property thumbnails */}
              <div className="flex gap-2 overflow-x-auto max-w-xs">
                {selectedProperties.map(function (property) {
            var imgSrc = (0, compare_utils_1.safeGetPropertyImage)(property);
            var title = (0, compare_utils_1.getComparePropertyTitle)(property);
            return (<div key={property.id} className="flex-shrink-0 relative group">
                      <div className="w-16 h-12 bg-muted rounded overflow-hidden border">
                        {imgSrc ? (<img src={imgSrc} alt={title} width={64} height={48} className="w-full h-full object-cover" loading="lazy"/>) : (<div className="w-full h-full bg-muted flex items-center justify-center">
                            <lucide_react_1.Eye className="w-4 h-4 text-muted-foreground"/>
                          </div>)}
                      </div>
                      <button onClick={function () { return removeFromCompare(property.id); }} className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" aria-label={"Remove ".concat(title, " from comparison")}>
                        <lucide_react_1.X className="w-3 h-3"/>
                      </button>
                    </div>);
        })}
              </div>

              {/* Details preview — desktop only */}
              <div className="hidden md:flex gap-4 text-xs text-muted-foreground overflow-hidden">
                {selectedProperties.slice(0, 2).map(function (property) { return (<div key={property.id} className="flex flex-col min-w-0">
                    <span className="font-medium text-foreground truncate max-w-32">
                      {(0, compare_utils_1.getComparePropertyTitle)(property)}
                    </span>
                    <span>{(0, compare_utils_1.formatComparePrice)(property.price)}</span>
                  </div>); })}
                {selectedProperties.length > 2 && (<div className="flex items-center">
                    <badge_1.Badge variant="secondary">+{selectedProperties.length - 2} more</badge_1.Badge>
                  </div>)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button_1.Button variant="outline" size="sm" onClick={clearCompare} className="text-xs">
                Clear All
              </button_1.Button>
              {onQuickCompare && canCompare && (<button_1.Button variant="outline" size="sm" onClick={onQuickCompare} className="text-xs">
                  Quick Compare
                </button_1.Button>)}
              <button_1.Button size="sm" onClick={handleCompare} disabled={!canCompare} className="text-xs">
                Compare {canCompare ? "(".concat(selectedProperties.length, ")") : ""}
              </button_1.Button>
            </div>
          </div>

          {/* Helper text */}
          {selectedProperties.length === 1 && (<p className="mt-2 text-xs text-muted-foreground">
              Select one more property to start comparing
            </p>)}
        </div>
      </card_1.Card>
    </div>);
}
