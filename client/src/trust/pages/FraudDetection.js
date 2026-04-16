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
exports.default = FraudDetection;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../../local/components/ui/button");
var input_1 = require("../../local/components/ui/input");
var card_1 = require("../../local/components/ui/card");
var badge_1 = require("../../local/components/ui/badge");
var select_1 = require("../../local/components/ui/select");
var use_toast_1 = require("../../local/hooks/use-toast");
// Mock data
var mockAlerts = [
    {
        id: 'alert-1',
        propertyId: 'prop-123',
        propertyTitle: 'Luxury Villa in Karen',
        riskLevel: 'high',
        alertType: 'duplicate',
        description: 'Property images and description match another listing with different owner',
        detectedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        status: 'active',
        confidence: 92,
        details: {
            location: 'Karen, Nairobi',
            price: 45000000,
            ownerName: 'John Doe',
            contactInfo: '+254712345678'
        }
    },
    {
        id: 'alert-2',
        propertyId: 'prop-456',
        propertyTitle: 'Modern Apartment in Westlands',
        riskLevel: 'critical',
        alertType: 'fake-documents',
        description: 'Title deed shows signs of digital manipulation and forgery',
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        status: 'investigating',
        confidence: 98,
        details: {
            location: 'Westlands, Nairobi',
            price: 15000000,
            ownerName: 'Jane Smith',
            contactInfo: '+254798765432'
        }
    },
    {
        id: 'alert-3',
        propertyId: 'prop-789',
        propertyTitle: 'Family Home in Lavington',
        riskLevel: 'medium',
        alertType: 'suspicious-pricing',
        description: 'Property priced 40% below market average for the area',
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        status: 'resolved',
        confidence: 75,
        details: {
            location: 'Lavington, Nairobi',
            price: 18000000,
            ownerName: 'Mike Johnson',
            contactInfo: '+254723456789'
        }
    }
];
var mockPatterns = [
    {
        id: 'pattern-1',
        name: 'Duplicate Listing Detection',
        description: 'Identifies properties listed multiple times with different details',
        detectionCount: 47,
        successRate: 94,
        lastDetected: new Date(Date.now() - 1000 * 60 * 30),
        severity: 'high'
    },
    {
        id: 'pattern-2',
        name: 'Document Forgery Analysis',
        description: 'AI-powered detection of manipulated or fake property documents',
        detectionCount: 23,
        successRate: 98,
        lastDetected: new Date(Date.now() - 1000 * 60 * 60 * 2),
        severity: 'high'
    },
    {
        id: 'pattern-3',
        name: 'Price Anomaly Detection',
        description: 'Flags properties with suspicious pricing patterns',
        detectionCount: 156,
        successRate: 76,
        lastDetected: new Date(Date.now() - 1000 * 60 * 60 * 6),
        severity: 'medium'
    },
    {
        id: 'pattern-4',
        name: 'Identity Verification',
        description: 'Cross-references owner information across multiple databases',
        detectionCount: 89,
        successRate: 91,
        lastDetected: new Date(Date.now() - 1000 * 60 * 60 * 12),
        severity: 'high'
    }
];
var mockStats = {
    totalAlerts: 1247,
    activeAlerts: 23,
    resolvedAlerts: 1198,
    preventedFraud: 156,
    accuracyRate: 94.2
};
var getRiskColor = function (level) {
    switch (level) {
        case 'critical':
            return 'bg-red-100 text-red-800 border-red-200';
        case 'high':
            return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'medium':
            return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low':
            return 'bg-green-100 text-green-800 border-green-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};
var getStatusColor = function (status) {
    switch (status) {
        case 'active':
            return 'bg-red-100 text-red-800';
        case 'investigating':
            return 'bg-yellow-100 text-yellow-800';
        case 'resolved':
            return 'bg-green-100 text-green-800';
        case 'false-positive':
            return 'bg-gray-100 text-gray-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};
var getAlertTypeIcon = function (type) {
    switch (type) {
        case 'duplicate':
            return <lucide_react_1.Target className="w-4 h-4"/>;
        case 'fake-documents':
            return <lucide_react_1.Shield className="w-4 h-4"/>;
        case 'suspicious-pricing':
            return <lucide_react_1.DollarSign className="w-4 h-4"/>;
        case 'identity-mismatch':
            return <lucide_react_1.User className="w-4 h-4"/>;
        case 'location-mismatch':
            return <lucide_react_1.MapPin className="w-4 h-4"/>;
        default:
            return <lucide_react_1.AlertTriangle className="w-4 h-4"/>;
    }
};
function FraudDetection() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)(mockAlerts), alerts = _a[0], setAlerts = _a[1];
    var _b = (0, react_1.useState)(null), selectedAlert = _b[0], setSelectedAlert = _b[1];
    var _c = (0, react_1.useState)('all'), filterStatus = _c[0], setFilterStatus = _c[1];
    var _d = (0, react_1.useState)('all'), filterRisk = _d[0], setFilterRisk = _d[1];
    var _e = (0, react_1.useState)(''), searchQuery = _e[0], setSearchQuery = _e[1];
    var _f = (0, react_1.useState)(false), isScanning = _f[0], setIsScanning = _f[1];
    var filteredAlerts = (0, react_1.useMemo)(function () {
        return alerts.filter(function (alert) {
            var _a;
            var matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
            var matchesRisk = filterRisk === 'all' || alert.riskLevel === filterRisk;
            var matchesSearch = !searchQuery ||
                alert.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ((_a = alert.details.ownerName) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesStatus && matchesRisk && matchesSearch;
        });
    }, [alerts, filterStatus, filterRisk, searchQuery]);
    var handleRunScan = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var newAlert_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsScanning(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // Simulate fraud detection scan
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 3000); })];
                case 2:
                    // Simulate fraud detection scan
                    _a.sent();
                    newAlert_1 = {
                        id: "alert-".concat(Date.now()),
                        propertyId: "prop-".concat(Date.now()),
                        propertyTitle: 'Suspicious Property Listing',
                        riskLevel: 'high',
                        alertType: 'duplicate',
                        description: 'Newly detected suspicious activity',
                        detectedAt: new Date(),
                        status: 'active',
                        confidence: 89,
                        details: {
                            location: 'Kilimani, Nairobi',
                            price: 25000000,
                            ownerName: 'Unknown',
                            contactInfo: '+254700000000'
                        }
                    };
                    setAlerts(function (prev) { return __spreadArray([newAlert_1], prev, true); });
                    toast({
                        title: 'Fraud scan completed',
                        description: 'New suspicious activity detected. Check the alerts for details.',
                    });
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: 'Scan failed',
                        description: 'Failed to complete fraud detection scan. Please try again.',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 5];
                case 4:
                    setIsScanning(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [toast]);
    var handleUpdateAlertStatus = (0, react_1.useCallback)(function (alertId, newStatus) {
        setAlerts(function (prev) { return prev.map(function (alert) {
            return alert.id === alertId ? __assign(__assign({}, alert), { status: newStatus }) : alert;
        }); });
        toast({
            title: 'Alert status updated',
            description: "Alert has been marked as ".concat(newStatus, "."),
        });
    }, [toast]);
    var formatTime = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var minutes = Math.floor(diff / (1000 * 60));
        var hours = Math.floor(diff / (1000 * 60 * 60));
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (minutes < 60)
            return "".concat(minutes, "m ago");
        if (hours < 24)
            return "".concat(hours, "h ago");
        return "".concat(days, "d ago");
    };
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.Shield className="w-8 h-8 text-red-500"/>
            Fraud Detection System
          </h1>
          <p className="text-muted-foreground">
            AI-powered fraud detection and prevention for property listings
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <card_1.Card>
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.BarChart3 className="w-5 h-5 text-blue-500"/>
                <div>
                  <div className="text-2xl font-bold">{mockStats.totalAlerts}</div>
                  <div className="text-xs text-muted-foreground">Total Alerts</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.AlertTriangle className="w-5 h-5 text-red-500"/>
                <div>
                  <div className="text-2xl font-bold">{mockStats.activeAlerts}</div>
                  <div className="text-xs text-muted-foreground">Active Alerts</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.CheckCircle className="w-5 h-5 text-green-500"/>
                <div>
                  <div className="text-2xl font-bold">{mockStats.resolvedAlerts}</div>
                  <div className="text-xs text-muted-foreground">Resolved</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.Shield className="w-5 h-5 text-purple-500"/>
                <div>
                  <div className="text-2xl font-bold">{mockStats.preventedFraud}</div>
                  <div className="text-xs text-muted-foreground">Fraud Prevented</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.Target className="w-5 h-5 text-orange-500"/>
                <div>
                  <div className="text-2xl font-bold">{mockStats.accuracyRate}%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Controls */}
            <card_1.Card>
              <card_1.CardHeader>
                <div className="flex items-center justify-between">
                  <card_1.CardTitle>Fraud Alerts</card_1.CardTitle>
                  <button_1.Button onClick={handleRunScan} disabled={isScanning} className="flex items-center gap-2">
                    {isScanning ? (<lucide_react_1.RefreshCw className="w-4 h-4 animate-spin"/>) : (<lucide_react_1.Zap className="w-4 h-4"/>)}
                    {isScanning ? 'Scanning...' : 'Run Fraud Scan'}
                  </button_1.Button>
                </div>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <input_1.Input placeholder="Search alerts, properties, or owners..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="w-full"/>
                  </div>
                  
                  <select_1.Select value={filterStatus} onValueChange={setFilterStatus}>
                    <select_1.SelectTrigger className="w-full md:w-48">
                      <select_1.SelectValue placeholder="Filter by status"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="all">All Status</select_1.SelectItem>
                      <select_1.SelectItem value="active">Active</select_1.SelectItem>
                      <select_1.SelectItem value="investigating">Investigating</select_1.SelectItem>
                      <select_1.SelectItem value="resolved">Resolved</select_1.SelectItem>
                      <select_1.SelectItem value="false-positive">False Positive</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>

                  <select_1.Select value={filterRisk} onValueChange={setFilterRisk}>
                    <select_1.SelectTrigger className="w-full md:w-48">
                      <select_1.SelectValue placeholder="Filter by risk"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="all">All Risk Levels</select_1.SelectItem>
                      <select_1.SelectItem value="critical">Critical</select_1.SelectItem>
                      <select_1.SelectItem value="high">High</select_1.SelectItem>
                      <select_1.SelectItem value="medium">Medium</select_1.SelectItem>
                      <select_1.SelectItem value="low">Low</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Alerts List */}
            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (<card_1.Card>
                  <card_1.CardContent className="py-12 text-center">
                    <lucide_react_1.Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
                    <h3 className="font-semibold mb-2">No alerts found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterStatus !== 'all' || filterRisk !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No fraud alerts detected. Your system is secure!'}
                    </p>
                  </card_1.CardContent>
                </card_1.Card>) : (filteredAlerts.map(function (alert) {
            var _a;
            return (<card_1.Card key={alert.id} className={"cursor-pointer transition-all hover:shadow-md ".concat((selectedAlert === null || selectedAlert === void 0 ? void 0 : selectedAlert.id) === alert.id ? 'ring-2 ring-primary' : '')} onClick={function () { return setSelectedAlert(alert); }}>
                    <card_1.CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={"p-2 rounded-full ".concat(getRiskColor(alert.riskLevel))}>
                          {getAlertTypeIcon(alert.alertType)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{alert.propertyTitle}</h3>
                              <p className="text-sm text-muted-foreground">
                                Property ID: {alert.propertyId}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <badge_1.Badge className={getRiskColor(alert.riskLevel)}>
                                {alert.riskLevel.toUpperCase()}
                              </badge_1.Badge>
                              <badge_1.Badge className={getStatusColor(alert.status)}>
                                {alert.status}
                              </badge_1.Badge>
                            </div>
                          </div>

                          <p className="text-sm text-gray-700 mb-3">
                            {alert.description}
                          </p>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <lucide_react_1.MapPin className="w-3 h-3"/>
                                {alert.details.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <lucide_react_1.DollarSign className="w-3 h-3"/>
                                KES {(_a = alert.details.price) === null || _a === void 0 ? void 0 : _a.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <lucide_react_1.User className="w-3 h-3"/>
                                {alert.details.ownerName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Confidence: {alert.confidence}%</span>
                              <span className="flex items-center gap-1">
                                <lucide_react_1.Clock className="w-3 h-3"/>
                                {formatTime(alert.detectedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </card_1.CardContent>
                  </card_1.Card>);
        }))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selected Alert Details */}
            {selectedAlert && (<card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Alert Details</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{selectedAlert.propertyTitle}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedAlert.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <badge_1.Badge className={getRiskColor(selectedAlert.riskLevel)}>
                        {selectedAlert.riskLevel}
                      </badge_1.Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-medium">{selectedAlert.confidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Detected:</span>
                      <span>{formatTime(selectedAlert.detectedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner:</span>
                      <span>{selectedAlert.details.ownerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contact:</span>
                      <span>{selectedAlert.details.contactInfo}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button_1.Button size="sm" className="w-full" onClick={function () { return handleUpdateAlertStatus(selectedAlert.id, 'investigating'); }} disabled={selectedAlert.status === 'investigating'}>
                      Start Investigation
                    </button_1.Button>
                    <button_1.Button size="sm" variant="outline" className="w-full" onClick={function () { return handleUpdateAlertStatus(selectedAlert.id, 'resolved'); }} disabled={selectedAlert.status === 'resolved'}>
                      Mark Resolved
                    </button_1.Button>
                    <button_1.Button size="sm" variant="ghost" className="w-full" onClick={function () { return handleUpdateAlertStatus(selectedAlert.id, 'false-positive'); }}>
                      False Positive
                    </button_1.Button>
                  </div>
                </card_1.CardContent>
              </card_1.Card>)}

            {/* Detection Patterns */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Detection Patterns</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-4">
                  {mockPatterns.map(function (pattern) { return (<div key={pattern.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{pattern.name}</h4>
                        <badge_1.Badge variant="outline" className="text-xs">
                          {pattern.successRate}% accuracy
                        </badge_1.Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {pattern.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{pattern.detectionCount} detections</span>
                        <span>{formatTime(pattern.lastDetected)}</span>
                      </div>
                    </div>); })}
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
                  Export Report
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Eye className="w-4 h-4 mr-2"/>
                  View Analytics
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Flag className="w-4 h-4 mr-2"/>
                  Report Fraud
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.RefreshCw className="w-4 h-4 mr-2"/>
                  Update Patterns
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>
    </div>);
}
