"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelpSystem = void 0;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var HELP_CONTENT = [
    {
        id: 'land-verification-overview',
        title: 'Kenya Land Verification Overview',
        content: "\n      <h3>Multi-Layered Verification Approach</h3>\n      <p>Kenya's complex land ownership environment requires a comprehensive verification approach that goes beyond simple document checks. Our system implements six verification layers:</p>\n      <ul>\n        <li><strong>Land Registry Integration:</strong> Official government record verification</li>\n        <li><strong>Physical Verification:</strong> Ground-truthing of property boundaries</li>\n        <li><strong>Community Intelligence:</strong> Local knowledge gathering</li>\n        <li><strong>Government Designation Assessment:</strong> Hidden government claims identification</li>\n        <li><strong>Legal History Investigation:</strong> Court records and dispute analysis</li>\n        <li><strong>Expert Coordination:</strong> Professional surveyor and legal counsel integration</li>\n      </ul>\n      <p>Each layer provides unique insights that, when combined, create a comprehensive risk profile for informed decision-making.</p>\n    ",
        category: 'overview',
        tags: ['introduction', 'process', 'layers'],
        relatedTopics: ['verification-process', 'risk-assessment']
    },
    {
        id: 'kenya-land-ownership-system',
        title: 'Understanding Kenya\'s Land Ownership System',
        content: "\n      <h3>Land Tenure Types in Kenya</h3>\n      <p>Kenya recognizes three main types of land tenure:</p>\n      <ul>\n        <li><strong>Freehold:</strong> Absolute ownership with title deed</li>\n        <li><strong>Leasehold:</strong> Temporary ownership for specified period</li>\n        <li><strong>Customary:</strong> Traditional community-based ownership</li>\n      </ul>\n      \n      <h3>Common Ownership Challenges</h3>\n      <ul>\n        <li><strong>Land Grabbing:</strong> Illegal acquisition through forged documents</li>\n        <li><strong>Double Allocation:</strong> Same land allocated to multiple parties</li>\n        <li><strong>Succession Disputes:</strong> Family inheritance conflicts</li>\n        <li><strong>Government Acquisition:</strong> Uncompensated public use claims</li>\n      </ul>\n      \n      <h3>Key Documents</h3>\n      <ul>\n        <li><strong>Title Deed:</strong> Primary ownership document</li>\n        <li><strong>Survey Plan:</strong> Technical boundary description</li>\n        <li><strong>Search Certificate:</strong> Registry verification document</li>\n        <li><strong>Consent to Transfer:</strong> Government approval for transactions</li>\n      </ul>\n    ",
        category: 'legal',
        tags: ['ownership', 'tenure', 'documents', 'challenges'],
        relatedTopics: ['document-verification', 'risk-types']
    },
    {
        id: 'risk-types-explained',
        title: 'Understanding Land Verification Risks',
        content: "\n      <h3>Ownership Risks</h3>\n      <ul>\n        <li><strong>Forged Documents:</strong> Fake or altered title deeds</li>\n        <li><strong>Chain of Title Issues:</strong> Gaps in ownership history</li>\n        <li><strong>Unauthorized Transfers:</strong> Sales without proper consent</li>\n      </ul>\n      \n      <h3>Government Risks</h3>\n      <ul>\n        <li><strong>Riparian Reserves:</strong> Water body buffer zones</li>\n        <li><strong>Road Reserves:</strong> Transportation corridor claims</li>\n        <li><strong>Utility Corridors:</strong> Power and telecommunications rights</li>\n        <li><strong>Environmental Designations:</strong> Conservation area restrictions</li>\n      </ul>\n      \n      <h3>Legal Risks</h3>\n      <ul>\n        <li><strong>Active Disputes:</strong> Ongoing court cases</li>\n        <li><strong>Historical Claims:</strong> Previous unresolved conflicts</li>\n        <li><strong>Succession Issues:</strong> Family inheritance disputes</li>\n      </ul>\n      \n      <h3>Physical Risks</h3>\n      <ul>\n        <li><strong>Boundary Disputes:</strong> Unclear or contested borders</li>\n        <li><strong>Encroachment:</strong> Unauthorized occupation</li>\n        <li><strong>Survey Discrepancies:</strong> Measurement inconsistencies</li>\n      </ul>\n    ",
        category: 'risks',
        tags: ['risks', 'ownership', 'government', 'legal', 'physical'],
        relatedTopics: ['risk-assessment', 'mitigation-strategies']
    },
    {
        id: 'verification-process-guide',
        title: 'Step-by-Step Verification Process',
        content: "\n      <h3>Phase 1: Initial Assessment</h3>\n      <ol>\n        <li>Upload property documents (title deed, survey plan)</li>\n        <li>Provide property location and coordinates</li>\n        <li>Complete basic property information form</li>\n      </ol>\n      \n      <h3>Phase 2: Registry Verification</h3>\n      <ol>\n        <li>Automated search of Ministry of Lands registry</li>\n        <li>Ownership history analysis</li>\n        <li>Legal instrument verification</li>\n        <li>Charge and caveat identification</li>\n      </ol>\n      \n      <h3>Phase 3: Physical Verification</h3>\n      <ol>\n        <li>GPS coordinate validation</li>\n        <li>Boundary marker verification</li>\n        <li>Survey measurement validation</li>\n        <li>Physical feature comparison</li>\n      </ol>\n      \n      <h3>Phase 4: Community Intelligence</h3>\n      <ol>\n        <li>Local administrator interviews</li>\n        <li>Community member consultations</li>\n        <li>Historical knowledge gathering</li>\n        <li>Dispute identification</li>\n      </ol>\n      \n      <h3>Phase 5: Risk Assessment</h3>\n      <ol>\n        <li>Comprehensive risk analysis</li>\n        <li>Risk factor weighting</li>\n        <li>Recommendation generation</li>\n        <li>Decision support provision</li>\n      </ol>\n    ",
        category: 'process',
        tags: ['process', 'steps', 'phases', 'workflow'],
        relatedTopics: ['verification-layers', 'risk-assessment']
    }
];
var CONTEXTUAL_GUIDES = {
    'document-upload': {
        step: 'Document Upload',
        title: 'Uploading Land Documents',
        description: 'Upload your title deed, survey plan, and any supporting documents for verification.',
        tips: [
            'Ensure documents are clear and readable',
            'Upload both sides of multi-page documents',
            'Include any amendments or endorsements',
            'Provide original documents when possible'
        ],
        warnings: [
            'Blurred or damaged documents may affect verification accuracy',
            'Missing pages will require additional verification steps'
        ],
        nextSteps: [
            'Documents will be authenticated using advanced analysis',
            'Registry verification will cross-check document details',
            'Any discrepancies will be flagged for manual review'
        ]
    },
    'registry-verification': {
        step: 'Registry Verification',
        title: 'Government Registry Check',
        description: 'Verifying your property details against official government records.',
        tips: [
            'This process may take several minutes',
            'Multiple government databases are checked',
            'Historical ownership records are analyzed',
            'Legal instruments and charges are identified'
        ],
        warnings: [
            'Government systems may be temporarily unavailable',
            'Some historical records may be incomplete'
        ],
        nextSteps: [
            'Physical verification will validate boundaries',
            'Community intelligence will gather local knowledge',
            'Expert coordination may be recommended'
        ]
    },
    'physical-verification': {
        step: 'Physical Verification',
        title: 'Ground-Truthing Property Boundaries',
        description: 'Coordinating physical verification of property boundaries and features.',
        tips: [
            'GPS coordinates should be as accurate as possible',
            'Take photos of boundary markers and features',
            'Measure distances between key points',
            'Document any encroachments or disputes'
        ],
        warnings: [
            'Weather conditions may affect GPS accuracy',
            'Some boundary markers may be missing or damaged',
            'Access to property may be restricted'
        ],
        nextSteps: [
            'Community intelligence will validate findings',
            'Expert surveyors may be engaged for complex cases',
            'Risk assessment will incorporate physical findings'
        ]
    },
    'community-intelligence': {
        step: 'Community Intelligence',
        title: 'Gathering Local Knowledge',
        description: 'Collecting community insights about property history and potential issues.',
        tips: [
            'Approach community members respectfully',
            'Ask open-ended questions about property history',
            'Document sources and their credibility',
            'Cross-reference information from multiple sources'
        ],
        warnings: [
            'Community information may be subjective',
            'Protect privacy of information sources',
            'Some community members may be reluctant to share'
        ],
        nextSteps: [
            'Information will be cross-referenced with official records',
            'Discrepancies will be investigated further',
            'Expert legal counsel may be recommended'
        ]
    },
    'risk-assessment': {
        step: 'Risk Assessment',
        title: 'Comprehensive Risk Analysis',
        description: 'Analyzing all verification results to generate a comprehensive risk profile.',
        tips: [
            'Review all risk factors carefully',
            'Consider your risk tolerance level',
            'Pay attention to risk interactions',
            'Follow provided recommendations'
        ],
        warnings: [
            'High-risk properties require additional verification',
            'Some risks may not be immediately apparent',
            'Risk levels can change over time'
        ],
        nextSteps: [
            'Consider expert consultation for high-risk properties',
            'Implement recommended mitigation strategies',
            'Set up ongoing monitoring if purchasing'
        ]
    }
};
var HelpSystem = function (_a) {
    var currentContext = _a.currentContext, onClose = _a.onClose, _b = _a.embedded, embedded = _b === void 0 ? false : _b;
    var _c = (0, react_1.useState)('overview'), activeTab = _c[0], setActiveTab = _c[1];
    var _d = (0, react_1.useState)(''), searchTerm = _d[0], setSearchTerm = _d[1];
    var _e = (0, react_1.useState)(null), selectedContent = _e[0], setSelectedContent = _e[1];
    var _f = (0, react_1.useState)(false), showContextualGuide = _f[0], setShowContextualGuide = _f[1];
    var contextualGuide = currentContext ? CONTEXTUAL_GUIDES[currentContext] : null;
    (0, react_1.useEffect)(function () {
        if (currentContext && CONTEXTUAL_GUIDES[currentContext]) {
            setShowContextualGuide(true);
        }
    }, [currentContext]);
    var filteredContent = HELP_CONTENT.filter(function (content) {
        var matchesTab = content.category === activeTab;
        var matchesSearch = searchTerm === '' ||
            content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            content.tags.some(function (tag) { return tag.toLowerCase().includes(searchTerm.toLowerCase()); });
        return matchesTab && matchesSearch;
    });
    var renderContextualGuide = function () {
        if (!contextualGuide || !showContextualGuide)
            return null;
        return (<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <lucide_react_1.HelpCircle className="h-5 w-5 text-blue-600"/>
            <h3 className="font-semibold text-blue-900">{contextualGuide.title}</h3>
          </div>
          <button onClick={function () { return setShowContextualGuide(false); }} className="text-blue-600 hover:text-blue-800">
            <lucide_react_1.X className="h-4 w-4"/>
          </button>
        </div>
        
        <p className="text-blue-800 mt-2">{contextualGuide.description}</p>
        
        {contextualGuide.tips.length > 0 && (<div className="mt-3">
            <h4 className="font-medium text-blue-900 flex items-center">
              <lucide_react_1.CheckCircle className="h-4 w-4 mr-1"/>
              Tips
            </h4>
            <ul className="list-disc list-inside text-blue-800 text-sm mt-1">
              {contextualGuide.tips.map(function (tip, index) { return (<li key={index}>{tip}</li>); })}
            </ul>
          </div>)}
        
        {contextualGuide.warnings && contextualGuide.warnings.length > 0 && (<div className="mt-3">
            <h4 className="font-medium text-orange-900 flex items-center">
              <lucide_react_1.AlertTriangle className="h-4 w-4 mr-1"/>
              Important Notes
            </h4>
            <ul className="list-disc list-inside text-orange-800 text-sm mt-1">
              {contextualGuide.warnings.map(function (warning, index) { return (<li key={index}>{warning}</li>); })}
            </ul>
          </div>)}
        
        {contextualGuide.nextSteps && contextualGuide.nextSteps.length > 0 && (<div className="mt-3">
            <h4 className="font-medium text-green-900">Next Steps</h4>
            <ul className="list-disc list-inside text-green-800 text-sm mt-1">
              {contextualGuide.nextSteps.map(function (step, index) { return (<li key={index}>{step}</li>); })}
            </ul>
          </div>)}
      </div>);
    };
    var renderContent = function () {
        if (selectedContent) {
            return (<div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{selectedContent.title}</h2>
            <button onClick={function () { return setSelectedContent(null); }} className="text-gray-500 hover:text-gray-700">
              <lucide_react_1.X className="h-5 w-5"/>
            </button>
          </div>
          <div className="prose max-w-none">
            {selectedContent.content}
          </div>
          {selectedContent.relatedTopics.length > 0 && (<div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Related Topics</h3>
              <div className="flex flex-wrap gap-2">
                {selectedContent.relatedTopics.map(function (topic) {
                        var relatedContent = HELP_CONTENT.find(function (c) { return c.id === topic; });
                        return relatedContent ? (<button key={topic} onClick={function () { return setSelectedContent(relatedContent); }} className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200">
                      {relatedContent.title}
                    </button>) : null;
                    })}
              </div>
            </div>)}
        </div>);
        }
        return (<div className="space-y-4">
        {renderContextualGuide()}
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input type="text" placeholder="Search help topics..." value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
        </div>
        
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
                { key: 'overview', label: 'Overview' },
                { key: 'process', label: 'Process' },
                { key: 'risks', label: 'Risks' },
                { key: 'legal', label: 'Legal' },
                { key: 'technical', label: 'Technical' }
            ].map(function (tab) { return (<button key={tab.key} onClick={function () { return setActiveTab(tab.key); }} className={"py-2 px-1 border-b-2 font-medium text-sm ".concat(activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}>
                {tab.label}
              </button>); })}
          </nav>
        </div>
        
        <div className="space-y-3">
          {filteredContent.map(function (content) { return (<div key={content.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={function () { return setSelectedContent(content); }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{content.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {content.tags.map(function (tag) { return (<span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {tag}
                      </span>); })}
                  </div>
                </div>
                <lucide_react_1.Book className="h-5 w-5 text-gray-400"/>
              </div>
            </div>); })}
        </div>
      </div>);
    };
    if (embedded) {
        return (<div className="bg-white rounded-lg shadow-sm border p-4">
        {renderContent()}
      </div>);
    }
    return (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold">Land Verification Help</h1>
          {onClose && (<button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <lucide_react_1.X className="h-5 w-5"/>
            </button>)}
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {renderContent()}
        </div>
      </div>
    </div>);
};
exports.HelpSystem = HelpSystem;
exports.default = exports.HelpSystem;
