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
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
var use_toast_1 = require("../hooks/use-toast");
var useDebounce_1 = require("../hooks/useDebounce");
var AccordionSection = (0, react_1.memo)(function (_a) {
    var title = _a.title, children = _a.children, isOpen = _a.isOpen, onToggle = _a.onToggle, icon = _a.icon, _b = _a.priority, priority = _b === void 0 ? "medium" : _b;
    var priorityColors = {
        high: "bg-red-50 border-red-200 hover:bg-red-100",
        medium: "bg-blue-50 border-blue-200 hover:bg-blue-100",
        low: "bg-slate-50 border-slate-200 hover:bg-slate-100",
    };
    return (<div className={"border rounded-lg ".concat(priorityColors[priority])}>
        <h2 className="m-0">
          <button type="button" onClick={onToggle} className={"w-full flex justify-between items-center p-4 text-left font-semibold text-slate-800 transition-colors ".concat(priorityColors[priority])} aria-expanded={isOpen}>
            <span className="flex items-center gap-2">
              {icon}
              {title}
            </span>
            <span className="text-lg font-mono">{isOpen ? "−" : "+"}</span>
          </button>
        </h2>
        {isOpen && (<div className="p-6 space-y-6 text-slate-700 bg-white">
            {children}
          </div>)}
      </div>);
});
AccordionSection.displayName = "AccordionSection";
// Community Tab Component
var CommunityTab = (0, react_1.memo)(function () {
    var _a = (0, react_1.useState)("all"), selectedCategory = _a[0], setSelectedCategory = _a[1];
    var _b = (0, react_1.useState)(""), searchTerm = _b[0], setSearchTerm = _b[1];
    var toast = (0, use_toast_1.useToast)().toast;
    var queryClient = (0, react_query_1.useQueryClient)();
    var debouncedSearchTerm = (0, useDebounce_1.useDebounce)(searchTerm, 300);
    var experiencesData = (0, react_query_1.useQuery)({
        queryKey: ["community-experiences", selectedCategory, debouncedSearchTerm],
        queryFn: function () { return __awaiter(void 0, void 0, void 0, function () {
            var params, response, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams({
                            category: selectedCategory,
                            limit: "10",
                            offset: "0",
                            sortBy: "recent",
                        });
                        if (debouncedSearchTerm) {
                            params.append("search", debouncedSearchTerm);
                        }
                        return [4 /*yield*/, fetch("/api/community/experiences?".concat(params))];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch community experiences");
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        }); },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    }).data;
    var categoriesData = (0, react_query_1.useQuery)({
        queryKey: ["community-categories"],
        queryFn: function () { return __awaiter(void 0, void 0, void 0, function () {
            var response, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/community/categories")];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Failed to fetch categories");
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                }
            });
        }); },
        staleTime: 10 * 60 * 1000,
    }).data;
    var shareExperienceMutation = (0, react_query_1.useMutation)({
        mutationFn: function (data) { return __awaiter(void 0, void 0, void 0, function () {
            var response, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("/api/community/experiences", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            credentials: "include",
                            body: JSON.stringify(data),
                        })];
                    case 1:
                        response = _a.sent();
                        if (!!response.ok) return [3 /*break*/, 3];
                        return [4 /*yield*/, response.json()];
                    case 2:
                        error = _a.sent();
                        throw new Error(error.message || "Failed to share experience");
                    case 3: return [2 /*return*/, response.json()];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Experience Shared",
                description: "Thank you for sharing your experience. It will help others stay safe.",
            });
            queryClient.invalidateQueries({ queryKey: ["community-experiences"] });
            queryClient.invalidateQueries({ queryKey: ["community-categories"] });
        },
        onError: function (error) {
            toast({
                title: "Error",
                description: error.message || "Failed to share your experience. Please try again.",
                variant: "destructive",
            });
        },
    });
    var experiences = (0, react_1.useMemo)(function () { return (experiencesData === null || experiencesData === void 0 ? void 0 : experiencesData.experiences) || []; }, [experiencesData]);
    var categories = (0, react_1.useMemo)(function () { return categoriesData || []; }, [categoriesData]);
    var ExperienceCard = function (_a) {
        var experience = _a.experience;
        return (<card_1.Card className="bg-white/80 backdrop-blur-sm border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group mb-6">
      <card_1.CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-semibold text-slate-900 group-hover:text-primary transition-colors duration-200">
                {experience.title}
              </h3>
              <div className={"w-8 h-8 rounded-full flex items-center justify-center ".concat(experience.resolved ?
                "bg-green-100 text-green-600"
                : "bg-red-100 text-red-600")}>
                {experience.resolved ?
                <lucide_react_1.CheckCircle className="w-4 h-4"/>
                : <lucide_react_1.XCircle className="w-4 h-4"/>}
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500 mb-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.MapPin className="w-4 h-4"/>
                <span className="font-medium">{experience.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <lucide_react_1.Calendar className="w-4 h-4"/>
                <span>{experience.datePosted}</span>
              </div>
              <div className="flex items-center gap-2">
                <lucide_react_1.User className="w-4 h-4"/>
                <span>{experience.author}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {experience.amount}
            </div>
            <div className={"inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ".concat(experience.resolved ?
                "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200")}>
              {experience.resolved ? "Resolved" : "Unresolved"}
            </div>
          </div>
        </div>

        <p className="text-slate-700 mb-6 leading-relaxed">
          {experience.preview}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {experience.tags.map(function (tag) { return (<span key={tag} className="bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium border border-primary/20">
              #{tag}
            </span>); })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2 hover:text-slate-700 transition-colors">
              <lucide_react_1.Eye className="w-4 h-4"/>
              <span className="font-medium">{experience.views}</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-700 transition-colors">
              <lucide_react_1.ThumbsUp className="w-4 h-4"/>
              <span className="font-medium">{experience.likes}</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-700 transition-colors">
              <lucide_react_1.MessageSquare className="w-4 h-4"/>
              <span className="font-medium">{experience.comments}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button_1.Button variant="ghost" size="sm" className="text-slate-500 hover:text-primary">
              <lucide_react_1.Share2 className="w-4 h-4 mr-1"/>
              Share
            </button_1.Button>
            <button_1.Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-600">
              <lucide_react_1.Flag className="w-4 h-4 mr-1"/>
              Report
            </button_1.Button>
          </div>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
    };
    return (<div className="space-y-8">
      {/* Enhanced Stats with TripleCheck styling */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <card_1.Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">234</div>
                <div className="text-blue-100 font-medium">Stories Shared</div>
              </div>
              <lucide_react_1.MessageSquare className="w-8 h-8 text-blue-200 group-hover:scale-110 transition-transform duration-300"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card className="bg-gradient-to-br from-green-600 to-green-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">89</div>
                <div className="text-green-100 font-medium">Cases Resolved</div>
              </div>
              <lucide_react_1.CheckCircle className="w-8 h-8 text-green-200 group-hover:scale-110 transition-transform duration-300"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card className="bg-gradient-to-br from-red-600 to-red-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">KES 45M+</div>
                <div className="text-red-100 font-medium">
                  Total Reported Losses
                </div>
              </div>
              <lucide_react_1.AlertTriangle className="w-8 h-8 text-red-200 group-hover:scale-110 transition-transform duration-300"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group">
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold mb-1">12</div>
                <div className="text-purple-100 font-medium">
                  Countries Covered
                </div>
              </div>
              <lucide_react_1.Globe className="w-8 h-8 text-purple-200 group-hover:scale-110 transition-transform duration-300"/>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Enhanced Sidebar */}
        <div className="lg:w-1/4">
          <card_1.Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg mb-6">
            <card_1.CardHeader className="pb-4">
              <card_1.CardTitle className="text-lg text-slate-900 flex items-center gap-2">
                <lucide_react_1.Search className="w-5 h-5 text-primary"/>
                Search & Filter
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400"/>
                <input type="text" placeholder="Search stories..." aria-label="Search stories" className="w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 bg-white/50" value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }}/>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <lucide_react_1.Filter className="w-4 h-4"/>
                  Categories
                </h4>
                <div className="space-y-1">
                  {categories.map(function (category) { return (<button key={category.id} type="button" onClick={function () { return setSelectedCategory(category.id); }} className={"w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200 ".concat(selectedCategory === category.id ?
                "bg-primary text-white shadow-md"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900")}>
                      <span className="font-medium">{category.name}</span>
                      <span className={"text-xs px-2 py-1 rounded-full ".concat(selectedCategory === category.id ?
                "bg-white/20 text-white"
                : "bg-slate-200 text-slate-600")}>
                        {category.count}
                      </span>
                    </button>); })}
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
            <card_1.CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <lucide_react_1.Shield className="h-5 w-5 text-amber-600"/>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-800 mb-2">
                    Safety Reminder
                  </h4>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Always verify property documents, use licensed
                    professionals, and never make large payments without proper
                    verification.
                  </p>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Main Content */}
        <div className="lg:w-3/4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Community Stories
            </h2>
            <div className="flex items-center gap-2">
              <lucide_react_1.Filter className="w-4 h-4 text-gray-400"/>
              <select aria-label="Sort stories by" title="Sort stories by" className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Most Recent</option>
                <option>Most Liked</option>
                <option>Most Commented</option>
                <option>Highest Amount</option>
              </select>
            </div>
          </div>

          <div>
            {experiences.map(function (experience) { return (<ExperienceCard key={experience.id} experience={experience}/>); })}
          </div>

          <div className="text-center mt-8 space-y-4">
            <button type="button" className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Load More Stories
            </button>

            {/* Enhanced Strategic CTA to full community page */}
            <card_1.Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-xl mt-8">
              <card_1.CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <lucide_react_1.MessageSquare className="w-8 h-8 text-white"/>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  Ready to Share Your Experience?
                </h3>
                <p className="text-slate-600 mb-6 max-w-2xl mx-auto leading-relaxed">
                  Join our full community platform to share detailed
                  experiences, connect with others, and access advanced features
                  including expert consultations and personalized fraud
                  prevention guidance.
                </p>
                <react_router_dom_1.Link to="/community" className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  <lucide_react_1.MessageSquare className="w-5 h-5"/>
                  Access Full Community Platform
                </react_router_dom_1.Link>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>
    </div>);
});
CommunityTab.displayName = "CommunityTab";
// Fraud Resources Tab Component
var FraudResourcesTab = (0, react_1.memo)(function () {
    var _a = (0, react_1.useState)(new Set(["emergency"])), openSections = _a[0], setOpenSections = _a[1];
    var toggleSection = (0, react_1.useCallback)(function (section) {
        setOpenSections(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(section)) {
                newSet.delete(section);
            }
            else {
                newSet.add(section);
            }
            return newSet;
        });
    }, []);
    var EmergencySection = function () { return (<div className="space-y-6">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex items-center gap-2 mb-2">
          <lucide_react_1.AlertTriangle className="h-5 w-5 text-red-500"/>
          <h3 className="font-semibold text-red-800">
            Critical: Act Within 48 Hours
          </h3>
        </div>
        <p className="text-red-700 text-sm">
          Time is your most valuable asset in fraud recovery. Quick action
          dramatically increases your chances of asset recovery and successful
          prosecution.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">
            Immediate Actions (First 24 Hours)
          </h4>
          <div className="space-y-3">
            {[
            "Stop all payments immediately. Do not transfer any more money, regardless of pressure or threats from the fraudster.",
            "Document everything comprehensively. Photograph all documents, save all messages, emails, and call logs. Create a chronological timeline of events.",
            "Report to DCI Land Fraud Unit. This should be your first official report. Get an OB number and case reference.",
        ].map(function (action, index) { return (<div key={index} className="flex items-start gap-3">
                <div className="bg-red-100 text-red-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <strong>{action.split(".")[0]}.</strong>{" "}
                  {action.split(".").slice(1).join(".")}
                </div>
              </div>); })}
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-lg">
            Protective Measures (24-48 Hours)
          </h4>
          <div className="space-y-3">
            {[
            "Secure the property legally. Visit the Land Registry to place a caution or restriction on the title. Engage a lawyer to lodge a caveat.",
            "Protect your finances. Contact your bank to flag potentially fraudulent transactions and monitor all accounts.",
            "Begin parallel reporting. File reports with EACC, Ministry of Lands, and other relevant agencies simultaneously.",
        ].map(function (action, index) { return (<div key={index} className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                  {index + 4}
                </div>
                <div>
                  <strong>{action.split(".")[0]}.</strong>{" "}
                  {action.split(".").slice(1).join(".")}
                </div>
              </div>); })}
          </div>
        </div>
      </div>
    </div>); };
    var ReportingChannelsSection = function () { return (<div className="space-y-6">
      <div className="bg-green-50 border border-green-200 p-4 rounded">
        <h4 className="font-semibold text-green-800 mb-2">
          Multi-Channel Strategy
        </h4>
        <p className="text-green-700 text-sm">
          The most successful fraud victims report to 2-3 agencies
          simultaneously. This creates pressure from multiple angles and
          increases the likelihood of asset recovery and prosecution.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold px-3 py-1 rounded bg-green-100 text-green-800">
          TIER 1: MOST EFFECTIVE
        </h4>
        <div className="grid gap-4">
          {[
            {
                name: "DCI Land Fraud Unit",
                rating: 5,
                why: "Specialized investigators with prosecutorial powers and asset freezing capabilities",
                contact: "020-7202000, 0800 722 203 (FICHUA)",
                website: "dci.go.ke",
                bestFor: "All types of land and real estate fraud, especially complex schemes",
            },
            {
                name: "Ethics & Anti-Corruption Commission (EACC)",
                rating: 5,
                why: "Handles corruption involving public officials and fraudulent title processing",
                website: "eacc.go.ke/default/report-corruption",
                bestFor: "Cases involving corrupt government officials, land registry fraud",
            },
        ].map(function (agency, index) { return (<div key={index} className="border border-slate-200 rounded p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h5 className="font-semibold text-lg">{agency.name}</h5>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(function (star) { return (<lucide_react_1.Star key={star} className={"h-4 w-4 ".concat(star <= agency.rating ? "text-yellow-500 fill-current" : "text-gray-300")}/>); })}
                </div>
              </div>
              <p className="text-sm text-slate-600">{agency.why}</p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {agency.contact && (<div className="flex items-center gap-2">
                    <lucide_react_1.Phone className="h-4 w-4 text-slate-500"/>
                    <span>{agency.contact}</span>
                  </div>)}
                {agency.website && (<div className="flex items-center gap-2">
                    <lucide_react_1.Globe className="h-4 w-4 text-slate-500"/>
                    <a href={"https://".concat(agency.website)} className="text-blue-600 hover:underline">
                      {agency.website}
                    </a>
                  </div>)}
              </div>
              {agency.bestFor && (<div className="bg-slate-50 p-2 rounded text-sm">
                  <strong>Best for:</strong> {agency.bestFor}
                </div>)}
            </div>); })}
        </div>
      </div>
    </div>); };
    return (<div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">
          Comprehensive Fraud Response Guide
        </h4>
        <p className="text-blue-700 text-sm">
          This guide provides step-by-step instructions for responding to real
          estate fraud in Kenya. Each section builds upon the previous one,
          creating a comprehensive response strategy.
        </p>
      </div>

      <div className="space-y-4">
        <AccordionSection title="Emergency Actions (First 48 Hours)" isOpen={openSections.has("emergency")} onToggle={function () { return toggleSection("emergency"); }} icon={<lucide_react_1.AlertTriangle className="h-5 w-5 text-red-500"/>} priority="high">
          <EmergencySection />
        </AccordionSection>

        <AccordionSection title="Reporting Channels & Agencies" isOpen={openSections.has("channels")} onToggle={function () { return toggleSection("channels"); }} icon={<lucide_react_1.Phone className="h-5 w-5 text-blue-500"/>} priority="high">
          <ReportingChannelsSection />
        </AccordionSection>

        <AccordionSection title="Prevention & Red Flags" isOpen={openSections.has("prevention")} onToggle={function () { return toggleSection("prevention"); }} icon={<lucide_react_1.Shield className="h-5 w-5 text-green-500"/>} priority="medium">
          <div className="space-y-4">
            <p className="text-slate-600">
              Understanding fraud patterns helps you recognize red flags early.
              Most real estate fraud succeeds because it exploits normal human
              emotions like excitement, urgency, and trust.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
            "Pressure for immediate payment",
            "Unusually low prices for prime locations",
            "Cash-only transaction requirements",
            "Reluctance to allow independent verification",
            "Missing or suspicious documentation",
            "Promises of unrealistic returns",
        ].map(function (flag, index) { return (<div key={index} className="flex items-center gap-2">
                  <lucide_react_1.XCircle className="h-4 w-4 text-red-500"/>
                  <span className="text-sm">{flag}</span>
                </div>); })}
            </div>
          </div>
        </AccordionSection>

        <AccordionSection title="Contact Directory" isOpen={openSections.has("directory")} onToggle={function () { return toggleSection("directory"); }} icon={<lucide_react_1.Globe className="h-5 w-5 text-slate-500"/>} priority="low">
          <div className="space-y-4">
            <p className="text-slate-600">
              This directory provides direct contact information for all key
              agencies. Save these contacts to your phone for quick access
              during an emergency.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-sm border-collapse border border-slate-300">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-3 text-left border border-slate-300 font-semibold">
                      Entity
                    </th>
                    <th className="p-3 text-left border border-slate-300 font-semibold">
                      Role
                    </th>
                    <th className="p-3 text-left border border-slate-300 font-semibold">
                      Contact Information
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[
            {
                name: "DCI – Land Fraud Unit",
                role: "Investigates complex land scams & fake titles",
                phone: "020-7202000, 020-3343312",
                tollfree: "0800 722 203 (FICHUA)",
                website: "dci.go.ke",
            },
            {
                name: "Ministry of Lands & Physical Planning",
                role: "Registers & flags fraudulent transactions",
                website: "ardhisasa.lands.go.ke",
            },
        ].map(function (agency, index) { return (<tr key={index} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-3 border border-slate-300 font-medium">
                        {agency.name}
                      </td>
                      <td className="p-3 border border-slate-300">
                        {agency.role}
                      </td>
                      <td className="p-3 border border-slate-300 space-y-1">
                        {agency.phone && (<div className="flex items-center gap-1">
                            <lucide_react_1.Phone className="h-3 w-3"/>
                            <span>{agency.phone}</span>
                          </div>)}
                        {agency.tollfree && (<div className="flex items-center gap-1">
                            <lucide_react_1.Phone className="h-3 w-3 text-green-600"/>
                            <span className="text-green-600 font-medium">
                              {agency.tollfree}
                            </span>
                          </div>)}
                        {agency.website && (<div className="flex items-center gap-1">
                            <lucide_react_1.Globe className="h-3 w-3"/>
                            <a href={"https://".concat(agency.website)} className="text-blue-600 hover:underline">
                              {agency.website}
                            </a>
                          </div>)}
                      </td>
                    </tr>); })}
                </tbody>
              </table>
            </div>
          </div>
        </AccordionSection>
      </div>

      {/* Enhanced Strategic CTA to comprehensive fraud guide */}
      <card_1.Card className="bg-gradient-to-br from-red-50 via-orange-50 to-red-50 border-red-200 shadow-xl mt-8">
        <card_1.CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <lucide_react_1.AlertTriangle className="w-8 h-8 text-white"/>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Need Immediate Help? Access Our Complete Fraud Response Guide
              </h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                If you&apos;re currently dealing with fraud, access our
                comprehensive 48-hour emergency response guide with detailed
                procedures, complete agency contacts, and step-by-step recovery
                instructions developed by legal experts and fraud investigators.
              </p>
              <react_router_dom_1.Link to="/fraud-guide" className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-xl hover:from-red-700 hover:to-orange-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <lucide_react_1.Shield className="w-5 h-5"/>
                Access Complete Emergency Guide
              </react_router_dom_1.Link>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
});
FraudResourcesTab.displayName = "FraudResourcesTab";
// Main Component
var CommunityAndResources = (0, react_1.memo)(function () {
    var _a = (0, react_1.useState)("community"), activeTab = _a[0], setActiveTab = _a[1];
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-12">
        {/* Persona-Driven Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <lucide_react_1.Shield className="w-6 h-6 text-white"/>
            </div>
            <div className="text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">
                Community & Resources Hub
              </h1>
              <p className="text-primary font-medium">Powered by TripleCheck</p>
            </div>
          </div>

          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Whether you&apos;re dealing with fraud right now, researching before
            investing, or want to help others - we have the right resources for
            your situation.
          </p>

          {/* Persona-Based Quick Access Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 max-w-6xl mx-auto">
            <card_1.Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <card_1.CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <lucide_react_1.AlertTriangle className="w-6 h-6 text-white"/>
                </div>
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  I&apos;m Being Scammed
                </h3>
                <p className="text-red-700 text-sm">
                  Get immediate help and emergency contacts
                </p>
                <div className="mt-3 text-xs text-red-600 font-medium">
                  ⚡ URGENT - Act within 48 hours
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <card_1.CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <lucide_react_1.Shield className="w-6 h-6 text-white"/>
                </div>
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  I&apos;m Researching
                </h3>
                <p className="text-blue-700 text-sm">
                  Prevention guides and red flag checklists
                </p>
                <div className="mt-3 text-xs text-blue-600 font-medium">
                  📋 Smart due diligence
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <card_1.CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <lucide_react_1.MessageSquare className="w-6 h-6 text-white"/>
                </div>
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  I Want to Help
                </h3>
                <p className="text-green-700 text-sm">
                  Share experiences and support others
                </p>
                <div className="mt-3 text-xs text-green-600 font-medium">
                  🤝 Build community
                </div>
              </card_1.CardContent>
            </card_1.Card>

            <card_1.Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:shadow-xl transition-all duration-300 group cursor-pointer">
              <card_1.CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <lucide_react_1.Users className="w-6 h-6 text-white"/>
                </div>
                <h3 className="text-lg font-bold text-purple-900 mb-2">
                  I&apos;m a Professional
                </h3>
                <p className="text-purple-700 text-sm">
                  Connect with clients and share expertise
                </p>
                <div className="mt-3 text-xs text-purple-600 font-medium">
                  ⚖️ Expert network
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>

        {/* Persona-Driven Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-6xl mx-auto">
          <react_router_dom_1.Link to="/fraud-guide" className="group">
            <card_1.Card className="bg-gradient-to-br from-red-50 to-red-100/50 border-red-200 hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
              <card_1.CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <lucide_react_1.AlertTriangle className="w-6 h-6 text-white"/>
                </div>
                <h3 className="text-lg font-bold text-red-900 mb-2">
                  Emergency Help
                </h3>
                <p className="text-red-700 text-sm mb-3">
                  48-hour fraud response guide
                </p>
                <div className="text-xs text-red-600 font-medium bg-red-100 px-2 py-1 rounded-full">
                  ⚡ URGENT
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </react_router_dom_1.Link>

          <card_1.Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group" onClick={function () { return setActiveTab("resources"); }}>
            <card_1.CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <lucide_react_1.Shield className="w-6 h-6 text-white"/>
              </div>
              <h3 className="text-lg font-bold text-blue-900 mb-2">
                Prevention Guide
              </h3>
              <p className="text-blue-700 text-sm mb-3">
                Red flags & due diligence
              </p>
              <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
                📋 Research
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <react_router_dom_1.Link to="/community" className="group">
            <card_1.Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:shadow-xl transition-all duration-300 cursor-pointer h-full">
              <card_1.CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                  <lucide_react_1.MessageSquare className="w-6 h-6 text-white"/>
                </div>
                <h3 className="text-lg font-bold text-green-900 mb-2">
                  Share & Connect
                </h3>
                <p className="text-green-700 text-sm mb-3">
                  Full community platform
                </p>
                <div className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                  🤝 Community
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </react_router_dom_1.Link>

          <card_1.Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200 hover:shadow-xl transition-all duration-300 cursor-pointer h-full group" onClick={function () { return setActiveTab("community"); }}>
            <card_1.CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                <lucide_react_1.Users className="w-6 h-6 text-white"/>
              </div>
              <h3 className="text-lg font-bold text-purple-900 mb-2">
                Expert Network
              </h3>
              <p className="text-purple-700 text-sm mb-3">
                Connect with professionals
              </p>
              <div className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded-full">
                ⚖️ Experts
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Enhanced Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-slate-200">
            <div className="flex space-x-1">
              <button type="button" onClick={function () { return setActiveTab("community"); }} className={"px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ".concat(activeTab === "community" ?
            "bg-primary text-white shadow-md transform scale-105"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")}>
                <lucide_react_1.MessageSquare className="w-4 h-4"/>
                Community Stories
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  234
                </span>
              </button>
              <button type="button" onClick={function () { return setActiveTab("resources"); }} className={"px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ".concat(activeTab === "resources" ?
            "bg-primary text-white shadow-md transform scale-105"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")}>
                <lucide_react_1.Shield className="w-4 h-4"/>
                Fraud Resources
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  Emergency
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto">
          {activeTab === "community" && <CommunityTab />}
          {activeTab === "resources" && <FraudResourcesTab />}
        </div>
      </div>
    </div>);
});
CommunityAndResources.displayName = "CommunityAndResources";
exports.default = CommunityAndResources;
