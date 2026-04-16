"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogPostSkeleton = void 0;
var react_1 = require("react");
var card_1 = require("../ui/card");
var skeleton_1 = require("../ui/skeleton");
exports.BlogPostSkeleton = (0, react_1.memo)(function (_a) {
    var _b = _a.variant, variant = _b === void 0 ? "default" : _b, _c = _a.showTags, showTags = _c === void 0 ? true : _c;
    return (<card_1.Card className="h-full overflow-hidden">
    <skeleton_1.Skeleton className="h-48 w-full"/>
    <card_1.CardHeader className="pb-3">
      <div className="flex items-center gap-4 mb-3">
        <skeleton_1.Skeleton className="h-4 w-16"/>
        <skeleton_1.Skeleton className="h-4 w-20"/>
      </div>
      <skeleton_1.Skeleton className="h-6 w-full mb-2"/>
      <skeleton_1.Skeleton className="h-6 w-3/4"/>
    </card_1.CardHeader>
    <card_1.CardContent className="pt-0">
      <skeleton_1.Skeleton className="h-16 w-full mb-4"/>
      
      {showTags && (<div className="flex items-center gap-2 mb-4">
          <skeleton_1.Skeleton className="h-4 w-12"/>
          <skeleton_1.Skeleton className="h-4 w-16"/>
          <skeleton_1.Skeleton className="h-4 w-8"/>
        </div>)}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <skeleton_1.Skeleton className="h-4 w-4"/>
          <skeleton_1.Skeleton className="h-4 w-24"/>
        </div>
        <skeleton_1.Skeleton className="h-10 w-24"/>
      </div>
    </card_1.CardContent>
  </card_1.Card>);
});
exports.BlogPostSkeleton.displayName = "BlogPostSkeleton";
