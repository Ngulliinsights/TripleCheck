import React from 'react';

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import type { BasePropertyFilters } from '../../../types/property';

interface AllPropertiesFiltersProps {
  filters: BasePropertyFilters;
  onFiltersChange: (filters: BasePropertyFilters) => void;
  className?: string;
}

/**
 * Generic property filters component for all property types
 * Provides basic filtering options that apply to all property categories
 */
export default function AllPropertiesFilters({ 
  filters, 
  onFiltersChange, 
  className = "" 
}: AllPropertiesFiltersProps): React.ReactElement {
  const handleFilterChange = <K extends keyof BasePropertyFilters>(
    key: K,
    value: BasePropertyFilters[K]
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Property Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value as any)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background"
          >
            <option value="">All Categories</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="land">Land</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="space-y-2">
          <Label htmlFor="priceMin">Min Price (KES)</Label>
          <Input
            id="priceMin"
            type="number"
            placeholder="Min price"
            value={filters.priceMin || ''}
            onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="priceMax">Max Price (KES)</Label>
          <Input
            id="priceMax"
            type="number"
            placeholder="Max price"
            value={filters.priceMax || ''}
            onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : null)}
          />
        </div>

        {/* Verification Status */}
        <div className="flex items-center space-x-2 pt-6">
          <input
            type="checkbox"
            id="verified"
            checked={filters.verified || false}
            onChange={(e) => handleFilterChange('verified', e.target.checked)}
            className="rounded border-input"
          />
          <Label htmlFor="verified" className="text-sm font-normal">
            Verified Properties Only
          </Label>
        </div>
      </div>
    </div>
  );
}