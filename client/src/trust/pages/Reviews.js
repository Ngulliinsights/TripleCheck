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
exports.default = ReviewsPage;
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var components_1 = require("../../local/components");
var FormField_1 = require("../../local/components/forms/FormField");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var label_1 = require("../../local/components/ui/label");
var progress_1 = require("../../local/components/ui/progress");
var use_toast_1 = require("../../local/hooks/use-toast");
// import { useForm } from "../../local/hooks/useFormValidation"
var useMemoryOptimization_1 = require("../../local/hooks/useMemoryOptimization");
var date_utils_1 = require("../../local/utils/date-utils");
// Virtualized Reviews List Component
var VirtualizedReviewsList = function (_a) {
    var reviews = _a.reviews;
    var containerRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(500), containerHeight = _b[0], setContainerHeight = _b[1];
    react_1.default.useEffect(function () {
        var updateHeight = function () {
            if (containerRef.current) {
                var rect = containerRef.current.getBoundingClientRect();
                var availableHeight = window.innerHeight - rect.top - 100;
                setContainerHeight(Math.max(400, Math.min(700, availableHeight)));
            }
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return function () { return window.removeEventListener('resize', updateHeight); };
    }, []);
    var listProps = (0, useMemoryOptimization_1.useReviewListVirtualization)(reviews, containerHeight, function (review) { return 150 + (review.comment.length / 4); } // Dynamic height based on comment length
    );
    var renderReviewItem = (0, react_1.useCallback)(function (review, index, style) {
        return (<div style={style} className="p-2">
        <card_1.Card>
          <card_1.CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="h-10 w-10 rounded-full bg-[#2C5282] flex items-center justify-center">
                  <lucide_react_1.User className="h-6 w-6 text-white"/>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{review.userName}</h3>
                  <span className="text-sm text-muted-foreground">
                    {(0, date_utils_1.formatDate)(review.createdAt)}
                  </span>
                </div>
                <div className="flex gap-1 my-2">
                  {Array(5).fill(0).map(function (_, i) { return (<lucide_react_1.Star key={i} className={"h-4 w-4 ".concat(i < review.rating ? "text-yellow-400" : "text-gray-300")} fill={i < review.rating ? "currentColor" : "none"}/>); })}
                </div>
                <p className="text-gray-700 mb-3">{review.comment}</p>
                <div className="flex items-center gap-4">
                  <button_1.Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <lucide_react_1.ThumbsUp className="h-4 w-4 mr-1"/>
                    Helpful ({review.helpful})
                  </button_1.Button>
                  <button_1.Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    <lucide_react_1.Flag className="h-4 w-4 mr-1"/>
                    Report
                  </button_1.Button>
                </div>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>);
    }, []);
    return (<div ref={containerRef} className="w-full">
      <components_1.EnterpriseVirtualizedList {...listProps} renderItem={renderReviewItem}/>
    </div>);
};
function ReviewsPage() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    // Simulated reviews data with proper React Query configuration
    var _a = (0, react_query_1.useQuery)({
        queryKey: ["/api/reviews"],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Simulate API call - replace with actual API call
                return [2 /*return*/, new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve([
                                {
                                    id: 1,
                                    userId: 1,
                                    propertyId: 1,
                                    rating: 5,
                                    comment: "Excellent service, very thorough verification process.",
                                    userName: "John Doe",
                                    createdAt: "2025-03-10",
                                    helpful: 12
                                },
                                {
                                    id: 2,
                                    userId: 2,
                                    propertyId: 1,
                                    rating: 4,
                                    comment: "Good experience overall, would recommend.",
                                    userName: "Jane Smith",
                                    createdAt: "2025-03-09",
                                    helpful: 8
                                }
                            ]);
                        }, 100);
                    })];
            });
        }); },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    }), reviews = _a.data, isLoading = _a.isLoading;
    var _b = useForm({
        initialValues: {
            rating: 0,
            comment: ''
        },
        validationRules: {
            rating: {
                required: true,
                min: 1,
                max: 5,
                custom: function (value) {
                    if (!value || (typeof value === 'number' && value < 1)) {
                        return 'Please select a rating';
                    }
                    return null;
                }
            },
            comment: {
                required: true,
                minLength: 10,
                maxLength: 500
            }
        },
        onSubmit: function (formData) { return __awaiter(_this, void 0, void 0, function () {
            var formService, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../../shared/services/FormService'); })];
                    case 1:
                        formService = (_a.sent()).formService;
                        return [4 /*yield*/, formService.submitReview(__assign(__assign({}, formData), { reviewType: 'service' // Default to service review
                             }))];
                    case 2:
                        result = _a.sent();
                        if (result.success) {
                            // Reset form after successful submission
                            setValue('rating', 0);
                            setValue('comment', '');
                        }
                        else {
                            throw new Error(result.message);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        // Error handling is done in FormService, but we re-throw for form state
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        }); }
    }), values = _b.values, touched = _b.touched, isValid = _b.isValid, isSubmitting = _b.isSubmitting, handleSubmit = _b.handleSubmit, setValue = _b.setValue, getFieldProps = _b.getFieldProps, getFieldError = _b.getFieldError;
    var renderStars = function (rating) {
        return Array(5).fill(0).map(function (_, index) { return (<lucide_react_1.Star key={index} className={"h-5 w-5 ".concat(index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300')}/>); });
    };
    var stats = {
        averageRating: 4.5,
        totalReviews: 128,
        ratingDistribution: [5, 45, 35, 10, 5]
    };
    // Loading state
    if (isLoading) {
        return (<div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Community Reviews & Ratings</h1>
            <p className="text-muted-foreground">Loading reviews...</p>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }, function (_, i) { return (<card_1.Card key={i} className="animate-pulse">
                <card_1.CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-gray-200"/>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"/>
                      <div className="h-4 bg-gray-200 rounded w-1/2"/>
                      <div className="h-16 bg-gray-200 rounded"/>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>
        </div>
      </div>);
    }
    return (<div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Community Reviews & Ratings</h1>
          <p className="text-muted-foreground">
            Real experiences from verified users in our trust network
          </p>
        </div>

        {/* Statistics Section */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Rating Overview</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{stats.averageRating}</div>
              <div className="flex justify-center mb-2">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p className="text-muted-foreground">Based on {stats.totalReviews} reviews</p>
            </div>
            <div className="space-y-2">
              {stats.ratingDistribution.map(function (percentage, index) { return (<div key={5 - index} className="flex items-center gap-2">
                  <span className="w-8 text-right">{5 - index} ★</span>
                  <progress_1.Progress value={percentage} className="h-2"/>
                  <span className="w-8">{percentage}%</span>
                </div>); })}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Write Review Section */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Write a Review</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label_1.Label htmlFor="rating" className={getFieldError('rating') ? 'text-red-600' : ''}>
                  Rating *
                </label_1.Label>
                <div className="flex gap-1 mt-2">
                  {Array(5).fill(0).map(function (_, index) { return (<lucide_react_1.Star key={index} className={"h-8 w-8 cursor-pointer transition-colors ".concat(index < values.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-200')} onClick={function () { return setValue('rating', index + 1); }} onKeyDown={function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setValue('rating', index + 1);
                }
            }} tabIndex={0} role="button" aria-label={"Rate ".concat(index + 1, " star").concat(index + 1 > 1 ? 's' : '')}/>); })}
                </div>
                {getFieldError('rating') && (<p className="text-sm text-red-600" role="alert">
                    {getFieldError('rating')}
                  </p>)}
              </div>
              
              <FormField_1.default label="Your Review" type="textarea" rows={4} placeholder="Share your experience..." required helpText="Minimum 10 characters, maximum 500 characters" error={getFieldError('comment')} touched={touched.comment} {...getFieldProps('comment')}/>
              
              <button_1.Button type="submit" disabled={isSubmitting || !isValid} className="w-full">
                {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
              </button_1.Button>
            </form>
          </card_1.CardContent>
        </card_1.Card>

        {/* Reviews List */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Reviews</h2>
          {reviews && reviews.length > 0 ? (<VirtualizedReviewsList reviews={reviews}/>) : (<card_1.Card>
              <card_1.CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No reviews yet. Be the first to leave a review!</p>
              </card_1.CardContent>
            </card_1.Card>)}
        </div>
      </div>
    </div>);
}
