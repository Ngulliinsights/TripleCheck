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
exports.default = PropertyVerification;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var label_1 = require("../../local/components/ui/label");
var separator_1 = require("../../local/components/ui/separator");
var textarea_1 = require("../../local/components/ui/textarea");
var VERIFICATION_PACKAGES = [
    {
        id: "basic",
        name: "Basic Verification",
        description: "Essential property verification for individual buyers",
        price: 2500,
        duration: "24-48 hours",
        icon: <lucide_react_1.Shield className="w-6 h-6"/>,
        features: [
            "Ownership document verification",
            "Basic fraud detection scan",
            "Property title validation",
            "Legal compliance check",
            "Basic property history",
        ],
    },
    {
        id: "comprehensive",
        name: "Comprehensive Verification",
        description: "Complete verification with expert review and community intelligence",
        price: 7500,
        duration: "3-5 business days",
        popular: true,
        icon: <lucide_react_1.FileText className="w-6 h-6"/>,
        features: [
            "All Basic Verification features",
            "Expert legal review",
            "Physical property inspection",
            "Community intelligence gathering",
            "Market value assessment",
            "Detailed risk analysis report",
            "Fraud prevention guarantee",
        ],
    },
    {
        id: "premium",
        name: "Premium Verification",
        description: "Enterprise-grade verification with ongoing monitoring",
        price: 15000,
        duration: "5-7 business days",
        icon: <lucide_react_1.Star className="w-6 h-6"/>,
        features: [
            "All Comprehensive features",
            "Blockchain verification record",
            "6-month monitoring service",
            "Priority expert consultation",
            "Insurance coverage up to KES 5M",
            "Dedicated account manager",
            "Custom verification criteria",
        ],
    },
];
// Constants for duplicate strings
var STEP_SELECT_PACKAGE = "select-package";
var STEP_PROPERTY_INFO = "property-info";
var STEP_DOCUMENT_UPLOAD = "document-upload";
var STEP_PAYMENT = "payment";
// Status constants
var STATUS_PENDING = "pending";
var TIME_30_MINUTES = "30 minutes";
var TIME_2_4_HOURS = "2-4 hours";
var TIME_1_2_HOURS = "1-2 hours";
var TIME_24_48_HOURS = "24-48 hours";
var VERIFICATION_STEPS = [
    {
        id: "document-upload",
        title: "Document Upload & Analysis",
        description: "Upload and analyze property documents for authenticity",
        status: STATUS_PENDING,
        estimatedTime: TIME_30_MINUTES,
    },
    {
        id: "ownership-verification",
        title: "Ownership Verification",
        description: "Verify legitimate ownership through government registries",
        status: STATUS_PENDING,
        estimatedTime: TIME_2_4_HOURS,
    },
    {
        id: "fraud-detection",
        title: "Fraud Detection Analysis",
        description: "AI-powered analysis to identify potential fraud indicators",
        status: STATUS_PENDING,
        estimatedTime: TIME_1_2_HOURS,
    },
    {
        id: "expert-review",
        title: "Expert Legal Review",
        description: "Professional review by qualified legal experts",
        status: STATUS_PENDING,
        estimatedTime: TIME_24_48_HOURS,
    },
    {
        id: "final-report",
        title: "Final Verification Report",
        description: "Comprehensive report with recommendations and risk assessment",
        status: STATUS_PENDING,
        estimatedTime: TIME_2_4_HOURS,
    },
];
function PropertyVerification() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_1.useState)("comprehensive"), selectedPackage = _a[0], setSelectedPackage = _a[1];
    var _b = (0, react_1.useState)(STEP_SELECT_PACKAGE), currentStep = _b[0], setCurrentStep = _b[1];
    var _c = (0, react_1.useState)({
        address: "",
        propertyType: "",
        estimatedValue: "",
        sellerName: "",
        sellerContact: "",
        additionalNotes: "",
    }), propertyInfo = _c[0], setPropertyInfo = _c[1];
    var _d = (0, react_1.useState)([]), uploadedFiles = _d[0], setUploadedFiles = _d[1];
    // Get property ID from URL params if coming from a specific property (for future use)
    // const propertyId = searchParams.get('propertyId');
    var handlePackageSelect = (0, react_1.useCallback)(function (packageId) {
        setSelectedPackage(packageId);
    }, []);
    var handleNextStep = (0, react_1.useCallback)(function () {
        if (currentStep === STEP_SELECT_PACKAGE) {
            setCurrentStep(STEP_PROPERTY_INFO);
        }
        else if (currentStep === STEP_PROPERTY_INFO) {
            setCurrentStep(STEP_DOCUMENT_UPLOAD);
        }
        else if (currentStep === STEP_DOCUMENT_UPLOAD) {
            setCurrentStep(STEP_PAYMENT);
        }
    }, [currentStep]);
    var handlePreviousStep = (0, react_1.useCallback)(function () {
        if (currentStep === STEP_PROPERTY_INFO) {
            setCurrentStep(STEP_SELECT_PACKAGE);
        }
        else if (currentStep === STEP_DOCUMENT_UPLOAD) {
            setCurrentStep(STEP_PROPERTY_INFO);
        }
        else if (currentStep === STEP_PAYMENT) {
            setCurrentStep(STEP_DOCUMENT_UPLOAD);
        }
    }, [currentStep]);
    var handlePropertyInfoChange = (0, react_1.useCallback)(function (field, value) {
        setPropertyInfo(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
    }, []);
    var handleFileUpload = (0, react_1.useCallback)(function (event) {
        var files = event.target.files;
        if (files) {
            setUploadedFiles(function (prev) { return __spreadArray(__spreadArray([], prev, true), Array.from(files), true); });
        }
    }, []);
    var handleStartVerification = (0, react_1.useCallback)(function () {
        // In a real app, this would submit the verification request
        navigate("/land-verification/dashboard");
    }, [navigate]);
    var selectedPackageData = VERIFICATION_PACKAGES.find(function (pkg) { return pkg.id === selectedPackage; });
    return (<div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
              <lucide_react_1.Shield className="w-4 h-4 text-primary"/>
              <span className="text-sm font-medium text-primary">
                Property Verification
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Verify Your Property Investment
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Protect your investment with comprehensive property verification
              services designed specifically for Kenya's real estate
              market.
            </p>
          </div>
        </div>
      </section>

      {/* Progress Indicator */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              {[
            {
                id: STEP_SELECT_PACKAGE,
                label: "Select Package",
                icon: <lucide_react_1.Shield className="w-4 h-4"/>,
            },
            {
                id: STEP_PROPERTY_INFO,
                label: "Property Info",
                icon: <lucide_react_1.MapPin className="w-4 h-4"/>,
            },
            {
                id: STEP_DOCUMENT_UPLOAD,
                label: "Upload Documents",
                icon: <lucide_react_1.Upload className="w-4 h-4"/>,
            },
            {
                id: STEP_PAYMENT,
                label: "Payment",
                icon: <lucide_react_1.DollarSign className="w-4 h-4"/>,
            },
        ].map(function (step, index) { return (<div key={step.id} className="flex items-center">
                  <div className={"\n                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors\n                    ".concat(currentStep === step.id ?
                "bg-primary border-primary text-white"
                : "bg-background border-muted-foreground/30 text-muted-foreground", "\n                  ")}>
                    {step.icon}
                  </div>
                  <span className={"ml-2 text-sm font-medium ".concat(currentStep === step.id ?
                "text-primary"
                : "text-muted-foreground")}>
                    {step.label}
                  </span>
                  {index < 3 && (<div className="w-16 h-0.5 bg-muted-foreground/20 mx-4"/>)}
                </div>); })}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {currentStep === STEP_SELECT_PACKAGE && (<div>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4 text-foreground">
                    Choose Your Verification Package
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Select the verification level that best suits your needs and
                    budget.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  {VERIFICATION_PACKAGES.map(function (pkg) { return (<card_1.Card key={pkg.id} className={"\n                        relative cursor-pointer transition-all duration-300 hover:shadow-lg\n                        ".concat(selectedPackage === pkg.id ?
                    "border-primary shadow-lg ring-2 ring-primary/20"
                    : "border-border hover:border-primary/30", "\n                      ")} onClick={function () { return handlePackageSelect(pkg.id); }}>
                      {pkg.popular && (<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <badge_1.Badge variant="default" className="px-4 py-1 text-xs font-semibold">
                            MOST POPULAR
                          </badge_1.Badge>
                        </div>)}

                      <card_1.CardHeader className="text-center pb-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 mx-auto">
                          {pkg.icon}
                        </div>
                        <card_1.CardTitle className="text-xl font-bold">
                          {pkg.name}
                        </card_1.CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {pkg.description}
                        </p>
                        <div className="mt-4">
                          <span className="text-3xl font-bold text-primary">
                            KES {pkg.price.toLocaleString()}
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {pkg.duration}
                          </p>
                        </div>
                      </card_1.CardHeader>

                      <card_1.CardContent>
                        <ul className="space-y-3">
                          {pkg.features.map(function (feature, index) { return (<li key={index} className="flex items-start gap-3">
                              <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0"/>
                              <span className="text-sm text-muted-foreground">
                                {feature}
                              </span>
                            </li>); })}
                        </ul>
                      </card_1.CardContent>
                    </card_1.Card>); })}
                </div>

                <div className="text-center">
                  <button_1.Button size="lg" onClick={handleNextStep} className="px-8 py-3">
                    Continue with {selectedPackageData === null || selectedPackageData === void 0 ? void 0 : selectedPackageData.name}
                    <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
                  </button_1.Button>
                </div>
              </div>)}

            {currentStep === STEP_PROPERTY_INFO && (<div>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4 text-foreground">
                    Property Information
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Provide details about the property you want to verify.
                  </p>
                </div>

                <card_1.Card className="max-w-2xl mx-auto">
                  <card_1.CardContent className="p-8">
                    <div className="space-y-6">
                      <div>
                        <label_1.Label htmlFor="address">Property Address *</label_1.Label>
                        <input_1.Input id="address" placeholder="Enter the full property address" value={propertyInfo.address} onChange={function (e) {
                return handlePropertyInfoChange("address", e.target.value);
            }} className="mt-2"/>
                      </div>

                      <div>
                        <label_1.Label htmlFor="propertyType">Property Type *</label_1.Label>
                        <input_1.Input id="propertyType" placeholder="e.g., Residential, Commercial, Land" value={propertyInfo.propertyType} onChange={function (e) {
                return handlePropertyInfoChange("propertyType", e.target.value);
            }} className="mt-2"/>
                      </div>

                      <div>
                        <label_1.Label htmlFor="estimatedValue">
                          Estimated Value (KES)
                        </label_1.Label>
                        <input_1.Input id="estimatedValue" placeholder="e.g., 5,000,000" value={propertyInfo.estimatedValue} onChange={function (e) {
                return handlePropertyInfoChange("estimatedValue", e.target.value);
            }} className="mt-2"/>
                      </div>

                      <div>
                        <label_1.Label htmlFor="sellerName">Seller/Owner Name *</label_1.Label>
                        <input_1.Input id="sellerName" placeholder="Full name of the property seller/owner" value={propertyInfo.sellerName} onChange={function (e) {
                return handlePropertyInfoChange("sellerName", e.target.value);
            }} className="mt-2"/>
                      </div>

                      <div>
                        <label_1.Label htmlFor="sellerContact">
                          Seller Contact Information
                        </label_1.Label>
                        <input_1.Input id="sellerContact" placeholder="Phone number or email" value={propertyInfo.sellerContact} onChange={function (e) {
                return handlePropertyInfoChange("sellerContact", e.target.value);
            }} className="mt-2"/>
                      </div>

                      <div>
                        <label_1.Label htmlFor="additionalNotes">
                          Additional Notes
                        </label_1.Label>
                        <textarea_1.Textarea id="additionalNotes" placeholder="Any additional information about the property or specific concerns" value={propertyInfo.additionalNotes} onChange={function (e) {
                return handlePropertyInfoChange("additionalNotes", e.target.value);
            }} className="mt-2" rows={4}/>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                      <button_1.Button variant="outline" onClick={handlePreviousStep} className="flex-1">
                        Previous
                      </button_1.Button>
                      <button_1.Button onClick={handleNextStep} className="flex-1" disabled={!propertyInfo.address ||
                !propertyInfo.propertyType ||
                !propertyInfo.sellerName}>
                        Continue
                        <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
                      </button_1.Button>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>
              </div>)}

            {currentStep === STEP_DOCUMENT_UPLOAD && (<div>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4 text-foreground">
                    Upload Property Documents
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Upload all relevant property documents for verification.
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <card_1.Card>
                      <card_1.CardHeader>
                        <card_1.CardTitle className="flex items-center gap-2">
                          <lucide_react_1.Upload className="w-5 h-5"/>
                          Document Upload
                        </card_1.CardTitle>
                      </card_1.CardHeader>
                      <card_1.CardContent>
                        <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                          <lucide_react_1.Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                          <p className="text-muted-foreground mb-4">
                            Drag and drop files here, or click to browse
                          </p>
                          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload} className="hidden" id="file-upload" aria-label="Upload property documents" title="Upload property documents for verification"/>
                          <button_1.Button variant="outline" onClick={function () { var _a; return (_a = document.getElementById("file-upload")) === null || _a === void 0 ? void 0 : _a.click(); }}>
                            Choose Files
                          </button_1.Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Supported formats: PDF, JPG, PNG, DOC, DOCX (Max
                            10MB each)
                          </p>
                        </div>

                        {uploadedFiles.length > 0 && (<div className="mt-6">
                            <h4 className="font-medium mb-3">
                              Uploaded Files ({uploadedFiles.length})
                            </h4>
                            <div className="space-y-2">
                              {uploadedFiles.map(function (file, index) { return (<div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <lucide_react_1.FileText className="w-4 h-4 text-muted-foreground"/>
                                    <span className="text-sm font-medium">
                                      {file.name}
                                    </span>
                                  </div>
                                  <badge_1.Badge variant="outline" className="text-xs">
                                    {(file.size / 1024 / 1024).toFixed(1)} MB
                                  </badge_1.Badge>
                                </div>); })}
                            </div>
                          </div>)}
                      </card_1.CardContent>
                    </card_1.Card>

                    <card_1.Card>
                      <card_1.CardHeader>
                        <card_1.CardTitle className="flex items-center gap-2">
                          <lucide_react_1.CheckCircle className="w-5 h-5"/>
                          Required Documents
                        </card_1.CardTitle>
                      </card_1.CardHeader>
                      <card_1.CardContent>
                        <div className="space-y-4">
                          {[
                "Title Deed or Certificate of Title",
                "Sale Agreement or Purchase Contract",
                "Survey Plan or Site Plan",
                "Land Control Board Consent (if applicable)",
                "Property Valuation Report",
                "Tax Compliance Certificate",
                "Identity Documents of Seller/Owner",
            ].map(function (doc, index) { return (<div key={index} className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-primary rounded-full"/>
                              <span className="text-sm text-muted-foreground">
                                {doc}
                              </span>
                            </div>); })}
                        </div>

                        <alert_1.Alert className="mt-6">
                          <lucide_react_1.AlertTriangle className="w-4 h-4"/>
                          <alert_1.AlertDescription>
                            All documents will be encrypted and stored securely.
                            We comply with Kenya's data protection
                            regulations.
                          </alert_1.AlertDescription>
                        </alert_1.Alert>
                      </card_1.CardContent>
                    </card_1.Card>
                  </div>

                  <div className="flex gap-4 mt-8 max-w-2xl mx-auto">
                    <button_1.Button variant="outline" onClick={handlePreviousStep} className="flex-1">
                      Previous
                    </button_1.Button>
                    <button_1.Button onClick={handleNextStep} className="flex-1" disabled={uploadedFiles.length === 0}>
                      Continue to Payment
                      <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
                    </button_1.Button>
                  </div>
                </div>
              </div>)}

            {currentStep === STEP_PAYMENT && selectedPackageData && (<div>
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4 text-foreground">
                    Complete Your Verification
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Review your order and complete the payment to start
                    verification.
                  </p>
                </div>

                <div className="max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <card_1.Card>
                      <card_1.CardHeader>
                        <card_1.CardTitle>Order Summary</card_1.CardTitle>
                      </card_1.CardHeader>
                      <card_1.CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {selectedPackageData.name}
                          </span>
                          <span className="font-bold">
                            KES {selectedPackageData.price.toLocaleString()}
                          </span>
                        </div>
                        <separator_1.Separator />
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <lucide_react_1.MapPin className="w-4 h-4"/>
                            <span>{propertyInfo.address}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <lucide_react_1.Clock className="w-4 h-4"/>
                            <span>
                              Expected completion:{" "}
                              {selectedPackageData.duration}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <lucide_react_1.FileText className="w-4 h-4"/>
                            <span>
                              {uploadedFiles.length} documents uploaded
                            </span>
                          </div>
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>

                    <card_1.Card>
                      <card_1.CardHeader>
                        <card_1.CardTitle>Verification Process</card_1.CardTitle>
                      </card_1.CardHeader>
                      <card_1.CardContent>
                        <div className="space-y-4">
                          {VERIFICATION_STEPS.map(function (step, index) { return (<div key={step.id} className="flex items-start gap-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-medium text-sm">
                                  {step.title}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {step.description}
                                </p>
                                <p className="text-xs text-primary mt-1">
                                  ~{step.estimatedTime}
                                </p>
                              </div>
                            </div>); })}
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>
                  </div>

                  <card_1.Card className="mt-8">
                    <card_1.CardContent className="p-8">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-4">
                          Ready to Start Verification?
                        </h3>
                        <p className="text-muted-foreground mb-6">
                          Click below to proceed with payment and begin your
                          property verification process.
                        </p>
                        <div className="flex gap-4 justify-center">
                          <button_1.Button variant="outline" onClick={handlePreviousStep}>
                            Previous
                          </button_1.Button>
                          <button_1.Button size="lg" onClick={handleStartVerification} className="px-8">
                            Start Verification - KES{" "}
                            {selectedPackageData.price.toLocaleString()}
                            <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
                          </button_1.Button>
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <lucide_react_1.Phone className="w-4 h-4"/>
                            <span>M-Pesa Payment</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <lucide_react_1.Shield className="w-4 h-4"/>
                            <span>Secure & Encrypted</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <lucide_react_1.Calendar className="w-4 h-4"/>
                            <span>Money-back Guarantee</span>
                          </div>
                        </div>
                      </div>
                    </card_1.CardContent>
                  </card_1.Card>
                </div>
              </div>)}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4 text-foreground">
                Why Choose TripleCheck Verification?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
            {
                icon: <lucide_react_1.Shield className="w-8 h-8 text-green-500"/>,
                title: "Fraud Prevention",
                description: "Advanced AI and expert analysis to detect and prevent property fraud",
                stat: "99.8% accuracy rate",
            },
            {
                icon: <lucide_react_1.Users className="w-8 h-8 text-blue-500"/>,
                title: "Expert Network",
                description: "Verified legal experts, surveyors, and local authorities",
                stat: "500+ professionals",
            },
            {
                icon: <lucide_react_1.Clock className="w-8 h-8 text-purple-500"/>,
                title: "Fast Turnaround",
                description: "Quick verification process without compromising thoroughness",
                stat: "24-48 hour delivery",
            },
        ].map(function (item, index) { return (<card_1.Card key={index} className="text-center">
                  <card_1.CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/50 mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground mb-4">
                      {item.description}
                    </p>
                    <badge_1.Badge variant="outline" className="text-primary border-primary">
                      {item.stat}
                    </badge_1.Badge>
                  </card_1.CardContent>
                </card_1.Card>); })}
            </div>
          </div>
        </div>
      </section>
    </div>);
}
