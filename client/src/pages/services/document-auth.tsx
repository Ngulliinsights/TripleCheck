import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type DocumentStatus = 'pending' | 'analyzing' | 'verified' | 'failed';

interface DocumentVerification {
  name: string;
  status: DocumentStatus;
  message: string;
}

export default function DocumentAuthPage() {
  const [documents, setDocuments] = useState<DocumentVerification[]>([]);
  const [progress, setProgress] = useState(0);

  const simulateDocumentAnalysis = async (file: File) => {
    const newDoc: DocumentVerification = {
      name: file.name,
      status: 'analyzing',
      message: 'Analyzing document...'
    };
    
    setDocuments(prev => [...prev, newDoc]);
    
    // Simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }
    
    // Simulate verification result
    const isVerified = Math.random() > 0.2;
    
    setDocuments(prev => prev.map(doc => 
      doc.name === file.name ? {
        name: file.name,
        status: isVerified ? 'verified' : 'failed',
        message: isVerified ? 
          'Document verified successfully.' : 
          'Could not verify document authenticity.'
      } : doc
    ));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        simulateDocumentAnalysis(file);
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Document Authentication</h1>
          <p className="text-muted-foreground">
            Verify the authenticity of property-related documents using our advanced AI system.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Upload Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  Drag and drop your documents here, or click to select files
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  id="document-upload"
                  onChange={handleFileUpload}
                />
                <Button asChild>
                  <Label htmlFor="document-upload">Select Files</Label>
                </Button>
              </div>

              {documents.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Uploaded Documents</h3>
                  {documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">{doc.message}</p>
                        {doc.status === 'analyzing' && (
                          <Progress value={progress} className="mt-2" />
                        )}
                      </div>
                      {doc.status === 'verified' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {doc.status === 'failed' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Document Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li>✓ Title Deeds</li>
              <li>✓ Sale Agreements</li>
              <li>✓ Property Tax Records</li>
              <li>✓ Land Survey Reports</li>
              <li>✓ Building Permits</li>
              <li>✓ Property Insurance Documents</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
