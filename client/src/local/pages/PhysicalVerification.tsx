import React, { useState, useCallback, useMemo } from 'react'
import { 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Camera,
  CheckCircle,
  AlertTriangle,
  Phone,
  Mail,
  Navigation,
  FileText,
  Shield,
  Star,
  Eye,
  Download,
  Upload
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { useToast } from '../hooks/use-toast'
import { getVerificationStatusColor } from '../utils/generic-formatters'

interface VerificationRequest {
  id: string;
  propertyId: string;
  propertyAddress: string;
  requestType: 'inspection' | 'survey' | 'documentation' | 'compliance';
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduledDate?: Date;
  assignedInspector?: Inspector;
  requestedBy: string;
  createdAt: Date;
  completedAt?: Date;
  notes: string;
  findings?: VerificationFindings;
}

interface Inspector {
  id: string;
  name: string;
  specialization: string[];
  rating: number;
  completedInspections: number;
  phone: string;
  email: string;
  location: string;
  availability: 'available' | 'busy' | 'unavailable';
}

interface VerificationFindings {
  overallStatus: 'passed' | 'failed' | 'conditional';
  issues: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  photos: string[];
  documents: string[];
  inspectorNotes: string;
  nextSteps: string[];
}

interface NewRequestForm {
  propertyAddress: string;
  requestType: string;
  priority: string;
  preferredDate: string;
  preferredTime: string;
  specialRequirements: string;
  contactPhone: string;
  contactEmail: string;
}

// Mock data
const mockRequests: VerificationRequest[] = [
  {
    id: 'req-1',
    propertyId: 'prop-123',
    propertyAddress: '123 Westlands Road, Nairobi',
    requestType: 'inspection',
    status: 'completed',
    priority: 'medium',
    scheduledDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    assignedInspector: {
      id: 'insp-1',
      name: 'John Mwangi',
      specialization: ['Building Inspection', 'Safety Compliance'],
      rating: 4.8,
      completedInspections: 156,
      phone: '+254712345678',
      email: 'john@inspectors.co.ke',
      location: 'Nairobi',
      availability: 'available'
    },
    requestedBy: 'current-user',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
    notes: 'Standard building inspection for property purchase',
    findings: {
      overallStatus: 'conditional',
      issues: [
        {
          category: 'Electrical',
          severity: 'medium',
          description: 'Some electrical outlets need updating to current standards',
          recommendation: 'Hire certified electrician for updates'
        },
        {
          category: 'Plumbing',
          severity: 'low',
          description: 'Minor leak in kitchen faucet',
          recommendation: 'Replace faucet washer'
        }
      ],
      photos: ['/inspection-photo-1.jpg', '/inspection-photo-2.jpg'],
      documents: ['/inspection-report.pdf'],
      inspectorNotes: 'Overall structure is sound. Minor issues noted above.',
      nextSteps: ['Address electrical updates', 'Fix plumbing leak', 'Schedule follow-up inspection']
    }
  },
  {
    id: 'req-2',
    propertyId: 'prop-456',
    propertyAddress: '456 Karen Close, Nairobi',
    requestType: 'survey',
    status: 'scheduled',
    priority: 'high',
    scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    assignedInspector: {
      id: 'insp-2',
      name: 'Sarah Wanjiku',
      specialization: ['Land Survey', 'Boundary Verification'],
      rating: 4.9,
      completedInspections: 203,
      phone: '+254798765432',
      email: 'sarah@surveyors.co.ke',
      location: 'Nairobi',
      availability: 'busy'
    },
    requestedBy: 'current-user',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    notes: 'Boundary dispute resolution survey'
  }
];

const mockInspectors: Inspector[] = [
  {
    id: 'insp-1',
    name: 'John Mwangi',
    specialization: ['Building Inspection', 'Safety Compliance'],
    rating: 4.8,
    completedInspections: 156,
    phone: '+254712345678',
    email: 'john@inspectors.co.ke',
    location: 'Nairobi',
    availability: 'available'
  },
  {
    id: 'insp-2',
    name: 'Sarah Wanjiku',
    specialization: ['Land Survey', 'Boundary Verification'],
    rating: 4.9,
    completedInspections: 203,
    phone: '+254798765432',
    email: 'sarah@surveyors.co.ke',
    location: 'Nairobi',
    availability: 'busy'
  },
  {
    id: 'insp-3',
    name: 'David Kimani',
    specialization: ['Structural Assessment', 'Code Compliance'],
    rating: 4.7,
    completedInspections: 134,
    phone: '+254723456789',
    email: 'david@structural.co.ke',
    location: 'Nairobi',
    availability: 'available'
  }
];

export default function PhysicalVerification() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'requests' | 'new' | 'inspectors'>('requests');
  const [requests] = useState(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  
  const [newRequestForm, setNewRequestForm] = useState<NewRequestForm>({
    propertyAddress: '',
    requestType: '',
    priority: 'medium',
    preferredDate: '',
    preferredTime: '',
    specialRequirements: '',
    contactPhone: '',
    contactEmail: ''
  });

  const updateNewRequestForm = useCallback(<K extends keyof NewRequestForm>(
    key: K,
    value: NewRequestForm[K]
  ) => {
    setNewRequestForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmitRequest = useCallback(async () => {
    if (!newRequestForm.propertyAddress || !newRequestForm.requestType) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in property address and request type.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'Verification request submitted',
        description: 'Your physical verification request has been submitted. An inspector will be assigned soon.',
      });

      setNewRequestForm({
        propertyAddress: '',
        requestType: '',
        priority: 'medium',
        preferredDate: '',
        preferredTime: '',
        specialRequirements: '',
        contactPhone: '',
        contactEmail: ''
      });
      setShowNewRequestForm(false);
    } catch (error) {
      toast({
        title: 'Failed to submit request',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
  }, [newRequestForm, toast]);


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-500" />
            Physical Verification
          </h1>
          <p className="text-muted-foreground">
            Schedule on-ground property inspections with certified experts
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <Button
            variant={activeTab === 'requests' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('requests')}
          >
            My Requests
          </Button>
          <Button
            variant={activeTab === 'new' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('new')}
          >
            New Request
          </Button>
          <Button
            variant={activeTab === 'inspectors' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('inspectors')}
          >
            Inspectors
          </Button>
        </div>

        {activeTab === 'requests' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Requests List */}
            <div className="space-y-4">
              {requests.map((request) => (
                <Card 
                  key={request.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedRequest?.id === request.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{request.propertyAddress}</h3>
                        <p className="text-sm text-muted-foreground capitalize">
                          {request.requestType} • {request.requestedBy}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={getVerificationStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {formatDate(request.createdAt)}</span>
                      </div>
                      
                      {request.scheduledDate && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Scheduled: {formatDate(request.scheduledDate)}</span>
                        </div>
                      )}

                      {request.assignedInspector && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Inspector: {request.assignedInspector.name}</span>
                        </div>
                      )}
                    </div>

                    {request.notes && (
                      <p className="text-sm mt-3 p-2 bg-muted rounded">
                        {request.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Request Details */}
            <div>
              {selectedRequest ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Request Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Property Information</h4>
                      <p className="text-sm">{selectedRequest.propertyAddress}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {selectedRequest.propertyId}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Request Details</h4>
                      <div className="space-y-1 text-sm">
                        <p>Type: <span className="capitalize">{selectedRequest.requestType}</span></p>
                        <p>Priority: <span className="capitalize">{selectedRequest.priority}</span></p>
                        <p>Status: <span className="capitalize">{selectedRequest.status}</span></p>
                      </div>
                    </div>

                    {selectedRequest.assignedInspector && (
                      <div>
                        <h4 className="font-semibold mb-2">Assigned Inspector</h4>
                        <div className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{selectedRequest.assignedInspector.name}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500" />
                              <span className="text-sm">{selectedRequest.assignedInspector.rating}</span>
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Specialization: {selectedRequest.assignedInspector.specialization.join(', ')}</p>
                            <p>Completed: {selectedRequest.assignedInspector.completedInspections} inspections</p>
                            <div className="flex gap-4 mt-2">
                              <Button size="sm" variant="outline">
                                <Phone className="w-4 h-4 mr-2" />
                                Call
                              </Button>
                              <Button size="sm" variant="outline">
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedRequest.findings && (
                      <div>
                        <h4 className="font-semibold mb-2">Inspection Results</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span>Overall Status:</span>
                            <Badge className={
                              selectedRequest.findings.overallStatus === 'passed' ? 'bg-green-100 text-green-800' :
                              selectedRequest.findings.overallStatus === 'conditional' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {selectedRequest.findings.overallStatus}
                            </Badge>
                          </div>

                          {selectedRequest.findings.issues.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">Issues Found:</h5>
                              <div className="space-y-2">
                                {selectedRequest.findings.issues.map((issue, index) => (
                                  <div key={index} className="p-2 border rounded text-sm">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">{issue.category}</span>
                                      <Badge variant="outline" className={
                                        issue.severity === 'high' ? 'text-red-600' :
                                        issue.severity === 'medium' ? 'text-yellow-600' :
                                        'text-green-600'
                                      }>
                                        {issue.severity}
                                      </Badge>
                                    </div>
                                    <p className="text-muted-foreground mb-1">{issue.description}</p>
                                    <p className="text-xs"><strong>Recommendation:</strong> {issue.recommendation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              Download Report
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-2" />
                              View Photos
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Select a request</h3>
                    <p className="text-muted-foreground">
                      Choose a verification request to view details
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'new' && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>New Verification Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="property-address">Property Address *</Label>
                <Textarea
                  id="property-address"
                  placeholder="Enter complete property address"
                  value={newRequestForm.propertyAddress}
                  onChange={(e) => updateNewRequestForm('propertyAddress', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="request-type">Request Type *</Label>
                  <Select
                    value={newRequestForm.requestType}
                    onValueChange={(value) => updateNewRequestForm('requestType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select request type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspection">Building Inspection</SelectItem>
                      <SelectItem value="survey">Land Survey</SelectItem>
                      <SelectItem value="documentation">Document Verification</SelectItem>
                      <SelectItem value="compliance">Compliance Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newRequestForm.priority}
                    onValueChange={(value) => updateNewRequestForm('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferred-date">Preferred Date</Label>
                  <Input
                    id="preferred-date"
                    type="date"
                    value={newRequestForm.preferredDate}
                    onChange={(e) => updateNewRequestForm('preferredDate', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="preferred-time">Preferred Time</Label>
                  <Select
                    value={newRequestForm.preferredTime}
                    onValueChange={(value) => updateNewRequestForm('preferredTime', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                      <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="special-requirements">Special Requirements</Label>
                <Textarea
                  id="special-requirements"
                  placeholder="Any special requirements or notes for the inspector..."
                  value={newRequestForm.specialRequirements}
                  onChange={(e) => updateNewRequestForm('specialRequirements', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact-phone">Contact Phone</Label>
                  <Input
                    id="contact-phone"
                    placeholder="+254XXXXXXXXX"
                    value={newRequestForm.contactPhone}
                    onChange={(e) => updateNewRequestForm('contactPhone', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="your@email.com"
                    value={newRequestForm.contactEmail}
                    onChange={(e) => updateNewRequestForm('contactEmail', e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSubmitRequest} className="w-full">
                Submit Verification Request
              </Button>
            </CardContent>
          </Card>
        )}

        {activeTab === 'inspectors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockInspectors.map((inspector) => (
              <Card key={inspector.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{inspector.name}</h3>
                      <p className="text-sm text-muted-foreground">{inspector.location}</p>
                    </div>
                    <Badge className={
                      inspector.availability === 'available' ? 'bg-green-100 text-green-800' :
                      inspector.availability === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {inspector.availability}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{inspector.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({inspector.completedInspections} inspections)
                      </span>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-1">Specializations:</div>
                      <div className="flex flex-wrap gap-1">
                        {inspector.specialization.map((spec, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1">
                        <Phone className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}