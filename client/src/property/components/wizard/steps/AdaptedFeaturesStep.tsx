import React, { useEffect, useCallback } from 'react'
import { DollarSign } from 'lucide-react'
import { Input } from '../../../../shared/components/ui/input'
import { Label } from '../../../../shared/components/ui/label'
import { WizardStepProps } from '../types'

const RESIDENTIAL_TYPES = ['apartment', 'house', 'villa', 'townhouse'];

const PROPERTY_FEATURES = [
  'Swimming Pool', 'Gym', 'Parking', 'Garden', 'Balcony',
  'Security', 'Generator', 'Water Supply', 'Internet', 'Furnished'
];

export function AdaptedFeaturesStep({ data, onUpdate, onValidation, propertyType }: WizardStepProps) {
  const isResidential = RESIDENTIAL_TYPES.includes(propertyType);

  // Validate step whenever data changes
  useEffect(() => {
    let isValid = data.area > 0 && data.price > 0;
    
    if (isResidential) {
      isValid = isValid && (data.bedrooms || 0) > 0 && (data.bathrooms || 0) > 0;
    }
    
    onValidation?.(isValid);
  }, [data.area, data.price, data.bedrooms, data.bathrooms, isResidential, onValidation]);

  // Handle feature changes
  const handleFeatureChange = useCallback((feature: string, checked: boolean) => {
    const currentFeatures = data.features || [];
    const currentAmenities = data.amenities || [];
    
    if (checked) {
      // Add to both arrays for compatibility
      onUpdate({
        features: [...currentFeatures.filter(f => f !== feature), feature],
        amenities: [...currentAmenities.filter(f => f !== feature), feature]
      });
    } else {
      // Remove from both arrays
      onUpdate({
        features: currentFeatures.filter(f => f !== feature),
        amenities: currentAmenities.filter(f => f !== feature)
      });
    }
  }, [data.features, data.amenities, onUpdate]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="price">Price (KSH) *</Label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="price"
            type="number"
            placeholder="e.g., 15000000"
            value={data.price || ''}
            onChange={(e) => onUpdate({ 
              price: Number(e.target.value) || 0
            })}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="area">Size/Area *</Label>
        <Input
          id="area"
          placeholder="e.g., 150 (sqm) or 2 (acres)"
          value={data.area || ''}
          onChange={(e) => {
            const value = e.target.value;
            const numericValue = parseFloat(value) || 0;
            onUpdate({ area: numericValue });
          }}
        />
      </div>

      {isResidential && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms *</Label>
            <Input
              id="bedrooms"
              type="number"
              placeholder="e.g., 3"
              value={data.bedrooms || ''}
              onChange={(e) => onUpdate({ bedrooms: Number(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bathrooms">Bathrooms *</Label>
            <Input
              id="bathrooms"
              type="number"
              placeholder="e.g., 2"
              value={data.bathrooms || ''}
              onChange={(e) => onUpdate({ bathrooms: Number(e.target.value) || 0 })}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Features & Amenities</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {PROPERTY_FEATURES.map((feature) => {
            const isChecked = (data.features || []).includes(feature) || (data.amenities || []).includes(feature);
            
            return (
              <label key={feature} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => handleFeatureChange(feature, e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{feature}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}