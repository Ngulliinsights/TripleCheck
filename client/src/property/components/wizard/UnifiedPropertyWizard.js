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
exports.UnifiedPropertyWizard = UnifiedPropertyWizard;
var react_1 = require("react");
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var badge_1 = require("../../../local/components/ui/badge");
var button_1 = require("../../../local/components/ui/button");
var card_1 = require("../../../local/components/ui/card");
var progress_1 = require("../../../local/components/ui/progress");
var use_toast_1 = require("../../../local/hooks/use-toast");
var property_api_1 = require("../../services/property-api");
var config_1 = require("./config");
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Builds the API payload from form data. Centralises the shape in one place. */
function buildPropertyPayload(data, status) {
    var _a, _b;
    return {
        title: data.title,
        description: data.description,
        propertyType: data.propertyType,
        location: data.location,
        bedrooms: (_a = data.bedrooms) !== null && _a !== void 0 ? _a : 0,
        bathrooms: (_b = data.bathrooms) !== null && _b !== void 0 ? _b : 0,
        area: data.area,
        amenities: data.amenities,
        price: data.price,
        images: data.imageUrls,
        status: status,
        // TODO: replace with value from auth context (e.g. useAuth().user.id)
        ownerId: 'current-user',
        verificationStatus: 'pending',
    };
}
var DEFAULT_FORM_DATA = {
    title: '',
    description: '',
    propertyType: 'apartment',
    location: {
        address: '',
        city: '',
        state: '',
        county: '',
        country: 'Kenya',
    },
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    amenities: [],
    features: [],
    customFeatures: [],
    images: [],
    imageUrls: [],
    documents: [],
    price: 0,
    priceType: 'sale',
    currency: 'KES',
    titleDeed: null,
    surveyPlan: null,
    ownershipProof: null,
    status: 'draft',
};
// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function UnifiedPropertyWizard(_a) {
    var config = _a.config, initialData = _a.initialData, onSave = _a.onSave, onPublish = _a.onPublish, onCancel = _a.onCancel, _b = _a.mode, mode = _b === void 0 ? 'create' : _b;
    var toast = (0, use_toast_1.useToast)().toast;
    var queryClient = (0, react_query_1.useQueryClient)();
    // Resolve wizard configuration once
    var wizardConfig = (0, react_1.useMemo)(function () {
        if (config)
            return (0, config_1.mergeWizardConfig)(config_1.enhancedWizardConfig, config);
        if (initialData === null || initialData === void 0 ? void 0 : initialData.propertyType)
            return (0, config_1.getWizardConfigForPropertyType)(initialData.propertyType);
        return config_1.enhancedWizardConfig;
    }, [config, initialData === null || initialData === void 0 ? void 0 : initialData.propertyType]);
    var _c = (0, react_1.useState)(0), currentStep = _c[0], setCurrentStep = _c[1];
    var _d = (0, react_1.useState)(__assign(__assign({}, DEFAULT_FORM_DATA), initialData)), formData = _d[0], setFormData = _d[1];
    var _e = (0, react_1.useState)({}), stepValidation = _e[0], setStepValidation = _e[1];
    // ------------------------------------------------------------------
    // Form helpers
    // ------------------------------------------------------------------
    var updateFormData = (0, react_1.useCallback)(function (updates) {
        setFormData(function (prev) { return (__assign(__assign({}, prev), updates)); });
    }, []);
    var validateStep = (0, react_1.useCallback)(function (stepIndex) {
        var step = wizardConfig.steps[stepIndex];
        if (!step)
            return false;
        var isValid = step.validation(formData);
        setStepValidation(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[step.id] = isValid, _a)));
        });
        return isValid;
    }, [formData, wizardConfig.steps]);
    // ------------------------------------------------------------------
    // Navigation
    // ------------------------------------------------------------------
    var goToStep = (0, react_1.useCallback)(function (stepIndex) {
        if (stepIndex < 0 || stepIndex >= wizardConfig.steps.length)
            return;
        if (wizardConfig.validationMode === 'strict' && stepIndex > currentStep) {
            if (!validateStep(currentStep)) {
                toast({
                    title: 'Please complete required fields',
                    description: 'Fill in all required information before proceeding.',
                    variant: 'destructive',
                });
                return;
            }
        }
        setCurrentStep(stepIndex);
    }, [currentStep, validateStep, wizardConfig.validationMode, wizardConfig.steps.length, toast]);
    var goNext = (0, react_1.useCallback)(function () { return goToStep(currentStep + 1); }, [currentStep, goToStep]);
    var goPrevious = (0, react_1.useCallback)(function () { return goToStep(currentStep - 1); }, [currentStep, goToStep]);
    // ------------------------------------------------------------------
    // Mutations — share the same API call, differ only in `status`
    // ------------------------------------------------------------------
    var invalidateProperties = (0, react_1.useCallback)(function () { return queryClient.invalidateQueries({ queryKey: ['/api/properties'] }); }, [queryClient]);
    var saveDraftMutation = (0, react_query_1.useMutation)({
        mutationFn: function (data) {
            return property_api_1.propertyApi.createProperty(buildPropertyPayload(data, 'inactive'));
        },
        onSuccess: function () {
            invalidateProperties();
            toast({ title: 'Draft saved successfully', description: 'Your property has been saved as a draft.' });
            onSave === null || onSave === void 0 ? void 0 : onSave(formData);
        },
        onError: function (error) {
            toast({ title: 'Failed to save draft', description: error.message || 'Please try again later.', variant: 'destructive' });
        },
    });
    var publishMutation = (0, react_query_1.useMutation)({
        mutationFn: function (data) {
            return property_api_1.propertyApi.createProperty(buildPropertyPayload(data, 'active'));
        },
        onSuccess: function () {
            invalidateProperties();
            toast({ title: 'Property published', description: 'Your listing is live and pending verification.' });
            onPublish === null || onPublish === void 0 ? void 0 : onPublish(formData);
        },
        onError: function (error) {
            toast({ title: 'Failed to publish', description: error.message || 'Please try again later.', variant: 'destructive' });
        },
    });
    // ------------------------------------------------------------------
    // Action handlers
    // ------------------------------------------------------------------
    var handleSaveDraft = (0, react_1.useCallback)(function () {
        saveDraftMutation.mutate(formData);
    }, [formData, saveDraftMutation]);
    var handlePublish = (0, react_1.useCallback)(function () {
        var allRequiredValid = wizardConfig.steps
            .filter(function (step) { return step.required; })
            .every(function (step) {
            var idx = wizardConfig.steps.findIndex(function (s) { return s.id === step.id; });
            return validateStep(idx);
        });
        if (!allRequiredValid) {
            toast({
                title: 'Please complete all required fields',
                description: 'All required sections must be completed before publishing.',
                variant: 'destructive',
            });
            return;
        }
        publishMutation.mutate(formData);
    }, [formData, publishMutation, validateStep, wizardConfig.steps, toast]);
    // ------------------------------------------------------------------
    // Derived values
    // ------------------------------------------------------------------
    var progress = ((currentStep + 1) / wizardConfig.steps.length) * 100;
    var currentStepData = wizardConfig.steps[currentStep];
    var stepContent = (0, react_1.useMemo)(function () {
        if (!currentStepData)
            return <p>Invalid step</p>;
        var StepComponent = currentStepData.component;
        return (<StepComponent data={formData} onUpdate={updateFormData} onValidation={function (isValid) {
                return setStepValidation(function (prev) {
                    var _a;
                    return (__assign(__assign({}, prev), (_a = {}, _a[currentStepData.id] = isValid, _a)));
                });
            }} propertyType={formData.propertyType}/>);
    }, [currentStepData, formData, updateFormData]);
    // ------------------------------------------------------------------
    // Shared sub-renders
    // ------------------------------------------------------------------
    var progressBar = (<div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">
        Step {currentStep + 1} of {wizardConfig.steps.length}
      </span>
      <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
    </div>);
    // ------------------------------------------------------------------
    // Enhanced UI (PropertyWizard style)
    // ------------------------------------------------------------------
    if (wizardConfig.showEnhancedUI) {
        return (<div className="min-h-screen bg-background">
        {/* Hero header */}
        <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex p-4 bg-primary/10 rounded-full mb-6">
              <lucide_react_1.Home className="w-12 h-12 text-primary"/>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {wizardConfig.title}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">{wizardConfig.subtitle}</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Progress */}
            <div>
              {progressBar}
              <progress_1.Progress value={progress} className="h-2"/>
            </div>

            {/* Step Navigation */}
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              {wizardConfig.steps.map(function (step, index) {
                var IconComponent = step.icon;
                var isActive = index === currentStep;
                var isCompleted = index < currentStep;
                var isAccessible = index <= currentStep;
                return (<div key={step.id} className={"flex items-center ".concat(index < wizardConfig.steps.length - 1 ? 'flex-1' : '')}>
                    <div className="flex flex-col items-center">
                      <button type="button" onClick={function () { return isAccessible && goToStep(index); }} disabled={!isAccessible} className={[
                        'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors',
                        isActive
                            ? 'border-primary bg-primary text-primary-foreground'
                            : isCompleted
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-muted-foreground bg-background text-muted-foreground',
                    ].join(' ')}>
                        {isCompleted ? (<lucide_react_1.CheckCircle className="w-5 h-5"/>) : (<IconComponent className="w-5 h-5"/>)}
                      </button>
                      <span className={[
                        'text-xs mt-2 text-center',
                        isActive
                            ? 'text-primary font-medium'
                            : isCompleted
                                ? 'text-green-600'
                                : 'text-muted-foreground',
                    ].join(' ')}>
                        {step.title}
                      </span>
                    </div>
                    {index < wizardConfig.steps.length - 1 && (<div className={"flex-1 h-0.5 mx-4 ".concat(isCompleted ? 'bg-green-500' : 'bg-muted')}/>)}
                  </div>);
            })}
            </div>

            {/* Step Content */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  {currentStepData && react_1.default.createElement(currentStepData.icon, { className: 'w-5 h-5' })}
                  {currentStepData === null || currentStepData === void 0 ? void 0 : currentStepData.title}
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>{stepContent}</card_1.CardContent>
            </card_1.Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <button_1.Button variant="outline" onClick={goPrevious} disabled={currentStep === 0}>
                <lucide_react_1.ArrowLeft className="w-4 h-4 mr-2"/>
                Previous
              </button_1.Button>

              {currentStep === wizardConfig.steps.length - 1 ? (<button_1.Button className="bg-green-600 hover:bg-green-700" onClick={handlePublish} disabled={publishMutation.isPending}>
                  <lucide_react_1.CheckCircle className="w-4 h-4 mr-2"/>
                  {publishMutation.isPending ? 'Publishing…' : 'Submit Listing'}
                </button_1.Button>) : (<button_1.Button onClick={goNext}>
                  Next
                  <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
                </button_1.Button>)}
            </div>
          </div>
        </div>
      </div>);
    }
    // ------------------------------------------------------------------
    // Modern UI (PropertyListingWizard style)
    // ------------------------------------------------------------------
    return (<div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">{wizardConfig.title}</h1>
        <p className="text-gray-600">{wizardConfig.subtitle}</p>
      </div>

      {/* Progress */}
      <card_1.Card>
        <card_1.CardContent className="p-6 space-y-3">
          {progressBar}
          <progress_1.Progress value={progress} className="h-2"/>
        </card_1.CardContent>
      </card_1.Card>

      {/* Step pills */}
      <card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="flex flex-wrap gap-2">
            {wizardConfig.steps.map(function (step, index) {
            var Icon = step.icon;
            var isActive = index === currentStep;
            var isCompleted = Boolean(stepValidation[step.id]);
            var isAccessible = index <= currentStep;
            return (<button key={step.id} type="button" onClick={function () { return isAccessible && goToStep(index); }} disabled={!isAccessible} className={[
                    'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                    isActive
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : isCompleted
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : isAccessible
                                ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                                : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed',
                ].join(' ')}>
                  <Icon className="h-4 w-4"/>
                  <span className="text-sm font-medium">{step.title}</span>
                  {isCompleted && (<badge_1.Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                      ✓
                    </badge_1.Badge>)}
                </button>);
        })}
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Step Content */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            {currentStepData && react_1.default.createElement(currentStepData.icon, { className: 'h-5 w-5' })}
            {currentStepData === null || currentStepData === void 0 ? void 0 : currentStepData.title}
          </card_1.CardTitle>
          {(currentStepData === null || currentStepData === void 0 ? void 0 : currentStepData.description) && (<p className="text-gray-600">{currentStepData.description}</p>)}
        </card_1.CardHeader>
        <card_1.CardContent>{stepContent}</card_1.CardContent>
      </card_1.Card>

      {/* Navigation */}
      <card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {currentStep > 0 && (<button_1.Button variant="outline" onClick={goPrevious} className="flex items-center gap-2">
                  <lucide_react_1.ArrowLeft className="h-4 w-4"/>
                  Previous
                </button_1.Button>)}
              {onCancel && (<button_1.Button variant="ghost" onClick={onCancel}>
                  Cancel
                </button_1.Button>)}
            </div>

            <div className="flex gap-2">
              <button_1.Button variant="outline" onClick={handleSaveDraft} disabled={saveDraftMutation.isPending} className="flex items-center gap-2">
                <lucide_react_1.Save className="h-4 w-4"/>
                {saveDraftMutation.isPending ? 'Saving…' : 'Save Draft'}
              </button_1.Button>

              {currentStep < wizardConfig.steps.length - 1 ? (<button_1.Button onClick={goNext} className="flex items-center gap-2">
                  Next
                  <lucide_react_1.ArrowRight className="h-4 w-4"/>
                </button_1.Button>) : (<button_1.Button onClick={handlePublish} disabled={publishMutation.isPending} className="flex items-center gap-2">
                  <lucide_react_1.Send className="h-4 w-4"/>
                  {publishMutation.isPending ? 'Publishing…' : 'Publish Property'}
                </button_1.Button>)}
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
