import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, AlertTriangle, Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function DocumentAuthPage() {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      verifyDocuments(files);
    }
  };

  // Document verification mutation
  const verifyDocumentsMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file, index) => {
        formData.append('documents', file);
        formData.append('documentTypes', 'Property Document');
      });

      const response = await fetch('/api/properties/1/verify-documents', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to verify documents');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.result);
      setProgress(100);
      setIsVerifying(false);
      toast({
        title: "Documents Verified",
        description: "Your documents have been successfully analyzed",
        variant: "default"
      });
    },
    onError: (error) => {
      console.error('Document verification error:', error);
      setIsVerifying(false);
      setProgress(0);
      toast({
        title: "Verification Failed",
        description: "There was an error verifying your documents",
        variant: "destructive"
      });
    }
  });

  const verifyDocuments = async (files: FileList) => {
    setIsVerifying(true);
    setProgress(0);
    setResults(null);

    // Start progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 300);

    try {
      await verifyDocumentsMutation.mutateAsync(files);
      clearInterval(interval);
    } catch (error) {
      clearInterval(interval);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      verifyDocuments(files);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Document Authentication</CardTitle>
          <CardDescription>
            Upload your property documents for verification and authentication
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="block">
                <span className="mt-2 block text-sm font-medium">
                  Drag and drop your documents here, or
                </span>
                <Button 
                  variant="link" 
                  className="text-primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse to upload
                </Button>
              </Label>
              <Input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                className="hidden"
                multiple
                onChange={handleFileUpload}
              />
              <p className="text-sm text-gray-500">
                Supported formats: PDF, JPG, PNG (up to 10MB each)
              </p>
            </div>
          </div>

          {isVerifying && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Verifying documents...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold">Verification Results</h3>
              <div className="grid gap-4">
                {results.map((result: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="flex items-start space-x-4 p-4">
                      {result.verified ? (
                        <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="font-medium">{result.documentType}</h4>
                        <p className="text-sm text-gray-500">{result.message}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}