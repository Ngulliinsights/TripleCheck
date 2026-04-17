import React, { useState, useCallback, useRef } from 'react'
import { 
  Upload, 
  FileText, 
  Image, 
  X, 
  CheckCircle,
  AlertTriangle,
  Eye,
  Trash2,
  Camera,
  Scan,
  Shield,
  Clock,
  User,
  MapPin
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { Label } from '../components/ui/label'
import { Progress } from '../components/ui/progress'
import { useToast } from '../hooks/use-toast'
import { formatFileSize } from '../utils/generic-formatters'

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  preview?: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

interface DocumentMetadata {
  documentType: string;
  propertyId?: string;
  propertyAddress?: string;
  description: string;
  tags: string[];
  isPublic: boolean;
  expiryDate?: string;
}

const documentTypes = [
  { value: 'title-deed', label: 'Title Deed', icon: FileText },
  { value: 'survey-plan', label: 'Survey Plan', icon: FileText },
  { value: 'id-copy', label: 'ID Copy', icon: User },
  { value: 'passport-copy', label: 'Passport Copy', icon: User },
  { value: 'lease-agreement', label: 'Lease Agreement', icon: FileText },
  { value: 'sale-agreement', label: 'Sale Agreement', icon: FileText },
  { value: 'valuation-report', label: 'Valuation Report', icon: FileText },
  { value: 'inspection-report', label: 'Inspection Report', icon: FileText },
  { value: 'property-photos', label: 'Property Photos', icon: Image },
  { value: 'other', label: 'Other Document', icon: FileText }
];

const maxFileSize = 10 * 1024 * 1024; // 10MB
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export default function DocumentUpload() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    documentType: '',
    propertyAddress: '',
    description: '',
    tags: [],
    isPublic: false
  });

  const updateMetadata = useCallback(<K extends keyof DocumentMetadata>(
    key: K,
    value: DocumentMetadata[K]
  ) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  }, []);

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${maxFileSize / 1024 / 1024}MB`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, Word, or image files.';
    }
    
    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newUploadFiles: UploadFile[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);
      const preview = await createFilePreview(file);
      
      const uploadFile: UploadFile = {
        id: generateFileId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview,
        uploadProgress: 0,
        status: validationError ? 'error' : 'pending',
        errorMessage: validationError || undefined
      };
      
      newUploadFiles.push(uploadFile);
    }

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
    
    // Show validation errors
    const errorFiles = newUploadFiles.filter(f => f.status === 'error');
    if (errorFiles.length > 0) {
      toast({
        title: 'Some files could not be added',
        description: `${errorFiles.length} file(s) have validation errors.`,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  }, [processFiles]);

  const removeFile = useCallback((fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const simulateUpload = useCallback(async (fileId: string) => {
    const updateProgress = (progress: number) => {
      setUploadFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, uploadProgress: progress, status: 'uploading' } : f
      ));
    };

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      updateProgress(progress);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Mark as completed
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'completed' } : f
    ));
  }, []);

  const handleUploadAll = useCallback(async () => {
    if (!metadata.documentType) {
      toast({
        title: 'Document type required',
        description: 'Please select a document type before uploading.',
        variant: 'destructive'
      });
      return;
    }

    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast({
        title: 'No files to upload',
        description: 'Please add some files first.',
        variant: 'destructive'
      });
      return;
    }

    // Start uploading all pending files
    const uploadPromises = pendingFiles.map(file => simulateUpload(file.id));
    
    try {
      await Promise.all(uploadPromises);
      
      toast({
        title: 'Upload completed',
        description: `${pendingFiles.length} file(s) uploaded successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Some files failed to upload. Please try again.',
        variant: 'destructive'
      });
    }
  }, [uploadFiles, metadata.documentType, simulateUpload, toast]);

  const handleClearAll = useCallback(() => {
    setUploadFiles([]);
  }, []);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    return FileText;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'uploading':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const totalFiles = uploadFiles.length;
  const completedFiles = uploadFiles.filter(f => f.status === 'completed').length;
  const errorFiles = uploadFiles.filter(f => f.status === 'error').length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Upload className="w-8 h-8 text-green-500" />
            Document Upload
          </h1>
          <p className="text-muted-foreground">
            Upload and verify property documents with AI assistance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Drop Zone */}
            <Card>
              <CardContent className="p-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Drop files here or click to browse
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Support for PDF, Word documents, and images up to 10MB
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Files
                      </Button>
                      
                      <Button variant="outline">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                      
                      <Button variant="outline">
                        <Scan className="w-4 h-4 mr-2" />
                        Scan Document
                      </Button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Progress */}
            {totalFiles > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Upload Progress</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {completedFiles}/{totalFiles} completed
                      </Badge>
                      {errorFiles > 0 && (
                        <Badge variant="destructive">
                          {errorFiles} errors
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {uploadFiles.map((file) => {
                      const FileIcon = getFileIcon(file.type);
                      
                      return (
                        <div key={file.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {file.preview ? (
                              <img 
                                src={file.preview} 
                                alt={file.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="p-2 bg-muted rounded">
                                <FileIcon className="w-6 h-6" />
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{file.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatFileSize(file.size)}
                              </p>
                              
                              {file.status === 'uploading' && (
                                <Progress value={file.uploadProgress} className="mt-2" />
                              )}
                              
                              {file.errorMessage && (
                                <p className="text-sm text-red-600 mt-1">
                                  {file.errorMessage}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {getStatusIcon(file.status)}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(file.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      onClick={handleUploadAll}
                      disabled={uploadFiles.filter(f => f.status === 'pending').length === 0}
                    >
                      Upload All Files
                    </Button>
                    
                    <Button variant="outline" onClick={handleClearAll}>
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Metadata Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="document-type">Document Type *</Label>
                  <Select
                    value={metadata.documentType}
                    onValueChange={(value) => updateMetadata('documentType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="property-address">Property Address</Label>
                  <Textarea
                    id="property-address"
                    placeholder="Enter property address (if applicable)"
                    value={metadata.propertyAddress}
                    onChange={(e) => updateMetadata('propertyAddress', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the document"
                    value={metadata.description}
                    onChange={(e) => updateMetadata('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={metadata.expiryDate}
                    onChange={(e) => updateMetadata('expiryDate', e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is-public"
                    checked={metadata.isPublic}
                    onChange={(e) => updateMetadata('isPublic', e.target.checked)}
                  />
                  <Label htmlFor="is-public" className="text-sm">
                    Make document publicly viewable
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Upload Guidelines */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security & Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>All documents are encrypted and stored securely</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>AI-powered document verification and fraud detection</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Automatic OCR text extraction for searchability</span>
                </div>
                
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Version control and audit trail maintained</span>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-1">Supported Formats</h4>
                  <p className="text-blue-700 text-xs">
                    PDF, Word (.doc, .docx), Images (.jpg, .png) up to 10MB each
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View My Documents
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Document Templates
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Verification Status
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}