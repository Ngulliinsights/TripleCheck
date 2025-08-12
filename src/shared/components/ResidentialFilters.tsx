import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ResidentialFiltersProps {
  filters: any;
  onChange: (filters: any) => void;
  onReset: () => void;
  errors?: any;
}

export const ResidentialFilters: React.FC<ResidentialFiltersProps> = ({
  filters,
  onChange,
  onReset,
  errors,
}) => {
  const handleInputChange = (key: string, value: any) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search properties..."
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Enter location..."
            value={filters.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="priceMin">Min Price</Label>
          <Input
            id="priceMin"
            type="number"
            placeholder="Min price..."
            value={filters.priceMin || ''}
            onChange={(e) => handleInputChange('priceMin', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="priceMax">Max Price</Label>
          <Input
            id="priceMax"
            type="number"
            placeholder="Max price..."
            value={filters.priceMax || ''}
            onChange={(e) => handleInputChange('priceMax', e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button variant="outline" onClick={onReset}>
          Reset Filters
        </Button>
      </div>
    </div>
  );
};

export default ResidentialFilters;