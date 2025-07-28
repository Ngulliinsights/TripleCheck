import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { MapPin, Bed, Bath, Square, Shield, Calendar, User, Phone, Mail } from 'lucide-react';
import { formatDate } from '../../shared/utils/date-utils';

interface PropertyDetailsProps {
  id?: string;
}

export default function PropertyDetails({ id }: PropertyDetailsProps) {
  // Mock property data - in real app, this would be fetched based on ID
  const property = {
    id: id || '1',
    title: 'Modern 3-Bedroom Apartment in Nairobi',
    description: 'Beautiful modern apartment with stunning city views, located in the heart of Nairobi. Features include modern appliances, spacious rooms, and excellent security.',
    location: 'Westlands, Nairobi',
    price: 150000,
    images: [
      '/assets/apartment-luxury-1.jpg',
      '/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg',
      '/assets/Residential/frames-for-your-heart-2d4lAQAlbDA-unsplash.jpg'
    ],
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      parkingSpaces: 2,
      yearBuilt: 2020,
      amenities: ['Swimming Pool', 'Gym', 'Security', 'Garden', 'Parking'],
      propertyType: 'Apartment',
      petFriendly: true,
      furnished: false
    },
    status: 'verified' as const,
    verificationData: {
      imageAnalysis: {
        qualityScore: 95,
        authenticityScore: 98,
        flaggedIssues: []
      },
      descriptionAnalysis: {
        accuracyScore: 92,
        completenessScore: 88,
        suggestedImprovements: []
      },
      overallScore: 94,
      verificationTimestamp: '2024-01-15T10:30:00Z',
      aiModel: 'TripleCheck-AI-v2.1'
    },
    owner: {
      name: 'John Doe',
      phone: '+254 700 123 456',
      email: 'john.doe@example.com',
      trustScore: 4.8,
      verified: true
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
            <h1 className="text-3xl font-bold">{property.title}</h1>
            <Badge className={getStatusColor(property.status)}>
              <Shield className="w-4 h-4 mr-1" />
              {property.status}
            </Badge>
          </div>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="w-4 h-4 mr-1" />
            {property.location}
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(property.price)}
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
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-64 md:h-80 object-cover rounded-tl-lg md:rounded-bl-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {property.images.slice(1, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${property.title} ${index + 2}`}
                        className="w-full h-32 md:h-40 object-cover"
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
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
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
                    <span>{property.features?.bedrooms || 0} Bedrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="w-5 h-5 mr-2 text-gray-600" />
                    <span>{property.features?.bathrooms || 0} Bathrooms</span>
                  </div>
                  <div className="flex items-center">
                    <Square className="w-5 h-5 mr-2 text-gray-600" />
                    <span>{property.features?.squareFeet || 0} sqft</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-gray-600" />
                    <span>Built {property.features?.yearBuilt || 'N/A'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {property.features?.amenities?.map((amenity, index) => (
                      <Badge key={index} variant="secondary">
                        {amenity}
                      </Badge>
                    )) || <span className="text-gray-500">No amenities listed</span>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Details */}
            {property.verificationData && (
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
                        {property.verificationData.overallScore}%
                      </div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {property.verificationData.imageAnalysis.authenticityScore}%
                      </div>
                      <div className="text-sm text-gray-600">Image Authenticity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {property.verificationData.descriptionAnalysis.accuracyScore}%
                      </div>
                      <div className="text-sm text-gray-600">Description Accuracy</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Verified on {formatDate(property.verificationData.verificationTimestamp)} 
                    using {property.verificationData.aiModel}
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
                    <div className="font-medium">{property.owner.name}</div>
                    <div className="text-sm text-gray-600">
                      Trust Score: {property.owner.trustScore}/5.0
                      {property.owner.verified && (
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