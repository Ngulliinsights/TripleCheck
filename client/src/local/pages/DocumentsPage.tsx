import React, { useState, useCallback, useMemo } from 'react'
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2,
  Search,
  Filter,
  FolderOpen,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Share2,
  Star,
  Calendar,
  User,
  Tag
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useToast } from '../hooks/use-toast'
import { formatFileSize, getDocumentStatusColor } from '../utils/generic-formatters'

interface Document {
  id: string;
  name: string;
  type: 'title-deed' | 'survey-plan' | 'id-copy' | 'lease-agreement' | 'sale-agreement' | 'other';
  propertyId?: string;
  propertyAddress?: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verificationDate?: Date;
  expiryDate?: Date;
  tags: string[];
  shared: boolean;
  starred: boolean;
  url: string;
  thumbnail?: string;
  verificationNotes?: string;
}

interface DocumentFolder {
  id: string;
  name: string;
  documentCount: number;
  lastModified: Date;
  color: string;
}

// Mock data
const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'Title Deed - Westlands Property.pdf',
    type: 'title-deed',
    propertyId: 'prop-123',
    propertyAddress: '123 Westlands Road, Nairobi',
    size: 2048576, // 2MB
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    uploadedBy: 'current-user',
    status: 'verified',
    verificationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    tags: ['property-123', 'title-deed', 'verified'],
    shared: false,
    starred: true,
    url: '/documents/title-deed-123.pdf'
  },
  {
    id: 'doc-2',
    name: 'Survey Plan - Karen Villa.pdf',
    type: 'survey-plan',
    propertyId: 'prop-456',
    propertyAddress: '456 Karen Close, Nairobi',
    size: 1536000, // 1.5MB
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    uploadedBy: 'current-user',
    status: 'pending',
    tags: ['property-456', 'survey', 'karen'],
    shared: true,
    starred: false,
    url: '/documents/survey-plan-456.pdf'
  },
  {
    id: 'doc-3',
    name: 'National ID Copy.pdf',
    type: 'id-copy',
    size: 512000, // 512KB
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
    uploadedBy: 'current-user',
    status: 'verified',
    verificationDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5), // 5 years
    tags: ['identity', 'personal'],
    shared: false,
    starred: false,
    url: '/documents/id-copy.pdf'
  },
  {
    id: 'doc-4',
    name: 'Lease Agreement - Kilimani Apartment.pdf',
    type: 'lease-agreement',
    propertyId: 'prop-789',
    propertyAddress: '789 Kilimani Street, Nairobi',
    size: 1024000, // 1MB
    uploadedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    uploadedBy: 'current-user',
    status: 'rejected',
    verificationNotes: 'Document appears to be incomplete. Missing landlord signature.',
    tags: ['lease', 'kilimani', 'rental'],
    shared: false,
    starred: false,
    url: '/documents/lease-agreement-789.pdf'
  }
];

const mockFolders: DocumentFolder[] = [
  {
    id: 'folder-1',
    name: 'Property Documents',
    documentCount: 8,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'folder-2',
    name: 'Personal Documents',
    documentCount: 3,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'folder-3',
    name: 'Legal Documents',
    documentCount: 5,
    lastModified: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    color: 'bg-purple-100 text-purple-800'
  }
];

const documentTypeIcons = {
  'title-deed': FileText,
  'survey-plan': FileText,
  'id-copy': User,
  'lease-agreement': FileText,
  'sale-agreement': FileText,
  'other': FileText
};

export default function DocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState(mockDocuments);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = !searchQuery || 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === 'all' || doc.type === filterType;
      const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchQuery, filterType, filterStatus]);

  const handleDocumentSelect = useCallback((docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  }, [selectedDocuments.length, filteredDocuments]);

  const handleStarDocument = useCallback((docId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === docId ? { ...doc, starred: !doc.starred } : doc
    ));
  }, []);

  const handleDeleteDocuments = useCallback(() => {
    if (selectedDocuments.length === 0) return;
    
    setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
    setSelectedDocuments([]);
    
    toast({
      title: 'Documents deleted',
      description: `${selectedDocuments.length} document(s) have been deleted.`,
    });
  }, [selectedDocuments, toast]);

  const handleDownloadDocument = useCallback((doc: Document) => {
    // Simulate download
    toast({
      title: 'Download started',
      description: `Downloading ${doc.name}...`,
    });
  }, [toast]);

  const handleShareDocument = useCallback((doc: Document) => {
    setDocuments(prev => prev.map(d => 
      d.id === doc.id ? { ...d, shared: !d.shared } : d
    ));
    
    toast({
      title: doc.shared ? 'Document unshared' : 'Document shared',
      description: doc.shared ? 
        'Document is no longer shared.' : 
        'Document sharing link has been generated.',
    });
  }, [toast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'expired':
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            Document Management
          </h1>
          <p className="text-muted-foreground">
            Manage and organize your property documents securely
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{documents.length}</div>
                  <div className="text-xs text-muted-foreground">Total Documents</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {documents.filter(d => d.status === 'verified').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Verified</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {documents.filter(d => d.status === 'pending').length}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {documents.filter(d => d.shared).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Shared</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Folders */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockFolders.map((folder) => (
              <Card key={folder.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${folder.color}`}>
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{folder.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {folder.documentCount} documents
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="title-deed">Title Deeds</SelectItem>
                    <SelectItem value="survey-plan">Survey Plans</SelectItem>
                    <SelectItem value="id-copy">ID Copies</SelectItem>
                    <SelectItem value="lease-agreement">Lease Agreements</SelectItem>
                    <SelectItem value="sale-agreement">Sale Agreements</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedDocuments.length === filteredDocuments.length ? 'Deselect All' : 'Select All'}
                </Button>
                
                {selectedDocuments.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteDocuments}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete ({selectedDocuments.length})
                  </Button>
                )}

                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((doc) => {
            const IconComponent = documentTypeIcons[doc.type];
            const isSelected = selectedDocuments.includes(doc.id);
            
            return (
              <Card 
                key={doc.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleDocumentSelect(doc.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-muted rounded-full">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStarDocument(doc.id);
                        }}
                        className={`p-1 rounded ${doc.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                      >
                        <Star className={`w-4 h-4 ${doc.starred ? 'fill-current' : ''}`} />
                      </button>
                      {getStatusIcon(doc.status)}
                    </div>
                  </div>

                  <h3 className="font-medium text-sm mb-2 line-clamp-2">
                    {doc.name}
                  </h3>

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Size:</span>
                      <span>{formatFileSize(doc.size)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Uploaded:</span>
                      <span>{formatDate(doc.uploadedAt)}</span>
                    </div>

                    {doc.propertyAddress && (
                      <div className="flex items-start gap-1">
                        <span className="flex-shrink-0">Property:</span>
                        <span className="line-clamp-2">{doc.propertyAddress}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <Badge className={getDocumentStatusColor(doc.status)}>
                      {doc.status}
                    </Badge>
                  </div>

                  {doc.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {doc.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{doc.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-1 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadDocument(doc);
                      }}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareDocument(doc);
                      }}
                    >
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>

                  {doc.verificationNotes && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                      {doc.verificationNotes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'Upload your first document to get started.'
                }
              </p>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}