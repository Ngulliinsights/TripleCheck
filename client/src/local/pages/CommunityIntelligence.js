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
exports.default = CommunityIntelligence;
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
var mockReports = [
    {
        id: 'rep-1',
        propertyId: 'prop-123',
        propertyAddress: '123 Westlands Road, Nairobi',
        reportType: 'warning',
        title: 'Flooding issues during rainy season',
        content: 'This area experiences significant flooding during heavy rains. The drainage system is inadequate and water can reach up to 2 feet in some areas. Consider this if buying property here.',
        author: {
            id: 'user-1',
            name: 'Mary Wanjiku',
            trustScore: 87,
            verifiedResident: true
        },
        location: 'Westlands, Nairobi',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        upvotes: 23,
        downvotes: 2,
        replies: 8,
        views: 156,
        tags: ['flooding', 'drainage', 'weather'],
        verified: true,
        helpful: true
    },
    {
        id: 'rep-2',
        propertyId: 'prop-456',
        propertyAddress: '456 Karen Close, Nairobi',
        reportType: 'review',
        title: 'Excellent neighborhood for families',
        content: 'Great area with good schools nearby, safe streets, and friendly neighbors. The Karen Hospital is just 5 minutes away. Property values have been stable and appreciating slowly.',
        author: {
            id: 'user-2',
            name: 'John Mwangi',
            trustScore: 92,
            verifiedResident: true
        },
        location: 'Karen, Nairobi',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        upvotes: 45,
        downvotes: 1,
        replies: 12,
        views: 234,
        tags: ['family-friendly', 'schools', 'safety', 'healthcare'],
        verified: true,
        helpful: true
    },
    {
        id: 'rep-3',
        propertyId: 'prop-789',
        propertyAddress: '789 Kilimani Street, Nairobi',
        reportType: 'question',
        title: 'Anyone know about the new development plans?',
        content: 'I heard there are plans for a new shopping mall in this area. Does anyone have more information about this? Will it affect property values?',
        author: {
            id: 'user-3',
            name: 'Grace Muthoni',
            trustScore: 76,
            verifiedResident: false
        },
        location: 'Kilimani, Nairobi',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        upvotes: 8,
        downvotes: 0,
        replies: 5,
        views: 67,
        tags: ['development', 'shopping', 'property-value'],
        verified: false,
        helpful: false
    }
];
var mockInsights = [
    {
        id: 'ins-1',
        type: 'alert',
        title: 'Increased fraud reports in Westlands area',
        description: 'Multiple community members have reported suspicious property listings and fake documents in the Westlands area. Exercise extra caution.',
        location: 'Westlands, Nairobi',
        confidence: 89,
        reportCount: 12,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 6),
        severity: 'high'
    },
    {
        id: 'ins-2',
        type: 'trend',
        title: 'Rising property values in Karen',
        description: 'Community reports indicate property values in Karen have increased by approximately 8% over the past 6 months.',
        location: 'Karen, Nairobi',
        confidence: 76,
        reportCount: 28,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        severity: 'medium'
    },
    {
        id: 'ins-3',
        type: 'recommendation',
        title: 'Best time to buy in Kilimani',
        description: 'Based on community insights, the current market conditions in Kilimani are favorable for buyers, with several motivated sellers.',
        location: 'Kilimani, Nairobi',
        confidence: 82,
        reportCount: 15,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
        severity: 'low'
    }
];
function CommunityIntelligence() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)('reports'), activeTab = _a[0], setActiveTab = _a[1];
    var _b = (0, react_1.useState)(mockReports), reports = _b[0], setReports = _b[1];
    var _c = (0, react_1.useState)(''), searchQuery = _c[0], setSearchQuery = _c[1];
    var _d = (0, react_1.useState)('all'), filterType = _d[0], setFilterType = _d[1];
    var _e = (0, react_1.useState)('all'), filterLocation = _e[0], setFilterLocation = _e[1];
    var _f = (0, react_1.useState)({
        propertyAddress: '',
        reportType: '',
        title: '',
        content: '',
        tags: [],
        anonymous: false
    }), newReportForm = _f[0], setNewReportForm = _f[1];
    var filteredReports = (0, react_1.useMemo)(function () {
        return reports.filter(function (report) {
            var matchesSearch = !searchQuery ||
                report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.propertyAddress.toLowerCase().includes(searchQuery.toLowerCase());
            var matchesType = filterType === 'all' || report.reportType === filterType;
            var matchesLocation = filterLocation === 'all' || report.location.includes(filterLocation);
            return matchesSearch && matchesType && matchesLocation;
        });
    }, [reports, searchQuery, filterType, filterLocation]);
    var updateNewReportForm = (0, react_1.useCallback)(function (key, value) {
        setNewReportForm(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[key] = value, _a)));
        });
    }, []);
    var handleVote = (0, react_1.useCallback)(function (reportId, voteType) {
        setReports(function (prev) { return prev.map(function (report) {
            if (report.id === reportId) {
                var currentVote = report.userVote;
                var newUpvotes = report.upvotes;
                var newDownvotes = report.downvotes;
                var newUserVote = voteType;
                // Remove previous vote if exists
                if (currentVote === 'up')
                    newUpvotes--;
                if (currentVote === 'down')
                    newDownvotes--;
                // Add new vote or remove if same
                if (currentVote === voteType) {
                    newUserVote = undefined; // Remove vote
                }
                else {
                    if (voteType === 'up')
                        newUpvotes++;
                    if (voteType === 'down')
                        newDownvotes++;
                }
                return __assign(__assign({}, report), { upvotes: newUpvotes, downvotes: newDownvotes, userVote: newUserVote });
            }
            return report;
        }); });
    }, []);
    var handleSubmitReport = (0, react_1.useCallback)(function () { return __awaiter(_this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!newReportForm.propertyAddress || !newReportForm.reportType || !newReportForm.title || !newReportForm.content) {
                        toast({
                            title: 'Missing required fields',
                            description: 'Please fill in all required fields.',
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
                        title: 'Report submitted successfully',
                        description: 'Your community report has been submitted and will be reviewed.',
                    });
                    setNewReportForm({
                        propertyAddress: '',
                        reportType: '',
                        title: '',
                        content: '',
                        tags: [],
                        anonymous: false
                    });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    toast({
                        title: 'Failed to submit report',
                        description: 'Please try again later.',
                        variant: 'destructive'
                    });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [newReportForm, toast]);
    var getReportTypeIcon = function (type) {
        switch (type) {
            case 'warning':
                return <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-500"/>;
            case 'review':
                return <lucide_react_1.Star className="w-4 h-4 text-yellow-500"/>;
            case 'recommendation':
                return <lucide_react_1.TrendingUp className="w-4 h-4 text-green-500"/>;
            case 'question':
                return <lucide_react_1.MessageSquare className="w-4 h-4 text-blue-500"/>;
            default:
                return <lucide_react_1.MessageSquare className="w-4 h-4"/>;
        }
    };
    var getInsightIcon = function (type) {
        switch (type) {
            case 'alert':
                return <lucide_react_1.AlertTriangle className="w-5 h-5 text-red-500"/>;
            case 'trend':
                return <lucide_react_1.TrendingUp className="w-5 h-5 text-green-500"/>;
            case 'recommendation':
                return <lucide_react_1.Star className="w-5 h-5 text-blue-500"/>;
            default:
                return <lucide_react_1.BarChart3 className="w-5 h-5"/>;
        }
    };
    var formatTimeAgo = function (date) {
        var now = new Date();
        var diff = now.getTime() - date.getTime();
        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        var hours = Math.floor(diff / (1000 * 60 * 60));
        if (days > 0)
            return "".concat(days, "d ago");
        if (hours > 0)
            return "".concat(hours, "h ago");
        return 'Just now';
    };
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.Users className="w-8 h-8 text-purple-500"/>
            Community Intelligence
          </h1>
          <p className="text-muted-foreground">
            Leverage community insights for better property decisions
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <button_1.Button variant={activeTab === 'reports' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('reports'); }}>
            Community Reports
          </button_1.Button>
          <button_1.Button variant={activeTab === 'insights' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('insights'); }}>
            Market Insights
          </button_1.Button>
          <button_1.Button variant={activeTab === 'contribute' ? 'default' : 'ghost'} onClick={function () { return setActiveTab('contribute'); }}>
            Contribute
          </button_1.Button>
        </div>

        {activeTab === 'reports' && (<div>
            {/* Search and Filters */}
            <card_1.Card className="mb-6">
              <card_1.CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <input_1.Input placeholder="Search reports..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }}/>
                  </div>
                  
                  <select_1.Select value={filterType} onValueChange={setFilterType}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder="All Types"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="all">All Types</select_1.SelectItem>
                      <select_1.SelectItem value="review">Reviews</select_1.SelectItem>
                      <select_1.SelectItem value="warning">Warnings</select_1.SelectItem>
                      <select_1.SelectItem value="recommendation">Recommendations</select_1.SelectItem>
                      <select_1.SelectItem value="question">Questions</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>

                  <select_1.Select value={filterLocation} onValueChange={setFilterLocation}>
                    <select_1.SelectTrigger>
                      <select_1.SelectValue placeholder="All Locations"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="all">All Locations</select_1.SelectItem>
                      <select_1.SelectItem value="Westlands">Westlands</select_1.SelectItem>
                      <select_1.SelectItem value="Karen">Karen</select_1.SelectItem>
                      <select_1.SelectItem value="Kilimani">Kilimani</select_1.SelectItem>
                      <select_1.SelectItem value="Lavington">Lavington</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </card_1.CardContent>
            </card_1.Card>

            {/* Reports List */}
            <div className="space-y-4">
              {filteredReports.map(function (report) { return (<card_1.Card key={report.id} className="hover:shadow-md transition-shadow">
                  <card_1.CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-muted rounded-full">
                        {getReportTypeIcon(report.reportType)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{report.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{report.author.name}</span>
                              {report.author.verifiedResident && (<badge_1.Badge variant="outline" className="text-xs">
                                  Verified Resident
                                </badge_1.Badge>)}
                              <span>Trust Score: {report.author.trustScore}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(report.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <badge_1.Badge variant="outline" className="capitalize">
                              {report.reportType}
                            </badge_1.Badge>
                            {report.verified && (<badge_1.Badge className="bg-green-100 text-green-800">
                                Verified
                              </badge_1.Badge>)}
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            <lucide_react_1.MapPin className="w-3 h-3 inline mr-1"/>
                            {report.propertyAddress}
                          </p>
                          <p className="text-gray-700">{report.content}</p>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {report.tags.map(function (tag, index) { return (<badge_1.Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </badge_1.Badge>); })}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <button onClick={function () { return handleVote(report.id, 'up'); }} className={"flex items-center gap-1 text-sm transition-colors ".concat(report.userVote === 'up' ? 'text-green-600' : 'text-muted-foreground hover:text-green-600')}>
                              <lucide_react_1.ThumbsUp className="w-4 h-4"/>
                              <span>{report.upvotes}</span>
                            </button>
                            
                            <button onClick={function () { return handleVote(report.id, 'down'); }} className={"flex items-center gap-1 text-sm transition-colors ".concat(report.userVote === 'down' ? 'text-red-600' : 'text-muted-foreground hover:text-red-600')}>
                              <lucide_react_1.ThumbsDown className="w-4 h-4"/>
                              <span>{report.downvotes}</span>
                            </button>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <lucide_react_1.MessageSquare className="w-4 h-4"/>
                              <span>{report.replies}</span>
                            </div>

                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <lucide_react_1.Eye className="w-4 h-4"/>
                              <span>{report.views}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button_1.Button size="sm" variant="ghost">
                              <lucide_react_1.Share2 className="w-4 h-4 mr-2"/>
                              Share
                            </button_1.Button>
                            <button_1.Button size="sm" variant="ghost">
                              <lucide_react_1.Flag className="w-4 h-4 mr-2"/>
                              Report
                            </button_1.Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>); })}
            </div>
          </div>)}

        {activeTab === 'insights' && (<div className="space-y-6">
            {mockInsights.map(function (insight) { return (<card_1.Card key={insight.id}>
                <card_1.CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-muted rounded-full">
                      {getInsightIcon(insight.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{insight.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <lucide_react_1.MapPin className="w-3 h-3"/>
                            <span>{insight.location}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(insight.lastUpdated)}</span>
                          </div>
                        </div>
                        <badge_1.Badge variant="outline" className="capitalize">
                          {insight.type}
                        </badge_1.Badge>
                      </div>

                      <p className="text-gray-700 mb-4">{insight.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <lucide_react_1.BarChart3 className="w-4 h-4 text-blue-500"/>
                            <span>Confidence: {insight.confidence}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <lucide_react_1.Users className="w-4 h-4 text-green-500"/>
                            <span>{insight.reportCount} reports</span>
                          </div>
                        </div>

                        <badge_1.Badge className={insight.severity === 'high' ? 'bg-red-100 text-red-800' :
                    insight.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'}>
                          {insight.severity} priority
                        </badge_1.Badge>
                      </div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>)}

        {activeTab === 'contribute' && (<card_1.Card className="max-w-2xl mx-auto">
            <card_1.CardHeader>
              <card_1.CardTitle>Share Your Experience</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div>
                <label_1.Label htmlFor="property-address">Property Address *</label_1.Label>
                <textarea_1.Textarea id="property-address" placeholder="Enter the property address you want to report about" value={newReportForm.propertyAddress} onChange={function (e) { return updateNewReportForm('propertyAddress', e.target.value); }} rows={2}/>
              </div>

              <div>
                <label_1.Label htmlFor="report-type">Report Type *</label_1.Label>
                <select_1.Select value={newReportForm.reportType} onValueChange={function (value) { return updateNewReportForm('reportType', value); }}>
                  <select_1.SelectTrigger>
                    <select_1.SelectValue placeholder="Select report type"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="review">Property Review</select_1.SelectItem>
                    <select_1.SelectItem value="warning">Warning/Alert</select_1.SelectItem>
                    <select_1.SelectItem value="recommendation">Recommendation</select_1.SelectItem>
                    <select_1.SelectItem value="question">Question</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              <div>
                <label_1.Label htmlFor="title">Title *</label_1.Label>
                <input_1.Input id="title" placeholder="Brief title for your report" value={newReportForm.title} onChange={function (e) { return updateNewReportForm('title', e.target.value); }}/>
              </div>

              <div>
                <label_1.Label htmlFor="content">Content *</label_1.Label>
                <textarea_1.Textarea id="content" placeholder="Share your experience, observations, or questions about this property or area..." value={newReportForm.content} onChange={function (e) { return updateNewReportForm('content', e.target.value); }} rows={6}/>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="anonymous" checked={newReportForm.anonymous} onChange={function (e) { return updateNewReportForm('anonymous', e.target.checked); }}/>
                <label_1.Label htmlFor="anonymous" className="text-sm">
                  Post anonymously
                </label_1.Label>
              </div>

              <button_1.Button onClick={handleSubmitReport} className="w-full">
                <lucide_react_1.Plus className="w-4 h-4 mr-2"/>
                Submit Report
              </button_1.Button>
            </card_1.CardContent>
          </card_1.Card>)}
      </div>
    </div>);
}
