import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  Clock,
  User,
  MapPin,
  DollarSign,
  FileText,
  Network,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  UserCheck,
  Flag
} from 'lucide-react'
import React, { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '../../local/components/ui/avatar'
import { Badge } from '../../local/components/ui/badge'
import { Button } from '../../local/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Checkbox } from '../../local/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../local/components/ui/dropdown-menu'
import { Progress } from '../../local/components/ui/progress'
import { Separator } from '../../local/components/ui/separator'
import { useToast } from '../../local/hooks/use-toast'
import { FraudAlert } from '../hooks/useFraudDetection'

interface FraudAlertsListProps {
  alerts?: FraudAlert[];
  isLoading?: boolean;
  onAlertAction?: (action: string, alert: FraudAlert) => void;
  showBulkActions?: boolean;
  maxHeight?: string;
}

const SEVERITY_CONFIG = {
  critical: { 
    color: 'text-red-600', 
    bgColor: 'bg-red-50 border-red-200', 
    badgeColor: 'bg-red-100 text-red-800',
    icon: AlertTriangle 
  },
  high: { 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-50 border-orange-200', 
    badgeColor: 'bg-orange-100 text-orange-800',
    icon: Flag 
  },
  medium: { 
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-50 border-yellow-200', 
    badgeColor: 'bg-yellow-100 text-yellow-800',
    icon: Eye 
  },
  low: { 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-50 border-blue-200', 
    badgeColor: 'bg-blue-100 text-blue-800',
    icon: Shield 
  }
};

const STATUS_CONFIG = {
  active: { color: 'bg-red-100 text-red-800', label: 'Active' },
  investigating: { color: 'bg-yellow-100 text-yellow-800', label: 'Investigating' },
  resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' },
  dismissed: { color: 'bg-gray-100 text-gray-800', label: 'Dismissed' }
};

export function FraudAlertsList({ 
  alerts = [], 
  isLoading = false, 
  onAlertAction,
  showBulkActions = true,
  maxHeight = "600px"
}: FraudAlertsListProps) {
  const { toast } = useToast();
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const handleSelectAlert = (alertId: string, selected: boolean) => {
    const newSelected = new Set(selectedAlerts);
    if (selected) {
      newSelected.add(alertId);
    } else {
      newSelected.delete(alertId);
    }
    setSelectedAlerts(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedAlerts(new Set(alerts.map(alert => alert.id)));
    } else {
      setSelectedAlerts(new Set());
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedAlerts.size === 0) {
      toast({
        title: "No Alerts Selected",
        description: "Please select one or more alerts to perform bulk actions.",
        variant: "destructive"
      });
      return;
    }

    const selectedAlertObjects = alerts.filter(alert => selectedAlerts.has(alert.id));
    
    selectedAlertObjects.forEach(alert => {
      if (onAlertAction) {
        onAlertAction(action, alert);
      }
    });

    setSelectedAlerts(new Set());
    
    toast({
      title: "Bulk Action Applied",
      description: `${action} applied to ${selectedAlerts.size} alert(s).`,
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const renderAlertCard = (alert: FraudAlert) => {
    const severityConfig = SEVERITY_CONFIG[alert.severity];
    const statusConfig = STATUS_CONFIG[alert.status];
    const SeverityIcon = severityConfig.icon;
    const isExpanded = expandedAlert === alert.id;
    const isSelected = selectedAlerts.has(alert.id);

    return (
      <motion.div
        key={alert.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={`${severityConfig.bgColor} border-l-4 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              {showBulkActions && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) => handleSelectAlert(alert.id, checked as boolean)}
                  className="mt-1"
                />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`p-1 rounded ${severityConfig.bgColor}`}>
                      <SeverityIcon className={`h-4 w-4 ${severityConfig.color}`} />
                    </div>
                    <Badge className={severityConfig.badgeColor}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <Badge className={statusConfig.color}>
                      {statusConfig.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {alert.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(alert.timeframe.detectedAt)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onAlertAction?.('investigate', alert)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Investigate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAlertAction?.('assign', alert)}>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Assign
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAlertAction?.('resolve', alert)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAlertAction?.('dismiss', alert)}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                        <Progress value={alert.confidence} className="h-1" />
                      </div>
                      <span className="text-xs font-medium">{alert.confidence}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                    {alert.propertyId && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3" />
                        <span>Property: {alert.propertyId.slice(-8)}</span>
                      </div>
                    )}
                    {alert.transactionId && (
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>Transaction: {alert.transactionId.slice(-8)}</span>
                      </div>
                    )}
                    {alert.estimatedLoss && (
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-3 w-3" />
                        <span>Loss: KSh {alert.estimatedLoss.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{alert.participants.length} participant(s)</span>
                    </div>
                  </div>

                  {alert.subcategories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {alert.subcategories.slice(0, 3).map((subcategory, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {subcategory.replace('_', ' ')}
                        </Badge>
                      ))}
                      {alert.subcategories.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{alert.subcategories.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {alert.assignedTo && (
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <UserCheck className="h-3 w-3" />
                          <span>Assigned to: {alert.assignedTo}</span>
                        </div>
                      )}
                      {alert.relatedAlerts.length > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <Network className="h-3 w-3" />
                          <span>{alert.relatedAlerts.length} related</span>
                        </div>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                      className="h-6 px-2"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Less
                        </>
                      ) : (
                        <>
                          <ChevronRight className="h-3 w-3 mr-1" />
                          Details
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <div className="space-y-4">
                        {/* Participants */}
                        {alert.participants.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2 text-sm">Participants</h5>
                            <div className="space-y-2">
                              {alert.participants.map((participant, index) => (
                                <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded border">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">
                                      {participant.name.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900">
                                        {participant.name}
                                      </p>
                                      <Badge 
                                        variant={participant.riskScore > 70 ? "destructive" : "outline"}
                                        className="text-xs"
                                      >
                                        Risk: {participant.riskScore}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                                      <span>{participant.role}</span>
                                      <span>•</span>
                                      <span>{participant.type}</span>
                                      <span>•</span>
                                      <span>{participant.previousIncidents} incidents</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Risk Factors */}
                        {alert.riskFactors.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2 text-sm">Risk Factors</h5>
                            <div className="space-y-2">
                              {alert.riskFactors.map((factor, index) => (
                                <div key={index} className="p-2 bg-white rounded border">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-900">
                                      {factor.category}
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-12">
                                        <Progress value={factor.weight} className="h-1" />
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {factor.weight}%
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-600">{factor.description}</p>
                                  {factor.evidence.length > 0 && (
                                    <div className="mt-1">
                                      <div className="flex flex-wrap gap-1">
                                        {factor.evidence.slice(0, 2).map((evidence, evidenceIndex) => (
                                          <Badge key={evidenceIndex} variant="outline" className="text-xs">
                                            {evidence}
                                          </Badge>
                                        ))}
                                        {factor.evidence.length > 2 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{factor.evidence.length - 2} more
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Evidence */}
                        {alert.evidence.length > 0 && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2 text-sm">Evidence</h5>
                            <div className="space-y-2">
                              {alert.evidence.slice(0, 3).map((evidence, index) => (
                                <div key={index} className="p-2 bg-white rounded border">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge variant="outline" className="text-xs">
                                      {evidence.type}
                                    </Badge>
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
                                </div>
                              ))}
                              {alert.evidence.length > 3 && (
                                <div className="text-center">
                                  <Button variant="outline" size="sm" className="text-xs">
                                    View {alert.evidence.length - 3} more evidence items
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {alert.notes && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2 text-sm">Notes</h5>
                            <div className="p-2 bg-white rounded border">
                              <p className="text-xs text-gray-600">{alert.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {showBulkActions && alerts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Checkbox
                  checked={selectedAlerts.size === alerts.length && alerts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">
                  {selectedAlerts.size > 0 ? `${selectedAlerts.size} selected` : 'Select all'}
                </span>
              </div>
              
              {selectedAlerts.size > 0 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('investigate')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Investigate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('resolve')}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('dismiss')}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <div className="space-y-4" style={{ maxHeight, overflowY: 'auto' }}>
        <AnimatePresence>
          {alerts.length > 0 ? (
            alerts.map(alert => renderAlertCard(alert))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Fraud Alerts
                </h3>
                <p className="text-gray-600">
                  No fraud alerts match your current filters. The system is actively monitoring for suspicious activity.
                </p>
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default FraudAlertsList;