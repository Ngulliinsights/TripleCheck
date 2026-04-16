import React, { useState, useCallback, useMemo } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Eye, 
  Search,
  Filter,
  Download,
  RefreshCw,
  MapPin,
  Clock,
  DollarSign,
  User,
  Phone,
  Mail,
  Flag,
  CheckCircle,
  XCircle,
  BarChart3,
  Target,
  Zap
} from 'lucide-react'

import { Button } from '../../shared/components/ui/button'
import { Input } from '../../shared/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Badge } from '../../shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select'
import { useToast } from '../../shared/hooks/use-toast'

interface FraudAlert {
  id: string;
  propertyId: string;
  propertyTitle: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  alertType: 'duplicate' | 'fake-documents' | 'suspicious-pricing' | 'identity-mismatch' | 'location-mismatch';
  description: string;
  detectedAt: Date;
  status: 'active' | 'investigating' | 'resolved' | 'false-positive';
  confidence: number;
  details: {
    location?: string;
    price?: number;
    ownerName?: string;
    contactInfo?: string;
  };
}

interface FraudPattern {
  id: string;
  name: string;
  description: string;
  detectionCount: number;
  successRate: number;
  lastDetected: Date;
  severity: 'low' | 'medium' | 'high';
}

interface FraudStats {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  preventedFraud: number;
  accuracyRate: number;
}

// Mock data
const mockAlerts: FraudAlert[] = [
  {
    id: 'alert-1',
    propertyId: 'prop-123',
    propertyTitle: 'Luxury Villa in Karen',
    riskLevel: 'high',
    alertType: 'duplicate',
    description: 'Property images and description match another listing with different owner',
    detectedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: 'active',
    confidence: 92,
    details: {
      location: 'Karen, Nairobi',
      price: 45000000,
      ownerName: 'John Doe',
      contactInfo: '+254712345678'
    }
  },
  {
    id: 'alert-2',
    propertyId: 'prop-456',
    propertyTitle: 'Modern Apartment in Westlands',
    riskLevel: 'critical',
    alertType: 'fake-documents',
    description: 'Title deed shows signs of digital manipulation and forgery',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    status: 'investigating',
    confidence: 98,
    details: {
      location: 'Westlands, Nairobi',
      price: 15000000,
      ownerName: 'Jane Smith',
      contactInfo: '+254798765432'
    }
  },
  {
    id: 'alert-3',
    propertyId: 'prop-789',
    propertyTitle: 'Family Home in Lavington',
    riskLevel: 'medium',
    alertType: 'suspicious-pricing',
    description: 'Property priced 40% below market average for the area',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    status: 'resolved',
    confidence: 75,
    details: {
      location: 'Lavington, Nairobi',
      price: 18000000,
      ownerName: 'Mike Johnson',
      contactInfo: '+254723456789'
    }
  }
];

const mockPatterns: FraudPattern[] = [
  {
    id: 'pattern-1',
    name: 'Duplicate Listing Detection',
    description: 'Identifies properties listed multiple times with different details',
    detectionCount: 47,
    successRate: 94,
    lastDetected: new Date(Date.now() - 1000 * 60 * 30),
    severity: 'high'
  },
  {
    id: 'pattern-2',
    name: 'Document Forgery Analysis',
    description: 'AI-powered detection of manipulated or fake property documents',
    detectionCount: 23,
    successRate: 98,
    lastDetected: new Date(Date.now() - 1000 * 60 * 60 * 2),
    severity: 'high'
  },
  {
    id: 'pattern-3',
    name: 'Price Anomaly Detection',
    description: 'Flags properties with suspicious pricing patterns',
    detectionCount: 156,
    successRate: 76,
    lastDetected: new Date(Date.now() - 1000 * 60 * 60 * 6),
    severity: 'medium'
  },
  {
    id: 'pattern-4',
    name: 'Identity Verification',
    description: 'Cross-references owner information across multiple databases',
    detectionCount: 89,
    successRate: 91,
    lastDetected: new Date(Date.now() - 1000 * 60 * 60 * 12),
    severity: 'high'
  }
];

const mockStats: FraudStats = {
  totalAlerts: 1247,
  activeAlerts: 23,
  resolvedAlerts: 1198,
  preventedFraud: 156,
  accuracyRate: 94.2
};

const getRiskColor = (level: string) => {
  switch (level) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-red-100 text-red-800';
    case 'investigating':
      return 'bg-yellow-100 text-yellow-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'false-positive':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getAlertTypeIcon = (type: string) => {
  switch (type) {
    case 'duplicate':
      return <Target className="w-4 h-4" />;
    case 'fake-documents':
      return <Shield className="w-4 h-4" />;
    case 'suspicious-pricing':
      return <DollarSign className="w-4 h-4" />;
    case 'identity-mismatch':
      return <User className="w-4 h-4" />;
    case 'location-mismatch':
      return <MapPin className="w-4 h-4" />;
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
};

export default function FraudDetection() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState(mockAlerts);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
      const matchesRisk = filterRisk === 'all' || alert.riskLevel === filterRisk;
      const matchesSearch = !searchQuery || 
        alert.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.details.ownerName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesRisk && matchesSearch;
    });
  }, [alerts, filterStatus, filterRisk, searchQuery]);

  const handleRunScan = useCallback(async () => {
    setIsScanning(true);
    
    try {
      // Simulate fraud detection scan
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add a new mock alert
      const newAlert: FraudAlert = {
        id: `alert-${Date.now()}`,
        propertyId: `prop-${Date.now()}`,
        propertyTitle: 'Suspicious Property Listing',
        riskLevel: 'high',
        alertType: 'duplicate',
        description: 'Newly detected suspicious activity',
        detectedAt: new Date(),
        status: 'active',
        confidence: 89,
        details: {
          location: 'Kilimani, Nairobi',
          price: 25000000,
          ownerName: 'Unknown',
          contactInfo: '+254700000000'
        }
      };

      setAlerts(prev => [newAlert, ...prev]);
      
      toast({
        title: 'Fraud scan completed',
        description: 'New suspicious activity detected. Check the alerts for details.',
      });
    } catch (error) {
      toast({
        title: 'Scan failed',
        description: 'Failed to complete fraud detection scan. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  }, [toast]);

  const handleUpdateAlertStatus = useCallback((alertId: string, newStatus: FraudAlert['status']) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, status: newStatus } : alert
    ));
    
    toast({
      title: 'Alert status updated',
      description: `Alert has been marked as ${newStatus}.`,
    });
  }, [toast]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500" />
            Fraud Detection System
          </h1>
          <p className="text-muted-foreground">
            AI-powered fraud detection and prevention for property listings
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{mockStats.totalAlerts}</div>
                  <div className="text-xs text-muted-foreground">Total Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold">{mockStats.activeAlerts}</div>
                  <div className="text-xs text-muted-foreground">Active Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{mockStats.resolvedAlerts}</div>
                  <div className="text-xs text-muted-foreground">Resolved</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{mockStats.preventedFraud}</div>
                  <div className="text-xs text-muted-foreground">Fraud Prevented</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{mockStats.accuracyRate}%</div>
                  <div className="text-xs text-muted-foreground">Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Controls */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fraud Alerts</CardTitle>
                  <Button
                    onClick={handleRunScan}
                    disabled={isScanning}
                    className="flex items-center gap-2"
                  >
                    {isScanning ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {isScanning ? 'Scanning...' : 'Run Fraud Scan'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search alerts, properties, or owners..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="false-positive">False Positive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterRisk} onValueChange={setFilterRisk}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk Levels</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Alerts List */}
            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No alerts found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || filterStatus !== 'all' || filterRisk !== 'all' 
                        ? 'Try adjusting your search or filters.'
                        : 'No fraud alerts detected. Your system is secure!'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredAlerts.map((alert) => (
                  <Card 
                    key={alert.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedAlert?.id === alert.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full ${getRiskColor(alert.riskLevel)}`}>
                          {getAlertTypeIcon(alert.alertType)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg">{alert.propertyTitle}</h3>
                              <p className="text-sm text-muted-foreground">
                                Property ID: {alert.propertyId}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getRiskColor(alert.riskLevel)}>
                                {alert.riskLevel.toUpperCase()}
                              </Badge>
                              <Badge className={getStatusColor(alert.status)}>
                                {alert.status}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-gray-700 mb-3">
                            {alert.description}
                          </p>

                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {alert.details.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                KES {alert.details.price?.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {alert.details.ownerName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>Confidence: {alert.confidence}%</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(alert.detectedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selected Alert Details */}
            {selectedAlert && (
              <Card>
                <CardHeader>
                  <CardTitle>Alert Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">{selectedAlert.propertyTitle}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {selectedAlert.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Risk Level:</span>
                      <Badge className={getRiskColor(selectedAlert.riskLevel)}>
                        {selectedAlert.riskLevel}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span className="font-medium">{selectedAlert.confidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Detected:</span>
                      <span>{formatTime(selectedAlert.detectedAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner:</span>
                      <span>{selectedAlert.details.ownerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Contact:</span>
                      <span>{selectedAlert.details.contactInfo}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleUpdateAlertStatus(selectedAlert.id, 'investigating')}
                      disabled={selectedAlert.status === 'investigating'}
                    >
                      Start Investigation
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleUpdateAlertStatus(selectedAlert.id, 'resolved')}
                      disabled={selectedAlert.status === 'resolved'}
                    >
                      Mark Resolved
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={() => handleUpdateAlertStatus(selectedAlert.id, 'false-positive')}
                    >
                      False Positive
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detection Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Detection Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPatterns.map((pattern) => (
                    <div key={pattern.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{pattern.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {pattern.successRate}% accuracy
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {pattern.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{pattern.detectionCount} detections</span>
                        <span>{formatTime(pattern.lastDetected)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Flag className="w-4 h-4 mr-2" />
                  Report Fraud
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Patterns
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}