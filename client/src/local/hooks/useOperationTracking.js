"use strict";
/**
 * React hooks for automatic operation tracking
 *
 * These hooks integrate the OperationTracker with React's lifecycle
 * to automatically capture race conditions in React applications.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useComponentTracking = useComponentTracking;
exports.useTrackedQuery = useTrackedQuery;
exports.useTrackedMutation = useTrackedMutation;
exports.useInteractionTracking = useInteractionTracking;
exports.useTrackedEffect = useTrackedEffect;
exports.useOperationDebug = useOperationDebug;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
var operation_tracker_1 = require("../../infrastructure/monitoring/operation-tracker");
/**
 * Hook to track component lifecycle operations
 *
 * This automatically tracks mount, unmount, and update operations
 * which are common sources of race conditions in React apps.
 *
 * @param componentName - Name of the component for tracking
 * @param dependencies - Dependencies that trigger updates
 */
function useComponentTracking(componentName, dependencies) {
    if (dependencies === void 0) { dependencies = []; }
    var mountOperationId = (0, react_1.useRef)();
    var updateOperationId = (0, react_1.useRef)();
    var renderCount = (0, react_1.useRef)(0);
    // Track component mount
    (0, react_1.useEffect)(function () {
        mountOperationId.current = operation_tracker_1.operationTracker.startOperation('component_mount', "Mount ".concat(componentName), componentName, undefined, { renderCount: ++renderCount.current });
        operation_tracker_1.operationTracker.recordMilestone(mountOperationId.current, 'completed', { mounted: true });
        // Track component unmount
        return function () {
            var unmountOperationId = operation_tracker_1.operationTracker.startOperation('component_unmount', "Unmount ".concat(componentName), componentName, mountOperationId.current);
            operation_tracker_1.operationTracker.recordMilestone(unmountOperationId, 'completed', { unmounted: true });
        };
    }, [componentName]);
    // Track component updates
    (0, react_1.useEffect)(function () {
        if (renderCount.current > 1) { // Skip first render (mount)
            updateOperationId.current = operation_tracker_1.operationTracker.startOperation('component_update', "Update ".concat(componentName), componentName, mountOperationId.current, {
                renderCount: renderCount.current,
                dependencies: dependencies.map(function (dep) { return typeof dep === 'object' ? JSON.stringify(dep) : String(dep); })
            });
            operation_tracker_1.operationTracker.recordMilestone(updateOperationId.current, 'completed', { updated: true, dependencies: dependencies });
        }
    }, dependencies);
    return {
        mountOperationId: mountOperationId.current,
        updateOperationId: updateOperationId.current,
        renderCount: renderCount.current
    };
}
/**
 * Enhanced useQuery hook with automatic operation tracking
 *
 * This wrapper tracks query operations to detect race conditions
 * like duplicate queries, infinite refetches, and query waterfalls.
 *
 * @param options - Standard React Query options
 * @param trackingOptions - Additional tracking configuration
 */
function useTrackedQuery(options, trackingOptions) {
    if (trackingOptions === void 0) { trackingOptions = {}; }
    var operationId = (0, react_1.useRef)();
    var queryKey = JSON.stringify(options.queryKey);
    var componentName = trackingOptions.componentName || 'UnknownComponent';
    var description = trackingOptions.description || "Query ".concat(queryKey);
    var result = (0, react_query_1.useQuery)(options);
    // Track query lifecycle
    (0, react_1.useEffect)(function () {
        if (result.isFetching && !operationId.current) {
            operationId.current = operation_tracker_1.operationTracker.startOperation('query_fetch', description, componentName, trackingOptions.parentOperationId, {
                queryKey: queryKey,
                enabled: options.enabled,
                staleTime: options.staleTime,
                refetchOnWindowFocus: options.refetchOnWindowFocus
            });
            operation_tracker_1.operationTracker.recordMilestone(operationId.current, 'progress', undefined, undefined, { status: 'fetching' });
        }
    }, [result.isFetching, queryKey, description, componentName]);
    // Track query success using useEffect (React Query v5 pattern)
    (0, react_1.useEffect)(function () {
        if (result.isSuccess && result.data && operationId.current) {
            operation_tracker_1.operationTracker.recordMilestone(operationId.current, 'completed', result.data, undefined, { queryKey: queryKey, dataSize: JSON.stringify(result.data).length });
        }
    }, [result.isSuccess, result.data, queryKey]);
    // Track query error using useEffect (React Query v5 pattern)
    (0, react_1.useEffect)(function () {
        if (result.isError && result.error && operationId.current) {
            operation_tracker_1.operationTracker.recordMilestone(operationId.current, 'failed', undefined, result.error, { queryKey: queryKey });
        }
    }, [result.isError, result.error, queryKey]);
    // Detect potential infinite refetch loops
    var refetchCount = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(function () {
        if (result.isFetching) {
            refetchCount.current++;
            // Warn about potential infinite loops
            if (refetchCount.current > 10) {
                console.warn("\uD83D\uDEA8 Potential infinite query loop detected for ".concat(queryKey), {
                    refetchCount: refetchCount.current,
                    operationId: operationId.current,
                    componentName: componentName
                });
            }
        }
    }, [result.dataUpdatedAt, queryKey, componentName]);
    return __assign(__assign({}, result), { operationId: operationId.current });
}
/**
 * Enhanced useMutation hook with automatic operation tracking
 *
 * This wrapper tracks mutation operations to detect race conditions
 * like concurrent mutations and mutation chains.
 *
 * @param options - Standard React Query mutation options (without deprecated callbacks)
 * @param trackingOptions - Additional tracking configuration
 */
function useTrackedMutation(options, trackingOptions) {
    if (trackingOptions === void 0) { trackingOptions = {}; }
    var operationId = (0, react_1.useRef)();
    var componentName = trackingOptions.componentName || 'UnknownComponent';
    var description = trackingOptions.description || 'Mutation';
    var trackedOptions = (0, react_1.useMemo)(function () { return (__assign(__assign({}, options), { onMutate: function (variables) {
            var _a;
            operationId.current = operation_tracker_1.operationTracker.startOperation('mutation', description, componentName, trackingOptions.parentOperationId, { variables: JSON.stringify(variables) });
            operation_tracker_1.operationTracker.recordMilestone(operationId.current, 'progress', variables, undefined, { status: 'mutating' });
            return (_a = options.onMutate) === null || _a === void 0 ? void 0 : _a.call(options, variables);
        } })); }, [options, description, componentName]);
    var result = (0, react_query_1.useMutation)(trackedOptions);
    // Handle success callback using useEffect (React Query v5 pattern)
    (0, react_1.useEffect)(function () {
        if (result.isSuccess && options.onSuccess && result.data !== undefined) {
            if (operationId.current) {
                operation_tracker_1.operationTracker.recordMilestone(operationId.current, 'completed', result.data, undefined, { variables: JSON.stringify(result.variables) });
            }
            options.onSuccess(result.data, result.variables, result.context);
        }
    }, [result.isSuccess, result.data, result.variables, result.context, options.onSuccess]);
    // Handle error callback using useEffect (React Query v5 pattern)
    (0, react_1.useEffect)(function () {
        if (result.isError && options.onError && result.error) {
            if (operationId.current) {
                operation_tracker_1.operationTracker.recordMilestone(operationId.current, 'failed', undefined, result.error, { variables: JSON.stringify(result.variables) });
            }
            options.onError(result.error, result.variables, result.context);
        }
    }, [result.isError, result.error, result.variables, result.context, options.onError]);
    // Handle settled callback using useEffect (React Query v5 pattern)
    (0, react_1.useEffect)(function () {
        if ((result.isSuccess || result.isError) && options.onSettled) {
            options.onSettled(result.data, result.error, result.variables, result.context);
        }
    }, [result.isSuccess, result.isError, result.data, result.error, result.variables, result.context, options.onSettled]);
    return result;
}
/**
 * Hook to track user interactions that might trigger race conditions
 *
 * This is useful for tracking button clicks, form submissions, and other
 * user actions that can trigger cascading operations.
 *
 * @param componentName - Name of the component
 */
function useInteractionTracking(componentName) {
    var trackInteraction = (0, react_1.useCallback)(function (interactionType, description, metadata) {
        if (metadata === void 0) { metadata = {}; }
        var operationId = operation_tracker_1.operationTracker.startOperation('user_interaction', "".concat(interactionType, ": ").concat(description), componentName, undefined, __assign({ interactionType: interactionType }, metadata));
        // Complete immediately since user interactions are synchronous
        operation_tracker_1.operationTracker.recordMilestone(operationId, 'completed', { interactionType: interactionType, timestamp: Date.now() });
        return operationId;
    }, [componentName]);
    return { trackInteraction: trackInteraction };
}
/**
 * Hook to track effect operations that might cause race conditions
 *
 * This automatically tracks useEffect operations to identify
 * effects that run too frequently or cause infinite loops.
 *
 * @param effectName - Name of the effect for tracking
 * @param dependencies - Effect dependencies
 * @param componentName - Component name for context
 */
function useTrackedEffect(effectName, effect, dependencies, componentName) {
    var operationId = (0, react_1.useRef)();
    var runCount = (0, react_1.useRef)(0);
    (0, react_1.useEffect)(function () {
        runCount.current++;
        operationId.current = operation_tracker_1.operationTracker.startOperation('effect_run', "Effect: ".concat(effectName), componentName, undefined, {
            runCount: runCount.current,
            dependencies: (dependencies === null || dependencies === void 0 ? void 0 : dependencies.map(function (dep) {
                return typeof dep === 'object' ? JSON.stringify(dep) : String(dep);
            })) || []
        });
        // Warn about effects running too frequently
        if (runCount.current > 20) {
            console.warn("\uD83D\uDEA8 Effect \"".concat(effectName, "\" has run ").concat(runCount.current, " times"), {
                componentName: componentName,
                operationId: operationId.current
            });
        }
        var cleanup = effect();
        operation_tracker_1.operationTracker.recordMilestone(operationId.current, 'completed', { effectName: effectName, runCount: runCount.current });
        return cleanup;
    }, dependencies);
    return {
        operationId: operationId.current,
        runCount: runCount.current
    };
}
/**
 * Hook to get operation tracking debug information
 *
 * This provides real-time debugging information about operations
 * in the current component context.
 *
 * @param componentName - Component name to filter operations
 */
function useOperationDebug(componentName) {
    var _a = (0, react_2.useState)(null), debugInfo = _a[0], setDebugInfo = _a[1];
    (0, react_1.useEffect)(function () {
        var updateDebugInfo = function () {
            var report = operation_tracker_1.operationTracker.getDebugReport();
            var componentOperations = componentName
                ? operation_tracker_1.operationTracker.queryOperations({ context: componentName, limit: 10 })
                : [];
            setDebugInfo(__assign(__assign({}, report), { componentOperations: componentOperations }));
        };
        // Update debug info periodically
        var interval = setInterval(updateDebugInfo, 1000);
        updateDebugInfo(); // Initial update
        return function () { return clearInterval(interval); };
    }, [componentName]);
    var logTimeline = (0, react_1.useCallback)(function () {
        console.log(operation_tracker_1.operationTracker.generateTimeline());
    }, []);
    var logRaceConditions = (0, react_1.useCallback)(function () {
        var patterns = operation_tracker_1.operationTracker.analyzeRaceConditions();
        console.table(patterns);
    }, []);
    return {
        debugInfo: debugInfo,
        logTimeline: logTimeline,
        logRaceConditions: logRaceConditions,
        clearTracking: function () { return operation_tracker_1.operationTracker.clear(); }
    };
}
// Import useState for useOperationDebug
var react_2 = require("react");
