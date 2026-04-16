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
exports.default = ForgotPassword;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var react_router_dom_1 = require("react-router-dom");
var button_1 = require("../../local/components/ui/button");
var input_1 = require("../../local/components/ui/input");
var card_1 = require("../../local/components/ui/card");
var label_1 = require("../../local/components/ui/label");
var use_toast_1 = require("../../local/hooks/use-toast");
function ForgotPassword() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)({
        step: "email",
        email: "",
        verificationCode: "",
        isLoading: false,
    }), resetState = _a[0], setResetState = _a[1];
    var updateState = (0, react_1.useCallback)(function (key, value) {
        setResetState(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    }, []);
    var handleEmailSubmit = (0, react_1.useCallback)(function (e) { return __awaiter(_this, void 0, void 0, function () {
        var emailRegex, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!resetState.email.trim()) {
                        toast({
                            title: "Email required",
                            description: "Please enter your email address.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(resetState.email)) {
                        toast({
                            title: "Invalid email",
                            description: "Please enter a valid email address.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    updateState("isLoading", true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 2:
                    // Simulate API call
                    _a.sent();
                    updateState("step", "verification");
                    toast({
                        title: "Verification code sent",
                        description: "Check your email for the password reset code.",
                    });
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: "Failed to send reset email",
                        description: "Please try again later or contact support.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 4:
                    updateState("isLoading", false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [resetState.email, toast, updateState]);
    var handleVerificationSubmit = (0, react_1.useCallback)(function (e) { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!resetState.verificationCode.trim()) {
                        toast({
                            title: "Verification code required",
                            description: "Please enter the code sent to your email.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    if (resetState.verificationCode.length !== 6) {
                        toast({
                            title: "Invalid code",
                            description: "Verification code must be 6 digits.",
                            variant: "destructive",
                        });
                        return [2 /*return*/];
                    }
                    updateState("isLoading", true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                case 2:
                    // Simulate API call
                    _a.sent();
                    updateState("step", "success");
                    toast({
                        title: "Password reset successful",
                        description: "Your password has been reset. You can now log in.",
                    });
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    toast({
                        title: "Invalid verification code",
                        description: "Please check the code and try again.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 4:
                    updateState("isLoading", false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [resetState.verificationCode, toast, updateState]);
    var handleResendCode = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    updateState("isLoading", true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 2:
                    // Simulate API call
                    _a.sent();
                    toast({
                        title: "Code resent",
                        description: "A new verification code has been sent to your email.",
                    });
                    return [3 /*break*/, 5];
                case 3:
                    error_3 = _a.sent();
                    toast({
                        title: "Failed to resend code",
                        description: "Please try again later.",
                        variant: "destructive",
                    });
                    return [3 /*break*/, 5];
                case 4:
                    updateState("isLoading", false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [toast, updateState]);
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        <div className="mb-6">
          <react_router_dom_1.Link to="/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <lucide_react_1.ArrowLeft className="w-4 h-4 mr-2"/>
            Back to Login
          </react_router_dom_1.Link>
        </div>

        <card_1.Card className="shadow-lg">
          <card_1.CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <lucide_react_1.Shield className="w-8 h-8 text-primary"/>
            </div>
            <card_1.CardTitle className="text-2xl">
              {resetState.step === "email" && "Reset Password"}
              {resetState.step === "verification" && "Enter Verification Code"}
              {resetState.step === "success" && "Password Reset Complete"}
            </card_1.CardTitle>
            <p className="text-muted-foreground mt-2">
              {resetState.step === "email" &&
            "Enter your email address and we'll send you a reset code"}
              {resetState.step === "verification" &&
            "We've sent a 6-digit code to ".concat(resetState.email)}
              {resetState.step === "success" &&
            "Your password has been successfully reset"}
            </p>
          </card_1.CardHeader>

          <card_1.CardContent>
            {resetState.step === "email" && (<form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label_1.Label htmlFor="email">Email Address</label_1.Label>
                  <input_1.Input id="email" type="email" placeholder="Enter your email address" value={resetState.email} onChange={function (e) { return updateState("email", e.target.value); }} disabled={resetState.isLoading} required/>
                </div>

                <button_1.Button type="submit" className="w-full" disabled={resetState.isLoading}>
                  {resetState.isLoading ?
                <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"/>
                      Sending Reset Code...
                    </>
                : <>
                      <lucide_react_1.Send className="w-4 h-4 mr-2"/>
                      Send Reset Code
                    </>}
                </button_1.Button>
              </form>)}

            {resetState.step === "verification" && (<form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div>
                  <label_1.Label htmlFor="code">Verification Code</label_1.Label>
                  <input_1.Input id="code" type="text" placeholder="Enter 6-digit code" value={resetState.verificationCode} onChange={function (e) {
                return updateState("verificationCode", e.target.value.replace(/\D/g, "").slice(0, 6));
            }} disabled={resetState.isLoading} maxLength={6} className="text-center text-lg tracking-widest" required/>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check your email for the 6-digit verification code
                  </p>
                </div>

                <button_1.Button type="submit" className="w-full" disabled={resetState.isLoading ||
                resetState.verificationCode.length !== 6}>
                  {resetState.isLoading ?
                <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"/>
                      Verifying...
                    </>
                : <>
                      <lucide_react_1.CheckCircle className="w-4 h-4 mr-2"/>
                      Reset Password
                    </>}
                </button_1.Button>

                <div className="text-center">
                  <button type="button" onClick={handleResendCode} disabled={resetState.isLoading} className="text-sm text-primary hover:underline disabled:opacity-50">
                    Didn't receive the code? Resend
                  </button>
                </div>
              </form>)}

            {resetState.step === "success" && (<div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <lucide_react_1.CheckCircle className="w-8 h-8 text-green-600"/>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Password Reset Complete!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Your password has been successfully reset. You can now log
                    in with your new password.
                  </p>
                </div>

                <react_router_dom_1.Link to="/login">
                  <button_1.Button className="w-full">Continue to Login</button_1.Button>
                </react_router_dom_1.Link>
              </div>)}
          </card_1.CardContent>
        </card_1.Card>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <lucide_react_1.AlertCircle className="w-5 h-5 text-blue-600 mt-0.5"/>
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Security Notice</p>
              <p className="text-blue-700">
                For your security, password reset links expire after 15 minutes.
                If you didn't request this reset, please contact our support
                team.
              </p>
            </div>
          </div>
        </div>

        {/* Help Links */}
        <div className="mt-6 text-center space-x-4 text-sm">
          <react_router_dom_1.Link to="/help" className="text-muted-foreground hover:text-primary">
            Need Help?
          </react_router_dom_1.Link>
          <span className="text-muted-foreground">•</span>
          <react_router_dom_1.Link to="/contact" className="text-muted-foreground hover:text-primary">
            Contact Support
          </react_router_dom_1.Link>
        </div>
      </div>
    </div>);
}
