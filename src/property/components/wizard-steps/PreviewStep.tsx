import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Separator } from '@shared/components/ui/separator';
import { PropertyFormData } from '../PropertyListingWizard';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  DollarSign, 
  Camera, 
  Edit,
  Eye,
  Share,
  Heart,
  Star
} from 'lucide-react';

interface PreviewStepProps {
  data: PropertyFormData;
  onUpdate: (updates: Partial<PropertyFormData>) => void;
  onValidation: (isValid: boolean) => void;
}

export function PreviewStep({ data, onUpdate, onValidation }: PreviewStepProps) {
  // Always valid since this is the final step
  useEffect(() => {
    onValidation(true);
  }, [onValidation]);

  const formatCurrency = (amount: number) => {
    const currencySymbols: Record<string, string> = {
      'KES': 'KSh',
      'USD': '$',
      'EUR': '€'
    };
    const symbol = currencySymbols[data.currency] || 'KSh';
    return `${symbol} ${amount.toLocaleString()}`;
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'apartment': 'Apartment',
      'house': 'House',
      'condo': 'Condominium',
      'townhouse': 'Townhouse',
      'land': 'Land'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Property Listing Preview
          </CardTitle>
          <p className="text-sm text-gray-600">
            This is how your property will appear to potential buyers and tenants
          </p>
        </CardHeader>
      </Card>

      {/* Property Listing Preview */}
      <Card className="overflow-hidden">
        {/* Main Image */}
        <div className="relative h-64 md:h-80 bg-gray-200">
          {data.images && data.images.length > 0 ? (
            <img
              src={URL.createObjectURL(data.images[0])}
              alt={data.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Camera className="h-12 w-12 mx-auto mb-2" />
                <p>No images uploaded</p>
              </div>
            </div>
          )}
          
          {/* Image Count Badge */}
          {data.images && data.images.length > 1 && (
            <Badge className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white">
              <Camera className="h-3 w-3 mr-1" />
              {data.images.length} photos
            </Badge>
          )}
          
          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex gap-2">
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Price and Title */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.price)}
                {data.priceType === 'rent' && <span className="text-lg text-gray-600">/month</span>}
              </h1>
              <Badge variant={data.priceType === 'sale' ? 'default' : 'secondary'}>
                For {data.priceType === 'sale' ? 'Sale' : 'Rent'}
              </Badge>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              {data.title || 'Property Title'}
            </h2>
          </div>

          {/* Property Details */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-1 text-gray-600">
              <Bed className="h-4 w-4" />
              <span className="text-sm">{data.bedrooms} bed{data.bedrooms !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Bath className="h-4 w-4" />
              <span className="text-sm">{data.bathrooms} bath{data.bathrooms !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Square className="h-4 w-4" />
              <span className="text-sm">{data.area.toLocaleString()} sq ft</span>
            </div>
            <Badge variant="outline">
              {getPropertyTypeLabel(data.propertyType)}
            </Badge>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 mb-4 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">
              {data.location.address}, {data.location.city}
              {data.location.state && `, ${data.location.state}`}
            </span>
          </div>

          <Separator className="my-4" />

          {/* Description */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {data.description || 'No description provided'}
            </p>
          </div>

          {/* Amenities */}
          {data.amenities && data.amenities.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {data.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="text-xs">
                    {amenity.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom Features */}
          {data.customFeatures && data.customFeatures.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Special Features</h3>
              <div className="flex flex-wrap gap-2">
                {data.customFeatures.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* Property Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{data.bedrooms}</div>
              <div className="text-xs text-gray-600">Bedrooms</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{data.bathrooms}</div>
              <div className="text-xs text-gray-600">Bathrooms</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{data.area.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Sq Ft</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(Math.round(data.price / data.area))}
              </div>
              <div className="text-xs text-gray-600">Per Sq Ft</div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-900">Interested in this property?</h4>
                <p className="text-sm text-blue-700">Contact the owner for more details</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  Message
                </Button>
                <Button size="sm">
                  Call
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Listing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-3">
              <h4 className="font-semibold">Basic Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium">{data.title || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{getPropertyTypeLabel(data.propertyType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">
                    {formatCurrency(data.price)} {data.priceType === 'rent' ? '/month' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={data.status === 'active' ? 'default' : 'secondary'}>
                    {data.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Property Details */}
            <div className="space-y-3">
              <h4 className="font-semibold">Property Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bedrooms:</span>
                  <span className="font-medium">{data.bedrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bathrooms:</span>
                  <span className="font-medium">{data.bathrooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Area:</span>
                  <span className="font-medium">{data.area.toLocaleString()} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Images:</span>
                  <span className="font-medium">{data.images?.length || 0} photos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-semibold mb-2">Location</h4>
            <p className="text-sm text-gray-600">
              {data.location.address}, {data.location.city}
              {data.location.state && `, ${data.location.state}`}, {data.location.country}
            </p>
            {data.location.coordinates && (
              <p className="text-xs text-gray-500 mt-1">
                Coordinates: {data.location.coordinates.lat.toFixed(6)}, {data.location.coordinates.lng.toFixed(6)}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Final Checklist */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3 text-green-800">✅ Pre-Publication Checklist</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${data.title ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm">Property title is descriptive and appealing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${data.description ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm">Detailed description provided</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${data.location.address && data.location.city ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm">Complete address and location set</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${data.images && data.images.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm">High-quality images uploaded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${data.price > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm">Competitive price set</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${data.amenities && data.amenities.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm">Amenities and features listed</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing Information */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">📋 What happens after publishing?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your property will be submitted for verification (24-48 hours)</li>
            <li>• Once verified, it will appear in search results</li>
            <li>• You'll receive notifications for inquiries and messages</li>
            <li>• You can edit your listing anytime from your dashboard</li>
            <li>• Analytics will be available to track listing performance</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}