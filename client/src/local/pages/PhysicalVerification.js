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
exports.default = PhysicalVerification;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../components/ui/button");
var input_1 = require("../components/ui/input");
var card_1 = require("../components/ui/card");
var badge_1 = require("../components/ui/badge");
var select_1 = require("../components/ui/select");
var textarea_1 = require("../components/ui/textarea");
var label_1 = require("../components/ui/label");
var use_toast_1 = require("../hooks/use-toast");
// Mock data
var mockRequests = [
    {
        id: 'req-1',
        propertyId: 'prop-123',
        propertyAddress: '123 Westlands Road, Nairobi',
        requestType: 'inspection',
        status: 'completed',
        priority: 'medium',
        scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        assignedInspector: {
            id: 'insp-1',
            name: 'John Mwangi',
            specialization: ['Building Inspection', 'Safety Compliance'],
            rating: 4.8,
            completedInspections: 156,
            phone: '+254712345678',
            email: 'john@inspectors.co.ke',
            location: 'Nairobi',
            availability: 'available'
        },
        requestedBy: 'current-user',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        notes: 'Standard building inspection for property purchase',
        findings: {
            overallStatus: 'conditional',
            issues: [
                {
                    category: 'Electrical',
                    severity: 'medium',
                    description: 'Some electrical outlets need updating to current standards',
                    recommendation: 'Hire certified electrician for updates'
                },
                {
                    category: 'Plumbing',
                    severity: 'low',
                    description: 'Minor leak in kitchen faucet',
                    recommendation: 'Replace faucet washer'
                }
            ],
            photos: ['/inspection-photo-1.jpg', '/inspection-photo-2.jpg'],
            documents: ['/inspection-report.pdf'],
            inspectorNotes: 'Overall structure is sound. Minor issues noted above.',
            nextSteps: ['Address electrical updates', 'Fix plumbing leak', 'Schedule follow-up inspection']
        }
    },
    {
        id: 'req-2',
        propertyId: 'prop-456',
        propertyAddress: '456 Karen Close, Nairobi',
        requestType: 'survey',
        status: 'scheduled',
        priority: 'high',
        scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        assignedInspector: {
            id: 'insp-2',
            name: 'Sarah Wanjiku',
            specialization: ['Land Survey', 'Boundary Verification'],
            rating: 4.9,
            completedInspections: 203,
            phone: '+254798765432',
            email: 'sarah@surveyors.co.ke',
            location: 'Nairobi',
            availability: 'busy'
        },
        requestedBy: 'current-user',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        notes: 'Boundary dispute resolution survey'
    }
];
var mockInspectors = [
    {
        id: 'insp-1',
        name: 'John Mwangi',
        specialization: ['Building Inspection', 'Safety Compliance'],
        rating: 4.8,
        completedInspections: 156,
        phone: '+254712345678',
        email: 'john@inspectors.co.ke',
        location: 'Nairobi',
        availability: 'available'
    },
    {
        id: 'insp-2',
        name: 'Sarah Wanjiku',
        specialization: ['Land Survey', 'Boundary Verification'],
        rating: 4.9,
        completedInspections: 203,
        phone: '+254798765432',
        email: 'sarah@surveyors.co.ke',
        location: 'Nairobi',
        availability: 'busy'
    },
    {
        id: 'insp-3',
        name: 'David Kimani',
        specialization: ['Structural Assessment', 'Code Compliance'],
        rating: 4.7,
        completedInspections: 134,
        phone: '+254723456789',
        email: 'david@structural.co.ke',
        location: 'Nairobi',
        availability: 'available'
    }
];
function PhysicalVerification() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)('requests'), activeTab = _a[0], setActiveTab = _a[1];
    var requests = (0, react_1.useState)(mockRequests)[0];
    var _b = (0, react_1.useState)(null), selectedRequest = _b[0], setSelectedRequest = _b[1];
    var _c = (0, react_1.useState)(false), showNewRequestForm = _c[0], setShowNewRequestForm = _c[1];
    var _d = (0, react_1.useState)({
        propertyAddress: '',
        requestType: '',
        priority: 'medium',
        preferredDate: '',
        preferredTime: '',
        specialRequirements: '',
        contactPhone: '',
        contactEmail: ''
    }), newRequestForm = _d[0], setNewRequestForm = _d[1];
    var updateNewRequestForm = (0, react_1.useCallback)(function (key, value) {
        setNewRequestForm(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    }, []);
    var handleSubmitRequest = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!newRequestForm.propertyAddress || !newRequestForm.requestType) {
                        toast({
                            title: 'Missing required fields',
                            description: 'Please fill in property address and request type.',
                            variant: 'destructive'
                        });
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Simulate API call
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1500); })];
                case 2:
                    // Simulate API call
                    _a.sent();
                    toast({
                        title: 'Verification request submitted',
                        description: 'Your physical verification request has been submitted. An inspector will be assigned soon.',
                    });
                    setNewRequestForm({
                        propertyAddress: '',
                        requestType: '',
                        priority: 'medium',
                        preferredDate: '',
                        preferredTime: '',
                        specialRequirements: '',
                        contactPhone: '',
                        contactEmail: ''
                    });
                    setShowNewRequestForm(false);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: 'Failed to submit request',
                        description: 'Please try again later.',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [newRequestForm, toast]);
    var getStatusColor = function (status) {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'in-progress':
                return 'bg-blue-100 text-blue-800';
            case 'scheduled':
                return 'bg-yellow-100 text-yellow-800';
            case 'pending':
                return 'bg-gray-100 text-gray-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    var getPriorityColor = function (priority) {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800';
            case 'high':
                return 'bg-orange-100 text-orange-800';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800';
            case 'low':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    var formatDate = function (date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.Shield className="w-8 h-8 text-green-500"/>
            Physical Verification
          </h1>
          <p className="text-muted-foreground">
            Schedule on-ground property inspections with certified experts
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <button_1.Button variant={activeTab === 'requests' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('requests'); }}>
            My Requests
          </button_1.Button>
          <button_1.Button variant={activeTab === 'new' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('new'); }}>
            New Request
          </button_1.Button>
          <button_1.Button variant={activeTab === 'inspectors' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('inspectors'); }}>
            Inspectors
          </button_1.Button>
        </div>

        {activeTab === 'requests' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Requests List */}
            <div className="space-y-4">
              {requests.map(function (request) { return (<card_1.Card key={request.id} className={"cursor-pointer transition-all hover:shadow-md ".concat((selectedRequest === null || selectedRequest === void 0 ? void 0 : selectedRequest.id) === request.id ? 'ring-2 ring-primary' : '')} onClick={function () { return setSelectedRequest(request); }}>
                  <card_1.CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{request.propertyAddress}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {request.requestType} • {request.requestedBy}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <badge_1.Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </badge_1.Badge>
                        <badge_1.Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </badge_1.Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <lucide_react_1.Calendar className="w-4 h-4"/>
                        <span>Created: {formatDate(request.createdAt)}</span>
                      </div>
                      
                      {request.scheduledDate && (<div className="flex items-center gap-2">
                          <lucide_react_1.Clock className="w-4 h-4"/>
                          <span>Scheduled: {formatDate(request.scheduledDate)}</span>
                        </div>)}

                      {request.assignedInspector && (<div className="flex items-center gap-2">
                          <lucide_react_1.User className="w-4 h-4"/>
                          <span>Inspector: {request.assignedInspector.name}</span>
                        </div>)}
                    </div>

                    {request.notes && (<p className="text-sm mt-3 p-2 bg-muted rounded">
                        {request.notes}
                      </p>)}
                  </card_1.CardContent>
                </card_1.Card>); })}
            </div>

            {/* Request Details */}
            <div>
              {selectedRequest ? (<card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle>Request Details</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Property Information</h4>
                      <p className="text-sm">{selectedRequest.propertyAddress}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {selectedRequest.propertyId}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Request Details</h4>
                      <div className="space-y-1 text-sm">
                        <p>Type: <span className="capitalize">{selectedRequest.requestType}</span></p>
                        <p>Priority: <span className="capitalize">{selectedRequest.priority}</span></p>
                        <p>Status: <span className="capitalize">{selectedRequest.status}</span></p>
                      </div>
                    </div>

                    {selectedRequest.assignedInspector && (<div>
                        <h4 className="font-semibold mb-2">Assigned Inspector</h4>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{selectedRequest.assignedInspector.name}</span>
                            <div className="flex items-center gap-1">
                              <lucide_react_1.Star className="w-4 h-4 text-yellow-500"/>
                              <span className="text-sm">{selectedRequest.assignedInspector.rating}</span>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Specialization: {selectedRequest.assignedInspector.specialization.join(', ')}</p>
                            <p>Completed: {selectedRequest.assignedInspector.completedInspections} inspections</p>
                            <div className="flex gap-4 mt-2">
                              <button_1.Button size="sm" variant="outline">
                                <lucide_react_1.Phone className="w-4 h-4 mr-2"/>
                                Call
                              </button_1.Button>
                              <button_1.Button size="sm" variant="outline">
                                <lucide_react_1.Mail className="w-4 h-4 mr-2"/>
                                Email
                              </button_1.Button>
                            </div>
                          </div>
                        </div>
                      </div>)}

                    {selectedRequest.findings && (<div>
                        <h4 className="font-semibold mb-2">Inspection Results</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span>Overall Status:</span>
                            <badge_1.Badge className={selectedRequest.findings.overallStatus === 'passed' ? 'bg-green-100 text-green-800' :
                        selectedRequest.findings.overallStatus === 'conditional' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}>
                              {selectedRequest.findings.overallStatus}
                            </badge_1.Badge>
                          </div>

                          {selectedRequest.findings.issues.length > 0 && (<div>
                              <h5 className="font-medium mb-2">Issues Found:</h5>
                              <div className="space-y-2">
                                {selectedRequest.findings.issues.map(function (issue, index) { return (<div key={index} className="p-2 border rounded text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">{issue.category}</span>
                                      <badge_1.Badge variant="outline" className={issue.severity === 'high' ? 'text-red-600' :
                                issue.severity === 'medium' ? 'text-yellow-600' :
                                    'text-green-600'}>
                                        {issue.severity}
                                      </badge_1.Badge>
                                    </div>
                                    <p className="text-muted-foreground mb-1">{issue.description}</p>
                                    <p className="text-xs"><strong>Recommendation:</strong> {issue.recommendation}</p>
                                  </div>); })}
                              </div>
                            </div>)}

                          <div className="flex gap-2">
                            <button_1.Button size="sm" variant="outline">
                              <lucide_react_1.Download className="w-4 h-4 mr-2"/>
                              Download Report
                            </button_1.Button>
                            <button_1.Button size="sm" variant="outline">
                              <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
                              View Photos
                            </button_1.Button>
                          </div>
                        </div>
                      </div>)}
                  </card_1.CardContent>
                </card_1.Card>) : (<card_1.Card>
                  <card_1.CardContent className="py-12 text-center">
                    <lucide_react_1.FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                    <h3 className="font-semibold mb-2">Select a request</h3>
                    <p className="text-muted-foreground">
                      Choose a verification request to view details
                    </p>
                  </card_1.CardContent>
                </card_1.Card>)}
            </div>
          </div>)}

        {activeTab === 'new' && (<card_1.Card className="max-w-2xl mx-auto">
            <card_1.CardHeader>
              <card_1.CardTitle>New Verification Request</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div>
                <label_1.Label htmlFor="property-address">Property Address *</label_1.Label>
                <textarea_1.Textarea id="property-address" placeholder="Enter complete property address" value={newRequestForm.propertyAddress} onChange={function (e) { return updateNewRequestForm('propertyAddress', e.target.value); }} rows={3}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label_1.Label htmlFor="request-type">Request Type *</label_1.Label>
                  <select_1.Select value={newRequestForm.requestType} onValueChange={function (value) { return updateNewRequestForm('requestType', value); }}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder="Select request type"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="inspection">Building Inspection</select_1.SelectItem>
                      <select_1.SelectItem value="survey">Land Survey</select_1.SelectItem>
                      <select_1.SelectItem value="documentation">Document Verification</select_1.SelectItem>
                      <select_1.SelectItem value="compliance">Compliance Check</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                <div>
                  <label_1.Label htmlFor="priority">Priority</label_1.Label>
                  <select_1.Select value={newRequestForm.priority} onValueChange={function (value) { return updateNewRequestForm('priority', value); }}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="low">Low</select_1.SelectItem>
                      <select_1.SelectItem value="medium">Medium</select_1.SelectItem>
                      <select_1.SelectItem value="high">High</select_1.SelectItem>
                      <select_1.SelectItem value="urgent">Urgent</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label_1.Label htmlFor="preferred-date">Preferred Date</label_1.Label>
                  <input_1.Input id="preferred-date" type="date" value={newRequestForm.preferredDate} onChange={function (e) { return updateNewRequestForm('preferredDate', e.target.value); }}/>
                </div>

                <div>
                  <label_1.Label htmlFor="preferred-time">Preferred Time</label_1.Label>
                  <select_1.Select value={newRequestForm.preferredTime} onValueChange={function (value) { return updateNewRequestForm('preferredTime', value); }}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder="Select time"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="morning">Morning (8AM - 12PM)</select_1.SelectItem>
                      <select_1.SelectItem value="afternoon">Afternoon (12PM - 5PM)</select_1.SelectItem>
                      <select_1.SelectItem value="evening">Evening (5PM - 8PM)</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </div>

              <div>
                <label_1.Label htmlFor="special-requirements">Special Requirements</label_1.Label>
                <textarea_1.Textarea id="special-requirements" placeholder="Any special requirements or notes for the inspector..." value={newRequestForm.specialRequirements} onChange={function (e) { return updateNewRequestForm('specialRequirements', e.target.value); }} rows={3}/>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label_1.Label htmlFor="contact-phone">Contact Phone</label_1.Label>
                  <input_1.Input id="contact-phone" placeholder="+254XXXXXXXXX" value={newRequestForm.contactPhone} onChange={function (e) { return updateNewRequestForm('contactPhone', e.target.value); }}/>
                </div>

                <div>
                  <label_1.Label htmlFor="contact-email">Contact Email</label_1.Label>
                  <input_1.Input id="contact-email" type="email" placeholder="your@email.com" value={newRequestForm.contactEmail} onChange={function (e) { return updateNewRequestForm('contactEmail', e.target.value); }}/>
                </div>
              </div>

              <button_1.Button onClick={handleSubmitRequest} className="w-full">
                Submit Verification Request
              </button_1.Button>
            </card_1.CardContent>
          </card_1.Card>)}

        {activeTab === 'inspectors' && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockInspectors.map(function (inspector) { return (<card_1.Card key={inspector.id}>
                <card_1.CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{inspector.name}</h3>
                      <p className="text-sm text-muted-foreground">{inspector.location}</p>
                    </div>
                    <badge_1.Badge className={inspector.availability === 'available' ? 'bg-green-100 text-green-800' :
                    inspector.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}>
                      {inspector.availability}
                    </badge_1.Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <lucide_react_1.Star className="w-4 h-4 text-yellow-500"/>
                      <span className="font-medium">{inspector.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({inspector.completedInspections} inspections)
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-1">Specializations:</div>
                      <div className="flex flex-wrap gap-1">
                        {inspector.specialization.map(function (spec, index) { return (<badge_1.Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </badge_1.Badge>); })}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button_1.Button size="sm" className="flex-1">
                        <lucide_react_1.Phone className="w-4 h-4 mr-2"/>
                        Contact
                      </button_1.Button>
                      <button_1.Button size="sm" variant="outline">
                        <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
                        Profile
                      </button_1.Button>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>)}
      </div>
    </div>);
}
