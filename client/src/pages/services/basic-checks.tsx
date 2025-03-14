import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertTriangle, Shield } from "lucide-react";

export default function BasicChecksPage() {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'complete'>('idle');
  const [results, setResults] = useState<{
    propertyExists: boolean;
    ownershipVerified: boolean;
    riskLevel: 'low' | 'medium' | 'high';
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationStatus('checking');
    
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setResults({
      propertyExists: true,
      ownershipVerified: true,
      riskLevel: 'low'
    });
    setVerificationStatus('complete');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Basic Property Checks</h1>
          <p className="text-muted-foreground">
            Verify basic property information and ownership details quickly and securely.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Verification Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="propertyId">Property ID/Title Number</Label>
                <Input id="propertyId" placeholder="Enter property ID or title number" required />
              </div>
              
              <div>
                <Label htmlFor="location">Property Location</Label>
                <Input id="location" placeholder="Enter full property address" required />
              </div>
              
              <div>
                <Label htmlFor="ownerDetails">Current Owner Details</Label>
                <Input id="ownerDetails" placeholder="Enter owner's name" required />
              </div>
              
              <div>
                <Label htmlFor="additionalInfo">Additional Information</Label>
                <Textarea 
                  id="additionalInfo" 
                  placeholder="Any additional details that might help with verification"
                  className="h-24"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={verificationStatus === 'checking'}
              >
                {verificationStatus === 'checking' ? 'Verifying...' : 'Start Verification'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {verificationStatus === 'complete' && results && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#2C5282]" />
                Verification Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {results.propertyExists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <span>Property Registration Status: {results.propertyExists ? 'Verified' : 'Not Found'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {results.ownershipVerified ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                )}
                <span>Ownership Status: {results.ownershipVerified ? 'Verified' : 'Unverified'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Shield className={`h-5 w-5 ${
                  results.riskLevel === 'low' ? 'text-green-500' :
                  results.riskLevel === 'medium' ? 'text-yellow-500' :
                  'text-red-500'
                }`} />
                <span>Risk Level: {results.riskLevel.charAt(0).toUpperCase() + results.riskLevel.slice(1)}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
