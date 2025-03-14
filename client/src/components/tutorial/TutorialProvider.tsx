import { createContext, useContext, useState, useEffect } from 'react';
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
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  prevStep: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TripleCheck!',
    description: 'Let us show you around our platform and help you get started with property verification.',
    element: '.tutorial-welcome'
  },
  {
    id: 'search',
    title: 'Property Search',
    description: 'Start by searching for a property using our advanced search features.',
    element: '.search-bar',
    placement: 'bottom'
  },
  {
    id: 'verification',
    title: 'Property Verification',
    description: 'Check property authenticity and ownership details here.',
    element: '.verify-property',
    placement: 'right'
  },
  {
    id: 'trust-score',
    title: 'Trust Score',
    description: 'View the property and seller trust scores to make informed decisions.',
    element: '.trust-score',
    placement: 'left'
  }
];

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [location] = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial && location === '/') {
      setShowWelcome(true);
    }
  }, [location]);

  const startTutorial = () => {
    setIsActive(true);
    setCurrentStep(0);
    setShowWelcome(false);
  };

  const endTutorial = () => {
    setIsActive(false);
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      endTutorial();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        startTutorial,
        endTutorial,
        nextStep,
        prevStep
      }}
    >
      {children}

      {/* Welcome Dialog */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Welcome to TripleCheck!</DialogTitle>
            <DialogDescription>
              Would you like a quick tour of our platform? We'll show you how to verify properties,
              check trust scores, and use our advanced features.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWelcome(false)}>
              Maybe Later
            </Button>
            <Button onClick={startTutorial}>Start Tour</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tutorial Tooltips */}
      {isActive && currentTutorialStep && (
        <TooltipProvider>
          <Tooltip open={true}>
            <TooltipTrigger asChild>
              <div
                className="fixed inset-0 bg-black/50 pointer-events-none"
                style={{
                  maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='100%' height='100%' fill='black'%3E%3C/rect%3E%3Crect x='${currentTutorialStep.element}' y='${currentTutorialStep.element}' width='100' height='100' fill='white'%3E%3C/rect%3E%3C/svg%3E")`,
                  WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='100%' height='100%' fill='black'%3E%3C/rect%3E%3Crect x='${currentTutorialStep.element}' y='${currentTutorialStep.element}' width='100' height='100' fill='white'%3E%3C/rect%3E%3C/svg%3E")`
                }}
              />
            </TooltipTrigger>
            <TooltipContent
              side={currentTutorialStep.placement || 'top'}
              className="p-4 max-w-sm"
            >
              <h3 className="font-semibold mb-2">{currentTutorialStep.title}</h3>
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
                <span className="text-sm text-muted-foreground">
                  {currentStep + 1} of {tutorialSteps.length}
                </span>
                <Button
                  size="sm"
                  onClick={nextStep}
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
