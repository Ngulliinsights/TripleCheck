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
exports.RegistrationWizard = RegistrationWizard;
var zod_1 = require("@hookform/resolvers/zod");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var zod_2 = require("zod");
var zxcvbn_1 = require("zxcvbn");
var alert_1 = require("../../local/components/ui/alert");
var avatar_1 = require("../../local/components/ui/avatar");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var checkbox_1 = require("../../local/components/ui/checkbox");
var form_1 = require("../../local/components/ui/form");
var input_1 = require("../../local/components/ui/input");
var progress_1 = require("../../local/components/ui/progress");
var textarea_1 = require("../../local/components/ui/textarea");
var useAuth_1 = require("../hooks/useAuth");
var logo_1 = require("../../local/components/ui/logo");
// Step schemas
var personalInfoSchema = zod_2.z.object({
    firstName: zod_2.z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
    lastName: zod_2.z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
    email: zod_2.z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    phone: zod_2.z.string().optional(),
});
var passwordSchema = zod_2.z.object({
    password: zod_2.z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: zod_2.z.string().min(1, 'Please confirm your password'),
}).refine(function (data) { return data.password === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
var profileSchema = zod_2.z.object({
    profilePhoto: zod_2.z.any().optional(),
    bio: zod_2.z.string().max(500, 'Bio must be less than 500 characters').optional(),
});
var termsSchema = zod_2.z.object({
    agreeToTerms: zod_2.z.boolean().refine(function (val) { return val === true; }, {
        message: 'You must agree to the terms of service',
    }),
    agreeToPrivacy: zod_2.z.boolean().refine(function (val) { return val === true; }, {
        message: 'You must agree to the privacy policy',
    }),
    agreeToMarketing: zod_2.z.boolean().optional(),
});
// Combined schema for final submission
var registrationSchema = zod_2.z.object({
    firstName: zod_2.z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
    lastName: zod_2.z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
    email: zod_2.z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    phone: zod_2.z.string().optional(),
    password: zod_2.z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: zod_2.z.string().min(1, 'Please confirm your password'),
    profilePhoto: zod_2.z.any().optional(),
    bio: zod_2.z.string().max(500, 'Bio must be less than 500 characters').optional(),
    agreeToTerms: zod_2.z.boolean().refine(function (val) { return val === true; }, {
        message: 'You must agree to the terms of service',
    }),
    agreeToPrivacy: zod_2.z.boolean().refine(function (val) { return val === true; }, {
        message: 'You must agree to the privacy policy',
    }),
    agreeToMarketing: zod_2.z.boolean().optional(),
}).refine(function (data) { return data.password === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
var defaultSteps = [
    {
        id: 'personal',
        title: 'Personal Information',
        description: 'Tell us about yourself',
        icon: <lucide_react_1.User className="w-5 h-5"/>,
        schema: personalInfoSchema,
    },
    {
        id: 'password',
        title: 'Create Password',
        description: 'Secure your account',
        icon: <lucide_react_1.Lock className="w-5 h-5"/>,
        schema: passwordSchema,
    },
    {
        id: 'profile',
        title: 'Profile Setup',
        description: 'Customize your profile',
        icon: <lucide_react_1.Camera className="w-5 h-5"/>,
        schema: profileSchema,
    },
    {
        id: 'terms',
        title: 'Terms & Conditions',
        description: 'Review and accept our terms',
        icon: <lucide_react_1.FileText className="w-5 h-5"/>,
        schema: termsSchema,
    },
];
function RegistrationWizard(_a) {
    var _this = this;
    var _b, _c;
    var _d = _a.steps, steps = _d === void 0 ? defaultSteps : _d, onComplete = _a.onComplete, _e = _a.className, className = _e === void 0 ? '' : _e;
    var _f = (0, react_1.useState)(0), currentStep = _f[0], setCurrentStep = _f[1];
    var _g = (0, react_1.useState)(new Set()), completedSteps = _g[0], setCompletedSteps = _g[1];
    var _h = (0, react_1.useState)(null), profilePhotoPreview = _h[0], setProfilePhotoPreview = _h[1];
    var _j = (0, react_1.useState)(null), passwordStrength = _j[0], setPasswordStrength = _j[1];
    var _k = (0, react_1.useState)(false), emailVerificationSent = _k[0], setEmailVerificationSent = _k[1];
    var _l = (0, react_1.useState)(false), isSubmitting = _l[0], setIsSubmitting = _l[1];
    var registerMutation = (0, useAuth_1.useRegister)();
    var form = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(registrationSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            bio: '',
            agreeToTerms: false,
            agreeToPrivacy: false,
            agreeToMarketing: false,
        },
        mode: 'onChange',
    });
    // Load saved form data from localStorage
    (0, react_1.useEffect)(function () {
        var savedData = localStorage.getItem('registrationFormData');
        if (savedData) {
            try {
                var parsedData_1 = JSON.parse(savedData);
                Object.keys(parsedData_1).forEach(function (key) {
                    if (key !== 'password' && key !== 'confirmPassword') {
                        form.setValue(key, parsedData_1[key]);
                    }
                });
            }
            catch (error) {
                // Failed to load saved registration data - continue with defaults
            }
        }
    }, [form]);
    // Save form data to localStorage on changes
    (0, react_1.useEffect)(function () {
        var subscription = form.watch(function (data) {
            var dataToSave = __assign({}, data);
            // Don't save passwords to localStorage for security
            delete dataToSave.password;
            delete dataToSave.confirmPassword;
            localStorage.setItem('registrationFormData', JSON.stringify(dataToSave));
        });
        return function () { return subscription.unsubscribe(); };
    }, [form]);
    // Password strength checking
    var checkPasswordStrength = function (password) {
        if (!password) {
            setPasswordStrength(null);
            return;
        }
        var result = (0, zxcvbn_1.default)(password);
        setPasswordStrength({
            score: result.score,
            feedback: result.feedback.suggestions,
            warning: result.feedback.warning || '',
        });
    };
    // Handle profile photo upload
    var handlePhotoUpload = function (event) {
        var _a;
        var file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (file) {
            // Validate file type and size
            if (!file.type.startsWith('image/')) {
                form.setError('profilePhoto', { message: 'Please select a valid image file' });
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                form.setError('profilePhoto', { message: 'Image size must be less than 5MB' });
                return;
            }
            var reader = new globalThis.FileReader();
            reader.onload = function (e) {
                var _a;
                setProfilePhotoPreview((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                form.setValue('profilePhoto', file);
                form.clearErrors('profilePhoto');
            };
            reader.readAsDataURL(file);
        }
    };
    // Validate current step
    var validateCurrentStep = function () { return __awaiter(_this, void 0, void 0, function () {
        var currentStepSchema, formData, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    currentStepSchema = steps[currentStep].schema;
                    formData = form.getValues();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, currentStepSchema.parseAsync(formData)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, true];
                case 3:
                    error_1 = _a.sent();
                    if (error_1 instanceof zod_2.z.ZodError) {
                        error_1.errors.forEach(function (err) {
                            form.setError(err.path[0], {
                                message: err.message,
                            });
                        });
                    }
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // Handle next step
    var handleNext = function () { return __awaiter(_this, void 0, void 0, function () {
        var isValid;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, validateCurrentStep()];
                case 1:
                    isValid = _a.sent();
                    if (isValid) {
                        setCompletedSteps(function (prev) { return new Set(__spreadArray(__spreadArray([], prev, true), [currentStep], false)); });
                        if (currentStep < steps.length - 1) {
                            setCurrentStep(currentStep + 1);
                        }
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    // Handle previous step
    var handlePrevious = function () {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };
    // Handle step click
    var handleStepClick = function (stepIndex) {
        if (stepIndex <= currentStep || completedSteps.has(stepIndex)) {
            setCurrentStep(stepIndex);
        }
    };
    // Send email verification
    var sendEmailVerification = function (email) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch('/api/auth/send-verification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: email }),
                        })];
                case 1:
                    response = _a.sent();
                    if (response.ok) {
                        setEmailVerificationSent(true);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Handle form submission
    var handleSubmit = function () { return __awaiter(_this, void 0, void 0, function () {
        var isValid, formData, registrationData, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, validateCurrentStep()];
                case 1:
                    isValid = _a.sent();
                    if (!isValid)
                        return [2 /*return*/];
                    setIsSubmitting(true);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, 6, 7]);
                    formData = form.getValues();
                    registrationData = {
                        email: formData.email,
                        password: formData.password,
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        phone: formData.phone,
                        agreeToTerms: formData.agreeToTerms,
                    };
                    return [4 /*yield*/, registerMutation.mutateAsync(registrationData)];
                case 3:
                    _a.sent();
                    // Send email verification
                    return [4 /*yield*/, sendEmailVerification(formData.email)];
                case 4:
                    // Send email verification
                    _a.sent();
                    // Clear saved form data
                    localStorage.removeItem('registrationFormData');
                    onComplete(registrationData);
                    return [3 /*break*/, 7];
                case 5:
                    error_3 = _a.sent();
                    return [3 /*break*/, 7];
                case 6:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    // Get password strength info
    var getPasswordStrengthInfo = function () {
        if (!passwordStrength)
            return null;
        var colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
        var labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
        return {
            color: colors[passwordStrength.score],
            label: labels[passwordStrength.score],
            progress: (passwordStrength.score + 1) * 20,
        };
    };
    var strengthInfo = getPasswordStrengthInfo();
    var progress = ((currentStep + 1) / steps.length) * 100;
    return (<div className={"w-full max-w-2xl mx-auto ".concat(className)}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <logo_1.Logo size="xl" variant="default"/>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
        <p className="text-sm text-gray-600 mt-2">
          Join TripleCheck for verified property listings
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <progress_1.Progress value={progress} className="h-2"/>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between mb-8">
        {steps.map(function (step, index) { return (<button key={step.id} onClick={function () { return handleStepClick(index); }} className={"flex flex-col items-center p-3 rounded-lg transition-colors ".concat(index === currentStep
                ? 'bg-primary text-primary-foreground'
                : completedSteps.has(index)
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : index < currentStep
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed')} disabled={index > currentStep && !completedSteps.has(index)}>
            <div className="flex items-center justify-center w-8 h-8 rounded-full mb-2">
              {completedSteps.has(index) ? (<lucide_react_1.Check className="w-4 h-4"/>) : (step.icon)}
            </div>
            <span className="text-xs font-medium text-center">{step.title}</span>
          </button>); })}
      </div>

      {/* Form Content */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle className="flex items-center gap-2">
            {steps[currentStep].icon}
            {steps[currentStep].title}
          </card_1.CardTitle>
          <p className="text-sm text-gray-600">{steps[currentStep].description}</p>
        </card_1.CardHeader>
        <card_1.CardContent>
          <form_1.Form {...form}>
            <form className="space-y-6">
              {/* Personal Information Step */}
              {currentStep === 0 && (<div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <form_1.FormField control={form.control} name="firstName" render={function (_a) {
                var field = _a.field;
                return (<form_1.FormItem>
                          <form_1.FormLabel>First Name</form_1.FormLabel>
                          <form_1.FormControl>
                            <input_1.Input placeholder="Enter your first name" {...field}/>
                          </form_1.FormControl>
                          <form_1.FormMessage />
                        </form_1.FormItem>);
            }}/>
                    <form_1.FormField control={form.control} name="lastName" render={function (_a) {
                var field = _a.field;
                return (<form_1.FormItem>
                          <form_1.FormLabel>Last Name</form_1.FormLabel>
                          <form_1.FormControl>
                            <input_1.Input placeholder="Enter your last name" {...field}/>
                          </form_1.FormControl>
                          <form_1.FormMessage />
                        </form_1.FormItem>);
            }}/>
                  </div>
                  
                  <form_1.FormField control={form.control} name="email" render={function (_a) {
                var field = _a.field;
                return (<form_1.FormItem>
                        <form_1.FormLabel>Email Address</form_1.FormLabel>
                        <form_1.FormControl>
                          <div className="relative">
                            <lucide_react_1.Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                            <input_1.Input type="email" placeholder="Enter your email address" className="pl-10" {...field}/>
                          </div>
                        </form_1.FormControl>
                        <form_1.FormMessage />
                      </form_1.FormItem>);
            }}/>
                  
                  <form_1.FormField control={form.control} name="phone" render={function (_a) {
                var field = _a.field;
                return (<form_1.FormItem>
                        <form_1.FormLabel>Phone Number (Optional)</form_1.FormLabel>
                        <form_1.FormControl>
                          <div className="relative">
                            <lucide_react_1.Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400"/>
                            <input_1.Input type="tel" placeholder="Enter your phone number" className="pl-10" {...field}/>
                          </div>
                        </form_1.FormControl>
                        <form_1.FormMessage />
                      </form_1.FormItem>);
            }}/>
                </div>)}

              {/* Password Step */}
              {currentStep === 1 && (<div className="space-y-4">
                  <form_1.FormField control={form.control} name="password" render={function (_a) {
                var field = _a.field;
                return (<form_1.FormItem>
                        <form_1.FormLabel>Password</form_1.FormLabel>
                        <form_1.FormControl>
                          <input_1.Input type="password" placeholder="Create a strong password" {...field} onChange={function (e) {
                        field.onChange(e);
                        checkPasswordStrength(e.target.value);
                    }}/>
                        </form_1.FormControl>
                        <form_1.FormMessage />
                        
                        {/* Password Strength Indicator */}
                        {passwordStrength && strengthInfo && (<div className="mt-2 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">Password strength:</span>
                              <span className={"font-medium ".concat(passwordStrength.score >= 3 ? 'text-green-600' :
                            passwordStrength.score >= 2 ? 'text-yellow-600' : 'text-red-600')}>
                                {strengthInfo.label}
                              </span>
                            </div>
                            <progress_1.Progress value={strengthInfo.progress} className="h-2"/>
                            {passwordStrength.warning && (<div className="flex items-start gap-2 text-xs text-amber-600">
                                <lucide_react_1.AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0"/>
                                <span>{passwordStrength.warning}</span>
                              </div>)}
                            {passwordStrength.feedback.length > 0 && (<div className="space-y-1">
                                {passwordStrength.feedback.map(function (suggestion, index) { return (<div key={index} className="flex items-start gap-2 text-xs text-blue-600">
                                    <lucide_react_1.CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0"/>
                                    <span>{suggestion}</span>
                                  </div>); })}
                              </div>)}
                          </div>)}
                      </form_1.FormItem>);
            }}/>
                  
                  <form_1.FormField control={form.control} name="confirmPassword" render={function (_a) {
                var field = _a.field;
                return (<form_1.FormItem>
                        <form_1.FormLabel>Confirm Password</form_1.FormLabel>
                        <form_1.FormControl>
                          <input_1.Input type="password" placeholder="Confirm your password" {...field}/>
                        </form_1.FormControl>
                        <form_1.FormMessage />
                      </form_1.FormItem>);
            }}/>
                </div>)}

              {/* Profile Setup Step */}
              {currentStep === 2 && (<div className="space-y-6">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="relative">
                        <avatar_1.Avatar className="w-24 h-24">
                          <avatar_1.AvatarImage src={profilePhotoPreview || undefined}/>
                          <avatar_1.AvatarFallback className="text-lg">
                            {(_b = form.getValues('firstName')) === null || _b === void 0 ? void 0 : _b[0]}{(_c = form.getValues('lastName')) === null || _c === void 0 ? void 0 : _c[0]}
                          </avatar_1.AvatarFallback>
                        </avatar_1.Avatar>
                        <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                          <lucide_react_1.Camera className="w-4 h-4"/>
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden"/>
                        </label>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Upload a profile photo (optional)
                    </p>
                  </div>
                  
                  <form_1.FormField control={form.control} name="bio" render={function (_a) {
                var _b;
                var field = _a.field;
                return (<form_1.FormItem>
                        <form_1.FormLabel>Bio (Optional)</form_1.FormLabel>
                        <form_1.FormControl>
                          <textarea_1.Textarea placeholder="Tell us a bit about yourself..." className="resize-none" rows={4} {...field}/>
                        </form_1.FormControl>
                        <div className="text-xs text-gray-500 text-right">
                          {((_b = field.value) === null || _b === void 0 ? void 0 : _b.length) || 0}/500 characters
                        </div>
                        <form_1.FormMessage />
                      </form_1.FormItem>);
            }}/>
                </div>)}

              {/* Terms & Conditions Step */}
              {currentStep === 3 && (<div className="space-y-6">
                  <div className="space-y-4">
                    <form_1.FormField control={form.control} name="agreeToTerms" render={function (_a) {
                var field = _a.field;
                return (<form_1.FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <form_1.FormControl>
                            <checkbox_1.Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                          </form_1.FormControl>
                          <div className="space-y-1 leading-none">
                            <form_1.FormLabel className="text-sm">
                              I agree to the{' '}
                              <a href="/terms" target="_blank" className="text-primary hover:underline">
                                Terms of Service
                              </a>
                            </form_1.FormLabel>
                          </div>
                        </form_1.FormItem>);
            }}/>
                    
                    <form_1.FormField control={form.control} name="agreeToPrivacy" render={function (_a) {
                var field = _a.field;
                return (<form_1.FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <form_1.FormControl>
                            <checkbox_1.Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                          </form_1.FormControl>
                          <div className="space-y-1 leading-none">
                            <form_1.FormLabel className="text-sm">
                              I agree to the{' '}
                              <a href="/privacy" target="_blank" className="text-primary hover:underline">
                                Privacy Policy
                              </a>
                            </form_1.FormLabel>
                          </div>
                        </form_1.FormItem>);
            }}/>
                    
                    <form_1.FormField control={form.control} name="agreeToMarketing" render={function (_a) {
                var field = _a.field;
                return (<form_1.FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <form_1.FormControl>
                            <checkbox_1.Checkbox checked={field.value} onCheckedChange={field.onChange}/>
                          </form_1.FormControl>
                          <div className="space-y-1 leading-none">
                            <form_1.FormLabel className="text-sm">
                              I would like to receive marketing emails and updates (optional)
                            </form_1.FormLabel>
                          </div>
                        </form_1.FormItem>);
            }}/>
                  </div>

                  {emailVerificationSent && (<alert_1.Alert>
                      <lucide_react_1.CheckCircle className="h-4 w-4"/>
                      <alert_1.AlertDescription>
                        A verification email will be sent to your email address after registration.
                      </alert_1.AlertDescription>
                    </alert_1.Alert>)}
                </div>)}

              {/* Error Display */}
              {registerMutation.error && (<alert_1.Alert variant="destructive">
                  <lucide_react_1.AlertCircle className="h-4 w-4"/>
                  <alert_1.AlertDescription>
                    {registerMutation.error instanceof Error
                ? registerMutation.error.message
                : 'Registration failed. Please try again.'}
                  </alert_1.AlertDescription>
                </alert_1.Alert>)}
            </form>
          </form_1.Form>
        </card_1.CardContent>
      </card_1.Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button_1.Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0} className="flex items-center gap-2">
          <lucide_react_1.ChevronLeft className="w-4 h-4"/>
          Previous
        </button_1.Button>
        
        {currentStep < steps.length - 1 ? (<button_1.Button type="button" onClick={handleNext} className="flex items-center gap-2">
            Next
            <lucide_react_1.ChevronRight className="w-4 h-4"/>
          </button_1.Button>) : (<button_1.Button type="button" onClick={handleSubmit} disabled={isSubmitting || registerMutation.isPending} className="flex items-center gap-2">
            {isSubmitting || registerMutation.isPending ? ('Creating Account...') : (<>
                Create Account
                <lucide_react_1.Check className="w-4 h-4"/>
              </>)}
          </button_1.Button>)}
      </div>

      {/* Sign In Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in
          </a>
        </p>
      </div>
    </div>);
}
exports.default = RegistrationWizard;
