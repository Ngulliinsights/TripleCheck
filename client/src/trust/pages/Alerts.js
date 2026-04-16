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
exports.default = AlertsPage;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var FormField_1 = require("../../local/components/forms/FormField");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var switch_1 = require("../../local/components/ui/switch");
var use_toast_1 = require("../../local/hooks/use-toast");
function AlertsPage() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)([
        {
            id: "price-changes",
            name: "Price Changes",
            description: "Get notified when property prices change significantly",
            enabled: true
        },
        {
            id: "new-listings",
            name: "New Listings",
            description: "Receive alerts for new properties matching your criteria",
            enabled: true
        },
        {
            id: "verification-updates",
            name: "Verification Updates",
            description: "Stay informed about property verification status changes",
            enabled: false
        },
        {
            id: "market-alerts",
            name: "Market Alerts",
            description: "Get updates about market trends and opportunities",
            enabled: false
        }
    ]), alertPreferences = _a[0], setAlertPreferences = _a[1];
    var _b = useForm({
        initialValues: {
            location: '',
            minPrice: '',
            maxPrice: '',
            propertyType: ''
        },
        validationRules: {
            location: {
                required: true,
                minLength: 2,
                maxLength: 100
            },
            minPrice: {
                numeric: true,
                min: 0,
                custom: function (value, allValues) {
                    if (value && (allValues === null || allValues === void 0 ? void 0 : allValues.maxPrice) && parseFloat(value) >= parseFloat(allValues.maxPrice)) {
                        return 'Minimum price must be less than maximum price';
                    }
                    return null;
                }
            },
            maxPrice: {
                numeric: true,
                min: 0,
                custom: function (value, allValues) {
                    if (value && (allValues === null || allValues === void 0 ? void 0 : allValues.minPrice) && parseFloat(value) <= parseFloat(allValues.minPrice)) {
                        return 'Maximum price must be greater than minimum price';
                    }
                    return null;
                }
            },
            propertyType: {
                required: true
            }
        },
        onSubmit: function (formData) { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Simulate API call
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 1:
                        // Simulate API call
                        _a.sent();
                        toast({
                            title: "Alert preferences saved!",
                            description: "You'll receive notifications based on your criteria.",
                        });
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        toast({
                            title: "Failed to save preferences",
                            description: "Please try again.",
                            variant: "destructive",
                        });
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        }); }
    }), values = _b.values, errors = _b.errors, touched = _b.touched, isValid = _b.isValid, isSubmitting = _b.isSubmitting, handleSubmit = _b.handleSubmit, getFieldProps = _b.getFieldProps, getFieldError = _b.getFieldError;
    var toggleAlert = function (alertId) {
        var _a, _b;
        setAlertPreferences(function (prev) {
            return prev.map(function (pref) {
                return pref.id === alertId ? __assign(__assign({}, pref), { enabled: !pref.enabled }) : pref;
            });
        });
        toast({
            title: "Alert preference updated",
            description: "".concat((_a = alertPreferences.find(function (p) { return p.id === alertId; })) === null || _a === void 0 ? void 0 : _a.name, " alerts ").concat(((_b = alertPreferences.find(function (p) { return p.id === alertId; })) === null || _b === void 0 ? void 0 : _b.enabled) ? 'disabled' : 'enabled', "."),
        });
    };
    return (<div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Real-Time Property Alerts</h1>
          <p className="text-muted-foreground">
            Stay updated with instant notifications about properties and market changes
          </p>
        </div>

        {/* Alert Preferences */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Bell className="h-5 w-5"/>
              Alert Preferences
            </card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-6">
              {alertPreferences.map(function (pref) { return (<div key={pref.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{pref.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pref.description}
                    </p>
                  </div>
                  <switch_1.Switch checked={pref.enabled} onCheckedChange={function () { return toggleAlert(pref.id); }}/>
                </div>); })}
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Custom Alert Settings */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Custom Alert Criteria</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormField_1.default label="Location" type="text" placeholder="Enter preferred locations (e.g., Nairobi, Mombasa)" required helpText="Specify cities or areas where you want to receive alerts" error={getFieldError('location')} touched={touched.location} {...getFieldProps('location')}/>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField_1.default label="Minimum Price (KES)" type="number" placeholder="0" min={0} helpText="Leave empty for no minimum" error={getFieldError('minPrice')} touched={touched.minPrice} {...getFieldProps('minPrice')}/>
                <FormField_1.default label="Maximum Price (KES)" type="number" placeholder="10000000" min={0} helpText="Leave empty for no maximum" error={getFieldError('maxPrice')} touched={touched.maxPrice} {...getFieldProps('maxPrice')}/>
              </div>

              <FormField_1.default label="Property Type" type="select" required options={[
            { value: '', label: 'Select property type' },
            { value: 'apartment', label: 'Apartment' },
            { value: 'house', label: 'House' },
            { value: 'land', label: 'Land' },
            { value: 'commercial', label: 'Commercial' },
            { value: 'any', label: 'Any Type' }
        ]} error={getFieldError('propertyType')} touched={touched.propertyType} {...getFieldProps('propertyType')}/>

              <button_1.Button type="submit" className="w-full" disabled={isSubmitting || !isValid}>
                {isSubmitting ? 'Saving...' : 'Save Alert Preferences'}
              </button_1.Button>
            </form>
          </card_1.CardContent>
        </card_1.Card>

        {/* Sample Alerts */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Alerts</h2>
          
          <card_1.Card>
            <card_1.CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <lucide_react_1.Home className="h-5 w-5 text-[#2C5282] mt-1"/>
                <div>
                  <h3 className="font-medium">New Property Listed in Kilimani</h3>
                  <p className="text-sm text-muted-foreground">
                    3-bedroom apartment matching your criteria just listed at KES 25M
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    2 hours ago
                  </p>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <lucide_react_1.TrendingUp className="h-5 w-5 text-green-500 mt-1"/>
                <div>
                  <h3 className="font-medium">Price Drop Alert</h3>
                  <p className="text-sm text-muted-foreground">
                    Price reduced by 10% for a property in your watchlist
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    5 hours ago
                  </p>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <lucide_react_1.AlertTriangle className="h-5 w-5 text-yellow-500 mt-1"/>
                <div>
                  <h3 className="font-medium">Verification Status Update</h3>
                  <p className="text-sm text-muted-foreground">
                    A property in your watchlist has completed verification
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    1 day ago
                  </p>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
