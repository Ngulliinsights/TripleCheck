import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { Textarea } from '@shared/components/ui/textarea';
import { cn } from '@shared/lib/utils';
import { 
  Users, 
  Plus, 
  Trash2, 
  Clock, 
  Shield, 
  AlertTriangle,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import type { 
  InterviewTemplate,
  InterviewQuestion,
  CommunityIntelligenceRequest 
} from '@/types/land-verification';

interface CommunityInterviewTemplateProps {
  sessionId: number;
  propertyLocation: string;
  propertyType: string;
  onGenerateTemplate: (request: CommunityIntelligenceRequest) => Promise<InterviewTemplate[]>;
  onSaveTemplate: (template: InterviewTemplate) => void;
  onPreviewTemplate: (template: InterviewTemplate) => void;
  className?: string;
}

const TARGET_AUDIENCES = [
  {
    id: 'local_admin',
    name: 'Local Administration',
    description: 'Chiefs, assistant chiefs, and local government officials',
    icon: '🏛️',
    estimatedTime: 30
  },
  {
    id: 'neighbor',
    name: 'Neighboring Property Owners',
    description: 'Adjacent property owners and immediate neighbors',
    icon: '🏠',
    estimatedTime: 20
  },
  {
    id: 'community_leader',
    name: 'Community Leaders',
    description: 'Religious leaders, elders, and respected community members',
    icon: '👥',
    estimatedTime: 45
  },
  {
    id: 'resident',
    name: 'Long-term Residents',
    description: 'People who have lived in the area for many years',
    icon: '🏘️',
    estimatedTime: 25
  }
];

const QUESTION_TYPES = [
  { id: 'open_ended', name: 'Open Ended', description: 'Free text response' },
  { id: 'yes_no', name: 'Yes/No', description: 'Simple yes or no answer' },
  { id: 'multiple_choice', name: 'Multiple Choice', description: 'Select from options' },
  { id: 'rating', name: 'Rating Scale', description: '1-5 or 1-10 scale' }
];

const SENSITIVITY_LEVELS = [
  { id: 'low', name: 'Low', color: 'text-green-600 bg-green-50' },
  { id: 'medium', name: 'Medium', color: 'text-yellow-600 bg-yellow-50' },
  { id: 'high', name: 'High', color: 'text-red-600 bg-red-50' }
];

export default function CommunityInterviewTemplate({
  sessionId,
  propertyLocation,
  propertyType,
  onGenerateTemplate,
  onSaveTemplate,
  onPreviewTemplate,
  className
}: CommunityInterviewTemplateProps) {
  const [selectedAudience, setSelectedAudience] = useState<string>('local_admin');
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<InterviewTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<InterviewQuestion | null>(null);

  useEffect(() => {
    generateInitialTemplates();
  }, []);

  const generateInitialTemplates = async () => {
    setIsGenerating(true);
    try {
      const request: CommunityIntelligenceRequest = {
        sessionId,
        propertyLocation,
        propertyType,
        interviewTemplates: true
      };
      
      const generatedTemplates = await onGenerateTemplate(request);
      setTemplates(generatedTemplates);
      
      if (generatedTemplates.length > 0) {
        setCurrentTemplate(generatedTemplates[0]);
      }
    } catch (error) {
      console.error('Error generating templates:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAudienceChange = (audienceId: string) => {
    setSelectedAudience(audienceId);
    const template = templates.find(t => t.targetAudience === audienceId);
    setCurrentTemplate(template || null);
  };

  const addQuestion = () => {
    if (!currentTemplate) return;

    const newQuestion: InterviewQuestion = {
      id: `q_${Date.now()}`,
      question: '',
      type: 'open_ended',
      sensitivityLevel: 'low'
    };

    const updatedTemplate = {
      ...currentTemplate,
      questions: [...currentTemplate.questions, newQuestion]
    };

    setCurrentTemplate(updatedTemplate);
    setEditingQuestion(newQuestion);
  };

  const updateQuestion = (questionId: string, updates: Partial<InterviewQuestion>) => {
    if (!currentTemplate) return;

    const updatedQuestions = currentTemplate.questions.map(q =>
      q.id === questionId ? { ...q, ...updates } : q
    );

    const updatedTemplate = {
      ...currentTemplate,
      questions: updatedQuestions
    };

    setCurrentTemplate(updatedTemplate);
  };

  const removeQuestion = (questionId: string) => {
    if (!currentTemplate) return;

    const updatedQuestions = currentTemplate.questions.filter(q => q.id !== questionId);
    const updatedTemplate = {
      ...currentTemplate,
      questions: updatedQuestions
    };

    setCurrentTemplate(updatedTemplate);
  };

  const handleSaveTemplate = () => {
    if (currentTemplate) {
      onSaveTemplate(currentTemplate);
      // Update the templates array
      const updatedTemplates = templates.map(t =>
        t.id === currentTemplate.id ? currentTemplate : t
      );
      setTemplates(updatedTemplates);
    }
  };

  const QuestionEditor = ({ question }: { question: InterviewQuestion }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={cn('text-xs', 
              SENSITIVITY_LEVELS.find(s => s.id === question.sensitivityLevel)?.color
            )}>
              {question.sensitivityLevel.toUpperCase()} SENSITIVITY
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeQuestion(question.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <Label>Question</Label>
            <Textarea
              value={question.question}
              onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
              placeholder="Enter your question here..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Question Type</Label>
              <Select
                value={question.type}
                onValueChange={(value) => updateQuestion(question.id, { type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Sensitivity Level</Label>
              <Select
                value={question.sensitivityLevel}
                onValueChange={(value) => updateQuestion(question.id, { sensitivityLevel: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SENSITIVITY_LEVELS.map(level => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {question.type === 'multiple_choice' && (
            <div>
              <Label>Answer Options</Label>
              <div className="space-y-2">
                {(question.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(question.options || [])];
                        newOptions[index] = e.target.value;
                        updateQuestion(question.id, { options: newOptions });
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newOptions = (question.options || []).filter((_, i) => i !== index);
                        updateQuestion(question.id, { options: newOptions });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(question.options || []), ''];
                    updateQuestion(question.id, { options: newOptions });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          {question.sensitivityLevel === 'high' && (
            <div>
              <Label>Legal Implications (Optional)</Label>
              <Textarea
                value={question.legalImplications || ''}
                onChange={(e) => updateQuestion(question.id, { legalImplications: e.target.value })}
                placeholder="Describe any legal considerations for this question..."
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const AudienceCard = ({ audience }: { audience: typeof TARGET_AUDIENCES[0] }) => {
    const template = templates.find(t => t.targetAudience === audience.id);
    const isSelected = selectedAudience === audience.id;

    return (
      <Card 
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isSelected && 'ring-2 ring-primary'
        )}
        onClick={() => handleAudienceChange(audience.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{audience.icon}</div>
            <div className="flex-1">
              <h4 className="font-medium">{audience.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">{audience.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {audience.estimatedTime} min
                </div>
                {template && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {template.questions.length} questions
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isGenerating) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Generating Interview Templates</h3>
          <p className="text-muted-foreground">
            Creating customized questions based on your property details...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Community Interview Templates</CardTitle>
            <CardDescription>
              Customize interview questions for different community members
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {currentTemplate && (
              <>
                <Button variant="outline" size="sm" onClick={() => onPreviewTemplate(currentTemplate)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button size="sm" onClick={handleSaveTemplate}>
                  Save Template
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="audiences" className="space-y-6">
          <TabsList>
            <TabsTrigger value="audiences">Target Audiences</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
          </TabsList>

          <TabsContent value="audiences" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TARGET_AUDIENCES.map(audience => (
                <AudienceCard key={audience.id} audience={audience} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            {currentTemplate ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {TARGET_AUDIENCES.find(a => a.id === currentTemplate.targetAudience)?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {currentTemplate.questions.length} questions • 
                      Estimated {currentTemplate.estimatedDuration} minutes
                    </p>
                  </div>
                  <Button onClick={addQuestion}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-4">
                  {currentTemplate.questions.map(question => (
                    <QuestionEditor key={question.id} question={question} />
                  ))}
                </div>

                {currentTemplate.questions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Questions Yet</h3>
                    <p className="mb-4">Add questions to create your interview template</p>
                    <Button onClick={addQuestion}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Question
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a target audience to view and edit questions</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="guidelines" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Privacy & Safety Guidelines:</strong> Always respect community members' 
                  privacy and ensure interviews are conducted safely and ethically.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cultural Considerations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Respect local customs and traditions</li>
                    <li>• Use appropriate greetings and language</li>
                    <li>• Consider gender dynamics in interviews</li>
                    <li>• Be mindful of religious and cultural sensitivities</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Safety Considerations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Conduct interviews in public or safe spaces</li>
                    <li>• Inform local authorities when appropriate</li>
                    <li>• Travel in pairs when possible</li>
                    <li>• Have emergency contacts readily available</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Legal Considerations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Obtain proper consent before recording</li>
                    <li>• Respect confidentiality agreements</li>
                    <li>• Be aware of defamation risks</li>
                    <li>• Document sources appropriately</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}