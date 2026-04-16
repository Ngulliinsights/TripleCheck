"use strict";
/**
 * Enhanced Hooks Usage Example
 *
 * This component demonstrates the proper usage of our enhanced hooks:
 * - useSafeQuery for robust data fetching
 * - useOptimisticMutation for instant UI feedback
 * - useOperationTracking for performance monitoring
 */
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
exports.default = HooksExample;
exports.HooksExample = HooksExample;
var badge_1 = require("../ui/badge");
var button_1 = require("../ui/button");
var card_1 = require("../ui/card");
var input_1 = require("../ui/input");
var useOperationTracking_1 = require("../../hooks/useOperationTracking");
var useOptimisticMutation_1 = require("../../hooks/useOptimisticMutation");
var useSafeQuery_1 = require("../../hooks/useSafeQuery");
var lucide_react_1 = require("lucide-react");
// Import our enhanced hooks
var react_1 = require("react");
function HooksExample() {
    var _this = this;
    var _a = (0, react_1.useState)(""), searchQuery = _a[0], setSearchQuery = _a[1];
    var _b = (0, react_1.useState)(""), selectedPropertyId = _b[0], setSelectedPropertyId = _b[1];
    // 1. Component Performance Tracking
    var _c = (0, useOperationTracking_1.useComponentTracking)("HooksExample", [searchQuery, selectedPropertyId]), renderCount = _c.renderCount, mountOperationId = _c.mountOperationId;
    var trackInteraction = (0, useOperationTracking_1.useInteractionTracking)("HooksExample").trackInteraction;
    // 2. Safe Data Fetching with Fallbacks
    var _d = (0, useSafeQuery_1.useSafePropertiesQuery)({ search: searchQuery }, {
        context: "hooks-example",
        staleTime: 5 * 60 * 1000,
        debounceMs: 300, // Debounce search queries
        validator: function (data) {
            // Custom validation for our specific needs
            if (!Array.isArray(data))
                return [];
            return data.filter(function (property) { return (property === null || property === void 0 ? void 0 : property.id) && property.title && property.price > 0; });
        },
    }), properties = _d.data, propertiesLoading = _d.isLoading, hasProperties = _d.hasValidData, propertiesError = _d.error, cancelPropertiesRequest = _d.cancelRequest;
    // 3. User Authentication with Safe Handling
    var _e = (0, useSafeQuery_1.useSafeUserQuery)({
        context: "hooks-example",
        retry: false, // Don't retry auth failures
    }), user = _e.data, isAuthenticated = _e.hasValidData;
    // 4. Trust Score with Conditional Loading
    var _f = (0, useSafeQuery_1.useSafeTrustScoreQuery)((user === null || user === void 0 ? void 0 : user.id) || "", {
        enabled: isAuthenticated && !!(user === null || user === void 0 ? void 0 : user.id),
        context: "hooks-example",
    }), trustScore = _f.data, trustLoading = _f.isLoading;
    // 5. Optimistic Mutation for Instant Feedback
    var updatePropertyMutation = (0, useOptimisticMutation_1.useOptimisticMutation)({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 1:
                        // Simulate API call
                        _a.sent();
                        return [2 /*return*/, __assign(__assign({}, data), { updatedAt: new Date().toISOString() })];
                }
            });
        }); },
        queryKey: ["/api/properties"],
        optimisticUpdate: function (oldData, variables) {
            if (!Array.isArray(oldData))
                return oldData;
            return oldData.map(function (property) {
                return property.id === variables.id ? __assign(__assign(__assign({}, property), variables), { isOptimistic: true }) : property;
            });
        },
        onError: function (error, variables, context) {
            console.error("Property update failed:", error);
            // Error handling with context
        },
        onSettled: function () {
            // Always refetch to ensure consistency
            console.log("Property update completed");
        },
    });
    // 6. Performance Debugging (Development Only)
    var _g = (0, useOperationTracking_1.useOperationDebug)("HooksExample"), debugInfo = _g.debugInfo, logTimeline = _g.logTimeline, logRaceConditions = _g.logRaceConditions;
    // Event Handlers with Interaction Tracking
    var handleSearch = function (query) {
        trackInteraction("search", "Property search performed", {
            query: query,
            resultCount: properties.length,
            renderCount: renderCount,
        });
        setSearchQuery(query);
    };
    var handlePropertyUpdate = function (propertyId, newTitle) {
        trackInteraction("update", "Property title updated", {
            propertyId: propertyId,
            newTitle: newTitle,
            isOptimistic: true,
        });
        updatePropertyMutation.mutate({
            id: propertyId,
            title: newTitle,
        });
    };
    var handleCancelRequests = function () {
        var _a;
        trackInteraction("cancel", "Requests cancelled", {
            activeRequests: ((_a = debugInfo === null || debugInfo === void 0 ? void 0 : debugInfo.componentOperations) === null || _a === void 0 ? void 0 : _a.length) || 0,
        });
        cancelPropertiesRequest();
    };
    return (<div className="space-y-6 p-6">
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            <lucide_react_1.Activity className="w-5 h-5"/>
            Enhanced Hooks Example
            <badge_1.Badge variant="outline">Render #{renderCount}</badge_1.Badge>
          </card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          {/* Search Input with Debouncing */}
          <div className="space-y-2">
            <label htmlFor="search" className="text-sm font-medium">
              Property Search (Debounced)
            </label>
            <input_1.Input id="search" value={searchQuery} onChange={function (e) { return handleSearch(e.target.value); }} placeholder="Search properties..." className="w-full"/>
          </div>

          {/* User Authentication Status */}
          <div className="flex items-center gap-2">
            {isAuthenticated ?
            <>
                <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>
                <span>
                  Authenticated as {user === null || user === void 0 ? void 0 : user.firstName} {user === null || user === void 0 ? void 0 : user.lastName}
                </span>
                {trustLoading ?
                    <lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/>
                    : <badge_1.Badge variant="secondary">
                    Trust Score: {(trustScore === null || trustScore === void 0 ? void 0 : trustScore.score) || 0}
                  </badge_1.Badge>}
              </>
            : <>
                <lucide_react_1.AlertCircle className="w-4 h-4 text-yellow-500"/>
                <span>Not authenticated</span>
              </>}
          </div>

          {/* Properties List with Safe Loading */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                Properties ({hasProperties ? properties.length : 0})
              </h3>
              <div className="flex gap-2">
                <button_1.Button variant="outline" size="sm" onClick={handleCancelRequests} disabled={!propertiesLoading}>
                  Cancel Requests
                </button_1.Button>
                {import.meta.env.MODE === "development" && (<>
                    <button_1.Button variant="outline" size="sm" onClick={logTimeline}>
                      Log Timeline
                    </button_1.Button>
                    <button_1.Button variant="outline" size="sm" onClick={logRaceConditions}>
                      Check Race Conditions
                    </button_1.Button>
                  </>)}
              </div>
            </div>

            {propertiesLoading && (<div className="flex items-center gap-2 text-sm text-gray-500">
                <lucide_react_1.Loader2 className="w-4 h-4 animate-spin"/>
                Loading properties...
              </div>)}

            {propertiesError && (<div className="flex items-center gap-2 text-sm text-red-500">
                <lucide_react_1.AlertCircle className="w-4 h-4"/>
                Error: {propertiesError.message}
              </div>)}

            {hasProperties && (<div className="space-y-2 max-h-60 overflow-y-auto">
                {properties.map(function (property) {
                var _a;
                return (<div key={property.id} className={"p-3 border rounded-lg ".concat(property.isOptimistic ?
                        "bg-blue-50 border-blue-200"
                        : "bg-white")}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{property.title}</h4>
                        <p className="text-sm text-gray-500">
                          ${(_a = property.price) === null || _a === void 0 ? void 0 : _a.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {property.isOptimistic && (<badge_1.Badge variant="outline" className="text-blue-600">
                            Updating...
                          </badge_1.Badge>)}
                        <button_1.Button size="sm" variant="outline" onClick={function () {
                        return handlePropertyUpdate(property.id, "".concat(property.title, " (Updated)"));
                    }} disabled={updatePropertyMutation.isPending}>
                          {updatePropertyMutation.isPending ?
                        <lucide_react_1.Loader2 className="w-3 h-3 animate-spin"/>
                        : "Update"}
                        </button_1.Button>
                      </div>
                    </div>
                  </div>);
            })}
              </div>)}

            {!propertiesLoading && !hasProperties && !propertiesError && (<div className="text-center py-8 text-gray-500">
                No properties found. Try a different search.
              </div>)}
          </div>

          {/* Debug Information (Development Only) */}
          {import.meta.env.MODE === "development" && debugInfo && (<details className="text-xs">
              <summary className="cursor-pointer font-medium">
                Debug Information
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>)}
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
