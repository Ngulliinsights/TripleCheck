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
exports.ContextualSidebar = ContextualSidebar;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../ui/button");
var input_1 = require("../ui/input");
var utils_1 = require("../../lib/utils");
function ContextualSidebar(_a) {
    var sections = _a.sections, className = _a.className, _b = _a.collapsible, collapsible = _b === void 0 ? true : _b, _c = _a.defaultCollapsed, defaultCollapsed = _c === void 0 ? false : _c, _d = _a.position, position = _d === void 0 ? 'left' : _d, _e = _a.width, width = _e === void 0 ? '280px' : _e, _f = _a.searchable, searchable = _f === void 0 ? true : _f, _g = _a.filterable, filterable = _g === void 0 ? false : _g, onItemClick = _a.onItemClick;
    var _h = (0, react_1.useState)(defaultCollapsed), isCollapsed = _h[0], setIsCollapsed = _h[1];
    var _j = (0, react_1.useState)(sections
        .filter(function (section) { return section.defaultExpanded !== false; })
        .map(function (section) { return section.id; })), expandedSections = _j[0], setExpandedSections = _j[1];
    var _k = (0, react_1.useState)(''), searchQuery = _k[0], setSearchQuery = _k[1];
    var _l = (0, react_1.useState)([]), activeFilters = _l[0], setActiveFilters = _l[1];
    // Filter sections and items based on search and filters
    var filteredSections = react_1.default.useMemo(function () {
        return sections.map(function (section) { return (__assign(__assign({}, section), { items: section.items.filter(function (item) {
                var matchesSearch = !searchQuery ||
                    item.label.toLowerCase().includes(searchQuery.toLowerCase());
                var matchesFilter = activeFilters.length === 0 ||
                    activeFilters.some(function (filter) { return item.id.includes(filter); });
                return matchesSearch && matchesFilter;
            }) })); }).filter(function (section) { return section.items.length > 0; });
    }, [sections, searchQuery, activeFilters]);
    var toggleSection = function (sectionId) {
        setExpandedSections(function (prev) {
            return prev.includes(sectionId)
                ? prev.filter(function (id) { return id !== sectionId; })
                : __spreadArray(__spreadArray([], prev, true), [sectionId], false);
        });
    };
    var handleItemClick = function (item) {
        if (item.onClick) {
            item.onClick();
        }
        else if (item.href) {
            window.location.href = item.href;
        }
        if (onItemClick) {
            onItemClick(item);
        }
    };
    // Auto-collapse on mobile
    (0, react_1.useEffect)(function () {
        var handleResize = function () {
            if (window.innerWidth < 768) {
                setIsCollapsed(true);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
        return function () { return window.removeEventListener('resize', handleResize); };
    }, []);
    return (<aside className={(0, utils_1.cn)('fixed top-0 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-out z-40', position === 'left' ? 'left-0' : 'right-0', isCollapsed ? 'w-16' : "w-[".concat(width, "]"), className)} style={{
            width: isCollapsed ? '64px' : width,
            transform: isCollapsed && window.innerWidth < 768 ? 'translateX(-100%)' : 'translateX(0)'
        }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (<h2 className="font-semibold text-gray-900 truncate">
            Navigation
          </h2>)}
        
        {collapsible && (<button_1.Button variant="ghost" size="sm" onClick={function () { return setIsCollapsed(!isCollapsed); }} className="flex-shrink-0">
            {position === 'left' ? (isCollapsed ? <lucide_react_1.ChevronRight className="w-4 h-4"/> : <lucide_react_1.ChevronLeft className="w-4 h-4"/>) : (isCollapsed ? <lucide_react_1.ChevronLeft className="w-4 h-4"/> : <lucide_react_1.ChevronRight className="w-4 h-4"/>)}
          </button_1.Button>)}
      </div>

      {/* Search and Filters */}
      {!isCollapsed && (searchable || filterable) && (<div className="p-4 border-b border-gray-200 space-y-3">
          {searchable && (<div className="relative">
              <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input_1.Input type="search" placeholder="Search..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="pl-10 text-sm"/>
              {searchQuery && (<button_1.Button variant="ghost" size="sm" onClick={function () { return setSearchQuery(''); }} className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0">
                  <lucide_react_1.X className="w-3 h-3"/>
                </button_1.Button>)}
            </div>)}

          {filterable && (<div className="flex items-center space-x-2">
              <lucide_react_1.Filter className="w-4 h-4 text-gray-400"/>
              <span className="text-sm text-gray-600">Filters</span>
              {activeFilters.length > 0 && (<span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                  {activeFilters.length}
                </span>)}
            </div>)}
        </div>)}

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2">
          {filteredSections.map(function (section) { return (<div key={section.id} className="mb-4">
              {/* Section Header */}
              {!isCollapsed && (<div className={(0, utils_1.cn)('flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide', section.collapsible !== false && 'cursor-pointer hover:text-gray-700')} onClick={function () { return section.collapsible !== false && toggleSection(section.id); }}>
                  <div className="flex items-center space-x-2">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                  {section.collapsible !== false && (<lucide_react_1.ChevronRight className={(0, utils_1.cn)('w-3 h-3 transition-transform duration-200', expandedSections.includes(section.id) && 'rotate-90')}/>)}
                </div>)}

              {/* Section Items */}
              <div className={(0, utils_1.cn)('space-y-1', !isCollapsed && section.collapsible !== false && !expandedSections.includes(section.id) && 'hidden')}>
                {section.items.map(function (item) { return (<SidebarItemComponent key={item.id} item={item} isCollapsed={isCollapsed} onClick={function () { return handleItemClick(item); }}/>); })}
              </div>
            </div>); })}
        </nav>
      </div>

      {/* Footer */}
      {!isCollapsed && (<div className="border-t border-gray-200 p-4">
          <div className="text-xs text-gray-500 text-center">
            {filteredSections.reduce(function (acc, section) { return acc + section.items.length; }, 0)} items
          </div>
        </div>)}
    </aside>);
}
// Individual sidebar item component
function SidebarItemComponent(_a) {
    var item = _a.item, isCollapsed = _a.isCollapsed, onClick = _a.onClick, _b = _a.level, level = _b === void 0 ? 0 : _b;
    var _c = (0, react_1.useState)(false), isExpanded = _c[0], setIsExpanded = _c[1];
    var hasChildren = item.children && item.children.length > 0;
    return (<div>
      <button onClick={function () {
            if (hasChildren) {
                setIsExpanded(!isExpanded);
            }
            else {
                onClick();
            }
        }} className={(0, utils_1.cn)('w-full flex items-center justify-between px-3 py-2 text-sm text-left rounded-md transition-all duration-150', 'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/20', item.isActive && 'bg-primary/10 text-primary font-medium', isCollapsed && 'justify-center px-2')} style={{ paddingLeft: isCollapsed ? undefined : "".concat(12 + level * 16, "px") }} title={isCollapsed ? item.label : undefined}>
        <div className="flex items-center space-x-3 min-w-0">
          {item.icon && (<span className="flex-shrink-0 w-4 h-4">
              {item.icon}
            </span>)}
          {!isCollapsed && (<span className="truncate">{item.label}</span>)}
        </div>

        {!isCollapsed && (<div className="flex items-center space-x-2">
            {item.badge && (<span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                {item.badge}
              </span>)}
            {hasChildren && (<lucide_react_1.ChevronRight className={(0, utils_1.cn)('w-3 h-3 transition-transform duration-200', isExpanded && 'rotate-90')}/>)}
          </div>)}
      </button>

      {/* Child Items */}
      {hasChildren && isExpanded && !isCollapsed && (<div className="mt-1">
          {item.children.map(function (child) { return (<SidebarItemComponent key={child.id} item={child} isCollapsed={isCollapsed} onClick={onClick} level={level + 1}/>); })}
        </div>)}
    </div>);
}
