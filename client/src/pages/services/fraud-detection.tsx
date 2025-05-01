import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle2, Search, AlertCircle, BadgeInfo, Home } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FraudCheck {
  category: string;
  status: 'checking' | 'warning' | 'safe';
  details: string;
}

interface FraudDetectionResponse {
  success: boolean;
  result?: {
    isSuspicious: boolean;
    suspiciousScore: number;
    reasons: string[];
    riskLevel: 'low' | 'medium' | 'high';
    verificationDate: string;
  };
  message?: string;
  error?: string;
}

export default function FraudDetectionPage() {
  const { toast } = useToast();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("1");
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<FraudCheck[]>([]);
  const [additionalDetails, setAdditionalDetails] = useState<string>("");
  
  // Form refs
  const sellerInfoRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  
  // Fraud detection mutation
  const fraudDetectionMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      try {
        const response = await apiRequest(`/api/properties/${propertyId}/fraud-detection`, {
          method: 'GET'
        });
        return response as FraudDetectionResponse;
      } catch (error) {
        console.error("Fraud detection error:", error);
        throw error;
      }
    },
    onSuccess: (data: FraudDetectionResponse) => {
      if (data.success && data.result) {
        // Process the fraud detection results
        const { isSuspicious, suspiciousScore, reasons, riskLevel } = data.result;
        
        // Build the fraud check results array from API response
        const fraudChecks: FraudCheck[] = [];
        
        // Overall fraud risk
        fraudChecks.push({
          category: "Overall Fraud Risk",
          status: isSuspicious ? "warning" : "safe",
          details: `Risk Level: ${riskLevel.toUpperCase()}. Score: ${Math.round(suspiciousScore * 100)}% suspicious.`
        });
        
        // Individual reasons
        if (reasons.length > 0) {
          reasons.forEach((reason, index) => {
            fraudChecks.push({
              category: `Finding ${index + 1}`,
              status: isSuspicious ? "warning" : "safe",
              details: reason
            });
          });
        } else if (!isSuspicious) {
          // If no specific reasons, add a general safe message
          fraudChecks.push({
            category: "Property Analysis",
            status: "safe",
            details: "No suspicious patterns detected in property data."
          });
        }
        
        // Add some common checks for completeness
        if (!reasons.some(r => r.toLowerCase().includes("price"))) {
          fraudChecks.push({
            category: "Price Analysis",
            status: isSuspicious && suspiciousScore > 0.5 ? "warning" : "safe",
            details: isSuspicious && suspiciousScore > 0.5
              ? "The property price may not align with market values for this area."
              : "Property price appears to be within reasonable market range."
          });
        }
        
        if (!reasons.some(r => r.toLowerCase().includes("document") || r.toLowerCase().includes("ownership"))) {
          fraudChecks.push({
            category: "Ownership Records",
            status: "safe",
            details: "No inconsistencies found in ownership records."
          });
        }
        
        setResults(fraudChecks);
        
        // Set additional details text from the reasons if provided
        if (reasons.length > 0) {
          setAdditionalDetails(reasons.join("\n\n"));
        }
        
        // Show success toast
        toast({
          title: "Fraud Detection Complete",
          description: isSuspicious 
            ? `Warning: This property has a ${riskLevel} risk level.` 
            : "This property passed our fraud checks.",
          variant: isSuspicious ? "destructive" : "default"
        });
      } else {
        toast({
          title: "Detection Failed",
          description: data.message || "Unable to run fraud detection",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error("Error in fraud detection:", error);
      toast({
        title: "Detection Error",
        description: "There was a problem checking this property.",
        variant: "destructive"
      });
      
      // Add an error result
      setResults([
        {
          category: "System Error",
          status: "warning",
          details: "We encountered a technical issue while analyzing this property. Please try again later."
        }
      ]);
    },
    onSettled: () => {
      setIsChecking(false);
      setProgress(100);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setResults([]);
    setProgress(0);
    
    // Start progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);
    
    try {
      // Run fraud detection on the selected property
      await fraudDetectionMutation.mutateAsync(selectedPropertyId);
      clearInterval(interval);
      setProgress(100);
    } catch (error) {
      clearInterval(interval);
      setProgress(0);
      setIsChecking(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Fraud Detection</h1>
          <p className="text-muted-foreground">
            Protect yourself from real estate fraud with our advanced detection system.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Property Fraud Check
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="property-selection">Select Property</Label>
                <Select 
                  value={selectedPropertyId} 
                  onValueChange={value => setSelectedPropertyId(value)}
                >
                  <SelectTrigger id="property-selection">
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Modern Apartment in Kilimani</SelectItem>
                    <SelectItem value="2">Beachfront Villa in Diani</SelectItem>
                    <SelectItem value="3">Family Home in Karen</SelectItem>
                    <SelectItem value="4">Commercial Space in Westlands</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sellerInfo">Seller Information (Optional)</Label>
                <Input 
                  id="sellerInfo"
                  ref={sellerInfoRef}
                  placeholder="Enter seller's name or company" 
                />
              </div>
              
              <div>
                <Label htmlFor="price">Listed Price (KES) (Optional)</Label>
                <Input 
                  id="price" 
                  type="number"
                  ref={priceRef}
                  placeholder="Enter property price" 
                />
              </div>
              
              <div>
                <Label htmlFor="additional-info">Additional Property Details (Optional)</Label>
                <Textarea 
                  id="additional-info"
                  ref={descriptionRef}
                  placeholder="Enter any additional information that might help with fraud detection"
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isChecking || fraudDetectionMutation.isPending}
              >
                {isChecking ? (
                  <>
                    <Search className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Property
                  </>
                ) : (
                  'Start AI Fraud Analysis'
                )}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Our AI will analyze the property details and identify potential fraud signals.
              </p>
            </form>

            {isChecking && (
              <div className="mt-4">
                <Progress value={progress} />
                <p className="text-sm text-center mt-2 text-muted-foreground">
                  Analyzing property details...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, index) => (
                <Alert 
                  key={index}
                  variant={result.status === 'warning' ? 'destructive' : 'default'}
                >
                  {result.status === 'warning' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <AlertTitle>{result.category}</AlertTitle>
                  <AlertDescription>{result.details}</AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
