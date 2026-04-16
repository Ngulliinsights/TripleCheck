"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyCardSkeleton = PropertyCardSkeleton;
exports.PropertyGridSkeleton = PropertyGridSkeleton;
exports.LoadingSpinner = LoadingSpinner;
exports.ErrorState = ErrorState;
exports.EmptyState = EmptyState;
exports.DataContainer = DataContainer;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("./button");
var card_1 = require("./card");
var skeleton_1 = require("./skeleton");
// Property card skeleton
function PropertyCardSkeleton() {
    return (<card_1.Card className="overflow-hidden">
      <div className="relative">
        <skeleton_1.Skeleton className="h-48 w-full"/>
        <div className="absolute top-2 right-2">
          <skeleton_1.Skeleton className="h-6 w-16"/>
        </div>
      </div>
      <card_1.CardContent className="p-4">
        <skeleton_1.Skeleton className="h-6 w-3/4 mb-2"/>
        <skeleton_1.Skeleton className="h-4 w-1/2 mb-3"/>
        <skeleton_1.Skeleton className="h-5 w-1/3 mb-3"/>
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <skeleton_1.Skeleton className="h-4 w-12"/>
            <skeleton_1.Skeleton className="h-4 w-12"/>
          </div>
          <skeleton_1.Skeleton className="h-4 w-16"/>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
}
// Property grid skeleton
function PropertyGridSkeleton(_a) {
    var _b = _a.count, count = _b === void 0 ? 6 : _b;
    return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map(function (_, i) { return (<PropertyCardSkeleton key={i}/>); })}
    </div>);
}
// Loading spinner
function LoadingSpinner(_a) {
    var _b = _a.size, size = _b === void 0 ? "default" : _b, text = _a.text;
    var sizeClasses = {
        sm: "h-4 w-4",
        default: "h-6 w-6",
        lg: "h-8 w-8"
    };
    return (<div className="flex items-center justify-center gap-2 p-4">
      <lucide_react_1.Loader2 className={"animate-spin ".concat(sizeClasses[size])}/>
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>);
}
// Error state component
function ErrorState(_a) {
    var _b = _a.title, title = _b === void 0 ? "Something went wrong" : _b, _c = _a.message, message = _c === void 0 ? "We encountered an error while loading data." : _c, onRetry = _a.onRetry, _d = _a.showRetry, showRetry = _d === void 0 ? true : _d;
    return (<card_1.Card className="max-w-md mx-auto">
      <card_1.CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <lucide_react_1.AlertCircle className="h-12 w-12 text-red-500"/>
        </div>
        <h3 className="text-lg font-semibold text-red-600">{title}</h3>
      </card_1.CardHeader>
      <card_1.CardContent className="text-center space-y-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        {showRetry && onRetry && (<button_1.Button onClick={onRetry} variant="outline" size="sm">
            <lucide_react_1.RefreshCw className="h-4 w-4 mr-2"/>
            Try Again
          </button_1.Button>)}
      </card_1.CardContent>
    </card_1.Card>);
}
// Empty state component
function EmptyState(_a) {
    var _b = _a.title, title = _b === void 0 ? "No data found" : _b, _c = _a.message, message = _c === void 0 ? "There's nothing to show here yet." : _c, action = _a.action;
    return (<card_1.Card className="max-w-md mx-auto">
      <card_1.CardContent className="text-center py-8 space-y-4">
        <div className="text-4xl">📭</div>
        <div>
          <h3 className="text-lg font-semibold text-muted-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{message}</p>
        </div>
        {action && <div>{action}</div>}
      </card_1.CardContent>
    </card_1.Card>);
}
// Data container with loading states
function DataContainer(_a) {
    var data = _a.data, isLoading = _a.isLoading, error = _a.error, onRetry = _a.onRetry, loadingSkeleton = _a.loadingSkeleton, emptyState = _a.emptyState, children = _a.children;
    if (isLoading) {
        return <>{loadingSkeleton || <LoadingSpinner text="Loading..."/>}</>;
    }
    if (error) {
        return (<ErrorState title="Failed to load data" message={error.message || "An unexpected error occurred"} {...(onRetry && { onRetry: onRetry })}/>);
    }
    // Check if data is empty (array, object, or null)
    var isEmpty = !data ||
        (Array.isArray(data) && data.length === 0) ||
        (typeof data === 'object' && Object.keys(data).length === 0);
    if (isEmpty) {
        return <>{emptyState || <EmptyState />}</>;
    }
    return <>{children(data)}</>;
}
