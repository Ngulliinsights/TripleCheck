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
exports.LoginForm = LoginForm;
var zod_1 = require("@hookform/resolvers/zod");
var browser_1 = require("@simplewebauthn/browser");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var zod_2 = require("zod");
var zxcvbn_1 = require("zxcvbn");
var alert_1 = require("../../local/components/ui/alert");
var button_1 = require("../../local/components/ui/button");
var checkbox_1 = require("../../local/components/ui/checkbox");
var form_1 = require("../../local/components/ui/form");
var input_1 = require("../../local/components/ui/input");
var logo_1 = require("../../local/components/ui/logo");
var progress_1 = require("../../local/components/ui/progress");
var separator_1 = require("../../local/components/ui/separator");
var useAuth_1 = require("../hooks/useAuth");
// Validation schema with proper typing
var loginSchema = zod_2.z.object({
    email: zod_2.z
        .string()
        .min(1, 'Email is required')
        .email('Please enter a valid email address'),
    password: zod_2.z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters'),
    rememberMe: zod_2.z.boolean(),
});
function LoginForm(_a) {
    var _this = this;
    var onSuccess = _a.onSuccess, redirectTo = _a.redirectTo, _b = _a.showSocialLogin, showSocialLogin = _b === void 0 ? true : _b, _c = _a.enableTwoFactor, enableTwoFactor = _c === void 0 ? true : _c, _d = _a.enableBiometric, enableBiometric = _d === void 0 ? true : _d, _e = _a.className, className = _e === void 0 ? '' : _e;
    var _f = (0, react_1.useState)(false), showPassword = _f[0], setShowPassword = _f[1];
    var _g = (0, react_1.useState)(null), passwordStrength = _g[0], setPasswordStrength = _g[1];
    var _h = (0, react_1.useState)(false), isWebAuthnSupported = _h[0], setIsWebAuthnSupported = _h[1];
    var _j = (0, react_1.useState)(null), socialLoginLoading = _j[0], setSocialLoginLoading = _j[1];
    var _k = (0, react_1.useState)(false), biometricLoading = _k[0], setBiometricLoading = _k[1];
    var loginMutation = (0, useAuth_1.useLogin)();
    var form = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });
    // Check WebAuthn support
    (0, react_1.useEffect)(function () {
        setIsWebAuthnSupported(typeof window !== 'undefined' &&
            'PublicKeyCredential' in window &&
            typeof window.PublicKeyCredential === 'function');
    }, []);
    // Password strength checking with proper typing
    var checkPasswordStrength = function (password) {
        if (!password) {
            setPasswordStrength(null);
            return;
        }
        var result = (0, zxcvbn_1.default)(password);
        setPasswordStrength({
            score: result.score,
            feedback: {
                warning: result.feedback.warning || '',
                suggestions: result.feedback.suggestions || [],
            },
        });
    };
    // Handle form submission with proper typing
    var onSubmit = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var credentials, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    credentials = {
                        email: data.email,
                        password: data.password,
                        rememberMe: data.rememberMe,
                    };
                    return [4 /*yield*/, loginMutation.mutateAsync(credentials)];
                case 1:
                    result = _a.sent();
                    if (result.data.user) {
                        // Store remember me preference
                        if (data.rememberMe) {
                            localStorage.setItem('rememberMe', 'true');
                            localStorage.setItem('rememberedEmail', data.email);
                        }
                        else {
                            localStorage.removeItem('rememberMe');
                            localStorage.removeItem('rememberedEmail');
                        }
                        onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(result.data.user);
                        // Redirect if specified
                        if (redirectTo) {
                            window.location.href = redirectTo;
                        }
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    console.error('Login failed:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Handle social login
    var handleSocialLogin = function (provider) { return __awaiter(_this, void 0, void 0, function () {
        var baseUrl, redirectUrl;
        return __generator(this, function (_a) {
            setSocialLoginLoading(provider);
            try {
                baseUrl = window.location.origin;
                redirectUrl = redirectTo ? "?redirect=".concat(encodeURIComponent(redirectTo)) : '';
                window.location.href = "".concat(baseUrl, "/api/auth/").concat(provider).concat(redirectUrl);
            }
            catch (error) {
                console.error("".concat(provider, " login failed:"), error);
                setSocialLoginLoading(null);
            }
            return [2 /*return*/];
        });
    }); };
    // Handle biometric authentication
    var handleBiometricLogin = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, options, credential, verificationResponse, result, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isWebAuthnSupported)
                        return [2 /*return*/];
                    setBiometricLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, 8, 9]);
                    return [4 /*yield*/, fetch('/api/auth/webauthn/authentication/options', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: form.getValues('email') }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to get authentication options');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    options = _a.sent();
                    return [4 /*yield*/, (0, browser_1.startAuthentication)(options)];
                case 4:
                    credential = _a.sent();
                    return [4 /*yield*/, fetch('/api/auth/webauthn/authentication/verification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: form.getValues('email'),
                                credential: credential,
                            }),
                        })];
                case 5:
                    verificationResponse = _a.sent();
                    if (!verificationResponse.ok) {
                        throw new Error('Biometric authentication failed');
                    }
                    return [4 /*yield*/, verificationResponse.json()];
                case 6:
                    result = _a.sent();
                    if (result.data.user) {
                        onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(result.data.user);
                        if (redirectTo) {
                            window.location.href = redirectTo;
                        }
                    }
                    return [3 /*break*/, 9];
                case 7:
                    error_2 = _a.sent();
                    console.error('Biometric authentication failed:', error_2);
                    return [3 /*break*/, 9];
                case 8:
                    setBiometricLoading(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    // Load remembered email on mount
    (0, react_1.useEffect)(function () {
        var rememberMe = localStorage.getItem('rememberMe') === 'true';
        var rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberMe && rememberedEmail) {
            form.setValue('email', rememberedEmail);
            form.setValue('rememberMe', true);
        }
    }, [form]);
    // Get password strength color and text
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
    return (<div className={"w-full max-w-md mx-auto ".concat(className)}>
      {/* Header */}
      <div className="text-center mb-10">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <logo_1.Logo size="xl" variant="default"/>
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-base text-gray-600 leading-relaxed">
            Sign in to your TripleCheck account to continue
          </p>
        </div>
      </div>

      {/* Social Login Section */}
      {showSocialLogin && (<div className="space-y-4 mb-8">
          <div className="grid gap-3">
            <button_1.Button type="button" variant="outline" className="w-full h-12 text-sm font-medium border-2 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200" onClick={function () { return handleSocialLogin('google'); }} disabled={socialLoginLoading === 'google'}>
              <lucide_react_1.Chrome className="w-5 h-5 mr-3 text-blue-600"/>
              {socialLoginLoading === 'google' ? 'Connecting...' : 'Continue with Google'}
            </button_1.Button>
            
            <button_1.Button type="button" variant="outline" className="w-full h-12 text-sm font-medium border-2 hover:border-primary/20 hover:bg-primary/5 transition-all duration-200" onClick={function () { return handleSocialLogin('facebook'); }} disabled={socialLoginLoading === 'facebook'}>
              <lucide_react_1.Facebook className="w-5 h-5 mr-3 text-blue-700"/>
              {socialLoginLoading === 'facebook' ? 'Connecting...' : 'Continue with Facebook'}
            </button_1.Button>

            {/* Biometric Login */}
            {enableBiometric && isWebAuthnSupported && (<button_1.Button type="button" variant="outline" className="w-full h-12 text-sm font-medium border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-200" onClick={handleBiometricLogin} disabled={biometricLoading || !form.watch('email')}>
                <lucide_react_1.Fingerprint className="w-5 h-5 mr-3 text-green-600"/>
                {biometricLoading ? 'Authenticating...' : 'Use Biometric Login'}
              </button_1.Button>)}
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <separator_1.Separator className="w-full"/>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                Or continue with email
              </span>
            </div>
          </div>
        </div>)}

      {/* Login Form */}
      <form_1.Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <react_hook_form_1.Controller control={form.control} name="email" render={function (_a) {
            var field = _a.field, fieldState = _a.fieldState;
            return (<form_1.FormItem className="space-y-3">
                <form_1.FormLabel className="text-sm font-semibold text-gray-700">
                  Email Address
                </form_1.FormLabel>
                <form_1.FormControl>
                  <input_1.Input type="email" placeholder="Enter your email address" {...field} className="w-full h-12 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"/>
                </form_1.FormControl>
                {fieldState.error && (<form_1.FormMessage className="text-sm">{fieldState.error.message}</form_1.FormMessage>)}
              </form_1.FormItem>);
        }}/>

          {/* Password Field */}
          <react_hook_form_1.Controller control={form.control} name="password" render={function (_a) {
            var field = _a.field, fieldState = _a.fieldState;
            return (<form_1.FormItem className="space-y-3">
                <form_1.FormLabel className="text-sm font-semibold text-gray-700">
                  Password
                </form_1.FormLabel>
                <form_1.FormControl>
                  <div className="relative">
                    <input_1.Input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" {...field} onChange={function (e) {
                    field.onChange(e);
                    checkPasswordStrength(e.target.value);
                }} className="w-full h-12 text-base border-2 border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 pr-12"/>
                    <button_1.Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={function () { return setShowPassword(!showPassword); }}>
                      {showPassword ? (<lucide_react_1.EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600"/>) : (<lucide_react_1.Eye className="h-5 w-5 text-gray-400 hover:text-gray-600"/>)}
                    </button_1.Button>
                  </div>
                </form_1.FormControl>
                {fieldState.error && (<form_1.FormMessage className="text-sm">{fieldState.error.message}</form_1.FormMessage>)}
                
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
                    {passwordStrength.feedback.warning && (<div className="flex items-start gap-2 text-xs text-amber-600">
                        <lucide_react_1.AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0"/>
                        <span>{passwordStrength.feedback.warning}</span>
                      </div>)}
                    {passwordStrength.feedback.suggestions.length > 0 && (<div className="space-y-1">
                        {passwordStrength.feedback.suggestions.map(function (suggestion, index) { return (<div key={index} className="flex items-start gap-2 text-xs text-blue-600">
                            <lucide_react_1.CheckCircle className="h-3 w-3 mt-0.5 flex-shrink-0"/>
                            <span>{suggestion}</span>
                          </div>); })}
                      </div>)}
                  </div>)}
              </form_1.FormItem>);
        }}/>

          {/* Remember Me */}
          <react_hook_form_1.Controller control={form.control} name="rememberMe" render={function (_a) {
            var field = _a.field;
            return (<form_1.FormItem className="flex flex-row items-center space-x-3 space-y-0 py-2">
                <form_1.FormControl>
                  <checkbox_1.Checkbox checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"/>
                </form_1.FormControl>
                <div className="space-y-1 leading-none">
                  <form_1.FormLabel className="text-sm font-medium text-gray-700 cursor-pointer">
                    Remember me on this device
                  </form_1.FormLabel>
                </div>
              </form_1.FormItem>);
        }}/>

          {/* Error Display */}
          {loginMutation.error && (<alert_1.Alert variant="destructive">
              <lucide_react_1.AlertCircle className="h-4 w-4"/>
              <alert_1.AlertDescription>
                {loginMutation.error instanceof Error
                ? loginMutation.error.message
                : 'Login failed. Please check your credentials and try again.'}
              </alert_1.AlertDescription>
            </alert_1.Alert>)}

          {/* Submit Button */}
          <div className="pt-4">
            <button_1.Button type="submit" className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? (<div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                  <span>Signing in...</span>
                </div>) : ('Sign In')}
            </button_1.Button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center pt-4">
            <a href="/auth/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors duration-200">
              Forgot your password?
            </a>
          </div>
        </form>
      </form_1.Form>

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/auth/register" className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors duration-200">
              Create account
            </a>
          </p>
        </div>
      </div>
    </div>);
}
exports.default = LoginForm;
