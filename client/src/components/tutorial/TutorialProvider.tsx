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
    element: '[href="/"]',
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
    id: 'services-menu',
    title: 'Services Menu',
    description: 'Click on Services to explore our three main categories: Property Verification, Community Trust Network, and Market Insights.',
    element: '[role="button"]:has-text("Services")',
    placement: 'bottom'
  },
  {
    id: 'basic-checks',
    title: 'Basic Property Checks',
    description: 'Start with basic property verification to check ownership, legal status, and authenticity.',
    element: 'a[href="/services/basic-checks"]',
    placement: 'right'
  },
  {
    id: 'document-auth',
    title: 'Document Authentication',
    description: 'Upload property documents for verification. We use AI and blockchain to validate ownership records, title deeds, and more.',
    element: 'a[href="/services/document-auth"]',
    placement: 'right'
  },
  {
    id: 'fraud-detection',
    title: 'Fraud Detection System',
    description: 'Our advanced algorithms identify suspicious listings and potential scams to keep you safe during property transactions.',
    element: 'a[href="/services/fraud-detection"]',
    placement: 'right'
  },
  {
    id: 'features',
    title: 'Platform Features',
    description: 'Learn about all the powerful features we offer to protect your real estate investments.',
    element: 'a[href="/features"]',
    placement: 'bottom'
  },
  {
    id: 'pricing',
    title: 'Pricing Plans',
    description: 'Choose from our flexible pricing plans designed to meet your verification needs and budget.',
    element: 'a[href="/pricing"]',
    placement: 'bottom'
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'Access your saved properties, verification history, and manage your account settings from your personal dashboard.',
    element: 'a[href="/dashboard"]',
    placement: 'bottom'
  },
  {
    id: 'complete',
    title: 'Tour Complete!',
    description: 'You\'re all set! Start by verifying your first property or exploring our comprehensive services. Need help? Click the help button anytime.',
    element: 'body',
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
  const [highlightPosition, setHighlightPosition] = useState<any>(null);

  const calculateHighlightPosition = () => {
    if (!currentTutorialStep) return null;
    
    try {
      const element = document.querySelector(currentTutorialStep.element);
      if (!element) {
        console.warn(`Tutorial element not found: ${currentTutorialStep.element}`);
        return null;
      }
      
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      };
    } catch (error) {
      console.error("Error finding tutorial element:", error);
      return null;
    }
  };

  // Update highlight position when step changes or window resizes
  useEffect(() => {
    if (isActive) {
      const updatePosition = () => {
        setHighlightPosition(calculateHighlightPosition());
      };
      
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      
      // Small delay to ensure DOM is ready
      const timeout = setTimeout(updatePosition, 100);
      
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
        clearTimeout(timeout);
      };
    }
  }, [isActive, currentStep]);

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

      {/* Tutorial Overlay and Tooltip */}
      {isActive && currentTutorialStep && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50" />
          
          {/* Highlighted element */}
          {highlightPosition && (
            <div
              className="absolute border-4 border-[#2C5282] rounded-lg bg-white/10 pointer-events-none shadow-2xl"
              style={{
                top: `${highlightPosition.top - 4}px`,
                left: `${highlightPosition.left - 4}px`,
                width: `${highlightPosition.width + 8}px`,
                height: `${highlightPosition.height + 8}px`,
                boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px rgba(44, 82, 130, 0.5)`
              }}
            />
          )}
          
          {/* Tutorial card */}
          <div 
            className="absolute bg-white rounded-lg shadow-xl border-2 border-[#2C5282] p-6 max-w-sm pointer-events-auto"
            style={{
              top: highlightPosition ? 
                (highlightPosition.top > window.innerHeight / 2 ? 
                  `${highlightPosition.top - 200}px` : 
                  `${highlightPosition.top + highlightPosition.height + 20}px`) : 
                '50%',
              left: highlightPosition ? 
                `${Math.max(20, Math.min(highlightPosition.left, window.innerWidth - 400))}px` : 
                '50%',
              transform: !highlightPosition ? 'translate(-50%, -50%)' : 'none'
            }}
          >
            <div className="mb-4">
              <h3 className="font-bold text-xl text-[#2C5282] mb-2">
                {currentTutorialStep.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {currentTutorialStep.description}
              </p>
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="border-[#2C5282] text-[#2C5282] hover:bg-[#2C5282] hover:text-white"
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  {currentStep + 1} of {tutorialSteps.length}
                </span>
                <div className="flex gap-1">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentStep ? 'bg-[#2C5282]' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={endTutorial}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Skip
                </Button>
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="bg-[#2C5282] hover:bg-[#2C5282]/90 text-white"
                >
                  {currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </div>
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
