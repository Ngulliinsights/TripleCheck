import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ReportType {
  id: string;
  name: string;
  description: string;
  price: number;
}

export default function ReportsPage() {
  const [generatingReport, setGeneratingReport] = useState(false);
  const [progress, setProgress] = useState(0);

  const reports: ReportType[] = [
    {
      id: "market-analysis",
      name: "Market Analysis Report",
      description: "Comprehensive analysis of property market trends and valuations",
      price: 99
    },
    {
      id: "verification-history",
      name: "Verification History Report",
      description: "Detailed history of property ownership and verification records",
      price: 149
    },
    {
      id: "risk-assessment",
      name: "Risk Assessment Report",
      description: "In-depth evaluation of property investment risks and opportunities",
      price: 199
    }
  ];

  const handleGenerateReport = async (reportId: string) => {
    setGeneratingReport(true);
    setProgress(0);
    
    // Simulate report generation
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(i);
    }
    
    setGeneratingReport(false);
    // In a real implementation, this would trigger a download
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reports.map(report => (
            <Card key={report.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#2C5282]" />
                  {report.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-muted-foreground">{report.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold">KES {report.price}</span>
                  <Button
                    onClick={() => handleGenerateReport(report.id)}
                    disabled={generatingReport}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Generate Report
                  </Button>
                </div>
                {generatingReport && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-center text-muted-foreground">
                      Generating report... {progress}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sample Report Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Sample Report Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <TrendingUp className="h-8 w-8 text-[#2C5282]" />
                <div>
                  <h3 className="font-medium">Market Trends Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    View historical price trends and future projections
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-[#2C5282]" />
                <div>
                  <h3 className="font-medium">Property Documentation</h3>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive documentation and verification status
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
