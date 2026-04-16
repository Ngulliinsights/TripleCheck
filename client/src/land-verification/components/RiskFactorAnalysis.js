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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RiskFactorAnalysis;
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var label_1 = require("../../local/components/ui/label");
var progress_1 = require("../../local/components/ui/progress");
var select_1 = require("../../local/components/ui/select");
var tabs_1 = require("../../local/components/ui/tabs");
var utils_1 = require("../../local/lib/utils");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
function RiskFactorAnalysis(_a) {
    var riskFactors = _a.riskFactors, riskInteractions = _a.riskInteractions, onFactorUpdate = _a.onFactorUpdate, className = _a.className;
    var _b = (0, react_1.useState)({
        category: 'all',
        severity: 'all',
        mitigationStatus: 'all',
        searchTerm: ''
    }), filters = _b[0], setFilters = _b[1];
    var _c = (0, react_1.useState)({
        field: 'impact',
        direction: 'desc'
    }), sort = _c[0], setSort = _c[1];
    var _d = (0, react_1.useState)(null), selectedFactor = _d[0], setSelectedFactor = _d[1];
    var _e = (0, react_1.useState)('factors'), activeTab = _e[0], setActiveTab = _e[1];
    // Filter and sort risk factors
    var filteredAndSortedFactors = (0, react_1.useMemo)(function () {
        var filtered = riskFactors.filter(function (factor) {
            if (filters.category !== 'all' && factor.category !== filters.category)
                return false;
            if (filters.severity !== 'all' && factor.severity !== filters.severity)
                return false;
            if (filters.mitigationStatus !== 'all' && factor.mitigationStatus !== filters.mitigationStatus)
                return false;
            if (filters.searchTerm && !factor.description.toLowerCase().includes(filters.searchTerm.toLowerCase()))
                return false;
            return true;
        });
        return filtered.sort(function (a, b) {
            var aValue = a[sort.field];
            var bValue = b[sort.field];
            if (sort.field === 'severity') {
                var severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
                aValue = severityOrder[a.severity];
                bValue = severityOrder[b.severity];
            }
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            if (sort.direction === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            }
            else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
    }, [riskFactors, filters, sort]);
    // Calculate analytics
    var analytics = (0, react_1.useMemo)(function () {
        var total = riskFactors.length;
        var bySeverity = {
            critical: riskFactors.filter(function (f) { return f.severity === 'critical'; }).length,
            high: riskFactors.filter(function (f) { return f.severity === 'high'; }).length,
            medium: riskFactors.filter(function (f) { return f.severity === 'medium'; }).length,
            low: riskFactors.filter(function (f) { return f.severity === 'low'; }).length
        };
        var byCategory = {
            ownership: riskFactors.filter(function (f) { return f.category === 'ownership'; }).length,
            government: riskFactors.filter(function (f) { return f.category === 'government'; }).length,
            legal: riskFactors.filter(function (f) { return f.category === 'legal'; }).length,
            physical: riskFactors.filter(function (f) { return f.category === 'physical'; }).length,
            community: riskFactors.filter(function (f) { return f.category === 'community'; }).length
        };
        var byMitigation = {
            none: riskFactors.filter(function (f) { return f.mitigationStatus === 'none'; }).length,
            planned: riskFactors.filter(function (f) { return f.mitigationStatus === 'planned'; }).length,
            in_progress: riskFactors.filter(function (f) { return f.mitigationStatus === 'in_progress'; }).length,
            completed: riskFactors.filter(function (f) { return f.mitigationStatus === 'completed'; }).length
        };
        var averageImpact = total > 0 ? riskFactors.reduce(function (sum, f) { return sum + f.impact; }, 0) / total : 0;
        return { total: total, bySeverity: bySeverity, byCategory: byCategory, byMitigation: byMitigation, averageImpact: averageImpact };
    }, [riskFactors]);
    var getSeverityColor = function (severity) {
        switch (severity) {
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
        }
    };
    var getMitigationStatusColor = function (status) {
        switch (status) {
            case 'completed': return 'text-green-600 bg-green-50 border-green-200';
            case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
            case 'planned': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };
    var RiskFactorCard = function (_a) {
        var factor = _a.factor;
        var relatedInteractions = riskInteractions.filter(function (i) { return i.primaryFactorId === factor.id || i.secondaryFactorId === factor.id; });
        return (<card_1.Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={function () { return setSelectedFactor(factor); }}>
        <card_1.CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm capitalize">{factor.category}</h4>
                <badge_1.Badge className={(0, utils_1.cn)('text-xs', getSeverityColor(factor.severity))}>
                  {factor.severity}
                </badge_1.Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{factor.description}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{factor.impact}/10</div>
              <div className="text-xs text-muted-foreground">Impact</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Mitigation Status:</span>
              <badge_1.Badge className={(0, utils_1.cn)('text-xs', getMitigationStatusColor(factor.mitigationStatus))}>
                {factor.mitigationStatus.replace('_', ' ')}
              </badge_1.Badge>
            </div>

            {factor.mitigationCost && (<div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Mitigation Cost:</span>
                <span className="text-xs font-medium">KES {factor.mitigationCost.toLocaleString()}</span>
              </div>)}

            {relatedInteractions.length > 0 && (<div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Interactions:</span>
                <span className="text-xs font-medium">{relatedInteractions.length}</span>
              </div>)}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <lucide_react_1.Eye className="h-3 w-3"/>
              View Details
            </div>
            <lucide_react_1.ChevronRight className="h-4 w-4 text-muted-foreground"/>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    };
    var InteractionCard = function (_a) {
        var interaction = _a.interaction;
        var primaryFactor = riskFactors.find(function (f) { return f.id === interaction.primaryFactorId; });
        var secondaryFactor = riskFactors.find(function (f) { return f.id === interaction.secondaryFactorId; });
        if (!primaryFactor || !secondaryFactor)
            return null;
        return (<card_1.Card>
        <card_1.CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <badge_1.Badge variant="outline" className="capitalize text-xs">
              {interaction.interactionType}
            </badge_1.Badge>
            <div className="flex items-center gap-1">
              {interaction.impactMultiplier > 1 ? (<lucide_react_1.TrendingUp className="h-4 w-4 text-red-600"/>) : (<lucide_react_1.TrendingDown className="h-4 w-4 text-green-600"/>)}
              <span className="text-sm font-medium">
                {interaction.impactMultiplier.toFixed(1)}x
              </span>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="text-sm">
              <span className="font-medium">{primaryFactor.category}</span>
              <span className="text-muted-foreground"> → </span>
              <span className="font-medium">{secondaryFactor.category}</span>
            </div>
            <p className="text-sm text-muted-foreground">{interaction.description}</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Confidence:</span>
            <div className="flex items-center gap-2">
              <progress_1.Progress value={interaction.confidence * 100} className="h-1 w-16"/>
              <span className="text-xs font-medium">
                {Math.round(interaction.confidence * 100)}%
              </span>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    };
    var FactorDetailModal = function (_a) {
        var factor = _a.factor;
        return (<card_1.Card>
      <card_1.CardHeader>
        <div className="flex items-center justify-between">
          <card_1.CardTitle className="capitalize">{factor.category} Risk Factor</card_1.CardTitle>
          <button_1.Button variant="ghost" size="sm" onClick={function () { return setSelectedFactor(null); }}>
            ×
          </button_1.Button>
        </div>
      </card_1.CardHeader>
      <card_1.CardContent className="space-y-4">
        <div>
          <label_1.Label className="text-sm font-medium">Description</label_1.Label>
          <p className="text-sm text-muted-foreground mt-1">{factor.description}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label_1.Label className="text-sm font-medium">Severity</label_1.Label>
            <badge_1.Badge className={(0, utils_1.cn)('mt-1', getSeverityColor(factor.severity))}>
              {factor.severity}
            </badge_1.Badge>
          </div>
          <div>
            <label_1.Label className="text-sm font-medium">Impact Score</label_1.Label>
            <div className="mt-1">
              <progress_1.Progress value={factor.impact * 10} className="h-2"/>
              <span className="text-sm font-medium">{factor.impact}/10</span>
            </div>
          </div>
        </div>

        <div>
          <label_1.Label className="text-sm font-medium">Mitigation Status</label_1.Label>
          <div className="mt-1">
            <badge_1.Badge className={(0, utils_1.cn)('text-xs', getMitigationStatusColor(factor.mitigationStatus))}>
              {factor.mitigationStatus.replace('_', ' ')}
            </badge_1.Badge>
          </div>
        </div>

        {factor.mitigationCost && (<div>
            <label_1.Label className="text-sm font-medium">Estimated Mitigation Cost</label_1.Label>
            <p className="text-sm font-medium mt-1">KES {factor.mitigationCost.toLocaleString()}</p>
          </div>)}

        {factor.mitigationTimeframe && (<div>
            <label_1.Label className="text-sm font-medium">Mitigation Timeframe</label_1.Label>
            <p className="text-sm text-muted-foreground mt-1">{factor.mitigationTimeframe}</p>
          </div>)}

        <div className="flex gap-2 pt-4 border-t">
          <button_1.Button size="sm" onClick={function () { return onFactorUpdate(factor.id, { mitigationStatus: 'planned' }); }}>
            <lucide_react_1.Edit className="h-4 w-4 mr-2"/>
            Update Status
          </button_1.Button>
          <button_1.Button variant="outline" size="sm">
            View Related Factors
          </button_1.Button>
        </div>
      </card_1.CardContent>
    </card_1.Card>);
    };
    return (<div className={className}>
      {selectedFactor && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <FactorDetailModal factor={selectedFactor}/>
          </div>
        </div>)}

      <card_1.Card>
        <card_1.CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <card_1.CardTitle>Risk Factor Analysis</card_1.CardTitle>
              <card_1.CardDescription>
                Detailed analysis of individual risk factors and their interactions
              </card_1.CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <badge_1.Badge variant="outline">{analytics.total} factors</badge_1.Badge>
              <badge_1.Badge variant="outline">{riskInteractions.length} interactions</badge_1.Badge>
            </div>
          </div>

          {/* Analytics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <card_1.Card>
              <card_1.CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-red-600">{analytics.bySeverity.critical + analytics.bySeverity.high}</div>
                <div className="text-xs text-muted-foreground">High Risk</div>
              </card_1.CardContent>
            </card_1.Card>
            <card_1.Card>
              <card_1.CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-yellow-600">{analytics.bySeverity.medium}</div>
                <div className="text-xs text-muted-foreground">Medium Risk</div>
              </card_1.CardContent>
            </card_1.Card>
            <card_1.Card>
              <card_1.CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-green-600">{analytics.bySeverity.low}</div>
                <div className="text-xs text-muted-foreground">Low Risk</div>
              </card_1.CardContent>
            </card_1.Card>
            <card_1.Card>
              <card_1.CardContent className="p-3 text-center">
                <div className="text-lg font-bold">{analytics.averageImpact.toFixed(1)}/10</div>
                <div className="text-xs text-muted-foreground">Avg Impact</div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </card_1.CardHeader>

        <card_1.CardContent>
          <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
            <tabs_1.TabsList className="grid w-full grid-cols-2">
              <tabs_1.TabsTrigger value="factors">Risk Factors</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="interactions">Interactions</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="factors" className="space-y-4">
              {/* Filters and Search */}
              <card_1.Card>
                <card_1.CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label_1.Label className="text-xs">Search</label_1.Label>
                      <div className="relative">
                        <lucide_react_1.Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"/>
                        <input_1.Input placeholder="Search factors..." value={filters.searchTerm} onChange={function (e) { return setFilters(function (prev) { return (__assign(__assign({}, prev), { searchTerm: e.target.value })); }); }} className="pl-8 h-9"/>
                      </div>
                    </div>

                    <div>
                      <label_1.Label className="text-xs">Category</label_1.Label>
                      <select_1.Select value={filters.category} onValueChange={function (value) { return setFilters(function (prev) { return (__assign(__assign({}, prev), { category: value })); }); }}>
                        <select_1.SelectTrigger className="h-9">
                          <select_1.SelectValue />
                        </select_1.SelectTrigger>
                        <select_1.SelectContent>
                          <select_1.SelectItem value="all">All Categories</select_1.SelectItem>
                          <select_1.SelectItem value="ownership">Ownership</select_1.SelectItem>
                          <select_1.SelectItem value="government">Government</select_1.SelectItem>
                          <select_1.SelectItem value="legal">Legal</select_1.SelectItem>
                          <select_1.SelectItem value="physical">Physical</select_1.SelectItem>
                          <select_1.SelectItem value="community">Community</select_1.SelectItem>
                        </select_1.SelectContent>
                      </select_1.Select>
                    </div>

                    <div>
                      <label_1.Label className="text-xs">Severity</label_1.Label>
                      <select_1.Select value={filters.severity} onValueChange={function (value) { return setFilters(function (prev) { return (__assign(__assign({}, prev), { severity: value })); }); }}>
                        <select_1.SelectTrigger className="h-9">
                          <select_1.SelectValue />
                        </select_1.SelectTrigger>
                        <select_1.SelectContent>
                          <select_1.SelectItem value="all">All Severities</select_1.SelectItem>
                          <select_1.SelectItem value="critical">Critical</select_1.SelectItem>
                          <select_1.SelectItem value="high">High</select_1.SelectItem>
                          <select_1.SelectItem value="medium">Medium</select_1.SelectItem>
                          <select_1.SelectItem value="low">Low</select_1.SelectItem>
                        </select_1.SelectContent>
                      </select_1.Select>
                    </div>

                    <div>
                      <label_1.Label className="text-xs">Mitigation</label_1.Label>
                      <select_1.Select value={filters.mitigationStatus} onValueChange={function (value) { return setFilters(function (prev) { return (__assign(__assign({}, prev), { mitigationStatus: value })); }); }}>
                        <select_1.SelectTrigger className="h-9">
                          <select_1.SelectValue />
                        </select_1.SelectTrigger>
                        <select_1.SelectContent>
                          <select_1.SelectItem value="all">All Status</select_1.SelectItem>
                          <select_1.SelectItem value="none">None</select_1.SelectItem>
                          <select_1.SelectItem value="planned">Planned</select_1.SelectItem>
                          <select_1.SelectItem value="in_progress">In Progress</select_1.SelectItem>
                          <select_1.SelectItem value="completed">Completed</select_1.SelectItem>
                        </select_1.SelectContent>
                      </select_1.Select>
                    </div>

                    <div>
                      <label_1.Label className="text-xs">Sort By</label_1.Label>
                      <div className="flex gap-1">
                        <select_1.Select value={sort.field} onValueChange={function (value) { return setSort(function (prev) { return (__assign(__assign({}, prev), { field: value })); }); }}>
                          <select_1.SelectTrigger className="h-9">
                            <select_1.SelectValue />
                          </select_1.SelectTrigger>
                          <select_1.SelectContent>
                            <select_1.SelectItem value="impact">Impact</select_1.SelectItem>
                            <select_1.SelectItem value="severity">Severity</select_1.SelectItem>
                            <select_1.SelectItem value="category">Category</select_1.SelectItem>
                            <select_1.SelectItem value="mitigationStatus">Mitigation</select_1.SelectItem>
                          </select_1.SelectContent>
                        </select_1.Select>
                        <button_1.Button variant="outline" size="sm" onClick={function () { return setSort(function (prev) { return (__assign(__assign({}, prev), { direction: prev.direction === 'asc' ? 'desc' : 'asc' })); }); }}>
                          {sort.direction === 'asc' ? <lucide_react_1.SortAsc className="h-4 w-4"/> : <lucide_react_1.SortDesc className="h-4 w-4"/>}
                        </button_1.Button>
                      </div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>

              {/* Risk Factors Grid */}
              {filteredAndSortedFactors.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAndSortedFactors.map(function (factor) { return (<RiskFactorCard key={factor.id} factor={factor}/>); })}
                </div>) : (<div className="text-center py-12 text-muted-foreground">
                  <lucide_react_1.Filter className="h-16 w-16 mx-auto mb-4 opacity-50"/>
                  <h3 className="text-lg font-semibold mb-2">No Risk Factors Found</h3>
                  <p>Try adjusting your filters to see more results</p>
                </div>)}
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="interactions" className="space-y-4">
              {riskInteractions.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {riskInteractions.map(function (interaction) { return (<InteractionCard key={interaction.id} interaction={interaction}/>); })}
                </div>) : (<div className="text-center py-12 text-muted-foreground">
                  <lucide_react_1.Target className="h-16 w-16 mx-auto mb-4 opacity-50"/>
                  <h3 className="text-lg font-semibold mb-2">No Risk Interactions</h3>
                  <p>No interactions detected between risk factors</p>
                </div>)}
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
