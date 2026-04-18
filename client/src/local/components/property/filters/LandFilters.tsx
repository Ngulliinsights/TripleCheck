import { TreePine, Ruler, Droplets, Car, Zap } from 'lucide-react'
import React, { useCallback } from 'react'

import type { LandFilters as LandFiltersType } from '@shared/types/property'
import { Button } from '../../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'

import { BasePropertyFiltersComponent } from './BasePropertyFilters'

interface LandFiltersProps {
  readonly filters: LandFiltersType;
  readonly onChange: (filters: LandFiltersType) => void;
  readonly onReset: () => void;
  readonly errors?: Record<string, string>;
  readonly className?: string;
}

const LAND_TYPES = [
  { value: 'residential', label: 'Residential', icon: '🏠', description: 'For housing development' },
  { value: 'commercial', label: 'Commercial', icon: '🏢', description: 'For business use' },
  { value: 'agricultural', label: 'Agricultural', icon: '🌾', description: 'For farming' },
  { value: 'industrial', label: 'Industrial', icon: '🏭', description: 'For manufacturing' },
];

const SIZE_RANGES = [
  { min: '', max: '1', label: 'Under 1 acre' },
  { min: '1', max: '5', label: '1-5 acres' },
  { min: '5', max: '10', label: '5-10 acres' },
  { min: '10', max: '50', label: '10-50 acres' },
  { min: '50', max: '', label: '50+ acres' },
];

/**
 * Land-specific property filters component
 * Extends BasePropertyFilters with land-specific options
 */
export default function LandFilters({ 
  filters, 
  onChange, 
  onReset,
  errors = {},
  className = "" 
}: LandFiltersProps): React.ReactElement {
  const updateFilter = useCallback(<K extends keyof LandFiltersType>(
    key: K,
    value: LandFiltersType[K]
  ) => {
    onChange({ ...filters, [key]: value });
  }, [filters, onChange]);

  const setSizeRange = useCallback((min: string, max: string) => {
    updateFilter('sizeMin', min);
    updateFilter('sizeMax', max);
  }, [updateFilter]);

  const toggleAccess = useCallback((accessType: 'waterAccess' | 'roadAccess' | 'electricityAccess') => {
    updateFilter(accessType, !filters[accessType]);
  }, [filters, updateFilter]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Base Filters */}
      <BasePropertyFiltersComponent
        filters={filters}
        onChange={(baseFilters) => onChange({ ...filters, ...baseFilters, category: "land" })}
        onReset={onReset}
        errors={errors}
      />

      {/* Land-Specific Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="w-5 h-5" />
            Land Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Land Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Land Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {LAND_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant={filters.landType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateFilter('landType', 
                    filters.landType === type.value ? '' : type.value
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

          {/* Land Size */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Land Size (acres)
            </Label>
            
            {/* Quick Size Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {SIZE_RANGES.map((range, index) => (
                <Button
                  key={index}
                  variant={filters.sizeMin === range.min && filters.sizeMax === range.max ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSizeRange(range.min, range.max)}
                  className="text-xs"
                >
                  {range.label}
                </Button>
              ))}
            </div>

            {/* Custom Size Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="sizeMin" className="text-sm text-muted-foreground">
                  Minimum Size (acres)
                </Label>
                <Input
                  id="sizeMin"
                  type="text"
                  placeholder="0"
                  value={filters.sizeMin || ''}
                  onChange={(e) => updateFilter('sizeMin', e.target.value)}
                  className={errors.sizeMin ? 'border-red-500' : ''}
                />
                {errors.sizeMin && (
                  <p className="text-sm text-red-600">{errors.sizeMin}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="sizeMax" className="text-sm text-muted-foreground">
                  Maximum Size (acres)
                </Label>
                <Input
                  id="sizeMax"
                  type="text"
                  placeholder="No limit"
                  value={filters.sizeMax || ''}
                  onChange={(e) => updateFilter('sizeMax', e.target.value)}
                  className={errors.sizeMax ? 'border-red-500' : ''}
                />
                {errors.sizeMax && (
                  <p className="text-sm text-red-600">{errors.sizeMax}</p>
                )}
              </div>
            </div>
          </div>

          {/* Access Requirements */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Access Requirements</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Water Access */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  id="waterAccess"
                  type="checkbox"
                  checked={filters.waterAccess || false}
                  onChange={() => toggleAccess('waterAccess')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Water access available"
                  title="Water access available"
                />
                <Label htmlFor="waterAccess" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-medium">Water Access</div>
                    <div className="text-xs text-muted-foreground">Municipal or borehole water</div>
                  </div>
                </Label>
              </div>

              {/* Road Access */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  id="roadAccess"
                  type="checkbox"
                  checked={filters.roadAccess || false}
                  onChange={() => toggleAccess('roadAccess')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Road access available"
                  title="Road access available"
                />
                <Label htmlFor="roadAccess" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Car className="w-4 h-4 text-gray-600" />
                  <div>
                    <div className="font-medium">Road Access</div>
                    <div className="text-xs text-muted-foreground">All-weather road access</div>
                  </div>
                </Label>
              </div>

              {/* Electricity Access */}
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  id="electricityAccess"
                  type="checkbox"
                  checked={filters.electricityAccess || false}
                  onChange={() => toggleAccess('electricityAccess')}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                  aria-label="Electricity access available"
                  title="Electricity access available"
                />
                <Label htmlFor="electricityAccess" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <div>
                    <div className="font-medium">Electricity</div>
                    <div className="text-xs text-muted-foreground">Grid connection available</div>
                  </div>
                </Label>
              </div>
            </div>
          </div>

          {/* Quick Land Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Filters</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('landType', 'residential');
                  setSizeRange('', '5');
                  updateFilter('waterAccess', true);
                  updateFilter('roadAccess', true);
                }}
                className="flex items-center gap-2 text-xs"
              >
                🏠 Residential Plot
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('landType', 'agricultural');
                  setSizeRange('5', '50');
                  updateFilter('waterAccess', true);
                }}
                className="flex items-center gap-2 text-xs"
              >
                🌾 Farm Land
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('landType', 'commercial');
                  setSizeRange('1', '10');
                  updateFilter('roadAccess', true);
                  updateFilter('electricityAccess', true);
                }}
                className="flex items-center gap-2 text-xs"
              >
                🏢 Commercial Plot
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}