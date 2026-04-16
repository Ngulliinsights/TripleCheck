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
exports.useOptimisticMutation = useOptimisticMutation;
var react_query_1 = require("@tanstack/react-query");
var react_1 = require("react");
/**
 * Custom hook for optimistic mutations that prevent race conditions
 * and provide better UX with optimistic updates
 *
 * This hook automatically handles:
 * - Canceling outgoing queries to prevent race conditions
 * - Applying optimistic updates immediately for better perceived performance
 * - Rolling back changes on error
 * - Refetching data after completion to ensure consistency
 */
function useOptimisticMutation(options) {
    var _this = this;
    var queryClient = (0, react_query_1.useQueryClient)();
    // Use refs to store the latest callback references to avoid stale closures
    var onErrorRef = (0, react_1.useRef)(options.onError);
    var onSettledRef = (0, react_1.useRef)(options.onSettled);
    var optimisticUpdateRef = (0, react_1.useRef)(options.optimisticUpdate);
    // Update refs whenever options change
    (0, react_1.useEffect)(function () {
        onErrorRef.current = options.onError;
        onSettledRef.current = options.onSettled;
        optimisticUpdateRef.current = options.optimisticUpdate;
    });
    // Create the onMutate function that handles optimistic updates
    var handleMutate = (0, react_1.useCallback)(function (variables) { return __awaiter(_this, void 0, void 0, function () {
        var previousData, originalContext;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // Cancel any outgoing re-fetches to prevent race conditions
                return [4 /*yield*/, queryClient.cancelQueries({ queryKey: options.queryKey })];
                case 1:
                    // Cancel any outgoing re-fetches to prevent race conditions
                    _b.sent();
                    previousData = queryClient.getQueryData(options.queryKey);
                    // Apply optimistic update if provided
                    if (optimisticUpdateRef.current) {
                        queryClient.setQueryData(options.queryKey, function (old) {
                            return optimisticUpdateRef.current(old, variables);
                        });
                    }
                    return [4 /*yield*/, ((_a = options.onMutate) === null || _a === void 0 ? void 0 : _a.call(options, variables))];
                case 2:
                    originalContext = _b.sent();
                    // Return combined context with previous data for rollback capability
                    return [2 /*return*/, __assign({ previousData: previousData }, (originalContext || {}))];
            }
        });
    }); }, [queryClient, options.queryKey, options.onMutate]);
    // Create the main mutation with our custom onMutate
    var mutation = (0, react_query_1.useMutation)(__assign(__assign({}, options), { onMutate: handleMutate }));
    // Handle error scenarios with rollback functionality
    (0, react_1.useEffect)(function () {
        if (mutation.isError && mutation.error && onErrorRef.current) {
            // Execute the error callback
            onErrorRef.current(mutation.error, mutation.variables, mutation.context);
            // Roll back optimistic update on error
            var context = mutation.context;
            if ((context === null || context === void 0 ? void 0 : context.previousData) !== undefined) {
                queryClient.setQueryData(options.queryKey, context.previousData);
            }
        }
    }, [
        mutation.isError,
        mutation.error,
        mutation.variables,
        mutation.context,
        queryClient,
        options.queryKey
    ]);
    // Handle completion scenarios (both success and error)
    (0, react_1.useEffect)(function () {
        if (mutation.isSuccess || mutation.isError) {
            // Always invalidate queries after completion to ensure data consistency
            queryClient.invalidateQueries({ queryKey: options.queryKey });
            // Execute settled callback if provided
            if (onSettledRef.current) {
                onSettledRef.current(mutation.data, mutation.error, mutation.variables, mutation.context);
            }
        }
    }, [
        mutation.isSuccess,
        mutation.isError,
        mutation.data,
        mutation.error,
        mutation.variables,
        mutation.context,
        queryClient,
        options.queryKey
    ]);
    return mutation;
}
