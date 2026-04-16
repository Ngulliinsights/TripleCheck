import React from 'react'
import { UnifiedPropertyWizard, UnifiedPropertyFormData } from "./wizard"
import { modernWizardConfig } from "./wizard/config"

// Re-export as a type alias (not an empty interface extension) for backward compatibility
export type PropertyFormData = UnifiedPropertyFormData;

interface PropertyListingWizardProps {
  initialData?: Partial<UnifiedPropertyFormData>;
  onSave?: (data: UnifiedPropertyFormData) => void;
  onPublish?: (data: UnifiedPropertyFormData) => void;
  onCancel?: () => void;
}

export function PropertyListingWizard({
  initialData,
  onSave,
  onPublish,
  onCancel,
}: PropertyListingWizardProps) {
  return (
    <UnifiedPropertyWizard
      config={modernWizardConfig}
      initialData={initialData}
      onSave={onSave}
      onPublish={onPublish}
      onCancel={onCancel}
    />
  );
}