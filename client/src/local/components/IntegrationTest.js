"use strict";
/**
 * Integration Test Component
 * Tests the complete integration between frontend, backend, and database
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
exports.IntegrationTest = void 0;
var react_1 = require("react");
var unified_api_client_1 = require("../../local/services/unified-api-client");
var IntegrationTest = function () {
    var _a = (0, react_1.useState)([]), testResults = _a[0], setTestResults = _a[1];
    var _b = (0, react_1.useState)(false), isRunning = _b[0], setIsRunning = _b[1];
    var runIntegrationTests = function () { return __awaiter(void 0, void 0, void 0, function () {
        var tests, results, _i, tests_1, test, response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsRunning(true);
                    setTestResults([]);
                    tests = [
                        {
                            name: 'Database Integration Test',
                            endpoint: '/api/test/integration'
                        },
                        {
                            name: 'Properties API Test',
                            endpoint: '/api/test/properties'
                        },
                        {
                            name: 'Single Property Test',
                            endpoint: '/api/test/properties/1'
                        },
                        {
                            name: 'Properties List (Real API)',
                            endpoint: '/api/properties'
                        }
                    ];
                    results = [];
                    _i = 0, tests_1 = tests;
                    _a.label = 1;
                case 1:
                    if (!(_i < tests_1.length)) return [3 /*break*/, 6];
                    test = tests_1[_i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    console.log("Running test: ".concat(test.name));
                    return [4 /*yield*/, unified_api_client_1.apiClient.get(test.endpoint)];
                case 3:
                    response = _a.sent();
                    results.push({
                        success: response.success || false,
                        message: "".concat(test.name, ": ").concat(response.success ? 'PASSED' : 'FAILED'),
                        data: response.data,
                        error: response.error,
                        timestamp: new Date().toISOString()
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    results.push({
                        success: false,
                        message: "".concat(test.name, ": ERROR"),
                        error: error_1 instanceof Error ? error_1.message : 'Unknown error',
                        timestamp: new Date().toISOString()
                    });
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    setTestResults(results);
                    setIsRunning(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Frontend-Backend-Database Integration Test
        </h2>
        
        <div className="mb-6">
          <button onClick={runIntegrationTests} disabled={isRunning} className={"px-6 py-3 rounded-lg font-medium ".concat(isRunning
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white')}>
            {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
          </button>
        </div>
        
        {testResults.length > 0 && (<div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Test Results:</h3>
            
            {testResults.map(function (result, index) { return (<div key={index} className={"p-4 rounded-lg border-l-4 ".concat(result.success
                    ? 'bg-green-50 border-green-400'
                    : 'bg-red-50 border-red-400')}>
                <div className="flex items-center justify-between mb-2">
                  <span className={"font-medium ".concat(result.success ? 'text-green-800' : 'text-red-800')}>
                    {result.message}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {result.error && (<div className="text-red-600 text-sm mb-2">
                    Error: {result.error}
                  </div>)}
                
                {result.data && (<details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      View Response Data
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>)}
              </div>); })}
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Test Summary:</h4>
              <div className="text-sm text-blue-700">
                <div>Total Tests: {testResults.length}</div>
                <div>Passed: {testResults.filter(function (r) { return r.success; }).length}</div>
                <div>Failed: {testResults.filter(function (r) { return !r.success; }).length}</div>
                <div>Success Rate: {Math.round((testResults.filter(function (r) { return r.success; }).length / testResults.length) * 100)}%</div>
              </div>
            </div>
          </div>)}
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">What This Tests:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Database connection and basic queries</li>
            <li>• Backend API endpoints and response formatting</li>
            <li>• Frontend API client and request handling</li>
            <li>• Data serialization between layers</li>
            <li>• Error handling across the stack</li>
          </ul>
        </div>
      </div>
    </div>);
};
exports.IntegrationTest = IntegrationTest;
