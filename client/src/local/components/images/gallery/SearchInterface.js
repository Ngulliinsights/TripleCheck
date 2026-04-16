"use strict";
/**
 * Search Interface Component
 * Provides search and filtering UI for the gallery
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchInterface = void 0;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var constants_1 = require("./constants");
exports.SearchInterface = (0, react_1.memo)(function (_a) {
    var query = _a.query, onQueryChange = _a.onQueryChange, facets = _a.facets, selectedFacets = _a.selectedFacets, onFacetToggle = _a.onFacetToggle, sortMode = _a.sortMode, onSortChange = _a.onSortChange, sortAscending = _a.sortAscending, onSortDirectionToggle = _a.onSortDirectionToggle, viewMode = _a.viewMode, onViewModeChange = _a.onViewModeChange, showFacets = _a.showFacets, onToggleFacets = _a.onToggleFacets;
    var handleClearQuery = (0, react_1.useCallback)(function () {
        onQueryChange("");
    }, [onQueryChange]);
    return (<div className="space-y-4">
        {/* Search bar and controls */}
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div className="flex-1 relative">
            <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"/>
            <input type="text" value={query} onChange={function (e) { return onQueryChange(e.target.value); }} placeholder="Search images..." className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            {query && (<button onClick={handleClearQuery} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <lucide_react_1.X className="w-5 h-5"/>
              </button>)}
          </div>

          {/* Filter toggle */}
          <button onClick={onToggleFacets} className={"px-4 py-2 rounded-lg flex items-center gap-2 ".concat(showFacets
            ? "bg-blue-500 text-white"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200")}>
            <lucide_react_1.Filter className="w-5 h-5"/>
            <span>Filters</span>
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <select value={sortMode} onChange={function (e) { return onSortChange(e.target.value); }} className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 cursor-pointer">
              {constants_1.SORT_OPTIONS.map(function (option) { return (<option key={option.value} value={option.value}>
                  {option.label}
                </option>); })}
            </select>
            <lucide_react_1.ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/>
          </div>

          {/* Sort direction */}
          <button onClick={onSortDirectionToggle} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" title={sortAscending ? "Ascending" : "Descending"}>
            {sortAscending ? "↑" : "↓"}
          </button>

          {/* View mode toggles */}
          <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
            {Object.entries(constants_1.VIEW_MODES).map(function (_a) {
            var mode = _a[0], config = _a[1];
            var Icon = config.icon;
            return (<button key={mode} onClick={function () { return onViewModeChange(mode); }} className={"p-2 rounded ".concat(viewMode === mode
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100")} title={config.label}>
                    <Icon className="w-5 h-5"/>
                  </button>);
        })}
          </div>
        </div>

        {/* Facet filters */}
        {showFacets && (<div className="bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Categories */}
            {facets.categories.size > 0 && (<FacetGroup title="Categories" items={facets.categories} selected={selectedFacets.categories} onToggle={function (value) { return onFacetToggle("categories", value); }}/>)}

            {/* Approval Status */}
            {facets.approvalStatus.size > 0 && (<FacetGroup title="Approval Status" items={facets.approvalStatus} selected={selectedFacets.approvalStatus} onToggle={function (value) { return onFacetToggle("approvalStatus", value); }}/>)}

            {/* Tags */}
            {facets.tags.size > 0 && (<FacetGroup title="Tags" items={facets.tags} selected={selectedFacets.tags} onToggle={function (value) { return onFacetToggle("tags", value); }}/>)}

            {/* Users */}
            {facets.users.size > 0 && (<FacetGroup title="Assigned To" items={facets.users} selected={selectedFacets.users} onToggle={function (value) { return onFacetToggle("users", value); }}/>)}

            {/* Collections */}
            {facets.collections.size > 0 && (<FacetGroup title="Collections" items={facets.collections} selected={selectedFacets.collections} onToggle={function (value) { return onFacetToggle("collections", value); }}/>)}
          </div>)}
      </div>);
});
exports.SearchInterface.displayName = "SearchInterface";
var FacetGroup = (0, react_1.memo)(function (_a) {
    var title = _a.title, items = _a.items, selected = _a.selected, onToggle = _a.onToggle;
    return (<div>
        <h4 className="font-medium text-sm text-gray-700 mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
          {Array.from(items.entries()).map(function (_a) {
            var value = _a[0], count = _a[1];
            var isSelected = selected.includes(value);
            return (<button key={value} onClick={function () { return onToggle(value); }} className={"px-3 py-1 rounded-full text-sm ".concat(isSelected
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100", " border border-gray-300")}>
                {value} ({count})
              </button>);
        })}
        </div>
      </div>);
});
FacetGroup.displayName = "FacetGroup";
