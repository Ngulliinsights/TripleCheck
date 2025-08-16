import React, { useEffect } from 'react';
import { Shield, Upload, FileText, CheckCircle } from 'lucide-react';
import { Button } from '../../../../shared/components/ui/button';
import { Label } from '../../../../shared/components/ui/label';
import { WizardStepProps } from '../types';

export function DocumentationStep({ data, onUpdate, onValidation }: WizardStepProps) {
  // Validate step - documentation is typically optional but can be required
  useEffect(() => {
    // For now, documentation step is always valid (optional)
    // Can be made required by changing this logic
    const isValid = true;
    onValidation?.(isValid);
  }, [data.titleDeed, data.surveyPlan, data.ownershipProof, onValidation]);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Document Verification</h4>
        <p className="text-sm text-blue-800">
          Upload the required documents to verify your property ownership and enable faster verification.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="titleDeed">Title Deed</Label>
          <div className="border border-input rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {data.titleDeed ? data.titleDeed.name : 'Upload title deed document'}
                </span>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="surveyPlan">Survey Plan</Label>
          <div className="border border-input rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {data.surveyPlan ? data.surveyPlan.name : 'Upload survey plan (optional)'}
                </span>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ownershipProof">Proof of Ownership</Label>
          <div className="border border-input rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="text-sm">
                  {data.ownershipProof ? data.ownershipProof.name : 'Additional ownership documents'}
                </span>
              </div>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-medium text-green-900 mb-2">Verification Benefits</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Faster property verification process</li>
          <li>• Higher trust score and credibility</li>
          <li>• Priority listing in search results</li>
          <li>• Access to premium features</li>
        </ul>
      </div>
    </div>
  );
}