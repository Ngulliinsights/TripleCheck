import { HelpCircle, X, ChevronRight, ChevronDown } from 'lucide-react';
import React, { createContext, useContext, useState, useCallback } from 'react';

export interface GuidanceStep {
  id: string;
  title: string;
  description: string;
  tips?: string[];
  warnings?: string[];
  nextSteps?: string[];
  relatedHelp?: string[];
}

export interface GuidanceContext {
  currentStep: string | null;
  showGuidance: boolean;
  setCurrentStep: (step: string | null) => void;
  toggleGuidance: () => void;
  registerStep: (step: GuidanceStep) => void;
  getStep: (stepId: string) => GuidanceStep | undefined;
}

const GuidanceContext = createContext<GuidanceContext | null>(null);

export const useGuidance = () => {
  const context = useContext(GuidanceContext);
  if (!context) {
    throw new Error('useGuidance must be used within a GuidanceProvider');
  }
  return context;
};

interface GuidanceProviderProps {
  children: React.ReactNode;
}

const PREDEFINED_STEPS: Record<string, GuidanceStep> = {
  'verification-start': {
    id: 'verification-start',
    title: 'Starting Land Verification',
    description: 'Begin the comprehensive land verification process to protect against fraud and ownership disputes.',
    tips: [
      'Gather all available property documents before starting',
      'Ensure you have clear photos of the property',
      'Have property coordinates or location details ready',
      'Set aside adequate time for the complete process'
    ],
    warnings: [
      'Incomplete information may affect verification accuracy',
      'Some verification steps may take several days to complete'
    ],
    nextSteps: [
      'Upload property documents for authentication',
      'Provide accurate property location information',
      'Review initial risk assessment results'
    ],
    relatedHelp: ['land-verification-overview', 'verification-process-guide']
  },
  'document-upload': {
    id: 'document-upload',
    title: 'Document Upload and Authentication',
    description: 'Upload your property documents for comprehensive authentication and analysis.',
    tips: [
      'Scan documents at high resolution (300 DPI minimum)',
      'Ensure all pages are included, including amendments',
      'Upload both sides of documents if applicable',
      'Include supporting documents like search certificates'
    ],
    warnings: [
      'Blurred or low-quality scans may require re-upload',
      'Missing pages will delay the verification process',
      'Ensure documents are recent and not expired'
    ],
    nextSteps: [
      'Documents will be analyzed for authenticity',
      'Registry verification will cross-check details',
      'Any issues will be flagged for review'
    ],
    relatedHelp: ['document-authentication', 'kenya-land-ownership-system']
  },
  'registry-verification': {
    id: 'registry-verification',
    title: 'Government Registry Verification',
    description: 'Cross-checking your property details against official government databases.',
    tips: [
      'This process connects to multiple government systems',
      'Verification may take several minutes to complete',
      'Historical ownership records will be analyzed',
      'Legal instruments and charges will be identified'
    ],
    warnings: [
      'Government systems may be temporarily unavailable',
      'Some historical records may be incomplete',
      'Network issues may cause delays'
    ],
    nextSteps: [
      'Physical verification will validate boundaries',
      'Community intelligence gathering will begin',
      'Risk assessment will be updated with findings'
    ],
    relatedHelp: ['registry-integration', 'ownership-verification']
  },
  'physical-verification': {
    id: 'physical-verification',
    title: 'Physical Property Verification',
    description: 'Coordinate ground-truthing of property boundaries and physical features.',
    tips: [
      'Use GPS-enabled device for accurate coordinates',
      'Take photos of boundary markers and key features',
      'Measure distances between important points',
      'Document any encroachments or boundary disputes'
    ],
    warnings: [
      'Weather conditions may affect GPS accuracy',
      'Some boundary markers may be missing or damaged',
      'Property access may be restricted or dangerous'
    ],
    nextSteps: [
      'Community intelligence will validate findings',
      'Expert surveyors may be recommended',
      'Physical findings will be integrated into risk assessment'
    ],
    relatedHelp: ['physical-verification-guide', 'boundary-verification']
  },
  'community-intelligence': {
    id: 'community-intelligence',
    title: 'Community Knowledge Gathering',
    description: 'Collect valuable local insights about property history and potential issues.',
    tips: [
      'Approach community members respectfully',
      'Ask open-ended questions about property history',
      'Document information sources and their credibility',
      'Cross-reference information from multiple sources'
    ],
    warnings: [
      'Community information may be subjective or biased',
      'Protect the privacy and safety of information sources',
      'Some community members may be reluctant to share information'
    ],
    nextSteps: [
      'Information will be cross-referenced with official records',
      'Discrepancies will be investigated further',
      'Expert legal counsel may be recommended for complex issues'
    ],
    relatedHelp: ['community-intelligence-guide', 'local-knowledge-validation']
  },
  'risk-assessment': {
    id: 'risk-assessment',
    title: 'Comprehensive Risk Analysis',
    description: 'Analyze all verification results to generate a comprehensive risk profile.',
    tips: [
      'Review all identified risk factors carefully',
      'Consider your personal risk tolerance level',
      'Pay attention to how different risks might interact',
      'Follow provided recommendations and mitigation strategies'
    ],
    warnings: [
      'High-risk properties require additional expert verification',
      'Some risks may not be immediately apparent',
      'Risk levels can change over time with new information'
    ],
    nextSteps: [
      'Consider expert consultation for high-risk properties',
      'Implement recommended mitigation strategies',
      'Set up ongoing monitoring if proceeding with purchase'
    ],
    relatedHelp: ['risk-assessment-guide', 'risk-types-explained']
  },
  'expert-coordination': {
    id: 'expert-coordination',
    title: 'Professional Expert Coordination',
    description: 'Connect with qualified professionals for specialized verification services.',
    tips: [
      'Choose experts with local experience and proper credentials',
      'Provide experts with all available verification data',
      'Coordinate timing to avoid delays in the process',
      'Request detailed reports from all engaged experts'
    ],
    warnings: [
      'Expert services may add significant cost and time',
      'Not all experts may be immediately available',
      'Expert opinions may sometimes conflict'
    ],
    nextSteps: [
      'Expert reports will be integrated into final assessment',
      'Conflicting expert opinions will be resolved',
      'Final recommendations will be provided'
    ],
    relatedHelp: ['expert-selection-guide', 'professional-coordination']
  },
  'monitoring-setup': {
    id: 'monitoring-setup',
    title: 'Ongoing Property Monitoring',
    description: 'Set up continuous monitoring to protect your property investment.',
    tips: [
      'Configure monitoring for relevant risk factors',
      'Set appropriate alert thresholds',
      'Maintain contact with verification professionals',
      'Review monitoring reports regularly'
    ],
    warnings: [
      'Monitoring cannot prevent all risks',
      'Some changes may not be immediately detectable',
      'Regular review and updates are necessary'
    ],
    nextSteps: [
      'Monitoring will begin immediately after setup',
      'Alerts will be sent for significant changes',
      'Annual reviews will be scheduled'
    ],
    relatedHelp: ['monitoring-guide', 'ongoing-protection']
  }
};

export const GuidanceProvider: React.FC<GuidanceProviderProps> = ({ children }) => {
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [showGuidance, setShowGuidance] = useState(true);
  const [registeredSteps, setRegisteredSteps] = useState<Record<string, GuidanceStep>>(PREDEFINED_STEPS);

  const toggleGuidance = useCallback(() => {
    setShowGuidance(prev => !prev);
  }, []);

  const registerStep = useCallback((step: GuidanceStep) => {
    setRegisteredSteps(prev => ({
      ...prev,
      [step.id]: step
    }));
  }, []);

  const getStep = useCallback((stepId: string) => {
    return registeredSteps[stepId];
  }, [registeredSteps]);

  const contextValue: GuidanceContext = {
    currentStep,
    showGuidance,
    setCurrentStep,
    toggleGuidance,
    registerStep,
    getStep
  };

  return (
    <GuidanceContext.Provider value={contextValue}>
      {children}
    </GuidanceContext.Provider>
  );
};

interface GuidancePanelProps {
  className?: string;
}

export const GuidancePanel: React.FC<GuidancePanelProps> = ({ className = '' }) => {
  const { currentStep, showGuidance, toggleGuidance, getStep } = useGuidance();
  const [expanded, setExpanded] = useState(true);

  if (!showGuidance || !currentStep) {
    return null;
  }

  const step = getStep(currentStep);
  if (!step) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">{step.title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 hover:text-blue-800"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={toggleGuidance}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {expanded && (
          <div className="mt-3 space-y-3">
            <p className="text-blue-800">{step.description}</p>
            
            {step.tips && step.tips.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-900 text-sm mb-1">Tips</h4>
                <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
                  {step.tips.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {step.warnings && step.warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-900 text-sm mb-1">Important Notes</h4>
                <ul className="list-disc list-inside text-orange-800 text-sm space-y-1">
                  {step.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {step.nextSteps && step.nextSteps.length > 0 && (
              <div>
                <h4 className="font-medium text-green-900 text-sm mb-1">What Happens Next</h4>
                <ul className="list-disc list-inside text-green-800 text-sm space-y-1">
                  {step.nextSteps.map((nextStep, index) => (
                    <li key={index}>{nextStep}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface GuidanceButtonProps {
  stepId: string;
  className?: string;
  children?: React.ReactNode;
}

export const GuidanceButton: React.FC<GuidanceButtonProps> = ({ 
  stepId, 
  className = '',
  children 
}) => {
  const { setCurrentStep, toggleGuidance, showGuidance } = useGuidance();

  const handleClick = () => {
    setCurrentStep(stepId);
    if (!showGuidance) {
      toggleGuidance();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center text-blue-600 hover:text-blue-800 ${className}`}
      title="Get help with this step"
    >
      {children || <HelpCircle className="h-4 w-4" />}
    </button>
  );
};

export default GuidanceProvider;