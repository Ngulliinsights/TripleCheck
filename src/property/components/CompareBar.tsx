import React, { useState } from 'react';
import { X, ArrowLeftRight, Eye } from 'lucide-react';
import { Button } from '../../shared/components/ui/button';
import { Badge } from '../../shared/components/ui/badge';
import { useCompare } from '../contexts/CompareContext';
import { CompareModal } from './CompareModal';

export function CompareBar() {
  const { selectedProperties, removeFromCompare, clearCompare, maxProperties } = useCompare();
  const [showCompareModal, setShowCompareModal] = useState(false);

  if (selectedProperties.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
              <span className="font-medium text-gray-900">
                Compare Properties ({selectedProperties.length}/{maxProperties})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCompare}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            {selectedProperties.map((property) => (
              <div key={property.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {property.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {property.location}
                  </p>
                  <p className="text-xs font-medium text-primary">
                    {formatPrice(property.price)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromCompare(property.id)}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
            
            {selectedProperties.length < maxProperties && (
              <div className="flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 min-w-[120px]">
                <span className="text-sm text-gray-500">
                  Add {maxProperties - selectedProperties.length} more
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Select up to {maxProperties} properties to compare
            </Badge>
            <Button
              onClick={() => setShowCompareModal(true)}
              disabled={selectedProperties.length < 2}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Compare {selectedProperties.length > 1 ? `${selectedProperties.length} Properties` : ''}
            </Button>
          </div>
        </div>
      </div>

      <CompareModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        properties={selectedProperties}
      />
    </>
  );
}