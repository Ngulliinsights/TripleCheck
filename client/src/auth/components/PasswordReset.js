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
exports.PasswordReset = void 0;
var zod_1 = require("@hookform/resolvers/zod");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var react_router_dom_1 = require("react-router-dom");
var zod_2 = require("zod");
var zxcvbn_1 = require("zxcvbn");
var alert_1 = require("../../local/components/ui/alert");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var form_1 = require("../../local/components/ui/form");
var input_1 = require("../../local/components/ui/input");
var progress_1 = require("../../local/components/ui/progress");
var useAuth_1 = require("../hooks/useAuth");
// Simple logging utility to replace console statements
var logger = {
    error: function (message, error) {
        // In production, this would send to a logging service
        if (process.env.NODE_ENV === "development") {
            // Development logging - would be replaced with proper logging service
            // eslint-disable-next-line no-console
            console.error(message, error);
        }
    },
};
// Constants
var LOCKOUT_CONFIG = {
    STORAGE_KEY: "password_reset_lockout",
    MAX_ATTEMPTS: 5,
    DURATION_MS: 15 * 60 * 1000, // 15 minutes
};
var PASSWORD_CONFIG = {
    HISTORY_KEY: "password_history",
    MAX_HISTORY: 5,
    MIN_STRENGTH_SCORE: 2,
};
var SECURITY_CONFIG = {
    NOTIFICATIONS_KEY: "security_notifications",
    MAX_NOTIFICATIONS: 10,
    DISPLAY_COUNT: 3,
};
// Validation schemas
var requestResetSchema = zod_2.z.object({
    email: zod_2.z
        .string()
        .min(1, "Email address is required")
        .email("Please enter a valid email address")
        .max(254, "Email address is too long"),
});
var resetPasswordSchema = zod_2.z
    .object({
    password: zod_2.z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters long")
        .max(128, "Password must be less than 128 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: zod_2.z.string().min(1, "Please confirm your password"),
})
    .refine(function (data) { return data.password === data.confirmPassword; }, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});
// Utility functions
var createSimpleHash = function (input) {
    // Simple hash for demo - in production, use proper hashing like bcrypt
    if (typeof (window === null || window === void 0 ? void 0 : window.btoa) !== "undefined") {
        return window.btoa(input);
    }
    // Fallback for environments without btoa
    return Buffer.from(input, "utf-8").toString("base64");
};
var formatTimeRemaining = function (milliseconds) {
    var minutes = Math.ceil(milliseconds / 60000);
    return minutes === 1 ? "1 minute" : "".concat(minutes, " minutes");
};
var checkPasswordStrength = function (password) {
    if (!password) {
        return { score: 0, feedback: [], warning: "" };
    }
    var result = (0, zxcvbn_1.default)(password);
    return {
        score: result.score,
        feedback: result.feedback.suggestions,
        warning: result.feedback.warning || "",
    };
};
// Account lockout management
var AccountLockoutManager = /** @class */ (function () {
    function AccountLockoutManager() {
    }
    AccountLockoutManager.getStorageKey = function (email) {
        return "".concat(LOCKOUT_CONFIG.STORAGE_KEY, "_").concat(email);
    };
    AccountLockoutManager.getAccountLockout = function (email) {
        try {
            var stored = localStorage.getItem(this.getStorageKey(email));
            if (!stored) {
                return {
                    isLocked: false,
                    attemptCount: 0,
                    maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
                };
            }
            var lockout = JSON.parse(stored);
            var now = new Date();
            var lockoutUntil = lockout.lockoutUntil ? new Date(lockout.lockoutUntil) : null;
            if (lockoutUntil && now < lockoutUntil) {
                return {
                    isLocked: true,
                    lockoutUntil: lockoutUntil,
                    attemptCount: lockout.attemptCount,
                    maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
                };
            }
            if (lockoutUntil && now >= lockoutUntil) {
                localStorage.removeItem(this.getStorageKey(email));
                return {
                    isLocked: false,
                    attemptCount: 0,
                    maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
                };
            }
            return {
                isLocked: false,
                attemptCount: lockout.attemptCount || 0,
                maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
            };
        }
        catch (error) {
            logger.error("Error reading account lockout:", error);
            return {
                isLocked: false,
                attemptCount: 0,
                maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
            };
        }
    };
    AccountLockoutManager.updateAccountLockout = function (email, failed) {
        if (failed === void 0) { failed = false; }
        try {
            if (failed) {
                var current = this.getAccountLockout(email);
                var newAttemptCount = current.attemptCount + 1;
                var shouldLock = newAttemptCount >= LOCKOUT_CONFIG.MAX_ATTEMPTS;
                var lockout = {
                    attemptCount: newAttemptCount,
                    lockoutUntil: shouldLock ?
                        new Date(Date.now() + LOCKOUT_CONFIG.DURATION_MS)
                        : null,
                };
                localStorage.setItem(this.getStorageKey(email), JSON.stringify(lockout));
            }
            else {
                localStorage.removeItem(this.getStorageKey(email));
            }
        }
        catch (error) {
            logger.error("Error updating account lockout:", error);
        }
    };
    return AccountLockoutManager;
}());
// Password history management
var PasswordHistoryManager = /** @class */ (function () {
    function PasswordHistoryManager() {
    }
    PasswordHistoryManager.getStorageKey = function (email) {
        return "".concat(PASSWORD_CONFIG.HISTORY_KEY, "_").concat(email);
    };
    PasswordHistoryManager.getPasswordHistory = function (email) {
        try {
            var stored = localStorage.getItem(this.getStorageKey(email));
            return stored ? JSON.parse(stored) : [];
        }
        catch (error) {
            logger.error("Error reading password history:", error);
            return [];
        }
    };
    PasswordHistoryManager.addToPasswordHistory = function (email, passwordHash) {
        try {
            var history_1 = this.getPasswordHistory(email);
            history_1.unshift(passwordHash);
            var trimmedHistory = history_1.slice(0, PASSWORD_CONFIG.MAX_HISTORY);
            localStorage.setItem(this.getStorageKey(email), JSON.stringify(trimmedHistory));
        }
        catch (error) {
            logger.error("Error updating password history:", error);
        }
    };
    PasswordHistoryManager.isPasswordReused = function (email, password) {
        try {
            var history_2 = this.getPasswordHistory(email);
            var hash = createSimpleHash(password);
            return history_2.includes(hash);
        }
        catch (error) {
            logger.error("Error checking password reuse:", error);
            return false;
        }
    };
    return PasswordHistoryManager;
}());
// Security notification management
var SecurityNotificationManager = /** @class */ (function () {
    function SecurityNotificationManager() {
    }
    SecurityNotificationManager.addNotification = function (notification) {
        try {
            var notifications = JSON.parse(localStorage.getItem(SECURITY_CONFIG.NOTIFICATIONS_KEY) || "[]");
            notifications.unshift(notification);
            var trimmed = notifications.slice(0, SECURITY_CONFIG.MAX_NOTIFICATIONS);
            localStorage.setItem(SECURITY_CONFIG.NOTIFICATIONS_KEY, JSON.stringify(trimmed));
        }
        catch (error) {
            logger.error("Error adding security notification:", error);
        }
    };
    SecurityNotificationManager.getRecentNotifications = function (count) {
        if (count === void 0) { count = SECURITY_CONFIG.DISPLAY_COUNT; }
        try {
            var notifications = JSON.parse(localStorage.getItem(SECURITY_CONFIG.NOTIFICATIONS_KEY) || "[]");
            return notifications.slice(0, count);
        }
        catch (error) {
            logger.error("Error reading security notifications:", error);
            return [];
        }
    };
    return SecurityNotificationManager;
}());
var PasswordReset = function () {
    var searchParams = (0, react_router_dom_1.useSearchParams)()[0];
    var navigate = (0, react_router_dom_1.useNavigate)();
    var urlParams = (0, react_1.useMemo)(function () { return ({
        token: searchParams.get("token"),
        email: searchParams.get("email"),
    }); }, [searchParams]);
    var _a = (0, react_1.useState)("request"), step = _a[0], setStep = _a[1];
    var _b = (0, react_1.useState)(false), showPassword = _b[0], setShowPassword = _b[1];
    var _c = (0, react_1.useState)(false), showConfirmPassword = _c[0], setShowConfirmPassword = _c[1];
    var _d = (0, react_1.useState)({
        score: 0,
        feedback: [],
        warning: "",
    }), passwordStrength = _d[0], setPasswordStrength = _d[1];
    var _e = (0, react_1.useState)({
        isLocked: false,
        attemptCount: 0,
        maxAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
    }), accountLockout = _e[0], setAccountLockout = _e[1];
    var _f = (0, react_1.useState)([]), securityNotifications = _f[0], setSecurityNotifications = _f[1];
    var _g = (0, react_1.useState)(false), isPasswordReusedError = _g[0], setIsPasswordReusedError = _g[1];
    var requestPasswordReset = (0, useAuth_1.useRequestPasswordReset)();
    var resetPassword = (0, useAuth_1.useResetPassword)();
    var requestForm = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(requestResetSchema),
        defaultValues: { email: urlParams.email || "" },
        mode: "onBlur",
    });
    var resetForm = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
        mode: "onBlur",
    });
    (0, react_1.useEffect)(function () {
        if (urlParams.token) {
            setStep("reset");
        }
        if (urlParams.email) {
            var lockout = AccountLockoutManager.getAccountLockout(urlParams.email);
            setAccountLockout(lockout);
        }
        var notifications = SecurityNotificationManager.getRecentNotifications();
        setSecurityNotifications(notifications);
    }, [urlParams.token, urlParams.email]);
    var handlePasswordChange = (0, react_1.useCallback)(function (password) {
        if (password) {
            var strength = checkPasswordStrength(password);
            setPasswordStrength(strength);
            var currentEmail = urlParams.email || requestForm.getValues("email");
            if (currentEmail &&
                PasswordHistoryManager.isPasswordReused(currentEmail, password)) {
                setIsPasswordReusedError(true);
            }
            else {
                setIsPasswordReusedError(false);
            }
        }
        else {
            setPasswordStrength({ score: 0, feedback: [], warning: "" });
            setIsPasswordReusedError(false);
        }
    }, [urlParams.email, requestForm]);
    var handleRequestReset = function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var lockout, timeRemaining, error_1, newLockout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lockout = AccountLockoutManager.getAccountLockout(data.email);
                    if (lockout.isLocked && lockout.lockoutUntil) {
                        timeRemaining = lockout.lockoutUntil.getTime() - Date.now();
                        SecurityNotificationManager.addNotification({
                            type: "error",
                            message: "Account temporarily locked. Try again in ".concat(formatTimeRemaining(timeRemaining), "."),
                            timestamp: new Date(),
                        });
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, requestPasswordReset.mutateAsync(data.email)];
                case 2:
                    _a.sent();
                    AccountLockoutManager.updateAccountLockout(data.email, false);
                    SecurityNotificationManager.addNotification({
                        type: "success",
                        message: "Password reset email sent successfully.",
                        timestamp: new Date(),
                    });
                    setStep("success");
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    logger.error("Password reset request failed:", error_1);
                    AccountLockoutManager.updateAccountLockout(data.email, true);
                    newLockout = AccountLockoutManager.getAccountLockout(data.email);
                    setAccountLockout(newLockout);
                    SecurityNotificationManager.addNotification({
                        type: "error",
                        message: "Failed to send password reset email. Please try again.",
                        timestamp: new Date(),
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var handleResetPassword = function (data) { return __awaiter(void 0, void 0, void 0, function () {
        var currentEmail, hash, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!urlParams.token) {
                        logger.error("No reset token provided");
                        return [2 /*return*/];
                    }
                    currentEmail = urlParams.email || "";
                    if (PasswordHistoryManager.isPasswordReused(currentEmail, data.password)) {
                        setIsPasswordReusedError(true);
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, resetPassword.mutateAsync({
                            token: urlParams.token,
                            password: data.password,
                        })];
                case 2:
                    _a.sent();
                    if (currentEmail) {
                        hash = createSimpleHash(data.password);
                        PasswordHistoryManager.addToPasswordHistory(currentEmail, hash);
                    }
                    SecurityNotificationManager.addNotification({
                        type: "success",
                        message: "Password reset successfully. Please log in with your new password.",
                        timestamp: new Date(),
                    });
                    setStep("success");
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _a.sent();
                    logger.error("Password reset failed:", error_2);
                    SecurityNotificationManager.addNotification({
                        type: "error",
                        message: "Failed to reset password. The reset link may have expired.",
                        timestamp: new Date(),
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var passwordStrengthInfo = (0, react_1.useMemo)(function () {
        var getPasswordStrengthInfo = function (score) {
            switch (score) {
                case 0:
                case 1:
                    return {
                        color: "bg-red-500",
                        text: "Very Weak",
                        textColor: "text-red-600",
                    };
                case 2:
                    return {
                        color: "bg-orange-500",
                        text: "Weak",
                        textColor: "text-orange-600",
                    };
                case 3:
                    return {
                        color: "bg-yellow-500",
                        text: "Fair",
                        textColor: "text-yellow-600",
                    };
                case 4:
                    return {
                        color: "bg-green-500",
                        text: "Strong",
                        textColor: "text-green-600",
                    };
                default:
                    return {
                        color: "bg-gray-300",
                        text: "Unknown",
                        textColor: "text-gray-600",
                    };
            }
        };
        return getPasswordStrengthInfo(passwordStrength.score);
    }, [passwordStrength.score]);
    var lockoutTimeRemaining = (0, react_1.useMemo)(function () {
        if (!accountLockout.isLocked || !accountLockout.lockoutUntil)
            return null;
        return accountLockout.lockoutUntil.getTime() - Date.now();
    }, [accountLockout.isLocked, accountLockout.lockoutUntil]);
    var renderLockoutWarning = function () {
        if (!accountLockout.isLocked || !lockoutTimeRemaining)
            return null;
        return (<alert_1.Alert className="mb-4" variant="destructive">
        <lucide_react_1.AlertTriangle className="h-4 w-4"/>
        <alert_1.AlertDescription>
          Account temporarily locked due to multiple failed attempts. Try again
          in {formatTimeRemaining(lockoutTimeRemaining)}.
        </alert_1.AlertDescription>
      </alert_1.Alert>);
    };
    var renderAttemptCounter = function () {
        if (accountLockout.attemptCount === 0 || accountLockout.isLocked)
            return null;
        var remainingAttempts = accountLockout.maxAttempts - accountLockout.attemptCount;
        return (<alert_1.Alert className="mb-4" variant="destructive">
        <lucide_react_1.Info className="h-4 w-4"/>
        <alert_1.AlertDescription>
          {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""}{" "}
          remaining before account lockout.
        </alert_1.AlertDescription>
      </alert_1.Alert>);
    };
    var renderPasswordStrengthIndicator = function (fieldValue) {
        if (!fieldValue)
            return null;
        return (<div className="mt-2 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Password Strength:</span>
          <span className={"font-medium ".concat(passwordStrengthInfo.textColor)}>
            {passwordStrengthInfo.text}
          </span>
        </div>
        <progress_1.Progress value={(passwordStrength.score + 1) * 20} className="h-2"/>
        {passwordStrength.warning && (<p className="text-sm text-orange-600 font-medium">
            {passwordStrength.warning}
          </p>)}
        {passwordStrength.feedback.length > 0 && (<ul className="text-sm text-muted-foreground space-y-1">
            {passwordStrength.feedback.map(function (suggestion, index) { return (<li key={index} className="flex items-start">
                <lucide_react_1.Info className="h-3 w-3 mt-0.5 mr-2 flex-shrink-0"/>
                {suggestion}
              </li>); })}
          </ul>)}
      </div>);
    };
    var renderSecurityNotifications = function () {
        if (securityNotifications.length === 0)
            return null;
        return (<div className="w-full max-w-md mx-auto mb-6 space-y-2">
        {securityNotifications.map(function (notification, index) { return (<alert_1.Alert key={"".concat(notification.timestamp.getTime(), "-").concat(index)} variant={notification.type === "error" ? "destructive" : "default"}>
            {notification.type === "success" && (<lucide_react_1.CheckCircle className="h-4 w-4"/>)}
            {notification.type === "error" && (<lucide_react_1.AlertCircle className="h-4 w-4"/>)}
            {notification.type === "warning" && (<lucide_react_1.AlertTriangle className="h-4 w-4"/>)}
            {notification.type === "info" && <lucide_react_1.Info className="h-4 w-4"/>}
            <alert_1.AlertDescription>
              <div className="flex justify-between items-start">
                <span>{notification.message}</span>
                <time className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </time>
              </div>
            </alert_1.AlertDescription>
          </alert_1.Alert>); })}
      </div>);
    };
    var renderRequestForm = function () { return (<card_1.Card className="w-full max-w-md mx-auto">
      <card_1.CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <lucide_react_1.Lock className="h-6 w-6 text-blue-600"/>
        </div>
        <card_1.CardTitle className="text-2xl font-bold">
          Reset Your Password
        </card_1.CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your
          password.
        </p>
      </card_1.CardHeader>
      <card_1.CardContent>
        {renderLockoutWarning()}
        {renderAttemptCounter()}

        <form_1.Form {...requestForm}>
          <form onSubmit={requestForm.handleSubmit(handleRequestReset)} className="space-y-4">
            <form_1.FormField control={requestForm.control} name="email" render={function (_a) {
            var field = _a.field;
            return (<form_1.FormItem>
                  <form_1.FormLabel>Email Address</form_1.FormLabel>
                  <form_1.FormControl>
                    <div className="relative">
                      <lucide_react_1.Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                      <input_1.Input {...field} type="email" placeholder="Enter your email address" className="pl-10" disabled={accountLockout.isLocked ||
                    requestPasswordReset.isPending} autoComplete="email"/>
                    </div>
                  </form_1.FormControl>
                  <form_1.FormMessage />
                </form_1.FormItem>);
        }}/>

            <button_1.Button type="submit" className="w-full" disabled={accountLockout.isLocked || requestPasswordReset.isPending}>
              {requestPasswordReset.isPending ?
            <>
                  <lucide_react_1.RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                  Sending Reset Link...
                </>
            : <>
                  <lucide_react_1.Mail className="mr-2 h-4 w-4"/>
                  Send Reset Link
                </>}
            </button_1.Button>
          </form>
        </form_1.Form>

        <div className="mt-6 text-center">
          <button_1.Button variant="ghost" onClick={function () { return navigate("/auth/login"); }} className="text-sm">
            <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Login
          </button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>); };
    var renderResetForm = function () { return (<card_1.Card className="w-full max-w-md mx-auto">
      <card_1.CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <lucide_react_1.Shield className="h-6 w-6 text-green-600"/>
        </div>
        <card_1.CardTitle className="text-2xl font-bold">
          Create New Password
        </card_1.CardTitle>
        <p className="text-sm text-muted-foreground">
          Enter a strong password that you haven't used before.
        </p>
      </card_1.CardHeader>
      <card_1.CardContent>
        {isPasswordReusedError && (<alert_1.Alert className="mb-4" variant="destructive">
            <lucide_react_1.AlertCircle className="h-4 w-4"/>
            <alert_1.AlertDescription>
              This password has been used recently. Please choose a different
              password.
            </alert_1.AlertDescription>
          </alert_1.Alert>)}

        <form_1.Form {...resetForm}>
          <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
            <form_1.FormField control={resetForm.control} name="password" render={function (_a) {
            var field = _a.field;
            return (<form_1.FormItem>
                  <form_1.FormLabel>New Password</form_1.FormLabel>
                  <form_1.FormControl>
                    <div className="relative">
                      <lucide_react_1.Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                      <input_1.Input {...field} type={showPassword ? "text" : "password"} placeholder="Enter new password" className="pl-10 pr-10" onChange={function (e) {
                    field.onChange(e);
                    handlePasswordChange(e.target.value);
                }} disabled={resetPassword.isPending} autoComplete="new-password"/>
                      <button_1.Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={function () { return setShowPassword(!showPassword); }} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ?
                    <lucide_react_1.EyeOff className="h-4 w-4 text-muted-foreground"/>
                    : <lucide_react_1.Eye className="h-4 w-4 text-muted-foreground"/>}
                      </button_1.Button>
                    </div>
                  </form_1.FormControl>
                  <form_1.FormMessage />
                  {renderPasswordStrengthIndicator(field.value)}
                </form_1.FormItem>);
        }}/>

            <form_1.FormField control={resetForm.control} name="confirmPassword" render={function (_a) {
            var field = _a.field;
            return (<form_1.FormItem>
                  <form_1.FormLabel>Confirm New Password</form_1.FormLabel>
                  <form_1.FormControl>
                    <div className="relative">
                      <lucide_react_1.Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                      <input_1.Input {...field} type={showConfirmPassword ? "text" : "password"} placeholder="Confirm new password" className="pl-10 pr-10" disabled={resetPassword.isPending} autoComplete="new-password"/>
                      <button_1.Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={function () {
                    return setShowConfirmPassword(!showConfirmPassword);
                }} aria-label={showConfirmPassword ?
                    "Hide password confirmation"
                    : "Show password confirmation"}>
                        {showConfirmPassword ?
                    <lucide_react_1.EyeOff className="h-4 w-4 text-muted-foreground"/>
                    : <lucide_react_1.Eye className="h-4 w-4 text-muted-foreground"/>}
                      </button_1.Button>
                    </div>
                  </form_1.FormControl>
                  <form_1.FormMessage />
                </form_1.FormItem>);
        }}/>

            <button_1.Button type="submit" className="w-full" disabled={resetPassword.isPending ||
            passwordStrength.score < PASSWORD_CONFIG.MIN_STRENGTH_SCORE ||
            isPasswordReusedError}>
              {resetPassword.isPending ?
            <>
                  <lucide_react_1.RefreshCw className="mr-2 h-4 w-4 animate-spin"/>
                  Resetting Password...
                </>
            : <>
                  <lucide_react_1.Shield className="mr-2 h-4 w-4"/>
                  Reset Password
                </>}
            </button_1.Button>
          </form>
        </form_1.Form>

        <div className="mt-6 text-center">
          <button_1.Button variant="ghost" onClick={function () { return navigate("/auth/login"); }} className="text-sm">
            <lucide_react_1.ArrowLeft className="mr-2 h-4 w-4"/>
            Back to Login
          </button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>); };
    var renderSuccess = function () { return (<card_1.Card className="w-full max-w-md mx-auto">
      <card_1.CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <lucide_react_1.CheckCircle className="h-6 w-6 text-green-600"/>
        </div>
        <card_1.CardTitle className="text-2xl font-bold">
          {step === "success" && urlParams.token ?
            "Password Reset Successfully"
            : "Check Your Email"}
        </card_1.CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === "success" && urlParams.token ?
            "Your password has been reset successfully. You can now log in with your new password."
            : "We've sent a password reset link to your email address. Please check your inbox and follow the instructions."}
        </p>
      </card_1.CardHeader>
      <card_1.CardContent>
        <button_1.Button onClick={function () { return navigate("/auth/login"); }} className="w-full">
          Continue to Login
        </button_1.Button>

        {!urlParams.token && (<div className="mt-4 text-center">
            <button_1.Button variant="ghost" onClick={function () { return setStep("request"); }} className="text-sm">
              Didn't receive the email? Try again
            </button_1.Button>
          </div>)}
      </card_1.CardContent>
    </card_1.Card>); };
    return (<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {renderSecurityNotifications()}

        {step === "request" && renderRequestForm()}
        {step === "reset" && renderResetForm()}
        {step === "success" && renderSuccess()}
      </div>
    </div>);
};
exports.PasswordReset = PasswordReset;
exports.default = exports.PasswordReset;
