import { Search, MapPin, DollarSign, Shield, X } from 'lucide-react'
import React, { useCallback } from 'react'

import type { BasePropertyFilters } from '@shared/types/property'

const HOVER_BG_TRANSPARENT = 'hover:bg-transparent';
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Card, CardContent } from '../../ui/card'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'

interface BasePropertyFiltersProps {
  readonly filters: BasePropertyFilters;
  readonly onChange: (filters: BasePropertyFilters) => void;
  readonly onReset: () => void;
  readonly errors?: Record<string, string>;
  readonly className?: string;
}

/**
 * Base property filters component
 * Provides common filtering functionality shared across all property types
 */
export function BasePropertyFiltersComponent({
  filters,
  onChange,
  onReset,
  errors = {},
  className = '',
}: BasePropertyFiltersProps): React.ReactElement {
  
  const updateFilter = useCallback(<K extends keyof BasePropertyFilters>(
    key: K,
    value: BasePropertyFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  }, [filters, onChange]);

  const clearFilter = useCallback(<K extends keyof BasePropertyFilters>(key: K) => {
    const defaultValues = {
      query: '',
      location: '',
      priceMin: null,
      priceMax: null,
      verified: false,
      category: null,
    } as const;
    
    updateFilter(key, defaultValues[key] as BasePropertyFilters[K]);
  }, [updateFilter]);

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'query' || key === 'location') return value !== '';
    if (key === 'priceMin' || key === 'priceMax') return value !== null;
    if (key === 'verified') return value === true;
    if (key === 'category') return value !== null;
    return false;
  });

  return (
    <Card className={`${className}`}>
      <CardContent className="p-6 space-y-6">
        {/* Search and Location Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search Query */}
          <div className="space-y-2">
            <Label htmlFor="search-query" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Properties
            </Label>
            <div className="relative">
              <Input
                id="search-query"
                type="text"
                placeholder="Search by title, description..."
                value={filters.query}
                onChange={(e) => updateFilter('query', e.target.value)}
                className={errors.query ? 'border-red-500' : ''}
              />
              {filters.query && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => clearFilter('query')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            {errors.query && (
              <p className="text-sm text-red-600">{errors.query}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <div className="relative">
              <Input
                id="location"
                type="text"
                placeholder="City, area, or region..."
                value={filters.location}
                onChange={(e) => updateFilter('location', e.target.value)}
                className={errors.location ? 'border-red-500' : ''}
              />
              {filters.location && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => clearFilter('location')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            {errors.location && (
              <p className="text-sm text-red-600">{errors.location}</p>
            )}
          </div>
        </div>

        {/* Price Range Row */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Price Range (KES)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="price-min" className="text-sm text-muted-foreground">
                Minimum Price
              </Label>
              <Input
                id="price-min"
                type="number"
                placeholder="0"
                value={filters.priceMin || ''}
                onChange={(e) => {
                  const {value} = e.target;
                  updateFilter('priceMin', value ? parseInt(value, 10) : null);
                }}
                className={errors.priceMin ? 'border-red-500' : ''}
              />
              {errors.priceMin && (
                <p className="text-sm text-red-600">{errors.priceMin}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="price-max" className="text-sm text-muted-foreground">
                Maximum Price
              </Label>
              <Input
                id="price-max"
                type="number"
                placeholder="No limit"
                value={filters.priceMax || ''}
                onChange={(e) => {
                  const {value} = e.target;
                  updateFilter('priceMax', value ? parseInt(value, 10) : null);
                }}
                className={errors.priceMax ? 'border-red-500' : ''}
              />
              {errors.priceMax && (
                <p className="text-sm text-red-600">{errors.priceMax}</p>
              )}
            </div>
          </div>
        </div>

        {/* Verification Filter */}
        <div className="flex items-center space-x-2">
          <input
            id="verified-only"
            type="checkbox"
            checked={filters.verified}
            onChange={(e) => updateFilter('verified', e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
            aria-label="Show only verified properties"
            title="Show only verified properties"
          />
          <Label htmlFor="verified-only" className="flex items-center gap-2 cursor-pointer">
            <Shield className="w-4 h-4" />
            Show only verified properties
          </Label>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters:</Label>
            <div className="flex flex-wrap gap-2">
              {filters.query && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: &ldquo;{filters.query}&rdquo;
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-4 w-4 p-0 ${HOVER_BG_TRANSPARENT}`}
                    onClick={() => clearFilter('query')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {filters.location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Location: &ldquo;{filters.location}&rdquo;
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-4 w-4 p-0 ${HOVER_BG_TRANSPARENT}`}
                    onClick={() => clearFilter('location')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {(filters.priceMin !== null || filters.priceMax !== null) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Price: {filters.priceMin ? `KES ${filters.priceMin.toLocaleString()}` : '0'} - {filters.priceMax ? `KES ${filters.priceMax.toLocaleString()}` : '∞'}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-4 w-4 p-0 ${HOVER_BG_TRANSPARENT}`}
                    onClick={() => {
                      updateFilter('priceMin', null);
                      updateFilter('priceMax', null);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
              {filters.verified && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Verified Only
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-4 w-4 p-0 ${HOVER_BG_TRANSPARENT}`}
                    onClick={() => clearFilter('verified')}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Reset Button */}
        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onReset} size="sm">
              Clear All Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export as default for lazy loading
export default BasePropertyFiltersComponent;