import { Building2, Home, TreePine, Store } from "lucide-react"
import React, { useCallback } from "react"

import type { BasePropertyFilters } from "../../../types/property"
import { Button } from "../../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Label } from "../../ui/label"

import { BasePropertyFiltersComponent } from "./BasePropertyFilters"

interface AllPropertiesFiltersProps {
  readonly filters: BasePropertyFilters;
  readonly onChange: (filters: BasePropertyFilters) => void;
  readonly onReset: () => void;
  readonly errors?: Record<string, string>;
  readonly className?: string;
}

const PROPERTY_CATEGORIES = [
  { value: 'residential', label: 'Residential', icon: Home, description: 'Houses, apartments, condos' },
  { value: 'commercial', label: 'Commercial', icon: Building2, description: 'Offices, retail, warehouses' },
  { value: 'land', label: 'Land', icon: TreePine, description: 'Plots, farms, development land' },
];

/**
 * Generic property filters component for all property types
 * Uses BasePropertyFilters with additional category selection
 */
export default function AllPropertiesFilters({
  filters,
  onChange,
  onReset,
  errors = {},
  className = "",
}: AllPropertiesFiltersProps): React.ReactElement {
  const updateFilter = useCallback(<K extends keyof BasePropertyFilters>(
    key: K,
    value: BasePropertyFilters[K]
  ) => {
    onChange({ ...filters, [key]: value });
  }, [filters, onChange]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Base Filters */}
      <BasePropertyFiltersComponent
        filters={filters}
        onChange={onChange}
        onReset={onReset}
        errors={errors}
      />

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Property Category
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Property Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {PROPERTY_CATEGORIES.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Button
                    key={category.value}
                    variant={filters.category === category.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter('category', 
                      filters.category === category.value ? null : category.value as BasePropertyFilters['category']
                    )}
                    className="flex flex-col items-center p-4 h-auto"
                  >
                    <IconComponent className="w-6 h-6 mb-2" />
                    <span className="font-medium text-sm">{category.label}</span>
                    <span className="text-xs text-muted-foreground text-center">
                      {category.description}
                    </span>
                  </Button>
                );
              })}
            </div>
            {filters.category && (
              <p className="text-sm text-muted-foreground">
                Showing {filters.category} properties only
              </p>
            )}
          </div>

          {/* Quick All Properties Filters */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quick Filters</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('category', 'residential');
                  updateFilter('verified', true);
                }}
                className="flex items-center gap-2 text-xs"
              >
                🏠 Verified Homes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('category', 'commercial');
                  updateFilter('verified', true);
                }}
                className="flex items-center gap-2 text-xs"
              >
                🏢 Business Properties
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('category', 'land');
                  updateFilter('verified', true);
                }}
                className="flex items-center gap-2 text-xs"
              >
                🌾 Verified Land
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateFilter('verified', true);
                  updateFilter('priceMax', 10000000);
                }}
                className="flex items-center gap-2 text-xs"
              >
                💎 Premium Properties
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}