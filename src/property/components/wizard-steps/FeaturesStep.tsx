import React, { useEffect, useState } from 'react';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Checkbox } from '@shared/components/ui/checkbox';
import { Textarea } from '@shared/components/ui/textarea';
import { PropertyFormData } from '../PropertyListingWizard';
import { 
  Bed, 
  Bath, 
  Square, 
  Plus, 
  X, 
  Wifi, 
  Car, 
  Shield, 
  Waves,
  Dumbbell,
  Trees,
  Zap,
  Wind
} from 'lucide-react';

interface FeaturesStepProps {
  data: PropertyFormData;
  onUpdate: (updates: Partial<PropertyFormData>) => void;
  onValidation: (isValid: boolean) => void;
}

const STANDARD_AMENITIES = [
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'security', label: '24/7 Security', icon: Shield },
  { id: 'wifi', label: 'WiFi/Internet', icon: Wifi },
  { id: 'pool', label: 'Swimming Pool', icon: Waves },
  { id: 'gym', label: 'Gym/Fitness Center', icon: Dumbbell },
  { id: 'garden', label: 'Garden/Landscaping', icon: Trees },
  { id: 'generator', label: 'Backup Generator', icon: Zap },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
  { id: 'balcony', label: 'Balcony/Terrace', icon: Square },
  { id: 'elevator', label: 'Elevator', icon: Square },
  { id: 'laundry', label: 'Laundry Facilities', icon: Square },
  { id: 'storage', label: 'Storage Space', icon: Square }
];

export function FeaturesStep({ data, onUpdate, onValidation }: FeaturesStepProps) {
  const [customFeature, setCustomFeature] = useState('');

  // Validate step
  useEffect(() => {
    const isValid = data.bedrooms > 0 && data.bathrooms > 0 && data.area > 0;
    onValidation(isValid);
  }, [data.bedrooms, data.bathrooms, data.area, onValidation]);

  const handleNumberChange = (field: keyof PropertyFormData, value: string) => {
    const numValue = parseInt(value) || 0;
    onUpdate({ [field]: Math.max(0, numValue) });
  };

  const handleAmenityToggle = (amenityId: string, checked: boolean) => {
    const currentAmenities = data.amenities || [];
    const updatedAmenities = checked
      ? [...currentAmenities, amenityId]
      : currentAmenities.filter(id => id !== amenityId);
    
    onUpdate({ amenities: updatedAmenities });
  };

  const addCustomFeature = () => {
    if (!customFeature.trim()) return;
    
    const currentFeatures = data.customFeatures || [];
    const updatedFeatures = [...currentFeatures, customFeature.trim()];
    
    onUpdate({ customFeatures: updatedFeatures });
    setCustomFeature('');
  };

  const removeCustomFeature = (index: number) => {
    const currentFeatures = data.customFeatures || [];
    const updatedFeatures = currentFeatures.filter((_, i) => i !== index);
    
    onUpdate({ customFeatures: updatedFeatures });
  };

  return (
    <div className="space-y-6">
      {/* Basic Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Property Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bedrooms, Bathrooms, Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bedrooms" className="flex items-center gap-2">
                <Bed className="h-4 w-4" />
                Bedrooms *
              </Label>
              <Input
                id="bedrooms"
                type="number"
                min="0"
                max="20"
                value={data.bedrooms}
                onChange={(e) => handleNumberChange('bedrooms', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">Number of bedrooms</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bathrooms" className="flex items-center gap-2">
                <Bath className="h-4 w-4" />
                Bathrooms *
              </Label>
              <Input
                id="bathrooms"
                type="number"
                min="0"
                max="20"
                value={data.bathrooms}
                onChange={(e) => handleNumberChange('bathrooms', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">Number of bathrooms</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area" className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Area (sq ft) *
              </Label>
              <Input
                id="area"
                type="number"
                min="0"
                value={data.area}
                onChange={(e) => handleNumberChange('area', e.target.value)}
                placeholder="0"
              />
              <p className="text-xs text-gray-500">Total floor area</p>
            </div>
          </div>

          {/* Feature Summary */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Property Summary</h4>
            <div className="flex flex-wrap gap-2">
              {data.bedrooms > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Bed className="h-3 w-3" />
                  {data.bedrooms} Bedroom{data.bedrooms !== 1 ? 's' : ''}
                </Badge>
              )}
              {data.bathrooms > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Bath className="h-3 w-3" />
                  {data.bathrooms} Bathroom{data.bathrooms !== 1 ? 's' : ''}
                </Badge>
              )}
              {data.area > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Square className="h-3 w-3" />
                  {data.area.toLocaleString()} sq ft
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Amenities</CardTitle>
          <p className="text-sm text-gray-600">
            Select all amenities available at your property
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STANDARD_AMENITIES.map((amenity) => {
              const Icon = amenity.icon;
              const isSelected = data.amenities?.includes(amenity.id) || false;
              
              return (
                <div
                  key={amenity.id}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors
                    ${isSelected 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => handleAmenityToggle(amenity.id, !isSelected)}
                >
                  <Checkbox
                    checked={isSelected}
                    onChange={(e) => handleAmenityToggle(amenity.id, (e.target as HTMLInputElement).checked)}
                  />
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className={`text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-700'}`}>
                    {amenity.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected Amenities Summary */}
          {data.amenities && data.amenities.length > 0 && (
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">
                Selected Amenities ({data.amenities.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.amenities.map((amenityId) => {
                  const amenity = STANDARD_AMENITIES.find(a => a.id === amenityId);
                  if (!amenity) return null;
                  
                  const Icon = amenity.icon;
                  return (
                    <Badge key={amenityId} variant="secondary" className="flex items-center gap-1">
                      <Icon className="h-3 w-3" />
                      {amenity.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Custom Features</CardTitle>
          <p className="text-sm text-gray-600">
            Add any unique features not listed above
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Custom Feature */}
          <div className="flex gap-2">
            <Input
              value={customFeature}
              onChange={(e) => setCustomFeature(e.target.value)}
              placeholder="e.g., Rooftop terrace, Wine cellar, Home office"
              onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
            />
            <Button
              type="button"
              onClick={addCustomFeature}
              disabled={!customFeature.trim()}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          {/* Custom Features List */}
          {data.customFeatures && data.customFeatures.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Custom Features:</h4>
              <div className="space-y-2">
                {data.customFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="text-sm">{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomFeature(index)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features Tips */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">🏠 Features Tips</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Be accurate with bedroom and bathroom counts</li>
            <li>• Include the total floor area, not just living space</li>
            <li>• Select all available amenities to attract more interest</li>
            <li>• Add unique features that make your property stand out</li>
            <li>• Consider mentioning recent upgrades or renovations</li>
          </ul>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Step Completion</h4>
              <p className="text-sm text-gray-600">
                Complete all required fields to proceed
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={data.bedrooms > 0 ? 'default' : 'secondary'}>
                Bedrooms {data.bedrooms > 0 ? '✓' : '○'}
              </Badge>
              <Badge variant={data.bathrooms > 0 ? 'default' : 'secondary'}>
                Bathrooms {data.bathrooms > 0 ? '✓' : '○'}
              </Badge>
              <Badge variant={data.area > 0 ? 'default' : 'secondary'}>
                Area {data.area > 0 ? '✓' : '○'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}