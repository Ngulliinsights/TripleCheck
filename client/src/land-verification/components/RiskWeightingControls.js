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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RiskWeightingControls;
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var slider_1 = require("../../local/components/ui/slider");
var utils_1 = require("../../local/lib/utils");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var DEFAULT_WEIGHT_CONFIGS = [
    {
        category: 'ownership',
        weight: 0.3,
        label: 'Ownership Verification',
        description: 'Title deeds, ownership history, and transfer legitimacy',
        color: '#3b82f6',
        recommendedRange: [0.25, 0.35]
    },
    {
        category: 'government',
        weight: 0.25,
        label: 'Government Designations',
        description: 'Government claims, planned developments, and regulatory restrictions',
        color: '#8b5cf6',
        recommendedRange: [0.2, 0.3]
    },
    {
        category: 'legal',
        weight: 0.2,
        label: 'Legal History',
        description: 'Court cases, disputes, and legal complications',
        color: '#ef4444',
        recommendedRange: [0.15, 0.25]
    },
    {
        category: 'physical',
        weight: 0.15,
        label: 'Physical Verification',
        description: 'Ground-truthing, boundary verification, and physical features',
        color: '#10b981',
        recommendedRange: [0.1, 0.2]
    },
    {
        category: 'community',
        weight: 0.1,
        label: 'Community Intelligence',
        description: 'Local knowledge, community feedback, and social factors',
        color: '#f59e0b',
        recommendedRange: [0.05, 0.15]
    }
];
function RiskWeightingControls(_a) {
    var currentWeights = _a.currentWeights, onWeightsChange = _a.onWeightsChange, onResetWeights = _a.onResetWeights, className = _a.className;
    var _b = (0, react_1.useState)(currentWeights), localWeights = _b[0], setLocalWeights = _b[1];
    var _c = (0, react_1.useState)(false), hasUnsavedChanges = _c[0], setHasUnsavedChanges = _c[1];
    (0, react_1.useEffect)(function () {
        setLocalWeights(currentWeights);
        setHasUnsavedChanges(false);
    }, [currentWeights]);
    var totalWeight = Object.values(localWeights).reduce(function (sum, weight) { return sum + weight; }, 0);
    var isValidWeightDistribution = Math.abs(totalWeight - 1.0) < 0.01;
    var handleWeightChange = function (category, newWeight) {
        var _a;
        var updatedWeights = __assign(__assign({}, localWeights), (_a = {}, _a[category] = newWeight / 100 // Convert percentage to decimal
        , _a));
        setLocalWeights(updatedWeights);
        setHasUnsavedChanges(true);
    };
    var handleSaveWeights = function () {
        if (isValidWeightDistribution) {
            onWeightsChange(localWeights);
            setHasUnsavedChanges(false);
        }
    };
    var handleResetWeights = function () {
        onResetWeights();
        setHasUnsavedChanges(false);
    };
    var normalizeWeights = function () {
        var total = Object.values(localWeights).reduce(function (sum, weight) { return sum + weight; }, 0);
        if (total === 0)
            return;
        var normalizedWeights = Object.keys(localWeights).reduce(function (acc, key) {
            acc[key] = localWeights[key] / total;
            return acc;
        }, {});
        setLocalWeights(normalizedWeights);
        setHasUnsavedChanges(true);
    };
    var getWeightStatus = function (category, weight) {
        var config = DEFAULT_WEIGHT_CONFIGS.find(function (c) { return c.category === category; });
        if (!config)
            return 'optimal';
        var _a = config.recommendedRange, min = _a[0], max = _a[1];
        if (weight < min)
            return 'low';
        if (weight > max)
            return 'high';
        return 'optimal';
    };
    var getStatusColor = function (status) {
        switch (status) {
            case 'optimal': return 'text-green-600 bg-green-50 border-green-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };
    var WeightSlider = function (_a) {
        var config = _a.config;
        var currentWeight = localWeights[config.category] || 0;
        var weightPercentage = currentWeight * 100;
        var status = getWeightStatus(config.category, currentWeight);
        var _b = config.recommendedRange, minRec = _b[0], maxRec = _b[1];
        return (<card_1.Card>
        <card_1.CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }}/>
                <h4 className="font-medium text-sm">{config.label}</h4>
              </div>
              <div className="flex items-center gap-2">
                <badge_1.Badge className={(0, utils_1.cn)('text-xs', getStatusColor(status))}>
                  {status}
                </badge_1.Badge>
                <span className="text-sm font-medium">{weightPercentage.toFixed(1)}%</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{config.description}</p>

            <div className="space-y-2">
              <slider_1.Slider value={[weightPercentage]} onValueChange={function (_a) {
            var value = _a[0];
            return handleWeightChange(config.category, value);
        }} max={50} min={0} step={1} className="w-full"/>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="text-center">
                  Recommended: {(minRec * 100).toFixed(0)}%-{(maxRec * 100).toFixed(0)}%
                </span>
                <span>50%</span>
              </div>
            </div>

            {/* Visual indicator for recommended range */}
            <div className="relative h-1 bg-gray-200 rounded">
              <div className="absolute h-1 bg-green-300 rounded" style={{
                left: "".concat((minRec * 100) * 2, "%"), // *2 because max is 50%
                width: "".concat(((maxRec - minRec) * 100) * 2, "%")
            }}/>
              <div className="absolute w-1 h-3 bg-blue-600 rounded -top-1" style={{ left: "".concat(weightPercentage * 2, "%") }}/>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    };
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Settings className="h-5 w-5"/>
              Risk Weighting Controls
            </card_1.CardTitle>
            <card_1.CardDescription>
              Adjust the importance of different risk categories in the overall assessment
            </card_1.CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <button_1.Button variant="outline" size="sm" onClick={handleResetWeights}>
              <lucide_react_1.RotateCcw className="h-4 w-4"/>
              Reset
            </button_1.Button>
            <button_1.Button size="sm" onClick={handleSaveWeights} disabled={!hasUnsavedChanges || !isValidWeightDistribution}>
              <lucide_react_1.Save className="h-4 w-4"/>
              Apply
            </button_1.Button>
          </div>
        </div>

        {/* Weight Distribution Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total Weight Distribution</span>
            <span className={(0, utils_1.cn)('text-sm font-bold', isValidWeightDistribution ? 'text-green-600' : 'text-red-600')}>
              {(totalWeight * 100).toFixed(1)}%
            </span>
          </div>
          <progress_1.Progress value={totalWeight * 100} className={(0, utils_1.cn)('h-2', isValidWeightDistribution ? 'text-green-600' : 'text-red-600')}/>
          {!isValidWeightDistribution && (<div className="flex items-center gap-2 mt-2">
              <lucide_react_1.AlertTriangle className="h-4 w-4 text-orange-600"/>
              <span className="text-xs text-orange-600">
                Weights should total 100%. Current: {(totalWeight * 100).toFixed(1)}%
              </span>
              <button_1.Button variant="outline" size="sm" onClick={normalizeWeights}>
                Auto-normalize
              </button_1.Button>
            </div>)}
        </div>
      </card_1.CardHeader>

      <card_1.CardContent className="space-y-4">
        {/* Weight Controls */}
        <div className="space-y-3">
          {DEFAULT_WEIGHT_CONFIGS.map(function (config) { return (<WeightSlider key={config.category} config={config}/>); })}
        </div>

        {/* Impact Preview */}
        <card_1.Card>
          <card_1.CardHeader className="pb-3">
            <card_1.CardTitle className="text-base">Impact Preview</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                These weight changes will affect how risk factors contribute to the overall risk score:
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium mb-2">Increased Influence:</div>
                  {DEFAULT_WEIGHT_CONFIGS
            .filter(function (config) {
            var currentWeight = localWeights[config.category] || 0;
            return currentWeight > config.weight;
        })
            .map(function (config) { return (<div key={config.category} className="flex items-center gap-2 text-xs">
                        <lucide_react_1.TrendingUp className="h-3 w-3 text-green-600"/>
                        <span className="capitalize">{config.category}</span>
                        <span className="text-muted-foreground">
                          (+{((localWeights[config.category] - config.weight) * 100).toFixed(1)}%)
                        </span>
                      </div>); })}
                </div>
                
                <div>
                  <div className="text-xs font-medium mb-2">Decreased Influence:</div>
                  {DEFAULT_WEIGHT_CONFIGS
            .filter(function (config) {
            var currentWeight = localWeights[config.category] || 0;
            return currentWeight < config.weight;
        })
            .map(function (config) { return (<div key={config.category} className="flex items-center gap-2 text-xs">
                        <lucide_react_1.TrendingDown className="h-3 w-3 text-red-600"/>
                        <span className="capitalize">{config.category}</span>
                        <span className="text-muted-foreground">
                          ({((localWeights[config.category] - config.weight) * 100).toFixed(1)}%)
                        </span>
                      </div>); })}
                </div>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Recommendations */}
        <alert_1.Alert>
          <lucide_react_1.Info className="h-4 w-4"/>
          <alert_1.AlertDescription>
            <strong>Weighting Guidelines:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Ownership verification typically has the highest weight (25-35%)</li>
              <li>• Government designations are critical for long-term security (20-30%)</li>
              <li>• Legal history weight depends on dispute prevalence in the area (15-25%)</li>
              <li>• Physical verification provides ground-truth validation (10-20%)</li>
              <li>• Community intelligence offers local context (5-15%)</li>
            </ul>
          </alert_1.AlertDescription>
        </alert_1.Alert>

        {hasUnsavedChanges && (<alert_1.Alert>
            <lucide_react_1.AlertTriangle className="h-4 w-4"/>
            <alert_1.AlertDescription>
              You have unsaved changes to the risk weights. Click "Apply" to update the risk assessment.
            </alert_1.AlertDescription>
          </alert_1.Alert>)}
      </card_1.CardContent>
    </card_1.Card>);
}
