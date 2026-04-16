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
exports.default = ContactSales;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
function ContactSales() {
    var _this = this;
    var _a = (0, react_1.useState)(false), isSubmitting = _a[0], setIsSubmitting = _a[1];
    var _b = (0, react_1.useState)(false), isSubmitted = _b[0], setIsSubmitted = _b[1];
    var _c = (0, react_1.useState)({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        role: '',
        phone: '',
        useCase: '',
        monthlyVolume: '',
        message: ''
    }), formData = _c[0], setFormData = _c[1];
    var handleSubmit = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var formService, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    // Track sales inquiry
                    if (window === null || window === void 0 ? void 0 : window.gtag) {
                        window.gtag('event', 'sales_inquiry', {
                            event_category: 'B2B',
                            event_label: 'contact_sales_form',
                            custom_parameters: {
                                company: formData.company,
                                role: formData.role,
                                use_case: formData.useCase,
                                monthly_volume: formData.monthlyVolume
                            }
                        });
                    }
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('../services/FormService'); })];
                case 2:
                    formService = (_a.sent()).formService;
                    return [4 /*yield*/, formService.submitSalesInquiry(__assign(__assign({}, formData), { source: 'contact_sales_page' }))];
                case 3:
                    result = _a.sent();
                    if (result.success) {
                        setIsSubmitted(true);
                    }
                    else {
                        throw new Error(result.message);
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Sales inquiry failed:', error_1);
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleInputChange = function (field, value) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    };
    if (isSubmitted) {
        return (<div className="min-h-screen bg-gray-50 nav-aware-spacing">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <lucide_react_1.CheckCircle className="w-10 h-10 text-green-600"/>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You for Your Interest!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Our sales team will contact you within 24 hours to discuss your API integration needs 
              and schedule a personalized demo.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-2 text-left">
                <li>• Sales representative will call you within 24 hours</li>
                <li>• We'll schedule a personalized API demo</li>
                <li>• Discuss your specific use case and requirements</li>
                <li>• Provide custom pricing based on your volume</li>
                <li>• Set up a pilot program if you're ready</li>
              </ul>
            </div>
            <button_1.Button className="mt-8" onClick={function () { return window.location.href = '/'; }}>
              Return to Homepage
            </button_1.Button>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 nav-aware-spacing">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <lucide_react_1.Building2 className="w-5 h-5"/>
              <span className="text-sm font-medium">Enterprise Sales</span>
            </div>
            <h1 className="text-4xl font-bold mb-6">
              Ready to Transform Your Land Verification Process?
            </h1>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              Join banks, real estate platforms, and insurance companies across Kenya 
              who trust our API for secure, fast land verification.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div>
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="text-2xl">Get Started Today</card_1.CardTitle>
                <p className="text-gray-600">
                  Tell us about your needs and we'll create a custom solution for your business.
                </p>
              </card_1.CardHeader>
              <card_1.CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input id="firstName" type="text" required value={formData.firstName} onChange={function (e) { return handleInputChange('firstName', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input id="lastName" type="text" required value={formData.lastName} onChange={function (e) { return handleInputChange('lastName', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Email *
                    </label>
                    <input id="email" type="email" required value={formData.email} onChange={function (e) { return handleInputChange('email', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                        Company *
                      </label>
                      <input id="company" type="text" required value={formData.company} onChange={function (e) { return handleInputChange('company', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input id="phone" type="tel" value={formData.phone} onChange={function (e) { return handleInputChange('phone', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Role *
                    </label>
                    <select id="role" required value={formData.role} onChange={function (e) { return handleInputChange('role', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select your role</option>
                      <option value="ceo">CEO/Founder</option>
                      <option value="cto">CTO</option>
                      <option value="developer">Developer</option>
                      <option value="product_manager">Product Manager</option>
                      <option value="business_owner">Business Owner</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Use Case *
                    </label>
                    <select id="useCase" required value={formData.useCase} onChange={function (e) { return handleInputChange('useCase', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select your use case</option>
                      <option value="loan_collateral">Loan collateral verification</option>
                      <option value="listing_verification">Property listing verification</option>
                      <option value="insurance_risk">Insurance risk assessment</option>
                      <option value="due_diligence">Legal due diligence</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="monthlyVolume" className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Monthly Volume *
                    </label>
                    <select id="monthlyVolume" required value={formData.monthlyVolume} onChange={function (e) { return handleInputChange('monthlyVolume', e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="">Select expected volume</option>
                      <option value="1-100">1-100 verifications</option>
                      <option value="100-1000">100-1,000 verifications</option>
                      <option value="1000-5000">1,000-5,000 verifications</option>
                      <option value="5000+">5,000+ verifications</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Details
                    </label>
                    <textarea rows={4} value={formData.message} onChange={function (e) { return handleInputChange('message', e.target.value); }} placeholder="Tell us more about your specific requirements..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                  </div>

                  <button_1.Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                    {isSubmitting ? 'Submitting...' : 'Contact Sales Team'}
                    <lucide_react_1.ArrowRight className="w-5 h-5 ml-2"/>
                  </button_1.Button>
                </form>
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Why Choose TripleCheck API?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <lucide_react_1.Building2 className="w-5 h-5 text-blue-600"/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Kenya-Specific Expertise</h3>
                    <p className="text-gray-600 text-sm">
                      Built specifically for Kenyan land verification with local document formats and fraud patterns.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <lucide_react_1.CheckCircle className="w-5 h-5 text-green-600"/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">95% Fraud Detection</h3>
                    <p className="text-gray-600 text-sm">
                      AI-powered fraud detection with machine learning models trained on Kenyan data.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <lucide_react_1.Calendar className="w-5 h-5 text-purple-600"/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">10-Minute Verification</h3>
                    <p className="text-gray-600 text-sm">
                      Complete property verification in minutes instead of weeks or months.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <card_1.Card className="bg-gray-50">
              <card_1.CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Direct Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <lucide_react_1.Mail className="w-5 h-5 text-gray-400"/>
                    <span className="text-gray-700">sales@triplecheck.co.ke</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <lucide_react_1.Phone className="w-5 h-5 text-gray-400"/>
                    <span className="text-gray-700">+254 XXX XXX XXX</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Our sales team is available Monday-Friday, 9 AM - 6 PM EAT
                </p>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>
    </div>);
}
