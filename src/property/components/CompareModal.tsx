import { X, Home, MapPin, DollarSign, Bed, Bath, Car, Calendar, Shield } from 'lucide-react';
import React from 'react';

import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { cn } from '../../shared/lib/utils';
import { Property, PropertyFeatures } from '../../shared/types/property';
import { useCompare } from '../contexts/CompareContext';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CompareModal({ isOpen, onClose }: CompareModalProps) {
  const { selectedProperties } = useCompare();
  
  if (!isOpen || selectedProperties.length < 2) {
    return null;
  }
  
  const properties = selectedProperties;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getFeatures = (property: Property): PropertyFeatures | undefined => {
    return property.features as PropertyFeatures;
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unverified</Badge>;
    }
  };

  const ComparisonRow = ({
    label,
    icon,
    values,
  }: {
    label: string;
    icon: React.ReactNode;
    values: (string | number | React.ReactNode)[];
  }) => (
    <div className="grid gap-4 py-3 border-b border-border/40" style={{ gridTemplateColumns: `200px repeat(${properties.length}, 1fr)` }}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      {values.map((value, index) => (
        <div key={index} className="text-sm flex items-center justify-center p-2 rounded bg-gray-50">
          {value || '—'}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">Property Comparison</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            {/* Property Headers */}
            <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${properties.length}, 1fr)` }}>
              <div></div>
              {properties.map((property) => (
                <div key={property.id} className="text-center">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {property.images?.[0] ? (
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">{property.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{property.location}</p>
                  {getVerificationBadge(property.status)}
                </div>
              ))}
            </div>

            {/* Comparison Rows */}
            <div className="space-y-1">
              <ComparisonRow
                label="Price"
                icon={<DollarSign className="w-4 h-4" />}
                values={properties.map(p => formatPrice(p.price))}
              />

              <ComparisonRow
                label="Location"
                icon={<MapPin className="w-4 h-4" />}
                values={properties.map(p => p.location)}
              />

              <ComparisonRow
                label="Bedrooms"
                icon={<Bed className="w-4 h-4" />}
                values={properties.map(p => getFeatures(p)?.bedrooms || '—')}
              />

              <ComparisonRow
                label="Bathrooms"
                icon={<Bath className="w-4 h-4" />}
                values={properties.map(p => getFeatures(p)?.bathrooms || '—')}
              />

              <ComparisonRow
                label="Area"
                icon={<Home className="w-4 h-4" />}
                values={properties.map(p => {
                  const sqft = getFeatures(p)?.squareFeet;
                  return sqft ? `${sqft.toLocaleString()} sq ft` : '—';
                })}
              />

              <ComparisonRow
                label="Parking"
                icon={<Car className="w-4 h-4" />}
                values={properties.map(p => {
                  const parking = getFeatures(p)?.parkingSpaces;
                  return parking ? `${parking} spaces` : '—';
                })}
              />

              <ComparisonRow
                label="Year Built"
                icon={<Calendar className="w-4 h-4" />}
                values={properties.map(p => getFeatures(p)?.yearBuilt || '—')}
              />

              <ComparisonRow
                label="Status"
                icon={<Shield className="w-4 h-4" />}
                values={properties.map(p => getVerificationBadge(p.status))}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Comparing {properties.length} properties
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => {
              // TODO: Implement save comparison or share functionality
              console.log('Save comparison feature coming soon');
            }}>
              Save Comparison
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}