import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  Search,
  Building
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  price: number;
}

interface VerificationReportResponse {
  success: boolean;
  report?: string;
  message?: string;
  error?: string;
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("1");
  const [activeTab, setActiveTab] = useState<string>("verification");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reportContent, setReportContent] = useState<string>("");

  const reports: ReportType[] = [
    {
      id: "verification",
      name: "Verification Report",
      description: "Complete AI-powered verification analysis of property authenticity",
      icon: <FileCheck className="h-5 w-5 text-green-500" />,
      price: 99
    },
    {
      id: "market-analysis",
      name: "Market Analysis Report",
      description: "Comprehensive analysis of property market trends and valuations",
      icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
      price: 149
    },
    {
      id: "risk-assessment",
      name: "Risk Assessment Report",
      description: "In-depth evaluation of property investment risks and opportunities",
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
      price: 199
    }
  ];

  // Report generation mutation
  const verificationReportMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      try {
        return await apiRequest<VerificationReportResponse>(
          'GET',
          `/api/properties/${propertyId}/verification-report`
        );
      } catch (error) {
        console.error("Report generation error:", error);
        throw error;
      }
    },
    onSuccess: (data: VerificationReportResponse) => {
      if (data.success && data.report) {
        setReportContent(data.report);
        
        toast({
          title: "Report Generated",
          description: "Your verification report is ready to view",
          variant: "default"
        });
      } else {
        toast({
          title: "Report Generation Failed",
          description: data.message || "Unable to generate report",
          variant: "destructive"
        });
        
        // Set a fallback message
        setReportContent("We couldn't generate a complete report for this property. Please try again later or contact support.");
      }
    },
    onError: (error) => {
      console.error("Error generating report:", error);
      toast({
        title: "Report Error",
        description: "There was a problem generating your report",
        variant: "destructive"
      });
      
      setReportContent("Error: Report generation failed. Our systems encountered an issue while processing your request.");
    },
    onSettled: () => {
      setGeneratingReport(false);
      setProgress(100);
    }
  });

  // Handle generating report
  const handleGenerateReport = async (reportId: string) => {
    setGeneratingReport(true);
    setProgress(0);
    setReportContent("");
    
    // Set active tab to the selected report
    setActiveTab(reportId);
    
    // Start progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 250);
    
    try {
      if (reportId === "verification") {
        // Generate verification report using our AI API
        await verificationReportMutation.mutateAsync(selectedPropertyId);
      } else {
        // For other report types (market analysis, risk assessment), use our AI API as well
        // Just send the report type as a parameter
        const response = await apiRequest<VerificationReportResponse>(
          'GET',
          `/api/properties/${selectedPropertyId}/verification-report?reportType=${reportId}`
        );
        
        if (response.success && response.report) {
          setReportContent(response.report);
          
          toast({
            title: "Report Generated",
            description: `Your ${reportId.replace('-', ' ')} report is ready to view`,
            variant: "default"
          });
        } else {
          toast({
            title: "Report Generation Failed",
            description: response.message || "Unable to generate report",
            variant: "destructive"
          });
          
          setReportContent(`# Error Generating ${reportId.replace('-', ' ')} Report\n\nWe couldn't generate this report at the moment. Please try again later or contact support.`);
        }
      }
      
      clearInterval(interval);
      setProgress(100);
    } catch (error) {
      clearInterval(interval);
      setProgress(0);
      setGeneratingReport(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Comprehensive Property Reports</h1>
          <p className="text-muted-foreground">
            Get detailed insights and analysis about properties and market trends
          </p>
        </div>
        
        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Select Property
            </CardTitle>
            <CardDescription>
              Choose a property to generate reports for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedPropertyId} 
              onValueChange={value => setSelectedPropertyId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Modern Apartment in Kilimani</SelectItem>
                <SelectItem value="2">Beachfront Villa in Diani</SelectItem>
                <SelectItem value="3">Family Home in Karen</SelectItem>
                <SelectItem value="4">Commercial Space in Westlands</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map(report => (
            <Card key={report.id} className={activeTab === report.id ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  {report.icon}
                  {report.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground">{report.description}</p>
                <div className="mt-2">
                  <p className="text-lg font-bold">KES {report.price}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={generatingReport}
                  className="w-full"
                  variant={activeTab === report.id ? "default" : "outline"}
                >
                  {generatingReport && activeTab === report.id ? (
                    <>
                      <Search className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* Progress Indicator */}
        {generatingReport && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              {progress < 100 ? `Generating report... ${progress}%` : "Report ready!"}
            </p>
          </div>
        )}

        {/* Report View */}
        {reportContent && (
          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="market-analysis">Market Analysis</TabsTrigger>
              <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {reports.find(r => r.id === activeTab)?.name || "Report"}
                  </CardTitle>
                  <CardDescription>
                    Generated on {new Date().toLocaleDateString()} for Property #{selectedPropertyId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {reportContent}
                    </pre>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Save as PDF
                  </Button>
                  <Button>
                    <FileText className="mr-2 h-4 w-4" />
                    Print Report
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Report Features */}
        {!reportContent && (
          <Card>
            <CardHeader>
              <CardTitle>Report Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <FileCheck className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-medium">Authenticity Verification</h3>
                    <p className="text-sm text-muted-foreground">
                      AI-powered verification of property documents and records
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium">Market Trends Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      View historical price trends and future projections
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-amber-600" />
                  <div>
                    <h3 className="font-medium">Risk Evaluation</h3>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive risk assessment and investment analysis
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <Clock className="h-8 w-8 text-indigo-600" />
                  <div>
                    <h3 className="font-medium">Historical Records</h3>
                    <p className="text-sm text-muted-foreground">
                      Complete ownership history and transaction timeline
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
