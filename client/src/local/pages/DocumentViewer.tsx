import React, { useState, useCallback } from 'react'
import { 
  FileText, 
  Download, 
  Share2, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  Search,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  User,
  Calendar,
  Tag
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { useToast } from '../hooks/use-toast'

interface DocumentInfo {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  status: 'verified' | 'pending' | 'rejected';
  verificationDate?: Date;
  pages: number;
  tags: string[];
  propertyAddress?: string;
  description?: string;
  url: string;
}

// Mock document data
const mockDocument: DocumentInfo = {
  id: 'doc-123',
  name: 'Title Deed - Westlands Property.pdf',
  type: 'title-deed',
  size: 2048576,
  uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  uploadedBy: 'John Doe',
  status: 'verified',
  verificationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  pages: 4,
  tags: ['title-deed', 'property-123', 'verified'],
  propertyAddress: '123 Westlands Road, Nairobi',
  description: 'Original title deed for the Westlands property showing clear ownership',
  url: '/documents/title-deed-123.pdf'
};

export default function DocumentViewer() {
  const { toast } = useToast();
  const [document] = useState<DocumentInfo>(mockDocument);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [searchText, setSearchText] = useState('');

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 25, 300));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 25, 25));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, document.pages));
  }, [document.pages]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const handleDownload = useCallback(() => {
    toast({
      title: 'Download started',
      description: `Downloading ${document.name}...`,
    });
  }, [document.name, toast]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied',
      description: 'Document sharing link copied to clipboard.',
    });
  }, [toast]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen'} bg-background`}>
      <div className="container mx-auto px-4 py-8 h-full">
        {!isFullscreen && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-500" />
              Document Viewer
            </h1>
            <p className="text-muted-foreground">
              View and analyze property documents with advanced tools
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Document Viewer */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{document.name}</h3>
                  <Badge className={getStatusColor(document.status)}>
                    {document.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>Page {currentPage} of {document.pages}</span>
                  </div>
                  
                  <Button size="sm" variant="outline" onClick={handlePrevPage} disabled={currentPage === 1}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  
                  <Button size="sm" variant="outline" onClick={handleNextPage} disabled={currentPage === document.pages}>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <div className="border-l pl-2 ml-2 flex items-center gap-1">
                    <Button size="sm" variant="outline" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    
                    <span className="text-sm min-w-[60px] text-center">{zoomLevel}%</span>
                    
                    <Button size="sm" variant="outline" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button size="sm" variant="outline" onClick={handleRotate}>
                    <RotateCw className="w-4 h-4" />
                  </Button>

                  <Button size="sm" variant="outline" onClick={() => setShowAnnotations(!showAnnotations)}>
                    {showAnnotations ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>

                  <Button size="sm" variant="outline" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Document Display Area */}
              <div className="flex-1 p-4 bg-gray-100 overflow-auto">
                <div className="flex justify-center">
                  <div 
                    className="bg-white shadow-lg"
                    style={{
                      transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    {/* Mock PDF Page */}
                    <div className="w-[595px] h-[842px] border border-gray-300 bg-white p-8 relative">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">REPUBLIC OF KENYA</h2>
                        <h3 className="text-xl font-semibold mb-4">MINISTRY OF LANDS</h3>
                        <h4 className="text-lg font-medium">TITLE DEED</h4>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <strong>Title Number:</strong> NAIROBI/BLOCK 45/123
                          </div>
                          <div>
                            <strong>Date of Issue:</strong> 15th March 2020
                          </div>
                        </div>

                        <div>
                          <strong>Property Description:</strong><br />
                          ALL THAT piece of land situate in the area known as WESTLANDS
                          in NAIROBI COUNTY containing by measurement 0.25 hectares or
                          thereabouts and bounded as shown on the plan annexed hereto.
                        </div>

                        <div>
                          <strong>Registered Owner:</strong><br />
                          JOHN DOE of P.O. Box 12345, Nairobi
                        </div>

                        <div className="mt-8">
                          <strong>Encumbrances:</strong> None
                        </div>

                        {showAnnotations && (
                          <div className="absolute top-4 right-4 bg-yellow-200 p-2 rounded text-xs max-w-[200px]">
                            <strong>Verification Note:</strong> Document verified on {formatDate(document.verificationDate!)}
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-8 right-8 text-xs text-gray-500">
                        Page {currentPage} of {document.pages}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search in document..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm">Find</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Document Info Sidebar */}
          <div className="space-y-6">
            {/* Document Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(document.status)}
                  Document Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">{document.name}</h4>
                  <p className="text-sm text-muted-foreground">{document.description}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="capitalize">{document.type.replace('-', ' ')}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Size:</span>
                    <span>{formatFileSize(document.size)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Pages:</span>
                    <span>{document.pages}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge className={getStatusColor(document.status)}>
                      {document.status}
                    </Badge>
                  </div>
                </div>

                {document.propertyAddress && (
                  <div>
                    <h5 className="font-medium mb-1">Property Address</h5>
                    <p className="text-sm text-muted-foreground">{document.propertyAddress}</p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Uploaded by {document.uploadedBy}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(document.uploadedAt)}</span>
                  </div>

                  {document.verificationDate && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <span>Verified {formatDate(document.verificationDate)}</span>
                    </div>
                  )}
                </div>

                {document.tags.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Tags
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {document.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                
                <Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  View History
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Verification Details
                </Button>
              </CardContent>
            </Card>

            {/* Verification Status */}
            {document.status === 'verified' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    Verified Document
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Document authenticity confirmed</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>No signs of tampering detected</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Metadata validation passed</span>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-green-800 text-xs">
                        This document has been verified using AI-powered analysis and 
                        cross-referenced with official records.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Page Thumbnails */}
            <Card>
              <CardHeader>
                <CardTitle>Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: document.pages }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`aspect-[3/4] border-2 rounded p-2 text-xs transition-colors ${
                        currentPage === i + 1 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-primary/50'
                      }`}
                    >
                      <div className="w-full h-full bg-white border flex items-center justify-center">
                        Page {i + 1}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}