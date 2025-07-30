import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { MapPin, Bed, Bath, Square, Shield, Calendar, User, Phone, Mail, Loader2 } from 'lucide-react';
import { formatDate } from '../../shared/utils/date-utils';
import { useProperty } from '../hooks/useProperty';

interface PropertyDetailsProps {
  id?: string;
}

export default function PropertyDetails({ id }: PropertyDetailsProps) {
  // FIXED: Use safe query hook instead of mock data to prevent infinite API calls
  const { data: property, isLoading, error, hasValidData } = useProperty(id || '');

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading property details...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !hasValidData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Fallback property structure for safety
  const safeProperty = {
    id: property?.id || id || '1',
    title: property?.title || 'Property Details',
    description: property?.description || 'No description available.',
    location: property?.location || 'Location not specified',
    price: property?.price || 0,
    images: property?.images || ['/assets/apartment-luxury-1.jpg'],
    features: {
      bedrooms: property?.features?.bedrooms || 0,
      bathrooms: property?.features?.bathrooms || 0,
      squareFeet: property?.features?.squareFeet || 0,
      parkingSpaces: property?.features?.parkingSpaces || 0,
      yearBuilt: property?.features?.yearBuilt || new Date().getFullYear(),
      amenities: property?.features?.amenities || [],
      propertyType: property?.features?.propertyType || 'Property',
      petFriendly: property?.features?.petFriendly || false,
      furnished: property?.features?.furnished || false
    },
    status: (property?.status || 'pending') as const,
    verificationData: property?.verificationData || {
      imageAnalysis: {
        qualityScore: 0,
        authenticityScore: 0,
        flaggedIssues: []
      },
      descriptionAnalysis: {
        accuracyScore: 0,
        completenessScore: 0,
        suggestedImprovements: []
      },
      overallScore: 0,
      verificationTimestamp: new Date().toISOString(),
      aiModel: 'TripleCheck-AI-v2.1'
    },
    owner: property?.owner || {
      name: 'Property Owner',
      phone: 'Contact for details',
      email: 'Contact for details',
      trustScore: 0,
      verified: false
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">{safeProperty.title}</h1>
            <Badge className={getStatusColor(safeProperty.status)}>
              <Shield className="w-4 h-4 mr-1" />
              {safeProperty.status}
            </Badge>
          </div>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {safeProperty.location}
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(safeProperty.price)}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <img
                    src={safeProperty.images[0]}
                    alt={safeProperty.title}
                    className="w-full h-64 md:h-80 object-cover rounded-tl-lg md:rounded-bl-lg"
                    loading="lazy"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {safeProperty.images.slice(1, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${safeProperty.title} ${index + 2}`}
                        className="w-full h-32 md:h-40 object-cover"
                        loading="lazy"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{safeProperty.description}</p>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Property Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center">
                    <Bed className="w-5 h-5 mr-2 text-gray-600" />
                    <span>{safeProperty.features?.bedrooms || 0} Bedrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-5 h-5 mr-2 text-gray-600" />
                    <span>{safeProperty.features?.bathrooms || 0} Bathrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="w-5 h-5 mr-2 text-gray-600" />
                    <span>{safeProperty.features?.squareFeet || 0} sqft</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                    <span>Built {safeProperty.features?.yearBuilt || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {safeProperty.features?.amenities?.length > 0 ? (
                      safeProperty.features.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary">
                          {amenity}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500">No amenities listed</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Details */}
            {safeProperty.verificationData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-600" />
                    Verification Report
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {safeProperty.verificationData.overallScore}%
                      </div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {safeProperty.verificationData.imageAnalysis.authenticityScore}%
                      </div>
                      <div className="text-sm text-gray-600">Image Authenticity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {safeProperty.verificationData.descriptionAnalysis.accuracyScore}%
                      </div>
                      <div className="text-sm text-gray-600">Description Accuracy</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Verified on {formatDate(safeProperty.verificationData.verificationTimestamp)} 
                    using {safeProperty.verificationData.aiModel}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Owner */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Owner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <User className="w-5 h-5 mr-3 text-gray-600" />
                  <div>
                    <div className="font-medium">{safeProperty.owner.name}</div>
                    <div className="text-sm text-gray-600">
                      Trust Score: {safeProperty.owner.trustScore}/5.0
                      {safeProperty.owner.verified && (
                        <Badge className="ml-2 bg-green-100 text-green-800">Verified</Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Button className="w-full">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Owner
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  Save to Favorites
                </Button>
                <Button variant="outline" className="w-full">
                  Share Property
                </Button>
                <Button variant="outline" className="w-full">
                  Schedule Viewing
                </Button>
                <Button variant="outline" className="w-full">
                  Report Issue
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}