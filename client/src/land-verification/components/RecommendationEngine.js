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
exports.default = RecommendationEngine;
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var checkbox_1 = require("../../local/components/ui/checkbox");
var progress_1 = require("../../local/components/ui/progress");
var tabs_1 = require("../../local/components/ui/tabs");
var utils_1 = require("../../local/lib/utils");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
function RecommendationEngine(_a) {
    var recommendations = _a.recommendations, riskFactors = _a.riskFactors, onImplementAction = _a.onImplementAction, onDismissRecommendation = _a.onDismissRecommendation, onRequestExpertHelp = _a.onRequestExpertHelp, className = _a.className;
    var _b = (0, react_1.useState)('all'), activeTab = _b[0], setActiveTab = _b[1];
    var _c = (0, react_1.useState)(new Set()), expandedRecommendations = _c[0], setExpandedRecommendations = _c[1];
    var _d = (0, react_1.useState)({}), actionStates = _d[0], setActionStates = _d[1];
    // Group recommendations by priority and category
    var groupedRecommendations = (0, react_1.useMemo)(function () {
        var groups = {
            critical: recommendations.filter(function (r) { return r.priority === 'critical'; }),
            high: recommendations.filter(function (r) { return r.priority === 'high'; }),
            medium: recommendations.filter(function (r) { return r.priority === 'medium'; }),
            low: recommendations.filter(function (r) { return r.priority === 'low'; })
        };
        var byCategory = {
            immediate_action: recommendations.filter(function (r) { return r.category === 'immediate_action'; }),
            investigation: recommendations.filter(function (r) { return r.category === 'investigation'; }),
            monitoring: recommendations.filter(function (r) { return r.category === 'monitoring'; }),
            mitigation: recommendations.filter(function (r) { return r.category === 'mitigation'; })
        };
        return { byPriority: groups, byCategory: byCategory };
    }, [recommendations]);
    // Calculate completion statistics
    var completionStats = (0, react_1.useMemo)(function () {
        var totalActions = recommendations.reduce(function (sum, rec) { return sum + rec.actionItems.length; }, 0);
        var completedActions = Object.values(actionStates).reduce(function (sum, actions) {
            return sum + actions.filter(function (a) { return a.completed; }).length;
        }, 0);
        var inProgressActions = Object.values(actionStates).reduce(function (sum, actions) {
            return sum + actions.filter(function (a) { return a.inProgress; }).length;
        }, 0);
        return {
            total: totalActions,
            completed: completedActions,
            inProgress: inProgressActions,
            completionRate: totalActions > 0 ? (completedActions / totalActions) * 100 : 0
        };
    }, [recommendations, actionStates]);
    var toggleRecommendationExpansion = function (recommendationId) {
        setExpandedRecommendations(function (prev) {
            var newSet = new Set(prev);
            if (newSet.has(recommendationId)) {
                newSet.delete(recommendationId);
            }
            else {
                newSet.add(recommendationId);
                // Initialize action states if not exists
                if (!actionStates[recommendationId]) {
                    var recommendation_1 = recommendations.find(function (r) { return r.id === recommendationId; });
                    if (recommendation_1) {
                        setActionStates(function (prevStates) {
                            var _a;
                            return (__assign(__assign({}, prevStates), (_a = {}, _a[recommendationId] = recommendation_1.actionItems.map(function (item, index) { return ({
                                id: "".concat(recommendationId, "-").concat(index),
                                text: item,
                                completed: false,
                                inProgress: false
                            }); }), _a)));
                        });
                    }
                }
            }
            return newSet;
        });
    };
    var updateActionState = function (recommendationId, actionId, updates) {
        setActionStates(function (prev) {
            var _a;
            var _b;
            return (__assign(__assign({}, prev), (_a = {}, _a[recommendationId] = ((_b = prev[recommendationId]) === null || _b === void 0 ? void 0 : _b.map(function (action) {
                return action.id === actionId ? __assign(__assign({}, action), updates) : action;
            })) || [], _a)));
        });
        if (updates.completed || updates.inProgress) {
            onImplementAction(recommendationId, actionId);
        }
    };
    var getPriorityColor = function (priority) {
        switch (priority) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };
    var getCategoryIcon = function (category) {
        switch (category) {
            case 'immediate_action': return <lucide_react_1.AlertTriangle className="h-4 w-4"/>;
            case 'investigation': return <lucide_react_1.FileText className="h-4 w-4"/>;
            case 'monitoring': return <lucide_react_1.Target className="h-4 w-4"/>;
            case 'mitigation': return <lucide_react_1.CheckCircle className="h-4 w-4"/>;
            default: return <lucide_react_1.Info className="h-4 w-4"/>;
        }
    };
    var RecommendationCard = function (_a) {
        var recommendation = _a.recommendation;
        var isExpanded = expandedRecommendations.has(recommendation.id);
        var actions = actionStates[recommendation.id] || [];
        var completedActions = actions.filter(function (a) { return a.completed; }).length;
        var progressPercentage = actions.length > 0 ? (completedActions / actions.length) * 100 : 0;
        return (<card_1.Card className="hover:shadow-md transition-shadow">
        <card_1.CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getCategoryIcon(recommendation.category)}
                  <h4 className="font-medium text-sm">{recommendation.title}</h4>
                  <badge_1.Badge className={(0, utils_1.cn)('text-xs', getPriorityColor(recommendation.priority))}>
                    {recommendation.priority.toUpperCase()}
                  </badge_1.Badge>
                </div>
                <p className="text-sm text-muted-foreground">{recommendation.description}</p>
              </div>
              <button_1.Button variant="ghost" size="sm" onClick={function () { return toggleRecommendationExpansion(recommendation.id); }}>
                {isExpanded ? <lucide_react_1.X className="h-4 w-4"/> : <lucide_react_1.MoreHorizontal className="h-4 w-4"/>}
              </button_1.Button>
            </div>

            {/* Quick Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {recommendation.estimatedTimeframe && (<div className="flex items-center gap-1">
                  <lucide_react_1.Clock className="h-3 w-3"/>
                  {recommendation.estimatedTimeframe}
                </div>)}
              {recommendation.estimatedCost && (<div className="flex items-center gap-1">
                  <lucide_react_1.DollarSign className="h-3 w-3"/>
                  KES {recommendation.estimatedCost.toLocaleString()}
                </div>)}
              {recommendation.expertRequired && (<div className="flex items-center gap-1">
                  <lucide_react_1.User className="h-3 w-3"/>
                  Expert Required
                </div>)}
            </div>

            {/* Progress Bar */}
            {actions.length > 0 && (<div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{completedActions}/{actions.length} completed</span>
                </div>
                <progress_1.Progress value={progressPercentage} className="h-1"/>
              </div>)}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button_1.Button size="sm" onClick={function () { return toggleRecommendationExpansion(recommendation.id); }}>
                {isExpanded ? 'Collapse' : 'View Actions'}
              </button_1.Button>
              {recommendation.expertRequired && (<button_1.Button variant="outline" size="sm" onClick={function () { return onRequestExpertHelp(recommendation.id); }}>
                  <lucide_react_1.Phone className="h-4 w-4 mr-1"/>
                  Get Expert Help
                </button_1.Button>)}
              <button_1.Button variant="ghost" size="sm" onClick={function () { return onDismissRecommendation(recommendation.id); }}>
                Dismiss
              </button_1.Button>
            </div>

            {/* Expanded Content */}
            {isExpanded && (<div className="space-y-4 pt-3 border-t">
                {/* Action Items */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Action Items</h5>
                  <div className="space-y-2">
                    {actions.map(function (action) { return (<div key={action.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded">
                        <checkbox_1.Checkbox checked={action.completed} onCheckedChange={function (checked) {
                        return updateActionState(recommendation.id, action.id, {
                            completed: !!checked,
                            inProgress: false
                        });
                    }}/>
                        <div className="flex-1">
                          <p className={(0, utils_1.cn)('text-sm', action.completed && 'line-through text-muted-foreground')}>
                            {action.text}
                          </p>
                          {action.estimatedTime && (<p className="text-xs text-muted-foreground">
                              Estimated time: {action.estimatedTime}
                            </p>)}
                        </div>
                        <div className="flex items-center gap-1">
                          {action.inProgress && (<badge_1.Badge variant="outline" className="text-xs">
                              In Progress
                            </badge_1.Badge>)}
                          <button_1.Button variant="ghost" size="sm" onClick={function () {
                        return updateActionState(recommendation.id, action.id, {
                            inProgress: !action.inProgress,
                            completed: false
                        });
                    }}>
                            {action.inProgress ? <lucide_react_1.Pause className="h-3 w-3"/> : <lucide_react_1.Play className="h-3 w-3"/>}
                          </button_1.Button>
                        </div>
                      </div>); })}
                  </div>
                </div>

                {/* Legal Implications */}
                {recommendation.legalImplications && (<alert_1.Alert>
                    <lucide_react_1.AlertTriangle className="h-4 w-4"/>
                    <alert_1.AlertDescription>
                      <strong>Legal Considerations:</strong> {recommendation.legalImplications}
                    </alert_1.AlertDescription>
                  </alert_1.Alert>)}

                {/* Cost Breakdown */}
                {recommendation.estimatedCost && (<div className="bg-muted/50 rounded p-3">
                    <h6 className="text-sm font-medium mb-1">Cost Estimate</h6>
                    <div className="text-lg font-bold">KES {recommendation.estimatedCost.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      This is an estimated cost. Actual costs may vary based on specific circumstances.
                    </p>
                  </div>)}
              </div>)}
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    };
    var filteredRecommendations = (0, react_1.useMemo)(function () {
        switch (activeTab) {
            case 'critical':
                return groupedRecommendations.byPriority.critical;
            case 'high':
                return groupedRecommendations.byPriority.high;
            case 'medium':
                return groupedRecommendations.byPriority.medium;
            case 'low':
                return groupedRecommendations.byPriority.low;
            case 'immediate':
                return groupedRecommendations.byCategory.immediate_action;
            case 'investigation':
                return groupedRecommendations.byCategory.investigation;
            case 'monitoring':
                return groupedRecommendations.byCategory.monitoring;
            case 'mitigation':
                return groupedRecommendations.byCategory.mitigation;
            default:
                return recommendations;
        }
    }, [activeTab, recommendations, groupedRecommendations]);
    return (<card_1.Card className={className}>
      <card_1.CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <card_1.CardTitle className="flex items-center gap-2">
              <lucide_react_1.Target className="h-5 w-5"/>
              Recommendation Engine
            </card_1.CardTitle>
            <card_1.CardDescription>
              Actionable recommendations based on risk assessment results
            </card_1.CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <badge_1.Badge variant="outline">{recommendations.length} recommendations</badge_1.Badge>
            <badge_1.Badge variant="outline">
              {completionStats.completionRate.toFixed(0)}% complete
            </badge_1.Badge>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{completionStats.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completionStats.inProgress}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{completionStats.total - completionStats.completed - completionStats.inProgress}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
          <progress_1.Progress value={completionStats.completionRate} className="mt-3 h-2"/>
        </div>
      </card_1.CardHeader>

      <card_1.CardContent>
        <tabs_1.Tabs value={activeTab} onValueChange={setActiveTab}>
          <tabs_1.TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            <tabs_1.TabsTrigger value="all">All</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="critical">Critical</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="high">High</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="medium">Medium</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="immediate">Immediate</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="investigation">Investigation</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="monitoring">Monitoring</tabs_1.TabsTrigger>
            <tabs_1.TabsTrigger value="mitigation">Mitigation</tabs_1.TabsTrigger>
          </tabs_1.TabsList>

          <tabs_1.TabsContent value={activeTab} className="space-y-4">
            {filteredRecommendations.length > 0 ? (<div className="space-y-4">
                {filteredRecommendations.map(function (recommendation) { return (<RecommendationCard key={recommendation.id} recommendation={recommendation}/>); })}
              </div>) : (<div className="text-center py-12 text-muted-foreground">
                <lucide_react_1.Target className="h-16 w-16 mx-auto mb-4 opacity-50"/>
                <h3 className="text-lg font-semibold mb-2">No Recommendations</h3>
                <p>No recommendations found for the selected category</p>
              </div>)}
          </tabs_1.TabsContent>
        </tabs_1.Tabs>

        {/* Summary Alert */}
        {groupedRecommendations.byPriority.critical.length > 0 && (<alert_1.Alert className="mt-6">
            <lucide_react_1.AlertTriangle className="h-4 w-4"/>
            <alert_1.AlertDescription>
              <strong>Critical Actions Required:</strong> You have {groupedRecommendations.byPriority.critical.length} critical 
              recommendations that require immediate attention to mitigate significant risks.
            </alert_1.AlertDescription>
          </alert_1.Alert>)}
      </card_1.CardContent>
    </card_1.Card>);
}
