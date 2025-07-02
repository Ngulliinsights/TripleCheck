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
  targetPage?: string;
  preCheck?: () => boolean;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  restartTutorial: () => void;
  skipToStep: (stepIndex: number) => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Strategic tutorial steps following the most logical user journey
const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TripleCheck! 🏠',
    description: 'Your trusted partner for property verification in Kenya. Let\'s take a quick tour to show you how to protect your real estate investments.',
    element: '.tutorial-welcome',
    placement: 'bottom',
    targetPage: '/',
    preCheck: () => document.querySelector('.tutorial-welcome') !== null
  },
  {
    id: 'navigation',
    title: 'Main Navigation',
    description: 'This is your main navigation. Here you can access all our verification services, browse properties, and manage your account.',
    element: 'nav',
    placement: 'bottom',
    targetPage: '/',
    preCheck: () => document.querySelector('nav') !== null
  },
  {
    id: 'search',
    title: 'Property Search 🔍',
    description: 'Start by searching for properties by location, price, or features. This is often the first step in your property verification journey.',
    element: '.search-bar input',
    placement: 'bottom',
    targetPage: '/',
    preCheck: () => document.querySelector('.search-bar input') !== null
  },
  {
    id: 'verify-property',
    title: 'Verify Property - Your Primary Action ✅',
    description: 'This is the most important button! Click here anytime to start verifying a property. This is your main protection against fraud.',
    element: '.verify-property',
    placement: 'bottom',
    targetPage: '/',
    preCheck: () => document.querySelector('.verify-property') !== null
  },
  {
    id: 'services-overview',
    title: 'Our Core Services',
    description: 'We offer three main service categories: Property Verification (fraud protection), Community Trust Network (user reviews), and Market Insights (data & reports).',
    element: 'body',
    placement: 'bottom',
    targetPage: '/'
  },
  {
    id: 'basic-verification',
    title: 'Start with Basic Verification',
    description: 'Every property check starts here. We verify ownership, check for fraud indicators, and provide a risk assessment in minutes.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/basic-checks',
    action: () => window.location.href = '/services/basic-checks'
  },
  {
    id: 'document-authentication',
    title: 'Document Authentication',
    description: 'Upload property documents for AI-powered verification. We check title deeds, lease agreements, and ownership papers for authenticity.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/document-auth',
    action: () => window.location.href = '/services/document-auth'
  },
  {
    id: 'fraud-detection',
    title: 'Advanced Fraud Detection',
    description: 'Our AI analyzes patterns, cross-references databases, and identifies suspicious activities to protect you from property fraud.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/fraud-detection',
    action: () => window.location.href = '/services/fraud-detection'
  },
  {
    id: 'community-trust',
    title: 'Community Trust Network',
    description: 'Check what other users say about properties, landlords, and agents. Real reviews from verified users help you make informed decisions.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/reviews',
    action: () => window.location.href = '/services/reviews'
  },
  {
    id: 'trust-scores',
    title: 'Trust Points & Karma Scores',
    description: 'Every user and property has a trust score based on verification history, community feedback, and transaction success rate.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/trust-points',
    action: () => window.location.href = '/services/trust-points'
  },
  {
    id: 'market-insights',
    title: 'Market Insights & Reports',
    description: 'Get comprehensive market data, price trends, and detailed property reports to make data-driven investment decisions.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/reports',
    action: () => window.location.href = '/services/reports'
  },
  {
    id: 'dashboard',
    title: 'Your Personal Dashboard',
    description: 'Track your verified properties, view your verification history, manage alerts, and access all your saved data from one place.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/dashboard',
    action: () => window.location.href = '/dashboard'
  },
  {
    id: 'pricing',
    title: 'Flexible Pricing Plans',
    description: 'Choose a plan that fits your needs. From individual property checks to unlimited enterprise verification - we have options for everyone.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/pricing',
    action: () => window.location.href = '/pricing'
  },
  {
    id: 'complete',
    title: 'Ready to Protect Your Investments! 🎉',
    description: 'You\'re all set! Start by clicking "Verify Property" to check your first property, or explore our services. Remember: always verify before you invest!',
    element: 'body',
    placement: 'bottom',
    targetPage: '/',
    action: () => window.location.href = '/'
  }
];

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [location, setLocation] = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  const hasShownWelcomeRef = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Check if the user has seen the tutorial before
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    const tutorialDismissed = localStorage.getItem('tutorialDismissed');

    // Only show welcome dialog if user hasn't seen tutorial and we haven't shown it in this session yet
    if (!hasSeenTutorial && !tutorialDismissed && location === '/' && !hasShownWelcomeRef.current) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
        hasShownWelcomeRef.current = true;
      }, 2000); // Show after 2 seconds for better UX

      return () => clearTimeout(timer);
    }
  }, [location]);

  // Start the tutorial
  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    setShowWelcome(false);
    // Navigate to home if not already there
    if (location !== '/') {
      setLocation('/');
    }
  };

  // End the tutorial and mark as seen
  const endTutorial = () => {
    setIsActive(false);
    setIsNavigating(false);
    localStorage.setItem('hasSeenTutorial', 'true');
    // Navigate back to home
    setLocation('/');
  };

  // Allow restarting the tutorial manually
  const restartTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    setIsNavigating(false);
    localStorage.removeItem('hasSeenTutorial');
    localStorage.removeItem('tutorialDismissed');
    // Navigate to home to start tutorial
    setLocation('/');
  };

  // Skip to specific step
  const skipToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < tutorialSteps.length) {
      setCurrentStep(stepIndex);
      const step = tutorialSteps[stepIndex];
      if (step.targetPage && step.targetPage !== location) {
        setIsNavigating(true);
        setLocation(step.targetPage);
      }
    }
  };

  // Navigate to the next step
  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStepData = tutorialSteps[currentStep + 1];

      setCurrentStep(prev => prev + 1);

      // Navigate to target page if specified
      if (nextStepData.targetPage && nextStepData.targetPage !== location) {
        setIsNavigating(true);
        setLocation(nextStepData.targetPage);
      }

      // Execute any actions associated with this step
      if (nextStepData.action) {
        setTimeout(() => {
          nextStepData.action!();
        }, 500);
      }
    } else {
      endTutorial();
    }
  };

  // Navigate to the previous step
  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepData = tutorialSteps[currentStep - 1];

      setCurrentStep(prev => prev - 1);

      // Navigate to target page if specified
      if (prevStepData.targetPage && prevStepData.targetPage !== location) {
        setIsNavigating(true);
        setLocation(prevStepData.targetPage);
      }
    }
  };

  // Handle "Maybe Later" - dismiss but don't mark as completed
  const dismissTutorial = () => {
    setShowWelcome(false);
    localStorage.setItem('tutorialDismissed', 'true');
  };

  // Get the current tutorial step
  const currentTutorialStep = tutorialSteps[currentStep];

  // Calculate position for the tooltip highlight
  const [highlightPosition, setHighlightPosition] = useState<any>(null);

  const calculateHighlightPosition = () => {
    if (!currentTutorialStep || isNavigating) return null;

    try {
      // Check if we need to wait for the target page to load
      if (currentTutorialStep.targetPage && currentTutorialStep.targetPage !== location) {
        return null;
      }

      // Use preCheck if available
      if (currentTutorialStep.preCheck && !currentTutorialStep.preCheck()) {
        console.warn(`Tutorial preCheck failed for step: ${currentTutorialStep.id}`);
        return null;
      }

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
    if (isActive && !isNavigating) {
      const updatePosition = () => {
        setHighlightPosition(calculateHighlightPosition());
      };

      // Wait for navigation to complete
      const timer = setTimeout(updatePosition, 300);

      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isActive, currentStep, location, isNavigating]);

  // Reset navigation state when location changes
  useEffect(() => {
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep,
        restartTutorial,
        skipToStep
      }}
    >
      {children}

      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-[#2C5282]">
              🏠 Welcome to TripleCheck!
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              Kenya's most trusted property verification platform. Protect yourself from real estate fraud with our comprehensive verification system.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <div className="text-sm text-center mb-4">
              <p className="mb-3 font-medium">Take a 3-minute guided tour to learn how to:</p>
              <ul className="list-disc pl-6 mt-2 text-left space-y-2">
                <li>Verify property ownership and authenticity</li>
                <li>Check seller trust scores and reviews</li>
                <li>Use AI-powered fraud detection tools</li>
                <li>Access comprehensive property reports</li>
                <li>Navigate our verification services efficiently</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs">
                <strong>💡 Pro Tip:</strong> This tour will save you time and help you avoid costly mistakes when investing in real estate.
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button variant="outline" onClick={dismissTutorial}>
              Maybe Later
            </Button>
            <Button onClick={startTutorial} className="bg-[#2C5282] hover:bg-[#2C5282]/90">
              Start 3-Min Tour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tutorial Overlay and Tooltip */}
      {isActive && currentTutorialStep && !isNavigating && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Highlighted element */}
          {highlightPosition && (
            <div
              className="absolute border-4 border-[#2C5282] rounded-lg bg-white/10 pointer-events-none shadow-2xl animate-pulse"
              style={{
                top: `${highlightPosition.top - 4}px`,
                left: `${highlightPosition.left - 4}px`,
                width: `${highlightPosition.width + 8}px`,
                height: `${highlightPosition.height + 8}px`,
                boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(44, 82, 130, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.1)`
              }}
            />
          )}

          {/* Tutorial card */}
          <div 
            className="absolute bg-white rounded-xl shadow-2xl border-2 border-[#2C5282] p-6 max-w-sm pointer-events-auto transform transition-all duration-300"
            style={{
              top: highlightPosition ? 
                (highlightPosition.top > window.innerHeight / 2 ? 
                  `${Math.max(20, highlightPosition.top - 250)}px` : 
                  `${highlightPosition.top + highlightPosition.height + 20}px`) : 
                '50%',
              left: highlightPosition ? 
                `${Math.max(20, Math.min(highlightPosition.left, window.innerWidth - 400))}px` : 
                '50%',
              transform: !highlightPosition ? 'translate(-50%, -50%)' : 'none'
            }}
          >
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-xl text-[#2C5282]">
                  {currentTutorialStep.title}
                </h3>
                <div className="text-xs bg-[#2C5282] text-white px-2 py-1 rounded-full">
                  {currentStep + 1}/{tutorialSteps.length}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                {currentTutorialStep.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#2C5282] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="border-[#2C5282] text-[#2C5282] hover:bg-[#2C5282] hover:text-white disabled:opacity-50"
              >
                ← Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={endTutorial}
                  className="text-gray-500 hover:text-gray-700 text-xs"
                >
                  Skip Tour
                </Button>
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="bg-[#2C5282] hover:bg-[#2C5282]/90 text-white"
                >
                  {currentStep === tutorialSteps.length - 1 ? 'Complete Tour 🎉' : 'Next →'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay during navigation */}
      {isActive && isNavigating && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2C5282]"></div>
              <span className="text-[#2C5282] font-medium">Loading next step...</span>
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