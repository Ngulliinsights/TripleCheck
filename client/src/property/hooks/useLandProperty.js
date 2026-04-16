"use strict";
/**
 * Custom hook for fetching land property details
 * Provides mock data fallback for development and presentation
 */
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
exports.useLandProperty = useLandProperty;
var react_query_1 = require("@tanstack/react-query");
var mock_land_data_1 = require("../services/mock-land-data");
/**
 * Hook for fetching land property details with mock data fallback
 *
 * @deprecated This hook is deprecated in favor of useUnifiedProperty
 * Please migrate to useUnifiedProperty().useLandProperty for better error handling and consistency.
 * Migration guide: Replace useLandProperty(id) with useUnifiedProperty().useLandProperty(id)
 */
function useLandProperty(id) {
    var _this = this;
    // Add deprecation warning in development
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.warn("[DEPRECATED] useLandProperty is deprecated. Please migrate to useUnifiedProperty().useLandProperty for better error handling and consistency.");
    }
    var _a = (0, react_query_1.useQuery)({
        queryKey: ["land-property", id],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            var landData, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!id || id.trim() === "") {
                            throw new Error("Land property ID is required");
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        if (!(0, mock_land_data_1.hasMockLandProperty)(id)) return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, mock_land_data_1.fetchMockLandProperty)(id)];
                    case 2:
                        landData = _a.sent();
                        if (!landData) {
                            throw new Error("Land property with ID ".concat(id, " not found"));
                        }
                        return [2 /*return*/, landData];
                    case 3: 
                    // If no mock data exists, throw an error
                    throw new Error("Land property with ID ".concat(id, " not found in mock data"));
                    case 4:
                        err_1 = _a.sent();
                        console.error("Error fetching land property ".concat(id, ":"), err_1);
                        throw err_1;
                    case 5: return [2 /*return*/];
                }
            });
        }); },
        enabled: Boolean(id) && id.trim().length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: 1,
        retryDelay: 1000,
    }), data = _a.data, isLoading = _a.isLoading, error = _a.error;
    return {
        data: data || null,
        isLoading: isLoading,
        error: error,
        hasValidData: Boolean(data),
    };
}
