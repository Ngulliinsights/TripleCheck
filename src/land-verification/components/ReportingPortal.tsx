import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Textarea } from '@/shared/components/ui/textarea';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { 
  FileText, 
  Download, 
  Eye, 
  Settings, 
  Users, 
  Shield, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Info,
  Printer,
  Share2,
  BookOpen,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';

// Define interfaces for the reporting portal
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  audience: 'buyer' | 'seller' | 'legal' | 'executive' | 'expert';
  sections: ReportSection[];
  format: 'pdf' | 'html' | 'json';
}

interface ReportSection {
  id: string;
  title: string;
  type: 'summary' | 'detailed' | 'chart' | 'table' | 'legal' | 'recommendations';
  required: boolean;
  order: number;
  dataSource: string;
  template: string;
}

interface GeneratedReport {
  id: string;
  sessionId: string;
  templateId: string;
  format: 'pdf' | 'html' | 'json';
  content: string | Buffer;
  metadata: {
    generatedAt: Date;
    generatedBy: string;
    audience: string;
    pageCount?: number;
    fileSize: number;
    confidentialityLevel: 'public' | 'restricted' | 'confidential';
  };
  downloadUrl?: string;
}

interface ExecutiveSummary {
  propertyId: string;
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  overallRiskScore: number;
  keyFindings: string[];
  criticalIssues: string[];
  recommendations: string[];
  verificationCompleteness: number;
  confidenceLevel: number;
  nextSteps: string[];
}

interface ReportingPortalProps {
  sessionId: string;
  session?: any; // VerificationSessionResponse
  onReportGenerated?: (report: GeneratedReport) => void;
}

interface ReportGenerationRequest {
  templateId: string;
  format: 'pdf' | 'html' | 'json';
  includeConfidential: boolean;
  customSections?: string[];
  audience?: string;
}

export const ReportingPortal: React.FC<ReportingPortalProps> = ({
  sessionId,
  session,
  onReportGenerated
}) => {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null);
  const [expertReports, setExpertReports] = useState<string>('');
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingExpertReports, setIsLoadingExpertReports] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportGenerationRequest>({
    templateId: '',
    format: 'pdf',
    includeConfidential: false,
    customSections: [],
    audience: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
    loadExecutiveSummary();
    loadExpertReports();
  }, [sessionId]);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/land-verification/report-templates');
      if (!response.ok) {
        throw new Error('Failed to load report templates');
      }
      const data = await response.json();
      setTemplates(data.data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load report templates',
        variant: 'destructive'
      });
    }
  };

  const loadExecutiveSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const response = await fetch(`/api/land-verification/sessions/${sessionId}/executive-summary`);
      if (!response.ok) {
        throw new Error('Failed to load executive summary');
      }
      const data = await response.json();
      setExecutiveSummary(data.data.summary);
    } catch (error) {
      console.error('Error loading executive summary:', error);
      toast({
        title: 'Error',
        description: 'Failed to load executive summary',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const loadExpertReports = async () => {
    setIsLoadingExpertReports(true);
    try {
      const response = await fetch(`/api/land-verification/sessions/${sessionId}/expert-reports`);
      if (!response.ok) {
        throw new Error('Failed to load expert reports');
      }
      const data = await response.json();
      setExpertReports(data.data.compiledReport || 'No expert reports available');
    } catch (error) {
      console.error('Error loading expert reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load expert reports',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingExpertReports(false);
    }
  };

  const generateReport = async () => {
    if (!reportConfig.templateId) {
      toast({
        title: 'Error',
        description: 'Please select a report template',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/land-verification/sessions/${sessionId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      const newReport = data.data.report;
      
      setGeneratedReports(prev => [newReport, ...prev]);
      
      if (onReportGenerated) {
        onReportGenerated(newReport);
      }

      toast({
        title: 'Success',
        description: 'Report generated successfully',
        variant: 'default'
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReport = (report: GeneratedReport) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    } else {
      // Create blob and download
      const blob = new Blob([report.content], { 
        type: report.format === 'pdf' ? 'application/pdf' : 
              report.format === 'html' ? 'text/html' : 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verification-report-${report.id}.${report.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const previewReport = (report: GeneratedReport) => {
    if (report.format === 'html') {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(report.content as string);
        newWindow.document.close();
      }
    } else {
      toast({
        title: 'Info',
        description: 'Preview is only available for HTML reports',
        variant: 'default'
      });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
    setReportConfig(prev => ({
      ...prev,
      templateId,
      audience: template?.audience || ''
    }));
  };

  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    setReportConfig(prev => ({
      ...prev,
      customSections: checked 
        ? [...(prev.customSections || []), sectionId]
        : (prev.customSections || []).filter(id => id !== sectionId)
    }));
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'buyer': return <Users className="h-4 w-4" />;
      case 'legal': return <Shield className="h-4 w-4" />;
      case 'executive': return <Settings className="h-4 w-4" />;
      case 'expert': return <BookOpen className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reporting Portal</h2>
          <p className="text-gray-600">Generate comprehensive verification reports and summaries</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('/help/reporting', '_blank')}
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Help
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="experts">Expert Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        {/* Generate Report Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Report Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-select">Select Template</Label>
                  <Select
                    value={reportConfig.templateId}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a report template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center space-x-2">
                            {getAudienceIcon(template.audience)}
                            <span>{template.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                      <Badge variant="outline" className="mt-1">
                        {selectedTemplate.audience}
                      </Badge>
                    </div>

                    <div>
                      <Label>Report Sections</Label>
                      <div className="space-y-2 mt-2">
                        {selectedTemplate.sections
                          .sort((a, b) => a.order - b.order)
                          .map(section => (
                            <div key={section.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={section.id}
                                checked={
                                  section.required || 
                                  (reportConfig.customSections || []).includes(section.id)
                                }
                                disabled={section.required}
                                onCheckedChange={(checked) => 
                                  handleSectionToggle(section.id, checked as boolean)
                                }
                              />
                              <Label 
                                htmlFor={section.id}
                                className={`text-sm ${section.required ? 'font-medium' : ''}`}
                              >
                                {section.title}
                                {section.required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </Label>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Report Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="format-select">Output Format</Label>
                  <Select
                    value={reportConfig.format}
                    onValueChange={(value: 'pdf' | 'html' | 'json') => 
                      setReportConfig(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="html">HTML Report</SelectItem>
                      <SelectItem value="json">JSON Data</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="audience-input">Target Audience</Label>
                  <Input
                    id="audience-input"
                    value={reportConfig.audience}
                    onChange={(e) => 
                      setReportConfig(prev => ({ ...prev, audience: e.target.value }))
                    }
                    placeholder="e.g., Property buyer, Legal team"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confidential"
                    checked={reportConfig.includeConfidential}
                    onCheckedChange={(checked) =>
                      setReportConfig(prev => ({ 
                        ...prev, 
                        includeConfidential: checked as boolean 
                      }))
                    }
                  />
                  <Label htmlFor="confidential" className="text-sm">
                    Include confidential information
                  </Label>
                </div>

                <Button
                  onClick={generateReport}
                  disabled={isGenerating || !reportConfig.templateId}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Executive Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="h-5 w-5 mr-2" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin mr-2" />
                  Loading executive summary...
                </div>
              ) : executiveSummary ? (
                <div className="space-y-6">
                  {/* Risk Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRiskLevelColor(executiveSummary.overallRiskLevel)}`}>
                        {executiveSummary.overallRiskLevel.toUpperCase()} RISK
                      </div>
                      <p className="text-2xl font-bold mt-2">{executiveSummary.overallRiskScore}/100</p>
                      <p className="text-sm text-gray-600">Risk Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{executiveSummary.verificationCompleteness}%</p>
                      <p className="text-sm text-gray-600">Verification Complete</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{Math.round(executiveSummary.confidenceLevel * 100)}%</p>
                      <p className="text-sm text-gray-600">Confidence Level</p>
                    </div>
                  </div>

                  {/* Key Findings */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Key Findings</h3>
                    <ul className="space-y-2">
                      {executiveSummary.keyFindings.map((finding, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Critical Issues */}
                  {executiveSummary.criticalIssues.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Critical Issues</h3>
                      <ul className="space-y-2">
                        {executiveSummary.criticalIssues.map((issue, index) => (
                          <li key={index} className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {executiveSummary.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start">
                          <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Steps */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Next Steps</h3>
                    <ul className="space-y-2">
                      {executiveSummary.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium mr-2 mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Executive summary is not available yet. Complete more verification layers to generate a comprehensive summary.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expert Reports Tab */}
        <TabsContent value="experts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Expert Reports Compilation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingExpertReports ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin mr-2" />
                  Loading expert reports...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-sm">
                      {expertReports}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const blob = new Blob([expertReports], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `expert-reports-${sessionId}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(expertReports);
                        toast({
                          title: 'Copied',
                          description: 'Expert reports copied to clipboard',
                          variant: 'default'
                        });
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Generated Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedReports.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No reports have been generated yet. Use the "Generate Report" tab to create your first report.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {generatedReports.map(report => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">
                            {templates.find(t => t.id === report.templateId)?.name || 'Unknown Template'}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Format: {report.format.toUpperCase()}</span>
                            <span>Size: {(report.metadata.fileSize / 1024).toFixed(1)} KB</span>
                            <span>Generated: {new Date(report.metadata.generatedAt).toLocaleDateString()}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className="mt-2"
                          >
                            {report.metadata.confidentialityLevel}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          {report.format === 'html' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => previewReport(report)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(report)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};