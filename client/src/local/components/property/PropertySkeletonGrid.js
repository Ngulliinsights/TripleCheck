"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertySkeleton = exports.PropertySkeletonGrid = exports.LandPropertySkeleton = exports.CommercialPropertySkeleton = exports.ResidentialPropertySkeleton = void 0;
exports.PropertyDetailsSkeleton = PropertyDetailsSkeleton;
var react_1 = require("react");
var card_1 = require("../ui/card");
var skeleton_1 = require("../ui/skeleton");
// ---------------------------------------------------------------------------
// PropertySkeletonItem
// ---------------------------------------------------------------------------
function PropertySkeletonItem(_a) {
    var viewMode = _a.viewMode, itemHeight = _a.itemHeight;
    if (viewMode === 'list') {
        return (<card_1.Card className="overflow-hidden">
        <div className="flex">
          <div className="flex-shrink-0">
            <skeleton_1.Skeleton className="w-48 h-32"/>
          </div>
          <card_1.CardContent className="flex-1 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <skeleton_1.Skeleton className="h-5 w-48"/>
                <skeleton_1.Skeleton className="h-4 w-32"/>
              </div>
              <skeleton_1.Skeleton className="h-6 w-24"/>
            </div>
            <div className="flex items-center gap-4">
              <skeleton_1.Skeleton className="h-4 w-16"/>
              <skeleton_1.Skeleton className="h-4 w-16"/>
              <skeleton_1.Skeleton className="h-4 w-16"/>
            </div>
            <div className="space-y-2">
              <skeleton_1.Skeleton className="h-3 w-full"/>
              <skeleton_1.Skeleton className="h-3 w-3/4"/>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <skeleton_1.Skeleton className="h-8 w-20"/>
              <skeleton_1.Skeleton className="h-8 w-20"/>
              <skeleton_1.Skeleton className="h-8 w-8"/>
            </div>
          </card_1.CardContent>
        </div>
      </card_1.Card>);
    }
    return (<card_1.Card className="overflow-hidden" style={{ height: itemHeight }}>
      <div className="relative">
        <skeleton_1.Skeleton className="w-full h-48"/>
        <div className="absolute top-2 right-2">
          <skeleton_1.Skeleton className="h-6 w-16 rounded-full"/>
        </div>
        <div className="absolute bottom-2 left-2">
          <skeleton_1.Skeleton className="h-8 w-24 rounded-lg"/>
        </div>
      </div>
      <card_1.CardContent className="p-4 space-y-3">
        <skeleton_1.Skeleton className="h-5 w-full"/>
        <div className="flex items-center gap-2">
          <skeleton_1.Skeleton className="h-4 w-4"/>
          <skeleton_1.Skeleton className="h-4 w-32"/>
        </div>
        <div className="flex items-center gap-3">
          {['bed', 'bath', 'area'].map(function (key) { return (<div key={key} className="flex items-center gap-1">
              <skeleton_1.Skeleton className="h-4 w-4"/>
              <skeleton_1.Skeleton className="h-4 w-8"/>
            </div>); })}
        </div>
        <div className="flex items-center gap-2 pt-2">
          <skeleton_1.Skeleton className="h-8 flex-1"/>
          <skeleton_1.Skeleton className="h-8 w-8"/>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
// ---------------------------------------------------------------------------
// UnifiedPropertySkeletonGrid (main)
// ---------------------------------------------------------------------------
function UnifiedPropertySkeletonGrid(_a) {
    var count = _a.count, viewMode = _a.viewMode, _b = _a.itemHeight, itemHeight = _b === void 0 ? 320 : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    return (<div className={className}>
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between mb-4">
        <skeleton_1.Skeleton className="h-4 w-32"/>
        <div className="flex items-center gap-2">
          <skeleton_1.Skeleton className="h-8 w-16"/>
          <skeleton_1.Skeleton className="h-8 w-16"/>
        </div>
      </div>

      {/* Grid / list */}
      <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'}>
        {Array.from({ length: count }, function (_, i) { return (<PropertySkeletonItem key={i} viewMode={viewMode} itemHeight={itemHeight}/>); })}
      </div>
    </div>);
}
UnifiedPropertySkeletonGrid.displayName = 'PropertySkeletonGrid';
var SKELETON_HEIGHTS = {
    residential: 340,
    commercial: 360,
    land: 320,
};
function createPropertySkeleton(variant) {
    var height = SKELETON_HEIGHTS[variant];
    var displayName = "".concat(variant.charAt(0).toUpperCase()).concat(variant.slice(1), "PropertySkeleton");
    function SpecialisedSkeleton(_a) {
        var _b = _a.count, count = _b === void 0 ? 12 : _b, _c = _a.viewMode, viewMode = _c === void 0 ? 'grid' : _c;
        return (<UnifiedPropertySkeletonGrid count={count} viewMode={viewMode} itemHeight={height} className="animate-pulse"/>);
    }
    SpecialisedSkeleton.displayName = displayName;
    return SpecialisedSkeleton;
}
exports.ResidentialPropertySkeleton = createPropertySkeleton('residential');
exports.CommercialPropertySkeleton = createPropertySkeleton('commercial');
exports.LandPropertySkeleton = createPropertySkeleton('land');
// ---------------------------------------------------------------------------
// PropertyDetailsSkeleton
// ---------------------------------------------------------------------------
function PropertyDetailsSkeleton() {
    return (<div className="space-y-6 animate-pulse">
      {/* Title & meta */}
      <div className="space-y-4">
        <skeleton_1.Skeleton className="h-8 w-2/3"/>
        <div className="flex items-center gap-4">
          <skeleton_1.Skeleton className="h-5 w-32"/>
          <skeleton_1.Skeleton className="h-5 w-24"/>
          <skeleton_1.Skeleton className="h-5 w-20"/>
        </div>
      </div>

      {/* Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <skeleton_1.Skeleton className="h-96 w-full"/>
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }, function (_, i) { return (<skeleton_1.Skeleton key={i} className="h-48 w-full"/>); })}
        </div>
      </div>

      {/* Main content + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="space-y-3">
            <skeleton_1.Skeleton className="h-6 w-32"/>
            <skeleton_1.Skeleton className="h-4 w-full"/>
            <skeleton_1.Skeleton className="h-4 w-full"/>
            <skeleton_1.Skeleton className="h-4 w-3/4"/>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <skeleton_1.Skeleton className="h-6 w-24"/>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, function (_, i) { return (<div key={i} className="flex items-center gap-2">
                  <skeleton_1.Skeleton className="h-4 w-4"/>
                  <skeleton_1.Skeleton className="h-4 w-20"/>
                </div>); })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <card_1.Card className="p-4">
          <div className="space-y-4">
            <skeleton_1.Skeleton className="h-8 w-32"/>
            <skeleton_1.Skeleton className="h-10 w-full"/>
            <skeleton_1.Skeleton className="h-10 w-full"/>
          </div>
        </card_1.Card>
      </div>
    </div>);
}
// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
exports.PropertySkeletonGrid = UnifiedPropertySkeletonGrid;
/** @deprecated Use PropertySkeletonGrid */
exports.PropertySkeleton = UnifiedPropertySkeletonGrid;
exports.default = exports.PropertySkeletonGrid;
