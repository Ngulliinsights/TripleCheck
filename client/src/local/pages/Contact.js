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
exports.default = Contact;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var FormField_1 = require("../components/forms/FormField");
var button_1 = require("../components/ui/button");
var use_toast_1 = require("../hooks/use-toast");
// import { useForm } from "../hooks/useFormValidation"
// ValidationRule is now part of useFormValidation
var navigation_1 = require("../utils/navigation");
// Constants
var BASIC_CHECKS_URL = "/services/basic-checks";
function Contact() {
    var _this = this;
    var trackNavigation = (0, navigation_1.useNavigationTracking)().trackNavigation;
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)(false), isSubmitted = _a[0], setIsSubmitted = _a[1];
    // Form validation rules
    var validationRules = {
        name: {
            required: true,
            minLength: 2,
            maxLength: 100,
        },
        email: {
            required: true,
            email: true,
        },
        phone: {
            required: false,
            phone: true, // Optional but validated if provided
        },
        subject: {
            required: true,
            minLength: 5,
            maxLength: 200,
        },
        message: {
            required: true,
            minLength: 10,
            maxLength: 2000,
        },
        inquiryType: {
            required: true,
        },
    };
    var _b = useForm({
        initialValues: {
            name: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
            inquiryType: "general",
        },
        validationRules: validationRules,
        onSubmit: function (formData) { return __awaiter(_this, void 0, void 0, function () {
            var formService, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Track form submission
                        trackNavigation("/contact", "/contact", "form_submission");
                        return [4 /*yield*/, Promise.resolve().then(function () { return require('../services/FormService'); })];
                    case 1:
                        formService = (_a.sent()).formService;
                        return [4 /*yield*/, formService.submitContactForm(formData)];
                    case 2:
                        result = _a.sent();
                        if (result.success) {
                            setIsSubmitted(true);
                            trackNavigation("/contact", "/contact", "form_success");
                        }
                        else {
                            throw new Error(result.message);
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        // Error handling is done in FormService, but we re-throw for form state
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        }); },
        validateOnChange: true,
        validateOnBlur: true,
    }), errors = _b.errors, touched = _b.touched, isValid = _b.isValid, isSubmitting = _b.isSubmitting, isDirty = _b.isDirty, getFieldProps = _b.getFieldProps, getFieldError = _b.getFieldError, handleSubmit = _b.handleSubmit, handleReset = _b.handleReset;
    var contactMethods = [
        {
            title: "Live Chat Support",
            description: "Get instant help from our support team",
            icon: lucide_react_1.MessageCircle,
            details: "Available 24/7",
            action: "Start Chat",
            primary: true,
        },
        {
            title: "Phone Support",
            description: "Speak directly with our verification experts",
            icon: lucide_react_1.Phone,
            details: "+254 (0) 800 TRIPLE (874753)",
            action: "Call Now",
            primary: false,
        },
        {
            title: "Email Support",
            description: "Send us detailed questions or documents",
            icon: lucide_react_1.Mail,
            details: "support@triplecheck.africa",
            action: "Send Email",
            primary: false,
        },
    ];
    var officeLocations = [
        {
            city: "Nairobi",
            address: "123 Westlands Avenue, Westlands, Nairobi",
            phone: "+254 (0) 20 123 4567",
            hours: "Mon-Fri: 8AM-6PM EAT",
        },
        {
            city: "Mombasa",
            address: "456 Nyali Road, Nyali, Mombasa",
            phone: "+254 (0) 41 234 5678",
            hours: "Mon-Fri: 8AM-6PM EAT",
        },
    ];
    var inquiryTypes = [
        { value: "general", label: "General Inquiry" },
        { value: "verification", label: "Property Verification" },
        { value: "technical", label: "Technical Support" },
        { value: "billing", label: "Billing & Payments" },
        { value: "partnership", label: "Partnership Opportunities" },
        { value: "enterprise", label: "Enterprise Solutions" },
    ];
    if (isSubmitted) {
        return (<div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-8">
            <lucide_react_1.CheckCircle className="w-10 h-10 text-green-600"/>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thank You for Contacting Us!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We&apos;ve received your message and will get back to you within 4
            hours during business hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button_1.Button onClick={function () {
                trackNavigation("/contact", BASIC_CHECKS_URL, "post_contact_verification");
                window.location.href = BASIC_CHECKS_URL;
            }} className="flex items-center">
              Start Property Verification
              <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
            </button_1.Button>
            <button_1.Button variant="outline" onClick={function () {
                trackNavigation("/contact", "/", "back_to_home");
                window.location.href = "/";
            }}>
              Back to Home
            </button_1.Button>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-brand text-white py-32 overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 bg-dot-pattern opacity-20"></div>
        <div className="absolute inset-0 gradient-balanced-primary"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse-glow animation-delay-0"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-secondary/10 rounded-full blur-lg animate-pulse-glow animation-delay-300"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Enhanced Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 glass-base bg-white/10 rounded-2xl mb-8 hover-glow-warm">
              <lucide_react_1.MessageCircle className="h-12 w-12 text-white drop-shadow-lg"/>
            </div>

            <h1 className="text-fluid-3xl md:text-7xl font-bold mb-8 text-enhanced-contrast animate-fade-in">
              Get in Touch with Our 
              <span className="text-gradient-premium block mt-2">Expert Team</span>
            </h1>
            <p className="text-fluid-lg md:text-2xl mb-16 text-enhanced-subtle max-w-4xl mx-auto leading-relaxed animate-slide-up animation-delay-100">
              Have questions about property verification? Need help with our services? 
              Our team of experts is here to help you make informed real estate decisions.
            </p>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
              {[
            { value: "< 4hrs", label: "Response Time", icon: lucide_react_1.Clock },
            { value: "24/7", label: "Live Chat Support", icon: lucide_react_1.Headphones },
            { value: "99.8%", label: "Customer Satisfaction", icon: lucide_react_1.Shield }
        ].map(function (stat, index) {
            var IconComponent = stat.icon;
            return (<div key={index} className="glass-base bg-white/10 rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300 enhance-hover-subtle animate-slide-up">
                    <IconComponent className="h-8 w-8 text-white/80 mx-auto mb-3"/>
                    <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-white/70 text-sm font-medium">{stat.label}</div>
                  </div>);
        })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-24 -mt-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {contactMethods.map(function (method, index) {
            var IconComponent = method.icon;
            return (<div key={index} className={"group card p-8 text-center cursor-pointer layer-depth-2 enhance-hover animate-slide-up ".concat(method.primary ? "border-secondary/30 bg-gradient-to-br from-secondary/5 to-secondary/10" : "")}>
                  <div className={"inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8 transition-all duration-300 ".concat(method.primary
                    ? "bg-gradient-brand text-white shadow-lg hover-glow-warm"
                    : "bg-gradient-to-br from-primary/10 to-secondary/10 text-primary group-hover:from-primary/20 group-hover:to-secondary/20")}>
                    <IconComponent className="h-12 w-12"/>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-high-contrast mb-4">
                    {method.title}
                  </h3>
                  <p className="text-high-contrast-muted mb-6 leading-relaxed text-lg">
                    {method.description}
                  </p>
                  
                  <div className="glass-base bg-muted/50 rounded-xl px-4 py-3 mb-8 inline-block">
                    <span className="text-sm font-medium text-high-contrast-muted">{method.details}</span>
                  </div>
                  
                  <button_1.Button className={"w-full font-semibold ".concat(method.primary ? "glass-btn-primary hover-glow-warm" : "btn-glass")} size="lg">
                    {method.action}
                    <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
                  </button_1.Button>
                </div>);
        })}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 max-w-7xl mx-auto">
            {/* Contact Form */}
            <div className="animate-slide-up">
              <div className="mb-12">
                <h2 className="text-fluid-2xl font-bold text-high-contrast mb-6">
                  Send Us a Message
                </h2>
                <p className="text-high-contrast-muted text-lg leading-relaxed">
                  Fill out the form below and we&apos;ll get back to you as soon as possible. 
                  Our expert team is ready to help with your property verification needs.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="glass-base bg-white/80 rounded-3xl p-8 space-y-8 layer-depth-1" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField_1.default label="Full Name" required placeholder="Your full name" error={getFieldError("name")} touched={touched.name} {...getFieldProps("name")}/>

                  <FormField_1.default label="Email Address" type="email" required placeholder="your.email@example.com" error={getFieldError("email")} touched={touched.email} {...getFieldProps("email")}/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField_1.default label="Phone Number" type="tel" placeholder="+254 xxx xxx xxxx" error={getFieldError("phone")} touched={touched.phone} {...getFieldProps("phone")}/>

                  <FormField_1.default label="Inquiry Type" type="select" required options={inquiryTypes} error={getFieldError("inquiryType")} touched={touched.inquiryType} {...getFieldProps("inquiryType")}/>
                </div>

                <FormField_1.default label="Subject" required placeholder="Brief description of your inquiry" error={getFieldError("subject")} touched={touched.subject} {...getFieldProps("subject")}/>

                <FormField_1.default label="Message" type="textarea" required rows={6} placeholder="Please provide details about your inquiry..." error={getFieldError("message")} touched={touched.message} {...getFieldProps("message")}/>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button_1.Button type="submit" size="lg" className="flex-1" disabled={isSubmitting || !isValid}>
                    {isSubmitting ?
            "Sending Message..."
            : <>
                        Send Message
                        <lucide_react_1.Send className="ml-2 h-4 w-4"/>
                      </>}
                  </button_1.Button>

                  {isDirty && (<button_1.Button type="button" variant="outline" size="lg" onClick={handleReset} disabled={isSubmitting}>
                      Reset Form
                    </button_1.Button>)}
                </div>

                {/* Form Status */}
                {!isValid && Object.keys(errors).length > 0 && (<div className="flex items-start space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <lucide_react_1.AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0"/>
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Please fix the following errors:
                      </p>
                      <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                        {Object.entries(errors).map(function (_a) {
                var field = _a[0], error = _a[1];
                return (<li key={field}>{error}</li>);
            })}
                      </ul>
                    </div>
                  </div>)}
              </form>
            </div>

            {/* Contact Information */}
            <div className="animate-slide-up animation-delay-200">
              <div className="mb-12">
                <h2 className="text-fluid-2xl font-bold text-high-contrast mb-6">
                  Contact Information
                </h2>
                <p className="text-high-contrast-muted text-lg leading-relaxed">
                  Visit our offices or reach out through any of our communication channels.
                </p>
              </div>

              {/* Office Locations */}
              <div className="space-y-6 mb-12">
                {officeLocations.map(function (office, index) { return (<div key={index} className="glass-base bg-white/60 rounded-2xl p-8 hover:bg-white/80 transition-all duration-300 enhance-hover-subtle">
                    <h3 className="text-xl font-bold text-high-contrast mb-6 flex items-center">
                      <div className="w-3 h-3 bg-gradient-brand rounded-full mr-3"></div>
                      {office.city} Office
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start group">
                        <div className="p-2 bg-primary/10 rounded-lg mr-4 group-hover:bg-primary/20 transition-colors">
                          <lucide_react_1.MapPin className="h-5 w-5 text-primary"/>
                        </div>
                        <span className="text-high-contrast-muted leading-relaxed">{office.address}</span>
                      </div>
                      <div className="flex items-center group">
                        <div className="p-2 bg-secondary/10 rounded-lg mr-4 group-hover:bg-secondary/20 transition-colors">
                          <lucide_react_1.Phone className="h-5 w-5 text-secondary"/>
                        </div>
                        <span className="text-high-contrast-muted font-medium">{office.phone}</span>
                      </div>
                      <div className="flex items-center group">
                        <div className="p-2 bg-accent/10 rounded-lg mr-4 group-hover:bg-accent/20 transition-colors">
                          <lucide_react_1.Clock className="h-5 w-5 text-accent"/>
                        </div>
                        <span className="text-high-contrast-muted">{office.hours}</span>
                      </div>
                    </div>
                  </div>); })}
              </div>

              {/* Why Choose Us */}
              <div className="glass-base bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 layer-depth-1">
                <h3 className="text-xl font-bold text-high-contrast mb-6 flex items-center">
                  <lucide_react_1.Star className="h-6 w-6 text-accent mr-3"/>
                  Why Choose TripleCheck?
                </h3>
                <div className="space-y-6">
                  {[
            {
                icon: lucide_react_1.Shield,
                title: "Trusted Verification",
                description: "99.8% accuracy rate with expert validation",
                color: "primary"
            },
            {
                icon: lucide_react_1.Users,
                title: "Expert Support",
                description: "Real estate professionals ready to help",
                color: "secondary"
            },
            {
                icon: lucide_react_1.Headphones,
                title: "24/7 Availability",
                description: "Support when you need it most",
                color: "accent"
            },
        ].map(function (feature, index) {
            var IconComponent = feature.icon;
            return (<div key={index} className="flex items-start group enhance-hover-subtle">
                        <div className={"p-3 bg-".concat(feature.color, "/10 rounded-xl mr-4 group-hover:bg-").concat(feature.color, "/20 transition-colors")}>
                          <IconComponent className={"h-6 w-6 text-".concat(feature.color)}/>
                        </div>
                        <div>
                          <h4 className="font-bold text-high-contrast mb-1">
                            {feature.title}
                          </h4>
                          <p className="text-high-contrast-muted leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>);
        })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-brand text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
        <div className="absolute top-10 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse-glow"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-pulse-glow animation-delay-500"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-fluid-2xl md:text-5xl font-bold mb-8 text-enhanced-contrast">
              Ready to Verify Your Property?
            </h2>
            <p className="text-fluid-lg mb-12 text-enhanced-subtle max-w-3xl mx-auto leading-relaxed">
              Don&apos;t wait for problems to arise. Start your property verification today 
              and invest with confidence in Kenya&apos;s real estate market.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button_1.Button size="lg" variant="secondary" onClick={function () {
            trackNavigation("/contact", BASIC_CHECKS_URL, "cta_verification");
            window.location.href = BASIC_CHECKS_URL;
        }} className="glass-btn-primary px-8 py-4 text-lg font-semibold hover-glow-warm">
                <lucide_react_1.Shield className="mr-3 h-5 w-5"/>
                Start Verification Now
                <lucide_react_1.ArrowRight className="ml-3 h-5 w-5"/>
              </button_1.Button>
              
              <button_1.Button size="lg" variant="outline" onClick={function () {
            trackNavigation("/contact", "/pricing", "cta_pricing");
            window.location.href = "/pricing";
        }} className="btn-glass border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold">
                View Pricing Plans
              </button_1.Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-white/70">
              <div className="flex items-center">
                <lucide_react_1.CheckCircle className="h-4 w-4 mr-2"/>
                No Setup Fees
              </div>
              <div className="flex items-center">
                <lucide_react_1.CheckCircle className="h-4 w-4 mr-2"/>
                30-Day Guarantee
              </div>
              <div className="flex items-center">
                <lucide_react_1.CheckCircle className="h-4 w-4 mr-2"/>
                Expert Support
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>);
}
