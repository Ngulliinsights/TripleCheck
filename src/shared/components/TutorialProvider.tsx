import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

// Enhanced interface with better type safety
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  element: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
  targetPage?: string;
  preCheck?: () => boolean;
  // Added optional delay for better UX timing
  delay?: number;
  // Added optional validation for step completion
  validate?: () => boolean;
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number; // Added for better progress tracking
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
  restartTutorial: () => void;
  skipToStep: (stepIndex: number) => void;
  // Added methods for better control
  pauseTutorial: () => void;
  resumeTutorial: () => void;
  isPaused: boolean;
}

// Enhanced position interface for better type safety
interface HighlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

// Constants for better maintainability
const TUTORIAL_STORAGE_KEYS = {
  HAS_SEEN: 'hasSeenTutorial',
  DISMISSED: 'tutorialDismissed',
  CURRENT_STEP: 'tutorialCurrentStep', // Added for resume functionality
} as const;

const TIMING_CONFIG = {
  WELCOME_DELAY: 2000,
  NAVIGATION_DELAY: 1000,
  STEP_TRANSITION_DELAY: 300,
  HIGHLIGHT_UPDATE_DELAY: 100,
} as const;

// Strategic tutorial steps with enhanced configuration
const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TripleCheck! 🏠',
    description: 'Your trusted partner for property verification in Kenya. Let\'s take a quick tour to show you how to protect your real estate investments.',
    element: '.tutorial-welcome',
    placement: 'bottom',
    targetPage: '/',
    delay: 500,
    preCheck: () => document.querySelector('.tutorial-welcome') !== null
  },
  {
    id: 'navigation',
    title: 'Main Navigation',
    description: 'This is your main navigation. Here you can access all our verification services, browse properties, and manage your account.',
    element: 'nav',
    placement: 'bottom',
    targetPage: '/',
    delay: 300,
    preCheck: () => document.querySelector('nav') !== null
  },
  {
    id: 'search',
    title: 'Property Search 🔍',
    description: 'Start by searching for properties by location, price, or features. This is often the first step in your property verification journey.',
    element: '.search-bar input',
    placement: 'bottom',
    targetPage: '/',
    delay: 300,
    preCheck: () => document.querySelector('.search-bar input') !== null
  },
  {
    id: 'verify-property',
    title: 'Verify Property - Your Primary Action ✅',
    description: 'This is the most important button! Click here anytime to start verifying a property. This is your main protection against fraud.',
    element: '.verify-property',
    placement: 'bottom',
    targetPage: '/',
    delay: 300,
    preCheck: () => document.querySelector('.verify-property') !== null
  },
  {
    id: 'services-overview',
    title: 'Our Core Services',
    description: 'We offer three main service categories: Property Verification (fraud protection), Community Trust Network (user reviews), and Market Insights (data & reports).',
    element: 'body',
    placement: 'bottom',
    targetPage: '/',
    delay: 200
  },
  {
    id: 'basic-verification',
    title: 'Start with Basic Verification',
    description: 'Every property check starts here. We verify ownership, check for fraud indicators, and provide a risk assessment in minutes.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/basic-checks',
    delay: 500,
    action: () => window.location.href = '/services/basic-checks'
  },
  {
    id: 'document-authentication',
    title: 'Document Authentication',
    description: 'Upload property documents for AI-powered verification. We check title deeds, lease agreements, and ownership papers for authenticity.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/document-auth',
    delay: 500,
    action: () => window.location.href = '/services/document-auth'
  },
  {
    id: 'fraud-detection',
    title: 'Advanced Fraud Detection',
    description: 'Our AI analyzes patterns, cross-references databases, and identifies suspicious activities to protect you from property fraud.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/fraud-detection',
    delay: 500,
    action: () => window.location.href = '/services/fraud-detection'
  },
  {
    id: 'community-trust',
    title: 'Community Trust Network',
    description: 'Check what other users say about properties, landlords, and agents. Real reviews from verified users help you make informed decisions.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/reviews',
    delay: 500,
    action: () => window.location.href = '/services/reviews'
  },
  {
    id: 'trust-scores',
    title: 'Trust Points & Karma Scores',
    description: 'Every user and property has a trust score based on verification history, community feedback, and transaction success rate.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/trust-points',
    delay: 500,
    action: () => window.location.href = '/services/trust-points'
  },
  {
    id: 'market-insights',
    title: 'Market Insights & Reports',
    description: 'Get comprehensive market data, price trends, and detailed property reports to make data-driven investment decisions.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/services/reports',
    delay: 500,
    action: () => window.location.href = '/services/reports'
  },
  {
    id: 'dashboard',
    title: 'Your Personal Dashboard',
    description: 'Track your verified properties, view your verification history, manage alerts, and access all your saved data from one place.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/dashboard',
    delay: 500,
    action: () => window.location.href = '/dashboard'
  },
  {
    id: 'pricing',
    title: 'Flexible Pricing Plans',
    description: 'Choose a plan that fits your needs. From individual property checks to unlimited enterprise verification - we have options for everyone.',
    element: 'body',
    placement: 'bottom',
    targetPage: '/pricing',
    delay: 500,
    action: () => window.location.href = '/pricing'
  },
  {
    id: 'complete',
    title: 'Ready to Protect Your Investments! 🎉',
    description: 'You\'re all set! Start by clicking "Verify Property" to check your first property, or explore our services. Remember: always verify before you invest!',
    element: 'body',
    placement: 'bottom',
    targetPage: '/',
    delay: 300,
    action: () => window.location.href = '/'
  }
];

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [location, setLocation] = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState<HighlightPosition | null>(null);
  
  // Use refs for values that don't need to trigger re-renders
  const hasShownWelcomeRef = useRef(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Memoized values for better performance
  const totalSteps = useMemo(() => tutorialSteps.length, []);
  const currentTutorialStep = useMemo(() => tutorialSteps[currentStep], [currentStep]);
  const progressPercentage = useMemo(() => 
    Math.round(((currentStep + 1) / totalSteps) * 100), [currentStep, totalSteps]);

  // Enhanced element finding with better error handling and retry logic
  const findTutorialElement = useCallback((selector: string, retries = 3): Element | null => {
    try {
      const element = document.querySelector(selector);
      if (element) return element;
      
      // Retry mechanism for elements that might not be ready yet
      if (retries > 0) {
        return new Promise<Element | null>((resolve) => {
          setTimeout(() => {
            resolve(findTutorialElement(selector, retries - 1));
          }, TIMING_CONFIG.HIGHLIGHT_UPDATE_DELAY);
        }) as any;
      }
      
      return null;
    } catch (error) {
      console.warn(`Error finding tutorial element "${selector}":`, error);
      return null;
    }
  }, []);

  // Optimized highlight position calculation with caching
  const calculateHighlightPosition = useCallback((): HighlightPosition | null => {
    if (!currentTutorialStep || isNavigating || isPaused) return null;

    try {
      // Check target page requirement
      if (currentTutorialStep.targetPage && currentTutorialStep.targetPage !== location) {
        return null;
      }

      // Run preCheck if available
      if (currentTutorialStep.preCheck && !currentTutorialStep.preCheck()) {
        return null;
      }

      const element = findTutorialElement(currentTutorialStep.element);
      if (!element) return null;

      const rect = element.getBoundingClientRect();
      
      // Ensure the element is visible
      if (rect.width === 0 || rect.height === 0) return null;

      return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      };
    } catch (error) {
      console.error("Error calculating highlight position:", error);
      return null;
    }
  }, [currentTutorialStep, isNavigating, isPaused, location, findTutorialElement]);

  // Debounced highlight position update
  const updateHighlightPosition = useCallback(() => {
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }

    highlightTimeoutRef.current = setTimeout(() => {
      const position = calculateHighlightPosition();
      setHighlightPosition(position);
    }, TIMING_CONFIG.HIGHLIGHT_UPDATE_DELAY);
  }, [calculateHighlightPosition]);

  // Enhanced welcome dialog logic with better timing
  useEffect(() => {
    if (location !== '/' || hasShownWelcomeRef.current) return;

    const hasSeenTutorial = localStorage.getItem(TUTORIAL_STORAGE_KEYS.HAS_SEEN);
    const tutorialDismissed = localStorage.getItem(TUTORIAL_STORAGE_KEYS.DISMISSED);

    if (!hasSeenTutorial && !tutorialDismissed) {
      const timer = setTimeout(() => {
        setShowWelcome(true);
        hasShownWelcomeRef.current = true;
      }, TIMING_CONFIG.WELCOME_DELAY);

      return () => clearTimeout(timer);
    }
  }, [location]);

  // Optimized tutorial control methods
  const startTutorial = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    setCurrentStep(0);
    setShowWelcome(false);
    
    // Navigate to home if not already there
    if (location !== '/') {
      setLocation('/');
    }
    
    // Store current step for resume functionality
    localStorage.setItem(TUTORIAL_STORAGE_KEYS.CURRENT_STEP, '0');
  }, [location, setLocation]);

  const endTutorial = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setIsNavigating(false);
    
    // Clear all tutorial-related storage
    localStorage.setItem(TUTORIAL_STORAGE_KEYS.HAS_SEEN, 'true');
    localStorage.removeItem(TUTORIAL_STORAGE_KEYS.CURRENT_STEP);
    
    // Navigate back to home
    setLocation('/');
  }, [setLocation]);

  const pauseTutorial = useCallback(() => {
    setIsPaused(true);
    localStorage.setItem(TUTORIAL_STORAGE_KEYS.CURRENT_STEP, currentStep.toString());
  }, [currentStep]);

  const resumeTutorial = useCallback(() => {
    setIsPaused(false);
  }, []);

  const restartTutorial = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
    setCurrentStep(0);
    setIsNavigating(false);
    
    // Clear all tutorial storage
    localStorage.removeItem(TUTORIAL_STORAGE_KEYS.HAS_SEEN);
    localStorage.removeItem(TUTORIAL_STORAGE_KEYS.DISMISSED);
    localStorage.removeItem(TUTORIAL_STORAGE_KEYS.CURRENT_STEP);
    
    // Navigate to home
    setLocation('/');
  }, [setLocation]);

  const skipToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCurrentStep(stepIndex);
      localStorage.setItem(TUTORIAL_STORAGE_KEYS.CURRENT_STEP, stepIndex.toString());
      
      const step = tutorialSteps[stepIndex];
      if (step.targetPage && step.targetPage !== location) {
        setIsNavigating(true);
        setLocation(step.targetPage);
      }
    }
  }, [totalSteps, location, setLocation]);

  // Enhanced step navigation with better error handling
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      const nextStepIndex = currentStep + 1;
      const nextStepData = tutorialSteps[nextStepIndex];

      setCurrentStep(nextStepIndex);
      localStorage.setItem(TUTORIAL_STORAGE_KEYS.CURRENT_STEP, nextStepIndex.toString());

      // Handle navigation
      if (nextStepData.targetPage && nextStepData.targetPage !== location) {
        setIsNavigating(true);
        setLocation(nextStepData.targetPage);
      }

      // Execute step action with proper timing
      if (nextStepData.action) {
        const delay = nextStepData.delay || TIMING_CONFIG.STEP_TRANSITION_DELAY;
        setTimeout(() => {
          try {
            nextStepData.action!();
          } catch (error) {
            console.error('Error executing step action:', error);
          }
        }, delay);
      }
    } else {
      endTutorial();
    }
  }, [currentStep, totalSteps, location, setLocation, endTutorial]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      const prevStepData = tutorialSteps[prevStepIndex];

      setCurrentStep(prevStepIndex);
      localStorage.setItem(TUTORIAL_STORAGE_KEYS.CURRENT_STEP, prevStepIndex.toString());

      // Handle navigation
      if (prevStepData.targetPage && prevStepData.targetPage !== location) {
        setIsNavigating(true);
        setLocation(prevStepData.targetPage);
      }
    }
  }, [currentStep, location, setLocation]);

  // Enhanced dismiss functionality
  const dismissTutorial = useCallback(() => {
    setShowWelcome(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEYS.DISMISSED, 'true');
  }, []);

  // Optimized highlight position updates with ResizeObserver
  useEffect(() => {
    if (!isActive || isPaused || isNavigating) return;

    // Initial position calculation
    updateHighlightPosition();

    // Set up ResizeObserver for better performance than window resize events
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(updateHighlightPosition);
      resizeObserverRef.current.observe(document.body);
    }

    // Fallback to window events if ResizeObserver is not available
    const handleResize = () => updateHighlightPosition();
    const handleScroll = () => updateHighlightPosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, [isActive, isPaused, isNavigating, updateHighlightPosition]);

  // Handle navigation state reset
  useEffect(() => {
    if (isNavigating) {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
      
      navigationTimeoutRef.current = setTimeout(() => {
        setIsNavigating(false);
      }, TIMING_CONFIG.NAVIGATION_DELAY);
    }

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, [isNavigating]);

  // Context value with memoization for performance
  const contextValue = useMemo<TutorialContextType>(() => ({
    isActive,
    isPaused,
    currentStep,
    totalSteps,
    startTutorial,
    endTutorial,
    nextStep,
    prevStep,
    restartTutorial,
    skipToStep,
    pauseTutorial,
    resumeTutorial,
  }), [
    isActive,
    isPaused,
    currentStep,
    totalSteps,
    startTutorial,
    endTutorial,
    nextStep,
    prevStep,
    restartTutorial,
    skipToStep,
    pauseTutorial,
    resumeTutorial,
  ]);

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}

      {/* Enhanced Welcome Dialog */}
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

      {/* Enhanced Tutorial Overlay */}
      {isActive && !isPaused && currentTutorialStep && !isNavigating && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {/* Optimized dark overlay */}
          <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />

          {/* Enhanced highlighted element */}
          {highlightPosition && (
            <div
              className="absolute border-4 border-[#2C5282] rounded-lg bg-white/10 pointer-events-none shadow-2xl transition-all duration-300"
              style={{
                top: `${highlightPosition.top - 4}px`,
                left: `${highlightPosition.left - 4}px`,
                width: `${highlightPosition.width + 8}px`,
                height: `${highlightPosition.height + 8}px`,
                boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 30px rgba(44, 82, 130, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.1)`,
                animation: 'pulse 2s infinite'
              }}
            />
          )}

          {/* Enhanced tutorial card with better positioning */}
          <div 
            className="absolute bg-white rounded-xl shadow-2xl border-2 border-[#2C5282] p-6 max-w-sm pointer-events-auto transform transition-all duration-300 animate-in fade-in-0 slide-in-from-bottom-4"
            style={{
              top: highlightPosition ? 
                (highlightPosition.top > window.innerHeight / 2 ? 
                  `${Math.max(20, highlightPosition.top - 280)}px` : 
                  `${Math.min(window.innerHeight - 300, highlightPosition.top + highlightPosition.height + 20)}px`) : 
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
                  {currentStep + 1}/{totalSteps}
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm">
                {currentTutorialStep.description}
              </p>
            </div>

            {/* Enhanced progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#2C5282] h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Enhanced controls */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="border-[#2C5282] text-[#2C5282] hover:bg-[#2C5282] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={pauseTutorial}
                  className="text-gray-500 hover:text-gray-700 text-xs"
                >
                  Pause
                </Button>
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
                  className="bg-[#2C5282] hover:bg-[#2C5282]/90 text-white transition-colors duration-200"
                >
                  {currentStep === totalSteps - 1 ? 'Complete Tour 🎉' : 'Next →'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced loading overlay */}
      {isActive && isNavigating && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-lg p-6 shadow-xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2C5282]"></div>
              <span className="text-[#2C5282] font-medium">Loading next step...</span>
            </div>
          </div>
        </div>
      )}

      {/* Pause overlay */}
      {isActive && isPaused && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center pointer-events-auto">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm">
            <div className="text-center">
              <h3 className="font-bold text-xl text-[#2C5282] mb-2">Tutorial Paused</h3>
              <p className="text-gray-600 mb-4">Take your time! Your progress has been saved.</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={endTutorial}>
                  End Tour
                </Button>
                <Button onClick={resumeTutorial} className="bg-[#2C5282] hover:bg-[#2C5282]/90">
                  Resume
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