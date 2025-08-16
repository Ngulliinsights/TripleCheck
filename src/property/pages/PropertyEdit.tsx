import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Eye, 
  AlertCircle,
  CheckCircle,
  Clock,
  Home,
  MapPin,
  DollarSign,
  Image as ImageIcon
} from 'lucide-react';

import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Textarea } from '../../shared/components/ui/textarea';
import { Label } from '../../shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../shared/components/ui/select';
import { Checkbox } from '../../shared/components/ui/checkbox';
import { useToast } from '../../shared/hooks/use-toast';
import { PropertyImageGallery } from '../../shared/components/images';

interface PropertyData {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  price: number;
  currency: string;
  location: {
    address: string;
    city: string;
    county: string;
    country: string;
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    area: number;
    parkingSpaces: number;
    yearBuilt?: number;
  };
  amenities: string[];
  images: Array<{
    id: string;
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  status: 'active' | 'inactive' | 'pending' | 'sold' | 'rented';
  verificationStatus: 'verified' | 'pending' | 'unverified' | 'flagged';
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

// Mock property data
const mockProperty: PropertyData = {
  id: 'prop-123',
  title: 'Modern 3BR Apartment in Westlands',
  description: 'Beautiful modern apartment with stunning city views, located in the heart of Westlands. Features include modern kitchen, spacious living areas, and access to building amenities.',
  propertyType: 'apartment',
  price: 15000000,
  currency: 'KES',
  location: {
    address: '123 Westlands Road',
    city: 'Nairobi',
    county: 'Nairobi',
    country: 'Kenya'
  },
  features: {
    bedrooms: 3,
    bathrooms: 2,
    area: 1200,
    parkingSpaces: 1,
    yearBuilt: 2020
  },
  amenities: ['parking', 'security', 'gym', 'pool', 'wifi'],
  images: [
    {
      id: 'img-1',
      url: '/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg',
      alt: 'Living room view',
      isPrimary: true
    },
    {
      id: 'img-2',
      url: '/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg',
      alt: 'Kitchen view',
      isPrimary: false
    }
  ],
  status: 'active',
  verificationStatus: 'verified',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
  ownerId: 'user-123'
};

const propertyTypes = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'land', label: 'Land' },
  { value: 'commercial', label: 'Commercial' }
];

const availableAmenities = [
  { id: 'parking', label: 'Parking' },
  { id: 'security', label: '24/7 Security' },
  { id: 'gym', label: 'Gym/Fitness Center' },
  { id: 'pool', label: 'Swimming Pool' },
  { id: 'wifi', label: 'WiFi' },
  { id: 'garden', label: 'Garden' },
  { id: 'balcony', label: 'Balcony/Terrace' },
  { id: 'furnished', label: 'Furnished' },
  { id: 'elevator', label: 'Elevator' },
  { id: 'backup-power', label: 'Backup Power' }
];

const statusOptions = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  { value: 'pending', label: 'Pending Review', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'sold', label: 'Sold', color: 'bg-blue-100 text-blue-800' },
  { value: 'rented', label: 'Rented', color: 'bg-purple-100 text-purple-800' }
];

export default function PropertyEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [property, setProperty] = useState<PropertyData>(mockProperty);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load property data
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        setProperty(mockProperty);
        setIsLoading(false);
      }, 1000);
    }
  }, [id]);

  const updateProperty = useCallback(<K extends keyof PropertyData>(
    key: K,
    value: PropertyData[K]
  ) => {
    setProperty(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const updateNestedProperty = useCallback(<T extends keyof PropertyData>(
    parentKey: T,
    childKey: keyof PropertyData[T],
    value: PropertyData[T][keyof PropertyData[T]]
  ) => {
    setProperty(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
    setHasChanges(true);
  }, []);

  const toggleAmenity = useCallback((amenityId: string) => {
    setProperty(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setHasChanges(false);
      toast({
        title: 'Property updated successfully',
        description: 'Your changes have been saved.',
      });
    } catch (error) {
      toast({
        title: 'Failed to save changes',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

  const handlePreview = useCallback(() => {
    // Open property in new tab for preview
    window.open(`/property/${property.id}`, '_blank');
  }, [property.id]);

  const handleBack = useCallback(() => {
    if (hasChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    navigate(-1);
  }, [hasChanges, navigate]);

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return statusConfig ? (
      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
    ) : null;
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'flagged':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading property...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Edit Property</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>ID: {property.id}</span>
                  {getStatusBadge(property.status)}
                  <div className="flex items-center gap-1">
                    {getVerificationIcon(property.verificationStatus)}
                    <span className="capitalize">{property.verificationStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Property Title</Label>
                  <Input
                    id="title"
                    value={property.title}
                    onChange={(e) => updateProperty('title', e.target.value)}
                    placeholder="Enter property title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={property.description}
                    onChange={(e) => updateProperty('description', e.target.value)}
                    placeholder="Describe your property"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property-type">Property Type</Label>
                    <Select
                      value={property.propertyType}
                      onValueChange={(value) => updateProperty('propertyType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={property.status}
                      onValueChange={(value) => updateProperty('status', value as PropertyData['status'])}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={property.location.address}
                    onChange={(e) => updateNestedProperty('location', 'address', e.target.value)}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={property.location.city}
                      onChange={(e) => updateNestedProperty('location', 'city', e.target.value)}
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <Label htmlFor="county">County</Label>
                    <Input
                      id="county"
                      value={property.location.county}
                      onChange={(e) => updateNestedProperty('location', 'county', e.target.value)}
                      placeholder="County"
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={property.location.country}
                      onChange={(e) => updateNestedProperty('location', 'country', e.target.value)}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={property.price}
                      onChange={(e) => updateProperty('price', parseInt(e.target.value) || 0)}
                      placeholder="Enter price"
                    />
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={property.currency}
                      onValueChange={(value) => updateProperty('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Property Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input
                      id="bedrooms"
                      type="number"
                      value={property.features.bedrooms}
                      onChange={(e) => updateNestedProperty('features', 'bedrooms', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input
                      id="bathrooms"
                      type="number"
                      value={property.features.bathrooms}
                      onChange={(e) => updateNestedProperty('features', 'bathrooms', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="area">Area (sqm)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={property.features.area}
                      onChange={(e) => updateNestedProperty('features', 'area', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="parking">Parking Spaces</Label>
                    <Input
                      id="parking"
                      type="number"
                      value={property.features.parkingSpaces}
                      onChange={(e) => updateNestedProperty('features', 'parkingSpaces', parseInt(e.target.value) || 0)}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="year-built">Year Built (Optional)</Label>
                  <Input
                    id="year-built"
                    type="number"
                    value={property.features.yearBuilt || ''}
                    onChange={(e) => updateNestedProperty('features', 'yearBuilt', parseInt(e.target.value) || undefined)}
                    placeholder="e.g., 2020"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {availableAmenities.map((amenity) => (
                    <div key={amenity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={amenity.id}
                        checked={property.amenities.includes(amenity.id)}
                        onCheckedChange={() => toggleAmenity(amenity.id)}
                      />
                      <Label htmlFor={amenity.id} className="text-sm">
                        {amenity.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Property Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyImageGallery
                  images={property.images.map(img => ({
                    id: img.id,
                    src: img.url,
                    alt: img.alt,
                    category: 'property'
                  }))}
                  onImagesChange={(images) => {
                    // Update property images
                    const updatedImages = images.map((img, index) => ({
                      id: img.id,
                      url: img.src,
                      alt: img.alt,
                      isPrimary: index === 0
                    }));
                    updateProperty('images', updatedImages);
                  }}
                  maxImages={20}
                  allowReorder={true}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Property Status */}
            <Card>
              <CardHeader>
                <CardTitle>Property Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status:</span>
                  {getStatusBadge(property.status)}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verification:</span>
                  <div className="flex items-center gap-1">
                    {getVerificationIcon(property.verificationStatus)}
                    <span className="text-sm capitalize">{property.verificationStatus}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Created: {new Date(property.createdAt).toLocaleDateString()}</p>
                  <p>Updated: {new Date(property.updatedAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handlePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Property
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Documents
                </Button>
                
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Property
                </Button>
              </CardContent>
            </Card>

            {/* Save Changes */}
            {hasChanges && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-yellow-800 mb-3">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Unsaved Changes</span>
                  </div>
                  <p className="text-xs text-yellow-700 mb-4">
                    You have unsaved changes. Don't forget to save your work.
                  </p>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}