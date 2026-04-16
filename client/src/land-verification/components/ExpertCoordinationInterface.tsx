import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  MapPin, 
  Gavel, 
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Clock,
  DollarSign,
  Star,
  Award,
  CheckCircle,
  AlertCircle,
  FileText,
  MessageSquare,
  ExternalLink
} from 'lucide-react'
import React, { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '../../shared/components/ui/avatar'
import { Badge } from '../../shared/components/ui/badge'
import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../shared/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../shared/components/ui/tabs'
import { Textarea } from '../../shared/components/ui/textarea'
import { useToast } from '../../shared/hooks/use-toast'
import { useLandVerification, ExpertAssignment } from '../hooks/useLandVerification'

interface ExpertCoordinationInterfaceProps {
  sessionId: string;
  onExpertAssigned?: (assignment: ExpertAssignment) => void;
  showAssignmentControls?: boolean;
}

const EXPERT_TYPES = {
  surveyor: {
    name: 'Professional Surveyor',
    icon: MapPin,
    description: 'Licensed land surveyor for boundary verification and mapping',
    averageCost: 2500,
    averageTime: 8,
    specializations: ['Boundary Survey', 'Topographic Survey', 'Construction Survey', 'GPS Survey']
  },
  lawyer: {
    name: 'Legal Expert',
    icon: Gavel,
    description: 'Legal professional specializing in property law and transactions',
    averageCost: 3500,
    averageTime: 12,
    specializations: ['Property Law', 'Contract Review', 'Title Examination', 'Dispute Resolution']
  },
  appraiser: {
    name: 'Property Appraiser',
    icon: TrendingUp,
    description: 'Certified property appraiser for market value assessment',
    averageCost: 1800,
    averageTime: 6,
    specializations: ['Residential Appraisal', 'Commercial Appraisal', 'Land Valuation', 'Market Analysis']
  }
};

// Mock expert data - in real implementation, this would come from API
const MOCK_EXPERTS = {
  surveyor: [
    {
      id: 'surv-001',
      name: 'John Kamau',
      credentials: 'Licensed Surveyor (LSK)',
      rating: 4.8,
      completedJobs: 156,
      specialization: 'Boundary Survey',
      location: 'Nairobi',
      availability: 'Available',
      hourlyRate: 300,
      avatar: null,
      bio: 'Experienced land surveyor with 12+ years in Kenya. Specialized in complex boundary disputes and GPS surveying.',
      certifications: ['Licensed Surveyor of Kenya', 'GPS Certified', 'Drone Survey Certified']
    },
    {
      id: 'surv-002',
      name: 'Mary Wanjiku',
      credentials: 'Senior Surveyor (LSK)',
      rating: 4.9,
      completedJobs: 203,
      specialization: 'Topographic Survey',
      location: 'Kiambu',
      availability: 'Busy until next week',
      hourlyRate: 350,
      avatar: null,
      bio: 'Senior surveyor with expertise in topographic and construction surveys. Known for precision and reliability.',
      certifications: ['Licensed Surveyor of Kenya', 'Topographic Specialist', 'Construction Survey Expert']
    }
  ],
  lawyer: [
    {
      id: 'law-001',
      name: 'David Mwangi',
      credentials: 'Advocate of High Court',
      rating: 4.7,
      completedJobs: 89,
      specialization: 'Property Law',
      location: 'Nairobi',
      availability: 'Available',
      hourlyRate: 450,
      avatar: null,
      bio: 'Property law specialist with extensive experience in land transactions and title disputes.',
      certifications: ['Advocate of High Court of Kenya', 'Property Law Specialist', 'Conveyancing Expert']
    }
  ],
  appraiser: [
    {
      id: 'app-001',
      name: 'Grace Njeri',
      credentials: 'Certified Property Appraiser',
      rating: 4.6,
      completedJobs: 134,
      specialization: 'Land Valuation',
      location: 'Nakuru',
      availability: 'Available',
      hourlyRate: 280,
      avatar: null,
      bio: 'Certified appraiser specializing in agricultural and residential land valuation across Kenya.',
      certifications: ['Certified Property Appraiser', 'Land Valuation Expert', 'Market Analysis Certified']
    }
  ]
};

export function ExpertCoordinationInterface({ 
  sessionId, 
  onExpertAssigned,
  showAssignmentControls = true 
}: ExpertCoordinationInterfaceProps) {
  const { toast } = useToast();
  const [selectedExpertType, setSelectedExpertType] = useState<keyof typeof EXPERT_TYPES>('surveyor');
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const {
    useExpertAssignments,
    assignExpert,
    isAssigningExpert
  } = useLandVerification();

  const { data: assignments, isLoading } = useExpertAssignments(sessionId);

  const handleAssignExpert = async () => {
    if (!selectedExpert) return;

    try {
      const assignment = await assignExpert(sessionId, selectedExpertType);
      
      if (onExpertAssigned) {
        onExpertAssigned(assignment);
      }

      toast({
        title: "Expert Assigned",
        description: `${selectedExpert.name} has been assigned to your verification.`,
      });

      setIsAssignDialogOpen(false);
      setSelectedExpert(null);
      setAssignmentNotes('');
    } catch (error) {
      toast({
        title: "Assignment Failed",
        description: error instanceof Error ? error.message : "Failed to assign expert",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderExpertCard = (expert: any, expertType: keyof typeof EXPERT_TYPES) => {
    const ExpertIcon = EXPERT_TYPES[expertType].icon;
    
    return (
      <Card 
        key={expert.id}
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          selectedExpert?.id === expert.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
        }`}
        onClick={() => setSelectedExpert(expert)}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={expert.avatar} />
              <AvatarFallback>
                {expert.name.split(' ').map((n: string) => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{expert.name}</h4>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{expert.rating}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">{expert.credentials}</p>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center space-x-1">
                  <ExpertIcon className="h-3 w-3" />
                  <span>{expert.specialization}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{expert.location}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Award className="h-3 w-3" />
                  <span>{expert.completedJobs} jobs</span>
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge 
                  variant={expert.availability === 'Available' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {expert.availability}
                </Badge>
                <span className="text-sm font-medium text-gray-900">
                  KSh {expert.hourlyRate}/hour
                </span>
              </div>
            </div>
          </div>
          
          {selectedExpert?.id === expert.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <p className="text-sm text-gray-600 mb-3">{expert.bio}</p>
              
              <div className="space-y-2">
                <h5 className="font-medium text-gray-900 text-sm">Certifications</h5>
                <div className="flex flex-wrap gap-1">
                  {expert.certifications.map((cert: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Expert Coordination</h2>
          <p className="text-gray-600">
            Coordinate with professional experts for comprehensive land verification
          </p>
        </div>
        
        {showAssignmentControls && (
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <User className="h-4 w-4 mr-2" />
                Assign Expert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Assign Professional Expert</DialogTitle>
                <DialogDescription>
                  Select and assign a professional expert to assist with your land verification
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Expert Type Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Expert Type
                  </label>
                  <Select 
                    value={selectedExpertType} 
                    onValueChange={(value) => {
                      setSelectedExpertType(value as keyof typeof EXPERT_TYPES);
                      setSelectedExpert(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EXPERT_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <type.icon className="h-4 w-4" />
                            <span>{type.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Expert Type Info */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        {React.createElement(EXPERT_TYPES[selectedExpertType].icon, {
                          className: "h-5 w-5 text-blue-600"
                        })}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-blue-900 mb-1">
                          {EXPERT_TYPES[selectedExpertType].name}
                        </h4>
                        <p className="text-sm text-blue-700 mb-2">
                          {EXPERT_TYPES[selectedExpertType].description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-blue-600">
                          <span className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Avg: KSh {EXPERT_TYPES[selectedExpertType].averageCost}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Avg: {EXPERT_TYPES[selectedExpertType].averageTime} hours</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Available Experts */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-3 block">
                    Available {EXPERT_TYPES[selectedExpertType].name}s
                  </label>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {MOCK_EXPERTS[selectedExpertType]?.map((expert) => 
                      renderExpertCard(expert, selectedExpertType)
                    )}
                  </div>
                </div>

                {/* Assignment Notes */}
                {selectedExpert && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Assignment Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="Add any specific requirements or notes for the expert..."
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* Assignment Summary */}
                {selectedExpert && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-green-900 mb-2">Assignment Summary</h4>
                      <div className="space-y-1 text-sm text-green-700">
                        <p><strong>Expert:</strong> {selectedExpert.name}</p>
                        <p><strong>Type:</strong> {EXPERT_TYPES[selectedExpertType].name}</p>
                        <p><strong>Estimated Cost:</strong> KSh {selectedExpert.hourlyRate * EXPERT_TYPES[selectedExpertType].averageTime}</p>
                        <p><strong>Estimated Time:</strong> {EXPERT_TYPES[selectedExpertType].averageTime} hours</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAssignDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssignExpert}
                    disabled={!selectedExpert || isAssigningExpert}
                  >
                    {isAssigningExpert ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      'Assign Expert'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Current Expert Assignments</CardTitle>
          <CardDescription>
            Track the progress of assigned experts for this verification session
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="h-5 w-5 animate-spin mr-2" />
              <span>Loading assignments...</span>
            </div>
          ) : assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const expertType = assignment.expertType as keyof typeof EXPERT_TYPES;
                const ExpertIcon = EXPERT_TYPES[expertType].icon;
                
                return (
                  <Card key={assignment.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <ExpertIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {assignment.expertName}
                              </h4>
                              <Badge className={getStatusColor(assignment.status)}>
                                {assignment.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {EXPERT_TYPES[expertType].name}
                              {assignment.specialization && ` • ${assignment.specialization}`}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                              </span>
                              {assignment.expectedCompletionDate && (
                                <span className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Due: {new Date(assignment.expectedCompletionDate).toLocaleDateString()}</span>
                                </span>
                              )}
                              {assignment.cost && (
                                <span className="flex items-center space-x-1">
                                  <DollarSign className="h-3 w-3" />
                                  <span>KSh {assignment.cost.toLocaleString()}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {assignment.contactInfo && (
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Contact
                            </Button>
                          )}
                          {assignment.reportUrl && (
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Report
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {assignment.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{assignment.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No experts assigned yet</p>
              <p className="text-sm">Assign professional experts to enhance your verification process</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ExpertCoordinationInterface;