import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FraudCheck {
  category: string;
  status: 'checking' | 'warning' | 'safe';
  details: string;
}

export default function FraudDetectionPage() {
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<FraudCheck[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setResults([]);
    
    // Simulate fraud detection process
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setProgress(i);
    }
    
    // Simulate results
    setResults([
      {
        category: "Document Authenticity",
        status: "safe",
        details: "All documents appear to be genuine and properly registered."
      },
      {
        category: "Ownership History",
        status: "safe",
        details: "Clean ownership history with proper transfer records."
      },
      {
        category: "Price Analysis",
        status: "warning",
        details: "Property price is 15% below market average for the area."
      },
      {
        category: "Legal Status",
        status: "safe",
        details: "No pending legal disputes or claims found."
      }
    ]);
    
    setIsChecking(false);
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
              <div>
                <Label htmlFor="propertyId">Property ID/Reference</Label>
                <Input 
                  id="propertyId" 
                  placeholder="Enter property ID or reference number"
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="sellerInfo">Seller Information</Label>
                <Input 
                  id="sellerInfo" 
                  placeholder="Enter seller's name or company"
                  required 
                />
              </div>
              
              <div>
                <Label htmlFor="price">Listed Price (KES)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="Enter property price"
                  required 
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <Search className="mr-2 h-4 w-4 animate-spin" />
                    Scanning for Fraud
                  </>
                ) : (
                  'Start Fraud Check'
                )}
              </Button>
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
