import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  element: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  restartTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Comprehensive tutorial steps with more detailed guidance
const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TripleCheck!',
    description: 'Let us show you around our platform and help you get started with property verification in Kenya.',
    element: '.tutorial-welcome',
    placement: 'bottom'
  },
  {
    id: 'navigation',
    title: 'Navigation Menu',
    description: 'Use our navigation menu to access all platform features including Property Verification, Community Trust Network, and Market Insights.',
    element: 'nav',
    placement: 'bottom'
  },
  {
    id: 'search',
    title: 'Property Search',
    description: 'Easily search for properties by location, price range, or property type. Our advanced search helps you find exactly what you\'re looking for.',
    element: '.search-bar',
    placement: 'bottom'
  },
  {
    id: 'verification',
    title: 'Property Verification',
    description: 'Check property authenticity and ownership details. This is your first step in ensuring a property is legitimate.',
    element: '.verify-property',
    placement: 'left'
  },
  {
    id: 'services',
    title: 'Our Core Services',
    description: 'Explore our three main service categories: Property Verification, Community Trust Network, and Market Insights.',
    element: '[href="/services/basic-checks"]',
    placement: 'right'
  },
  {
    id: 'document-auth',
    title: 'Document Authentication',
    description: 'Upload property documents for verification. We use AI and blockchain to validate ownership records, title deeds, and more.',
    element: '[href="/services/document-auth"]',
    placement: 'right'
  },
  {
    id: 'fraud-detection',
    title: 'Fraud Detection System',
    description: 'Our advanced algorithms identify suspicious listings and potential scams to keep you safe during property transactions.',
    element: '[href="/services/fraud-detection"]',
    placement: 'right'
  },
  {
    id: 'reviews',
    title: 'Community Reviews',
    description: 'Read and contribute reviews from other users to build a trustworthy community ecosystem around real estate.',
    element: '[href="/services/reviews"]',
    placement: 'right'
  },
  {
    id: 'trust-points',
    title: 'Trust Points System',
    description: 'Earn trust points by verifying properties and contributing authentic information. Use these points for premium features.',
    element: '[href="/services/trust-points"]',
    placement: 'right'
  },
  {
    id: 'karma',
    title: 'Real Estate Karma Score',
    description: 'Every property and seller has a Karma Score. Higher scores indicate more trustworthy listings and sellers.',
    element: '[href="/services/karma"]',
    placement: 'right'
  },
  {
    id: 'reports',
    title: 'Comprehensive Reports',
    description: 'Get detailed property history reports showing ownership changes, price fluctuations, and verification data.',
    element: '[href="/services/reports"]',
    placement: 'right'
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'Access your saved properties, verification history, and manage your account settings from your personal dashboard.',
    element: '[href="/dashboard"]',
    placement: 'bottom'
  }
];

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [location] = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  const hasShownWelcomeRef = useRef(false);

  useEffect(() => {
    // Check if the user has seen the tutorial before
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    
    // Only show welcome dialog if user hasn't seen tutorial and we haven't shown it in this session yet
    if (!hasSeenTutorial && location === '/' && !hasShownWelcomeRef.current) {
      setShowWelcome(true);
      hasShownWelcomeRef.current = true;
    }
  }, [location]);

  // Start the tutorial
  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    setShowWelcome(false);
  };

  // End the tutorial and mark as seen
  const endTutorial = () => {
    setIsActive(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  // Allow restarting the tutorial manually
  const restartTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  // Navigate to the next step
  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      
      // Execute any actions associated with this step
      const nextStepData = tutorialSteps[currentStep + 1];
      if (nextStepData && nextStepData.action) {
        nextStepData.action();
      }
    } else {
      endTutorial();
    }
  };

  // Navigate to the previous step
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Get the current tutorial step
  const currentTutorialStep = tutorialSteps[currentStep];

  // Calculate position for the tooltip highlight using a ref
  const calculateHighlightPosition = () => {
    if (!currentTutorialStep) return null;
    
    try {
      const element = document.querySelector(currentTutorialStep.element);
      if (!element) return null;
      
      const rect = element.getBoundingClientRect();
      return {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
      };
    } catch (error) {
      console.error("Error finding tutorial element:", error);
      return null;
    }
  };

  const highlightPosition = isActive ? calculateHighlightPosition() : null;

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
        restartTutorial
      }}
    >
      {children}

      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-[#2C5282]">Welcome to TripleCheck!</DialogTitle>
            <DialogDescription className="text-center pt-2">
              Your trusted partner in real estate verification in Kenya. Would you like a guided tour of our platform?
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="text-sm text-center mb-4">
              <p className="mb-2">We'll show you how to:</p>
              <ul className="list-disc pl-6 mt-2 text-left space-y-1">
                <li>Verify properties and ownership records</li>
                <li>Check trust scores and seller karma</li>
                <li>Use our advanced fraud detection tools</li>
                <li>Access comprehensive property reports</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={() => setShowWelcome(false)}>
              Maybe Later
            </Button>
            <Button onClick={startTutorial} className="bg-[#2C5282] hover:bg-[#2C5282]/90">
              Start Tour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tutorial Tooltips */}
      {isActive && currentTutorialStep && (
        <TooltipProvider>
          <Tooltip open={true}>
            <TooltipTrigger asChild>
              {/* Semi-transparent overlay with highlighted element */}
              <div className="fixed inset-0 z-50 bg-black/50 pointer-events-none">
                {highlightPosition && (
                  <div
                    className="absolute border-2 border-[#2C5282] rounded-md bg-transparent pointer-events-none"
                    style={{
                      top: highlightPosition.top,
                      left: highlightPosition.left,
                      width: highlightPosition.width,
                      height: highlightPosition.height,
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                    }}
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side={currentTutorialStep.placement || 'top'}
              className="p-4 max-w-sm bg-white border border-[#2C5282] z-50"
              align="center"
            >
              <h3 className="font-semibold text-lg text-[#2C5282] mb-2">{currentTutorialStep.title}</h3>
              <p className="text-sm mb-4">{currentTutorialStep.description}</p>
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentStep + 1} of {tutorialSteps.length}
                </span>
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="bg-[#2C5282] hover:bg-[#2C5282]/90"
                >
                  {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
