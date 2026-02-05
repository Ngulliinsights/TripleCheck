import React, { useEffect } from 'react'
import { Input } from '../../../../shared/components/ui/input'
import { Label } from '../../../../shared/components/ui/label'
import { Textarea } from '../../../../shared/components/ui/textarea'
import { WizardStepProps } from '../types'

const PROPERTY_TYPES = [
  { value: '', label: 'Select property type' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' }
];

export function AdaptedBasicDetailsStep({ data, onUpdate, onValidation }: WizardStepProps) {
  // Validate step whenever data changes
  useEffect(() => {
    const isValid = !!(data.title && data.description && data.propertyType);
    onValidation?.(isValid);
  }, [data.title, data.description, data.propertyType, onValidation]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Property Title *</Label>
        <Input
          id="title"
          placeholder="e.g., Modern 3-Bedroom Apartment in Westlands"
          value={data.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          placeholder="Describe your property in detail..."
          rows={4}
          value={data.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="propertyType">Property Type *</Label>
        <select
          id="propertyType"
          title="Select the type of property you are listing"
          value={data.propertyType}
          onChange={(e) => onUpdate({ propertyType: e.target.value as any })}
          className="w-full p-2 border border-input rounded-md bg-background"
        >
          {PROPERTY_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}