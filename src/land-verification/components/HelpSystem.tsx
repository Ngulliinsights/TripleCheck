import React, { useState, useEffect } from 'react';
import { HelpCircle, Book, AlertTriangle, CheckCircle, X } from 'lucide-react';

export interface HelpContent {
  id: string;
  title: string;
  content: string;
  category: 'overview' | 'process' | 'risks' | 'legal' | 'technical';
  tags: string[];
  relatedTopics: string[];
}

export interface ContextualGuide {
  step: string;
  title: string;
  description: string;
  tips: string[];
  warnings?: string[];
  nextSteps?: string[];
}

interface HelpSystemProps {
  currentContext?: string;
  onClose?: () => void;
  embedded?: boolean;
}

const HELP_CONTENT: HelpContent[] = [
  {
    id: 'land-verification-overview',
    title: 'Kenya Land Verification Overview',
    content: `
      <h3>Multi-Layered Verification Approach</h3>
      <p>Kenya's complex land ownership environment requires a comprehensive verification approach that goes beyond simple document checks. Our system implements six verification layers:</p>
      <ul>
        <li><strong>Land Registry Integration:</strong> Official government record verification</li>
        <li><strong>Physical Verification:</strong> Ground-truthing of property boundaries</li>
        <li><strong>Community Intelligence:</strong> Local knowledge gathering</li>
        <li><strong>Government Designation Assessment:</strong> Hidden government claims identification</li>
        <li><strong>Legal History Investigation:</strong> Court records and dispute analysis</li>
        <li><strong>Expert Coordination:</strong> Professional surveyor and legal counsel integration</li>
      </ul>
      <p>Each layer provides unique insights that, when combined, create a comprehensive risk profile for informed decision-making.</p>
    `,
    category: 'overview',
    tags: ['introduction', 'process', 'layers'],
    relatedTopics: ['verification-process', 'risk-assessment']
  },
  {
    id: 'kenya-land-ownership-system',
    title: 'Understanding Kenya\'s Land Ownership System',
    content: `
      <h3>Land Tenure Types in Kenya</h3>
      <p>Kenya recognizes three main types of land tenure:</p>
      <ul>
        <li><strong>Freehold:</strong> Absolute ownership with title deed</li>
        <li><strong>Leasehold:</strong> Temporary ownership for specified period</li>
        <li><strong>Customary:</strong> Traditional community-based ownership</li>
      </ul>
      
      <h3>Common Ownership Challenges</h3>
      <ul>
        <li><strong>Land Grabbing:</strong> Illegal acquisition through forged documents</li>
        <li><strong>Double Allocation:</strong> Same land allocated to multiple parties</li>
        <li><strong>Succession Disputes:</strong> Family inheritance conflicts</li>
        <li><strong>Government Acquisition:</strong> Uncompensated public use claims</li>
      </ul>
      
      <h3>Key Documents</h3>
      <ul>
        <li><strong>Title Deed:</strong> Primary ownership document</li>
        <li><strong>Survey Plan:</strong> Technical boundary description</li>
        <li><strong>Search Certificate:</strong> Registry verification document</li>
        <li><strong>Consent to Transfer:</strong> Government approval for transactions</li>
      </ul>
    `,
    category: 'legal',
    tags: ['ownership', 'tenure', 'documents', 'challenges'],
    relatedTopics: ['document-verification', 'risk-types']
  },
  {
    id: 'risk-types-explained',
    title: 'Understanding Land Verification Risks',
    content: `
      <h3>Ownership Risks</h3>
      <ul>
        <li><strong>Forged Documents:</strong> Fake or altered title deeds</li>
        <li><strong>Chain of Title Issues:</strong> Gaps in ownership history</li>
        <li><strong>Unauthorized Transfers:</strong> Sales without proper consent</li>
      </ul>
      
      <h3>Government Risks</h3>
      <ul>
        <li><strong>Riparian Reserves:</strong> Water body buffer zones</li>
        <li><strong>Road Reserves:</strong> Transportation corridor claims</li>
        <li><strong>Utility Corridors:</strong> Power and telecommunications rights</li>
        <li><strong>Environmental Designations:</strong> Conservation area restrictions</li>
      </ul>
      
      <h3>Legal Risks</h3>
      <ul>
        <li><strong>Active Disputes:</strong> Ongoing court cases</li>
        <li><strong>Historical Claims:</strong> Previous unresolved conflicts</li>
        <li><strong>Succession Issues:</strong> Family inheritance disputes</li>
      </ul>
      
      <h3>Physical Risks</h3>
      <ul>
        <li><strong>Boundary Disputes:</strong> Unclear or contested borders</li>
        <li><strong>Encroachment:</strong> Unauthorized occupation</li>
        <li><strong>Survey Discrepancies:</strong> Measurement inconsistencies</li>
      </ul>
    `,
    category: 'risks',
    tags: ['risks', 'ownership', 'government', 'legal', 'physical'],
    relatedTopics: ['risk-assessment', 'mitigation-strategies']
  },
  {
    id: 'verification-process-guide',
    title: 'Step-by-Step Verification Process',
    content: `
      <h3>Phase 1: Initial Assessment</h3>
      <ol>
        <li>Upload property documents (title deed, survey plan)</li>
        <li>Provide property location and coordinates</li>
        <li>Complete basic property information form</li>
      </ol>
      
      <h3>Phase 2: Registry Verification</h3>
      <ol>
        <li>Automated search of Ministry of Lands registry</li>
        <li>Ownership history analysis</li>
        <li>Legal instrument verification</li>
        <li>Charge and caveat identification</li>
      </ol>
      
      <h3>Phase 3: Physical Verification</h3>
      <ol>
        <li>GPS coordinate validation</li>
        <li>Boundary marker verification</li>
        <li>Survey measurement validation</li>
        <li>Physical feature comparison</li>
      </ol>
      
      <h3>Phase 4: Community Intelligence</h3>
      <ol>
        <li>Local administrator interviews</li>
        <li>Community member consultations</li>
        <li>Historical knowledge gathering</li>
        <li>Dispute identification</li>
      </ol>
      
      <h3>Phase 5: Risk Assessment</h3>
      <ol>
        <li>Comprehensive risk analysis</li>
        <li>Risk factor weighting</li>
        <li>Recommendation generation</li>
        <li>Decision support provision</li>
      </ol>
    `,
    category: 'process',
    tags: ['process', 'steps', 'phases', 'workflow'],
    relatedTopics: ['verification-layers', 'risk-assessment']
  }
];

const CONTEXTUAL_GUIDES: Record<string, ContextualGuide> = {
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

export const HelpSystem: React.FC<HelpSystemProps> = ({
  currentContext,
  onClose,
  embedded = false
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'process' | 'risks' | 'legal' | 'technical'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContent, setSelectedContent] = useState<HelpContent | null>(null);
  const [showContextualGuide, setShowContextualGuide] = useState(false);

  const contextualGuide = currentContext ? CONTEXTUAL_GUIDES[currentContext] : null;

  useEffect(() => {
    if (currentContext && CONTEXTUAL_GUIDES[currentContext]) {
      setShowContextualGuide(true);
    }
  }, [currentContext]);

  const filteredContent = HELP_CONTENT.filter(content => {
    const matchesTab = content.category === activeTab;
    const matchesSearch = searchTerm === '' || 
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const renderContextualGuide = () => {
    if (!contextualGuide || !showContextualGuide) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">{contextualGuide.title}</h3>
          </div>
          <button
            onClick={() => setShowContextualGuide(false)}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <p className="text-blue-800 mt-2">{contextualGuide.description}</p>
        
        {contextualGuide.tips.length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium text-blue-900 flex items-center">
              <CheckCircle className="h-4 w-4 mr-1" />
              Tips
            </h4>
            <ul className="list-disc list-inside text-blue-800 text-sm mt-1">
              {contextualGuide.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
        
        {contextualGuide.warnings && contextualGuide.warnings.length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium text-orange-900 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Important Notes
            </h4>
            <ul className="list-disc list-inside text-orange-800 text-sm mt-1">
              {contextualGuide.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
        
        {contextualGuide.nextSteps && contextualGuide.nextSteps.length > 0 && (
          <div className="mt-3">
            <h4 className="font-medium text-green-900">Next Steps</h4>
            <ul className="list-disc list-inside text-green-800 text-sm mt-1">
              {contextualGuide.nextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (selectedContent) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{selectedContent.title}</h2>
            <button
              onClick={() => setSelectedContent(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="prose max-w-none">
            {selectedContent.content}
          </div>
          {selectedContent.relatedTopics.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-2">Related Topics</h3>
              <div className="flex flex-wrap gap-2">
                {selectedContent.relatedTopics.map(topic => {
                  const relatedContent = HELP_CONTENT.find(c => c.id === topic);
                  return relatedContent ? (
                    <button
                      key={topic}
                      onClick={() => setSelectedContent(relatedContent)}
                      className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                    >
                      {relatedContent.title}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {renderContextualGuide()}
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="space-y-3">
          {filteredContent.map(content => (
            <div
              key={content.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedContent(content)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">{content.title}</h3>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {content.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Book className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (embedded) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold">Land Verification Help</h1>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default HelpSystem;