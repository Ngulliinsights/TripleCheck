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
exports.default = ReportsPage;
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var queryClient_1 = require("../../infrastructure/api/queryClient");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var select_1 = require("../../local/components/ui/select");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
var date_utils_1 = require("../../local/utils/date-utils");
function ReportsPage() {
    var _this = this;
    var _a;
    var toast = (0, use_toast_1.useToast)().toast;
    var _b = (0, react_1.useState)("1"), selectedPropertyId = _b[0], setSelectedPropertyId = _b[1];
    var _c = (0, react_1.useState)("verification"), activeTab = _c[0], setActiveTab = _c[1];
    var _d = (0, react_1.useState)(false), generatingReport = _d[0], setGeneratingReport = _d[1];
    var _e = (0, react_1.useState)(0), progress = _e[0], setProgress = _e[1];
    var _f = (0, react_1.useState)(""), reportContent = _f[0], setReportContent = _f[1];
    var reports = [
        {
            id: "verification",
            name: "Verification Report",
            description: "Complete AI-powered verification analysis of property authenticity",
            icon: <lucide_react_1.FileCheck className="h-5 w-5 text-green-500"/>,
            price: 99
        },
        {
            id: "market-analysis",
            name: "Market Analysis Report",
            description: "Comprehensive analysis of property market trends and valuations",
            icon: <lucide_react_1.TrendingUp className="h-5 w-5 text-blue-500"/>,
            price: 149
        },
        {
            id: "risk-assessment",
            name: "Risk Assessment Report",
            description: "In-depth evaluation of property investment risks and opportunities",
            icon: <lucide_react_1.AlertTriangle className="h-5 w-5 text-amber-500"/>,
            price: 199
        }
    ];
    // Report generation mutation
    var verificationReportMutation = (0, react_query_1.useMutation)({
        mutationFn: function (propertyId) { return __awaiter(_this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "/api/properties/".concat(propertyId, "/verification-report"))];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Report generation error:", error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        }); },
        onSuccess: function (data) {
            if (data.success && data.report) {
                setReportContent(data.report);
                toast({
                    title: "Report Generated",
                    description: "Your verification report is ready to view",
                    variant: "default"
                });
            }
            else {
                toast({
                    title: "Report Generation Failed",
                    description: data.message || "Unable to generate report",
                    variant: "destructive"
                });
                // Set a fallback message
                setReportContent("We couldn't generate a complete report for this property. Please try again later or contact support.");
            }
        },
        onError: function (error) {
            console.error("Error generating report:", error);
            toast({
                title: "Report Error",
                description: "There was a problem generating your report",
                variant: "destructive"
            });
            setReportContent("Error: Report generation failed. Our systems encountered an issue while processing your request.");
        },
        onSettled: function () {
            setGeneratingReport(false);
            setProgress(100);
        }
    });
    // Handle generating report
    var handleGenerateReport = function (reportId) { return __awaiter(_this, void 0, void 0, function () {
        var interval, response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setGeneratingReport(true);
                    setProgress(0);
                    setReportContent("");
                    // Set active tab to the selected report
                    setActiveTab(reportId);
                    interval = setInterval(function () {
                        setProgress(function (prev) {
                            if (prev >= 95) {
                                clearInterval(interval);
                                return prev;
                            }
                            return prev + 5;
                        });
                    }, 250);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!(reportId === "verification")) return [3 /*break*/, 3];
                    // Generate verification report using our AI API
                    return [4 /*yield*/, verificationReportMutation.mutateAsync(selectedPropertyId)];
                case 2:
                    // Generate verification report using our AI API
                    _a.sent();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, (0, queryClient_1.apiRequest)('GET', "/api/properties/".concat(selectedPropertyId, "/verification-report?reportType=").concat(reportId))];
                case 4:
                    response = _a.sent();
                    if (response.success && response.report) {
                        setReportContent(response.report);
                        toast({
                            title: "Report Generated",
                            description: "Your ".concat(reportId.replace('-', ' '), " report is ready to view"),
                            variant: "default"
                        });
                    }
                    else {
                        toast({
                            title: "Report Generation Failed",
                            description: response.message || "Unable to generate report",
                            variant: "destructive"
                        });
                        setReportContent("# Error Generating ".concat(reportId.replace('-', ' '), " Report\n\nWe couldn't generate this report at the moment. Please try again later or contact support."));
                    }
                    _a.label = 5;
                case 5:
                    clearInterval(interval);
                    setProgress(100);
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    clearInterval(interval);
                    setProgress(0);
                    setGeneratingReport(false);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Comprehensive Property Reports</h1>
          <p className="text-muted-foreground">
            Get detailed insights and analysis about properties and market trends
          </p>
        </div>
        
        {/* Property Selection */}
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Building className="h-5 w-5"/>
              Select Property
            </card_1.CardTitle>
            <card_1.CardDescription>
              Choose a property to generate reports for
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <select_1.Select value={selectedPropertyId} onValueChange={function (value) { return setSelectedPropertyId(value); }}>
              <select_1.SelectTrigger>
                <select_1.SelectValue placeholder="Select a property"/>
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="1">Modern Apartment in Kilimani</select_1.SelectItem>
                <select_1.SelectItem value="2">Beachfront Villa in Diani</select_1.SelectItem>
                <select_1.SelectItem value="3">Family Home in Karen</select_1.SelectItem>
                <select_1.SelectItem value="4">Commercial Space in Westlands</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </card_1.CardContent>
        </card_1.Card>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map(function (report) { return (<card_1.Card key={report.id} className={activeTab === report.id ? "border-primary" : ""}>
              <card_1.CardHeader className="pb-2">
                <card_1.CardTitle className="text-lg flex items-center gap-2">
                  {report.icon}
                  {report.name}
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">{report.description}</p>
                <div className="mt-2">
                  <p className="text-lg font-bold">KES {report.price}</p>
                </div>
              </card_1.CardContent>
              <card_1.CardFooter>
                <button_1.Button onClick={function () { return handleGenerateReport(report.id); }} disabled={generatingReport} className="w-full" variant={activeTab === report.id ? "default" : "outline"}>
                  {generatingReport && activeTab === report.id ? (<>
                      <lucide_react_1.Search className="mr-2 h-4 w-4 animate-spin"/>
                      Generating...
                    </>) : (<>
                      <lucide_react_1.FileText className="mr-2 h-4 w-4"/>
                      Generate Report
                    </>)}
                </button_1.Button>
              </card_1.CardFooter>
            </card_1.Card>); })}
        </div>
        
        {/* Progress Indicator */}
        {generatingReport && (<div className="space-y-2">
            <progress_1.Progress value={progress}/>
            <p className="text-sm text-center text-muted-foreground">
              {progress < 100 ? "Generating report... ".concat(progress, "%") : "Report ready!"}
            </p>
          </div>)}

        {/* Report View */}
        {reportContent && (<tabs_1.Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <tabs_1.TabsList className="grid grid-cols-3 mb-4">
              <tabs_1.TabsTrigger value="verification">Verification</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="market-analysis">Market Analysis</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="risk-assessment">Risk Assessment</tabs_1.TabsTrigger>
            </tabs_1.TabsList>
            
            <tabs_1.TabsContent value={activeTab}>
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>
                    {((_a = reports.find(function (r) { return r.id === activeTab; })) === null || _a === void 0 ? void 0 : _a.name) || "Report"}
                  </card_1.CardTitle>
                  <card_1.CardDescription>
                    Generated on {(0, date_utils_1.formatDate)(new Date().toISOString())} for Property #{selectedPropertyId}
                  </card_1.CardDescription>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {reportContent}
                    </pre>
                  </div>
                </card_1.CardContent>
                <card_1.CardFooter className="flex justify-between">
                  <button_1.Button variant="outline">
                    <lucide_react_1.Download className="mr-2 h-4 w-4"/>
                    Save as PDF
                  </button_1.Button>
                  <button_1.Button>
                    <lucide_react_1.FileText className="mr-2 h-4 w-4"/>
                    Print Report
                  </button_1.Button>
                </card_1.CardFooter>
              </card_1.Card>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>)}

        {/* Report Features */}
        {!reportContent && (<card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Report Features</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <lucide_react_1.FileCheck className="h-8 w-8 text-green-600"/>
                  <div>
                    <h3 className="font-medium">Authenticity Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      AI-powered verification of property documents and records
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <lucide_react_1.TrendingUp className="h-8 w-8 text-blue-600"/>
                  <div>
                    <h3 className="font-medium">Market Trends Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      View historical price trends and future projections
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <lucide_react_1.AlertTriangle className="h-8 w-8 text-amber-600"/>
                  <div>
                    <h3 className="font-medium">Risk Evaluation</h3>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive risk assessment and investment analysis
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <lucide_react_1.Clock className="h-8 w-8 text-indigo-600"/>
                  <div>
                    <h3 className="font-medium">Historical Records</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete ownership history and transaction timeline
                    </p>
                  </div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>)}
      </div>
    </div>);
}
