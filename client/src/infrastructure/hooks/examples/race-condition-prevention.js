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
exports.RaceConditionPreventionExample = RaceConditionPreventionExample;
exports.CleanupManagerExample = CleanupManagerExample;
exports.CombinedHooksExample = CombinedHooksExample;
var react_1 = require("react");
var index_1 = require("../index");
/**
 * Example component demonstrating race condition prevention using safe hooks
 */
function RaceConditionPreventionExample() {
    var _this = this;
    // Use coordinated state for atomic updates
    var _a = (0, index_1.useCoordinatedState)({
        id: null,
        name: '',
        email: '',
        isLoading: false,
    }), userState = _a[0], updateUserState = _a[1], _b = _a[2], batchUserUpdates = _b.batch, isPending = _b.isPending;
    // Use cleanup manager for proper resource management
    var cleanup = (0, index_1.useEnhancedCleanupManager)();
    // Safe effect that won't cause memory leaks
    (0, index_1.useSafeEffect)(function () {
        // Simulate API call with proper cleanup
        var controller = new AbortController();
        cleanup.addAbortController(controller, 'user-fetch');
        var fetchUser = function () { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 8]);
                        return [4 /*yield*/, updateUserState(function (prev) { return (__assign(__assign({}, prev), { isLoading: true })); })];
                    case 1:
                        _a.sent();
                        // Simulate API delay
                        return [4 /*yield*/, new Promise(function (resolve) {
                                cleanup.addTimeout(function () { return resolve(undefined); }, 1000, 'api-delay');
                            })];
                    case 2:
                        // Simulate API delay
                        _a.sent();
                        if (!!controller.signal.aborted) return [3 /*break*/, 4];
                        // Batch multiple state updates atomically
                        return [4 /*yield*/, batchUserUpdates([
                                function (prev) { return (__assign(__assign({}, prev), { isLoading: false })); },
                                function (prev) { return (__assign(__assign({}, prev), { id: '123', name: 'John Doe', email: 'john@example.com' })); }
                            ])];
                    case 3:
                        // Batch multiple state updates atomically
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 8];
                    case 5:
                        error_1 = _a.sent();
                        if (!!controller.signal.aborted) return [3 /*break*/, 7];
                        return [4 /*yield*/, updateUserState(function (prev) { return (__assign(__assign({}, prev), { isLoading: false })); })];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        }); };
        fetchUser();
        // Cleanup function
        return function () {
            cleanup.runCleanup('user-fetch');
            cleanup.runCleanup('api-delay');
        };
    }, []);
    // Handle user updates with coordinated state
    var handleUpdateUser = function (updates) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, updateUserState(function (prev) { return (__assign(__assign({}, prev), updates)); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Race Condition Prevention Example</h3>
      
      {isPending && (<div className="text-blue-600 mb-2">State update in progress...</div>)}
      
      {userState.isLoading ? (<div className="text-gray-600">Loading user...</div>) : (<div className="space-y-2">
          <div><strong>ID:</strong> {userState.id || 'Not loaded'}</div>
          <div><strong>Name:</strong> {userState.name || 'Not loaded'}</div>
          <div><strong>Email:</strong> {userState.email || 'Not loaded'}</div>
          
          <button onClick={function () { return handleUpdateUser({ name: 'Updated Name' }); }} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Update Name
          </button>
        </div>)}
    </div>);
}
/**
 * Example of using cleanup manager for complex async operations
 */
function CleanupManagerExample() {
    var _this = this;
    var _a = (0, react_1.useState)('idle'), status = _a[0], setStatus = _a[1];
    var cleanup = (0, index_1.useEnhancedCleanupManager)();
    var startComplexOperation = function () { return __awaiter(_this, void 0, void 0, function () {
        var intervalKey, timeoutKey, handleVisibilityChange, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setStatus('starting');
                    intervalKey = cleanup.addInterval(function () {
                        console.log('Heartbeat...');
                    }, 1000);
                    timeoutKey = cleanup.addTimeout(function () {
                        setStatus('timeout reached');
                    }, 5000);
                    handleVisibilityChange = function () {
                        if (document.hidden) {
                            setStatus('paused - tab hidden');
                        }
                        else {
                            setStatus('resumed - tab visible');
                        }
                    };
                    cleanup.addEventListener(document, 'visibilitychange', handleVisibilityChange);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    setStatus('working');
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                case 2:
                    _a.sent();
                    setStatus('completed');
                    // Clean up specific operations
                    cleanup.runCleanup(intervalKey);
                    cleanup.runCleanup(timeoutKey);
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    setStatus('error');
                    cleanup.runAllCleanup();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var stopOperation = function () {
        cleanup.runAllCleanup();
        setStatus('stopped');
    };
    return (<div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Cleanup Manager Example</h3>
      
      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>
      
      <div className="space-x-2">
        <button onClick={startComplexOperation} disabled={status !== 'idle' && status !== 'completed' && status !== 'stopped'} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
          Start Operation
        </button>
        
        <button onClick={stopOperation} disabled={status === 'idle' || status === 'stopped'} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50">
          Stop Operation
        </button>
      </div>
    </div>);
}
/**
 * Combined example showing all hooks working together
 */
function CombinedHooksExample() {
    return (<div className="space-y-6 p-6">
      <h2 className="text-xl font-bold">Safe Hooks Examples</h2>
      <RaceConditionPreventionExample />
      <CleanupManagerExample />
    </div>);
}
