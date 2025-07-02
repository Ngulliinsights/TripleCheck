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
}