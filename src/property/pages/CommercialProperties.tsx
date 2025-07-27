import React, { useState, useMemo, useCallback } from 'react';
import {
  Building2,
  MapPin,
  TrendingUp,
  Users,
  Calendar,
  Search,
  Grid,
  List,
  Star,
  Eye,
  Heart,
  Share2,
} from 'lucide-react';

// Type definitions for DOM elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      select: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
      textarea: React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
    }
  }
}

interface CommercialProperty {
  id: string;
  title: string;
  type: 'office' | 'retail' | 'warehouse' | 'industrial' | 'mixed-use';
  location: string;
  price: number;
  size: number;
  yearBuilt: number;
  occupancyRate: number;
  roi: number;
  images: string[];
  features: string[];
  description: string;
  status: 'available' | 'under-offer' | 'sold';
  verified: boolean;
  rating: number;
  views: number;
}

interface PropertyTypeConfig {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

type SortOption = 'price-desc' | 'price-asc' | 'roi-desc' | 'size-desc' | 'rating-desc';
type ViewMode = 'grid' | 'list';

export default function CommercialProperties() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('price-desc');
  const [searchQuery, setSearchQuery] = useState('');

  const commercialProperties: CommercialProperty[] = useMemo(() => [
    {
      id: 'COM-001',
      title: 'Premium Office Complex - Westlands',
      type: 'office',
      location: 'Westlands, Nairobi',
      price: 180000000,
      size: 2500,
      yearBuilt: 2019,
      occupancyRate: 95,
      roi: 12.5,
      images: ['/assets/office-complex-1.jpg'],
      features: ['24/7 Security', 'Backup Generator', 'Parking Space', 'Conference Rooms', 'High-Speed Internet'],
      description: 'Modern office complex in the heart of Westlands with premium amenities and excellent connectivity.',
      status: 'available',
      verified: true,
      rating: 4.8,
      views: 1247
    },
    {
      id: 'COM-002',
      title: 'Shopping Mall - Sarit Centre Area',
      type: 'retail',
      location: 'Westlands, Nairobi',
      price: 250000000,
      size: 5000,
      yearBuilt: 2020,
      occupancyRate: 88,
      roi: 15.2,
      images: ['/assets/shopping-mall-1.jpg'],
      features: ['Food Court', 'Ample Parking', 'Central AC', 'Escalators', 'Security Systems'],
      description: 'Prime retail space in bustling Westlands with high foot traffic and established tenant base.',
      status: 'available',
      verified: true,
      rating: 4.6,
      views: 892
    },
    {
      id: 'COM-003',
      title: 'Industrial Warehouse - Mombasa Road',
      type: 'warehouse',
      location: 'Industrial Area, Nairobi',
      price: 95000000,
      size: 8000,
      yearBuilt: 2018,
      occupancyRate: 100,
      roi: 18.7,
      images: ['/assets/warehouse-1.jpg'],
      features: ['Loading Docks', 'High Ceiling', 'Fire Safety', 'Security Fence', 'Office Space'],
      description: 'Strategic warehouse location on Mombasa Road with excellent logistics connectivity to the port.',
      status: 'under-offer',
      verified: true,
      rating: 4.4,
      views: 634
    },
    {
      id: 'COM-004',
      title: 'Mixed-Use Development - Karen',
      type: 'mixed-use',
      location: 'Karen, Nairobi',
      price: 450000000,
      size: 12000,
      yearBuilt: 2021,
      occupancyRate: 92,
      roi: 14.8,
      images: ['/assets/mixed-use-1.jpg'],
      features: ['Retail Ground Floor', 'Office Spaces', 'Residential Units', 'Gym', 'Restaurant'],
      description: 'Premium mixed-use development combining retail, office, and residential spaces in upscale Karen.',
      status: 'available',
      verified: true,
      rating: 4.9,
      views: 1856
    }
  ], []);

  const propertyTypes: PropertyTypeConfig[] = useMemo(() => [
    { value: 'all', label: 'All Types', icon: Building2 },
    { value: 'office', label: 'Office', icon: Building2 },
    { value: 'retail', label: 'Retail', icon: Building2 },
    { value: 'warehouse', label: 'Warehouse', icon: Building2 },
    { value: 'industrial', label: 'Industrial', icon: Building2 },
    { value: 'mixed-use', label: 'Mixed Use', icon: Building2 }
  ], []);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleFilterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterType(event.target.value);
  }, []);

  const handleSortChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(event.target.value as SortOption);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }, []);

  const getTypeColor = useCallback((type: string) => {
    const colors = {
      office: 'bg-blue-100 text-blue-800',
      retail: 'bg-green-100 text-green-800',
      warehouse: 'bg-orange-100 text-orange-800',
      industrial: 'bg-purple-100 text-purple-800',
      'mixed-use': 'bg-pink-100 text-pink-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const colors = {
      available: 'bg-trust-verified text-white',
      'under-offer': 'bg-trust-warning text-white',
      sold: 'bg-trust-danger text-white'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500 text-white';
  }, []);

  const filteredProperties = useMemo(() => {
    return commercialProperties.filter(property => {
      const matchesType = filterType === 'all' || property.type === filterType;
      const matchesSearch = property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           property.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [commercialProperties, filterType, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Building2 className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Commercial Properties
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover premium commercial real estate opportunities across Kenya. 
              From modern office complexes to strategic warehouse locations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-trust-verified/10 px-4 py-2 rounded-full">
                <TrendingUp className="w-5 h-5 text-trust-verified" />
                <span className="text-trust-verified font-medium">High ROI Properties</span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">Verified Tenants</span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full">
                <Calendar className="w-5 h-5 text-secondary" />
                <span className="text-secondary font-medium">Ready to Move</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card border border-card-border rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Search commercial properties"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              <select
                value={filterType}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Filter by property type"
              >
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={handleSortChange}
                className="px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Sort properties by"
              >
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="roi-desc">ROI: High to Low</option>
                <option value="size-desc">Size: Large to Small</option>
                <option value="rating-desc">Rating: High to Low</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex bg-muted rounded-md p-1" role="group" aria-label="View mode selection">
                <button
                  onClick={() => handleViewModeChange('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid' ? 'true' : 'false'}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list' ? 'true' : 'false'}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            Showing {filteredProperties.length} commercial properties
          </p>
        </div>

        {/* Properties Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-6'}>
          {filteredProperties.map((property) => (
            <article key={property.id} className={`bg-card border border-card-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${viewMode === 'list' ? 'flex' : ''}`}>
              {/* Property Image */}
              <div className={`relative ${viewMode === 'list' ? 'w-80 flex-shrink-0' : 'aspect-video'}`}>
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-primary/50" />
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                    {property.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Verified Badge */}
                {property.verified && (
                  <div className="absolute top-3 right-3 bg-trust-verified text-white p-1 rounded-full" title="Verified property">
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button 
                    className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                    aria-label="Add to favorites"
                    title="Add to favorites"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                    aria-label="Share property"
                    title="Share property"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">{property.title}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4" />
                      {property.location}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(property.type)}`}>
                    {property.type.replace('-', ' ')}
                  </span>
                </div>

                <div className="text-2xl font-bold text-primary mb-3">
                  {formatPrice(property.price)}
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Size</div>
                    <div className="font-semibold">{property.size.toLocaleString()} sqm</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">ROI</div>
                    <div className="font-semibold text-trust-verified">{property.roi}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Occupancy</div>
                    <div className="font-semibold">{property.occupancyRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Built</div>
                    <div className="font-semibold">{property.yearBuilt}</div>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {property.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        {feature}
                      </span>
                    ))}
                    {property.features.length > 3 && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        +{property.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating and Views */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{property.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">{property.views}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-md font-medium hover:bg-primary-hover transition-colors">
                    View Details
                  </button>
                  <button className="flex-1 border border-primary text-primary py-2 px-4 rounded-md font-medium hover:bg-primary/10 transition-colors">
                    Contact Agent
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-medium hover:bg-secondary-hover transition-colors">
            Load More Properties
          </button>
        </div>
      </div>
    </div>
  );
}