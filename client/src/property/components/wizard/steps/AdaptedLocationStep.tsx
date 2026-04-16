import React, { useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { Button } from '../../../../local/components/ui/button'
import { Input } from '../../../../local/components/ui/input'
import { Label } from '../../../../local/components/ui/label'
import { WizardStepProps } from '../types'

const COUNTIES = [
  { value: '', label: 'Select county' },
  { value: 'nairobi', label: 'Nairobi' },
  { value: 'kiambu', label: 'Kiambu' },
  { value: 'machakos', label: 'Machakos' },
  { value: 'kajiado', label: 'Kajiado' },
  { value: 'mombasa', label: 'Mombasa' },
  { value: 'nakuru', label: 'Nakuru' },
  { value: 'kisumu', label: 'Kisumu' }
];

export function AdaptedLocationStep({ data, onUpdate, onValidation }: WizardStepProps) {
  // Validate step whenever data changes
  useEffect(() => {
    const isValid = !!(data.location.address && data.location.city);
    onValidation?.(isValid);
  }, [data.location.address, data.location.city, onValidation]);

  const updateLocation = (updates: Partial<typeof data.location>) => {
    onUpdate({
      location: { ...data.location, ...updates }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="address">Street Address *</Label>
        <Input
          id="address"
          placeholder="e.g., 123 Westlands Avenue"
          value={data.location.address}
          onChange={(e) => updateLocation({ address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            placeholder="e.g., Nairobi"
            value={data.location.city}
            onChange={(e) => updateLocation({ city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="county">County *</Label>
          <select
            id="county"
            title="Select the county where your property is located"
            value={data.location.county || data.location.state}
            onChange={(e) => updateLocation({ 
              county: e.target.value,
              state: e.target.value // For compatibility
            })}
            className="w-full p-2 border border-input rounded-md bg-background"
          >
            {COUNTIES.map(county => (
              <option key={county.value} value={county.value}>
                {county.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Location on Map</h4>
        <div className="h-48 bg-background border rounded-lg flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Interactive map will be displayed here
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              Set Location on Map
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}