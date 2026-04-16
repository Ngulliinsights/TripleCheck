"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentVerificationResults = DocumentVerificationResults;
var framer_motion_1 = require("framer-motion");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var progress_1 = require("../../local/components/ui/progress");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
var useDocumentAuthentication_1 = require("../hooks/useDocumentAuthentication");
var CHECK_TYPE_ICONS = {
    metadata: lucide_react_1.Settings,
    visual: lucide_react_1.Image,
    signature: lucide_react_1.Signature,
    content: lucide_react_1.FileText,
    format: lucide_react_1.FileCheck
};
var CHECK_TYPE_NAMES = {
    metadata: 'Metadata Analysis',
    visual: 'Visual Analysis',
    signature: 'Signature Verification',
    content: 'Content Analysis',
    format: 'Format Validation'
};
var STATUS_CONFIG = {
    authentic: {
        color: 'text-green-600',
        bgColor: 'bg-green-50 border-green-200',
        badgeColor: 'bg-green-100 text-green-800',
        icon: lucide_react_1.CheckCircle,
        description: 'Document appears authentic and can be trusted'
    },
    suspicious: {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200',
        badgeColor: 'bg-yellow-100 text-yellow-800',
        icon: lucide_react_1.AlertTriangle,
        description: 'Document has suspicious elements requiring further review'
    },
    forged: {
        color: 'text-red-600',
        bgColor: 'bg-red-50 border-red-200',
        badgeColor: 'bg-red-100 text-red-800',
        icon: lucide_react_1.XCircle,
        description: 'Document appears to be forged or heavily tampered'
    }
};
function DocumentVerificationResults(_a) {
    var _b;
    var documentId = _a.documentId, onRecommendationAction = _a.onRecommendationAction, _c = _a.showActions, showActions = _c === void 0 ? true : _c;
    var toast = (0, use_toast_1.useToast)().toast;
    var _d = (0, react_1.useState)('overview'), selectedTab = _d[0], setSelectedTab = _d[1];
    var _e = (0, react_1.useState)(null), expandedCheck = _e[0], setExpandedCheck = _e[1];
    var _f = (0, react_1.useState)(null), expandedRiskFactor = _f[0], setExpandedRiskFactor = _f[1];
    var _g = (0, useDocumentAuthentication_1.useDocumentAuthentication)(), useVerificationResult = _g.useVerificationResult, useProcessingStatus = _g.useProcessingStatus, getDocumentTypeIcon = _g.getDocumentTypeIcon, formatFileSize = _g.formatFileSize, formatProcessingTime = _g.formatProcessingTime;
    var _h = useVerificationResult(documentId), result = _h.data, isLoading = _h.isLoading, error = _h.error;
    var status = useProcessingStatus(documentId).data;
    var handleExportReport = function () {
        toast({
            title: "Export Started",
            description: "Document verification report is being generated.",
        });
    };
    var handleShareReport = function () {
        toast({
            title: "Share Report",
            description: "Share link has been copied to clipboard.",
        });
    };
    var handleRecommendationAction = function (action, recommendation) {
        if (onRecommendationAction) {
            onRecommendationAction(action, recommendation);
        }
        toast({
            title: "Action Initiated",
            description: "".concat(action, " for recommendation has been started."),
        });
    };
    if (isLoading || status === 'processing') {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <lucide_react_1.Clock className="h-5 w-5 animate-spin"/>
            <span>Processing document verification...</span>
          </div>
          <div className="mt-4">
            <progress_1.Progress value={undefined} className="h-2"/>
            <p className="text-sm text-gray-500 mt-2 text-center">
              This may take a few moments depending on document complexity
            </p>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    if (error || status === 'not_found') {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="text-center">
            <lucide_react_1.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Verification Failed
            </h3>
            <p className="text-gray-600">
              {(error === null || error === void 0 ? void 0 : error.message) || 'Document verification could not be completed. Please try again.'}
            </p>
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    if (!result) {
        return (<card_1.Card>
        <card_1.CardContent className="p-6">
          <div className="text-center text-gray-500">
            No verification results available
          </div>
        </card_1.CardContent>
      </card_1.Card>);
    }
    var statusConfig = STATUS_CONFIG[result.status];
    var StatusIcon = statusConfig.icon;
    var groupedChecks = result.checks.reduce(function (groups, check) {
        if (!groups[check.type]) {
            groups[check.type] = [];
        }
        groups[check.type].push(check);
        return groups;
    }, {});
    return (<div className="space-y-6">
      {/* Overall Result */}
      <card_1.Card className={"".concat(statusConfig.bgColor, " border-2")}>
        <card_1.CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={"p-3 rounded-full bg-white ".concat(statusConfig.color)}>
                <StatusIcon className="h-6 w-6"/>
              </div>
              <div>
                <card_1.CardTitle className={"text-xl ".concat(statusConfig.color)}>
                  {result.status.toUpperCase()}
                </card_1.CardTitle>
                <card_1.CardDescription className="text-gray-700">
                  {statusConfig.description}
                </card_1.CardDescription>
              </div>
            </div>
            {showActions && (<div className="flex items-center space-x-2">
                <button_1.Button variant="outline" size="sm" onClick={handleShareReport}>
                  <lucide_react_1.Share2 className="h-4 w-4 mr-1"/>
                  Share
                </button_1.Button>
                <button_1.Button variant="outline" size="sm" onClick={handleExportReport}>
                  <lucide_react_1.Download className="h-4 w-4 mr-1"/>
                  Export
                </button_1.Button>
              </div>)}
          </div>
        </card_1.CardHeader>
        <card_1.CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {result.overallScore}
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className="text-xs text-gray-500">out of 100</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(result.confidence * 100)}%
              </div>
              <div className="text-sm text-gray-600">Confidence</div>
              <div className="text-xs text-gray-500">assessment accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {result.checks.length}
              </div>
              <div className="text-sm text-gray-600">Checks Performed</div>
              <div className="text-xs text-gray-500">verification tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatProcessingTime(result.processingTime)}
              </div>
              <div className="text-sm text-gray-600">Processing Time</div>
              <div className="text-xs text-gray-500">analysis duration</div>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>

      {/* Detailed Analysis */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Detailed Verification Analysis</card_1.CardTitle>
          <card_1.CardDescription>
            Comprehensive breakdown of document verification results
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <tabs_1.Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <tabs_1.TabsList className="grid w-full grid-cols-4">
              <tabs_1.TabsTrigger value="overview">Overview</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="checks">Verification Checks</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="risks">Risk Factors</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="metadata">Document Details</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="overview" className="space-y-4">
              {/* Document Information */}
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg flex items-center space-x-2">
                    <span>{getDocumentTypeIcon((_b = result.landSpecificData) === null || _b === void 0 ? void 0 : _b.documentType)}</span>
                    <span>Document Information</span>
                  </card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Document ID</div>
                      <div className="text-gray-900 font-mono text-xs">{result.documentId}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Processed At</div>
                      <div className="text-gray-900">{new Date(result.processedAt).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">File Size</div>
                      <div className="text-gray-900">{formatFileSize(result.metadata.fileSize)}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Document Hash</div>
                      <div className="text-gray-900 font-mono text-xs">{result.metadata.hash.slice(0, 16)}...</div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>

              {/* Land-Specific Data */}
              {result.landSpecificData && (<card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-lg">Land Document Details</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="space-y-4">
                      {result.landSpecificData.propertyDetails && (<div>
                          <h4 className="font-medium text-gray-900 mb-2">Property Details</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {result.landSpecificData.propertyDetails.plotNumber && (<div>
                                <span className="text-gray-600">Plot Number:</span>
                                <span className="ml-2 font-medium">{result.landSpecificData.propertyDetails.plotNumber}</span>
                              </div>)}
                            {result.landSpecificData.propertyDetails.location && (<div>
                                <span className="text-gray-600">Location:</span>
                                <span className="ml-2 font-medium">{result.landSpecificData.propertyDetails.location}</span>
                              </div>)}
                            {result.landSpecificData.propertyDetails.size && (<div>
                                <span className="text-gray-600">Size:</span>
                                <span className="ml-2 font-medium">{result.landSpecificData.propertyDetails.size}</span>
                              </div>)}
                          </div>
                        </div>)}

                      {result.landSpecificData.verificationMarkers && (<div>
                          <h4 className="font-medium text-gray-900 mb-2">Security Features</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(result.landSpecificData.verificationMarkers).map(function (_a) {
                    var feature = _a[0], present = _a[1];
                    return (<div key={feature} className="flex items-center space-x-2">
                                {present ? (<lucide_react_1.CheckCircle className="h-4 w-4 text-green-500"/>) : (<lucide_react_1.XCircle className="h-4 w-4 text-red-500"/>)}
                                <span className="text-sm">
                                  {feature.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })}
                                </span>
                              </div>);
                })}
                          </div>
                        </div>)}
                    </div>
                  </card_1.CardContent>
                </card_1.Card>)}

              {/* Quick Summary */}
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Verification Summary</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-3">
                    {Object.entries(groupedChecks).map(function (_a) {
            var type = _a[0], checks = _a[1];
            var Icon = CHECK_TYPE_ICONS[type];
            var passedChecks = checks.filter(function (c) { return c.status === 'pass'; }).length;
            var totalChecks = checks.length;
            var successRate = (passedChecks / totalChecks) * 100;
            return (<div key={type} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="h-4 w-4 text-gray-600"/>
                            <span className="text-sm font-medium">
                              {CHECK_TYPE_NAMES[type]}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20">
                              <progress_1.Progress value={successRate} className="h-2"/>
                            </div>
                            <span className="text-sm text-gray-600 w-16 text-right">
                              {passedChecks}/{totalChecks} passed
                            </span>
                          </div>
                        </div>);
        })}
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="checks" className="space-y-4">
              <div className="space-y-4">
                {Object.entries(groupedChecks).map(function (_a) {
            var type = _a[0], checks = _a[1];
            var Icon = CHECK_TYPE_ICONS[type];
            return (<card_1.Card key={type}>
                      <card_1.CardHeader>
                        <card_1.CardTitle className="text-lg flex items-center space-x-2">
                          <Icon className="h-5 w-5"/>
                          <span>{CHECK_TYPE_NAMES[type]}</span>
                        </card_1.CardTitle>
                      </card_1.CardHeader>
                      <card_1.CardContent>
                        <div className="space-y-3">
                          {checks.map(function (check) { return (<card_1.Card key={check.name} className={"cursor-pointer transition-all duration-200 ".concat(expandedCheck === check.name ? 'ring-2 ring-blue-500' : '')} onClick={function () { return setExpandedCheck(expandedCheck === check.name ? null : check.name); }}>
                              <card_1.CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <badge_1.Badge variant={check.status === 'pass' ? 'default' :
                        check.status === 'warning' ? 'secondary' :
                            'destructive'}>
                                        {check.status.toUpperCase()}
                                      </badge_1.Badge>
                                      <h4 className="font-semibold text-gray-900">{check.name}</h4>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{check.description}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                      <span>Score: {check.score}/100</span>
                                      <span>Confidence: {Math.round(check.confidence * 100)}%</span>
                                      <span>Time: {formatProcessingTime(check.processingTime)}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="text-right">
                                      <div className="text-lg font-bold text-gray-900">{check.score}</div>
                                      <div className="text-xs text-gray-500">score</div>
                                    </div>
                                    {expandedCheck === check.name ? (<lucide_react_1.ChevronDown className="h-4 w-4 text-gray-400"/>) : (<lucide_react_1.ChevronRight className="h-4 w-4 text-gray-400"/>)}
                                  </div>
                                </div>

                                <framer_motion_1.AnimatePresence>
                                  {expandedCheck === check.name && (<framer_motion_1.motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-4 pt-4 border-t border-gray-200">
                                      <div>
                                        <h5 className="font-medium text-gray-900 mb-2">Details</h5>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                          {check.details.map(function (detail, index) { return (<li key={index}>{detail}</li>); })}
                                        </ul>
                                      </div>
                                    </framer_motion_1.motion.div>)}
                                </framer_motion_1.AnimatePresence>
                              </card_1.CardContent>
                            </card_1.Card>); })}
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>);
        })}
              </div>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="risks" className="space-y-4">
              <div className="space-y-4">
                {result.riskFactors.length > 0 ? (result.riskFactors.map(function (riskFactor) { return (<card_1.Card key={riskFactor.category} className={"cursor-pointer transition-all duration-200 ".concat(expandedRiskFactor === riskFactor.category ? 'ring-2 ring-blue-500' : '')} onClick={function () { return setExpandedRiskFactor(expandedRiskFactor === riskFactor.category ? null : riskFactor.category); }}>
                      <card_1.CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <badge_1.Badge variant={riskFactor.severity === 'critical' ? 'destructive' :
                riskFactor.severity === 'high' ? 'destructive' :
                    riskFactor.severity === 'medium' ? 'secondary' :
                        'outline'}>
                                {riskFactor.severity.toUpperCase()}
                              </badge_1.Badge>
                              <h4 className="font-semibold text-gray-900">{riskFactor.category}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{riskFactor.description}</p>
                            <div className="text-xs text-gray-500">
                              Confidence: {Math.round(riskFactor.confidence * 100)}%
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {expandedRiskFactor === riskFactor.category ? (<lucide_react_1.ChevronDown className="h-4 w-4 text-gray-400"/>) : (<lucide_react_1.ChevronRight className="h-4 w-4 text-gray-400"/>)}
                          </div>
                        </div>

                        <framer_motion_1.AnimatePresence>
                          {expandedRiskFactor === riskFactor.category && (<framer_motion_1.motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="mt-4 pt-4 border-t border-gray-200">
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Evidence</h5>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                  {riskFactor.evidence.map(function (evidence, index) { return (<li key={index}>{evidence}</li>); })}
                                </ul>
                              </div>
                            </framer_motion_1.motion.div>)}
                        </framer_motion_1.AnimatePresence>
                      </card_1.CardContent>
                    </card_1.Card>); })) : (<card_1.Card>
                    <card_1.CardContent className="p-8 text-center">
                      <lucide_react_1.Shield className="h-12 w-12 text-green-500 mx-auto mb-4"/>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No Risk Factors Identified
                      </h3>
                      <p className="text-gray-600">
                        The document verification process did not identify any significant risk factors.
                      </p>
                    </card_1.CardContent>
                  </card_1.Card>)}
              </div>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="metadata" className="space-y-4">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Document Metadata</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {result.metadata.creationDate && (<div>
                        <div className="font-medium text-gray-700">Creation Date</div>
                        <div className="text-gray-900">{new Date(result.metadata.creationDate).toLocaleString()}</div>
                      </div>)}
                    {result.metadata.modificationDate && (<div>
                        <div className="font-medium text-gray-700">Last Modified</div>
                        <div className="text-gray-900">{new Date(result.metadata.modificationDate).toLocaleString()}</div>
                      </div>)}
                    {result.metadata.author && (<div>
                        <div className="font-medium text-gray-700">Author</div>
                        <div className="text-gray-900">{result.metadata.author}</div>
                      </div>)}
                    {result.metadata.software && (<div>
                        <div className="font-medium text-gray-700">Created With</div>
                        <div className="text-gray-900">{result.metadata.software}</div>
                      </div>)}
                    {result.metadata.pageCount && (<div>
                        <div className="font-medium text-gray-700">Page Count</div>
                        <div className="text-gray-900">{result.metadata.pageCount}</div>
                      </div>)}
                    <div>
                      <div className="font-medium text-gray-700">File Size</div>
                      <div className="text-gray-900">{formatFileSize(result.metadata.fileSize)}</div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Digital Signature</div>
                      <div className="text-gray-900">
                        {result.metadata.digitalSignature ? (<badge_1.Badge variant="default">Present</badge_1.Badge>) : (<badge_1.Badge variant="outline">Not Found</badge_1.Badge>)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-700">Document Hash</div>
                      <div className="text-gray-900 font-mono text-xs break-all">{result.metadata.hash}</div>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </card_1.CardContent>
      </card_1.Card>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (<card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Recommendations</card_1.CardTitle>
            <card_1.CardDescription>
              Suggested actions based on the verification results
            </card_1.CardDescription>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-3">
              {result.recommendations.map(function (recommendation, index) { return (<alert_1.Alert key={index}>
                  <lucide_react_1.Info className="h-4 w-4"/>
                  <alert_1.AlertDescription className="flex items-center justify-between">
                    <span>{recommendation}</span>
                    {showActions && (<button_1.Button variant="outline" size="sm" onClick={function () { return handleRecommendationAction('Implement', recommendation); }}>
                        Take Action
                      </button_1.Button>)}
                  </alert_1.AlertDescription>
                </alert_1.Alert>); })}
            </div>
          </card_1.CardContent>
        </card_1.Card>)}
    </div>);
}
exports.default = DocumentVerificationResults;
