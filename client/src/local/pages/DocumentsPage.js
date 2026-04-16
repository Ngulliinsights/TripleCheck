"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DocumentsPage;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../components/ui/button");
var input_1 = require("../components/ui/input");
var card_1 = require("../components/ui/card");
var badge_1 = require("../components/ui/badge");
var select_1 = require("../components/ui/select");
var use_toast_1 = require("../hooks/use-toast");
// Mock data
var mockDocuments = [
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
var mockFolders = [
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
var documentTypeIcons = {
    'title-deed': lucide_react_1.FileText,
    'survey-plan': lucide_react_1.FileText,
    'id-copy': lucide_react_1.User,
    'lease-agreement': lucide_react_1.FileText,
    'sale-agreement': lucide_react_1.FileText,
    'other': lucide_react_1.FileText
};
function DocumentsPage() {
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)(mockDocuments), documents = _a[0], setDocuments = _a[1];
    var _b = (0, react_1.useState)([]), selectedDocuments = _b[0], setSelectedDocuments = _b[1];
    var _c = (0, react_1.useState)(''), searchQuery = _c[0], setSearchQuery = _c[1];
    var _d = (0, react_1.useState)('all'), filterType = _d[0], setFilterType = _d[1];
    var _e = (0, react_1.useState)('all'), filterStatus = _e[0], setFilterStatus = _e[1];
    var _f = (0, react_1.useState)('grid'), viewMode = _f[0], setViewMode = _f[1];
    var filteredDocuments = (0, react_1.useMemo)(function () {
        return documents.filter(function (doc) {
            var _a;
            var matchesSearch = !searchQuery ||
                doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.tags.some(function (tag) { return tag.toLowerCase().includes(searchQuery.toLowerCase()); }) ||
                ((_a = doc.propertyAddress) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchQuery.toLowerCase()));
            var matchesType = filterType === 'all' || doc.type === filterType;
            var matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [documents, searchQuery, filterType, filterStatus]);
    var handleDocumentSelect = (0, react_1.useCallback)(function (docId) {
        setSelectedDocuments(function (prev) {
            return prev.includes(docId)
                ? prev.filter(function (id) { return id !== docId; })
                : __spreadArray(__spreadArray([], prev, true), [docId], false);
        });
    }, []);
    var handleSelectAll = (0, react_1.useCallback)(function () {
        if (selectedDocuments.length === filteredDocuments.length) {
            setSelectedDocuments([]);
        }
        else {
            setSelectedDocuments(filteredDocuments.map(function (doc) { return doc.id; }));
        }
    }, [selectedDocuments.length, filteredDocuments]);
    var handleStarDocument = (0, react_1.useCallback)(function (docId) {
        setDocuments(function (prev) { return prev.map(function (doc) {
            return doc.id === docId ? __assign(__assign({}, doc), { starred: !doc.starred }) : doc;
        }); });
    }, []);
    var handleDeleteDocuments = (0, react_1.useCallback)(function () {
        if (selectedDocuments.length === 0)
            return;
        setDocuments(function (prev) { return prev.filter(function (doc) { return !selectedDocuments.includes(doc.id); }); });
        setSelectedDocuments([]);
        toast({
            title: 'Documents deleted',
            description: "".concat(selectedDocuments.length, " document(s) have been deleted."),
        });
    }, [selectedDocuments, toast]);
    var handleDownloadDocument = (0, react_1.useCallback)(function (doc) {
        // Simulate download
        toast({
            title: 'Download started',
            description: "Downloading ".concat(doc.name, "..."),
        });
    }, [toast]);
    var handleShareDocument = (0, react_1.useCallback)(function (doc) {
        setDocuments(function (prev) { return prev.map(function (d) {
            return d.id === doc.id ? __assign(__assign({}, d), { shared: !d.shared }) : d;
        }); });
        toast({
            title: doc.shared ? 'Document unshared' : 'Document shared',
            description: doc.shared ?
                'Document is no longer shared.' :
                'Document sharing link has been generated.',
        });
    }, [toast]);
    var getStatusColor = function (status) {
        switch (status) {
            case 'verified':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'expired':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    var getStatusIcon = function (status) {
        switch (status) {
            case 'verified':
                return <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>;
            case 'pending':
                return <lucide_react_1.Clock className="w-4 h-4 text-yellow-500"/>;
            case 'rejected':
                return <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-500"/>;
            case 'expired':
                return <lucide_react_1.AlertTriangle className="w-4 h-4 text-gray-500"/>;
            default:
                return <lucide_react_1.FileText className="w-4 h-4"/>;
        }
    };
    var formatFileSize = function (bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    var formatDate = function (date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };
    return (<div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <lucide_react_1.FileText className="w-8 h-8 text-blue-500"/>
            Document Management
          </h1>
          <p className="text-muted-foreground">
            Manage and organize your property documents securely
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <card_1.Card>
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.FileText className="w-5 h-5 text-blue-500"/>
                <div>
                  <div className="text-2xl font-bold">{documents.length}</div>
                  <div className="text-xs text-muted-foreground">Total Documents</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.CheckCircle className="w-5 h-5 text-green-500"/>
                <div>
                  <div className="text-2xl font-bold">
                    {documents.filter(function (d) { return d.status === 'verified'; }).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Verified</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.Clock className="w-5 h-5 text-yellow-500"/>
                <div>
                  <div className="text-2xl font-bold">
                    {documents.filter(function (d) { return d.status === 'pending'; }).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card>
            <card_1.CardContent className="p-4">
              <div className="flex items-center gap-2">
                <lucide_react_1.Share2 className="w-5 h-5 text-purple-500"/>
                <div>
                  <div className="text-2xl font-bold">
                    {documents.filter(function (d) { return d.shared; }).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Shared</div>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Folders */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Folders</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockFolders.map(function (folder) { return (<card_1.Card key={folder.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <card_1.CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={"p-2 rounded-full ".concat(folder.color)}>
                      <lucide_react_1.FolderOpen className="w-5 h-5"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{folder.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {folder.documentCount} documents
                      </p>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>
        </div>

        {/* Controls */}
        <card_1.Card className="mb-6">
          <card_1.CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-4 flex-1">
                <div className="flex-1">
                  <input_1.Input placeholder="Search documents..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }}/>
                </div>
                
                <select_1.Select value={filterType} onValueChange={setFilterType}>
                  <select_1.SelectTrigger className="w-full md:w-48">
                    <select_1.SelectValue placeholder="All Types"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="all">All Types</select_1.SelectItem>
                    <select_1.SelectItem value="title-deed">Title Deeds</select_1.SelectItem>
                    <select_1.SelectItem value="survey-plan">Survey Plans</select_1.SelectItem>
                    <select_1.SelectItem value="id-copy">ID Copies</select_1.SelectItem>
                    <select_1.SelectItem value="lease-agreement">Lease Agreements</select_1.SelectItem>
                    <select_1.SelectItem value="sale-agreement">Sale Agreements</select_1.SelectItem>
                    <select_1.SelectItem value="other">Other</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>

                <select_1.Select value={filterStatus} onValueChange={setFilterStatus}>
                  <select_1.SelectTrigger className="w-full md:w-48">
                    <select_1.SelectValue placeholder="All Status"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="all">All Status</select_1.SelectItem>
                    <select_1.SelectItem value="verified">Verified</select_1.SelectItem>
                    <select_1.SelectItem value="pending">Pending</select_1.SelectItem>
                    <select_1.SelectItem value="rejected">Rejected</select_1.SelectItem>
                    <select_1.SelectItem value="expired">Expired</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              <div className="flex items-center gap-2">
                <button_1.Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedDocuments.length === filteredDocuments.length ? 'Deselect All' : 'Select All'}
                </button_1.Button>
                
                {selectedDocuments.length > 0 && (<button_1.Button variant="destructive" size="sm" onClick={handleDeleteDocuments}>
                    <lucide_react_1.Trash2 className="w-4 h-4 mr-2"/>
                    Delete ({selectedDocuments.length})
                  </button_1.Button>)}

                <button_1.Button>
                  <lucide_react_1.Upload className="w-4 h-4 mr-2"/>
                  Upload
                </button_1.Button>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map(function (doc) {
            var IconComponent = documentTypeIcons[doc.type];
            var isSelected = selectedDocuments.includes(doc.id);
            return (<card_1.Card key={doc.id} className={"cursor-pointer transition-all hover:shadow-md ".concat(isSelected ? 'ring-2 ring-primary' : '')} onClick={function () { return handleDocumentSelect(doc.id); }}>
                <card_1.CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-muted rounded-full">
                      <IconComponent className="w-6 h-6"/>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={function (e) {
                    e.stopPropagation();
                    handleStarDocument(doc.id);
                }} className={"p-1 rounded ".concat(doc.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500')}>
                        <lucide_react_1.Star className={"w-4 h-4 ".concat(doc.starred ? 'fill-current' : '')}/>
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

                    {doc.propertyAddress && (<div className="flex items-start gap-1">
                        <span className="flex-shrink-0">Property:</span>
                        <span className="line-clamp-2">{doc.propertyAddress}</span>
                      </div>)}
                  </div>

                  <div className="mt-3">
                    <badge_1.Badge className={getStatusColor(doc.status)}>
                      {doc.status}
                    </badge_1.Badge>
                  </div>

                  {doc.tags.length > 0 && (<div className="mt-2 flex flex-wrap gap-1">
                      {doc.tags.slice(0, 2).map(function (tag, index) { return (<badge_1.Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </badge_1.Badge>); })}
                      {doc.tags.length > 2 && (<badge_1.Badge variant="secondary" className="text-xs">
                          +{doc.tags.length - 2}
                        </badge_1.Badge>)}
                    </div>)}

                  <div className="flex gap-1 mt-3">
                    <button_1.Button size="sm" variant="outline" className="flex-1" onClick={function (e) {
                    e.stopPropagation();
                    handleDownloadDocument(doc);
                }}>
                      <lucide_react_1.Download className="w-3 h-3 mr-1"/>
                      Download
                    </button_1.Button>
                    
                    <button_1.Button size="sm" variant="outline" onClick={function (e) {
                    e.stopPropagation();
                    handleShareDocument(doc);
                }}>
                      <lucide_react_1.Share2 className="w-3 h-3"/>
                    </button_1.Button>
                  </div>

                  {doc.verificationNotes && (<div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                      {doc.verificationNotes}
                    </div>)}
                </card_1.CardContent>
              </card_1.Card>);
        })}
        </div>

        {filteredDocuments.length === 0 && (<card_1.Card>
            <card_1.CardContent className="py-12 text-center">
              <lucide_react_1.FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4"/>
              <h3 className="font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Upload your first document to get started.'}
              </p>
              <button_1.Button>
                <lucide_react_1.Upload className="w-4 h-4 mr-2"/>
                Upload Document
              </button_1.Button>
            </card_1.CardContent>
          </card_1.Card>)}
      </div>
    </div>);
}
