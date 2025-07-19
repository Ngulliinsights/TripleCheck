import React, { useState, useCallback } from "react";
import { useLocation } from "wouter";

interface PropertyDetailsProps {
  id: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  imageUrls?: string[];
  verificationStatus: "verified" | "pending" | "unverified";
  features?: {
    bedrooms?: number;
    bathrooms?: number;
    squareFeet?: number;
    parkingSpaces?: number;
    yearBuilt?: number;
    propertyType?: string;
    petFriendly?: boolean;
    furnished?: boolean;
    amenities?: string[];
  };
}

interface VerificationReport {
  status: "verified" | "pending" | "failed";
  score: number;
  checks: {
    ownership: boolean;
    documents: boolean;
    location: boolean;
    pricing: boolean;
  };
  lastUpdated: string;
}

export function PropertyDetails({ id }: PropertyDetailsProps) {
  const [, setLocation] = useLocation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [showContactDialog, setShowContactDialog] = useState(false);

  // Mock data - in real app, this would come from API
  const property: Property = {
    id,
    title: "Beautiful 3BR Apartment in Westlands",
    description: "Spacious and modern 3-bedroom apartment located in the heart of Westlands. Features include modern kitchen, spacious living room, and great city views.",
    price: 150000,
    location: "Westlands, Nairobi",
    imageUrls: [
      "/placeholder-property.jpg",
      "/placeholder-property-2.jpg",
      "/placeholder-property-3.jpg",
    ],
    verificationStatus: "verified",
    features: {
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1200,
      parkingSpaces: 1,
      yearBuilt: 2020,
      propertyType: "Apartment",
      petFriendly: false,
      furnished: true,
      amenities: ["Swimming Pool", "Gym", "Security", "Parking", "WiFi", "Generator"],
    },
  };

  const verificationReport: VerificationReport = {
    status: "verified",
    score: 85,
    checks: {
      ownership: true,
      documents: true,
      location: true,
      pricing: false,
    },
    lastUpdated: "2024-01-15",
  };

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: property.description,
          url: window.location.href,
        });
      } catch (error) {
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard");
    }
  }, [property]);

  const handleContact = useCallback(() => {
    setShowContactDialog(true);
  }, []);

  const handleFavorite = useCallback(() => {
    alert("Added to favorites!");
  }, []);

  const features = property.features || {};
  const amenities = features.amenities || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <button 
          className="text-blue-600 hover:underline"
          onClick={() => setLocation("/")}
        >
          ← Back to Properties
        </button>
        <span>/</span>
        <span>{property.location}</span>
        <span>/</span>
        <span className="text-gray-900">{property.title}</span>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="lg:col-span-3">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-200">
            <img
              src={property.imageUrls?.[selectedImageIndex] || "/placeholder-property.jpg"}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                property.verificationStatus === 'verified' 
                  ? 'bg-green-100 text-green-800' 
                  : property.verificationStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {property.verificationStatus === 'verified' ? '✓ Verified' : 
                 property.verificationStatus === 'pending' ? '⏳ Pending' : '❌ Unverified'}
              </span>
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                className="bg-white/80 hover:bg-white p-2 rounded-lg transition-colors"
                onClick={handleShare}
              >
                📤
              </button>
              <button 
                className="bg-white/80 hover:bg-white p-2 rounded-lg transition-colors"
                onClick={handleFavorite}
              >
                ❤️
              </button>
            </div>
            <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
              📷 {selectedImageIndex + 1} / {property.imageUrls?.length || 0}
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {(property.imageUrls || []).slice(0, 4).map((url, index) => (
            <div
              key={index}
              className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                selectedImageIndex === index ? "border-blue-500" : "border-transparent"
              }`}
              onClick={() => setSelectedImageIndex(index)}
            >
              <img
                src={url}
                alt={`${property.title} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Property Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              📍 <span>{property.location}</span>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-blue-600">
                KES {property.price?.toLocaleString() || "Price on request"}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Trust Score:</span>
                <span className="font-bold text-green-600">{verificationReport.score}%</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 mb-6">
              {features.bedrooms && (
                <div className="flex items-center gap-1">
                  🛏️ <span>{features.bedrooms} beds</span>
                </div>
              )}
              {features.bathrooms && (
                <div className="flex items-center gap-1">
                  🚿 <span>{features.bathrooms} baths</span>
                </div>
              )}
              {features.squareFeet && (
                <div className="flex items-center gap-1">
                  📐 <span>{features.squareFeet.toLocaleString()} sq ft</span>
                </div>
              )}
              {features.parkingSpaces && (
                <div className="flex items-center gap-1">
                  🚗 <span>{features.parkingSpaces} parking</span>
                </div>
              )}
              {features.yearBuilt && (
                <div className="flex items-center gap-1">
                  📅 <span>Built {features.yearBuilt}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {['overview', 'features', 'verification', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <>
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-3">Property Description</h3>
                  <p className="text-gray-600 leading-relaxed">{property.description}</p>
                </div>

                {amenities.length > 0 && (
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {amenities.map((amenity, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-green-500">✓</span>
                          <span className="text-sm">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'features' && (
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">Property Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="font-medium mb-1">Property Type</p>
                    <p className="text-gray-600">{features.propertyType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Bedrooms</p>
                    <p className="text-gray-600">{features.bedrooms || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Bathrooms</p>
                    <p className="text-gray-600">{features.bathrooms || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Square Feet</p>
                    <p className="text-gray-600">{features.squareFeet?.toLocaleString() || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Year Built</p>
                    <p className="text-gray-600">{features.yearBuilt || "N/A"}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Pet Friendly</p>
                    <p className="text-gray-600">{features.petFriendly ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  🛡️ Verification Report
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${verificationReport.score}%` }}
                        />
                      </div>
                      <span className="font-medium">{verificationReport.score}%</span>
                    </div>
                  </div>

                  <hr />

                  <div className="space-y-3">
                    {Object.entries(verificationReport.checks).map(([key, passed]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {passed ? '✓ Verified' : '⚠️ Pending'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <hr />

                  <div className="text-sm text-gray-600">
                    Last updated: {verificationReport.lastUpdated}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-3">Property Reviews</h3>
                <p className="text-gray-600">No reviews yet. Be the first to review this property!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Contact Property Owner</h3>
            <div className="space-y-3">
              <button
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                onClick={handleContact}
              >
                📧 Send Message
              </button>
              <button className="w-full border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                📞 Call Now
              </button>
            </div>
          </div>

          {/* Verification Actions */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Property Verification</h3>
            <div className="space-y-3">
              <button className="w-full border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                🛡️ Verify This Property
              </button>
              <button className="w-full border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                📈 Market Analysis
              </button>
              <button className="w-full border border-gray-300 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                🔗 Compare Similar
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Property Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Views</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Favorites</span>
                <span className="font-medium">89</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Listed</span>
                <span className="font-medium">2 weeks ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price/sq ft</span>
                <span className="font-medium">
                  KES {features.squareFeet ? Math.round(property.price / features.squareFeet).toLocaleString() : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      {showContactDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Contact Property Owner</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              alert("Message sent!");
              setShowContactDialog(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows={4}
                    placeholder="I'm interested in this property..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Your Phone (Optional)</label>
                  <input
                    type="tel"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="+254 700 000 000"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Send Message
                  </button>
                  <button
                    type="button"
                    className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => setShowContactDialog(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PropertyDetails;