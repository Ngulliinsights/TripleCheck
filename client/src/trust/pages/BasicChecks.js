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
exports.default = BasicChecks;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../../local/components/ui/button");
var input_1 = require("../../local/components/ui/input");
var card_1 = require("../../local/components/ui/card");
var badge_1 = require("../../local/components/ui/badge");
var textarea_1 = require("../../local/components/ui/textarea");
var label_1 = require("../../local/components/ui/label");
var select_1 = require("../../local/components/ui/select");
var use_toast_1 = require("../../local/hooks/use-toast");
var verificationChecks = [
    {
        id: 'ownership',
        name: 'Ownership Verification',
        description: 'Verify property ownership documents and title deed',
        status: 'pending',
        icon: lucide_react_1.FileText
    },
    {
        id: 'identity',
        name: 'Owner Identity Check',
        description: 'Verify owner identity against national ID database',
        status: 'pending',
        icon: lucide_react_1.User
    },
    {
        id: 'location',
        name: 'Property Location',
        description: 'Confirm property exists at the specified address',
        status: 'pending',
        icon: lucide_react_1.MapPin
    },
    {
        id: 'legal',
        name: 'Legal Status Check',
        description: 'Check for any legal disputes or encumbrances',
        status: 'pending',
        icon: lucide_react_1.Shield
    },
    {
        id: 'contact',
        name: 'Contact Verification',
        description: 'Verify owner contact information',
        status: 'pending',
        icon: lucide_react_1.Phone
    }
];
var documentTypes = [
    { value: 'title-deed', label: 'Title Deed' },
    { value: 'lease-agreement', label: 'Lease Agreement' },
    { value: 'sale-agreement', label: 'Sale Agreement' },
    { value: 'survey-plan', label: 'Survey Plan' },
    { value: 'id-copy', label: 'ID Copy' },
    { value: 'other', label: 'Other Document' }
];
var getStatusIcon = function (status) {
    switch (status) {
        case 'passed':
            return <lucide_react_1.CheckCircle className="w-5 h-5 text-green-500"/>;
        case 'failed':
            return <lucide_react_1.XCircle className="w-5 h-5 text-red-500"/>;
        case 'warning':
            return <lucide_react_1.AlertTriangle className="w-5 h-5 text-yellow-500"/>;
        default:
            return <lucide_react_1.Clock className="w-5 h-5 text-gray-500"/>;
    }
};
var getStatusColor = function (status) {
    switch (status) {
        case 'passed':
            return 'bg-green-100 text-green-800';
        case 'failed':
            return 'bg-red-100 text-red-800';
        case 'warning':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
function BasicChecks() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)('new'), activeTab = _a[0], setActiveTab = _a[1];
    var _b = (0, react_1.useState)(false), isSubmitting = _b[0], setIsSubmitting = _b[1];
    var _c = (0, react_1.useState)(verificationChecks), checks = _c[0], setChecks = _c[1];
    var _d = (0, react_1.useState)(''), searchQuery = _d[0], setSearchQuery = _d[1];
    var _e = (0, react_1.useState)({
        propertyAddress: '',
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        documentType: '',
        additionalInfo: ''
    }), formData = _e[0], setFormData = _e[1];
    var updateFormData = (0, react_1.useCallback)(function (key, value) {
        setFormData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    }, []);
    var handleSubmitVerification = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var formService, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!formData.propertyAddress || !formData.ownerName || !formData.documentType) {
                        toast({
                            title: 'Missing required fields',
                            description: 'Please fill in all required fields before submitting.',
                            variant: 'destructive'
                        });
                        return [2 /*return*/];
                    }
                    setIsSubmitting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('../../shared/services/FormService'); })];
                case 2:
                    formService = (_a.sent()).formService;
                    return [4 /*yield*/, formService.submitVerificationRequest(formData)];
                case 3:
                    result = _a.sent();
                    if (result.success) {
                        // Update checks to show processing
                        setChecks(function (prev) { return prev.map(function (check) { return (__assign(__assign({}, check), { status: 'pending' })); }); });
                        // Reset form
                        setFormData({
                            propertyAddress: '',
                            ownerName: '',
                            ownerPhone: '',
                            ownerEmail: '',
                            documentType: '',
                            additionalInfo: ''
                        });
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    toast({
                        title: 'Submission failed',
                        description: 'Failed to submit verification request. Please try again.',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setIsSubmitting(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [formData, toast]);
    var handleSearchExisting = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var mockResults;
        return __generator(this, function (_a) {
            if (!searchQuery.trim()) {
                toast({
                    title: 'Enter search criteria',
                    description: 'Please enter a property ID or address to search.',
                    variant: 'destructive'
                });
                return [2 /*return*/];
            }
            mockResults = [
                { id: 'ownership', status: 'passed', details: 'Title deed verified and authentic' },
                { id: 'identity', status: 'passed', details: 'Owner identity confirmed' },
                { id: 'location', status: 'warning', details: 'Property address needs minor clarification' },
                { id: 'legal', status: 'passed', details: 'No legal disputes found' },
                { id: 'contact', status: 'failed', details: 'Phone number could not be verified' }
            ];
            setChecks(function (prev) { return prev.map(function (check) {
                var result = mockResults.find(function (r) { return r.id === check.id; });
                return result ? __assign(__assign({}, check), { status: result.status, details: result.details }) : check;
            }); });
            toast({
                title: 'Verification results loaded',
                description: "Found verification results for \"".concat(searchQuery, "\"."),
            });
            return [2 /*return*/];
        });
    }); }, [searchQuery, toast]);
    var runAllChecks = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var _loop_1, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setChecks(function (prev) { return prev.map(function (check) { return (__assign(__assign({}, check), { status: 'pending' })); }); });
                    _loop_1 = function (i) {
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                                case 1:
                                    _b.sent();
                                    setChecks(function (prev) { return prev.map(function (check, index) {
                                        if (index === i) {
                                            var statuses = ['passed', 'passed', 'warning', 'passed', 'failed'];
                                            return __assign(__assign({}, check), { status: statuses[Math.floor(Math.random() * statuses.length)], details: "Check completed at ".concat(new Date().toLocaleTimeString()) });
                                        }
                                        return check;
                                    }); });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < checks.length)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(i)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    toast({
                        title: 'All checks completed',
                        description: 'Basic verification checks have been completed.',
                    });
                    return [2 /*return*/];
            }
        });
    }); }, [checks.length, toast]);
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.Shield className="w-8 h-8 text-blue-500"/>
            Basic Property Checks
          </h1>
          <p className="text-muted-foreground">
            Perform essential verification checks on property ownership, location, and legal status
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <button_1.Button variant={activeTab === 'new' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('new'); }} className="flex items-center gap-2">
            <lucide_react_1.Upload className="w-4 h-4"/>
            New Verification
          </button_1.Button>
          <button_1.Button variant={activeTab === 'existing' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('existing'); }} className="flex items-center gap-2">
            <lucide_react_1.Search className="w-4 h-4"/>
            Check Existing
          </button_1.Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'new' ? (
        /* New Verification Form */
        <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Submit New Verification Request</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label_1.Label htmlFor="property-address">Property Address *</label_1.Label>
                      <textarea_1.Textarea id="property-address" placeholder="Enter complete property address" value={formData.propertyAddress} onChange={function (e) { return updateFormData('propertyAddress', e.target.value); }} rows={3}/>
                    </div>

                    <div>
                      <label_1.Label htmlFor="document-type">Document Type *</label_1.Label>
                      <select_1.Select value={formData.documentType} onValueChange={function (value) { return updateFormData('documentType', value); }}>
                        <select_1.SelectTrigger>
                          <select_1.SelectValue placeholder="Select document type"/>
                        </select_1.SelectTrigger>
                        <select_1.SelectContent>
                          {documentTypes.map(function (type) { return (<select_1.SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </select_1.SelectItem>); })}
                        </select_1.SelectContent>
                      </select_1.Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label_1.Label htmlFor="owner-name">Owner Name *</label_1.Label>
                      <input_1.Input id="owner-name" placeholder="Full name as on documents" value={formData.ownerName} onChange={function (e) { return updateFormData('ownerName', e.target.value); }}/>
                    </div>

                    <div>
                      <label_1.Label htmlFor="owner-phone">Phone Number</label_1.Label>
                      <input_1.Input id="owner-phone" placeholder="+254XXXXXXXXX" value={formData.ownerPhone} onChange={function (e) { return updateFormData('ownerPhone', e.target.value); }}/>
                    </div>

                    <div>
                      <label_1.Label htmlFor="owner-email">Email Address</label_1.Label>
                      <input_1.Input id="owner-email" type="email" placeholder="owner@example.com" value={formData.ownerEmail} onChange={function (e) { return updateFormData('ownerEmail', e.target.value); }}/>
                    </div>
                  </div>

                  <div>
                    <label_1.Label htmlFor="additional-info">Additional Information</label_1.Label>
                    <textarea_1.Textarea id="additional-info" placeholder="Any additional details that might help with verification" value={formData.additionalInfo} onChange={function (e) { return updateFormData('additionalInfo', e.target.value); }} rows={3}/>
                  </div>

                  <div className="flex gap-4">
                    <button_1.Button onClick={handleSubmitVerification} disabled={isSubmitting} className="flex items-center gap-2">
                      {isSubmitting ? (<lucide_react_1.RefreshCw className="w-4 h-4 animate-spin"/>) : (<lucide_react_1.Upload className="w-4 h-4"/>)}
                      {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                    </button_1.Button>

                    <button_1.Button variant="outline">
                      <lucide_react_1.Upload className="w-4 h-4 mr-2"/>
                      Upload Documents
                    </button_1.Button>
                  </div>
                </card_1.CardContent>
              </card_1.Card>) : (
        /* Existing Verification Search */
        <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Search Existing Verification</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <input_1.Input placeholder="Enter property ID, address, or owner name" value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }}/>
                    </div>
                    <button_1.Button onClick={handleSearchExisting}>
                      <lucide_react_1.Search className="w-4 h-4 mr-2"/>
                      Search
                    </button_1.Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Search by property ID (e.g., PROP-123), full address, or owner name
                  </div>
                </card_1.CardContent>
              </card_1.Card>)}

            {/* Verification Checks Results */}
            <card_1.Card>
              <card_1.CardHeader>
                <div className="flex items-center justify-between">
                  <card_1.CardTitle>Verification Checks</card_1.CardTitle>
                  <button_1.Button variant="outline" size="sm" onClick={runAllChecks} className="flex items-center gap-2">
                    <lucide_react_1.RefreshCw className="w-4 h-4"/>
                    Run All Checks
                  </button_1.Button>
                </div>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  {checks.map(function (check) {
            var IconComponent = check.icon;
            return (<div key={check.id} className="flex items-start gap-4 p-4 rounded-lg border">
                        <div className="p-2 bg-muted rounded-full">
                          <IconComponent className="w-5 h-5"/>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{check.name}</h3>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(check.status)}
                              <badge_1.Badge className={getStatusColor(check.status)}>
                                {check.status}
                              </badge_1.Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            {check.description}
                          </p>

                          {check.details && (<p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              {check.details}
                            </p>)}
                        </div>
                      </div>);
        })}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Verification Status */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Verification Status</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed Checks:</span>
                    <span className="font-semibold">
                      {checks.filter(function (c) { return c.status !== 'pending'; }).length}/{checks.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Passed:</span>
                    <span className="font-semibold text-green-600">
                      {checks.filter(function (c) { return c.status === 'passed'; }).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Warnings:</span>
                    <span className="font-semibold text-yellow-600">
                      {checks.filter(function (c) { return c.status === 'warning'; }).length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed:</span>
                    <span className="font-semibold text-red-600">
                      {checks.filter(function (c) { return c.status === 'failed'; }).length}
                    </span>
                  </div>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Quick Actions */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Quick Actions</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-2">
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Download className="w-4 h-4 mr-2"/>
                  Download Report
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Mail className="w-4 h-4 mr-2"/>
                  Email Results
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
                  View Full Report
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Calendar className="w-4 h-4 mr-2"/>
                  Schedule Follow-up
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>

            {/* Help & Support */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Need Help?</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Our verification process typically takes 24-48 hours to complete.
                </p>
                
                <div className="space-y-2">
                  <button_1.Button variant="ghost" size="sm" className="w-full justify-start">
                    📋 Verification Guide
                  </button_1.Button>
                  <button_1.Button variant="ghost" size="sm" className="w-full justify-start">
                    📞 Contact Support
                  </button_1.Button>
                  <button_1.Button variant="ghost" size="sm" className="w-full justify-start">
                    ❓ FAQ
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>
    </div>);
}
