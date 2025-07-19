import React from 'react';
import { Property } from '@shared/schema';

interface ListingCardProps {
  property: Property;
}

export default function ListingCard({ property }: ListingCardProps) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200">
        <img
          src={property.imageUrls?.[0] || "/placeholder-property.jpg"}
          alt={property.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1">{property.title}</h3>
        <p className="text-gray-600 text-sm mb-2">📍 {property.location}</p>
        <p className="text-lg font-bold text-blue-600">
          KES {property.price?.toLocaleString() || 'Price on request'}
        </p>
      </div>
    </div>
  );
}