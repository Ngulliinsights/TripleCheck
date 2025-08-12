import React from 'react';

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import type { LandFilters as LandFiltersType } from '../../../types/property';

interface LandFiltersProps {
  filters: LandFiltersType;
  onFiltersChange: (filters: LandFiltersType) => void;
  className?: string;
}

/**
 * Land-specific property filters component
 * Provides filtering options specific to land properties
 */
export default function LandFilters({ 
  filters, 
  onFiltersChange, 
  className = "" 
}: LandFiltersProps): React.ReactElement {
  const handleFilterChange = <K extends keyof LandFiltersType>(
    key: K,
    value: LandFiltersType[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Land Type */}
        <div className="space-y-2">
          <Label htmlFor="landType">Land Type</Label>
          <select
            id="landType"
            value={filters.landType || ''}
            onChange={(e) => handleFilterChange('landType', e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="">All Types</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="agricultural">Agricultural</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>

        {/* Size Range */}
        <div className="space-y-2">
          <Label htmlFor="sizeMin">Min Size (acres)</Label>
          <Input
            id="sizeMin"
            type="text"
            placeholder="Min size"
            value={filters.sizeMin || ''}
            onChange={(e) => handleFilterChange('sizeMin', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sizeMax">Max Size (acres)</Label>
          <Input
            id="sizeMax"
            type="text"
            placeholder="Max size"
            value={filters.sizeMax || ''}
            onChange={(e) => handleFilterChange('sizeMax', e.target.value)}
          />
        </div>
      </div>

      {/* Access Options */}
      <div className="space-y-3">
        <Label>Access Requirements</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="waterAccess"
              checked={filters.waterAccess || false}
              onChange={(e) => handleFilterChange('waterAccess', e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="waterAccess" className="text-sm font-normal">
              Water Access
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="roadAccess"
              checked={filters.roadAccess || false}
              onChange={(e) => handleFilterChange('roadAccess', e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="roadAccess" className="text-sm font-normal">
              Road Access
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="electricityAccess"
              checked={filters.electricityAccess || false}
              onChange={(e) => handleFilterChange('electricityAccess', e.target.checked)}
              className="rounded border-input"
            />
            <Label htmlFor="electricityAccess" className="text-sm font-normal">
              Electricity Access
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}