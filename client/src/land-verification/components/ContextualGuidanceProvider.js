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
exports.GuidanceButton = exports.GuidancePanel = exports.GuidanceProvider = exports.useGuidance = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var GuidanceContext = (0, react_1.createContext)(null);
var useGuidance = function () {
    var context = (0, react_1.useContext)(GuidanceContext);
    if (!context) {
        throw new Error('useGuidance must be used within a GuidanceProvider');
    }
    return context;
};
exports.useGuidance = useGuidance;
var PREDEFINED_STEPS = {
    'verification-start': {
        id: 'verification-start',
        title: 'Starting Land Verification',
        description: 'Begin the comprehensive land verification process to protect against fraud and ownership disputes.',
        tips: [
            'Gather all available property documents before starting',
            'Ensure you have clear photos of the property',
            'Have property coordinates or location details ready',
            'Set aside adequate time for the complete process'
        ],
        warnings: [
            'Incomplete information may affect verification accuracy',
            'Some verification steps may take several days to complete'
        ],
        nextSteps: [
            'Upload property documents for authentication',
            'Provide accurate property location information',
            'Review initial risk assessment results'
        ],
        relatedHelp: ['land-verification-overview', 'verification-process-guide']
    },
    'document-upload': {
        id: 'document-upload',
        title: 'Document Upload and Authentication',
        description: 'Upload your property documents for comprehensive authentication and analysis.',
        tips: [
            'Scan documents at high resolution (300 DPI minimum)',
            'Ensure all pages are included, including amendments',
            'Upload both sides of documents if applicable',
            'Include supporting documents like search certificates'
        ],
        warnings: [
            'Blurred or low-quality scans may require re-upload',
            'Missing pages will delay the verification process',
            'Ensure documents are recent and not expired'
        ],
        nextSteps: [
            'Documents will be analyzed for authenticity',
            'Registry verification will cross-check details',
            'Any issues will be flagged for review'
        ],
        relatedHelp: ['document-authentication', 'kenya-land-ownership-system']
    },
    'registry-verification': {
        id: 'registry-verification',
        title: 'Government Registry Verification',
        description: 'Cross-checking your property details against official government databases.',
        tips: [
            'This process connects to multiple government systems',
            'Verification may take several minutes to complete',
            'Historical ownership records will be analyzed',
            'Legal instruments and charges will be identified'
        ],
        warnings: [
            'Government systems may be temporarily unavailable',
            'Some historical records may be incomplete',
            'Network issues may cause delays'
        ],
        nextSteps: [
            'Physical verification will validate boundaries',
            'Community intelligence gathering will begin',
            'Risk assessment will be updated with findings'
        ],
        relatedHelp: ['registry-integration', 'ownership-verification']
    },
    'physical-verification': {
        id: 'physical-verification',
        title: 'Physical Property Verification',
        description: 'Coordinate ground-truthing of property boundaries and physical features.',
        tips: [
            'Use GPS-enabled device for accurate coordinates',
            'Take photos of boundary markers and key features',
            'Measure distances between important points',
            'Document any encroachments or boundary disputes'
        ],
        warnings: [
            'Weather conditions may affect GPS accuracy',
            'Some boundary markers may be missing or damaged',
            'Property access may be restricted or dangerous'
        ],
        nextSteps: [
            'Community intelligence will validate findings',
            'Expert surveyors may be recommended',
            'Physical findings will be integrated into risk assessment'
        ],
        relatedHelp: ['physical-verification-guide', 'boundary-verification']
    },
    'community-intelligence': {
        id: 'community-intelligence',
        title: 'Community Knowledge Gathering',
        description: 'Collect valuable local insights about property history and potential issues.',
        tips: [
            'Approach community members respectfully',
            'Ask open-ended questions about property history',
            'Document information sources and their credibility',
            'Cross-reference information from multiple sources'
        ],
        warnings: [
            'Community information may be subjective or biased',
            'Protect the privacy and safety of information sources',
            'Some community members may be reluctant to share information'
        ],
        nextSteps: [
            'Information will be cross-referenced with official records',
            'Discrepancies will be investigated further',
            'Expert legal counsel may be recommended for complex issues'
        ],
        relatedHelp: ['community-intelligence-guide', 'local-knowledge-validation']
    },
    'risk-assessment': {
        id: 'risk-assessment',
        title: 'Comprehensive Risk Analysis',
        description: 'Analyze all verification results to generate a comprehensive risk profile.',
        tips: [
            'Review all identified risk factors carefully',
            'Consider your personal risk tolerance level',
            'Pay attention to how different risks might interact',
            'Follow provided recommendations and mitigation strategies'
        ],
        warnings: [
            'High-risk properties require additional expert verification',
            'Some risks may not be immediately apparent',
            'Risk levels can change over time with new information'
        ],
        nextSteps: [
            'Consider expert consultation for high-risk properties',
            'Implement recommended mitigation strategies',
            'Set up ongoing monitoring if proceeding with purchase'
        ],
        relatedHelp: ['risk-assessment-guide', 'risk-types-explained']
    },
    'expert-coordination': {
        id: 'expert-coordination',
        title: 'Professional Expert Coordination',
        description: 'Connect with qualified professionals for specialized verification services.',
        tips: [
            'Choose experts with local experience and proper credentials',
            'Provide experts with all available verification data',
            'Coordinate timing to avoid delays in the process',
            'Request detailed reports from all engaged experts'
        ],
        warnings: [
            'Expert services may add significant cost and time',
            'Not all experts may be immediately available',
            'Expert opinions may sometimes conflict'
        ],
        nextSteps: [
            'Expert reports will be integrated into final assessment',
            'Conflicting expert opinions will be resolved',
            'Final recommendations will be provided'
        ],
        relatedHelp: ['expert-selection-guide', 'professional-coordination']
    },
    'monitoring-setup': {
        id: 'monitoring-setup',
        title: 'Ongoing Property Monitoring',
        description: 'Set up continuous monitoring to protect your property investment.',
        tips: [
            'Configure monitoring for relevant risk factors',
            'Set appropriate alert thresholds',
            'Maintain contact with verification professionals',
            'Review monitoring reports regularly'
        ],
        warnings: [
            'Monitoring cannot prevent all risks',
            'Some changes may not be immediately detectable',
            'Regular review and updates are necessary'
        ],
        nextSteps: [
            'Monitoring will begin immediately after setup',
            'Alerts will be sent for significant changes',
            'Annual reviews will be scheduled'
        ],
        relatedHelp: ['monitoring-guide', 'ongoing-protection']
    }
};
var GuidanceProvider = function (_a) {
    var children = _a.children;
    var _b = (0, react_1.useState)(null), currentStep = _b[0], setCurrentStep = _b[1];
    var _c = (0, react_1.useState)(true), showGuidance = _c[0], setShowGuidance = _c[1];
    var _d = (0, react_1.useState)(PREDEFINED_STEPS), registeredSteps = _d[0], setRegisteredSteps = _d[1];
    var toggleGuidance = (0, react_1.useCallback)(function () {
        setShowGuidance(function (prev) { return !prev; });
    }, []);
    var registerStep = (0, react_1.useCallback)(function (step) {
        setRegisteredSteps(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[step.id] = step, _a)));
        });
    }, []);
    var getStep = (0, react_1.useCallback)(function (stepId) {
        return registeredSteps[stepId];
    }, [registeredSteps]);
    var contextValue = {
        currentStep: currentStep,
        showGuidance: showGuidance,
        setCurrentStep: setCurrentStep,
        toggleGuidance: toggleGuidance,
        registerStep: registerStep,
        getStep: getStep
    };
    return (<GuidanceContext.Provider value={contextValue}>
      {children}
    </GuidanceContext.Provider>);
};
exports.GuidanceProvider = GuidanceProvider;
var GuidancePanel = function (_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b;
    var _c = (0, exports.useGuidance)(), currentStep = _c.currentStep, showGuidance = _c.showGuidance, toggleGuidance = _c.toggleGuidance, getStep = _c.getStep;
    var _d = (0, react_1.useState)(true), expanded = _d[0], setExpanded = _d[1];
    if (!showGuidance || !currentStep) {
        return null;
    }
    var step = getStep(currentStep);
    if (!step) {
        return null;
    }
    return (<div className={"bg-blue-50 border border-blue-200 rounded-lg ".concat(className)}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <lucide_react_1.HelpCircle className="h-5 w-5 text-blue-600"/>
            <h3 className="font-semibold text-blue-900">{step.title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={function () { return setExpanded(!expanded); }} className="text-blue-600 hover:text-blue-800">
              {expanded ? (<lucide_react_1.ChevronDown className="h-4 w-4"/>) : (<lucide_react_1.ChevronRight className="h-4 w-4"/>)}
            </button>
            <button onClick={toggleGuidance} className="text-blue-600 hover:text-blue-800">
              <lucide_react_1.X className="h-4 w-4"/>
            </button>
          </div>
        </div>
        
        {expanded && (<div className="mt-3 space-y-3">
            <p className="text-blue-800">{step.description}</p>
            
            {step.tips && step.tips.length > 0 && (<div>
                <h4 className="font-medium text-blue-900 text-sm mb-1">Tips</h4>
                <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                  {step.tips.map(function (tip, index) { return (<li key={index}>{tip}</li>); })}
                </ul>
              </div>)}
            
            {step.warnings && step.warnings.length > 0 && (<div>
                <h4 className="font-medium text-orange-900 text-sm mb-1">Important Notes</h4>
                <ul className="list-disc list-inside text-orange-800 text-sm space-y-1">
                  {step.warnings.map(function (warning, index) { return (<li key={index}>{warning}</li>); })}
                </ul>
              </div>)}
            
            {step.nextSteps && step.nextSteps.length > 0 && (<div>
                <h4 className="font-medium text-green-900 text-sm mb-1">What Happens Next</h4>
                <ul className="list-disc list-inside text-green-800 text-sm space-y-1">
                  {step.nextSteps.map(function (nextStep, index) { return (<li key={index}>{nextStep}</li>); })}
                </ul>
              </div>)}
          </div>)}
      </div>
    </div>);
};
exports.GuidancePanel = GuidancePanel;
var GuidanceButton = function (_a) {
    var stepId = _a.stepId, _b = _a.className, className = _b === void 0 ? '' : _b, children = _a.children;
    var _c = (0, exports.useGuidance)(), setCurrentStep = _c.setCurrentStep, toggleGuidance = _c.toggleGuidance, showGuidance = _c.showGuidance;
    var handleClick = function () {
        setCurrentStep(stepId);
        if (!showGuidance) {
            toggleGuidance();
        }
    };
    return (<button onClick={handleClick} className={"inline-flex items-center text-blue-600 hover:text-blue-800 ".concat(className)} title="Get help with this step">
      {children || <lucide_react_1.HelpCircle className="h-4 w-4"/>}
    </button>);
};
exports.GuidanceButton = GuidanceButton;
exports.default = exports.GuidanceProvider;
