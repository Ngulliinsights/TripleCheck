"use strict";
/**
 * OperationTracker - A sophisticated debugging system for race conditions
 *
 * This system captures the temporal relationships between asynchronous operations
 * to make invisible race conditions visible. It's designed to debug:
 * - UI flickering caused by competing state updates
 * - Infinite API call loops
 * - Unexpected app reloads from cascading operations
 * - Operations completing out of order
 *
 * Think of this as a "time machine" that records exactly how your app's
 * operations unfold and interact over time.
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.operationTracker = exports.OperationTracker = void 0;
/**
 * Centralized operation tracking system for debugging race conditions
 *
 * This class provides a comprehensive view of all asynchronous operations
 * in your application, making it possible to identify and debug race conditions
 * that cause UI flickering, infinite loops, and unexpected behavior.
 */
var OperationTracker = /** @class */ (function () {
    function OperationTracker(maxHistorySize, enablePatternDetection) {
        if (maxHistorySize === void 0) { maxHistorySize = 1000; }
        if (enablePatternDetection === void 0) { enablePatternDetection = true; }
        this.operations = new Map();
        this.operationHistory = [];
        this.sequenceCounter = 0;
        this.raceConditionPatterns = [];
        this.maxHistorySize = maxHistorySize;
        this.patternDetectionEnabled = enablePatternDetection;
    }
    /**
     * Get singleton instance of OperationTracker
     *
     * Using singleton ensures all parts of the application share the same
     * operation tracking context, which is crucial for detecting race conditions
     * that span multiple components or modules.
     */
    OperationTracker.getInstance = function () {
        if (!OperationTracker.instance) {
            OperationTracker.instance = new OperationTracker();
        }
        return OperationTracker.instance;
    };
    /**
     * Start tracking a new asynchronous operation
     *
     * This method captures the initial state of an operation, including its
     * call stack and context. The call stack is crucial for understanding
     * where race conditions originate.
     *
     * @param type - Type of operation being tracked
     * @param description - Human-readable description
     * @param context - Component or module context
     * @param parentId - ID of operation that triggered this one
     * @param metadata - Additional debugging information
     * @returns Unique operation ID for tracking milestones
     */
    OperationTracker.prototype.startOperation = function (type, description, context, parentId, metadata) {
        if (metadata === void 0) { metadata = {}; }
        var id = this.generateOperationId();
        var now = performance.now();
        // Capture call stack for debugging - this is crucial for race condition analysis
        var callStack = this.captureCallStack();
        var operation = {
            id: id,
            type: type,
            description: description,
            context: context,
            callStack: callStack,
            startTime: now,
            milestones: [{
                    timestamp: now,
                    status: 'started',
                    metadata: __assign({}, metadata)
                }],
            dependencies: [],
            children: [],
            parentId: parentId,
            metadata: __assign({}, metadata),
            isActive: true
        };
        // Establish parent-child relationship for dependency tracking
        if (parentId && this.operations.has(parentId)) {
            var parent_1 = this.operations.get(parentId);
            parent_1.children.push(id);
            operation.dependencies.push(parentId);
        }
        this.operations.set(id, operation);
        // Detect race condition patterns if enabled
        if (this.patternDetectionEnabled) {
            this.detectRaceConditionPatterns(operation);
        }
        this.logOperationStart(operation);
        return id;
    };
    /**
     * Record a milestone in an operation's lifecycle
     *
     * Milestones help track the progress of long-running operations and
     * identify where race conditions occur within an operation's lifecycle.
     *
     * @param operationId - ID of the operation
     * @param status - Current status of the operation
     * @param data - Any data associated with this milestone
     * @param error - Error if operation failed
     * @param metadata - Additional milestone metadata
     */
    OperationTracker.prototype.recordMilestone = function (operationId, status, data, error, metadata) {
        if (metadata === void 0) { metadata = {}; }
        var operation = this.operations.get(operationId);
        if (!operation) {
            console.warn("OperationTracker: Unknown operation ID ".concat(operationId));
            return;
        }
        var now = performance.now();
        var milestone = {
            timestamp: now,
            status: status,
            data: data,
            error: error,
            metadata: metadata
        };
        operation.milestones.push(milestone);
        // Update operation completion status
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
            operation.isActive = false;
            operation.endTime = now;
            operation.duration = now - operation.startTime;
            // Move to history and clean up active operations
            this.moveToHistory(operation);
        }
        // Detect patterns after each milestone
        if (this.patternDetectionEnabled) {
            this.detectRaceConditionPatterns(operation);
        }
        this.logMilestone(operation, milestone);
    };
    /**
     * Record a dependency between operations
     *
     * Dependencies are crucial for understanding race conditions. When operation A
     * depends on operation B, but B completes after A starts, you have a race condition.
     *
     * @param dependentId - Operation that depends on another
     * @param dependencyId - Operation that is depended upon
     */
    OperationTracker.prototype.recordDependency = function (dependentId, dependencyId) {
        var dependent = this.operations.get(dependentId);
        var dependency = this.operations.get(dependencyId);
        if (!dependent || !dependency) {
            console.warn("OperationTracker: Invalid dependency relationship ".concat(dependentId, " -> ").concat(dependencyId));
            return;
        }
        if (!dependent.dependencies.includes(dependencyId)) {
            dependent.dependencies.push(dependencyId);
        }
        if (!dependency.children.includes(dependentId)) {
            dependency.children.push(dependentId);
        }
        // Check for circular dependencies - a common source of infinite loops
        if (this.hasCircularDependency(dependentId, dependencyId)) {
            this.recordRaceConditionPattern({
                type: 'infinite_loop',
                severity: 'critical',
                description: "Circular dependency detected between ".concat(dependent.description, " and ").concat(dependency.description),
                operationIds: [dependentId, dependencyId],
                detectedAt: performance.now(),
                suggestion: 'Break the circular dependency by restructuring the operation flow'
            });
        }
    };
    /**
     * Query operations based on various criteria
     *
     * This method enables sophisticated analysis of operation patterns,
     * which is essential for identifying race conditions.
     *
     * @param query - Query criteria for filtering operations
     * @returns Array of matching operations
     */
    OperationTracker.prototype.queryOperations = function (query) {
        if (query === void 0) { query = {}; }
        var results = [];
        // Combine active operations and history
        var allOperations = __spreadArray(__spreadArray([], Array.from(this.operations.values()), true), this.operationHistory, true);
        results = allOperations.filter(function (op) {
            if (query.type && op.type !== query.type)
                return false;
            if (query.context && !op.context.includes(query.context))
                return false;
            if (query.status && !op.milestones.some(function (m) { return m.status === query.status; }))
                return false;
            if (query.activeOnly && !op.isActive)
                return false;
            if (query.timeRange) {
                var _a = query.timeRange, start = _a.start, end = _a.end;
                if (op.startTime < start || op.startTime > end)
                    return false;
            }
            return true;
        });
        // Sort by start time (most recent first)
        results.sort(function (a, b) { return b.startTime - a.startTime; });
        // Apply limit
        if (query.limit) {
            results = results.slice(0, query.limit);
        }
        return results;
    };
    /**
     * Analyze operations for race condition patterns
     *
     * This method performs sophisticated analysis to identify common
     * race condition patterns that cause UI flickering and infinite loops.
     *
     * @param timeWindow - Time window to analyze (in milliseconds)
     * @returns Array of detected race condition patterns
     */
    OperationTracker.prototype.analyzeRaceConditions = function (timeWindow) {
        if (timeWindow === void 0) { timeWindow = 5000; }
        var now = performance.now();
        var windowStart = now - timeWindow;
        var recentOperations = this.queryOperations({
            timeRange: { start: windowStart, end: now }
        });
        var patterns = [];
        // Detect overlapping sequential operations
        patterns.push.apply(patterns, this.detectOverlappingSequentialOperations(recentOperations));
        // Detect duplicate operations
        patterns.push.apply(patterns, this.detectDuplicateOperations(recentOperations));
        // Detect out-of-order completions
        patterns.push.apply(patterns, this.detectOutOfOrderCompletions(recentOperations));
        // Detect cascading operation chains
        patterns.push.apply(patterns, this.detectCascadingChains(recentOperations));
        return patterns;
    };
    /**
     * Generate a visual timeline of operations
     *
     * This creates a text-based timeline that makes temporal relationships
     * between operations visible, which is crucial for debugging race conditions.
     *
     * @param timeWindow - Time window to visualize
     * @returns String representation of operation timeline
     */
    OperationTracker.prototype.generateTimeline = function (timeWindow) {
        var _this = this;
        if (timeWindow === void 0) { timeWindow = 10000; }
        var now = performance.now();
        var windowStart = now - timeWindow;
        var operations = this.queryOperations({
            timeRange: { start: windowStart, end: now }
        }).sort(function (a, b) { return a.startTime - b.startTime; });
        if (operations.length === 0) {
            return 'No operations in the specified time window';
        }
        var timeline = [];
        timeline.push('🕐 Operation Timeline (Race Condition Analysis)');
        timeline.push('='.repeat(60));
        var baseTime = operations[0].startTime;
        operations.forEach(function (op) {
            var relativeStart = Math.round(op.startTime - baseTime);
            var duration = op.duration || (now - op.startTime);
            var relativeEnd = Math.round(relativeStart + duration);
            // Create visual timeline bar
            var timelineBar = _this.createTimelineBar(relativeStart, relativeEnd, timeWindow);
            var statusIcon = _this.getStatusIcon(op);
            var contextInfo = "[".concat(op.context, "]");
            timeline.push("".concat(statusIcon, " ").concat(timelineBar, " ").concat(op.description, " ").concat(contextInfo));
            // Show dependencies
            if (op.dependencies.length > 0) {
                timeline.push("   \u21B3 Depends on: ".concat(op.dependencies.join(', ')));
            }
            // Show children
            if (op.children.length > 0) {
                timeline.push("   \u21B3 Triggers: ".concat(op.children.join(', ')));
            }
        });
        // Add race condition warnings
        var raceConditions = this.analyzeRaceConditions(timeWindow);
        if (raceConditions.length > 0) {
            timeline.push('');
            timeline.push('⚠️  Race Condition Warnings:');
            timeline.push('-'.repeat(40));
            raceConditions.forEach(function (pattern) {
                timeline.push("".concat(_this.getSeverityIcon(pattern.severity), " ").concat(pattern.description));
                timeline.push("   Suggestion: ".concat(pattern.suggestion));
            });
        }
        return timeline.join('\n');
    };
    /**
     * Get comprehensive debugging report
     *
     * This method provides a complete analysis of the application's
     * operation patterns, specifically focused on race condition detection.
     *
     * @returns Detailed debugging report
     */
    OperationTracker.prototype.getDebugReport = function () {
        var allOperations = __spreadArray(__spreadArray([], Array.from(this.operations.values()), true), this.operationHistory, true);
        var activeOps = allOperations.filter(function (op) { return op.isActive; });
        var completedOps = allOperations.filter(function (op) { return op.endTime && !op.milestones.some(function (m) { return m.status === 'failed'; }); });
        var failedOps = allOperations.filter(function (op) { return op.milestones.some(function (m) { return m.status === 'failed'; }); });
        var avgDuration = completedOps.length > 0
            ? completedOps.reduce(function (sum, op) { return sum + (op.duration || 0); }, 0) / completedOps.length
            : 0;
        var raceConditions = this.analyzeRaceConditions();
        var timeline = this.generateTimeline();
        var recommendations = this.generateRecommendations(raceConditions);
        return {
            summary: {
                totalOperations: allOperations.length,
                activeOperations: activeOps.length,
                completedOperations: completedOps.length,
                failedOperations: failedOps.length,
                averageDuration: Math.round(avgDuration)
            },
            raceConditions: raceConditions,
            timeline: timeline,
            recommendations: recommendations
        };
    };
    /**
     * Clear all tracking data
     *
     * Useful for resetting the tracker during development or testing.
     */
    OperationTracker.prototype.clear = function () {
        this.operations.clear();
        this.operationHistory = [];
        this.raceConditionPatterns.length = 0;
        this.sequenceCounter = 0;
    };
    // Private helper methods
    OperationTracker.prototype.generateOperationId = function () {
        return "op_".concat(++this.sequenceCounter, "_").concat(Date.now());
    };
    OperationTracker.prototype.captureCallStack = function () {
        var stack = new Error().stack || '';
        // Remove the first few lines which are internal to this tracker
        return stack.split('\n').slice(3, 8).join('\n');
    };
    OperationTracker.prototype.moveToHistory = function (operation) {
        this.operations.delete(operation.id);
        this.operationHistory.unshift(operation);
        // Maintain circular buffer size
        if (this.operationHistory.length > this.maxHistorySize) {
            this.operationHistory = this.operationHistory.slice(0, this.maxHistorySize);
        }
    };
    OperationTracker.prototype.detectRaceConditionPatterns = function (operation) {
        // This is called after each operation start/milestone
        // Implement real-time pattern detection here
        // Example: Detect if multiple operations of the same type are running simultaneously
        var similarOperations = Array.from(this.operations.values())
            .filter(function (op) { return op.type === operation.type && op.context === operation.context && op.isActive; });
        if (similarOperations.length > 1) {
            this.recordRaceConditionPattern({
                type: 'duplicate_operations',
                severity: 'medium',
                description: "Multiple ".concat(operation.type, " operations running simultaneously in ").concat(operation.context),
                operationIds: similarOperations.map(function (op) { return op.id; }),
                detectedAt: performance.now(),
                suggestion: 'Consider debouncing or canceling previous operations before starting new ones'
            });
        }
    };
    OperationTracker.prototype.recordRaceConditionPattern = function (pattern) {
        this.raceConditionPatterns.push(pattern);
        console.warn('🚨 Race Condition Detected:', pattern);
    };
    OperationTracker.prototype.hasCircularDependency = function (opId1, opId2) {
        // Simple circular dependency check - can be enhanced for deeper analysis
        var op1 = this.operations.get(opId1);
        var op2 = this.operations.get(opId2);
        if (!op1 || !op2)
            return false;
        return op1.dependencies.includes(opId2) && op2.dependencies.includes(opId1);
    };
    OperationTracker.prototype.detectOverlappingSequentialOperations = function (operations) {
        var patterns = [];
        // Group operations by context and type
        var groups = new Map();
        operations.forEach(function (op) {
            var key = "".concat(op.context, "_").concat(op.type);
            if (!groups.has(key))
                groups.set(key, []);
            groups.get(key).push(op);
        });
        groups.forEach(function (ops, key) {
            if (ops.length < 2)
                return;
            // Sort by start time
            ops.sort(function (a, b) { return a.startTime - b.startTime; });
            // Check for overlapping operations that should be sequential
            for (var i = 0; i < ops.length - 1; i++) {
                var current = ops[i];
                var next = ops[i + 1];
                if (current.isActive && next.startTime < (current.endTime || performance.now())) {
                    patterns.push({
                        type: 'overlapping_sequential',
                        severity: 'high',
                        description: "Sequential operations overlapping: ".concat(current.description, " and ").concat(next.description),
                        operationIds: [current.id, next.id],
                        detectedAt: performance.now(),
                        suggestion: 'Ensure previous operation completes before starting the next one'
                    });
                }
            }
        });
        return patterns;
    };
    OperationTracker.prototype.detectDuplicateOperations = function (operations) {
        var patterns = [];
        var duplicateGroups = new Map();
        operations.forEach(function (op) {
            var key = "".concat(op.type, "_").concat(op.description, "_").concat(op.context);
            if (!duplicateGroups.has(key))
                duplicateGroups.set(key, []);
            duplicateGroups.get(key).push(op);
        });
        duplicateGroups.forEach(function (ops, key) {
            if (ops.length > 1) {
                var activeOps = ops.filter(function (op) { return op.isActive; });
                if (activeOps.length > 1) {
                    patterns.push({
                        type: 'duplicate_operations',
                        severity: 'medium',
                        description: "Duplicate operations detected: ".concat(ops[0].description),
                        operationIds: activeOps.map(function (op) { return op.id; }),
                        detectedAt: performance.now(),
                        suggestion: 'Implement operation deduplication or cancellation logic'
                    });
                }
            }
        });
        return patterns;
    };
    OperationTracker.prototype.detectOutOfOrderCompletions = function (operations) {
        var patterns = [];
        // Find operations with dependencies that completed out of order
        operations.forEach(function (op) {
            if (op.dependencies.length > 0 && op.endTime) {
                op.dependencies.forEach(function (depId) {
                    var dependency = operations.find(function (o) { return o.id === depId; });
                    if ((dependency === null || dependency === void 0 ? void 0 : dependency.endTime) && dependency.endTime > op.endTime) {
                        patterns.push({
                            type: 'out_of_order',
                            severity: 'high',
                            description: "Operation completed before its dependency: ".concat(op.description, " finished before ").concat(dependency.description),
                            operationIds: [op.id, depId],
                            detectedAt: performance.now(),
                            suggestion: 'Ensure proper async/await or Promise chaining for dependent operations'
                        });
                    }
                });
            }
        });
        return patterns;
    };
    OperationTracker.prototype.detectCascadingChains = function (operations) {
        var patterns = [];
        // Find long chains of operations that might indicate cascading updates
        operations.forEach(function (op) {
            if (op.children.length > 3) {
                patterns.push({
                    type: 'cascading_chain',
                    severity: 'medium',
                    description: "Long operation chain detected starting from: ".concat(op.description),
                    operationIds: __spreadArray([op.id], op.children, true),
                    detectedAt: performance.now(),
                    suggestion: 'Consider batching updates or using a state management solution to reduce cascading effects'
                });
            }
        });
        return patterns;
    };
    OperationTracker.prototype.createTimelineBar = function (start, end, totalWindow) {
        var barLength = 20;
        var startPos = Math.floor((start / totalWindow) * barLength);
        var endPos = Math.floor((end / totalWindow) * barLength);
        var bar = '·'.repeat(barLength);
        for (var i = startPos; i <= Math.min(endPos, barLength - 1); i++) {
            bar = "".concat(bar.substring(0, i), "\u2588").concat(bar.substring(i + 1));
        }
        return "[".concat(bar, "]");
    };
    OperationTracker.prototype.getStatusIcon = function (operation) {
        if (operation.isActive)
            return '🔄';
        if (operation.milestones.some(function (m) { return m.status === 'failed'; }))
            return '❌';
        if (operation.milestones.some(function (m) { return m.status === 'completed'; }))
            return '✅';
        return '⏸️';
    };
    OperationTracker.prototype.getSeverityIcon = function (severity) {
        switch (severity) {
            case 'critical': return '🚨';
            case 'high': return '⚠️';
            case 'medium': return '⚡';
            case 'low': return 'ℹ️';
            default: return '❓';
        }
    };
    OperationTracker.prototype.generateRecommendations = function (patterns) {
        var recommendations = [];
        if (patterns.some(function (p) { return p.type === 'infinite_loop'; })) {
            recommendations.push('🔄 Break circular dependencies by restructuring operation flow');
        }
        if (patterns.some(function (p) { return p.type === 'duplicate_operations'; })) {
            recommendations.push('🎯 Implement operation deduplication using request IDs or cancellation tokens');
        }
        if (patterns.some(function (p) { return p.type === 'overlapping_sequential'; })) {
            recommendations.push('⏳ Add proper async/await patterns to ensure sequential execution');
        }
        if (patterns.some(function (p) { return p.type === 'cascading_chain'; })) {
            recommendations.push('🔗 Consider batching state updates to reduce cascading effects');
        }
        if (patterns.some(function (p) { return p.type === 'out_of_order'; })) {
            recommendations.push('📋 Review Promise chains and ensure proper dependency management');
        }
        if (recommendations.length === 0) {
            recommendations.push('✅ No major race condition patterns detected');
        }
        return recommendations;
    };
    OperationTracker.prototype.logOperationStart = function (operation) {
        if (process.env.NODE_ENV === 'development') {
            console.log("\uD83D\uDE80 [".concat(operation.id, "] Started: ").concat(operation.description, " in ").concat(operation.context));
        }
    };
    OperationTracker.prototype.logMilestone = function (operation, milestone) {
        if (process.env.NODE_ENV === 'development') {
            var icon = milestone.status === 'completed' ? '✅' :
                milestone.status === 'failed' ? '❌' :
                    milestone.status === 'progress' ? '⏳' : '📍';
            console.log("".concat(icon, " [").concat(operation.id, "] ").concat(milestone.status, ": ").concat(operation.description));
        }
    };
    return OperationTracker;
}());
exports.OperationTracker = OperationTracker;
// Export singleton instance for easy access
exports.operationTracker = OperationTracker.getInstance();
