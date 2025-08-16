/**
 * Example usage of PropertyCard with integrated PropertyImageVault functionality
 * This demonstrates how to use the enhanced PropertyCard with image management capabilities
 */

import React, { useState, useCallback } from "react";
import { PropertyCard } from "./PropertyCard";
import type { NormalizedProperty } from "../../types/property";
import type { DocumentType, ImageProcessingError } from "../../types/images";

// Sample property data for demonstration
const sampleProperty: NormalizedProperty = {
  id: "prop-123",
  title: "Modern 3BR Apartment in Westlands",
  description: "Beautiful modern apartment with stunning city views, located in the heart of Westlands. Features include spacious bedrooms, modern kitchen, and secure parking.",
  price: 85000000, // 85M KES
  location: "Westlands, Nairobi",
  images: [
    "/api/placeholder/400/300?text=Living+Room",
    "/api/placeholder/400/300?text=Kitchen",
    "/api/placeholder/400/300?text=Bedroom",
  ],
  verified: true,
  type: "apartment",
  category: "residential",
  features: {
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1200,
    parkingSpaces: 1,
    amenities: ["Swimming Pool", "Gym", "Security", "Backup Generator"],
    furnished: false,
    balcony: true,
  },
  createdAt: "2024-01-15T10:00:00Z",
  status: "available",
  trustScore: 92,
  verificationStatus: "verified",
  coordinates: {
    lat: -1.2634,
    lng: 36.8155,
  },
  owner: {
    id: "owner-456",
    name: "Sarah Kimani",
    trustScore: 88,
    isVerifiedAgent: true,
    avatar: "/api/placeholder/40/40?text=SK",
  },
};

export function PropertyCardWithImageManagementExample() {
  const [properties, setProperties] = useState<NormalizedProperty[]>([sampleProperty]);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Handle property click
  const handlePropertyClick = useCallback((property: NormalizedProperty) => {
    console.log("Property clicked:", property.title);
    // In a real app, this would navigate to property details
  }, []);

  // Handle wishlist toggle
  const handleSave = useCallback((propertyId: string) => {
    setIsInWishlist(prev => !prev);
    console.log("Wishlist toggled for property:", propertyId);
  }, []);

  // Handle property sharing
  const handleShare = useCallback((propertyId: string) => {
    console.log("Share property:", propertyId);
    // In a real app, this would open share dialog or copy link
    if (navigator.share) {
      navigator.share({
        title: sampleProperty.title,
        text: sampleProperty.description,
        url: `${window.location.origin}/property/${propertyId}`,
      });
    }
  }, []);

  // Handle image updates
  const handleImagesUpdate = useCallback((propertyId: string, images: string[]) => {
    setProperties(prev => 
      prev.map(prop => 
        prop.id === propertyId 
          ? { ...prop, images }
          : prop
      )
    );
    console.log("Images updated for property:", propertyId, images);
  }, []);

  // Handle successful image upload
  const handleImageUploadComplete = useCallback((propertyId: string, imageId: string) => {
    console.log("Image upload completed:", { propertyId, imageId });
    // In a real app, you might want to refresh property data or show success message
  }, []);

  // Handle image upload errors
  const handleImageUploadError = useCallback((propertyId: string, error: ImageProcessingError) => {
    console.error("Image upload error:", { propertyId, error });
    // In a real app, you would show error notification to user
    alert(`Image upload failed: ${error.message}`);
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          PropertyCard with Image Management Integration
        </h1>
        
        <div className="grid gap-8">
          {/* Standard PropertyCard */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Standard PropertyCard</h2>
            <div className="max-w-sm">
              <PropertyCard
                property={properties[0]!}
                onClick={handlePropertyClick}
                showQuickActions={true}
                isInWishlist={isInWishlist}
                onSave={handleSave}
                onShare={handleShare}
                priority={true}
              />
            </div>
          </div>

          {/* PropertyCard with Image Management */}
          <div>
            <h2 className="text-xl font-semibold mb-4">PropertyCard with Image Management</h2>
            <div className="max-w-sm">
              <PropertyCard
                property={properties[0]!}
                onClick={handlePropertyClick}
                showQuickActions={true}
                isInWishlist={isInWishlist}
                onSave={handleSave}
                onShare={handleShare}
                priority={true}
                enableImageManagement={true}
                onImagesUpdate={handleImagesUpdate}
                onImageUploadComplete={handleImageUploadComplete}
                onImageUploadError={handleImageUploadError}
                maxImages={15}
                allowedDocumentTypes={["property_photo", "title_deed", "survey_plan"] as DocumentType[]}
              />
            </div>
          </div>

          {/* Grid Layout Example */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Grid Layout with Image Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <PropertyCard
                  key={`grid-${index}`}
                  property={{
                    ...properties[0]!,
                    id: `prop-grid-${index}`,
                    title: `${properties[0]!.title} - Unit ${index + 1}`,
                  }}
                  onClick={handlePropertyClick}
                  showQuickActions={true}
                  isInWishlist={index === 1} // Second card is in wishlist
                  onSave={handleSave}
                  onShare={handleShare}
                  enableImageManagement={true}
                  onImagesUpdate={handleImagesUpdate}
                  onImageUploadComplete={handleImageUploadComplete}
                  onImageUploadError={handleImageUploadError}
                  maxImages={10}
                  allowedDocumentTypes={["property_photo"] as DocumentType[]}
                />
              ))}
            </div>
          </div>

          {/* List View Example */}
          <div>
            <h2 className="text-xl font-semibold mb-4">List View with Image Management</h2>
            <div className="space-y-4">
              {[...Array(2)].map((_, index) => (
                <PropertyCard
                  key={`list-${index}`}
                  property={{
                    ...properties[0]!,
                    id: `prop-list-${index}`,
                    title: `${properties[0]!.title} - List ${index + 1}`,
                  }}
                  viewMode="list"
                  onClick={handlePropertyClick}
                  showQuickActions={true}
                  isInWishlist={false}
                  onSave={handleSave}
                  onShare={handleShare}
                  enableImageManagement={true}
                  onImagesUpdate={handleImagesUpdate}
                  onImageUploadComplete={handleImageUploadComplete}
                  onImageUploadError={handleImageUploadError}
                  maxImages={8}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Integration Features</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Image Management Button:</strong> Appears in quick actions when enableImageManagement=true</li>
            <li>• <strong>Upload Interface:</strong> Full-featured image upload with progress tracking</li>
            <li>• <strong>Image Grid:</strong> Visual management of current property images</li>
            <li>• <strong>Type Safety:</strong> Full TypeScript support with proper error handling</li>
            <li>• <strong>Document Types:</strong> Support for different document types (photos, deeds, plans)</li>
            <li>• <strong>Responsive Design:</strong> Works across all view modes (grid, list, adaptive)</li>
            <li>• <strong>Event Callbacks:</strong> Comprehensive callback system for image operations</li>
            <li>• <strong>Error Handling:</strong> Proper error handling with user feedback</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default PropertyCardWithImageManagementExample;