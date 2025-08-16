import { Building, Car, Users, Zap, Wifi, Shield, MapPin, Calculator } from 'lucide-react';
import React, { useCallback } from 'react';

import type { CommercialFilters } from '../../../types/property';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

import { BasePropertyFiltersComponent } from './BasePropertyFilters';


interface CommercialFiltersProps {
  readonly filters: CommercialFilters;
  readonly onChange: (filters: CommercialFilters) => void;
  readonly onReset: () => void;
  readonly errors?: Record<string, string>;
}

const COMMERCIAL_TYPES = [
  { value: 'office', label: 'Office Space', icon: '🏢', description: 'Corporate offices and co-working' },
  { value: 'retail', label: 'Retail', icon: '🏪', description: 'Shops and shopping centers' },
  { value: 'warehouse', label: 'Warehouse', icon: '🏭', description: 'Storage and distribution' },
  { value: 'restaurant', label: 'Restaurant', icon: '🍽️', description: 'Food service establishments' },
  { value: 'hotel', label: 'Hotel', icon: '🏨', description: 'Hospitality and lodging' },
  { value: 'medical', label: 'Medical', icon: '🏥', description: 'Healthcare facilities' },
];

const FLOOR_RANGES = [
  { min: '', max: '1', label: 'Ground Floor Only' },
  { min: '1', max: '5', label: '1-5 Floors' },
  { min: '5', max: '10', label: '5-10 Floors' },
  { min: '10', max: '20', label: '10-20 Floors' },
  { min: '20', max: '', label: '20+ Floors' },
];

const AREA_RANGES = [
  { min: '', max: '100', label: 'Under 100 sqm' },
  { min: '100', max: '500', label: '100-500 sqm' },
  { min: '500', max: '1000', label: '500-1000 sqm' },
  { min: '1000', max: '5000', label: '1000-5000 sqm' },
  { min: '5000', max: '', label: '5000+ sqm' },
];

const BUSINESS_ZONES = [
  { value: 'cbd', label: 'CBD', description: 'Central Business District' },
  { value: 'westlands', label: 'Westlands', description: 'Commercial hub' },
  { value: 'upperhill', label: 'Upper Hill', description: 'Financial district' },
  { value: 'industrial', label: 'Industrial Area', description: 'Manufacturing zone' },
  { value: 'karen', label: 'Karen', description: 'Suburban commercial' },
  { value: 'kilimani', label: 'Kilimani', description: 'Mixed-use area' },
];

const ERROR_BORDER_CLASS = 'border-red-500';

/**
 * Commercial property filters component
 * Extends base filters with commercial-specific options
 */
function CommercialFiltersComponent({
  filters,
  onChange,
  onReset,
  errors = {},
}: CommercialFiltersProps): React.ReactElement {
  
  const updateFilter = useCallback(<K extends keyof CommercialFilters>(
    key: K,
    value: CommercialFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  }, [filters, onChange]);

  const setAreaRange = useCallback((min: string, max: string) => {
    updateFilter('areaMin', min);
    updateFilter('areaMax', max);
  }, [updateFilter]);

  const setFloorRange = useCallback((min: string, max: string) => {
    updateFilter('floorsMin', min);
    updateFilter('floorsMax', max);
  }, [updateFilter]);

  const toggleAmenity = useCallback((amenity: 'parking' | 'elevator' | 'airConditioning' | 'security' | 'wifi' | 'generator') => {
    updateFilter(amenity, !filters[amenity]);
  }, [filters, updateFilter]);

  return (
    <div className="space-y-6">
      {/* Base Filters */}
      <BasePropertyFiltersComponent
        filters={filters}
        onChange={(baseFilters) => onChange({ ...filters, ...baseFilters, category: "commercial" })}
        onReset={onReset}
        errors={errors}
      />

      {/* Commercial-Specific Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Commercial Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Commercial Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Commercial Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {COMMERCIAL_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={filters.commercialType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilter('commercialType', 
                    filters.commercialType === type.value ? '' : type.value
                  )}
                  className="flex flex-col items-center p-4 h-auto"
                >
                  <span className="text-2xl mb-1">{type.icon}</span>
                  <span className="font-medium text-sm">{type.label}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {type.description}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Business Zones */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Business Zones
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {BUSINESS_ZONES.map((zone) => (
                <Button
                  key={zone.value}
                  variant={filters.businessZone === zone.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilter('businessZone', 
                    filters.businessZone === zone.value ? '' : zone.value
                  )}
                  className="flex flex-col text-xs p-3"
                >
                  <span className="font-medium">{zone.label}</span>
                  <span className="text-muted-foreground">{zone.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Floor Area */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calculator className="w-4 h-4" />
              Floor Area (sqm)
            </Label>
            
            {/* Quick Area Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AREA_RANGES.map((range, index) => (
                <Button
                  key={index}
                  variant={filters.areaMin === range.min && filters.areaMax === range.max ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAreaRange(range.min, range.max)}
                  className="text-xs"
                >
                  {range.label}
                </Button>
              ))}
            </div>

            {/* Custom Area Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="area-min" className="text-sm text-muted-foreground">
                  Minimum Area (sqm)
                </Label>
                <Input
                  id="area-min"
                  type="text"
                  placeholder="0"
                  value={filters.areaMin}
                  onChange={(e) => updateFilter('areaMin', e.target.value)}
                  className={errors.areaMin ? ERROR_BORDER_CLASS : ''}
                />
                {errors.areaMin && (
                  <p className="text-sm text-red-600">{errors.areaMin}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="area-max" className="text-sm text-muted-foreground">
                  Maximum Area (sqm)
                </Label>
                <Input
                  id="area-max"
                  type="text"
                  placeholder="No limit"
                  value={filters.areaMax}
                  onChange={(e) => updateFilter('areaMax', e.target.value)}
                  className={errors.areaMax ? ERROR_BORDER_CLASS : ''}
                />
                {errors.areaMax && (
                  <p className="text-sm text-red-600">{errors.areaMax}</p>
                )}
              </div>
            </div>
          </div>

          {/* Number of Floors */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Number of Floors</Label>
            
            {/* Quick Floor Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {FLOOR_RANGES.map((range, index) => (
                <Button
                  key={index}
                  variant={filters.floorsMin === range.min && filters.floorsMax === range.max ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFloorRange(range.min, range.max)}
                  className="text-xs"
                >
                  {range.label}
                </Button>
              ))}
            </div>

            {/* Custom Floor Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="floors-min" className="text-sm text-muted-foreground">
                  Minimum Floors
                </Label>
                <Input
                  id="floors-min"
                  type="text"
                  placeholder="1"
                  value={filters.floorsMin}
                  onChange={(e) => updateFilter('floorsMin', e.target.value)}
                  className={errors.floorsMin ? ERROR_BORDER_CLASS : ''}
                />
                {errors.floorsMin && (
                  <p className="text-sm text-red-600">{errors.floorsMin}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="floors-max" className="text-sm text-muted-foreground">
                  Maximum Floors
                </Label>
                <Input
                  id="floors-max"
                  type="text"
                  placeholder="No limit"
                  value={filters.floorsMax}
                  onChange={(e) => updateFilter('floorsMax', e.target.value)}
                  className={errors.floorsMax ? ERROR_BORDER_CLASS : ''}
                />
                {errors.floorsMax && (
                  <p className="text-sm text-red-600">{errors.floorsMax}</p>
                )}
              </div>
            </div>
          </div>

          {/* Commercial Amenities */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Commercial Amenities</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Parking */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  id="parking"
                  type="checkbox"
                  checked={filters.parking}
                  onChange={() => toggleAmenity('parking')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Parking available"
                  title="Parking available"
                />
                <Label htmlFor="parking" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Car className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-medium">Parking</div>
                    <div className="text-xs text-muted-foreground">Dedicated parking spaces</div>
                  </div>
                </Label>
              </div>

              {/* Elevator */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  id="elevator"
                  type="checkbox"
                  checked={filters.elevator}
                  onChange={() => toggleAmenity('elevator')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Elevator available"
                  title="Elevator available"
                />
                <Label htmlFor="elevator" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Users className="w-4 h-4 text-gray-600" />
                  <div>
                    <div className="font-medium">Elevator</div>
                    <div className="text-xs text-muted-foreground">Lift access available</div>
                  </div>
                </Label>
              </div>

              {/* Air Conditioning */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  id="air-conditioning"
                  type="checkbox"
                  checked={filters.airConditioning}
                  onChange={() => toggleAmenity('airConditioning')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Air conditioning available"
                  title="Air conditioning available"
                />
                <Label htmlFor="air-conditioning" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Zap className="w-4 h-4 text-cyan-500" />
                  <div>
                    <div className="font-medium">A/C</div>
                    <div className="text-xs text-muted-foreground">Climate control</div>
                  </div>
                </Label>
              </div>

              {/* Security */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  id="security"
                  type="checkbox"
                  checked={filters.security}
                  onChange={() => toggleAmenity('security')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Security available"
                  title="Security available"
                />
                <Label htmlFor="security" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Shield className="w-4 h-4 text-red-500" />
                  <div>
                    <div className="font-medium">Security</div>
                    <div className="text-xs text-muted-foreground">24/7 security service</div>
                  </div>
                </Label>
              </div>

              {/* WiFi */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  id="wifi"
                  type="checkbox"
                  checked={filters.wifi}
                  onChange={() => toggleAmenity('wifi')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="WiFi available"
                  title="WiFi available"
                />
                <Label htmlFor="wifi" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wifi className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="font-medium">WiFi</div>
                    <div className="text-xs text-muted-foreground">High-speed internet</div>
                  </div>
                </Label>
              </div>

              {/* Generator */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  id="generator"
                  type="checkbox"
                  checked={filters.generator}
                  onChange={() => toggleAmenity('generator')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Generator available"
                  title="Generator available"
                />
                <Label htmlFor="generator" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div className="font-medium">Generator</div>
                    <div className="text-xs text-muted-foreground">Backup power supply</div>
                  </div>
                </Label>
              </div>
            </div>
          </div>

          {/* Quick Commercial Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Filters</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('commercialType', 'office');
                  updateFilter('businessZone', 'cbd');
                  updateFilter('parking', true);
                  updateFilter('elevator', true);
                  setAreaRange('100', '500');
                }}
                className="flex items-center gap-2 text-xs"
              >
                🏢 CBD Office
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('commercialType', 'retail');
                  updateFilter('parking', true);
                  updateFilter('security', true);
                  setAreaRange('50', '200');
                }}
                className="flex items-center gap-2 text-xs"
              >
                🏪 Retail Space
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('commercialType', 'warehouse');
                  updateFilter('businessZone', 'industrial');
                  setAreaRange('1000', '5000');
                }}
                className="flex items-center gap-2 text-xs"
              >
                🏭 Warehouse
              </Button>
            </div>
          </div>

          {/* Active Amenities Display */}
          {(filters.parking || filters.elevator || filters.airConditioning || 
            filters.security || filters.wifi || filters.generator) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Building className="w-4 h-4" />
                Selected Amenities
              </h4>
              <div className="flex flex-wrap gap-2">
                {filters.parking && (
                  <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    Parking
                  </Badge>
                )}
                {filters.elevator && (
                  <Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Elevator
                  </Badge>
                )}
                {filters.airConditioning && (
                  <Badge className="bg-cyan-100 text-cyan-800 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    A/C
                  </Badge>
                )}
                {filters.security && (
                  <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Security
                  </Badge>
                )}
                {filters.wifi && (
                  <Badge className="bg-purple-100 text-purple-800 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    WiFi
                  </Badge>
                )}
                {filters.generator && (
                  <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Generator
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Commercial Property Information */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Building className="w-4 h-4" />
              Commercial Property Features
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Business License Verified
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-3 h-3" />
                Parking Assessment
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                Accessibility Compliance
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Utility Infrastructure
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export as named and default for lazy loading
export { CommercialFiltersComponent as CommercialFilters };
export default CommercialFiltersComponent;