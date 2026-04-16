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
exports.ReportingPortal = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var checkbox_1 = require("../../local/components/ui/checkbox");
var input_1 = require("../../local/components/ui/input");
var label_1 = require("../../local/components/ui/label");
var select_1 = require("../../local/components/ui/select");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
var ReportingPortal = function (_a) {
    var sessionId = _a.sessionId, session = _a.session, onReportGenerated = _a.onReportGenerated;
    var _b = (0, react_1.useState)([]), templates = _b[0], setTemplates = _b[1];
    var _c = (0, react_1.useState)(null), selectedTemplate = _c[0], setSelectedTemplate = _c[1];
    var _d = (0, react_1.useState)(null), executiveSummary = _d[0], setExecutiveSummary = _d[1];
    var _e = (0, react_1.useState)(''), expertReports = _e[0], setExpertReports = _e[1];
    var _f = (0, react_1.useState)([]), generatedReports = _f[0], setGeneratedReports = _f[1];
    var _g = (0, react_1.useState)(false), isGenerating = _g[0], setIsGenerating = _g[1];
    var _h = (0, react_1.useState)(false), isLoadingSummary = _h[0], setIsLoadingSummary = _h[1];
    var _j = (0, react_1.useState)(false), isLoadingExpertReports = _j[0], setIsLoadingExpertReports = _j[1];
    var _k = (0, react_1.useState)({
        templateId: '',
        format: 'pdf',
        includeConfidential: false,
        customSections: [],
        audience: ''
    }), reportConfig = _k[0], setReportConfig = _k[1];
    var toast = (0, use_toast_1.useToast)().toast;
    (0, react_1.useEffect)(function () {
        loadTemplates();
        loadExecutiveSummary();
        loadExpertReports();
    }, [sessionId]);
    var loadTemplates = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/land-verification/report-templates')];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to load report templates');
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setTemplates(data.data.templates || []);
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error loading templates:', error_1);
                    toast({
                        title: 'Error',
                        description: 'Failed to load report templates',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    var loadExecutiveSummary = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoadingSummary(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/land-verification/sessions/".concat(sessionId, "/executive-summary"))];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to load executive summary');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    setExecutiveSummary(data.data.summary);
                    return [3 /*break*/, 6];
                case 4:
                    error_2 = _a.sent();
                    console.error('Error loading executive summary:', error_2);
                    toast({
                        title: 'Error',
                        description: 'Failed to load executive summary',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoadingSummary(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var loadExpertReports = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoadingExpertReports(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/land-verification/sessions/".concat(sessionId, "/expert-reports"))];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to load expert reports');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    setExpertReports(data.data.compiledReport || 'No expert reports available');
                    return [3 /*break*/, 6];
                case 4:
                    error_3 = _a.sent();
                    console.error('Error loading expert reports:', error_3);
                    toast({
                        title: 'Error',
                        description: 'Failed to load expert reports',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setIsLoadingExpertReports(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var generateReport = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, data, newReport_1, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!reportConfig.templateId) {
                        toast({
                            title: 'Error',
                            description: 'Please select a report template',
                            variant: 'destructive'
                        });
                        return [2 /*return*/];
                    }
                    setIsGenerating(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch("/api/land-verification/sessions/".concat(sessionId, "/reports"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(reportConfig)
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error('Failed to generate report');
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    newReport_1 = data.data.report;
                    setGeneratedReports(function (prev) { return __spreadArray([newReport_1], prev, true); });
                    if (onReportGenerated) {
                        onReportGenerated(newReport_1);
                    }
                    toast({
                        title: 'Success',
                        description: 'Report generated successfully',
                        variant: 'default'
                    });
                    return [3 /*break*/, 6];
                case 4:
                    error_4 = _a.sent();
                    console.error('Error generating report:', error_4);
                    toast({
                        title: 'Error',
                        description: 'Failed to generate report',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 6];
                case 5:
                    setIsGenerating(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var downloadReport = function (report) {
        if (report.downloadUrl) {
            window.open(report.downloadUrl, '_blank');
        }
        else {
            // Create blob and download
            var blob = new Blob([report.content], {
                type: report.format === 'pdf' ? 'application/pdf' :
                    report.format === 'html' ? 'text/html' : 'application/json'
            });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = "verification-report-".concat(report.id, ".").concat(report.format);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };
    var previewReport = function (report) {
        if (report.format === 'html') {
            var newWindow = window.open('', '_blank');
            if (newWindow) {
                newWindow.document.write(report.content);
                newWindow.document.close();
            }
        }
        else {
            toast({
                title: 'Info',
                description: 'Preview is only available for HTML reports',
                variant: 'default'
            });
        }
    };
    var handleTemplateSelect = function (templateId) {
        var template = templates.find(function (t) { return t.id === templateId; });
        setSelectedTemplate(template || null);
        setReportConfig(function (prev) { return (__assign(__assign({}, prev), { templateId: templateId, audience: (template === null || template === void 0 ? void 0 : template.audience) || '' })); });
    };
    var handleSectionToggle = function (sectionId, checked) {
        setReportConfig(function (prev) { return (__assign(__assign({}, prev), { customSections: checked
                ? __spreadArray(__spreadArray([], (prev.customSections || []), true), [sectionId], false) : (prev.customSections || []).filter(function (id) { return id !== sectionId; }) })); });
    };
    var getRiskLevelColor = function (level) {
        switch (level) {
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };
    var getAudienceIcon = function (audience) {
        switch (audience) {
            case 'buyer': return <lucide_react_1.Users className="h-4 w-4"/>;
            case 'legal': return <lucide_react_1.Shield className="h-4 w-4"/>;
            case 'executive': return <lucide_react_1.Settings className="h-4 w-4"/>;
            case 'expert': return <lucide_react_1.BookOpen className="h-4 w-4"/>;
            default: return <lucide_react_1.FileText className="h-4 w-4"/>;
        }
    };
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reporting Portal</h2>
          <p className="text-gray-600">Generate comprehensive verification reports and summaries</p>
        </div>
        <div className="flex items-center space-x-2">
          <button_1.Button variant="outline" size="sm" onClick={function () { return window.open('/help/reporting', '_blank'); }}>
            <lucide_react_1.HelpCircle className="h-4 w-4 mr-2"/>
            Help
          </button_1.Button>
        </div>
      </div>

      <tabs_1.Tabs defaultValue="generate" className="space-y-6">
        <tabs_1.TabsList className="grid w-full grid-cols-4">
          <tabs_1.TabsTrigger value="generate">Generate Report</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="summary">Executive Summary</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="experts">Expert Reports</tabs_1.TabsTrigger>
          <tabs_1.TabsTrigger value="history">Report History</tabs_1.TabsTrigger>
        </tabs_1.TabsList>

        {/* Generate Report Tab */}
        <tabs_1.TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Selection */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center">
                  <lucide_react_1.FileText className="h-5 w-5 mr-2"/>
                  Report Templates
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div>
                  <label_1.Label htmlFor="template-select">Select Template</label_1.Label>
                  <select_1.Select value={reportConfig.templateId} onValueChange={handleTemplateSelect}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder="Choose a report template"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {templates.map(function (template) { return (<select_1.SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center space-x-2">
                            {getAudienceIcon(template.audience)}
                            <span>{template.name}</span>
                          </div>
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                {selectedTemplate && (<div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                      <badge_1.Badge variant="outline" className="mt-1">
                        {selectedTemplate.audience}
                      </badge_1.Badge>
                    </div>

                    <div>
                      <label_1.Label>Report Sections</label_1.Label>
                      <div className="space-y-2 mt-2">
                        {selectedTemplate.sections
                .sort(function (a, b) { return a.order - b.order; })
                .map(function (section) { return (<div key={section.id} className="flex items-center space-x-2">
                              <checkbox_1.Checkbox id={section.id} checked={section.required ||
                    (reportConfig.customSections || []).includes(section.id)} disabled={section.required} onCheckedChange={function (checked) {
                    return handleSectionToggle(section.id, checked);
                }}/>
                              <label_1.Label htmlFor={section.id} className={"text-sm ".concat(section.required ? 'font-medium' : '')}>
                                {section.title}
                                {section.required && (<span className="text-red-500 ml-1">*</span>)}
                              </label_1.Label>
                            </div>); })}
                      </div>
                    </div>
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>

            {/* Report Configuration */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center">
                  <lucide_react_1.Settings className="h-5 w-5 mr-2"/>
                  Configuration
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
                <div>
                  <label_1.Label htmlFor="format-select">Output Format</label_1.Label>
                  <select_1.Select value={reportConfig.format} onValueChange={function (value) {
            return setReportConfig(function (prev) { return (__assign(__assign({}, prev), { format: value })); });
        }}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue />
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="pdf">PDF Document</select_1.SelectItem>
                      <select_1.SelectItem value="html">HTML Report</select_1.SelectItem>
                      <select_1.SelectItem value="json">JSON Data</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>

                <div>
                  <label_1.Label htmlFor="audience-input">Target Audience</label_1.Label>
                  <input_1.Input id="audience-input" value={reportConfig.audience} onChange={function (e) {
            return setReportConfig(function (prev) { return (__assign(__assign({}, prev), { audience: e.target.value })); });
        }} placeholder="e.g., Property buyer, Legal team"/>
                </div>

                <div className="flex items-center space-x-2">
                  <checkbox_1.Checkbox id="confidential" checked={reportConfig.includeConfidential} onCheckedChange={function (checked) {
            return setReportConfig(function (prev) { return (__assign(__assign({}, prev), { includeConfidential: checked })); });
        }}/>
                  <label_1.Label htmlFor="confidential" className="text-sm">
                    Include confidential information
                  </label_1.Label>
                </div>

                <button_1.Button onClick={generateReport} disabled={isGenerating || !reportConfig.templateId} className="w-full">
                  {isGenerating ? (<>
                      <lucide_react_1.Clock className="h-4 w-4 mr-2 animate-spin"/>
                      Generating...
                    </>) : (<>
                      <lucide_react_1.FileText className="h-4 w-4 mr-2"/>
                      Generate Report
                    </>)}
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </tabs_1.TabsContent>

        {/* Executive Summary Tab */}
        <tabs_1.TabsContent value="summary" className="space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center">
                <lucide_react_1.Info className="h-5 w-5 mr-2"/>
                Executive Summary
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              {isLoadingSummary ? (<div className="flex items-center justify-center py-8">
                  <lucide_react_1.Clock className="h-6 w-6 animate-spin mr-2"/>
                  Loading executive summary...
                </div>) : executiveSummary ? (<div className="space-y-6">
                  {/* Risk Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={"inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ".concat(getRiskLevelColor(executiveSummary.overallRiskLevel))}>
                        {executiveSummary.overallRiskLevel.toUpperCase()} RISK
                      </div>
                      <p className="text-2xl font-bold mt-2">{executiveSummary.overallRiskScore}/100</p>
                      <p className="text-sm text-gray-600">Risk Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{executiveSummary.verificationCompleteness}%</p>
                      <p className="text-sm text-gray-600">Verification Complete</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{Math.round(executiveSummary.confidenceLevel * 100)}%</p>
                      <p className="text-sm text-gray-600">Confidence Level</p>
                    </div>
                  </div>

                  {/* Key Findings */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Key Findings</h3>
                    <ul className="space-y-2">
                      {executiveSummary.keyFindings.map(function (finding, index) { return (<li key={index} className="flex items-start">
                          <lucide_react_1.CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0"/>
                          <span className="text-sm">{finding}</span>
                        </li>); })}
                    </ul>
                  </div>

                  {/* Critical Issues */}
                  {executiveSummary.criticalIssues.length > 0 && (<div>
                      <h3 className="text-lg font-semibold mb-3">Critical Issues</h3>
                      <ul className="space-y-2">
                        {executiveSummary.criticalIssues.map(function (issue, index) { return (<li key={index} className="flex items-start">
                            <lucide_react_1.AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0"/>
                            <span className="text-sm">{issue}</span>
                          </li>); })}
                      </ul>
                    </div>)}

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {executiveSummary.recommendations.map(function (recommendation, index) { return (<li key={index} className="flex items-start">
                          <lucide_react_1.Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0"/>
                          <span className="text-sm">{recommendation}</span>
                        </li>); })}
                    </ul>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
                    <ul className="space-y-2">
                      {executiveSummary.nextSteps.map(function (step, index) { return (<li key={index} className="flex items-start">
                          <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium mr-2 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-sm">{step}</span>
                        </li>); })}
                    </ul>
                  </div>
                </div>) : (<alert_1.Alert>
                  <lucide_react_1.Info className="h-4 w-4"/>
                  <alert_1.AlertDescription>
                    Executive summary is not available yet. Complete more verification layers to generate a comprehensive summary.
                  </alert_1.AlertDescription>
                </alert_1.Alert>)}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        {/* Expert Reports Tab */}
        <tabs_1.TabsContent value="experts" className="space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center">
                <lucide_react_1.BookOpen className="h-5 w-5 mr-2"/>
                Expert Reports Compilation
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              {isLoadingExpertReports ? (<div className="flex items-center justify-center py-8">
                  <lucide_react_1.Clock className="h-6 w-6 animate-spin mr-2"/>
                  Loading expert reports...
                </div>) : (<div className="space-y-4">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-sm">
                      {expertReports}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-4 border-t">
                    <button_1.Button variant="outline" size="sm" onClick={function () {
                var blob = new Blob([expertReports], { type: 'text/plain' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = "expert-reports-".concat(sessionId, ".txt");
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }}>
                      <lucide_react_1.Download className="h-4 w-4 mr-2"/>
                      Download
                    </button_1.Button>
                    <button_1.Button variant="outline" size="sm" onClick={function () {
                navigator.clipboard.writeText(expertReports);
                toast({
                    title: 'Copied',
                    description: 'Expert reports copied to clipboard',
                    variant: 'default'
                });
            }}>
                      <lucide_react_1.Share2 className="h-4 w-4 mr-2"/>
                      Copy
                    </button_1.Button>
                  </div>
                </div>)}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>

        {/* Report History Tab */}
        <tabs_1.TabsContent value="history" className="space-y-6">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center">
                <lucide_react_1.Clock className="h-5 w-5 mr-2"/>
                Generated Reports
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              {generatedReports.length === 0 ? (<alert_1.Alert>
                  <lucide_react_1.Info className="h-4 w-4"/>
                  <alert_1.AlertDescription>
                    No reports have been generated yet. Use the "Generate Report" tab to create your first report.
                  </alert_1.AlertDescription>
                </alert_1.Alert>) : (<div className="space-y-4">
                  {generatedReports.map(function (report) {
                var _a;
                return (<div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {((_a = templates.find(function (t) { return t.id === report.templateId; })) === null || _a === void 0 ? void 0 : _a.name) || 'Unknown Template'}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Format: {report.format.toUpperCase()}</span>
                            <span>Size: {(report.metadata.fileSize / 1024).toFixed(1)} KB</span>
                            <span>Generated: {new Date(report.metadata.generatedAt).toLocaleDateString()}</span>
                          </div>
                          <badge_1.Badge variant="outline" className="mt-2">
                            {report.metadata.confidentialityLevel}
                          </badge_1.Badge>
                        </div>
                        <div className="flex space-x-2">
                          {report.format === 'html' && (<button_1.Button variant="outline" size="sm" onClick={function () { return previewReport(report); }}>
                              <lucide_react_1.Eye className="h-4 w-4 mr-2"/>
                              Preview
                            </button_1.Button>)}
                          <button_1.Button variant="outline" size="sm" onClick={function () { return downloadReport(report); }}>
                            <lucide_react_1.Download className="h-4 w-4 mr-2"/>
                            Download
                          </button_1.Button>
                        </div>
                      </div>
                    </div>);
            })}
                </div>)}
            </card_1.CardContent>
          </card_1.Card>
        </tabs_1.TabsContent>
      </tabs_1.Tabs>
    </div>);
};
exports.ReportingPortal = ReportingPortal;
