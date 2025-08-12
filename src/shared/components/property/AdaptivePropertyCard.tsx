import React from 'react';

import type { NormalizedProperty } from '../../types/property';

interface AdaptivePropertyCardProps {
  property: NormalizedProperty;
  onClick: (property: NormalizedProperty) => void;
  className?: string;
}

/**
 * Adaptive property card that can display any type of property
 * Uses the normalized property interface to provide consistent display
 * across different property types (residential, commercial, land)
 */
export default function AdaptivePropertyCard({ 
  property, 
  onClick, 
  className = "" 
}: AdaptivePropertyCardProps): React.ReactElement {
  const handleClick = () => {
    onClick(property);
  };

  return (
    <div 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Property Image */}
        <div className="aspect-video bg-gray-100 relative">
          {property.images && property.images.length > 0 ? (
            <img
              src={property.images[0]}
              alt={property.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400">No Image</div>
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full capitalize">
              {property.category}
            </span>
          </div>

          {/* Verification Badge */}
          {property.verificationStatus === 'verified' && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                Verified
              </span>
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {property.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-2">
            {typeof property.location === 'string' ? property.location : property.location?.address}
          </p>

          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-blue-600">
              KES {Number(property.price).toLocaleString()}
            </div>
            
            {/* Property-specific details */}
            {property.features && (
              <div className="text-sm text-gray-500">
                {property.features.bedrooms && (
                  <span>{property.features.bedrooms} bed</span>
                )}
                {property.features.bathrooms && (
                  <span className="ml-2">{property.features.bathrooms} bath</span>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {property.description && (
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
              {property.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}