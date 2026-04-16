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
exports.default = ScenarioModelingTool;
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var label_1 = require("../../local/components/ui/label");
var select_1 = require("../../local/components/ui/select");
var slider_1 = require("../../local/components/ui/slider");
var tabs_1 = require("../../local/components/ui/tabs");
var textarea_1 = require("../../local/components/ui/textarea");
var utils_1 = require("../../local/lib/utils");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var PREDEFINED_SCENARIOS = [
    {
        id: 'mitigation-complete',
        name: 'Full Mitigation Implementation',
        description: 'All recommended mitigation measures are successfully implemented',
        timeframe: '90d',
        assumptions: [
            'All expert recommendations are followed',
            'Legal issues are resolved through proper channels',
            'Government designations are clarified',
            'Physical verification confirms documentation'
        ]
    },
    {
        id: 'worst-case',
        name: 'Worst Case Scenario',
        description: 'Multiple risk factors escalate simultaneously',
        timeframe: '1y',
        assumptions: [
            'Legal disputes escalate to court proceedings',
            'Government claims are enforced',
            'Community opposition intensifies',
            'Market conditions deteriorate'
        ]
    },
    {
        id: 'partial-resolution',
        name: 'Partial Risk Resolution',
        description: 'Some risks are mitigated while others remain',
        timeframe: '90d',
        assumptions: [
            'Major legal issues are resolved',
            'Some government designations remain unclear',
            'Community concerns are partially addressed',
            'Physical verification shows minor discrepancies'
        ]
    }
];
function ScenarioModelingTool(_a) {
    var _this = this;
    var baselineRiskFactors = _a.baselineRiskFactors, onRunScenario = _a.onRunScenario, onSaveScenario = _a.onSaveScenario, className = _a.className;
    var _b = (0, react_1.useState)('builder'), activeTab = _b[0], setActiveTab = _b[1];
    var _c = (0, react_1.useState)({
        id: "scenario-".concat(Date.now()),
        name: '',
        description: '',
        modifications: [],
        timeframe: '90d',
        assumptions: []
    }), currentScenario = _c[0], setCurrentScenario = _c[1];
    var _d = (0, react_1.useState)([]), scenarioResults = _d[0], setScenarioResults = _d[1];
    var _e = (0, react_1.useState)(false), isRunning = _e[0], setIsRunning = _e[1];
    var _f = (0, react_1.useState)(''), newAssumption = _f[0], setNewAssumption = _f[1];
    var baselineRiskScore = (0, react_1.useMemo)(function () {
        if (baselineRiskFactors.length === 0)
            return 0;
        var totalImpact = baselineRiskFactors.reduce(function (sum, factor) { return sum + factor.impact; }, 0);
        return (totalImpact / baselineRiskFactors.length) * 10; // Scale to 0-100
    }, [baselineRiskFactors]);
    var handleAddModification = function (factorId) {
        var factor = baselineRiskFactors.find(function (f) { return f.id === factorId; });
        if (!factor)
            return;
        var newModification = {
            factorId: factorId,
            type: 'impact_change',
            originalValue: factor.impact,
            newValue: factor.impact,
            description: "Modify ".concat(factor.category, " risk factor")
        };
        setCurrentScenario(function (prev) { return (__assign(__assign({}, prev), { modifications: __spreadArray(__spreadArray([], prev.modifications, true), [newModification], false) })); });
    };
    var handleUpdateModification = function (index, updates) {
        setCurrentScenario(function (prev) { return (__assign(__assign({}, prev), { modifications: prev.modifications.map(function (mod, i) {
                return i === index ? __assign(__assign({}, mod), updates) : mod;
            }) })); });
    };
    var handleRemoveModification = function (index) {
        setCurrentScenario(function (prev) { return (__assign(__assign({}, prev), { modifications: prev.modifications.filter(function (_, i) { return i !== index; }) })); });
    };
    var handleAddAssumption = function () {
        if (newAssumption.trim()) {
            setCurrentScenario(function (prev) { return (__assign(__assign({}, prev), { assumptions: __spreadArray(__spreadArray([], prev.assumptions, true), [newAssumption.trim()], false) })); });
            setNewAssumption('');
        }
    };
    var handleRemoveAssumption = function (index) {
        setCurrentScenario(function (prev) { return (__assign(__assign({}, prev), { assumptions: prev.assumptions.filter(function (_, i) { return i !== index; }) })); });
    };
    var handleRunScenario = function () { return __awaiter(_this, void 0, void 0, function () {
        var result_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!currentScenario.name.trim()) {
                        alert('Please provide a scenario name');
                        return [2 /*return*/];
                    }
                    setIsRunning(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, onRunScenario(currentScenario)];
                case 2:
                    result_1 = _a.sent();
                    setScenarioResults(function (prev) { return __spreadArray([result_1], prev.slice(0, 4), true); }); // Keep last 5 results
                    setActiveTab('results');
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to run scenario:', error_1);
                    return [3 /*break*/, 5];
                case 4:
                    setIsRunning(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleLoadPredefinedScenario = function (predefined) {
        var modifications = [];
        // Generate modifications based on scenario type
        if (predefined.id === 'mitigation-complete') {
            baselineRiskFactors.forEach(function (factor) {
                if (factor.severity === 'high' || factor.severity === 'critical') {
                    modifications.push({
                        factorId: factor.id,
                        type: 'mitigation_applied',
                        originalValue: factor.impact,
                        newValue: Math.max(1, factor.impact - 3),
                        description: "Apply mitigation for ".concat(factor.category, " risk")
                    });
                }
            });
        }
        else if (predefined.id === 'worst-case') {
            baselineRiskFactors.forEach(function (factor) {
                if (factor.impact < 8) {
                    modifications.push({
                        factorId: factor.id,
                        type: 'impact_change',
                        originalValue: factor.impact,
                        newValue: Math.min(10, factor.impact + 2),
                        description: "Escalation of ".concat(factor.category, " risk")
                    });
                }
            });
        }
        else if (predefined.id === 'partial-resolution') {
            baselineRiskFactors.forEach(function (factor, index) {
                if (index % 2 === 0 && factor.impact > 3) {
                    modifications.push({
                        factorId: factor.id,
                        type: 'mitigation_applied',
                        originalValue: factor.impact,
                        newValue: Math.max(1, factor.impact - 2),
                        description: "Partial mitigation of ".concat(factor.category, " risk")
                    });
                }
            });
        }
        setCurrentScenario({
            id: "scenario-".concat(Date.now()),
            name: predefined.name,
            description: predefined.description,
            modifications: modifications,
            timeframe: predefined.timeframe,
            assumptions: __spreadArray([], predefined.assumptions, true)
        });
    };
    var getSeverityColor = function (severity) {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-green-600 bg-green-50 border-green-200';
        }
    };
    var ModificationCard = function (_a) {
        var modification = _a.modification, index = _a.index;
        var factor = baselineRiskFactors.find(function (f) { return f.id === modification.factorId; });
        if (!factor)
            return null;
        return (<card_1.Card>
        <card_1.CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{factor.category}</h4>
              <p className="text-xs text-muted-foreground">{modification.description}</p>
            </div>
            <button_1.Button variant="ghost" size="sm" onClick={function () { return handleRemoveModification(index); }}>
              <lucide_react_1.Minus className="h-4 w-4"/>
            </button_1.Button>
          </div>

          <div className="space-y-3">
            <div>
              <label_1.Label className="text-xs">Modification Type</label_1.Label>
              <select_1.Select value={modification.type} onValueChange={function (value) { return handleUpdateModification(index, { type: value }); }}>
                <select_1.SelectTrigger className="h-8">
                  <select_1.SelectValue />
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="severity_change">Severity Change</select_1.SelectItem>
                  <select_1.SelectItem value="impact_change">Impact Change</select_1.SelectItem>
                  <select_1.SelectItem value="likelihood_change">Likelihood Change</select_1.SelectItem>
                  <select_1.SelectItem value="mitigation_applied">Mitigation Applied</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            <div>
              <label_1.Label className="text-xs">
                New Value: {modification.newValue}/10
              </label_1.Label>
              <slider_1.Slider value={[modification.newValue]} onValueChange={function (_a) {
            var value = _a[0];
            return handleUpdateModification(index, { newValue: value });
        }} max={10} min={1} step={0.5} className="mt-1"/>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Original: {modification.originalValue}</span>
                <span>Change: {(modification.newValue - modification.originalValue).toFixed(1)}</span>
              </div>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    };
    var ScenarioResultCard = function (_a) {
        var result = _a.result;
        var riskChange = result.impactAnalysis.riskChange;
        var isImprovement = riskChange < 0;
        return (<card_1.Card>
        <card_1.CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Scenario Result</h4>
            <badge_1.Badge className={(0, utils_1.cn)('text-xs', isImprovement
                ? 'text-green-600 bg-green-50 border-green-200'
                : 'text-red-600 bg-red-50 border-red-200')}>
              {isImprovement ? 'Risk Reduced' : 'Risk Increased'}
            </badge_1.Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-bold">{Math.round(result.projectedRiskScore)}</div>
              <div className="text-xs text-muted-foreground">Projected Score</div>
            </div>
            <div className="text-center">
              <div className={(0, utils_1.cn)('text-lg font-bold flex items-center justify-center gap-1', isImprovement ? 'text-green-600' : 'text-red-600')}>
                {isImprovement ? (<lucide_react_1.TrendingDown className="h-4 w-4"/>) : (<lucide_react_1.TrendingUp className="h-4 w-4"/>)}
                {Math.abs(riskChange).toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">Risk Change</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold">
                {Math.round(result.impactAnalysis.confidenceLevel * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Confidence</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium">Key Recommendations:</div>
            {result.recommendations.slice(0, 2).map(function (rec, index) { return (<div key={index} className="text-xs text-muted-foreground">
                • {rec.title}
              </div>); })}
            {result.recommendations.length > 2 && (<div className="text-xs text-blue-600">
                +{result.recommendations.length - 2} more recommendations
              </div>)}
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    };
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Calculator className="h-5 w-5"/>
              Scenario Modeling & What-If Analysis
            </card_1.CardTitle>
            <card_1.CardDescription>
              Model different scenarios to understand potential risk changes
            </card_1.CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button_1.Button variant="outline" size="sm" onClick={function () { return setCurrentScenario({
            id: "scenario-".concat(Date.now()),
            name: '',
            description: '',
            modifications: [],
            timeframe: '90d',
            assumptions: []
        }); }}>
              <lucide_react_1.RotateCcw className="h-4 w-4"/>
              Reset
            </button_1.Button>
            <button_1.Button variant="outline" size="sm" onClick={function () { return onSaveScenario(currentScenario); }} disabled={!currentScenario.name.trim()}>
              <lucide_react_1.Save className="h-4 w-4"/>
              Save
            </button_1.Button>
          </div>
        </div>

        {/* Baseline Risk Display */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Baseline Risk Score</div>
              <div className="text-xs text-muted-foreground">
                Based on {baselineRiskFactors.length} risk factors
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{Math.round(baselineRiskScore)}/100</div>
              <div className="text-xs text-muted-foreground">Current Assessment</div>
            </div>
          </div>
        </div>
      </card_1.CardHeader>

      <card_1.CardContent>
        <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
          <tabs_1.TabsList className="grid w-full grid-cols-3">
            <tabs_1.TabsTrigger value="builder">Scenario Builder</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="predefined">Templates</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="results">Results</tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          <tabs_1.TabsContent value="builder" className="space-y-6">
            {/* Scenario Configuration */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-base">Scenario Configuration</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label_1.Label>Scenario Name</label_1.Label>
                    <input_1.Input value={currentScenario.name} onChange={function (e) { return setCurrentScenario(function (prev) { return (__assign(__assign({}, prev), { name: e.target.value })); }); }} placeholder="Enter scenario name"/>
                  </div>
                  <div>
                    <label_1.Label>Timeframe</label_1.Label>
                    <select_1.Select value={currentScenario.timeframe} onValueChange={function (value) { return setCurrentScenario(function (prev) { return (__assign(__assign({}, prev), { timeframe: value })); }); }}>
                      <select_1.SelectTrigger>
                        <select_1.SelectValue />
                      </select_1.SelectTrigger>
                      <select_1.SelectContent>
                        <select_1.SelectItem value="30d">30 Days</select_1.SelectItem>
                        <select_1.SelectItem value="90d">90 Days</select_1.SelectItem>
                        <select_1.SelectItem value="1y">1 Year</select_1.SelectItem>
                        <select_1.SelectItem value="5y">5 Years</select_1.SelectItem>
                      </select_1.SelectContent>
                    </select_1.Select>
                  </div>
                </div>

                <div>
                  <label_1.Label>Description</label_1.Label>
                  <textarea_1.Textarea value={currentScenario.description} onChange={function (e) { return setCurrentScenario(function (prev) { return (__assign(__assign({}, prev), { description: e.target.value })); }); }} placeholder="Describe the scenario and its key assumptions" rows={3}/>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Risk Factor Modifications */}
            <card_1.Card>
              <card_1.CardHeader>
                <div className="flex items-center justify-between">
                  <card_1.CardTitle className="text-base">Risk Factor Modifications</card_1.CardTitle>
                  <select_1.Select onValueChange={function (value) { return handleAddModification(parseInt(value)); }}>
                    <select_1.SelectTrigger className="w-48">
                      <select_1.SelectValue placeholder="Add modification"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {baselineRiskFactors.map(function (factor) { return (<select_1.SelectItem key={factor.id} value={factor.id.toString()}>
                          {factor.category} - {factor.severity}
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </card_1.CardHeader>
              <card_1.CardContent>
                {currentScenario.modifications.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentScenario.modifications.map(function (modification, index) { return (<ModificationCard key={index} modification={modification} index={index}/>); })}
                  </div>) : (<div className="text-center py-8 text-muted-foreground">
                    <lucide_react_1.Settings className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                    <p>No modifications added yet</p>
                    <p className="text-sm">Select risk factors above to modify them in this scenario</p>
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>

            {/* Assumptions */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-base">Scenario Assumptions</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div className="flex gap-2">
                  <input_1.Input value={newAssumption} onChange={function (e) { return setNewAssumption(e.target.value); }} placeholder="Add an assumption about this scenario" onKeyPress={function (e) { return e.key === 'Enter' && handleAddAssumption(); }}/>
                  <button_1.Button onClick={handleAddAssumption} size="sm">
                    <lucide_react_1.Plus className="h-4 w-4"/>
                  </button_1.Button>
                </div>

                {currentScenario.assumptions.length > 0 && (<div className="space-y-2">
                    {currentScenario.assumptions.map(function (assumption, index) { return (<div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <span className="text-sm">{assumption}</span>
                        <button_1.Button variant="ghost" size="sm" onClick={function () { return handleRemoveAssumption(index); }}>
                          <lucide_react_1.Minus className="h-4 w-4"/>
                        </button_1.Button>
                      </div>); })}
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>

            {/* Run Scenario */}
            <div className="flex justify-center">
              <button_1.Button onClick={handleRunScenario} disabled={isRunning || !currentScenario.name.trim()} size="lg">
                <lucide_react_1.Play className={(0, utils_1.cn)('h-4 w-4 mr-2', isRunning && 'animate-pulse')}/>
                {isRunning ? 'Running Analysis...' : 'Run Scenario Analysis'}
              </button_1.Button>
            </div>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="predefined" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PREDEFINED_SCENARIOS.map(function (scenario) { return (<card_1.Card key={scenario.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <card_1.CardContent className="p-4">
                    <h4 className="font-medium mb-2">{scenario.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                    <div className="flex items-center justify-between">
                      <badge_1.Badge variant="outline" className="text-xs">
                        {scenario.timeframe}
                      </badge_1.Badge>
                      <button_1.Button size="sm" onClick={function () { return handleLoadPredefinedScenario(scenario); }}>
                        Load Template
                      </button_1.Button>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>); })}
            </div>
          </tabs_1.TabsContent>

          <tabs_1.TabsContent value="results" className="space-y-6">
            {scenarioResults.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scenarioResults.map(function (result, index) { return (<ScenarioResultCard key={index} result={result}/>); })}
              </div>) : (<div className="text-center py-12 text-muted-foreground">
                <lucide_react_1.BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50"/>
                <h3 className="text-lg font-semibold mb-2">No Scenario Results Yet</h3>
                <p className="mb-4">
                  Create and run scenarios to see projected risk analysis results
                </p>
                <button_1.Button onClick={function () { return setActiveTab('builder'); }}>
                  Create Scenario
                </button_1.Button>
              </div>)}
          </tabs_1.TabsContent>
        </tabs_1.Tabs>
      </card_1.CardContent>
    </card_1.Card>);
}
