import React from 'react';
import { UnifiedPropertyWizard } from '../components/wizard';
import { enhancedWizardConfig } from '../components/wizard/config';

export default function PropertyWizard() {
  return (
    <UnifiedPropertyWizard 
      config={enhancedWizardConfig}
    />
  );
}