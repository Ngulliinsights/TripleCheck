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
exports.default = NewVerificationPage;
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var lucide_react_1 = require("lucide-react");
var alert_1 = require("../../local/components/ui/alert");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var use_toast_1 = require("../../local/hooks/use-toast");
var components_1 = require("../components");
var logger = {
    error: function (message, error) {
        if (process.env.NODE_ENV === "development")
            console.error(message, error);
    },
    info: function (message, data) {
        if (process.env.NODE_ENV === "development")
            console.log(message, data);
    },
};
function NewVerificationPage() {
    var _this = this;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var searchParams = (0, react_router_dom_1.useSearchParams)()[0];
    var propertyId = searchParams.get("propertyId");
    var toast = (0, use_toast_1.useToast)().toast; // <-- Extracted toast function
    // State Management
    var _a = (0, react_1.useState)(null), selectedProperty = _a[0], setSelectedProperty = _a[1];
    var _b = (0, react_1.useState)("wizard"), currentStep = _b[0], setCurrentStep = _b[1];
    var _c = (0, react_1.useState)(null), sessionId = _c[0], setSessionId = _c[1];
    var _d = (0, react_1.useState)(false), isSubmitting = _d[0], setIsSubmitting = _d[1];
    // Property Loading Effect
    (0, react_1.useEffect)(function () {
        if (!propertyId)
            return;
        var loadPropertyData = function () { return __awaiter(_this, void 0, void 0, function () {
            var parsedPropertyId;
            return __generator(this, function (_a) {
                try {
                    parsedPropertyId = Number(propertyId);
                    if (isNaN(parsedPropertyId)) {
                        toast({ variant: "destructive", title: "Error", description: "Invalid property ID provided" });
                        return [2 /*return*/];
                    }
                    // Mock property data - replace with actual API call
                    setSelectedProperty({
                        id: parsedPropertyId,
                        title: "Sample Property in Nairobi",
                        location: "Westlands, Nairobi",
                        price: 15000000,
                        description: "Modern 3-bedroom apartment",
                        imageUrls: [],
                        ownerId: 1,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                catch (error) {
                    logger.error("Failed to load property data:", error);
                    toast({ variant: "destructive", title: "Error", description: "Failed to load property information" });
                }
                return [2 /*return*/];
            });
        }); };
        loadPropertyData();
    }, [propertyId, toast]);
    // Handlers
    var handleWizardComplete = (0, react_1.useCallback)(function (newSessionId) {
        try {
            setSessionId(newSessionId);
            setCurrentStep("confirmation");
        }
        catch (error) {
            logger.error("Error completing wizard:", error);
            toast({ variant: "destructive", title: "Error", description: "An error occurred while processing your request" });
        }
    }, [toast, setSessionId, setCurrentStep]);
    var handleWizardCancel = (0, react_1.useCallback)(function () {
        navigate("/land-verification");
    }, [navigate]);
    var handleFinalSubmit = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (!sessionId) {
                toast({ variant: "destructive", title: "Error", description: "No active verification session found." });
                return [2 /*return*/];
            }
            setIsSubmitting(true);
            try {
                // The wizard already created the session, just navigate to it
                toast({ title: "Success", description: "Verification session created successfully" });
                navigate("/land-verification/sessions/".concat(sessionId));
            }
            catch (error) {
                logger.error("Error creating verification session:", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to create verification session" });
            }
            finally {
                setIsSubmitting(false);
            }
            return [2 /*return*/];
        });
    }); };
    // Renderers
    var renderStepContent = function () {
        switch (currentStep) {
            case "wizard":
                return (<components_1.VerificationWizard propertyId={propertyId || ''} userId="current-user" // This should come from auth context
                 onComplete={handleWizardComplete} onCancel={handleWizardCancel}/>);
            case "community":
                return (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Community Interview Setup</h2>
                <p className="text-muted-foreground">Configure interview templates for community intelligence gathering</p>
              </div>
              <div className="flex gap-2">
                <button_1.Button variant="outline" onClick={function () { return setCurrentStep("wizard"); }}>
                  <lucide_react_1.ArrowLeft className="h-4 w-4 mr-2"/>
                  Back to Wizard
                </button_1.Button>
                <button_1.Button onClick={function () { return setCurrentStep("confirmation"); }}>Continue to Review</button_1.Button>
              </div>
            </div>

            <components_1.CommunityInterviewTemplate sessionId={sessionId || ""} location={(selectedProperty === null || selectedProperty === void 0 ? void 0 : selectedProperty.location) || ""} propertyType="residential" onTemplateComplete={function (responses) {
                        toast({ title: "Success", description: "Community interview template completed" });
                        setCurrentStep("confirmation");
                    }}/>
          </div>);
            case "confirmation":
                return (<div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Review &amp; Confirm</h2>
                <p className="text-muted-foreground">Review your verification request before submitting</p>
              </div>
              <div className="flex gap-2">
                <button_1.Button variant="outline" onClick={function () { return setCurrentStep("wizard"); }}>
                  <lucide_react_1.ArrowLeft className="h-4 w-4 mr-2"/>
                  Back to Wizard
                </button_1.Button>
                <button_1.Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Creating Session..." : "Create Verification Session"}
                </button_1.Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle>Property Details</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    {selectedProperty ? (<div className="space-y-2">
                        <h4 className="font-medium">{selectedProperty.title}</h4>
                        <p className="text-sm text-muted-foreground">{selectedProperty.location}</p>
                        <p className="text-sm">KES {selectedProperty.price.toLocaleString()}</p>
                      </div>) : (<p className="text-muted-foreground">No property selected</p>)}
                  </card_1.CardContent>
                </card_1.Card>

                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle>Session Details</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    {sessionId ? (<div className="space-y-4">
                        <div>
                          <h5 className="font-medium mb-2">Tracking ID</h5>
                          <p className="text-sm text-muted-foreground font-mono bg-muted inline-block px-2 py-1 rounded">
                            {sessionId}
                          </p>
                        </div>
                      </div>) : (<p className="text-muted-foreground">No verification configuration generated</p>)}
                  </card_1.CardContent>
                </card_1.Card>
              </div>

              <div className="space-y-6">
                <alert_1.Alert>
                  <lucide_react_1.Info className="h-4 w-4"/>
                  <alert_1.AlertDescription>
                    Once submitted, your verification session will begin processing. You'll receive updates as each
                    verification layer completes.
                  </alert_1.AlertDescription>
                </alert_1.Alert>

                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-base">What Happens Next?</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent className="space-y-3">
                    {[
                        { title: "Session Created", desc: "Your verification session will be initialized" },
                        { title: "Verification Begins", desc: "Selected verification layers will start processing" },
                        { title: "Progress Updates", desc: "You'll receive notifications as work completes" },
                        { title: "Final Report", desc: "Comprehensive verification report delivered" },
                    ].map(function (step, idx) { return (<div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary">{idx + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{step.title}</p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>); })}
                  </card_1.CardContent>
                </card_1.Card>
              </div>
            </div>
          </div>);
            default:
                return null;
        }
    };
    return <div className="container mx-auto px-4 py-8">{renderStepContent()}</div>;
}
