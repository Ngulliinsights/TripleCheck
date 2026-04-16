import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Minus,
  Save,
  Download,
  Share2,
  FileText,
  Mic,
  Camera,
  User
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Badge } from '../../shared/components/ui/badge'
import { Button } from '../../shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card'
import { Checkbox } from '../../shared/components/ui/checkbox'
import { Input } from '../../shared/components/ui/input'
import { Progress } from '../../shared/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select'
import { Separator } from '../../shared/components/ui/separator'
import { Textarea } from '../../shared/components/ui/textarea'
import { useToast } from '../../shared/hooks/use-toast'

interface CommunityInterviewTemplateProps {
  sessionId: string;
  propertyType?: string;
  location?: string;
  onTemplateComplete?: (responses: any) => void;
  readOnly?: boolean;
}

interface InterviewQuestion {
  id: string;
  category: string;
  question: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'boolean' | 'date';
  required: boolean;
  options?: string[];
  response?: any;
  notes?: string;
}

interface InterviewSection {
  id: string;
  title: string;
  description: string;
  estimatedTime: number;
  questions: InterviewQuestion[];
  completed: boolean;
}

const COMMUNITY_SOURCES = [
  { id: 'local_admin', name: 'Local Administrator', icon: User, reliability: 0.9 },
  { id: 'neighbor', name: 'Neighbor', icon: Users, reliability: 0.7 },
  { id: 'community_leader', name: 'Community Leader', icon: User, reliability: 0.85 },
  { id: 'resident', name: 'Long-term Resident', icon: Users, reliability: 0.75 }
];

// Template questions based on property type and location
const generateInterviewTemplate = (propertyType: string, location: string): InterviewSection[] => {
  return [
    {
      id: 'basic_info',
      title: 'Basic Property Information',
      description: 'Gather fundamental information about the property',
      estimatedTime: 10,
      completed: false,
      questions: [
        {
          id: 'ownership_knowledge',
          category: 'Ownership',
          question: 'How long have you known about this property and its ownership?',
          type: 'multiple_choice',
          required: true,
          options: ['Less than 1 year', '1-5 years', '5-10 years', 'More than 10 years']
        },
        {
          id: 'current_owner',
          category: 'Ownership',
          question: 'Who do you believe is the current owner of this property?',
          type: 'text',
          required: true
        },
        {
          id: 'ownership_disputes',
          category: 'Legal',
          question: 'Are you aware of any ownership disputes or claims on this property?',
          type: 'boolean',
          required: true
        },
        {
          id: 'property_use',
          category: 'Usage',
          question: 'How is this property currently being used?',
          type: 'multiple_choice',
          required: true,
          options: ['Residential', 'Agricultural', 'Commercial', 'Vacant/Unused', 'Mixed Use']
        }
      ]
    },
    {
      id: 'boundaries_access',
      title: 'Boundaries and Access',
      description: 'Verify physical boundaries and access rights',
      estimatedTime: 15,
      completed: false,
      questions: [
        {
          id: 'boundary_markers',
          category: 'Physical',
          question: 'Are the property boundaries clearly marked and visible?',
          type: 'rating',
          required: true,
          options: ['1', '2', '3', '4', '5']
        },
        {
          id: 'boundary_disputes',
          category: 'Legal',
          question: 'Have there been any boundary disputes with neighboring properties?',
          type: 'boolean',
          required: true
        },
        {
          id: 'access_rights',
          category: 'Legal',
          question: 'Does the property have clear access rights to public roads?',
          type: 'boolean',
          required: true
        },
        {
          id: 'encroachments',
          category: 'Physical',
          question: 'Are you aware of any encroachments on or by this property?',
          type: 'boolean',
          required: true
        }
      ]
    },
    {
      id: 'community_standing',
      title: 'Community Standing',
      description: 'Assess the property and owner\'s standing in the community',
      estimatedTime: 12,
      completed: false,
      questions: [
        {
          id: 'owner_reputation',
          category: 'Social',
          question: 'How would you rate the current owner\'s reputation in the community?',
          type: 'rating',
          required: true,
          options: ['1', '2', '3', '4', '5']
        },
        {
          id: 'community_issues',
          category: 'Social',
          question: 'Are there any community issues or concerns related to this property?',
          type: 'boolean',
          required: true
        },
        {
          id: 'development_plans',
          category: 'Development',
          question: 'Are you aware of any development plans affecting this area?',
          type: 'boolean',
          required: true
        },
        {
          id: 'environmental_concerns',
          category: 'Environmental',
          question: 'Are there any environmental concerns related to this property?',
          type: 'boolean',
          required: true
        }
      ]
    },
    {
      id: 'historical_context',
      title: 'Historical Context',
      description: 'Understand the property\'s history and any relevant events',
      estimatedTime: 18,
      completed: false,
      questions: [
        {
          id: 'ownership_history',
          category: 'History',
          question: 'Can you describe the ownership history of this property?',
          type: 'text',
          required: false
        },
        {
          id: 'significant_events',
          category: 'History',
          question: 'Have there been any significant events related to this property?',
          type: 'text',
          required: false
        },
        {
          id: 'family_inheritance',
          category: 'Legal',
          question: 'Is this property part of a family inheritance or succession?',
          type: 'boolean',
          required: true
        },
        {
          id: 'previous_transactions',
          category: 'Transactions',
          question: 'Are you aware of any previous sales or transfers of this property?',
          type: 'boolean',
          required: true
        }
      ]
    }
  ];
};

export function CommunityInterviewTemplate({ 
  sessionId, 
  propertyType = 'land', 
  location = 'Kenya',
  onTemplateComplete,
  readOnly = false 
}: CommunityInterviewTemplateProps) {
  const { toast } = useToast();
  const [sections, setSections] = useState<InterviewSection[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [interviewerInfo, setInterviewerInfo] = useState({
    name: '',
    role: '',
    date: new Date().toISOString().split('T')[0],
    location: location
  });
  const [respondentInfo, setRespondentInfo] = useState({
    name: '',
    sourceType: '',
    relationship: '',
    yearsInArea: '',
    contactInfo: ''
  });
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    const template = generateInterviewTemplate(propertyType, location);
    setSections(template);
  }, [propertyType, location]);

  const handleQuestionResponse = (sectionId: string, questionId: string, response: any, notes?: string) => {
    setSections(prev => prev.map(section => {
      if (section.id === sectionId) {
        const updatedQuestions = section.questions.map(question => {
          if (question.id === questionId) {
            return { ...question, response, notes };
          }
          return question;
        });
        
        // Check if section is completed
        const requiredQuestions = updatedQuestions.filter(q => q.required);
        const answeredRequired = requiredQuestions.filter(q => q.response !== undefined && q.response !== '');
        const completed = answeredRequired.length === requiredQuestions.length;
        
        return { ...section, questions: updatedQuestions, completed };
      }
      return section;
    }));
  };

  const calculateProgress = () => {
    const totalQuestions = sections.reduce((total, section) => total + section.questions.filter(q => q.required).length, 0);
    const answeredQuestions = sections.reduce((total, section) => {
      return total + section.questions.filter(q => q.required && q.response !== undefined && q.response !== '').length;
    }, 0);
    
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  const getTotalEstimatedTime = () => {
    return sections.reduce((total, section) => total + section.estimatedTime, 0);
  };

  const handleSaveTemplate = () => {
    const templateData = {
      sessionId,
      interviewerInfo,
      respondentInfo,
      sections,
      attachments: attachments.map(f => f.name),
      completedAt: new Date().toISOString(),
      progress: calculateProgress()
    };

    // In real implementation, save to backend
    console.log('Saving template:', templateData);
    
    toast({
      title: "Template Saved",
      description: "Community interview template has been saved successfully.",
    });

    if (onTemplateComplete && calculateProgress() === 100) {
      onTemplateComplete(templateData);
    }
  };

  const handleExportTemplate = () => {
    // In real implementation, generate PDF or document export
    toast({
      title: "Export Started",
      description: "Community interview template is being exported.",
    });
  };

  const renderQuestion = (section: InterviewSection, question: InterviewQuestion) => {
    const handleResponse = (response: any, notes?: string) => {
      handleQuestionResponse(section.id, question.id, response, notes);
    };

    return (
      <Card key={question.id} className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {question.category}
                </Badge>
                {question.required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                {question.question}
              </h4>
            </div>
            {question.response !== undefined && (
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            )}
          </div>

          <div className="space-y-3">
            {question.type === 'text' && (
              <Textarea
                placeholder="Enter response..."
                value={question.response || ''}
                onChange={(e) => handleResponse(e.target.value)}
                disabled={readOnly}
                rows={3}
              />
            )}

            {question.type === 'multiple_choice' && (
              <Select 
                value={question.response || ''} 
                onValueChange={handleResponse}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an option..." />
                </SelectTrigger>
                <SelectContent>
                  {question.options?.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {question.type === 'boolean' && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-yes`}
                    checked={question.response === true}
                    onCheckedChange={(checked) => handleResponse(checked)}
                    disabled={readOnly}
                  />
                  <label htmlFor={`${question.id}-yes`} className="text-sm">Yes</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${question.id}-no`}
                    checked={question.response === false}
                    onCheckedChange={(checked) => handleResponse(!checked)}
                    disabled={readOnly}
                  />
                  <label htmlFor={`${question.id}-no`} className="text-sm">No</label>
                </div>
              </div>
            )}

            {question.type === 'rating' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Poor</span>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={question.response === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleResponse(rating)}
                      disabled={readOnly}
                      className="w-8 h-8 p-0"
                    >
                      {rating}
                    </Button>
                  ))}
                </div>
                <span className="text-sm text-gray-600">Excellent</span>
              </div>
            )}

            {question.type === 'date' && (
              <Input
                type="date"
                value={question.response || ''}
                onChange={(e) => handleResponse(e.target.value)}
                disabled={readOnly}
              />
            )}

            {/* Notes section */}
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1 block">
                Additional Notes (Optional)
              </label>
              <Textarea
                placeholder="Add any additional context or observations..."
                value={question.notes || ''}
                onChange={(e) => handleResponse(question.response, e.target.value)}
                disabled={readOnly}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (sections.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Clock className="h-8 w-8 text-gray-400 mx-auto mb-4" />
          <p>Loading interview template...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Community Interview Template</span>
              </CardTitle>
              <CardDescription>
                Structured interview for gathering community intelligence about the property
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {getTotalEstimatedTime()} min estimated
              </Badge>
              <Badge variant={calculateProgress() === 100 ? "default" : "secondary"}>
                {Math.round(calculateProgress())}% Complete
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={calculateProgress()} className="mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">Session ID</div>
              <div className="text-gray-600 font-mono text-xs">{sessionId}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Property Type</div>
              <div className="text-gray-600">{propertyType}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Location</div>
              <div className="text-gray-600">{location}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Date</div>
              <div className="text-gray-600">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interviewer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Interviewer Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Interviewer Name
              </label>
              <Input
                value={interviewerInfo.name}
                onChange={(e) => setInterviewerInfo(prev => ({ ...prev, name: e.target.value }))}
                disabled={readOnly}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Role/Organization
              </label>
              <Input
                value={interviewerInfo.role}
                onChange={(e) => setInterviewerInfo(prev => ({ ...prev, role: e.target.value }))}
                disabled={readOnly}
                placeholder="e.g., TripleCheck Verifier"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Respondent Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Respondent Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Respondent Name
              </label>
              <Input
                value={respondentInfo.name}
                onChange={(e) => setRespondentInfo(prev => ({ ...prev, name: e.target.value }))}
                disabled={readOnly}
                placeholder="Enter respondent's name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Source Type
              </label>
              <Select 
                value={respondentInfo.sourceType} 
                onValueChange={(value) => setRespondentInfo(prev => ({ ...prev, sourceType: value }))}
                disabled={readOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source type..." />
                </SelectTrigger>
                <SelectContent>
                  {COMMUNITY_SOURCES.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      <div className="flex items-center space-x-2">
                        <source.icon className="h-4 w-4" />
                        <span>{source.name}</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          {Math.round(source.reliability * 100)}% reliable
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Years in Area
              </label>
              <Input
                value={respondentInfo.yearsInArea}
                onChange={(e) => setRespondentInfo(prev => ({ ...prev, yearsInArea: e.target.value }))}
                disabled={readOnly}
                placeholder="e.g., 15 years"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Relationship to Property
              </label>
              <Input
                value={respondentInfo.relationship}
                onChange={(e) => setRespondentInfo(prev => ({ ...prev, relationship: e.target.value }))}
                disabled={readOnly}
                placeholder="e.g., Neighbor, Former owner"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interview Sections */}
      <div className="space-y-6">
        {sections.map((section, index) => (
          <Card key={section.id} className={section.completed ? 'border-green-200 bg-green-50' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    {section.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}
                    <span>{section.title}</span>
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
                <Badge variant="outline">
                  {section.estimatedTime} min
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {section.questions.map((question) => renderQuestion(section, question))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      {!readOnly && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRecording(!isRecording)}
                >
                  <Mic className={`h-4 w-4 mr-1 ${isRecording ? 'text-red-500' : ''}`} />
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                <Button variant="outline" size="sm">
                  <Camera className="h-4 w-4 mr-1" />
                  Add Photo
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={handleExportTemplate}>
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button onClick={handleSaveTemplate}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CommunityInterviewTemplate;