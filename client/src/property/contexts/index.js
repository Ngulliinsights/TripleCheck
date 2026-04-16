"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePropertyCompareState = exports.usePropertyCompareAnalysis = exports.usePropertyCompareActions = exports.usePropertyCompare = exports.useFavorites = exports.usePropertyFilters = exports.usePropertyActions = exports.usePropertyState = exports.usePropertyContext = exports.PropertyProvider = void 0;
// Property management context with integrated comparison functionality
var PropertyContext_1 = require("./PropertyContext");
Object.defineProperty(exports, "PropertyProvider", { enumerable: true, get: function () { return PropertyContext_1.PropertyProvider; } });
Object.defineProperty(exports, "usePropertyContext", { enumerable: true, get: function () { return PropertyContext_1.usePropertyContext; } });
Object.defineProperty(exports, "usePropertyState", { enumerable: true, get: function () { return PropertyContext_1.usePropertyState; } });
Object.defineProperty(exports, "usePropertyActions", { enumerable: true, get: function () { return PropertyContext_1.usePropertyActions; } });
Object.defineProperty(exports, "usePropertyFilters", { enumerable: true, get: function () { return PropertyContext_1.usePropertyFilters; } });
Object.defineProperty(exports, "useFavorites", { enumerable: true, get: function () { return PropertyContext_1.useFavorites; } });
// Integrated comparison hooks
Object.defineProperty(exports, "usePropertyCompare", { enumerable: true, get: function () { return PropertyContext_1.usePropertyCompare; } });
Object.defineProperty(exports, "usePropertyCompareActions", { enumerable: true, get: function () { return PropertyContext_1.usePropertyCompareActions; } });
Object.defineProperty(exports, "usePropertyCompareAnalysis", { enumerable: true, get: function () { return PropertyContext_1.usePropertyCompareAnalysis; } });
Object.defineProperty(exports, "usePropertyCompareState", { enumerable: true, get: function () { return PropertyContext_1.usePropertyCompareState; } });
