"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyReviews = PropertyReviews;
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var label_1 = require("../../local/components/ui/label");
var separator_1 = require("../../local/components/ui/separator");
var textarea_1 = require("../../local/components/ui/textarea");
var useSafeQuery_1 = require("../../local/hooks/useSafeQuery");
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var date_utils_1 = require("../../local/utils/date-utils");
var queryClient_1 = require("../../infrastructure/api/queryClient");
var use_toast_1 = require("../../local/hooks/use-toast");
// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Renders a row of 5 star icons, filled up to `rating`. */
function StarRow(_a) {
    var rating = _a.rating, _b = _a.size, size = _b === void 0 ? "sm" : _b;
    var cls = size === "lg" ? "w-8 h-8" : "w-4 h-4";
    return (<>
      {Array.from({ length: 5 }, function (_, i) { return (<lucide_react_1.Star key={i} className={"".concat(cls, " ").concat(i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300")}/>); })}
    </>);
}
// ─── Component ────────────────────────────────────────────────────────────────
function PropertyReviews(_a) {
    var _this = this;
    var propertyId = _a.propertyId;
    var toast = (0, use_toast_1.useToast)().toast;
    var queryClient = (0, react_query_1.useQueryClient)();
    var _b = (0, react_1.useState)(false), showReviewForm = _b[0], setShowReviewForm = _b[1];
    var _c = (0, react_1.useState)(5), rating = _c[0], setRating = _c[1];
    var _d = (0, react_1.useState)(""), comment = _d[0], setComment = _d[1];
    var user = (0, useSafeQuery_1.useSafeUserQuery)({
        context: "property-reviews",
        retry: false,
        staleTime: 5 * 60 * 1000,
    }).data;
    var reviewQueryKey = ["/api/properties/".concat(propertyId, "/reviews")];
    var _e = (0, react_query_1.useQuery)({
        queryKey: reviewQueryKey,
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, queryClient_1.apiRequest)("GET", "/api/properties/".concat(propertyId, "/reviews"))];
                    case 1: return [2 /*return*/, (_a = (_b.sent())) !== null && _a !== void 0 ? _a : []];
                    case 2:
                        error_1 = _b.sent();
                        console.error("Failed to fetch reviews:", error_1);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        staleTime: 2 * 60 * 1000,
        refetchOnWindowFocus: false,
    }), _f = _e.data, reviews = _f === void 0 ? [] : _f, isLoading = _e.isLoading;
    var createReviewMutation = (0, react_query_1.useMutation)({
        mutationFn: function (reviewData) {
            return (0, queryClient_1.apiRequest)("POST", "/api/properties/".concat(propertyId, "/reviews"), reviewData);
        },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: reviewQueryKey });
            toast({ title: "Review submitted", description: "Thank you for your feedback!" });
            setRating(5);
            setComment("");
            setShowReviewForm(false);
        },
        onError: function (error) {
            var _a;
            toast({
                title: "Failed to submit review",
                description: (_a = error.message) !== null && _a !== void 0 ? _a : "Please try again later.",
                variant: "destructive",
            });
        },
    });
    var averageRating = (0, react_1.useMemo)(function () {
        return reviews.length > 0
            ? reviews.reduce(function (sum, r) { return sum + r.rating; }, 0) / reviews.length
            : 0;
    }, [reviews]);
    var handleSubmit = (0, react_1.useCallback)(function (e) {
        e.preventDefault();
        if (comment.trim().length < 10) {
            toast({
                title: "Comment too short",
                description: "Please write at least 10 characters.",
                variant: "destructive",
            });
            return;
        }
        createReviewMutation.mutate({ rating: rating, comment: comment.trim() });
    }, [comment, rating, toast, createReviewMutation]);
    var handleCancelForm = (0, react_1.useCallback)(function () {
        setShowReviewForm(false);
        setRating(5);
        setComment("");
    }, []);
    var isCommentValid = comment.trim().length >= 10;
    // ── Render ────────────────────────────────────────────────────────────────
    return (<card_1.Card>
      <card_1.CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.MessageCircle className="w-5 h-5"/>
              Reviews ({reviews.length})
            </card_1.CardTitle>
            {reviews.length > 0 && (<card_1.CardDescription className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <StarRow rating={Math.round(averageRating)}/>
                </div>
                <span className="font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  average from {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </span>
              </card_1.CardDescription>)}
          </div>
          {user && !showReviewForm && (<button_1.Button onClick={function () { return setShowReviewForm(true); }}>Write Review</button_1.Button>)}
        </div>
      </card_1.CardHeader>

      <card_1.CardContent className="space-y-6">
        {/* Review form */}
        {showReviewForm && user && (<card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="text-lg">Write a Review</card_1.CardTitle>
              <card_1.CardDescription>Share your experience with this property</card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label_1.Label htmlFor="rating">Rating</label_1.Label>
                  <div className="flex gap-1 mt-2">
                    {Array.from({ length: 5 }, function (_, i) { return (<lucide_react_1.Star key={i} className={"w-8 h-8 cursor-pointer transition-colors ".concat(i < rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300 hover:text-yellow-200")} onClick={function () { return setRating(i + 1); }}/>); })}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rating} star{rating !== 1 ? "s" : ""} selected
                  </p>
                </div>

                <div>
                  <label_1.Label htmlFor="comment">Comment</label_1.Label>
                  <textarea_1.Textarea id="comment" value={comment} onChange={function (e) { return setComment(e.target.value); }} placeholder="Share your thoughts about this property..." className="min-h-[100px] mt-2" maxLength={500}/>
                  <p className="text-sm text-muted-foreground mt-1">
                    {comment.length}/500 characters (minimum 10)
                  </p>
                </div>

                <div className="flex gap-2">
                  <button_1.Button type="submit" disabled={createReviewMutation.isPending || !isCommentValid}>
                    {createReviewMutation.isPending ? "Submitting…" : "Submit Review"}
                  </button_1.Button>
                  <button_1.Button type="button" variant="outline" onClick={handleCancelForm}>
                    Cancel
                  </button_1.Button>
                </div>
              </form>
            </card_1.CardContent>
          </card_1.Card>)}

        {/* Not logged in */}
        {!user && (<div className="text-center py-8 text-muted-foreground">
            <lucide_react_1.MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50"/>
            <p>Please log in to write a review</p>
          </div>)}

        {/* Reviews list */}
        {isLoading ? (<div className="space-y-4">
            {[1, 2, 3].map(function (i) { return (<div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"/>
                <div className="h-16 bg-gray-200 rounded"/>
              </div>); })}
          </div>) : reviews.length > 0 ? (<div className="space-y-6">
            {reviews.map(function (review, index) { return (<div key={review.id}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                        <lucide_react_1.User className="w-5 h-5 text-gray-500"/>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">User #{review.userId}</span>
                          <badge_1.Badge variant="outline" className="text-xs">
                            Verified Reviewer
                          </badge_1.Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex">
                            <StarRow rating={review.rating}/>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {(0, date_utils_1.formatDate)(new Date(review.createdAt).toISOString())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed pl-[52px]">{review.comment}</p>

                  <div className="flex items-center gap-4 pl-[52px]">
                    <button_1.Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gray-900">
                      <lucide_react_1.ThumbsUp className="w-4 h-4 mr-1"/>
                      Helpful
                    </button_1.Button>
                    <button_1.Button variant="ghost" size="sm" className="text-muted-foreground hover:text-gray-900">
                      <lucide_react_1.Flag className="w-4 h-4 mr-1"/>
                      Report
                    </button_1.Button>
                  </div>
                </div>

                {index < reviews.length - 1 && <separator_1.Separator className="mt-6"/>}
              </div>); })}
          </div>) : (<div className="text-center py-8 text-muted-foreground">
            <lucide_react_1.MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50"/>
            <p className="text-lg font-medium mb-2">No reviews yet</p>
            <p>Be the first to share your experience with this property!</p>
          </div>)}
      </card_1.CardContent>
    </card_1.Card>);
}
