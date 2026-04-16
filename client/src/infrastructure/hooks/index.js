"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useViewportEntry = exports.useLazyImageLoading = exports.useIntersectionObserver = exports.useEnhancedCleanupManager = exports.useCleanupManager = exports.useCoordinatedMultiState = exports.useCoordinatedState = exports.useStableCallback = exports.useSafeState = exports.useSafeEffect = void 0;
// Safe effect and state management hooks
var useSafeEffect_1 = require("./useSafeEffect");
Object.defineProperty(exports, "useSafeEffect", { enumerable: true, get: function () { return useSafeEffect_1.useSafeEffect; } });
var useSafeState_1 = require("./useSafeState");
Object.defineProperty(exports, "useSafeState", { enumerable: true, get: function () { return useSafeState_1.useSafeState; } });
var useStableCallback_1 = require("./useStableCallback");
Object.defineProperty(exports, "useStableCallback", { enumerable: true, get: function () { return useStableCallback_1.useStableCallback; } });
var useCoordinatedState_1 = require("./useCoordinatedState");
Object.defineProperty(exports, "useCoordinatedState", { enumerable: true, get: function () { return useCoordinatedState_1.useCoordinatedState; } });
Object.defineProperty(exports, "useCoordinatedMultiState", { enumerable: true, get: function () { return useCoordinatedState_1.useCoordinatedMultiState; } });
var useCleanupManager_1 = require("./useCleanupManager");
Object.defineProperty(exports, "useCleanupManager", { enumerable: true, get: function () { return useCleanupManager_1.useCleanupManager; } });
Object.defineProperty(exports, "useEnhancedCleanupManager", { enumerable: true, get: function () { return useCleanupManager_1.useEnhancedCleanupManager; } });
// Intersection observer hooks for lazy loading
var useIntersectionObserver_1 = require("./useIntersectionObserver");
Object.defineProperty(exports, "useIntersectionObserver", { enumerable: true, get: function () { return useIntersectionObserver_1.useIntersectionObserver; } });
Object.defineProperty(exports, "useLazyImageLoading", { enumerable: true, get: function () { return useIntersectionObserver_1.useLazyImageLoading; } });
Object.defineProperty(exports, "useViewportEntry", { enumerable: true, get: function () { return useIntersectionObserver_1.useViewportEntry; } });
