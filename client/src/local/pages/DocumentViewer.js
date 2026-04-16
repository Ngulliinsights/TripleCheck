"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DocumentViewer;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../components/ui/button");
var input_1 = require("../components/ui/input");
var card_1 = require("../components/ui/card");
var badge_1 = require("../components/ui/badge");
var use_toast_1 = require("../hooks/use-toast");
// Mock document data
var mockDocument = {
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
function DocumentViewer() {
    var toast = (0, use_toast_1.useToast)().toast;
    var document = (0, react_1.useState)(mockDocument)[0];
    var _a = (0, react_1.useState)(1), currentPage = _a[0], setCurrentPage = _a[1];
    var _b = (0, react_1.useState)(100), zoomLevel = _b[0], setZoomLevel = _b[1];
    var _c = (0, react_1.useState)(0), rotation = _c[0], setRotation = _c[1];
    var _d = (0, react_1.useState)(false), isFullscreen = _d[0], setIsFullscreen = _d[1];
    var _e = (0, react_1.useState)(true), showAnnotations = _e[0], setShowAnnotations = _e[1];
    var _f = (0, react_1.useState)(''), searchText = _f[0], setSearchText = _f[1];
    var handleZoomIn = (0, react_1.useCallback)(function () {
        setZoomLevel(function (prev) { return Math.min(prev + 25, 300); });
    }, []);
    var handleZoomOut = (0, react_1.useCallback)(function () {
        setZoomLevel(function (prev) { return Math.max(prev - 25, 25); });
    }, []);
    var handleRotate = (0, react_1.useCallback)(function () {
        setRotation(function (prev) { return (prev + 90) % 360; });
    }, []);
    var handleNextPage = (0, react_1.useCallback)(function () {
        setCurrentPage(function (prev) { return Math.min(prev + 1, document.pages); });
    }, [document.pages]);
    var handlePrevPage = (0, react_1.useCallback)(function () {
        setCurrentPage(function (prev) { return Math.max(prev - 1, 1); });
    }, []);
    var handleDownload = (0, react_1.useCallback)(function () {
        toast({
            title: 'Download started',
            description: "Downloading ".concat(document.name, "..."),
        });
    }, [document.name, toast]);
    var handleShare = (0, react_1.useCallback)(function () {
        navigator.clipboard.writeText(window.location.href);
        toast({
            title: 'Link copied',
            description: 'Document sharing link copied to clipboard.',
        });
    }, [toast]);
    var toggleFullscreen = (0, react_1.useCallback)(function () {
        setIsFullscreen(function (prev) { return !prev; });
    }, []);
    var getStatusColor = function (status) {
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
    var getStatusIcon = function (status) {
        switch (status) {
            case 'verified':
                return <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>;
            case 'pending':
                return <lucide_react_1.Clock className="w-4 h-4 text-yellow-500"/>;
            case 'rejected':
                return <lucide_react_1.AlertTriangle className="w-4 h-4 text-red-500"/>;
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
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    return (<div className={"".concat(isFullscreen ? 'fixed inset-0 z-50' : 'min-h-screen', " bg-background")}>
      <div className="container mx-auto px-4 py-8 h-full">
        {!isFullscreen && (<div className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <lucide_react_1.FileText className="w-8 h-8 text-blue-500"/>
              Document Viewer
            </h1>
            <p className="text-muted-foreground">
              View and analyze property documents with advanced tools
            </p>
          </div>)}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Document Viewer */}
          <div className="lg:col-span-3">
            <card_1.Card className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{document.name}</h3>
                  <badge_1.Badge className={getStatusColor(document.status)}>
                    {document.status}
                  </badge_1.Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span>Page {currentPage} of {document.pages}</span>
                  </div>
                  
                  <button_1.Button size="sm" variant="outline" onClick={handlePrevPage} disabled={currentPage === 1}>
                    <lucide_react_1.ArrowLeft className="w-4 h-4"/>
                  </button_1.Button>
                  
                  <button_1.Button size="sm" variant="outline" onClick={handleNextPage} disabled={currentPage === document.pages}>
                    <lucide_react_1.ArrowRight className="w-4 h-4"/>
                  </button_1.Button>

                  <div className="border-l pl-2 ml-2 flex items-center gap-1">
                    <button_1.Button size="sm" variant="outline" onClick={handleZoomOut}>
                      <lucide_react_1.ZoomOut className="w-4 h-4"/>
                    </button_1.Button>
                    
                    <span className="text-sm min-w-[60px] text-center">{zoomLevel}%</span>
                    
                    <button_1.Button size="sm" variant="outline" onClick={handleZoomIn}>
                      <lucide_react_1.ZoomIn className="w-4 h-4"/>
                    </button_1.Button>
                  </div>

                  <button_1.Button size="sm" variant="outline" onClick={handleRotate}>
                    <lucide_react_1.RotateCw className="w-4 h-4"/>
                  </button_1.Button>

                  <button_1.Button size="sm" variant="outline" onClick={function () { return setShowAnnotations(!showAnnotations); }}>
                    {showAnnotations ? <lucide_react_1.EyeOff className="w-4 h-4"/> : <lucide_react_1.Eye className="w-4 h-4"/>}
                  </button_1.Button>

                  <button_1.Button size="sm" variant="outline" onClick={toggleFullscreen}>
                    {isFullscreen ? <lucide_react_1.Minimize2 className="w-4 h-4"/> : <lucide_react_1.Maximize2 className="w-4 h-4"/>}
                  </button_1.Button>
                </div>
              </div>

              {/* Document Display Area */}
              <div className="flex-1 p-4 bg-gray-100 overflow-auto">
                <div className="flex justify-center">
                  <div className="bg-white shadow-lg" style={{
            transform: "scale(".concat(zoomLevel / 100, ") rotate(").concat(rotation, "deg)"),
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease'
        }}>
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

                        {showAnnotations && (<div className="absolute top-4 right-4 bg-yellow-200 p-2 rounded text-xs max-w-[200px]">
                            <strong>Verification Note:</strong> Document verified on {formatDate(document.verificationDate)}
                          </div>)}
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
                  <lucide_react_1.Search className="w-4 h-4 text-muted-foreground"/>
                  <input_1.Input placeholder="Search in document..." value={searchText} onChange={function (e) { return setSearchText(e.target.value); }} className="flex-1"/>
                  <button_1.Button size="sm">Find</button_1.Button>
                </div>
              </div>
            </card_1.Card>
          </div>

          {/* Document Info Sidebar */}
          <div className="space-y-6">
            {/* Document Details */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle className="flex items-center gap-2">
                  {getStatusIcon(document.status)}
                  Document Details
                </card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-4">
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
                    <badge_1.Badge className={getStatusColor(document.status)}>
                      {document.status}
                    </badge_1.Badge>
                  </div>
                </div>

                {document.propertyAddress && (<div>
                    <h5 className="font-medium mb-1">Property Address</h5>
                    <p className="text-sm text-muted-foreground">{document.propertyAddress}</p>
                  </div>)}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <lucide_react_1.User className="w-4 h-4"/>
                    <span>Uploaded by {document.uploadedBy}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <lucide_react_1.Calendar className="w-4 h-4"/>
                    <span>{formatDate(document.uploadedAt)}</span>
                  </div>

                  {document.verificationDate && (<div className="flex items-center gap-2">
                      <lucide_react_1.Shield className="w-4 h-4"/>
                      <span>Verified {formatDate(document.verificationDate)}</span>
                    </div>)}
                </div>

                {document.tags.length > 0 && (<div>
                    <h5 className="font-medium mb-2 flex items-center gap-1">
                      <lucide_react_1.Tag className="w-4 h-4"/>
                      Tags
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {document.tags.map(function (tag, index) { return (<badge_1.Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </badge_1.Badge>); })}
                    </div>
                  </div>)}
              </card_1.CardContent>
            </card_1.Card>

            {/* Actions */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Actions</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent className="space-y-2">
                <button_1.Button className="w-full justify-start" onClick={handleDownload}>
                  <lucide_react_1.Download className="w-4 h-4 mr-2"/>
                  Download
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start" onClick={handleShare}>
                  <lucide_react_1.Share2 className="w-4 h-4 mr-2"/>
                  Share
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.FileText className="w-4 h-4 mr-2"/>
                  View History
                </button_1.Button>
                
                <button_1.Button variant="outline" className="w-full justify-start">
                  <lucide_react_1.Shield className="w-4 h-4 mr-2"/>
                  Verification Details
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>

            {/* Verification Status */}
            {document.status === 'verified' && (<card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="flex items-center gap-2 text-green-700">
                    <lucide_react_1.CheckCircle className="w-5 h-5"/>
                    Verified Document
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-green-600">
                      <lucide_react_1.CheckCircle className="w-4 h-4"/>
                      <span>Document authenticity confirmed</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-600">
                      <lucide_react_1.CheckCircle className="w-4 h-4"/>
                      <span>No signs of tampering detected</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-600">
                      <lucide_react_1.CheckCircle className="w-4 h-4"/>
                      <span>Metadata validation passed</span>
                    </div>

                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <p className="text-green-800 text-xs">
                        This document has been verified using AI-powered analysis and 
                        cross-referenced with official records.
                      </p>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>)}

            {/* Page Thumbnails */}
            <card_1.Card>
              <card_1.CardHeader>
                <card_1.CardTitle>Pages</card_1.CardTitle>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: document.pages }, function (_, i) { return (<button key={i + 1} onClick={function () { return setCurrentPage(i + 1); }} className={"aspect-[3/4] border-2 rounded p-2 text-xs transition-colors ".concat(currentPage === i + 1
                ? 'border-primary bg-primary/5'
                : 'border-muted hover:border-primary/50')}>
                      <div className="w-full h-full bg-white border flex items-center justify-center">
                        Page {i + 1}
                      </div>
                    </button>); })}
                </div>
              </card_1.CardContent>
            </card_1.Card>
          </div>
        </div>
      </div>
    </div>);
}
