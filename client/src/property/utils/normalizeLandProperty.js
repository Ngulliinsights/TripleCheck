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
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLandProperty = normalizeLandProperty;
function normalizeLandProperty(land) {
    var normalizedLocation = typeof land.location === 'string'
        ? land.location
        : land.location.address;
    return __assign(__assign({}, land), { location: normalizedLocation, verified: land.verificationStatus === 'verified', category: 'land', createdAt: new Date().toISOString(), status: land.verificationStatus === 'flagged' ? 'pending' : 'available', type: 'residential', features: [] // Initialize with empty array, can be populated with land-specific features if needed
     });
}
