"use strict";
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
exports.VerificationProgressTracker = VerificationProgressTracker;
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var separator_1 = require("../../local/components/ui/separator");
var use_toast_1 = require("../../local/hooks/use-toast");
var useLandVerification_1 = require("../hooks/useLandVerification");
var LAYER_ICONS = {
    registry: lucide_react_1.FileText,
    physical: lucide_react_1.MapPin,
    community: lucide_react_1.Users,
    government: lucide_react_1.Shield,
    legal: lucide_react_1.Gavel,
    expert: lucide_react_1.Award,
};
var LAYER_NAMES = {
    registry: 'Land Registry',
    physical: 'Physical Verification',
    community: 'Community Intelligence',
    government: 'Government Compliance',
    legal: 'Legal Assessment',
    expert: 'Expert Review',
};
function VerificationProgressTracker(_a) {
    var _this = this;
    var _b;
    var sessionId = _a.sessionId, onLayerComplete = _a.onLayerComplete, onSessionComplete = _a.onSessionComplete, _c = _a.showControls, showControls = _c === void 0 ? false : _c;
    var toast = (0, use_toast_1.useToast)().toast;
    var _d = (0, react_1.useState)(true), isRealTimeEnabled = _d[0], setIsRealTimeEnabled = _d[1];
    var _e = (0, react_1.useState)(new Date()), lastUpdate = _e[0], setLastUpdate = _e[1];
    var _f = (0, useLandVerification_1.useLandVerification)(), useVerificationStatus = _f.useVerificationStatus, useVerificationSession = _f.useVerificationSession, executeLayer = _f.executeLayer, isExecutingLayer = _f.isExecutingLayer;
    var _g = useVerificationStatus(sessionId, {
        refetchInterval: isRealTimeEnabled ? 3000 : undefined
    }), status = _g.data, statusLoading = _g.isLoading, statusError = _g.error, refetchStatus = _g.refetch;
    var _h = useVerificationSession(sessionId), session = _h.data, sessionLoading = _h.isLoading;
    (0, react_1.useEffect)(function () {
        if (status === null || status === void 0 ? void 0 : status.lastUpdated) {
            var updateTime = new Date(status.lastUpdated);
            if (updateTime > lastUpdate) {
                setLastUpdate(updateTime);
            }
        }
    }, [status === null || status === void 0 ? void 0 : status.lastUpdated, lastUpdate]);
    (0, react_1.useEffect)(function () {
        if ((status === null || status === void 0 ? void 0 : status.status) === 'completed' && onSessionComplete) {
            onSessionComplete();
        }
    }, [status === null || status === void 0 ? void 0 : status.status, onSessionComplete]);
    var handleExecuteLayer = function (layerType) { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, executeLayer(sessionId, layerType)];
                case 1:
                    _a.sent();
                    if (onLayerComplete) {
                        onLayerComplete(layerType);
                    }
                    toast({
                        title: "Layer Started",
                        description: "".concat(LAYER_NAMES[layerType], " verification has been initiated."),
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    toast({
                        title: "Failed to Start Layer",
                        description: error_1 instanceof Error ? error_1.message : "Failed to start verification layer",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var getStatusIcon = function (layerStatus) {
        switch (layerStatus) {
            case 'completed':
                return <lucide_react_1.CheckCircle className="h-5 w-5 text-green-500"/>;
            case 'in_progress':
                return <lucide_react_1.Clock className="h-5 w-5 text-blue-500 animate-spin"/>;
            case 'failed':
                return <lucide_react_1.XCircle className="h-5 w-5 text-red-500"/>;
            case 'suspended':
                return <lucide_react_1.Pause className="h-5 w-5 text-yellow-500"/>;
            default:
                return <lucide_react_1.Clock className="h-5 w-5 text-gray-400"/>;
        }
    };
    var getStatusColor = function (layerStatus) {
        switch (layerStatus) {
            case 'completed':
                return 'bg-green-100 border-green-200';
            case 'in_progress':
                return 'bg-blue-100 border-blue-200';
            case 'failed':
                return 'bg-red-100 border-red-200';
            case 'suspended':
                return 'bg-yellow-100 border-yellow-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };
    var formatTimeRemaining = function (hours) {
        if (hours < 1) {
            return "".concat(Math.round(hours * 60), " minutes");
        }
        else if (hours < 24) {
            return "".concat(Math.round(hours), " hours");
        }
        else {
            return "".concat(Math.round(hours / 24), " days");
        }
    };
    if (statusLoading || sessionLoading) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <lucide_react_1.Clock className="h-5 w-5 animate-spin"/>
            <span>Loading verification status...</span>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    if (statusError) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="text-center">
            <lucide_react_1.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to Load Status
            </h3>
            <p className="text-gray-600 mb-4">
              Unable to retrieve verification progress. Please try again.
            </p>
            <button_1.Button onClick={function () { return refetchStatus(); }}>
              Retry
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    if (!status || !session) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="text-center text-gray-500">
            No verification data available
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    var progressPercentage = status.progress.totalLayers > 0
        ? (status.progress.completedLayers / status.progress.totalLayers) * 100
        : 0;
    return (<div className="space-y-6">
      {/* Overall Progress Card */}
      <card_1.Card>
        <card_1.CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <card_1.CardTitle className="text-lg">Verification Progress</card_1.CardTitle>
              <card_1.CardDescription>
                Session {sessionId} • {status.progress.completedLayers} of {status.progress.totalLayers} layers complete
              </card_1.CardDescription>
            </div>
            {showControls && (<div className="flex items-center space-x-2">
                <button_1.Button variant="outline" size="sm" onClick={function () { return setIsRealTimeEnabled(!isRealTimeEnabled); }}>
                  {isRealTimeEnabled ? (<>
                      <lucide_react_1.Pause className="h-4 w-4 mr-1"/>
                      Pause Updates
                    </>) : (<>
                      <lucide_react_1.Play className="h-4 w-4 mr-1"/>
                      Resume Updates
                    </>)}
                </button_1.Button>
                <button_1.Button variant="outline" size="sm" onClick={function () { return refetchStatus(); }}>
                  Refresh
                </button_1.Button>
              </div>)}
          </div>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Overall Progress
                </span>
                <span className="text-sm text-gray-600">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <progress_1.Progress value={progressPercentage} className="h-2"/>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-900">Status</div>
                <badge_1.Badge variant={status.status === 'completed' ? 'default' :
            status.status === 'in_progress' ? 'secondary' :
                status.status === 'failed' ? 'destructive' :
                    'outline'} className="mt-1">
                  {status.status.replace('_', ' ').toUpperCase()}
                </badge_1.Badge>
              </div>
              
              <div>
                <div className="font-medium text-gray-900">Current Layer</div>
                <div className="text-gray-600 mt-1">
                  {status.progress.currentLayer
            ? LAYER_NAMES[status.progress.currentLayer]
            : 'None'}
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-900">Time Remaining</div>
                <div className="text-gray-600 mt-1">
                  {status.progress.estimatedTimeRemaining
            ? formatTimeRemaining(status.progress.estimatedTimeRemaining)
            : 'Unknown'}
                </div>
              </div>
              
              <div>
                <div className="font-medium text-gray-900">Last Updated</div>
                <div className="text-gray-600 mt-1">
                  {new Date(status.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {status.riskAssessment && (<>
                <separator_1.Separator />
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Risk Assessment Preview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Risk Level</div>
                      <badge_1.Badge variant={status.riskAssessment.riskLevel === 'low' ? 'default' :
                status.riskAssessment.riskLevel === 'medium' ? 'secondary' :
                    status.riskAssessment.riskLevel === 'high' ? 'destructive' :
                        'destructive'} className="mt-1">
                        {status.riskAssessment.riskLevel.toUpperCase()}
                      </badge_1.Badge>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Risk Score</div>
                      <div className="text-gray-900 mt-1 font-mono">
                        {status.riskAssessment.overallScore}/100
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Confidence</div>
                      <div className="text-gray-900 mt-1">
                        {Math.round(status.riskAssessment.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                  {status.riskAssessment.majorRisks.length > 0 && (<div className="mt-3">
                      <div className="font-medium text-gray-700 mb-1">Major Risk Factors</div>
                      <div className="flex flex-wrap gap-1">
                        {status.riskAssessment.majorRisks.slice(0, 3).map(function (risk, index) { return (<badge_1.Badge key={index} variant="outline" className="text-xs">
                            {risk}
                          </badge_1.Badge>); })}
                        {status.riskAssessment.majorRisks.length > 3 && (<badge_1.Badge variant="outline" className="text-xs">
                            +{status.riskAssessment.majorRisks.length - 3} more
                          </badge_1.Badge>)}
                      </div>
                    </div>)}
                </div>
              </>)}
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Layer Progress Cards */}
      <div className="grid gap-4">
        <framer_motion_1.AnimatePresence>
          {(_b = session.completedLayers) === null || _b === void 0 ? void 0 : _b.map(function (layer, index) {
            var Icon = LAYER_ICONS[layer.type] || lucide_react_1.FileText;
            var layerName = LAYER_NAMES[layer.type] || layer.type;
            return (<framer_motion_1.motion.div key={layer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                <card_1.Card className={getStatusColor(layer.status)}>
                  <card_1.CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-white">
                          <Icon className="h-5 w-5 text-gray-600"/>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {layerName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {layer.status === 'completed' && layer.completedAt && ("Completed ".concat(new Date(layer.completedAt).toLocaleString()))}
                            {layer.status === 'in_progress' && layer.startedAt && ("Started ".concat(new Date(layer.startedAt).toLocaleString()))}
                            {layer.status === 'not_started' && ('Waiting to start')}
                            {layer.status === 'failed' && ('Failed - requires attention')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(layer.status)}
                        
                        {layer.status === 'not_started' && showControls && (<button_1.Button size="sm" onClick={function () { return handleExecuteLayer(layer.type); }} disabled={isExecutingLayer}>
                            {isExecutingLayer ? (<>
                                <lucide_react_1.Clock className="h-4 w-4 mr-1 animate-spin"/>
                                Starting...
                              </>) : (<>
                                <lucide_react_1.Play className="h-4 w-4 mr-1"/>
                                Start
                              </>)}
                          </button_1.Button>)}
                        
                        {layer.results && layer.results.length > 0 && (<badge_1.Badge variant="outline" className="text-xs">
                            {layer.results.length} results
                          </badge_1.Badge>)}
                      </div>
                    </div>
                    
                    {layer.results && layer.results.length > 0 && (<div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-600 mb-2">
                          Latest Results:
                        </div>
                        <div className="space-y-1">
                          {layer.results.slice(0, 2).map(function (result, resultIndex) { return (<div key={resultIndex} className="flex items-center justify-between text-xs">
                              <span className="text-gray-700">{result.description}</span>
                              <badge_1.Badge variant={result.status === 'pass' ? 'default' :
                            result.status === 'warning' ? 'secondary' :
                                'destructive'} className="text-xs">
                                {result.status}
                              </badge_1.Badge>
                            </div>); })}
                          {layer.results.length > 2 && (<div className="text-xs text-gray-500">
                              +{layer.results.length - 2} more results
                            </div>)}
                        </div>
                      </div>)}
                  </card_1.CardContent>
                </card_1.Card>
              </framer_motion_1.motion.div>);
        })}
        </framer_motion_1.AnimatePresence>
      </div>
    </div>);
}
exports.default = VerificationProgressTracker;
