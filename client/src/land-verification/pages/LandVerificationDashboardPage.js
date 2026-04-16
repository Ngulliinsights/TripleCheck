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
exports.default = LandVerificationDashboardPage;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var lucide_react_1 = require("lucide-react");
var alert_1 = require("../../local/components/ui/alert");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var skeleton_1 = require("../../local/components/ui/skeleton");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
var components_1 = require("../components");
function LandVerificationDashboardPage() {
    var _this = this;
    var _a;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _b = (0, react_router_dom_1.useSearchParams)(), searchParams = _b[0], setSearchParams = _b[1];
    var toast = (0, use_toast_1.useToast)().toast;
    // --- State Management ---
    var _c = (0, react_1.useState)([]), sessions = _c[0], setSessions = _c[1];
    var _d = (0, react_1.useState)(null), selectedSession = _d[0], setSelectedSession = _d[1];
    var _e = (0, react_1.useState)([]), sessionLayers = _e[0], setSessionLayers = _e[1];
    var _f = (0, react_1.useState)(null), riskAssessment = _f[0], setRiskAssessment = _f[1];
    var _g = (0, react_1.useState)([]), expertAssignments = _g[0], setExpertAssignments = _g[1];
    var _h = (0, react_1.useState)(true), isLoading = _h[0], setIsLoading = _h[1];
    var _j = (0, react_1.useState)(false), isDetailLoading = _j[0], setIsDetailLoading = _j[1];
    var _k = (0, react_1.useState)(null), error = _k[0], setError = _k[1];
    // --- Data Fetching ---
    var loadSessions = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, err_1, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, 4, 5]);
                    setIsLoading(true);
                    setError(null);
                    return [4 /*yield*/, fetch('/api/land-verification/sessions', { credentials: 'include' })];
                case 1:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Failed to load sessions');
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    setSessions(data.data || []);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    msg = err_1 instanceof Error ? err_1.message : 'Failed to connect to server';
                    setError(msg);
                    toast({ variant: 'destructive', title: 'Error', description: msg });
                    return [3 /*break*/, 5];
                case 4:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [toast]);
    var loadSessionDetails = (0, react_1.useCallback)(function (sessionId) { return __awaiter(_this, void 0, void 0, function () {
        var _a, layersRes, expertsRes, riskRes, syncWarning, layersData, expertsData, riskData, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setIsDetailLoading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 12, 13, 14]);
                    return [4 /*yield*/, Promise.allSettled([
                            fetch("/api/land-verification/sessions/".concat(sessionId), { credentials: 'include' }),
                            fetch("/api/land-verification/sessions/".concat(sessionId, "/experts"), { credentials: 'include' }),
                            fetch("/api/land-verification/sessions/".concat(sessionId, "/risk-assessment"), {
                                method: 'POST',
                                credentials: 'include'
                            })
                        ])];
                case 2:
                    _a = _b.sent(), layersRes = _a[0], expertsRes = _a[1], riskRes = _a[2];
                    syncWarning = false;
                    if (!(layersRes.status === 'fulfilled' && layersRes.value.ok)) return [3 /*break*/, 4];
                    return [4 /*yield*/, layersRes.value.json()];
                case 3:
                    layersData = _b.sent();
                    setSessionLayers(layersData.data.verificationLayers || []);
                    return [3 /*break*/, 5];
                case 4:
                    syncWarning = true;
                    _b.label = 5;
                case 5:
                    if (!(expertsRes.status === 'fulfilled' && expertsRes.value.ok)) return [3 /*break*/, 7];
                    return [4 /*yield*/, expertsRes.value.json()];
                case 6:
                    expertsData = _b.sent();
                    setExpertAssignments(expertsData.data || []);
                    return [3 /*break*/, 8];
                case 7:
                    syncWarning = true;
                    _b.label = 8;
                case 8:
                    if (!(riskRes.status === 'fulfilled' && riskRes.value.ok)) return [3 /*break*/, 10];
                    return [4 /*yield*/, riskRes.value.json()];
                case 9:
                    riskData = _b.sent();
                    setRiskAssessment(riskData.data);
                    return [3 /*break*/, 11];
                case 10:
                    setRiskAssessment(null);
                    _b.label = 11;
                case 11:
                    if (syncWarning) {
                        toast({
                            variant: 'destructive',
                            title: 'Sync Warning',
                            description: 'Some session details could not be loaded.'
                        });
                    }
                    return [3 /*break*/, 14];
                case 12:
                    err_2 = _b.sent();
                    toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch session details.' });
                    return [3 /*break*/, 14];
                case 13:
                    setIsDetailLoading(false);
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    }); }, [toast]);
    // --- Lifecycle ---
    (0, react_1.useEffect)(function () {
        loadSessions();
    }, [loadSessions]);
    // Handle URL deep linking (e.g., /dashboard?session=123)
    (0, react_1.useEffect)(function () {
        var sessionId = searchParams.get('session');
        if (sessionId && sessions.length > 0) {
            var session = sessions.find(function (s) { return s.id === sessionId; });
            if (session && session.id !== (selectedSession === null || selectedSession === void 0 ? void 0 : selectedSession.id)) {
                setSelectedSession(session);
                loadSessionDetails(session.id);
            }
        }
    }, [searchParams, sessions, loadSessionDetails, selectedSession === null || selectedSession === void 0 ? void 0 : selectedSession.id]);
    // --- Handlers ---
    var handleSessionSelect = (0, react_1.useCallback)(function (sessionId) {
        setSearchParams({ session: sessionId });
    }, [setSearchParams]);
    var handleBack = (0, react_1.useCallback)(function () {
        setSearchParams({});
        setSelectedSession(null);
        setSessionLayers([]);
        setRiskAssessment(null);
        setExpertAssignments([]);
    }, [setSearchParams]);
    var handleLayerAction = (0, react_1.useCallback)(function (layerId, action) { return __awaiter(_this, void 0, void 0, function () {
        var response, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (action === 'view') {
                        navigate("/land-verification/layers/".concat(layerId));
                        return [2 /*return*/];
                    }
                    if (!selectedSession)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/land-verification/sessions/".concat(selectedSession.id, "/layers"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ layerId: layerId, action: action })
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error("Could not ".concat(action, " layer"));
                    toast({ title: 'Layer Updated', description: "Successfully performed ".concat(action, " action.") });
                    loadSessionDetails(selectedSession.id);
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    toast({ variant: 'destructive', title: 'Action Failed', description: 'Please try again later.' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [selectedSession, navigate, toast, loadSessionDetails]);
    var handleSearchExperts = (0, react_1.useCallback)(function (criteria) { return __awaiter(_this, void 0, void 0, function () {
        var response, data, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('/api/land-verification/experts/search', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(criteria)
                        })];
                case 1:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _b.sent();
                    return [2 /*return*/, data.data || []];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    }); }, []);
    var handleAssignExpert = (0, react_1.useCallback)(function (expertId, layerId) { return __awaiter(_this, void 0, void 0, function () {
        var response, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!selectedSession)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("/api/land-verification/sessions/".concat(selectedSession.id, "/experts"), {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ expertId: expertId, layerId: layerId })
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok)
                        throw new Error('Assignment failed');
                    toast({ title: 'Expert Assigned', description: 'Expert notified successfully.' });
                    loadSessionDetails(selectedSession.id);
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _a.sent();
                    toast({ variant: 'destructive', title: 'Assignment Error', description: 'Failed to assign expert.' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [selectedSession, toast, loadSessionDetails]);
    // --- UI Components ---
    if (error) {
        return (<div className="container mx-auto px-4 py-12 flex flex-col items-center">
        <alert_1.Alert variant="destructive" className="max-w-md">
          <lucide_react_1.AlertTriangle className="h-4 w-4"/>
          <alert_1.AlertTitle>Connection Error</alert_1.AlertTitle>
          <alert_1.AlertDescription>{error}</alert_1.AlertDescription>
        </alert_1.Alert>
        <button_1.Button onClick={loadSessions} className="mt-6">
          <lucide_react_1.RefreshCw className="mr-2 h-4 w-4"/> Retry Loading
        </button_1.Button>
      </div>);
    }
    return (<div className="container mx-auto px-4 py-8 max-w-7xl">
      {!selectedSession ? (<div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Verification Dashboard</h1>
            <button_1.Button onClick={function () { return navigate('/land-verification/new'); }}>
              <lucide_react_1.Plus className="mr-2 h-4 w-4"/> New Verification
            </button_1.Button>
          </div>
          <components_1.LandVerificationDashboard sessions={sessions} 
        // @ts-expect-error - Assuming prop type will be updated in child component
        onSessionSelect={handleSessionSelect} onNewVerification={function () { return navigate('/land-verification/new'); }} loading={isLoading}/>
        </div>) : (<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between border-b pb-6">
            <div className="flex items-center gap-4">
              <button_1.Button variant="ghost" size="icon" onClick={handleBack}>
                <lucide_react_1.ArrowLeft className="h-5 w-5"/>
              </button_1.Button>
              <div>
                <h2 className="text-2xl font-bold">
                  {((_a = selectedSession.property) === null || _a === void 0 ? void 0 : _a.title) || "Session #".concat(selectedSession.id)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Status: <span className="capitalize font-medium text-foreground">{selectedSession.status}</span>
                </p>
              </div>
            </div>
            <button_1.Button variant="outline" size="sm" className="hidden md:flex">
              <lucide_react_1.FileText className="mr-2 h-4 w-4"/> Download Full Report
            </button_1.Button>
          </div>

          <tabs_1.Tabs defaultValue="progress" className="w-full">
            <tabs_1.TabsList className="bg-muted/50 p-1">
              <tabs_1.TabsTrigger value="progress">Layer Progress</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="risk">Risk Assessment</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="experts">Expert Network</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="progress" className="mt-6">
              {isDetailLoading && sessionLayers.length === 0 ? (<div className="space-y-4">
                  <skeleton_1.Skeleton className="h-[150px] w-full"/>
                  <skeleton_1.Skeleton className="h-[300px] w-full"/>
                </div>) : (<components_1.VerificationProgressTracker sessionId={selectedSession.id} 
            // @ts-expect-error - Assuming prop type will be updated in child component
            layers={sessionLayers} onLayerAction={handleLayerAction}/>)}
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="risk" className="mt-6">
              {riskAssessment ? (<components_1.RiskAssessmentDisplay 
            // @ts-expect-error - Assuming prop type will be updated in child component
            assessment={riskAssessment} onRefresh={function () { return loadSessionDetails(selectedSession.id); }} onExportReport={function () { return toast({ title: "Coming Soon", description: "PDF Export is being prepared." }); }} onViewDetails={function (fid) { return navigate("/land-verification/risk-factors/".concat(fid)); }}/>) : (<card_1.Card className="border-dashed">
                  <card_1.CardContent className="py-20 text-center">
                    <div className="space-y-4">
                      <lucide_react_1.RefreshCw className="h-10 w-10 text-muted-foreground mx-auto"/>
                      <h3 className="text-lg font-semibold">No Risk Data</h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        A risk assessment can be generated once initial verification layers are processed.
                      </p>
                      <button_1.Button variant="secondary" onClick={function () { return loadSessionDetails(selectedSession.id); }}>
                        Try Manual Analysis
                      </button_1.Button>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>)}
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="experts" className="mt-6">
              <components_1.ExpertCoordinationInterface sessionId={selectedSession.id} 
        // @ts-expect-error - Assuming prop type will be updated in child component
        assignments={expertAssignments} onSearchExperts={handleSearchExperts} onAssignExpert={handleAssignExpert} onViewExpertDetails={function (eid) { return navigate("/land-verification/experts/".concat(eid)); }}/>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </div>)}
    </div>);
}
