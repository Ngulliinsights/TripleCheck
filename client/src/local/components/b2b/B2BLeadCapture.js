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
exports.B2BLeadCapture = B2BLeadCapture;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("../ui/alert");
var button_1 = require("../ui/button");
var card_1 = require("../ui/card");
var input_1 = require("../ui/input");
var label_1 = require("../ui/label");
var progress_1 = require("../ui/progress");
var utils_1 = require("../../lib/utils");
// CSS class constants
var ERROR_BORDER_CLASS = "border-red-500";
var DEFAULT_BORDER_CLASS = "border-gray-300";
var SELECT_BASE_CLASSES = "mt-1 w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
// Position classes mapping
var POSITION_CLASSES = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
    center: "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
};
// Default position constant
var DEFAULT_POSITION = "bottom-right";
// Enhanced trigger messages
var TRIGGER_MESSAGES = {
    high_usage: {
        title: "You're a Power User! �",
        subtitle: "Ready to scale with our API?",
        urgency: "high",
    },
    high_value: {
        title: "Premium Properties Detected 💎",
        subtitle: "Unlock enterprise features",
        urgency: "medium",
    },
    business_hours: {
        title: "Perfect Timing! ⏰",
        subtitle: "Our team is available now",
        urgency: "low",
    },
    manual: {
        title: "Ready for API Access?",
        subtitle: "Integrate our verification into your platform",
        urgency: "low",
    },
};
// Safe email validation regex (non-backtracking)
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Helper functions to reduce cognitive complexity
var getTriggerConfig = function (trigger) {
    var validTriggers = [
        "high_usage",
        "high_value",
        "business_hours",
        "manual",
    ];
    var isValidTrigger = function (t) {
        return validTriggers.includes(t);
    };
    var triggerKey = isValidTrigger(trigger) ? trigger : "manual";
    return TRIGGER_MESSAGES[triggerKey];
};
var getPositionClasses = function (position) {
    var validPositions = [
        "bottom-right",
        "bottom-left",
        "top-right",
        "top-left",
        "center",
    ];
    var isValidPosition = function (p) {
        return validPositions.includes(p);
    };
    var positionKey = isValidPosition(position) ? position : DEFAULT_POSITION;
    return POSITION_CLASSES[positionKey];
};
var getUrgencyClasses = function (urgency) {
    switch (urgency) {
        case "high":
            return { bg: "bg-red-100", text: "text-red-600" };
        case "medium":
            return { bg: "bg-orange-100", text: "text-orange-600" };
        default:
            return { bg: "bg-blue-100", text: "text-blue-600" };
    }
};
var renderButtonContent = function (isSubmitting, currentStep, customization) {
    if (isSubmitting) {
        return (<>
        <lucide_react_1.Loader2 className="w-4 h-4 mr-2 animate-spin"/>
        Submitting...
      </>);
    }
    if (currentStep === 1) {
        return (<>
        Continue
        <lucide_react_1.ArrowRight className="w-4 h-4 ml-1"/>
      </>);
    }
    return (<>
      {customization.ctaText || "Get API Demo"}
      <lucide_react_1.ArrowRight className="w-4 h-4 ml-1"/>
    </>);
};
function B2BLeadCapture(_a) {
    var _this = this;
    var className = _a.className, _b = _a.trigger, trigger = _b === void 0 ? "manual" : _b, _c = _a.position, position = _c === void 0 ? DEFAULT_POSITION : _c, userMetrics = _a.userMetrics, onClose = _a.onClose, onSubmit = _a.onSubmit, _d = _a.customization, customization = _d === void 0 ? {} : _d;
    var _e = (0, react_1.useState)(false), isVisible = _e[0], setIsVisible = _e[1];
    var _f = (0, react_1.useState)(false), isSubmitting = _f[0], setIsSubmitting = _f[1];
    var _g = (0, react_1.useState)(false), isSubmitted = _g[0], setIsSubmitted = _g[1];
    var _h = (0, react_1.useState)(1), currentStep = _h[0], setCurrentStep = _h[1];
    var _j = (0, react_1.useState)({}), errors = _j[0], setErrors = _j[1];
    var _k = (0, react_1.useState)({
        email: "",
        company: "",
        role: "",
        useCase: "",
        monthlyVolume: "",
        phone: "",
        timeline: "",
    }), formData = _k[0], setFormData = _k[1];
    // Memoize trigger configuration
    var triggerConfig = (0, react_1.useMemo)(function () { return getTriggerConfig(trigger); }, [trigger]);
    // Memoize position classes
    var positionClasses = (0, react_1.useMemo)(function () { return getPositionClasses(position); }, [position]);
    // Memoize urgency classes
    var urgencyClasses = (0, react_1.useMemo)(function () { return getUrgencyClasses(triggerConfig.urgency); }, [triggerConfig.urgency]);
    // Enhanced validation function
    var validateForm = (0, react_1.useCallback)(function (step) {
        var newErrors = {};
        if (step >= 1) {
            if (!formData.email) {
                newErrors.email = "Email is required";
            }
            else if (!EMAIL_REGEX.test(formData.email)) {
                newErrors.email = "Please enter a valid email address";
            }
            if (!formData.company) {
                newErrors.company = "Company name is required";
            }
            else if (formData.company.length < 2) {
                newErrors.company = "Company name must be at least 2 characters";
            }
        }
        if (step >= 2) {
            if (!formData.role) {
                newErrors.role = "Please select your role";
            }
            if (!formData.monthlyVolume) {
                newErrors.monthlyVolume = "Please select monthly volume";
            }
            if (!formData.useCase) {
                newErrors.useCase = "Please select your primary use case";
            }
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);
    // Auto-show based on enhanced trigger conditions
    (0, react_1.useEffect)(function () {
        var shouldShow = function () {
            switch (trigger) {
                case "high_usage":
                    return ((userMetrics === null || userMetrics === void 0 ? void 0 : userMetrics.verificationsThisMonth) || 0) > 10;
                case "high_value":
                    return ((userMetrics === null || userMetrics === void 0 ? void 0 : userMetrics.averagePropertyValue) || 0) > 5000000; // 5M KES
                case "business_hours": {
                    var hour = new Date().getHours();
                    var day = new Date().getDay();
                    return hour >= 9 && hour <= 17 && day >= 1 && day <= 5; // Weekdays 9 AM - 5 PM
                }
                case "manual":
                default:
                    return true;
            }
        };
        if (shouldShow()) {
            var delay = trigger === "manual" ? 1000 : 3000; // Faster for manual trigger
            var timer_1 = setTimeout(function () { return setIsVisible(true); }, delay);
            return function () { return clearTimeout(timer_1); };
        }
        return undefined;
    }, [trigger, userMetrics]);
    // Enhanced form submission with steps
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (currentStep < 2) {
                        // Validate current step and proceed to next
                        if (validateForm(currentStep)) {
                            setCurrentStep(2);
                        }
                        return [2 /*return*/];
                    }
                    // Final submission
                    if (!validateForm(2))
                        return [2 /*return*/];
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    // Track lead capture with enhanced data
                    if (window === null || window === void 0 ? void 0 : window.gtag) {
                        window.gtag("event", "b2b_lead_capture", {
                            event_category: "B2B",
                            event_label: trigger,
                            custom_parameters: {
                                company: formData.company,
                                role: formData.role,
                                use_case: formData.useCase,
                                monthly_volume: formData.monthlyVolume,
                                step_completed: currentStep,
                            },
                        });
                    }
                    if (!onSubmit) return [3 /*break*/, 3];
                    return [4 /*yield*/, onSubmit(__assign(__assign({}, formData), { trigger: trigger, userMetrics: userMetrics, timestamp: new Date().toISOString(), source: "consumer_platform" }))];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, fetch("/api/b2b/leads", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(__assign(__assign({}, formData), { trigger: trigger, userMetrics: userMetrics, timestamp: new Date().toISOString(), source: "consumer_platform" })),
                    })];
                case 4:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP error! status: ".concat(response.status));
                    }
                    _a.label = 5;
                case 5:
                    setIsSubmitted(true);
                    // Auto-hide after success
                    setTimeout(function () {
                        setIsVisible(false);
                        onClose === null || onClose === void 0 ? void 0 : onClose();
                    }, 5000);
                    return [3 /*break*/, 8];
                case 6:
                    error_1 = _a.sent();
                    // Log error for debugging without using console
                    if (window === null || window === void 0 ? void 0 : window.gtag) {
                        window.gtag("event", "b2b_lead_error", {
                            event_category: "Error",
                            event_label: "Lead capture submission failed",
                            custom_parameters: { error: String(error_1) },
                        });
                    }
                    setErrors({ submit: "Failed to submit. Please try again." });
                    return [3 /*break*/, 8];
                case 7:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    // Enhanced input change handler with validation
    var handleInputChange = (0, react_1.useCallback)(function (field, value) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
        // Clear field-specific error when user starts typing
        if (Object.prototype.hasOwnProperty.call(errors, field)) {
            setErrors(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[field] = "", _a)));
            });
        }
    }, [errors]);
    // Handle close with callback
    var handleClose = (0, react_1.useCallback)(function () {
        setIsVisible(false);
        onClose === null || onClose === void 0 ? void 0 : onClose();
    }, [onClose]);
    if (!isVisible)
        return null;
    // Success state with enhanced messaging
    if (isSubmitted) {
        return (<card_1.Card className={(0, utils_1.cn)("fixed ".concat(positionClasses, " w-96 shadow-2xl border-green-200 bg-green-50 z-50 animate-in slide-in-from-bottom-4 duration-300"), className)}>
        <card_1.CardContent className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50 duration-500 delay-200">
              <lucide_react_1.CheckCircle className="w-8 h-8 text-green-600"/>
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              {customization.title || "Thank You!"}
            </h3>
            <p className="text-green-700 mb-4">
              We&apos;ll contact you within 24 hours to discuss your API
              integration needs.
            </p>
            <div className="flex items-center justify-center gap-2 mb-4">
              {__spreadArray([], Array(5), true).map(function (_, i) { return (<lucide_react_1.Star key={i} className="w-4 h-4 text-yellow-500 fill-current"/>); })}
              <span className="text-sm text-green-700 ml-2">
                Trusted by 500+ companies
              </span>
            </div>
            <button_1.Button type="button" size="sm" variant="outline" onClick={handleClose} className="border-green-300 text-green-700 hover:bg-green-100">
              Close
            </button_1.Button>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<card_1.Card className={(0, utils_1.cn)("fixed ".concat(positionClasses, " w-96 shadow-2xl border-blue-200 z-50 animate-in slide-in-from-bottom-4 duration-300"), className)}>
      <card_1.CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={"p-2 rounded-lg ".concat(urgencyClasses.bg)}>
              <lucide_react_1.Building2 className={"w-5 h-5 ".concat(urgencyClasses.text)}/>
            </div>
            <div>
              <card_1.CardTitle className="text-lg text-gray-900">
                {customization.title || triggerConfig.title}
              </card_1.CardTitle>
              <p className="text-sm text-gray-600">
                {customization.subtitle || triggerConfig.subtitle}
              </p>
            </div>
          </div>
          <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-sm hover:bg-gray-100" aria-label="Close lead capture form">
            <lucide_react_1.X className="w-4 h-4"/>
          </button>
        </div>

        {/* Progress indicator */}
        {customization.showProgress !== false && (<div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Step {currentStep} of 2</span>
              <span>{currentStep === 1 ? "Basic Info" : "Requirements"}</span>
            </div>
            <progress_1.Progress value={(currentStep / 2) * 100} className="h-1"/>
          </div>)}
      </card_1.CardHeader>

      <card_1.CardContent className="pt-0">
        {/* Enhanced Value Props */}
        {customization.showValueProps !== false && (<div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <lucide_react_1.Shield className="w-4 h-4 text-blue-500"/>
              <span>10-min verification</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <lucide_react_1.TrendingUp className="w-4 h-4 text-green-500"/>
              <span>95% accuracy</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <lucide_react_1.Users className="w-4 h-4 text-purple-500"/>
              <span>Enterprise ready</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <lucide_react_1.Building2 className="w-4 h-4 text-orange-500"/>
              <span>Kenya-specific</span>
            </div>
          </div>)}

        {/* Error Alert */}
        {errors.submit && (<alert_1.Alert variant="destructive" className="mb-4">
            <lucide_react_1.AlertCircle className="h-4 w-4"/>
            <alert_1.AlertDescription>{errors.submit}</alert_1.AlertDescription>
          </alert_1.Alert>)}

        {/* Enhanced Multi-Step Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 1 && (<div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label_1.Label htmlFor="email" className="text-sm font-medium">
                    Work Email *
                  </label_1.Label>
                  <input_1.Input id="email" type="email" placeholder="john@company.com" value={formData.email} onChange={function (e) { return handleInputChange("email", e.target.value); }} className={"mt-1 ".concat(errors.email ? ERROR_BORDER_CLASS : "")} aria-describedby={errors.email ? "email-error" : undefined}/>
                  {errors.email && (<p id="email-error" className="text-xs text-red-600 mt-1">
                      {errors.email}
                    </p>)}
                </div>

                <div>
                  <label_1.Label htmlFor="company" className="text-sm font-medium">
                    Company Name *
                  </label_1.Label>
                  <input_1.Input id="company" type="text" placeholder="Your Company Ltd" value={formData.company} onChange={function (e) {
                return handleInputChange("company", e.target.value);
            }} className={"mt-1 ".concat(errors.company ? ERROR_BORDER_CLASS : "")} aria-describedby={errors.company ? "company-error" : undefined}/>
                  {errors.company && (<p id="company-error" className="text-xs text-red-600 mt-1">
                      {errors.company}
                    </p>)}
                </div>

                <div>
                  <label_1.Label htmlFor="phone" className="text-sm font-medium">
                    Phone (Optional)
                  </label_1.Label>
                  <input_1.Input id="phone" type="tel" placeholder="+254 700 000 000" value={formData.phone} onChange={function (e) { return handleInputChange("phone", e.target.value); }} className="mt-1"/>
                </div>
              </div>
            </div>)}

          {currentStep === 2 && (<div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label_1.Label htmlFor="role" className="text-sm font-medium">
                    Your Role *
                  </label_1.Label>
                  <select id="role" title="Select your role" value={formData.role} onChange={function (e) { return handleInputChange("role", e.target.value); }} className={"".concat(SELECT_BASE_CLASSES, " ").concat(errors.role ? ERROR_BORDER_CLASS : DEFAULT_BORDER_CLASS)} aria-describedby={errors.role ? "role-error" : undefined}>
                    <option value="">Select role</option>
                    <option value="cto">CTO</option>
                    <option value="developer">Developer</option>
                    <option value="product_manager">Product Manager</option>
                    <option value="business_owner">Business Owner</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.role && (<p id="role-error" className="text-xs text-red-600 mt-1">
                      {errors.role}
                    </p>)}
                </div>

                <div>
                  <label_1.Label htmlFor="monthlyVolume" className="text-sm font-medium">
                    Monthly Volume *
                  </label_1.Label>
                  <select id="monthlyVolume" title="Select monthly volume" value={formData.monthlyVolume} onChange={function (e) {
                return handleInputChange("monthlyVolume", e.target.value);
            }} className={"".concat(SELECT_BASE_CLASSES, " ").concat(errors.monthlyVolume ? ERROR_BORDER_CLASS : DEFAULT_BORDER_CLASS)} aria-describedby={errors.monthlyVolume ? "volume-error" : undefined}>
                    <option value="">Select volume</option>
                    <option value="1-100">1-100 verifications</option>
                    <option value="100-1000">100-1,000 verifications</option>
                    <option value="1000-5000">1,000-5,000 verifications</option>
                    <option value="5000+">5,000+ verifications</option>
                  </select>
                  {errors.monthlyVolume && (<p id="volume-error" className="text-xs text-red-600 mt-1">
                      {errors.monthlyVolume}
                    </p>)}
                </div>
              </div>

              <div>
                <label_1.Label htmlFor="useCase" className="text-sm font-medium">
                  Primary Use Case *
                </label_1.Label>
                <select id="useCase" title="Select primary use case" value={formData.useCase} onChange={function (e) { return handleInputChange("useCase", e.target.value); }} className={"".concat(SELECT_BASE_CLASSES, " ").concat(errors.useCase ? ERROR_BORDER_CLASS : DEFAULT_BORDER_CLASS)} aria-describedby={errors.useCase ? "usecase-error" : undefined}>
                  <option value="">Select use case</option>
                  <option value="loan_collateral">
                    Loan collateral verification
                  </option>
                  <option value="listing_verification">
                    Property listing verification
                  </option>
                  <option value="insurance_risk">
                    Insurance risk assessment
                  </option>
                  <option value="due_diligence">Legal due diligence</option>
                  <option value="other">Other</option>
                </select>
                {errors.useCase && (<p id="usecase-error" className="text-xs text-red-600 mt-1">
                    {errors.useCase}
                  </p>)}
              </div>

              <div>
                <label_1.Label htmlFor="timeline" className="text-sm font-medium">
                  Implementation Timeline
                </label_1.Label>
                <select id="timeline" title="Select implementation timeline" value={formData.timeline} onChange={function (e) {
                return handleInputChange("timeline", e.target.value);
            }} className={"".concat(SELECT_BASE_CLASSES, " ").concat(DEFAULT_BORDER_CLASS)}>
                  <option value="">Select timeline</option>
                  <option value="immediate">Immediate (within 1 month)</option>
                  <option value="short">Short term (1-3 months)</option>
                  <option value="medium">Medium term (3-6 months)</option>
                  <option value="long">Long term (6+ months)</option>
                </select>
              </div>
            </div>)}

          <div className="flex space-x-2 pt-4">
            {currentStep === 2 && (<button_1.Button type="button" variant="outline" size="sm" onClick={function () { return setCurrentStep(1); }} className="flex-1" disabled={isSubmitting}>
                Back
              </button_1.Button>)}
            <button_1.Button type="button" variant="outline" size="sm" onClick={handleClose} className={currentStep === 1 ? "flex-1" : ""} disabled={isSubmitting}>
              Maybe Later
            </button_1.Button>
            <button_1.Button type="submit" size="sm" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {renderButtonContent(isSubmitting, currentStep, customization)}
            </button_1.Button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-3 text-center">
          We&apos;ll contact you within 24 hours to discuss your needs
        </p>
      </card_1.CardContent>
    </card_1.Card>);
}
