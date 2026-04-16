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
exports.VerificationWizard = VerificationWizard;
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var use_toast_1 = require("../../local/hooks/use-toast");
var useLandVerification_1 = require("../hooks/useLandVerification");
var ExpertCoordinationInterface_1 = require("./ExpertCoordinationInterface");
var RiskAssessmentDisplay_1 = require("./RiskAssessmentDisplay");
var VerificationProgressTracker_1 = require("./VerificationProgressTracker");
var VERIFICATION_LAYERS = [
    {
        id: 'registry',
        type: 'registry',
        name: 'Land Registry Verification',
        description: 'Verify ownership records and title deed authenticity',
        icon: lucide_react_1.FileText,
        estimatedDuration: 4,
        required: true,
        status: 'not_started'
    },
    {
        id: 'physical',
        type: 'physical',
        name: 'Physical Verification',
        description: 'On-ground verification of boundaries and property condition',
        icon: lucide_react_1.MapPin,
        estimatedDuration: 8,
        required: true,
        status: 'not_started'
    },
    {
        id: 'community',
        type: 'community',
        name: 'Community Intelligence',
        description: 'Gather local knowledge and community feedback',
        icon: lucide_react_1.Users,
        estimatedDuration: 6,
        required: true,
        status: 'not_started'
    },
    {
        id: 'government',
        type: 'government',
        name: 'Government Compliance',
        description: 'Verify compliance with government regulations',
        icon: lucide_react_1.Shield,
        estimatedDuration: 12,
        required: true,
        status: 'not_started'
    },
    {
        id: 'legal',
        type: 'legal',
        name: 'Legal Assessment',
        description: 'Legal review of documents and ownership chain',
        icon: lucide_react_1.Gavel,
        estimatedDuration: 16,
        required: false,
        status: 'not_started'
    },
    {
        id: 'expert',
        type: 'expert',
        name: 'Expert Review',
        description: 'Professional surveyor and legal expert assessment',
        icon: lucide_react_1.CheckCircle,
        estimatedDuration: 24,
        required: false,
        status: 'not_started'
    }
];
function VerificationWizard(_a) {
    var _this = this;
    var propertyId = _a.propertyId, userId = _a.userId, onComplete = _a.onComplete, onCancel = _a.onCancel;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var toast = (0, use_toast_1.useToast)().toast;
    var _b = (0, react_1.useState)(0), currentStep = _b[0], setCurrentStep = _b[1];
    var _c = (0, react_1.useState)([]), selectedLayers = _c[0], setSelectedLayers = _c[1];
    var _d = (0, react_1.useState)(null), verificationSession = _d[0], setVerificationSession = _d[1];
    var _e = (0, react_1.useState)(false), isInitiating = _e[0], setIsInitiating = _e[1];
    var _f = (0, react_1.useState)(VERIFICATION_LAYERS), layers = _f[0], setLayers = _f[1];
    var _g = (0, useLandVerification_1.useLandVerification)(), initiateVerification = _g.initiateVerification, executeLayer = _g.executeLayer, getVerificationStatus = _g.getVerificationStatus, generateRiskAssessment = _g.generateRiskAssessment, isLoading = _g.isLoading, error = _g.error;
    (0, react_1.useEffect)(function () {
        // Pre-select required layers
        var requiredLayers = layers.filter(function (layer) { return layer.required; }).map(function (layer) { return layer.id; });
        setSelectedLayers(requiredLayers);
    }, [layers]);
    var handleLayerToggle = function (layerId) {
        var layer = layers.find(function (l) { return l.id === layerId; });
        if (layer === null || layer === void 0 ? void 0 : layer.required)
            return; // Can't deselect required layers
        setSelectedLayers(function (prev) {
            return prev.includes(layerId)
                ? prev.filter(function (id) { return id !== layerId; })
                : __spreadArray(__spreadArray([], prev, true), [layerId], false);
        });
    };
    var handleInitiateVerification = function () { return __awaiter(_this, void 0, void 0, function () {
        var session, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (selectedLayers.length === 0) {
                        toast({
                            title: "No Layers Selected",
                            description: "Please select at least one verification layer to proceed.",
                            variant: "destructive"
                        });
                        return [2 /*return*/];
                    }
                    setIsInitiating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, initiateVerification({
                            propertyId: propertyId,
                            userId: userId,
                            requestedLayers: selectedLayers,
                            priority: 'high',
                            notes: 'Initiated through verification wizard'
                        })];
                case 2:
                    session = _a.sent();
                    setVerificationSession(session);
                    setCurrentStep(1);
                    toast({
                        title: "Verification Initiated",
                        description: "Verification session ".concat(session.id, " has been created successfully."),
                    });
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: "Initiation Failed",
                        description: error_1 instanceof Error ? error_1.message : "Failed to initiate verification",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setIsInitiating(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleExecuteLayer = function (layerType) { return __awaiter(_this, void 0, void 0, function () {
        var results, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!verificationSession)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, executeLayer(verificationSession.id, layerType)];
                case 2:
                    results = _a.sent();
                    // Update layer status
                    setLayers(function (prev) { return prev.map(function (layer) {
                        return layer.type === layerType
                            ? __assign(__assign({}, layer), { status: 'completed' }) : layer;
                    }); });
                    toast({
                        title: "Layer Completed",
                        description: "".concat(layerType, " verification layer has been completed with ").concat(results.length, " results."),
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    // Update layer status to failed
                    setLayers(function (prev) { return prev.map(function (layer) {
                        return layer.type === layerType
                            ? __assign(__assign({}, layer), { status: 'failed' }) : layer;
                    }); });
                    toast({
                        title: "Layer Failed",
                        description: error_2 instanceof Error ? error_2.message : "Failed to execute ".concat(layerType, " layer"),
                        variant: "destructive"
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleGenerateRiskAssessment = function () { return __awaiter(_this, void 0, void 0, function () {
        var riskAssessment, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!verificationSession)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, generateRiskAssessment(verificationSession.id)];
                case 2:
                    riskAssessment = _a.sent();
                    setCurrentStep(3);
                    toast({
                        title: "Risk Assessment Generated",
                        description: "Risk assessment completed with ".concat(riskAssessment.riskLevel, " risk level."),
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _a.sent();
                    toast({
                        title: "Assessment Failed",
                        description: error_3 instanceof Error ? error_3.message : "Failed to generate risk assessment",
                        variant: "destructive"
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var calculateProgress = function () {
        var completedLayers = layers.filter(function (layer) {
            return selectedLayers.includes(layer.id) && layer.status === 'completed';
        }).length;
        var totalLayers = selectedLayers.length;
        return totalLayers > 0 ? (completedLayers / totalLayers) * 100 : 0;
    };
    var getTotalEstimatedTime = function () {
        return layers
            .filter(function (layer) { return selectedLayers.includes(layer.id); })
            .reduce(function (total, layer) { return total + layer.estimatedDuration; }, 0);
    };
    var renderStepContent = function () {
        switch (currentStep) {
            case 0:
                return (<div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Configure Land Verification
              </h2>
              <p className="text-gray-600">
                Select the verification layers you want to include in your comprehensive land verification process.
              </p>
            </div>

            <div className="grid gap-4">
              {layers.map(function (layer) {
                        var Icon = layer.icon;
                        var isSelected = selectedLayers.includes(layer.id);
                        var isRequired = layer.required;
                        return (<card_1.Card key={layer.id} className={"cursor-pointer transition-all duration-200 ".concat(isSelected
                                ? 'ring-2 ring-blue-500 bg-blue-50'
                                : 'hover:shadow-md', " ").concat(isRequired ? 'border-orange-200' : '')} onClick={function () { return handleLayerToggle(layer.id); }}>
                    <card_1.CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className={"p-2 rounded-lg ".concat(isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600')}>
                          <Icon className="h-5 w-5"/>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {layer.name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {isRequired && (<badge_1.Badge variant="secondary" className="text-xs">
                                  Required
                                </badge_1.Badge>)}
                              <badge_1.Badge variant="outline" className="text-xs">
                                {layer.estimatedDuration}h
                              </badge_1.Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {layer.description}
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          <div className={"w-5 h-5 rounded-full border-2 flex items-center justify-center ".concat(isSelected
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300')}>
                            {isSelected && (<lucide_react_1.CheckCircle className="h-3 w-3 text-white"/>)}
                          </div>
                        </div>
                      </div>
                    </card_1.CardContent>
                  </card_1.Card>);
                    })}
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Selected Layers: {selectedLayers.length}
                </span>
                <span className="font-medium text-gray-700">
                  Estimated Time: {getTotalEstimatedTime()} hours
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <button_1.Button variant="outline" onClick={onCancel}>
                Cancel
              </button_1.Button>
              <button_1.Button onClick={handleInitiateVerification} disabled={selectedLayers.length === 0 || isInitiating} className="min-w-[120px]">
                {isInitiating ? (<>
                    <lucide_react_1.Clock className="h-4 w-4 mr-2 animate-spin"/>
                    Initiating...
                  </>) : ('Start Verification')}
              </button_1.Button>
            </div>
          </div>);
            case 1:
                return (<div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification in Progress
              </h2>
              <p className="text-gray-600">
                Your land verification is now running. Monitor the progress of each layer below.
              </p>
            </div>

            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Overall Progress</h3>
                <span className="text-sm text-gray-600">
                  {Math.round(calculateProgress())}% Complete
                </span>
              </div>
              <progress_1.Progress value={calculateProgress()} className="mb-2"/>
            </div>

            {verificationSession && (<VerificationProgressTracker_1.VerificationProgressTracker sessionId={verificationSession.id} onLayerComplete={function (layerType) {
                            setLayers(function (prev) { return prev.map(function (layer) {
                                return layer.type === layerType
                                    ? __assign(__assign({}, layer), { status: 'completed' }) : layer;
                            }); });
                        }}/>)}

            <div className="grid gap-4">
              {layers
                        .filter(function (layer) { return selectedLayers.includes(layer.id); })
                        .map(function (layer) {
                        var Icon = layer.icon;
                        return (<card_1.Card key={layer.id}>
                      <card_1.CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={"p-2 rounded-lg ".concat(layer.status === 'completed' ? 'bg-green-100 text-green-600' :
                                layer.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                    layer.status === 'failed' ? 'bg-red-100 text-red-600' :
                                        'bg-gray-100 text-gray-600')}>
                              <Icon className="h-5 w-5"/>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {layer.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {layer.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <badge_1.Badge variant={layer.status === 'completed' ? 'default' :
                                layer.status === 'in_progress' ? 'secondary' :
                                    layer.status === 'failed' ? 'destructive' :
                                        'outline'}>
                              {layer.status === 'not_started' ? 'Pending' :
                                layer.status === 'in_progress' ? 'Running' :
                                    layer.status === 'completed' ? 'Complete' :
                                        'Failed'}
                            </badge_1.Badge>
                            
                            {layer.status === 'not_started' && (<button_1.Button size="sm" onClick={function () { return handleExecuteLayer(layer.type); }} disabled={isLoading}>
                                Start
                              </button_1.Button>)}
                          </div>
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>);
                    })}
            </div>

            <div className="flex justify-between">
              <button_1.Button variant="outline" onClick={function () { return setCurrentStep(0); }}>
                Back to Configuration
              </button_1.Button>
              <button_1.Button onClick={handleGenerateRiskAssessment} disabled={calculateProgress() < 100}>
                Generate Risk Assessment
              </button_1.Button>
            </div>
          </div>);
            case 2:
                return (<div className="space-y-6">
            <ExpertCoordinationInterface_1.ExpertCoordinationInterface sessionId={verificationSession === null || verificationSession === void 0 ? void 0 : verificationSession.id} onExpertAssigned={function (assignment) {
                        toast({
                            title: "Expert Assigned",
                            description: "".concat(assignment.expertType, " has been assigned to your verification."),
                        });
                    }}/>
          </div>);
            case 3:
                return (<div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Complete
              </h2>
              <p className="text-gray-600">
                Your land verification has been completed. Review the risk assessment below.
              </p>
            </div>

            {verificationSession && (<RiskAssessmentDisplay_1.RiskAssessmentDisplay sessionId={verificationSession.id} onRecommendationAction={function (action) {
                            toast({
                                title: "Action Taken",
                                description: "".concat(action, " has been initiated."),
                            });
                        }}/>)}

            <div className="flex justify-between">
              <button_1.Button variant="outline" onClick={function () { return setCurrentStep(1); }}>
                View Progress
              </button_1.Button>
              <button_1.Button onClick={function () {
                        if (onComplete && verificationSession) {
                            onComplete(verificationSession.id);
                        }
                    }}>
                Complete Verification
              </button_1.Button>
            </div>
          </div>);
            default:
                return null;
        }
    };
    if (error) {
        return (<card_1.Card className="max-w-2xl mx-auto">
        <card_1.CardContent className="p-6 text-center">
          <lucide_react_1.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verification Error
          </h3>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button_1.Button onClick={function () { return window.location.reload(); }}>
            Retry
          </button_1.Button>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<div className="max-w-4xl mx-auto p-6">
      <framer_motion_1.AnimatePresence mode="wait">
        <framer_motion_1.motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
          {renderStepContent()}
        </framer_motion_1.motion.div>
      </framer_motion_1.AnimatePresence>
    </div>);
}
exports.default = VerificationWizard;
