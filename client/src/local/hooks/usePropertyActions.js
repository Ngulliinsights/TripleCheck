"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePropertyActions = void 0;
var react_query_1 = require("@tanstack/react-query");
var use_toast_1 = require("./use-toast"); // or your preferred toast library
var property_api_1 = require("../../property/services/property-api");
/**
 * @deprecated This hook is deprecated in favor of useSafeQuery with mutation configurations
 * Please migrate to useSafeQuery with custom mutation endpoints for better error handling.
 * Migration guide: Use useSafeQuery with POST/PUT methods for property actions
 */
var usePropertyActions = function () {
    var queryClient = (0, react_query_1.useQueryClient)();
    // Add deprecation warning in development
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn("[DEPRECATED] usePropertyActions is deprecated. Please migrate to useSafeQuery with mutation configurations for better error handling and performance.");
    }
    var addToFavoritesMutation = (0, react_query_1.useMutation)({
        mutationFn: property_api_1.PropertyApi.addToFavorites,
        onSuccess: function () {
            use_toast_1.toast.success('Property added to favorites');
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
        onError: function () {
            use_toast_1.toast.error('Failed to add to favorites');
        },
    });
    var sharePropertyMutation = (0, react_query_1.useMutation)({
        mutationFn: function (_a) {
            var propertyId = _a.propertyId, method = _a.method;
            return property_api_1.PropertyApi.shareProperty(propertyId, method);
        },
        onSuccess: function (shareUrl, _a) {
            var method = _a.method;
            if (method === 'link') {
                navigator.clipboard.writeText(shareUrl);
                use_toast_1.toast.success('Share link copied to clipboard');
            }
            else {
                use_toast_1.toast.success('Property shared successfully');
            }
        },
        onError: function () {
            use_toast_1.toast.error('Failed to share property');
        },
    });
    return {
        addToFavorites: function (propertyId) { return addToFavoritesMutation.mutate(propertyId); },
        shareProperty: function (propertyId, method) {
            return sharePropertyMutation.mutate({ propertyId: propertyId, method: method });
        },
        isAddingToFavorites: addToFavoritesMutation.isPending,
        isSharing: sharePropertyMutation.isPending,
    };
};
exports.usePropertyActions = usePropertyActions;
