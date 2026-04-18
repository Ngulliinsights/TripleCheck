import React, { useState, useCallback } from 'react'
import { 
  Shield, 
  Search, 
  FileText, 
  MapPin, 
  User, 
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Upload,
  Download,
  Eye,
  RefreshCw
} from 'lucide-react'

import { Button } from '../../local/components/ui/button'
import { Input } from '../../local/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../local/components/ui/card'
import { Badge } from '../../local/components/ui/badge'
import { Textarea } from '../../local/components/ui/textarea'
import { Label } from '../../local/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../local/components/ui/select'
import { useToast } from '../../local/hooks/use-toast'

interface VerificationCheck {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'passed' | 'failed' | 'warning';
  details?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface VerificationRequest {
  propertyId?: string;
  propertyAddress: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  documentType: string;
  additionalInfo: string;
}

const verificationChecks: VerificationCheck[] = [
  {
    id: 'ownership',
    name: 'Ownership Verification',
    description: 'Verify property ownership documents and title deed',
    status: 'pending',
    icon: FileText
  },
  {
    id: 'identity',
    name: 'Owner Identity Check',
    description: 'Verify owner identity against national ID database',
    status: 'pending',
    icon: User
  },
  {
    id: 'location',
    name: 'Property Location',
    description: 'Confirm property exists at the specified address',
    status: 'pending',
    icon: MapPin
  },
  {
    id: 'legal',
    name: 'Legal Status Check',
    description: 'Check for any legal disputes or encumbrances',
    status: 'pending',
    icon: Shield
  },
  {
    id: 'contact',
    name: 'Contact Verification',
    description: 'Verify owner contact information',
    status: 'pending',
    icon: Phone
  }
];

const documentTypes = [
  { value: 'title-deed', label: 'Title Deed' },
  { value: 'lease-agreement', label: 'Lease Agreement' },
  { value: 'sale-agreement', label: 'Sale Agreement' },
  { value: 'survey-plan', label: 'Survey Plan' },
  { value: 'id-copy', label: 'ID Copy' },
  { value: 'other', label: 'Other Document' }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'passed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    default:
      return <Clock className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'passed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function BasicChecks() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checks, setChecks] = useState(verificationChecks);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState<VerificationRequest>({
    propertyAddress: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    documentType: '',
    additionalInfo: ''
  });

  const updateFormData = useCallback(<K extends keyof VerificationRequest>(
    key: K,
    value: VerificationRequest[K]
  ) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmitVerification = useCallback(async () => {
    if (!formData.propertyAddress || !formData.ownerName || !formData.documentType) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields before submitting.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Import FormService dynamically
      const { formService } = await import('../../local/services/FormService');
      
      // Submit verification request
      const result = await formService.submitVerificationRequest(formData);

      if (result.success) {
        // Update checks to show processing
        setChecks(prev => prev.map(check => ({
          ...check,
          status: 'pending' as const
        })));

        // Reset form
        setFormData({
          propertyAddress: '',
          ownerName: '',
          ownerPhone: '',
          ownerEmail: '',
          documentType: '',
          additionalInfo: ''
        });
      }

    } catch (error) {
      toast({
        title: 'Submission failed',
        description: 'Failed to submit verification request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, toast]);

  const handleSearchExisting = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Enter search criteria',
        description: 'Please enter a property ID or address to search.',
        variant: 'destructive'
      });
      return;
    }

    // Simulate search and update checks with mock results
    const mockResults = [
      { id: 'ownership', status: 'passed', details: 'Title deed verified and authentic' },
      { id: 'identity', status: 'passed', details: 'Owner identity confirmed' },
      { id: 'location', status: 'warning', details: 'Property address needs minor clarification' },
      { id: 'legal', status: 'passed', details: 'No legal disputes found' },
      { id: 'contact', status: 'failed', details: 'Phone number could not be verified' }
    ];

    setChecks(prev => prev.map(check => {
      const result = mockResults.find(r => r.id === check.id);
      return result ? {
        ...check,
        status: result.status as any,
        details: result.details
      } : check;
    }));

    toast({
      title: 'Verification results loaded',
      description: `Found verification results for "${searchQuery}".`,
    });
  }, [searchQuery, toast]);

  const runAllChecks = useCallback(async () => {
    setChecks(prev => prev.map(check => ({ ...check, status: 'pending' as const })));
    
    // Simulate running checks with delays
    for (let i = 0; i < checks.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setChecks(prev => prev.map((check, index) => {
        if (index === i) {
          const statuses = ['passed', 'passed', 'warning', 'passed', 'failed'];
          return {
            ...check,
            status: statuses[Math.floor(Math.random() * statuses.length)] as any,
            details: `Check completed at ${new Date().toLocaleTimeString()}`
          };
        }
        return check;
      }));
    }

    toast({
      title: 'All checks completed',
      description: 'Basic verification checks have been completed.',
    });
  }, [checks.length, toast]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            Basic Property Checks
          </h1>
          <p className="text-muted-foreground">
            Perform essential verification checks on property ownership, location, and legal status
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <Button
            variant={activeTab === 'new' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('new')}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            New Verification
          </Button>
          <Button
            variant={activeTab === 'existing' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('existing')}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Check Existing
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'new' ? (
              /* New Verification Form */
              <Card>
                <CardHeader>
                  <CardTitle>Submit New Verification Request</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="property-address">Property Address *</Label>
                      <Textarea
                        id="property-address"
                        placeholder="Enter complete property address"
                        value={formData.propertyAddress}
                        onChange={(e) => updateFormData('propertyAddress', e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="document-type">Document Type *</Label>
                      <Select
                        value={formData.documentType}
                        onValueChange={(value) => updateFormData('documentType', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="owner-name">Owner Name *</Label>
                      <Input
                        id="owner-name"
                        placeholder="Full name as on documents"
                        value={formData.ownerName}
                        onChange={(e) => updateFormData('ownerName', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="owner-phone">Phone Number</Label>
                      <Input
                        id="owner-phone"
                        placeholder="+254XXXXXXXXX"
                        value={formData.ownerPhone}
                        onChange={(e) => updateFormData('ownerPhone', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="owner-email">Email Address</Label>
                      <Input
                        id="owner-email"
                        type="email"
                        placeholder="owner@example.com"
                        value={formData.ownerEmail}
                        onChange={(e) => updateFormData('ownerEmail', e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="additional-info">Additional Information</Label>
                    <Textarea
                      id="additional-info"
                      placeholder="Any additional details that might help with verification"
                      value={formData.additionalInfo}
                      onChange={(e) => updateFormData('additionalInfo', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleSubmitVerification}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
                    </Button>

                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Existing Verification Search */
              <Card>
                <CardHeader>
                  <CardTitle>Search Existing Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter property ID, address, or owner name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSearchExisting}>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Search by property ID (e.g., PROP-123), full address, or owner name
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Verification Checks Results */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Verification Checks</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={runAllChecks}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Run All Checks
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {checks.map((check) => {
                    const IconComponent = check.icon;
                    return (
                      <div
                        key={check.id}
                        className="flex items-start gap-4 p-4 rounded-lg border"
                      >
                        <div className="p-2 bg-muted rounded-full">
                          <IconComponent className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{check.name}</h3>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(check.status)}
                              <Badge className={getStatusColor(check.status)}>
                                {check.status}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2">
                            {check.description}
                          </p>

                          {check.details && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              {check.details}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Verification Status */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Completed Checks:</span>
                    <span className="font-semibold">
                      {checks.filter(c => c.status !== 'pending').length}/{checks.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Passed:</span>
                    <span className="font-semibold text-green-600">
                      {checks.filter(c => c.status === 'passed').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Warnings:</span>
                    <span className="font-semibold text-yellow-600">
                      {checks.filter(c => c.status === 'warning').length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Failed:</span>
                    <span className="font-semibold text-red-600">
                      {checks.filter(c => c.status === 'failed').length}
                    </span>
                  </div>
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
                  Download Report
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Results
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View Full Report
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Follow-up
                </Button>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Our verification process typically takes 24-48 hours to complete.
                </p>
                
                <div className="space-y-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    📋 Verification Guide
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    📞 Contact Support
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    ❓ FAQ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}