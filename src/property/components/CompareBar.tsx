/**
 * CompareBar Component
 * 
 * A floating bottom bar that shows selected properties for comparison
 * and provides quick access to the compare page.
 */

import { ArrowLeftRight, X, Eye } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

// Using basic img tag for simple image display
import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import { Card } from "../../shared/components/ui/card";
import { 
  formatComparePrice,
  safeGetPropertyImage,
  getComparePropertyTitle
} from "../../shared/utils/compare-utils";
import { useCompare } from "../contexts/CompareContext";

interface CompareBarProps {
  onQuickCompare?: () => void;
}

export function CompareBar({ onQuickCompare }: CompareBarProps = {}) {
  const { selectedProperties, removeFromCompare, clearCompare } = useCompare();
  const navigate = useNavigate();

  // Don't render if no properties selected
  if (selectedProperties.length === 0) {
    return null;
  }

  const handleCompare = () => {
    if (selectedProperties.length < 2) {
      return; // Don't navigate if less than 2 properties
    }
    
    // Navigate to compare page with selected property IDs as URL params for better linking
    const propertyIds = selectedProperties.map(p => p.id).join(',');
    navigate(`/compare?properties=${propertyIds}`);
  };

  // Using unified price formatting from compare-utils

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
      <Card className="max-w-6xl mx-auto bg-white/95 backdrop-blur-sm border shadow-lg">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Left side - Selected properties */}
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-primary" />
                <span className="font-medium text-sm">
                  Compare Properties ({selectedProperties.length})
                </span>
              </div>

              {/* Property thumbnails */}
              <div className="flex gap-2 overflow-x-auto max-w-md">
                {selectedProperties.map((property) => (
                  <div
                    key={property.id}
                    className="flex-shrink-0 relative group"
                  >
                    <div className="w-16 h-12 bg-muted rounded overflow-hidden border">
                      {safeGetPropertyImage(property) ? (
                        <img
                          src={safeGetPropertyImage(property)}
                          alt={getComparePropertyTitle(property)}
                          width={64}
                          height={48}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          useLandPlaceholder={false}
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCompare(property.id)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${getComparePropertyTitle(property)} from comparison`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Property details preview */}
              <div className="hidden md:flex gap-4 text-xs text-muted-foreground">
                {selectedProperties.slice(0, 2).map((property, index) => (
                  <div key={property.id} className="flex flex-col">
                    <span className="font-medium text-foreground truncate max-w-32">
                      {getComparePropertyTitle(property)}
                    </span>
                    <span>{formatComparePrice(property.price)}</span>
                  </div>
                ))}
                {selectedProperties.length > 2 && (
                  <div className="flex items-center">
                    <Badge variant="secondary">
                      +{selectedProperties.length - 2} more
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompare}
                className="text-xs"
              >
                Clear All
              </Button>
              {onQuickCompare && selectedProperties.length >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onQuickCompare}
                  className="text-xs"
                >
                  Quick Compare
                </Button>
              )}
              <Button
                onClick={handleCompare}
                size="sm"
                disabled={selectedProperties.length < 2}
                className="text-xs"
              >
                Compare {selectedProperties.length >= 2 ? `(${selectedProperties.length})` : ""}
              </Button>
            </div>
          </div>

          {/* Helper text */}
          {selectedProperties.length === 1 && (
            <div className="mt-2 text-xs text-muted-foreground">
              Select one more property to start comparing
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}