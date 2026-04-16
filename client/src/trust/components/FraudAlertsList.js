"use strict";
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
exports.FraudAlertsList = FraudAlertsList;
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var avatar_1 = require("../../local/components/ui/avatar");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var checkbox_1 = require("../../local/components/ui/checkbox");
var dropdown_menu_1 = require("../../local/components/ui/dropdown-menu");
var progress_1 = require("../../local/components/ui/progress");
var use_toast_1 = require("../../local/hooks/use-toast");
var SEVERITY_CONFIG = {
    critical: {
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        badgeColor: 'bg-red-100 text-red-800',
        icon: lucide_react_1.AlertTriangle
    },
    high: {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 border-orange-200',
        badgeColor: 'bg-orange-100 text-orange-800',
        icon: lucide_react_1.Flag
    },
    medium: {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        icon: lucide_react_1.Eye
    },
    low: {
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-800',
        icon: lucide_react_1.Shield
    }
};
var STATUS_CONFIG = {
    active: { color: 'bg-red-100 text-red-800', label: 'Active' },
    investigating: { color: 'bg-yellow-100 text-yellow-800', label: 'Investigating' },
    resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
    dismissed: { color: 'bg-gray-100 text-gray-800', label: 'Dismissed' }
};
function FraudAlertsList(_a) {
    var _b = _a.alerts, alerts = _b === void 0 ? [] : _b, _c = _a.isLoading, isLoading = _c === void 0 ? false : _c, onAlertAction = _a.onAlertAction, _d = _a.showBulkActions, showBulkActions = _d === void 0 ? true : _d, _e = _a.maxHeight, maxHeight = _e === void 0 ? "600px" : _e;
    var toast = (0, use_toast_1.useToast)().toast;
    var _f = (0, react_1.useState)(new Set()), selectedAlerts = _f[0], setSelectedAlerts = _f[1];
    var _g = (0, react_1.useState)(null), expandedAlert = _g[0], setExpandedAlert = _g[1];
    var handleSelectAlert = function (alertId, selected) {
        var newSelected = new Set(selectedAlerts);
        if (selected) {
            newSelected.add(alertId);
        }
        else {
            newSelected.delete(alertId);
        }
        setSelectedAlerts(newSelected);
    };
    var handleSelectAll = function (selected) {
        if (selected) {
            setSelectedAlerts(new Set(alerts.map(function (alert) { return alert.id; })));
        }
        else {
            setSelectedAlerts(new Set());
        }
    };
    var handleBulkAction = function (action) {
        if (selectedAlerts.size === 0) {
            toast({
                title: "No Alerts Selected",
                description: "Please select one or more alerts to perform bulk actions.",
                variant: "destructive"
            });
            return;
        }
        var selectedAlertObjects = alerts.filter(function (alert) { return selectedAlerts.has(alert.id); });
        selectedAlertObjects.forEach(function (alert) {
            if (onAlertAction) {
                onAlertAction(action, alert);
            }
        });
        setSelectedAlerts(new Set());
        toast({
            title: "Bulk Action Applied",
            description: "".concat(action, " applied to ").concat(selectedAlerts.size, " alert(s)."),
        });
    };
    var formatTimeAgo = function (date) {
        var now = new Date();
        var diffMs = now.getTime() - new Date(date).getTime();
        var diffMins = Math.floor(diffMs / 60000);
        var diffHours = Math.floor(diffMs / 3600000);
        var diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 60)
            return "".concat(diffMins, "m ago");
        if (diffHours < 24)
            return "".concat(diffHours, "h ago");
        return "".concat(diffDays, "d ago");
    };
    var renderAlertCard = function (alert) {
        var severityConfig = SEVERITY_CONFIG[alert.severity];
        var statusConfig = STATUS_CONFIG[alert.status];
        var SeverityIcon = severityConfig.icon;
        var isExpanded = expandedAlert === alert.id;
        var isSelected = selectedAlerts.has(alert.id);
        return (<framer_motion_1.motion.div key={alert.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
        <card_1.Card className={"".concat(severityConfig.bgColor, " border-l-4 ").concat(isSelected ? 'ring-2 ring-blue-500' : '')}>
          <card_1.CardContent className="p-4">
            <div className="flex items-start space-x-4">
              {showBulkActions && (<checkbox_1.Checkbox checked={isSelected} onCheckedChange={function (checked) { return handleSelectAlert(alert.id, checked); }} className="mt-1"/>)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={"p-1 rounded ".concat(severityConfig.bgColor)}>
                      <SeverityIcon className={"h-4 w-4 ".concat(severityConfig.color)}/>
                    </div>
                    <badge_1.Badge className={severityConfig.badgeColor}>
                      {alert.severity.toUpperCase()}
                    </badge_1.Badge>
                    <badge_1.Badge className={statusConfig.color}>
                      {statusConfig.label}
                    </badge_1.Badge>
                    <badge_1.Badge variant="outline" className="text-xs">
                      {alert.category.replace('_', ' ')}
                    </badge_1.Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(alert.timeframe.detectedAt)}
                    </span>
                    <dropdown_menu_1.DropdownMenu>
                      <dropdown_menu_1.DropdownMenuTrigger asChild>
                        <button_1.Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <lucide_react_1.MoreHorizontal className="h-4 w-4"/>
                        </button_1.Button>
                      </dropdown_menu_1.DropdownMenuTrigger>
                      <dropdown_menu_1.DropdownMenuContent align="end">
                        <dropdown_menu_1.DropdownMenuItem onClick={function () { return onAlertAction === null || onAlertAction === void 0 ? void 0 : onAlertAction('investigate', alert); }}>
                          <lucide_react_1.Eye className="h-4 w-4 mr-2"/>
                          Investigate
                        </dropdown_menu_1.DropdownMenuItem>
                        <dropdown_menu_1.DropdownMenuItem onClick={function () { return onAlertAction === null || onAlertAction === void 0 ? void 0 : onAlertAction('assign', alert); }}>
                          <lucide_react_1.UserCheck className="h-4 w-4 mr-2"/>
                          Assign
                        </dropdown_menu_1.DropdownMenuItem>
                        <dropdown_menu_1.DropdownMenuItem onClick={function () { return onAlertAction === null || onAlertAction === void 0 ? void 0 : onAlertAction('resolve', alert); }}>
                          <lucide_react_1.CheckCircle className="h-4 w-4 mr-2"/>
                          Resolve
                        </dropdown_menu_1.DropdownMenuItem>
                        <dropdown_menu_1.DropdownMenuItem onClick={function () { return onAlertAction === null || onAlertAction === void 0 ? void 0 : onAlertAction('dismiss', alert); }}>
                          <lucide_react_1.XCircle className="h-4 w-4 mr-2"/>
                          Dismiss
                        </dropdown_menu_1.DropdownMenuItem>
                      </dropdown_menu_1.DropdownMenuContent>
                    </dropdown_menu_1.DropdownMenu>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Alert ID: {alert.id}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Confidence:</span>
                      <div className="w-16">
                        <progress_1.Progress value={alert.confidence} className="h-1"/>
                      </div>
                      <span className="text-xs font-medium">{alert.confidence}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                    {alert.propertyId && (<div className="flex items-center space-x-1">
                        <lucide_react_1.MapPin className="h-3 w-3"/>
                        <span>Property: {alert.propertyId.slice(-8)}</span>
                      </div>)}
                    {alert.transactionId && (<div className="flex items-center space-x-1">
                        <lucide_react_1.FileText className="h-3 w-3"/>
                        <span>Transaction: {alert.transactionId.slice(-8)}</span>
                      </div>)}
                    {alert.estimatedLoss && (<div className="flex items-center space-x-1">
                        <lucide_react_1.DollarSign className="h-3 w-3"/>
                        <span>Loss: KSh {alert.estimatedLoss.toLocaleString()}</span>
                      </div>)}
                    <div className="flex items-center space-x-1">
                      <lucide_react_1.User className="h-3 w-3"/>
                      <span>{alert.participants.length} participant(s)</span>
                    </div>
                  </div>

                  {alert.subcategories.length > 0 && (<div className="flex flex-wrap gap-1">
                      {alert.subcategories.slice(0, 3).map(function (subcategory, index) { return (<badge_1.Badge key={index} variant="outline" className="text-xs">
                          {subcategory.replace('_', ' ')}
                        </badge_1.Badge>); })}
                      {alert.subcategories.length > 3 && (<badge_1.Badge variant="outline" className="text-xs">
                          +{alert.subcategories.length - 3} more
                        </badge_1.Badge>)}
                    </div>)}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {alert.assignedTo && (<div className="flex items-center space-x-1 text-xs text-gray-600">
                          <lucide_react_1.UserCheck className="h-3 w-3"/>
                          <span>Assigned to: {alert.assignedTo}</span>
                        </div>)}
                      {alert.relatedAlerts.length > 0 && (<div className="flex items-center space-x-1 text-xs text-gray-600">
                          <lucide_react_1.Network className="h-3 w-3"/>
                          <span>{alert.relatedAlerts.length} related</span>
                        </div>)}
                    </div>
                    
                    <button_1.Button variant="ghost" size="sm" onClick={function () { return setExpandedAlert(isExpanded ? null : alert.id); }} className="h-6 px-2">
                      {isExpanded ? (<>
                          <lucide_react_1.ChevronDown className="h-3 w-3 mr-1"/>
                          Less
                        </>) : (<>
                          <lucide_react_1.ChevronRight className="h-3 w-3 mr-1"/>
                          Details
                        </>)}
                    </button_1.Button>
                  </div>
                </div>

                <framer_motion_1.AnimatePresence>
                  {isExpanded && (<framer_motion_1.motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-4">
                        {/* Participants */}
                        {alert.participants.length > 0 && (<div>
                            <h5 className="font-medium text-gray-900 mb-2 text-sm">Participants</h5>
                            <div className="space-y-2">
                              {alert.participants.map(function (participant, index) { return (<div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                                  <avatar_1.Avatar className="h-8 w-8">
                                    <avatar_1.AvatarFallback className="text-xs">
                                      {participant.name.split(' ').map(function (n) { return n[0]; }).join('')}
                                    </avatar_1.AvatarFallback>
                                  </avatar_1.Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900">
                                        {participant.name}
                                      </p>
                                      <badge_1.Badge variant={participant.riskScore > 70 ? "destructive" : "outline"} className="text-xs">
                                        Risk: {participant.riskScore}
                                      </badge_1.Badge>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                      <span>{participant.role}</span>
                                      <span>•</span>
                                      <span>{participant.type}</span>
                                      <span>•</span>
                                      <span>{participant.previousIncidents} incidents</span>
                                    </div>
                                  </div>
                                </div>); })}
                            </div>
                          </div>)}

                        {/* Risk Factors */}
                        {alert.riskFactors.length > 0 && (<div>
                            <h5 className="font-medium text-gray-900 mb-2 text-sm">Risk Factors</h5>
                            <div className="space-y-2">
                              {alert.riskFactors.map(function (factor, index) { return (<div key={index} className="p-2 bg-white rounded border">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      {factor.category}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-12">
                                        <progress_1.Progress value={factor.weight} className="h-1"/>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {factor.weight}%
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600">{factor.description}</p>
                                  {factor.evidence.length > 0 && (<div className="mt-1">
                                      <div className="flex flex-wrap gap-1">
                                        {factor.evidence.slice(0, 2).map(function (evidence, evidenceIndex) { return (<badge_1.Badge key={evidenceIndex} variant="outline" className="text-xs">
                                            {evidence}
                                          </badge_1.Badge>); })}
                                        {factor.evidence.length > 2 && (<badge_1.Badge variant="outline" className="text-xs">
                                            +{factor.evidence.length - 2} more
                                          </badge_1.Badge>)}
                                      </div>
                                    </div>)}
                                </div>); })}
                            </div>
                          </div>)}

                        {/* Evidence */}
                        {alert.evidence.length > 0 && (<div>
                            <h5 className="font-medium text-gray-900 mb-2 text-sm">Evidence</h5>
                            <div className="space-y-2">
                              {alert.evidence.slice(0, 3).map(function (evidence, index) { return (<div key={index} className="p-2 bg-white rounded border">
                                  <div className="flex items-center justify-between mb-1">
                                    <badge_1.Badge variant="outline" className="text-xs">
                                      {evidence.type}
                                    </badge_1.Badge>
                                    <span className="text-xs text-gray-500">
                                      {new Date(evidence.timestamp).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-900 font-medium">
                                    {evidence.source}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {evidence.description}
                                  </p>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-500">
                                      Confidence: {evidence.confidence}%
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">
                                      {evidence.hash.slice(0, 8)}...
                                    </span>
                                  </div>
                                </div>); })}
                              {alert.evidence.length > 3 && (<div className="text-center">
                                  <button_1.Button variant="outline" size="sm" className="text-xs">
                                    View {alert.evidence.length - 3} more evidence items
                                  </button_1.Button>
                                </div>)}
                            </div>
                          </div>)}

                        {/* Notes */}
                        {alert.notes && (<div>
                            <h5 className="font-medium text-gray-900 mb-2 text-sm">Notes</h5>
                            <div className="p-2 bg-white rounded border">
                              <p className="text-xs text-gray-600">{alert.notes}</p>
                            </div>
                          </div>)}
                      </div>
                    </framer_motion_1.motion.div>)}
                </framer_motion_1.AnimatePresence>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </framer_motion_1.motion.div>);
    };
    if (isLoading) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="space-y-4">
            {__spreadArray([], Array(3), true).map(function (_, i) { return (<div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>); })}
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    return (<div className="space-y-4">
      {/* Bulk Actions */}
      {showBulkActions && alerts.length > 0 && (<card_1.Card>
          <card_1.CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <checkbox_1.Checkbox checked={selectedAlerts.size === alerts.length && alerts.length > 0} onCheckedChange={handleSelectAll}/>
                <span className="text-sm text-gray-600">
                  {selectedAlerts.size > 0 ? "".concat(selectedAlerts.size, " selected") : 'Select all'}
                </span>
              </div>
              
              {selectedAlerts.size > 0 && (<div className="flex items-center space-x-2">
                  <button_1.Button variant="outline" size="sm" onClick={function () { return handleBulkAction('investigate'); }}>
                    <lucide_react_1.Eye className="h-4 w-4 mr-1"/>
                    Investigate
                  </button_1.Button>
                  <button_1.Button variant="outline" size="sm" onClick={function () { return handleBulkAction('resolve'); }}>
                    <lucide_react_1.CheckCircle className="h-4 w-4 mr-1"/>
                    Resolve
                  </button_1.Button>
                  <button_1.Button variant="outline" size="sm" onClick={function () { return handleBulkAction('dismiss'); }}>
                    <lucide_react_1.XCircle className="h-4 w-4 mr-1"/>
                    Dismiss
                  </button_1.Button>
                </div>)}
            </div>
          </card_1.CardContent>
        </card_1.Card>)}

      {/* Alerts List */}
      <div className="space-y-4" style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
        <framer_motion_1.AnimatePresence>
          {alerts.length > 0 ? (alerts.map(function (alert) { return renderAlertCard(alert); })) : (<card_1.Card>
              <card_1.CardContent className="p-8 text-center">
                <lucide_react_1.Shield className="h-12 w-12 text-gray-300 mx-auto mb-4"/>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Fraud Alerts
                </h3>
                <p className="text-gray-600">
                  No fraud alerts match your current filters. The system is actively monitoring for suspicious activity.
                </p>
              </card_1.CardContent>
            </card_1.Card>)}
        </framer_motion_1.AnimatePresence>
      </div>
    </div>);
}
exports.default = FraudAlertsList;
