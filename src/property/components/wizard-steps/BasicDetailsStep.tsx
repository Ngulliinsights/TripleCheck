import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Textarea } from '@shared/components/ui/textarea';
import React, { useEffect } from 'react';

import { PropertyFormData } from '../PropertyListingWizard';

interface BasicDetailsStepProps {
  data: PropertyFormData;
  onUpdate: (updates: Partial<PropertyFormData>) => void;
  onValidation: (isValid: boolean) => void;
}

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment', description: 'Multi-unit residential building' },
  { value: 'house', label: 'House', description: 'Single-family detached home' },
  { value: 'condo', label: 'Condominium', description: 'Privately owned unit in a complex' },
  { value: 'townhouse', label: 'Townhouse', description: 'Multi-story attached home' },
  { value: 'land', label: 'Land', description: 'Vacant or undeveloped property' }
];

export function BasicDetailsStep({ data, onUpdate, onValidation }: BasicDetailsStepProps) {
  // Validate step
  useEffect(() => {
    const isValid = !!(data.title && data.description && data.propertyType);
    onValidation(isValid);
  }, [data.title, data.description, data.propertyType, onValidation]);

  const handleInputChange = (field: keyof PropertyFormData, value: string) => {
    onUpdate({ [field]: value });
  };

  const handlePropertyTypeChange = (value: string) => {
    onUpdate({ propertyType: value as PropertyFormData['propertyType'] });
  };

  return (
    <div className="space-y-6">
      {/* Property Title */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Title</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Property Title *
              <span className="text-sm text-gray-500 ml-2">
                Create an attractive title that highlights key features
              </span>
            </Label>
            <Input
              id="title"
              value={data.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Modern 3BR Apartment with Garden View in Kileleshwa"
              className="text-lg"
              maxLength={100}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Make it descriptive and appealing to potential buyers/tenants</span>
              <span>{data.title.length}/100</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Property Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyType">
              Select Property Type *
            </Label>
            <Select value={data.propertyType} onValueChange={handlePropertyTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose property type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-sm text-gray-500">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Property Type Info */}
          {data.propertyType && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">
                  {PROPERTY_TYPES.find(t => t.value === data.propertyType)?.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                {PROPERTY_TYPES.find(t => t.value === data.propertyType)?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Property Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">
              Detailed Description *
              <span className="text-sm text-gray-500 ml-2">
                Provide comprehensive details about your property
              </span>
            </Label>
            <Textarea
              id="description"
              value={data.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your property in detail. Include information about the layout, condition, unique features, neighborhood, and any recent renovations or upgrades. Be honest and thorough to attract the right buyers/tenants."
              rows={8}
              maxLength={2000}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Include layout, condition, features, and neighborhood details</span>
              <span>{data.description.length}/2000</span>
            </div>
          </div>

          {/* Description Tips */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">💡 Description Tips</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Mention unique selling points and recent upgrades</li>
              <li>• Describe the neighborhood and nearby amenities</li>
              <li>• Include information about natural light and views</li>
              <li>• Be honest about the property condition</li>
              <li>• Highlight security features and parking availability</li>
            </ul>
          </div>
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
              <Badge variant={data.title ? 'default' : 'secondary'}>
                Title {data.title ? '✓' : '○'}
              </Badge>
              <Badge variant={data.propertyType ? 'default' : 'secondary'}>
                Type {data.propertyType ? '✓' : '○'}
              </Badge>
              <Badge variant={data.description ? 'default' : 'secondary'}>
                Description {data.description ? '✓' : '○'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}