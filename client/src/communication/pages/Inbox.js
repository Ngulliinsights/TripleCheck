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
exports.default = InboxPage;
var react_query_1 = require("@tanstack/react-query");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var dialog_1 = require("../../local/components/ui/dialog");
var input_1 = require("../../local/components/ui/input");
var label_1 = require("../../local/components/ui/label");
var separator_1 = require("../../local/components/ui/separator");
var tabs_1 = require("../../local/components/ui/tabs");
var textarea_1 = require("../../local/components/ui/textarea");
var use_toast_1 = require("../../local/hooks/use-toast");
// Status badge configuration for better maintainability - using const assertion for type safety
var STATUS_CONFIG = {
    unread: { variant: "destructive", label: "Unread" },
    read: { variant: "secondary", label: "Read" },
    replied: { variant: "default", label: "Replied" },
    archived: { variant: "outline", label: "Archived" },
};
// Priority color mapping for consistent styling - using readonly array to prevent injection
var PRIORITY_COLORS = {
    high: "border-l-red-500",
    medium: "border-l-yellow-500",
    low: "border-l-green-500",
};
// Type icon configuration for better organization - using const assertion for type safety
var TYPE_ICONS = {
    viewing_request: { icon: lucide_react_1.Home, className: "w-4 h-4 text-blue-500" },
    offer: { icon: lucide_react_1.Star, className: "w-4 h-4 text-yellow-500" },
    complaint: { icon: lucide_react_1.AlertCircle, className: "w-4 h-4 text-red-500" },
    inquiry: { icon: lucide_react_1.MessageSquare, className: "w-4 h-4 text-gray-500" },
};
// Mock data with proper typing
var MOCK_INQUIRIES = [
    {
        id: "1",
        propertyId: 1,
        propertyTitle: "Modern Apartment in Westlands",
        propertyLocation: "Westlands, Nairobi",
        propertyPrice: 85000,
        senderName: "John Kamau",
        senderEmail: "john.kamau@email.com",
        senderPhone: "+254 700 123 456",
        message: "Hi, I'm very interested in this property. Could we schedule a viewing this weekend? I'm looking for a 2-bedroom apartment in this area and this seems perfect. What's the earliest availability?",
        timestamp: "2 hours ago",
        status: "unread",
        priority: "high",
        type: "viewing_request",
    },
    {
        id: "2",
        propertyId: 2,
        propertyTitle: "Luxury Villa in Karen",
        propertyLocation: "Karen, Nairobi",
        propertyPrice: 250000,
        senderName: "Sarah Wanjiku",
        senderEmail: "sarah.w@email.com",
        message: "I would like to make an offer on this property. Is the owner open to negotiations? My budget is around KES 230,000. Please let me know if this is acceptable.",
        timestamp: "5 hours ago",
        status: "read",
        priority: "high",
        type: "offer",
    },
    {
        id: "3",
        propertyId: 3,
        propertyTitle: "Cozy Studio in Kilimani",
        propertyLocation: "Kilimani, Nairobi",
        propertyPrice: 45000,
        senderName: "Michael Ochieng",
        senderEmail: "m.ochieng@email.com",
        senderPhone: "+254 722 987 654",
        message: "Hello, I'm interested in renting this studio apartment. What are the lease terms and when would it be available? Also, are pets allowed?",
        timestamp: "1 day ago",
        status: "replied",
        priority: "medium",
        type: "inquiry",
    },
    {
        id: "4",
        propertyId: 1,
        propertyTitle: "Modern Apartment in Westlands",
        propertyLocation: "Westlands, Nairobi",
        propertyPrice: 85000,
        senderName: "Grace Muthoni",
        senderEmail: "grace.muthoni@email.com",
        message: "I saw your listing and I'm interested. However, I noticed some discrepancies in the photos. Could you provide more recent pictures of the property?",
        timestamp: "2 days ago",
        status: "read",
        priority: "medium",
        type: "complaint",
    },
];
// Utility functions for better code organization with proper type safety
var getStatusBadge = function (status) {
    var validStatuses = ["unread", "read", "replied", "archived"];
    var config = validStatuses.includes(status) ? STATUS_CONFIG[status] : STATUS_CONFIG.unread;
    return <badge_1.Badge variant={config.variant}>{config.label}</badge_1.Badge>;
};
// Safe access to priority colors to prevent object injection
var getPriorityColor = function (priority) {
    var validPriorities = ["high", "medium", "low"];
    if (validPriorities.includes(priority)) {
        return PRIORITY_COLORS[priority];
    }
    return "border-l-gray-500";
};
// Safe access to type icons with proper typing
var getTypeIcon = function (type) {
    var validTypes = ["viewing_request", "offer", "complaint", "inquiry"];
    var iconConfig = validTypes.includes(type) ? TYPE_ICONS[type] : TYPE_ICONS.inquiry;
    var Icon = iconConfig.icon, className = iconConfig.className;
    return <Icon className={className}/>;
};
// Custom hook for search functionality to improve reusability
var useInquirySearch = function (inquiries, activeTab, searchQuery) {
    return (0, react_1.useMemo)(function () {
        return inquiries.filter(function (inquiry) {
            var matchesTab = activeTab === "all" || inquiry.status === activeTab;
            var matchesSearch = !searchQuery ||
                inquiry.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                inquiry.propertyTitle
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                inquiry.message.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [inquiries, activeTab, searchQuery]);
};
// Memoized inquiry item component for better performance with improved accessibility
var InquiryItem = function (_a) {
    var inquiry = _a.inquiry, isSelected = _a.isSelected, onSelect = _a.onSelect;
    // Handle keyboard navigation for accessibility
    var handleKeyDown = (0, react_1.useCallback)(function (event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(inquiry);
        }
    }, [inquiry, onSelect]);
    return (<div className={"p-4 border-b border-l-4 cursor-pointer hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ".concat(getPriorityColor(inquiry.priority), " ").concat(isSelected ? "bg-accent" : "")} onClick={function () { return onSelect(inquiry); }} onKeyDown={handleKeyDown} role="button" tabIndex={0} aria-pressed={isSelected ? "true" : "false"} aria-label={"Message from ".concat(inquiry.senderName, " about ").concat(inquiry.propertyTitle)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {getTypeIcon(inquiry.type)}
          <span className="font-medium text-sm">{inquiry.senderName}</span>
        </div>
        {getStatusBadge(inquiry.status)}
      </div>
      <p className="text-sm font-medium mb-1">{inquiry.propertyTitle}</p>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {inquiry.message}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{inquiry.timestamp}</span>
        <span className="text-xs font-medium text-primary">
          KES {inquiry.propertyPrice.toLocaleString()}
        </span>
      </div>
    </div>);
};
// Main component with optimized structure
function InboxPage() {
    var _this = this;
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_1.useState)("all"), activeTab = _a[0], setActiveTab = _a[1];
    var _b = (0, react_1.useState)(null), selectedInquiry = _b[0], setSelectedInquiry = _b[1];
    var _c = (0, react_1.useState)(false), showReplyDialog = _c[0], setShowReplyDialog = _c[1];
    var _d = (0, react_1.useState)(""), searchQuery = _d[0], setSearchQuery = _d[1];
    var _e = (0, react_1.useState)(""), replyMessage = _e[0], setReplyMessage = _e[1];
    var toast = (0, use_toast_1.useToast)().toast;
    var queryClient = (0, react_query_1.useQueryClient)();
    // Simplified data fetching to avoid hook issues
    var _f = (0, react_query_1.useQuery)({
        queryKey: ["inquiries"],
        queryFn: function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Simulate API call with proper error handling
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 1:
                        // Simulate API call with proper error handling
                        _a.sent();
                        return [2 /*return*/, MOCK_INQUIRIES];
                }
            });
        }); },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    }), _g = _f.data, inquiries = _g === void 0 ? MOCK_INQUIRIES : _g, isLoading = _f.isLoading, error = _f.error;
    // Optimized reply mutation with proper error handling
    var replyMutation = (0, react_query_1.useMutation)({
        mutationFn: function (data) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Simulate reply with validation
                        if (!data.message.trim()) {
                            throw new Error("Message cannot be empty");
                        }
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true, messageId: "reply_".concat(Date.now()) }];
                }
            });
        }); },
        onSuccess: function () {
            toast({
                title: "Reply sent",
                description: "Your reply has been sent successfully",
            });
            queryClient.invalidateQueries({ queryKey: ["inquiries"] });
            setShowReplyDialog(false);
            setReplyMessage(""); // Clear the reply message
        },
        onError: function (error) {
            toast({
                title: "Error sending reply",
                description: error.message || "Please try again later",
                variant: "destructive",
            });
        },
    });
    // Optimized mark as read mutation
    var markAsReadMutation = (0, react_query_1.useMutation)({
        mutationFn: function (_inquiryId) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 200); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, Promise.resolve()];
                }
            });
        }); },
        onSuccess: function () {
            queryClient.invalidateQueries({ queryKey: ["inquiries"] });
        },
    });
    // Use custom hook for filtered inquiries
    var filteredInquiries = useInquirySearch(inquiries, activeTab, searchQuery);
    // Memoized computed values for performance
    var unreadCount = (0, react_1.useMemo)(function () { return inquiries.filter(function (i) { return i.status === "unread"; }).length; }, [inquiries]);
    // Optimized event handlers with proper useCallback usage
    var handleInquiryClick = (0, react_1.useCallback)(function (inquiry) {
        setSelectedInquiry(inquiry);
        if (inquiry.status === "unread") {
            markAsReadMutation.mutate(inquiry.id);
        }
    }, [markAsReadMutation]);
    var handleReply = (0, react_1.useCallback)(function () {
        if (selectedInquiry && replyMessage.trim()) {
            replyMutation.mutate({
                inquiryId: selectedInquiry.id,
                message: replyMessage.trim(),
            });
        }
    }, [selectedInquiry, replyMessage, replyMutation]);
    var handleTabChange = (0, react_1.useCallback)(function (value) {
        setActiveTab(value);
    }, []);
    var handleSearchChange = (0, react_1.useCallback)(function (e) {
        setSearchQuery(e.target.value);
    }, []);
    // Handle reply dialog close with cleanup
    var handleReplyDialogClose = (0, react_1.useCallback)(function (open) {
        setShowReplyDialog(open);
        if (!open) {
            setReplyMessage("");
        }
    }, []);
    // Keyboard shortcut for sending reply
    var handleReplyKeyDown = (0, react_1.useCallback)(function (e) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            handleReply();
        }
    }, [handleReply]);
    // Render loading state
    if (isLoading) {
        return (<div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading inquiries...</p>
          </div>
        </div>
      </div>);
    }
    // Render error state
    if (error) {
        return (<div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <lucide_react_1.AlertCircle className="w-16 h-16 mx-auto text-destructive mb-4"/>
            <h3 className="text-lg font-medium mb-2">
              Error loading inquiries
            </h3>
            <p className="text-muted-foreground">
              Please refresh the page and try again
            </p>
          </div>
        </div>
      </div>);
    }
    return (<div className="container mx-auto px-4 navbar-offset pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button_1.Button variant="ghost" size="sm" onClick={function () { return navigate("/dashboard"); }} className="flex items-center gap-2 hover:text-foreground">
            <lucide_react_1.LayoutDashboard className="w-4 h-4"/>
            Dashboard
          </button_1.Button>
          <span>/</span>
          <span className="text-foreground font-medium">Inbox</span>
        </nav>

        {/* Header section with improved accessibility */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button_1.Button variant="outline" size="sm" onClick={function () { return navigate("/dashboard"); }} className="flex items-center gap-2">
              <lucide_react_1.ArrowLeft className="w-4 h-4"/>
              Back to Dashboard
            </button_1.Button>
            <div>
              <h1 className="text-3xl font-bold">Inbox</h1>
              <p className="text-muted-foreground">
                Manage inquiries and communicate with potential buyers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <lucide_react_1.Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
              <input_1.Input placeholder="Search inquiries..." value={searchQuery} onChange={handleSearchChange} className="pl-9 w-64" aria-label="Search inquiries"/>
            </div>
            <button_1.Button variant="outline">
              <lucide_react_1.Filter className="w-4 h-4 mr-2"/>
              Filter
            </button_1.Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inbox List with improved performance and accessibility */}
          <div className="lg:col-span-1">
            <card_1.Card>
              <card_1.CardHeader>
                <div className="flex items-center justify-between">
                  <card_1.CardTitle className="flex items-center gap-2">
                    <lucide_react_1.MessageSquare className="w-5 h-5"/>
                    Messages
                  </card_1.CardTitle>
                  {unreadCount > 0 && (<badge_1.Badge variant="destructive" aria-label={"".concat(unreadCount, " unread messages")}>
                      {unreadCount}
                    </badge_1.Badge>)}
                </div>
              </card_1.CardHeader>
              <card_1.CardContent className="p-0">
                <tabs_1.Tabs value={activeTab} onValueChange={handleTabChange}>
                  <tabs_1.TabsList className="grid w-full grid-cols-4 mx-4 mb-4">
                    <tabs_1.TabsTrigger value="all">All</tabs_1.TabsTrigger>
                    <tabs_1.TabsTrigger value="unread">Unread</tabs_1.TabsTrigger>
                    <tabs_1.TabsTrigger value="replied">Replied</tabs_1.TabsTrigger>
                    <tabs_1.TabsTrigger value="archived">Archived</tabs_1.TabsTrigger>
                  </tabs_1.TabsList>
                </tabs_1.Tabs>

                <div className="max-h-96 overflow-y-auto" role="list" aria-label="Inquiry messages">
                  {filteredInquiries.length === 0 ? (<div className="p-8 text-center">
                      <lucide_react_1.MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4"/>
                      <p className="text-muted-foreground">
                        No inquiries found
                      </p>
                    </div>) : (filteredInquiries.map(function (inquiry) { return (<div key={inquiry.id} role="listitem">
                        <InquiryItem inquiry={inquiry} isSelected={(selectedInquiry === null || selectedInquiry === void 0 ? void 0 : selectedInquiry.id) === inquiry.id} onSelect={handleInquiryClick}/>
                      </div>); }))}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>

          {/* Message Detail with enhanced UX */}
          <div className="lg:col-span-2">
            {selectedInquiry ? (<card_1.Card>
                <card_1.CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(selectedInquiry.type)}
                      <div>
                        <card_1.CardTitle className="text-lg">
                          {selectedInquiry.senderName}
                        </card_1.CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {selectedInquiry.senderEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(selectedInquiry.status)}
                      <button_1.Button variant="outline" size="sm" aria-label="More options">
                        <lucide_react_1.MoreHorizontal className="w-4 h-4"/>
                      </button_1.Button>
                    </div>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-6">
                  {/* Property Info */}
                  <div className="bg-accent/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <lucide_react_1.Home className="w-4 h-4 text-primary"/>
                      <span className="font-medium">Property Inquiry</span>
                    </div>
                    <h3 className="font-semibold">
                      {selectedInquiry.propertyTitle}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <lucide_react_1.MapPin className="w-3 h-3"/>
                        {selectedInquiry.propertyLocation}
                      </div>
                      <span className="font-medium text-primary">
                        KES {selectedInquiry.propertyPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <lucide_react_1.Mail className="w-4 h-4 text-muted-foreground"/>
                      <span className="text-sm">
                        {selectedInquiry.senderEmail}
                      </span>
                    </div>
                    {selectedInquiry.senderPhone && (<div className="flex items-center gap-2">
                        <lucide_react_1.Phone className="w-4 h-4 text-muted-foreground"/>
                        <span className="text-sm">
                          {selectedInquiry.senderPhone}
                        </span>
                      </div>)}
                  </div>

                  <separator_1.Separator />

                  {/* Message */}
                  <div>
                    <h4 className="font-medium mb-2">Message</h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {selectedInquiry.message}
                    </p>
                  </div>

                  <separator_1.Separator />

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <button_1.Button onClick={function () { return setShowReplyDialog(true); }}>
                      <lucide_react_1.Reply className="w-4 h-4 mr-2"/>
                      Reply
                    </button_1.Button>
                    <button_1.Button variant="outline">
                      <lucide_react_1.Forward className="w-4 h-4 mr-2"/>
                      Forward
                    </button_1.Button>
                    <button_1.Button variant="outline">
                      <lucide_react_1.Archive className="w-4 h-4 mr-2"/>
                      Archive
                    </button_1.Button>
                    <button_1.Button variant="outline" onClick={function () { return navigate("/property/".concat(selectedInquiry.propertyId)); }}>
                      <lucide_react_1.Home className="w-4 h-4 mr-2"/>
                      View Property
                    </button_1.Button>
                    {selectedInquiry.senderPhone && (<button_1.Button variant="outline">
                        <lucide_react_1.Phone className="w-4 h-4 mr-2"/>
                        Call
                      </button_1.Button>)}
                  </div>
                </card_1.CardContent>
              </card_1.Card>) : (<card_1.Card>
                <card_1.CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <lucide_react_1.MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4"/>
                    <h3 className="text-lg font-medium mb-2">
                      Select a message
                    </h3>
                    <p className="text-muted-foreground">
                      Choose a message from the inbox to view details and reply
                    </p>
                  </div>
                </card_1.CardContent>
              </card_1.Card>)}
          </div>
        </div>

        {/* Reply Dialog with improved form handling and accessibility */}
        <dialog_1.Dialog open={showReplyDialog} onOpenChange={handleReplyDialogClose}>
          <dialog_1.DialogContent className="max-w-2xl">
            <dialog_1.DialogHeader>
              <dialog_1.DialogTitle>Reply to {selectedInquiry === null || selectedInquiry === void 0 ? void 0 : selectedInquiry.senderName}</dialog_1.DialogTitle>
            </dialog_1.DialogHeader>
            <div className="space-y-4">
              <div>
                <label_1.Label htmlFor="reply-message">Your Reply</label_1.Label>
                <textarea_1.Textarea id="reply-message" placeholder="Type your reply here..." rows={6} value={replyMessage} onChange={function (e) { return setReplyMessage(e.target.value); }} onKeyDown={handleReplyKeyDown} disabled={replyMutation.isPending} required aria-describedby="reply-help"/>
                <p id="reply-help" className="text-xs text-muted-foreground mt-1">
                  Press Ctrl+Enter (Cmd+Enter on Mac) to send quickly
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button_1.Button variant="outline" onClick={function () { return handleReplyDialogClose(false); }} disabled={replyMutation.isPending}>
                  Cancel
                </button_1.Button>
                <button_1.Button onClick={handleReply} disabled={replyMutation.isPending || !replyMessage.trim()}>
                  {replyMutation.isPending ? (<>Sending...</>) : (<>
                      <lucide_react_1.Send className="w-4 h-4 mr-2"/>
                      Send Reply
                    </>)}
                </button_1.Button>
              </div>
            </div>
          </dialog_1.DialogContent>
        </dialog_1.Dialog>
      </div>
    </div>);
}
