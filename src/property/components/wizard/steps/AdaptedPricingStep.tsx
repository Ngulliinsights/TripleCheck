import React, { useEffect } from 'react';
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { Input } from '../../../../shared/components/ui/input';
import { Label } from '../../../../shared/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/card';
import { WizardStepProps } from '../types';

export function AdaptedPricingStep({ data, onUpdate, onValidation }: WizardStepProps) {
  // Validate step whenever data changes
  useEffect(() => {
    const isValid = data.price > 0;
    onValidation?.(isValid);
  }, [data.price, onValidation]);

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
            onChange={(e) => onUpdate({ price: Number(e.target.value) || 0 })}
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priceType">Listing Type</Label>
        <select
          id="priceType"
          value={data.priceType}
          onChange={(e) => onUpdate({ priceType: e.target.value as 'sale' | 'rent' })}
          className="w-full p-2 border border-input rounded-md bg-background"
        >
          <option value="sale">For Sale</option>
          <option value="rent">For Rent</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              Market Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Average price in this area: KSH 12,500,000
              </p>
              <p className="text-sm text-muted-foreground">
                Price per sqm: KSH 83,333
              </p>
              <p className="text-sm text-green-600">
                Your price is competitive ✓
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5" />
              Pricing Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Research similar properties in your area</li>
              <li>• Consider recent market trends</li>
              <li>• Factor in unique property features</li>
              <li>• Be open to reasonable negotiations</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Pricing Strategy</h4>
        <p className="text-sm text-blue-800">
          Based on your property details and market data, your pricing appears to be in line with similar properties. 
          Consider highlighting unique features to justify premium pricing.
        </p>
      </div>
    </div>
  );
}