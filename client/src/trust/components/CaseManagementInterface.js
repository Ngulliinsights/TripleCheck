"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaseManagementInterface = CaseManagementInterface;
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var select_1 = require("../../local/components/ui/select");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
// Mock data with proper readonly arrays and immutable structure
var MOCK_CASES = [
    {
        id: 'case-001',
        title: 'Suspicious Property Flipping Network',
        description: 'Investigation into coordinated property flipping activities involving multiple participants',
        status: 'investigating',
        priority: 'high',
        assignedTo: 'John Investigator',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        dueDate: new Date('2024-02-15'),
        alertIds: ['alert-001', 'alert-002', 'alert-003'],
        evidence: [],
        notes: [],
        tags: ['property_flipping', 'network_analysis', 'high_value']
    },
    {
        id: 'case-002',
        title: 'Document Forgery Investigation',
        description: 'Multiple forged title deeds detected in the same geographic area',
        status: 'open',
        priority: 'urgent',
        assignedTo: 'Sarah Detective',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
        dueDate: new Date('2024-01-25'),
        alertIds: ['alert-004', 'alert-005'],
        evidence: [],
        notes: [],
        tags: ['document_forgery', 'title_deeds', 'geographic_cluster']
    }
];
// Configuration objects with proper typing - these help maintain consistency and type safety
var STATUS_CONFIG = {
    open: { color: 'bg-blue-100 text-blue-800', label: 'Open' },
    investigating: { color: 'bg-yellow-100 text-yellow-800', label: 'Investigating' },
    resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
    closed: { color: 'bg-gray-100 text-gray-800', label: 'Closed' }
};
var PRIORITY_CONFIG = {
    low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
    medium: { color: 'bg-blue-100 text-blue-800', label: 'Medium' },
    high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
    urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' }
};
function CaseManagementInterface(_a) {
    var _userId = _a.userId, // Prefixed with underscore to indicate intentionally unused
    _b = _a.showCreateCase, // Prefixed with underscore to indicate intentionally unused
    showCreateCase = _b === void 0 ? true : _b;
    var toast = (0, use_toast_1.useToast)().toast;
    // State management - using proper typing and immutable patterns
    var cases = (0, react_1.useState)(MOCK_CASES)[0];
    var _c = (0, react_1.useState)(null), selectedCase = _c[0], setSelectedCase = _c[1];
    var _d = (0, react_1.useState)(''), searchQuery = _d[0], setSearchQuery = _d[1];
    var _e = (0, react_1.useState)('all'), statusFilter = _e[0], setStatusFilter = _e[1];
    var _f = (0, react_1.useState)('all'), priorityFilter = _f[0], setPriorityFilter = _f[1];
    var _g = (0, react_1.useState)('overview'), selectedTab = _g[0], setSelectedTab = _g[1];
    // Filtering logic with improved type safety and null checking
    var filteredCases = cases.filter(function (case_) {
        var matchesSearch = case_.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            case_.description.toLowerCase().includes(searchQuery.toLowerCase());
        var matchesStatus = statusFilter === 'all' || case_.status === statusFilter;
        var matchesPriority = priorityFilter === 'all' || case_.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });
    // Event handlers with proper error handling and user feedback
    var handleCreateCase = function () {
        toast({
            title: "Create New Case",
            description: "Case creation dialog would open here.",
        });
    };
    // Utility functions for date formatting and calculations
    var formatTimeAgo = function (date) {
        var now = new Date();
        var diffMs = now.getTime() - date.getTime();
        var diffDays = Math.floor(diffMs / 86400000);
        if (diffDays === 0)
            return 'Today';
        if (diffDays === 1)
            return 'Yesterday';
        return "".concat(diffDays, " days ago");
    };
    // Safe calculation with null checking to avoid runtime errors
    var getDaysUntilDue = function (dueDate) {
        if (!dueDate)
            return null;
        var now = new Date();
        var diffMs = dueDate.getTime() - now.getTime();
        return Math.ceil(diffMs / 86400000);
    };
    return (<div className="space-y-6">
      {/* Header section with conditional rendering for create button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Case Management</h2>
          <p className="text-gray-600">
            Manage fraud investigation cases and track progress
          </p>
        </div>
        
        {showCreateCase && (<button_1.Button onClick={handleCreateCase}>
            <lucide_react_1.Plus className="h-4 w-4 mr-2"/>
            New Case
          </button_1.Button>)}
      </div>

      {/* Filters section with improved accessibility and UX */}
      <card_1.Card>
        <card_1.CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                <input_1.Input placeholder="Search cases..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="pl-10"/>
              </div>
            </div>
            
            {/* Status filter with proper value handling */}
            <select_1.Select value={statusFilter} onValueChange={setStatusFilter}>
              <select_1.SelectTrigger className="w-32">
                <select_1.SelectValue />
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="all">All Status</select_1.SelectItem>
                <select_1.SelectItem value="open">Open</select_1.SelectItem>
                <select_1.SelectItem value="investigating">Investigating</select_1.SelectItem>
                <select_1.SelectItem value="resolved">Resolved</select_1.SelectItem>
                <select_1.SelectItem value="closed">Closed</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>

            {/* Priority filter with consistent pattern */}
            <select_1.Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <select_1.SelectTrigger className="w-32">
                <select_1.SelectValue />
              </select_1.SelectTrigger>
              <select_1.SelectContent>
                <select_1.SelectItem value="all">All Priority</select_1.SelectItem>
                <select_1.SelectItem value="urgent">Urgent</select_1.SelectItem>
                <select_1.SelectItem value="high">High</select_1.SelectItem>
                <select_1.SelectItem value="medium">Medium</select_1.SelectItem>
                <select_1.SelectItem value="low">Low</select_1.SelectItem>
              </select_1.SelectContent>
            </select_1.Select>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List with improved performance through proper key usage */}
        <div className="lg:col-span-2">
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Investigation Cases</card_1.CardTitle>
              <card_1.CardDescription>
                {filteredCases.length} case(s) found
              </card_1.CardDescription>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <framer_motion_1.AnimatePresence>
                  {filteredCases.map(function (case_) {
            var statusConfig = STATUS_CONFIG[case_.status];
            var priorityConfig = PRIORITY_CONFIG[case_.priority];
            var daysUntilDue = getDaysUntilDue(case_.dueDate);
            return (<framer_motion_1.motion.div key={case_.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
                        <card_1.Card className={"cursor-pointer transition-all duration-200 hover:shadow-md ".concat((selectedCase === null || selectedCase === void 0 ? void 0 : selectedCase.id) === case_.id ? 'ring-2 ring-blue-500 bg-blue-50' : '')} onClick={function () { return setSelectedCase(case_); }}>
                          <card_1.CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <badge_1.Badge className={statusConfig.color}>
                                    {statusConfig.label}
                                  </badge_1.Badge>
                                  <badge_1.Badge className={priorityConfig.color}>
                                    {priorityConfig.label}
                                  </badge_1.Badge>
                                  {/* Safe null checking prevents runtime errors */}
                                  {daysUntilDue !== null && daysUntilDue <= 3 && (<badge_1.Badge variant="destructive" className="text-xs">
                                      Due in {daysUntilDue} days
                                    </badge_1.Badge>)}
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {case_.title}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {case_.description}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <lucide_react_1.User className="h-3 w-3"/>
                                  <span>{case_.assignedTo}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <lucide_react_1.AlertTriangle className="h-3 w-3"/>
                                  <span>{case_.alertIds.length} alerts</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <lucide_react_1.Clock className="h-3 w-3"/>
                                  <span>Updated {formatTimeAgo(case_.updatedAt)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Tag display with proper array handling */}
                            {case_.tags.length > 0 && (<div className="flex flex-wrap gap-1 mt-2">
                                {case_.tags.slice(0, 3).map(function (tag) { return (<badge_1.Badge key={tag} variant="outline" className="text-xs">
                                    {tag.replace('_', ' ')}
                                  </badge_1.Badge>); })}
                                {case_.tags.length > 3 && (<badge_1.Badge variant="outline" className="text-xs">
                                    +{case_.tags.length - 3} more
                                  </badge_1.Badge>)}
                              </div>)}
                          </card_1.CardContent>
                        </card_1.Card>
                      </framer_motion_1.motion.div>);
        })}
                </framer_motion_1.AnimatePresence>
                
                {/* Empty state with proper user guidance */}
                {filteredCases.length === 0 && (<div className="text-center py-8 text-gray-500">
                    <lucide_react_1.Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                    <p>No cases found matching your criteria</p>
                  </div>)}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Case Details with conditional rendering and proper null checking */}
        <div>
          {selectedCase ? (<card_1.Card>
              <card_1.CardHeader>
                <div className="flex items-center justify-between">
                  <card_1.CardTitle className="text-lg">Case Details</card_1.CardTitle>
                  <div className="flex items-center space-x-2">
                    <button_1.Button variant="outline" size="sm">
                      <lucide_react_1.Edit className="h-3 w-3 mr-1"/>
                      Edit
                    </button_1.Button>
                    <button_1.Button variant="outline" size="sm">
                      <lucide_react_1.Archive className="h-3 w-3 mr-1"/>
                      Archive
                    </button_1.Button>
                  </div>
                </div>
              </card_1.CardHeader>
              <card_1.CardContent>
                <tabs_1.Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <tabs_1.TabsList className="grid w-full grid-cols-3">
                    <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
                    <tabs_1.TabsTrigger value="evidence">Evidence</tabs_1.TabsTrigger>
                    <tabs_1.TabsTrigger value="notes">Notes</tabs_1.TabsTrigger>
                  </tabs_1.TabsList>

                  <tabs_1.TabsContent value="overview" className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {selectedCase.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        {selectedCase.description}
                      </p>
                      
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <badge_1.Badge className={STATUS_CONFIG[selectedCase.status].color}>
                            {STATUS_CONFIG[selectedCase.status].label}
                          </badge_1.Badge>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Priority:</span>
                          <badge_1.Badge className={PRIORITY_CONFIG[selectedCase.priority].color}>
                            {PRIORITY_CONFIG[selectedCase.priority].label}
                          </badge_1.Badge>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assigned to:</span>
                          <span className="font-medium">{selectedCase.assignedTo}</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span>{selectedCase.createdAt.toLocaleDateString()}</span>
                        </div>
                        
                        {/* Safe due date handling with proper null checking */}
                        {selectedCase.dueDate && (<div className="flex justify-between">
                            <span className="text-gray-600">Due date:</span>
                            <span className={getDaysUntilDue(selectedCase.dueDate) !== null && getDaysUntilDue(selectedCase.dueDate) <= 3 ? 'text-red-600 font-medium' : ''}>
                              {selectedCase.dueDate.toLocaleDateString()}
                            </span>
                          </div>)}
                        
                        <div className="flex justify-between">
                          <span className="text-gray-600">Related alerts:</span>
                          <span className="font-medium">{selectedCase.alertIds.length}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h5 className="font-medium text-gray-900 mb-2">Tags</h5>
                      <div className="flex flex-wrap gap-1">
                        {selectedCase.tags.map(function (tag) { return (<badge_1.Badge key={tag} variant="outline" className="text-xs">
                            {tag.replace('_', ' ')}
                          </badge_1.Badge>); })}
                      </div>
                    </div>
                  </tabs_1.TabsContent>

                  {/* Evidence tab with proper placeholder state */}
                  <tabs_1.TabsContent value="evidence">
                    <div className="text-center py-8 text-gray-500">
                      <lucide_react_1.FileText className="h-8 w-8 mx-auto mb-2 text-gray-300"/>
                      <p className="text-sm">No evidence uploaded yet</p>
                      <button_1.Button variant="outline" size="sm" className="mt-2">
                        <lucide_react_1.Plus className="h-3 w-3 mr-1"/>
                        Add Evidence
                      </button_1.Button>
                    </div>
                  </tabs_1.TabsContent>

                  {/* Notes tab with consistent placeholder pattern */}
                  <tabs_1.TabsContent value="notes">
                    <div className="text-center py-8 text-gray-500">
                      <lucide_react_1.MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300"/>
                      <p className="text-sm">No notes added yet</p>
                      <button_1.Button variant="outline" size="sm" className="mt-2">
                        <lucide_react_1.Plus className="h-3 w-3 mr-1"/>
                        Add Note
                      </button_1.Button>
                    </div>
                  </tabs_1.TabsContent>
                </tabs_1.Tabs>
              </card_1.CardContent>
            </card_1.Card>) : (
        // Empty state when no case is selected
        <card_1.Card>
              <card_1.CardContent className="p-8 text-center">
                <lucide_react_1.Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300"/>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select a Case
                </h3>
                <p className="text-gray-600">
                  Choose a case from the list to view details and manage the investigation.
                </p>
              </card_1.CardContent>
            </card_1.Card>)}
        </div>
      </div>
    </div>);
}
exports.default = CaseManagementInterface;
