import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Info } from "lucide-react";

import { Alert, AlertDescription } from "../../local/components/ui/alert";
import { Button } from "../../local/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card";
import { useToast } from "../../local/hooks/use-toast";

import { VerificationWizard, CommunityInterviewTemplate } from "../components";

// Temporary solution - ideally exported from types file
interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  description: string;
  imageUrls: string[];
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

const logger = {
  error: (message: string, error?: unknown) => {
    if (process.env.NODE_ENV === "development") console.error(message, error);
  },
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === "development") console.log(message, data);
  },
};

type Step = "wizard" | "community" | "confirmation";

export default function NewVerificationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("propertyId");
  const { toast } = useToast(); // <-- Extracted toast function

  // State Management
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("wizard");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Property Loading Effect
  useEffect(() => {
    if (!propertyId) return;

    const loadPropertyData = async () => {
      try {
        const parsedPropertyId = Number(propertyId);

        if (isNaN(parsedPropertyId)) {
          toast({ variant: "destructive", title: "Error", description: "Invalid property ID provided" });
          return;
        }

        // Mock property data - replace with actual API call
        setSelectedProperty({
          id: parsedPropertyId,
          title: "Sample Property in Nairobi",
          location: "Westlands, Nairobi",
          price: 15000000,
          description: "Modern 3-bedroom apartment",
          imageUrls: [],
          ownerId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (error) {
        logger.error("Failed to load property data:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load property information" });
      }
    };

    loadPropertyData();
  }, [propertyId, toast]);

  // Handlers
  const handleWizardComplete = useCallback((newSessionId: string) => {
    try {
      setSessionId(newSessionId);
      setCurrentStep("confirmation");
    } catch (error) {
      logger.error("Error completing wizard:", error);
      toast({ variant: "destructive", title: "Error", description: "An error occurred while processing your request" });
    }
  }, [toast, setSessionId, setCurrentStep]);

  const handleWizardCancel = useCallback(() => {
    navigate("/land-verification");
  }, [navigate]);

  const handleFinalSubmit = async () => {
    if (!sessionId) {
      toast({ variant: "destructive", title: "Error", description: "No active verification session found." });
      return;
    }

    setIsSubmitting(true);

    try {
      // The wizard already created the session, just navigate to it
      toast({ title: "Success", description: "Verification session created successfully" });
      navigate(`/land-verification/sessions/${sessionId}`);
    } catch (error) {
      logger.error("Error creating verification session:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to create verification session" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderers
  const renderStepContent = () => {
    switch (currentStep) {
      case "wizard":
        return (
          <VerificationWizard
            propertyId={propertyId || ''}
            userId="current-user" // This should come from auth context
            onComplete={handleWizardComplete}
            onCancel={handleWizardCancel}
          />
        );

      case "community":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Community Interview Setup</h2>
                <p className="text-muted-foreground">Configure interview templates for community intelligence gathering</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep("wizard")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Wizard
                </Button>
                <Button onClick={() => setCurrentStep("confirmation")}>Continue to Review</Button>
              </div>
            </div>

            <CommunityInterviewTemplate
              sessionId={sessionId || ""} 
              location={selectedProperty?.location || ""}
              propertyType="residential"
              onTemplateComplete={(responses) => {
                toast({ title: "Success", description: "Community interview template completed" });
                setCurrentStep("confirmation");
              }}
            />
          </div>
        );

      case "confirmation":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Review &amp; Confirm</h2>
                <p className="text-muted-foreground">Review your verification request before submitting</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentStep("wizard")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Wizard
                </Button>
                <Button onClick={handleFinalSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Creating Session..." : "Create Verification Session"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedProperty ? (
                      <div className="space-y-2">
                        <h4 className="font-medium">{selectedProperty.title}</h4>
                        <p className="text-sm text-muted-foreground">{selectedProperty.location}</p>
                        <p className="text-sm">KES {selectedProperty.price.toLocaleString()}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No property selected</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Session Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessionId ? (
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-medium mb-2">Tracking ID</h5>
                          <p className="text-sm text-muted-foreground font-mono bg-muted inline-block px-2 py-1 rounded">
                            {sessionId}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No verification configuration generated</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Once submitted, your verification session will begin processing. You'll receive updates as each
                    verification layer completes.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">What Happens Next?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { title: "Session Created", desc: "Your verification session will be initialized" },
                      { title: "Verification Begins", desc: "Selected verification layers will start processing" },
                      { title: "Progress Updates", desc: "You'll receive notifications as work completes" },
                      { title: "Final Report", desc: "Comprehensive verification report delivered" },
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary">{idx + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{step.title}</p>
                          <p className="text-xs text-muted-foreground">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="container mx-auto px-4 py-8">{renderStepContent()}</div>;
}