import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type DocumentStatus = 'pending' | 'analyzing' | 'verified' | 'failed';

interface DocumentVerification {
  id?: string;
  name: string;
  status: DocumentStatus;
  message: string;
  type?: string;
  confidence?: number;
  issues?: string[];
  extractedData?: Record<string, any>;
}

interface VerificationResponse {
  success: boolean;
  result?: {
    propertyId: number;
    overallStatus: string;
    documentVerifications: Array<{
      isVerified: boolean;
      confidence: number;
      issues: string[];
      recommendations: string[];
      documentType: string;
      extractedData: Record<string, any>;
    }>;
    timestamp: string;
    verificationId: string;
  };
  message?: string;
  error?: string;
}

export default function DocumentAuthPage() {
  const [documents, setDocuments] = useState<DocumentVerification[]>([]);
  const [progress, setProgress] = useState(0);
  const [propertyId, setPropertyId] = useState<string>("1"); // Default to first property
  const [documentTypes, setDocumentTypes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Document type options
  const documentTypeOptions = [
    "Title Deed",
    "Sale Agreement",
    "Property Tax Record",
    "Land Survey Report",
    "Building Permit",
    "Property Insurance Document",
    "Land Rate Receipt",
    "Utility Bill"
  ];

  // Handle document type selection for a specific file
  const handleDocumentTypeChange = (value: string, fileName: string) => {
    setDocumentTypes(prev => ({
      ...prev,
      [fileName]: value
    }));
  };

  // Mutation for document verification
  const verifyDocumentsMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      try {
        const response = await apiRequest(`/api/properties/${propertyId}/verify-documents`, {
          method: 'POST',
          body: formData,
        });
        return response as VerificationResponse;
      } catch (error) {
        console.error("Document verification error:", error);
        throw error;
      }
    },
    onSuccess: (data: VerificationResponse) => {
      if (data.success && data.result) {
        // Process verification results
        const verificationResults = data.result.documentVerifications;
        
        // Update the status of each document
        setDocuments(prev => 
          prev.map(doc => {
            // Find matching verification result by name
            const result = verificationResults.find(v => 
              v.documentType === documentTypes[doc.name]
            );
            
            if (result) {
              return {
                ...doc,
                status: result.isVerified ? 'verified' : 'failed',
                confidence: result.confidence,
                issues: result.issues,
                message: result.isVerified 
                  ? `Verified with ${Math.round(result.confidence * 100)}% confidence` 
                  : `Verification failed: ${result.issues[0] || 'Document may not be authentic'}`,
                extractedData: result.extractedData
              };
            }
            return doc;
          })
        );
        
        toast({
          title: "Verification Complete",
          description: `Overall status: ${data.result.overallStatus}`,
          variant: data.result.overallStatus === "verified" ? "default" : "destructive"
        });
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Unable to verify documents",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error("Error verifying documents:", error);
      toast({
        title: "Verification Error",
        description: "There was a problem processing your documents.",
        variant: "destructive"
      });
      
      // Update documents to failed state
      setDocuments(prev => 
        prev.map(doc => doc.status === 'analyzing' ? {
          ...doc,
          status: 'failed',
          message: 'Error during verification process'
        } : doc)
      );
    }
  });

  // Handle document verification with AI
  const verifyDocuments = async (files: FileList) => {
    // Create FormData object
    const formData = new FormData();
    
    // Add property ID
    formData.append('propertyId', propertyId);
    
    // Add each file to the FormData
    Array.from(files).forEach((file, index) => {
      formData.append('documents', file);
      
      // Add document type if specified
      if (documentTypes[file.name]) {
        formData.append('documentTypes', documentTypes[file.name]);
      } else {
        // Default to file extension or generic type
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const defaultType = fileExt === 'pdf' ? 'Title Deed' : 'Property Document';
        formData.append('documentTypes', defaultType);
        
        // Update document types state
        setDocumentTypes(prev => ({
          ...prev,
          [file.name]: defaultType
        }));
      }
      
      // Add document to UI with analyzing status
      setDocuments(prev => [...prev, {
        name: file.name,
        status: 'analyzing',
        message: 'Processing document with AI verification...',
        type: documentTypes[file.name] || 'Unknown'
      }]);
    });
    
    // Start progress animation
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 250);
    
    // Submit verification request
    try {
      await verifyDocumentsMutation.mutateAsync(formData);
      clearInterval(interval);
      setProgress(100);
    } catch (error) {
      clearInterval(interval);
      setProgress(0);
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
              Property Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Property Selection */}
              <div className="grid gap-2">
                <Label htmlFor="property-id">Select Property to Verify</Label>
                <Select 
                  value={propertyId} 
                  onValueChange={value => setPropertyId(value)}
                >
                  <SelectTrigger id="property-id">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Modern Apartment in Kilimani</SelectItem>
                    <SelectItem value="2">Beachfront Villa in Diani</SelectItem>
                    <SelectItem value="3">Family Home in Karen</SelectItem>
                    <SelectItem value="4">Commercial Space in Westlands</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  Drag and drop your property documents here, or click to select files
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Supports PDF, JPG, JPEG, PNG (Max size: 10MB)
                </p>
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  id="document-upload"
                  onChange={handleFileUpload}
                  disabled={verifyDocumentsMutation.isPending}
                />
                <Button asChild disabled={verifyDocumentsMutation.isPending}>
                  <Label htmlFor="document-upload">
                    {verifyDocumentsMutation.isPending ? "Processing..." : "Select Files"}
                  </Label>
                </Button>
              </div>

              {documents.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Document Verification Status</h3>
                  {documents.map((doc, index) => (
                    <div key={index} className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-4 mb-2">
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
                      
                      {/* Document type selection - visible if still analyzing */}
                      {doc.status === 'analyzing' && (
                        <div className="mt-2 pt-2 border-t">
                          <Label htmlFor={`doc-type-${index}`} className="text-sm block mb-1">
                            Document Type:
                          </Label>
                          <Select 
                            value={documentTypes[doc.name] || ''} 
                            onValueChange={(value) => handleDocumentTypeChange(value, doc.name)}
                          >
                            <SelectTrigger id={`doc-type-${index}`} className="text-sm h-8">
                              <SelectValue placeholder="Select document type" />
                            </SelectTrigger>
                            <SelectContent>
                              {documentTypeOptions.map(type => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {/* Show extracted data if available */}
                      {doc.status === 'verified' && doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm font-medium mb-1">Extracted Information:</p>
                          <div className="text-xs grid gap-1">
                            {Object.entries(doc.extractedData).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="font-medium min-w-28">{key}:</span>
                                <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Show issues if failed */}
                      {doc.status === 'failed' && doc.issues && doc.issues.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-sm font-medium text-red-500 mb-1">Issues Found:</p>
                          <ul className="text-xs text-red-400 list-disc list-inside">
                            {doc.issues.map((issue, idx) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
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
