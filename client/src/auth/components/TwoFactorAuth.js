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
exports.TwoFactorAuth = TwoFactorAuth;
var zod_1 = require("@hookform/resolvers/zod");
var lucide_react_1 = require("lucide-react");
var qrcode_react_1 = require("qrcode.react");
var react_1 = require("react");
var react_hook_form_1 = require("react-hook-form");
var zod_2 = require("zod");
var alert_1 = require("../../local/components/ui/alert");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var form_1 = require("../../local/components/ui/form");
var input_1 = require("../../local/components/ui/input");
var logo_1 = require("../../local/components/ui/logo");
var separator_1 = require("../../local/components/ui/separator");
var tabs_1 = require("../../local/components/ui/tabs");
// Validation schemas
var verificationSchema = zod_2.z.object({
    code: zod_2.z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only numbers'),
});
var setupSchema = zod_2.z.object({
    verificationCode: zod_2.z.string().min(6, 'Code must be 6 digits').max(6, 'Code must be 6 digits').regex(/^\d{6}$/, 'Code must contain only numbers'),
});
function TwoFactorAuth(_a) {
    var _this = this;
    var user = _a.user, onVerified = _a.onVerified, _b = _a.methods, methods = _b === void 0 ? ['sms', 'email', 'authenticator'] : _b, _c = _a.mode, mode = _c === void 0 ? 'verify' : _c, _d = _a.className, className = _d === void 0 ? '' : _d;
    var _e = (0, react_1.useState)('authenticator'), currentMethod = _e[0], setCurrentMethod = _e[1];
    var _f = (0, react_1.useState)(false), isLoading = _f[0], setIsLoading = _f[1];
    var _g = (0, react_1.useState)(null), setupData = _g[0], setSetupData = _g[1];
    var _h = (0, react_1.useState)(false), backupCodesVisible = _h[0], setBackupCodesVisible = _h[1];
    var _j = (0, react_1.useState)(false), copiedSecret = _j[0], setCopiedSecret = _j[1];
    var _k = (0, react_1.useState)(false), copiedBackupCodes = _k[0], setCopiedBackupCodes = _k[1];
    var _l = (0, react_1.useState)(0), resendCooldown = _l[0], setResendCooldown = _l[1];
    var _m = (0, react_1.useState)(null), error = _m[0], setError = _m[1];
    var _o = (0, react_1.useState)(null), success = _o[0], setSuccess = _o[1];
    var verificationForm = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(verificationSchema),
        defaultValues: {
            code: '',
        },
    });
    var setupForm = (0, react_hook_form_1.useForm)({
        resolver: (0, zod_1.zodResolver)(setupSchema),
        defaultValues: {
            verificationCode: '',
        },
    });
    // Available 2FA methods
    var availableMethods = [
        {
            id: 'authenticator',
            name: 'Authenticator App',
            description: 'Use Google Authenticator, Authy, or similar apps',
            icon: <lucide_react_1.Smartphone className="w-5 h-5"/>,
            enabled: methods.includes('authenticator'),
        },
        {
            id: 'sms',
            name: 'SMS',
            description: 'Receive codes via text message',
            icon: <lucide_react_1.Smartphone className="w-5 h-5"/>,
            enabled: methods.includes('sms'),
        },
        {
            id: 'email',
            name: 'Email',
            description: 'Receive codes via email',
            icon: <lucide_react_1.Mail className="w-5 h-5"/>,
            enabled: methods.includes('email'),
        },
    ];
    // Initialize 2FA setup
    (0, react_1.useEffect)(function () {
        if (mode === 'setup' && currentMethod === 'authenticator') {
            initializeAuthenticatorSetup();
        }
    }, [mode, currentMethod]);
    // Resend cooldown timer
    (0, react_1.useEffect)(function () {
        if (resendCooldown > 0) {
            var timer_1 = setTimeout(function () { return setResendCooldown(resendCooldown - 1); }, 1000);
            return function () { return clearTimeout(timer_1); };
        }
    }, [resendCooldown]);
    // Initialize authenticator setup
    var initializeAuthenticatorSetup = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch('/api/auth/2fa/setup', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ method: 'authenticator' }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to initialize 2FA setup');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    setSetupData(data.data);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    setError('Failed to initialize 2FA setup. Please try again.');
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Send verification code
    var sendVerificationCode = function (method) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch('/api/auth/2fa/send-code', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ method: method }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to send verification code');
                    }
                    setSuccess("Verification code sent to your ".concat(method === 'sms' ? 'phone' : 'email'));
                    setResendCooldown(60); // 60 second cooldown
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    setError("Failed to send verification code. Please try again.");
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Verify 2FA code
    var verifyCode = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var response, result, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch('/api/auth/2fa/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                code: data.code,
                                method: currentMethod,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Invalid verification code');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    if (result.success) {
                        onVerified();
                    }
                    else {
                        setError('Invalid verification code. Please try again.');
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_3 = _a.sent();
                    setError('Invalid verification code. Please try again.');
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Complete 2FA setup
    var completeSetup = function (data) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    setError(null);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, fetch('/api/auth/2fa/complete-setup', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                code: data.verificationCode,
                                method: currentMethod,
                                secret: setupData === null || setupData === void 0 ? void 0 : setupData.secret,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to complete 2FA setup');
                    }
                    setSuccess('Two-factor authentication has been successfully enabled!');
                    setTimeout(function () { return onVerified(); }, 2000);
                    return [3 /*break*/, 5];
                case 3:
                    error_4 = _a.sent();
                    setError('Invalid verification code. Please check your authenticator app and try again.');
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // Copy to clipboard
    var copyToClipboard = function (text, type) { return __awaiter(_this, void 0, void 0, function () {
        var error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, navigator.clipboard.writeText(text)];
                case 1:
                    _a.sent();
                    if (type === 'secret') {
                        setCopiedSecret(true);
                        setTimeout(function () { return setCopiedSecret(false); }, 2000);
                    }
                    else {
                        setCopiedBackupCodes(true);
                        setTimeout(function () { return setCopiedBackupCodes(false); }, 2000);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    console.error('Failed to copy to clipboard:', error_5);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Download backup codes
    var downloadBackupCodes = function () {
        if (!(setupData === null || setupData === void 0 ? void 0 : setupData.backupCodes))
            return;
        var content = "TripleCheck Two-Factor Authentication Backup Codes\n\nGenerated: ".concat(new Date().toLocaleString(), "\nUser: ").concat(user.email, "\n\nBackup Codes (use each code only once):\n").concat(setupData.backupCodes.map(function (code, index) { return "".concat(index + 1, ". ").concat(code); }).join('\n'), "\n\nKeep these codes in a safe place. You can use them to access your account if you lose access to your authenticator device.");
        var blob = new Blob([content], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = "triplecheck-backup-codes-".concat(Date.now(), ".txt");
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    return (<div className={"w-full max-w-md mx-auto ".concat(className)}>
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <logo_1.Logo size="xl" variant="default"/>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {mode === 'setup' ? 'Set Up Two-Factor Authentication' : 'Two-Factor Authentication'}
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          {mode === 'setup'
            ? 'Secure your account with an additional layer of protection'
            : 'Enter your verification code to continue'}
        </p>
      </div>

      {/* Method Selection */}
      {availableMethods.filter(function (m) { return m.enabled; }).length > 1 && (<card_1.Card className="mb-6">
          <card_1.CardHeader>
            <card_1.CardTitle className="text-lg">Choose Verification Method</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <tabs_1.Tabs value={currentMethod} onValueChange={function (value) { return setCurrentMethod(value); }}>
              <tabs_1.TabsList className="grid w-full grid-cols-3">
                {availableMethods.filter(function (m) { return m.enabled; }).map(function (method) { return (<tabs_1.TabsTrigger key={method.id} value={method.id} className="flex items-center gap-2">
                    {method.icon}
                    <span className="hidden sm:inline">{method.name}</span>
                  </tabs_1.TabsTrigger>); })}
              </tabs_1.TabsList>
            </tabs_1.Tabs>
          </card_1.CardContent>
        </card_1.Card>)}

      {/* Main Content */}
      <card_1.Card>
        <card_1.CardContent className="pt-6">
          {/* Authenticator App Setup/Verification */}
          {currentMethod === 'authenticator' && (<>
              {mode === 'setup' ? (<div className="space-y-6">
                  {/* Step 1: Install App */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                      Install an Authenticator App
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Download and install one of these authenticator apps:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 border rounded">Google Authenticator</div>
                      <div className="p-2 border rounded">Microsoft Authenticator</div>
                      <div className="p-2 border rounded">Authy</div>
                      <div className="p-2 border rounded">1Password</div>
                    </div>
                  </div>

                  <separator_1.Separator />

                  {/* Step 2: Scan QR Code */}
                  {setupData && (<div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                        Scan QR Code
                      </h3>
                      <div className="text-center mb-4">
                        <div className="inline-block p-4 bg-white border rounded-lg">
                          <qrcode_react_1.QRCodeSVG value={setupData.qrCodeUrl} size={200}/>
                        </div>
                      </div>
                      
                      {/* Manual Entry Option */}
                      <div className="text-center">
                        <button_1.Button type="button" variant="ghost" size="sm" onClick={function () { return setBackupCodesVisible(!backupCodesVisible); }}>
                          Can't scan? Enter code manually
                        </button_1.Button>
                      </div>

                      {backupCodesVisible && (<div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium mb-2">Manual Entry Key:</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 p-2 bg-white border rounded text-sm font-mono break-all">
                              {setupData.manualEntryKey}
                            </code>
                            <button_1.Button type="button" size="sm" variant="outline" onClick={function () { return copyToClipboard(setupData.manualEntryKey, 'secret'); }}>
                              {copiedSecret ? <lucide_react_1.Check className="w-4 h-4"/> : <lucide_react_1.Copy className="w-4 h-4"/>}
                            </button_1.Button>
                          </div>
                        </div>)}
                    </div>)}

                  <separator_1.Separator />

                  {/* Step 3: Verify Setup */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                      Verify Setup
                    </h3>
                    <form_1.Form {...setupForm}>
                      <form onSubmit={setupForm.handleSubmit(completeSetup)} className="space-y-4">
                        <form_1.FormField control={setupForm.control} name="verificationCode" render={function (_a) {
                    var field = _a.field;
                    return (<form_1.FormItem>
                              <form_1.FormLabel>Enter the 6-digit code from your authenticator app</form_1.FormLabel>
                              <form_1.FormControl>
                                <input_1.Input placeholder="000000" maxLength={6} {...field} className="text-center text-lg tracking-widest"/>
                              </form_1.FormControl>
                              <form_1.FormMessage />
                            </form_1.FormItem>);
                }}/>
                        
                        <button_1.Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? 'Verifying...' : 'Complete Setup'}
                        </button_1.Button>
                      </form>
                    </form_1.Form>
                  </div>

                  {/* Backup Codes */}
                  {(setupData === null || setupData === void 0 ? void 0 : setupData.backupCodes) && (<>
                      <separator_1.Separator />
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <lucide_react_1.Key className="w-5 h-5"/>
                          Backup Codes
                        </h3>
                        <alert_1.Alert>
                          <lucide_react_1.AlertCircle className="h-4 w-4"/>
                          <alert_1.AlertDescription>
                            Save these backup codes in a secure location. You can use them to access your account if you lose your authenticator device.
                          </alert_1.AlertDescription>
                        </alert_1.Alert>
                        
                        <div className="mt-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg">
                            {setupData.backupCodes.map(function (code, index) { return (<div key={index} className="font-mono text-sm text-center p-2 bg-white rounded border">
                                {code}
                              </div>); })}
                          </div>
                          
                          <div className="flex gap-2">
                            <button_1.Button type="button" variant="outline" size="sm" onClick={function () { return copyToClipboard(setupData.backupCodes.join('\n'), 'backup'); }} className="flex-1">
                              {copiedBackupCodes ? <lucide_react_1.Check className="w-4 h-4 mr-2"/> : <lucide_react_1.Copy className="w-4 h-4 mr-2"/>}
                              Copy Codes
                            </button_1.Button>
                            <button_1.Button type="button" variant="outline" size="sm" onClick={downloadBackupCodes} className="flex-1">
                              <lucide_react_1.Download className="w-4 h-4 mr-2"/>
                              Download
                            </button_1.Button>
                          </div>
                        </div>
                      </div>
                    </>)}
                </div>) : (
            // Verification Mode
            <form_1.Form {...verificationForm}>
                  <form onSubmit={verificationForm.handleSubmit(verifyCode)} className="space-y-4">
                    <form_1.FormField control={verificationForm.control} name="code" render={function (_a) {
                    var field = _a.field;
                    return (<form_1.FormItem>
                          <form_1.FormLabel>Enter the 6-digit code from your authenticator app</form_1.FormLabel>
                          <form_1.FormControl>
                            <input_1.Input placeholder="000000" maxLength={6} {...field} className="text-center text-lg tracking-widest"/>
                          </form_1.FormControl>
                          <form_1.FormDescription>
                            Open your authenticator app and enter the current code
                          </form_1.FormDescription>
                          <form_1.FormMessage />
                        </form_1.FormItem>);
                }}/>
                    
                    <button_1.Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </button_1.Button>
                  </form>
                </form_1.Form>)}
            </>)}

          {/* SMS/Email Verification */}
          {(currentMethod === 'sms' || currentMethod === 'email') && (<div className="space-y-4">
              {mode === 'setup' && (<alert_1.Alert>
                  <lucide_react_1.AlertCircle className="h-4 w-4"/>
                  <alert_1.AlertDescription>
                    We'll send a verification code to your {currentMethod === 'sms' ? 'phone number' : 'email address'} each time you sign in.
                  </alert_1.AlertDescription>
                </alert_1.Alert>)}

              <form_1.Form {...verificationForm}>
                <form onSubmit={verificationForm.handleSubmit(verifyCode)} className="space-y-4">
                  <form_1.FormField control={verificationForm.control} name="code" render={function (_a) {
                var field = _a.field;
                return (<form_1.FormItem>
                        <form_1.FormLabel>
                          Enter the 6-digit code sent to your {currentMethod === 'sms' ? 'phone' : 'email'}
                        </form_1.FormLabel>
                        <form_1.FormControl>
                          <input_1.Input placeholder="000000" maxLength={6} {...field} className="text-center text-lg tracking-widest"/>
                        </form_1.FormControl>
                        <form_1.FormMessage />
                      </form_1.FormItem>);
            }}/>
                  
                  <button_1.Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button_1.Button>
                </form>
              </form_1.Form>

              {/* Resend Code */}
              <div className="text-center">
                <button_1.Button type="button" variant="ghost" size="sm" onClick={function () { return sendVerificationCode(currentMethod); }} disabled={resendCooldown > 0 || isLoading}>
                  {resendCooldown > 0 ? ("Resend code in ".concat(resendCooldown, "s")) : (<>
                      <lucide_react_1.RefreshCw className="w-4 h-4 mr-2"/>
                      Resend Code
                    </>)}
                </button_1.Button>
              </div>
            </div>)}

          {/* Error/Success Messages */}
          {error && (<alert_1.Alert variant="destructive" className="mt-4">
              <lucide_react_1.AlertCircle className="h-4 w-4"/>
              <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
            </alert_1.Alert>)}

          {success && (<alert_1.Alert className="mt-4">
              <lucide_react_1.Check className="h-4 w-4"/>
              <alert_1.AlertDescription>{success}</alert_1.AlertDescription>
            </alert_1.Alert>)}
        </card_1.CardContent>
      </card_1.Card>

      {/* Recovery Options */}
      {mode === 'verify' && (<div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Having trouble accessing your codes?
          </p>
          <div className="space-x-4">
            <button_1.Button variant="ghost" size="sm">
              Use Backup Code
            </button_1.Button>
            <button_1.Button variant="ghost" size="sm">
              Contact Support
            </button_1.Button>
          </div>
        </div>)}
    </div>);
}
exports.default = TwoFactorAuth;
