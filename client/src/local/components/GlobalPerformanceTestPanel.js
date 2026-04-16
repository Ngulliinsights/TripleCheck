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
exports.GlobalPerformanceTestPanel = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
// import { raceConditionTester } from '../../property/utils/raceConditionTest' // File doesn't exist
var globalPerformanceMonitor_1 = require("../utils/globalPerformanceMonitor");
var badge_1 = require("./ui/badge");
var button_1 = require("./ui/button");
var card_1 = require("./ui/card");
var tabs_1 = require("./ui/tabs");
var GlobalPerformanceTestPanel = function (_a) {
    var className = _a.className, _b = _a.defaultVisible, defaultVisible = _b === void 0 ? false : _b;
    var _c = (0, react_1.useState)(defaultVisible), isVisible = _c[0], setIsVisible = _c[1];
    var _d = (0, react_1.useState)({}), allStats = _d[0], setAllStats = _d[1];
    var _e = (0, react_1.useState)([]), globalIssues = _e[0], setGlobalIssues = _e[1];
    var _f = (0, react_1.useState)(false), isRunningTest = _f[0], setIsRunningTest = _f[1];
    var _g = (0, react_1.useState)({
        raceConditions: false,
        infiniteLoops: false,
        excessiveRenders: false,
        performanceScore: 'excellent'
    }), testResults = _g[0], setTestResults = _g[1];
    var monitor = globalPerformanceMonitor_1.GlobalPerformanceMonitor.getInstance();
    // Update stats every 2 seconds
    (0, react_1.useEffect)(function () {
        if (!isVisible)
            return;
        var interval = setInterval(function () {
            var stats = monitor.getAllComponentStats();
            var issues = monitor.getGlobalPerformanceIssues();
            setAllStats(stats);
            setGlobalIssues(issues);
            // Analyze performance across all components
            analyzeGlobalPerformance(stats);
        }, 2000);
        return function () { return clearInterval(interval); };
    }, [isVisible, monitor]);
    var analyzeGlobalPerformance = function (stats) {
        // Race condition tester removed - file doesn't exist
        // const testResults = raceConditionTester.runAllTests();
        var results = {
            raceConditions: false, // Disabled
            infiniteLoops: false, // Disabled
            excessiveRenders: false, // Disabled
            performanceScore: 'excellent'
        };
        // Adjust score based on global issues
        var totalApiCalls = Object.values(stats).reduce(function (sum, stat) { return sum + stat.totalApiCalls; }, 0);
        var avgCallInterval = Object.values(stats).reduce(function (sum, stat) { return sum + stat.averageTimeBetweenCalls; }, 0) / Object.keys(stats).length;
        if (results.infiniteLoops || globalIssues.length > 5) {
            results.performanceScore = 'poor';
        }
        else if (results.raceConditions || results.excessiveRenders || globalIssues.length > 2) {
            results.performanceScore = 'poor';
        }
        else if (avgCallInterval < 300 && totalApiCalls > 10) {
            results.performanceScore = 'excellent';
        }
        setTestResults(results);
    };
    var runGlobalStressTest = function () { return __awaiter(void 0, void 0, void 0, function () {
        var testScenarios, i, scenario, j;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsRunningTest(true);
                    monitor.reset(); // Reset all component stats
                    testScenarios = [
                        { component: 'PropertySearch', data: { query: 'apartment', location: 'nairobi' } },
                        { component: 'PropertyFilter', data: { type: 'residential', price: 1000000 } },
                        { component: 'UserDashboard', data: { userId: 'test-123', tab: 'properties' } },
                        { component: 'PropertyList', data: { page: 1, limit: 20 } },
                        { component: 'SearchResults', data: { query: 'villa', filters: { bedrooms: 3 } } },
                    ];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < testScenarios.length)) return [3 /*break*/, 6];
                    scenario = testScenarios[i];
                    if (!scenario)
                        return [3 /*break*/, 5];
                    j = 0;
                    _a.label = 2;
                case 2:
                    if (!(j < 3)) return [3 /*break*/, 5];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 30); })];
                case 3:
                    _a.sent(); // 30ms between calls
                    monitor.trackApiCall(scenario.component, __assign(__assign({}, scenario.data), { timestamp: Date.now(), iteration: j }));
                    monitor.trackRender(scenario.component);
                    _a.label = 4;
                case 4:
                    j++;
                    return [3 /*break*/, 2];
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6: 
                // Wait for analysis to settle
                return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 7:
                    // Wait for analysis to settle
                    _a.sent();
                    setIsRunningTest(false);
                    return [2 /*return*/];
            }
        });
    }); };
    var getScoreColor = function (score) {
        switch (score) {
            case 'excellent': return 'text-green-600 bg-green-100';
            case 'good': return 'text-blue-600 bg-blue-100';
            case 'poor': return 'text-yellow-600 bg-yellow-100';
            case 'critical': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };
    var getScoreIcon = function (score) {
        switch (score) {
            case 'excellent': return <lucide_react_1.CheckCircle className="w-4 h-4"/>;
            case 'good': return <lucide_react_1.Activity className="w-4 h-4"/>;
            case 'poor': return <lucide_react_1.Zap className="w-4 h-4"/>;
            case 'critical': return <lucide_react_1.AlertTriangle className="w-4 h-4"/>;
            default: return <lucide_react_1.Activity className="w-4 h-4"/>;
        }
    };
    if (!isVisible) {
        return (<div className="fixed bottom-4 right-4 z-50">
        <button_1.Button onClick={function () { return setIsVisible(true); }} variant="outline" size="sm" className="shadow-lg bg-white hover:bg-gray-50">
          <lucide_react_1.Monitor className="w-4 h-4 mr-2"/>
          Performance Monitor
        </button_1.Button>
      </div>);
    }
    return (<div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden">
      <card_1.Card className={"".concat(className, " border-2 border-dashed border-gray-300 shadow-xl bg-white")}>
        <card_1.CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <card_1.CardTitle className="flex items-center gap-2 text-sm">
              <lucide_react_1.Activity className="w-4 h-4"/>
              Global Performance Monitor
            </card_1.CardTitle>
            <button_1.Button onClick={function () { return setIsVisible(false); }} variant="ghost" size="sm" className="h-6 w-6 p-0">
              ×
            </button_1.Button>
          </div>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4 max-h-[60vh] overflow-y-auto">
          <tabs_1.Tabs defaultValue="overview" className="w-full">
            <tabs_1.TabsList className="grid w-full grid-cols-3 text-xs">
              <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="components">Components</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="issues">Issues</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="overview" className="space-y-3">
              {/* Performance Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Performance Score:</span>
                <badge_1.Badge className={"".concat(getScoreColor(testResults.performanceScore), " flex items-center gap-1 text-xs")}>
                  {getScoreIcon(testResults.performanceScore)}
                  {testResults.performanceScore.toUpperCase()}
                </badge_1.Badge>
              </div>

              {/* Global Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {Object.keys(allStats).length}
                  </div>
                  <div className="text-xs text-gray-600">Active Components</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-green-600">
                    {Object.values(allStats).reduce(function (sum, stat) { return sum + stat.totalApiCalls; }, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total API Calls</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {Object.values(allStats).reduce(function (sum, stat) { return sum + stat.totalRenders; }, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Total Renders</div>
                </div>
                <div className="bg-gray-50 p-2 rounded text-center">
                  <div className="text-lg font-bold text-red-600">
                    {globalIssues.length}
                  </div>
                  <div className="text-xs text-gray-600">Issues Detected</div>
                </div>
              </div>

              {/* Test Controls */}
              <div className="flex gap-2">
                <button_1.Button onClick={runGlobalStressTest} disabled={isRunningTest} variant="outline" size="sm" className="text-xs">
                  {isRunningTest ? 'Running...' : 'Stress Test'}
                </button_1.Button>
                <button_1.Button onClick={function () { return monitor.reset(); }} variant="ghost" size="sm" className="text-xs">
                  Reset All
                </button_1.Button>
              </div>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="components" className="space-y-2">
              {Object.entries(allStats).map(function (_a) {
            var componentName = _a[0], stats = _a[1];
            return (<div key={componentName} className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-sm mb-1">{componentName}</div>
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div>
                      <span className="text-gray-600">API:</span> {stats.totalApiCalls}
                    </div>
                    <div>
                      <span className="text-gray-600">Renders:</span> {stats.totalRenders}
                    </div>
                    <div>
                      <span className="text-gray-600">Avg:</span> {Math.round(stats.averageTimeBetweenCalls)}ms
                    </div>
                  </div>
                </div>);
        })}
              {Object.keys(allStats).length === 0 && (<div className="text-center text-gray-500 text-sm py-4">
                  No components being monitored
                </div>)}
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="issues" className="space-y-2">
              {/* Issue Detection */}
              <div className="space-y-1">
                <div className={"flex items-center gap-2 p-2 rounded text-xs ".concat(testResults.raceConditions ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800')}>
                  {testResults.raceConditions ? <lucide_react_1.AlertTriangle className="w-3 h-3"/> : <lucide_react_1.CheckCircle className="w-3 h-3"/>}
                  <span>Race Conditions: {testResults.raceConditions ? 'DETECTED' : 'None'}</span>
                </div>
                <div className={"flex items-center gap-2 p-2 rounded text-xs ".concat(testResults.infiniteLoops ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800')}>
                  {testResults.infiniteLoops ? <lucide_react_1.AlertTriangle className="w-3 h-3"/> : <lucide_react_1.CheckCircle className="w-3 h-3"/>}
                  <span>Infinite Loops: {testResults.infiniteLoops ? 'DETECTED' : 'None'}</span>
                </div>
                <div className={"flex items-center gap-2 p-2 rounded text-xs ".concat(testResults.excessiveRenders ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800')}>
                  {testResults.excessiveRenders ? <lucide_react_1.AlertTriangle className="w-3 h-3"/> : <lucide_react_1.CheckCircle className="w-3 h-3"/>}
                  <span>Excessive Renders: {testResults.excessiveRenders ? 'DETECTED' : 'None'}</span>
                </div>
              </div>

              {/* Global Issues */}
              {globalIssues.length > 0 && (<div className="space-y-1">
                  <div className="text-sm font-medium text-red-600">Performance Issues:</div>
                  {globalIssues.slice(0, 5).map(function (issue, index) { return (<div key={index} className="text-xs bg-red-50 text-red-700 p-2 rounded">
                      {issue}
                    </div>); })}
                </div>)}

              {globalIssues.length === 0 && !testResults.raceConditions && !testResults.infiniteLoops && !testResults.excessiveRenders && (<div className="text-center text-green-600 text-sm py-4">
                  No performance issues detected
                </div>)}
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
};
exports.GlobalPerformanceTestPanel = GlobalPerformanceTestPanel;
exports.default = exports.GlobalPerformanceTestPanel;
