import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Image, 
  File,
  X,
  CheckCircle,
  AlertTriangle,
  Clock,
  Camera,
  Scan,
  Shield,
  Eye,
  Download
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Alert, AlertDescription, AlertTitle } from '../../shared/components/ui/alert';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Progress } from '../../shared/components/ui/progress';
import { useToast } from '../../shared/hooks/use-toast';
import { useDocumentAuthentication } from '../hooks/useDocumentAuthentication';

import { DocumentVerificationResults } from './DocumentVerificationResults';

interface DocumentUploadInterfaceProps {
  onVerificationComplete?: (result: any) => void;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  showResults?: boolean;
}

const ACCEPTED_DOCUMENT_TYPES = [
  { type: 'application/pdf', name: 'PDF Documents', icon: FileText, description: 'Title deeds, agreements, certificates' },
  { type: 'image/jpeg', name: 'JPEG Images', icon: Image, description: 'Scanned documents, photos' },
  { type: 'image/png', name: 'PNG Images', icon: Image, description: 'High-quality scans' },
  { type: 'image/tiff', name: 'TIFF Images', icon: Image, description: 'Professional scans' }
];

const DOCUMENT_CATEGORIES = [
  { id: 'title_deed', name: 'Title Deed', icon: '📜', description: 'Official land ownership document' },
  { id: 'sale_agreement', name: 'Sale Agreement', icon: '📋', description: 'Property purchase agreement' },
  { id: 'survey_plan', name: 'Survey Plan', icon: '🗺️', description: 'Land survey and boundaries' },
  { id: 'compliance_certificate', name: 'Compliance Certificate', icon: '✅', description: 'Government compliance document' },
  { id: 'other', name: 'Other Document', icon: '📄', description: 'Other land-related document' }
];

export function DocumentUploadInterface({ 
  onVerificationComplete,
  maxFileSize = 10, // 10MB default
  acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff'],
  showResults = true
}: DocumentUploadInterfaceProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [verificationResults, setVerificationResults] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const {
    verifyDocument,
    isVerifying,
    formatFileSize
  } = useDocumentAuthentication();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.filter(file => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive"
        });
        return false;
      }

      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: `${file.name} exceeds the ${maxFileSize}MB limit.`,
          variant: "destructive"
        });
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...validFiles]);
      
      // Start verification for each file
      validFiles.forEach(file => {
        handleVerifyDocument(file);
      });
    }
  };

  const handleVerifyDocument = async (file: File) => {
    const fileId = `${file.name}-${Date.now()}`;
    
    try {
      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          if (currentProgress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [fileId]: currentProgress + 10 };
        });
      }, 200);

      const result = await verifyDocument(file);
      
      // Complete progress
      setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
      setVerificationResults(prev => ({ ...prev, [fileId]: result.id }));
      
      if (onVerificationComplete) {
        onVerificationComplete(result);
      }

      toast({
        title: "Verification Complete",
        description: `${file.name} has been analyzed. Status: ${result.status}`,
        variant: result.status === 'authentic' ? 'default' : 'destructive'
      });

    } catch (error) {
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Failed to verify document",
        variant: "destructive"
      });
    }
  };

  const removeFile = (index: number) => {
    const file = uploadedFiles[index];
    const fileId = `${file.name}-${Date.now()}`;
    
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
    setVerificationResults(prev => {
      const newResults = { ...prev };
      delete newResults[fileId];
      return newResults;
    });
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    if (file.type === 'application/pdf') return FileText;
    return File;
  };

  const getFileStatus = (file: File, index: number) => {
    const fileId = `${file.name}-${Date.now()}`;
    const progress = uploadProgress[fileId];
    const resultId = verificationResults[fileId];

    if (resultId) return 'completed';
    if (progress !== undefined && progress > 0) return 'processing';
    return 'pending';
  };

  return (
    <div className="space-y-6">
      {/* Document Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Document Category</span>
          </CardTitle>
          <CardDescription>
            Select the type of document you're uploading for optimized verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DOCUMENT_CATEGORIES.map((category) => (
              <Card 
                key={category.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedCategory === category.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h4 className="font-semibold text-sm mb-1">{category.name}</h4>
                  <p className="text-xs text-gray-600">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Documents</span>
          </CardTitle>
          <CardDescription>
            Drag and drop your documents or click to browse. Maximum file size: {maxFileSize}MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drop your documents here
                </h3>
                <p className="text-gray-600 mb-4">
                  or click to browse your files
                </p>
                
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" size="sm">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button variant="outline" size="sm">
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Document
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Accepted File Types */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Accepted File Types:</h4>
            <div className="flex flex-wrap gap-2">
              {ACCEPTED_DOCUMENT_TYPES.map((docType) => {
                const Icon = docType.icon;
                return (
                  <div key={docType.type} className="flex items-center space-x-2 text-xs text-gray-600">
                    <Icon className="h-3 w-3" />
                    <span>{docType.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              Track the verification progress of your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {uploadedFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file);
                  const status = getFileStatus(file, index);
                  const fileId = `${file.name}-${Date.now()}`;
                  const progress = uploadProgress[fileId] || 0;
                  const resultId = verificationResults[fileId];

                  return (
                    <motion.div
                      key={`${file.name}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <FileIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {file.name}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{formatFileSize(file.size)}</span>
                                  <span>{file.type}</span>
                                  <span>
                                    {new Date(file.lastModified).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {status === 'completed' && (
                                <Badge variant="default" className="flex items-center space-x-1">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Verified</span>
                                </Badge>
                              )}
                              
                              {status === 'processing' && (
                                <Badge variant="secondary" className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3 animate-spin" />
                                  <span>Processing</span>
                                </Badge>
                              )}
                              
                              {status === 'pending' && (
                                <Badge variant="outline">
                                  Pending
                                </Badge>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {status === 'processing' && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Analyzing document...</span>
                                <span>{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}

                          {/* Verification Results Preview */}
                          {status === 'completed' && resultId && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Verification completed
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Scroll to results or open modal
                                    const resultsElement = document.getElementById(`results-${resultId}`);
                                    if (resultsElement) {
                                      resultsElement.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Results
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Security & Privacy</AlertTitle>
        <AlertDescription>
          Your documents are processed securely and are automatically deleted after verification. 
          We use advanced encryption and do not store your sensitive documents permanently.
        </AlertDescription>
      </Alert>

      {/* Verification Results */}
      {showResults && Object.values(verificationResults).map((resultId) => (
        <div key={resultId} id={`results-${resultId}`}>
          <DocumentVerificationResults 
            documentId={resultId}
            onRecommendationAction={(action, recommendation) => {
              toast({
                title: "Action Taken",
                description: `${action} for recommendation: ${recommendation}`,
              });
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default DocumentUploadInterface;