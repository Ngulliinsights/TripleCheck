import {
  X,
  Home,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Car,
  Calendar,
  Shield,
} from "lucide-react";
import React, { useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Property,
  PropertyFeatures,
  LocationData as ImportedLocationData,
} from "../../shared/types/property";
import { useCompare } from "../contexts/CompareContext";

// Create a union type that handles both the imported type and any additional dynamic properties
// This approach respects the exact structure of the imported type while allowing flexibility
type LocationDataUnion = ImportedLocationData | { [key: string]: unknown };

// Make props interface readonly as suggested by ESLint
interface CompareModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CompareModal({ isOpen, onClose }: CompareModalProps) {
  const { selectedProperties } = useCompare();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // This is the fundamental rule of React hooks that we need to follow

  // Memoize formatted data to prevent unnecessary recalculations
  const formattedData = useMemo(() => {
    if (!selectedProperties.length) return null;

    return {
      properties: selectedProperties,
      propertyCount: selectedProperties.length,
      propertyIds: selectedProperties.map((p) => p.id).join(","),
    };
  }, [selectedProperties]);

  // Helper function to format price with proper type handling
  const formatPrice = useCallback((price: string | number): string => {
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    if (isNaN(numericPrice)) return "Price on request";

    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(numericPrice);
  }, []);

  // Helper function to safely get property features
  const getFeatures = useCallback(
    (property: Property): PropertyFeatures | undefined => {
      return property.features as PropertyFeatures;
    },
    []
  );

  // Helper function to render verification badges with consistent return type
  const getVerificationBadge = useCallback(
    (status?: string): React.ReactElement => {
      switch (status) {
        case "verified":
          return (
            <Badge className="bg-green-100 text-green-800">Verified</Badge>
          );
        case "pending":
          return (
            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
          );
        default:
          return (
            <Badge className="bg-gray-100 text-gray-800">Unverified</Badge>
          );
      }
    },
    []
  );

  // Helper function to safely render location data with proper typing
  // This function handles the complex type relationship between imported and local types
  const renderLocation = useCallback(
    (location: string | LocationDataUnion): string => {
      // Step 1: Handle the simple case where location is already a string
      if (typeof location === "string") {
        return location;
      }

      // Step 2: Handle object locations by safely extracting known properties
      if (location && typeof location === "object") {
        // We use type assertion here because we know the structure from context
        // This is safe because we're only reading properties, not modifying
        const locationObj = location as {
          name?: string;
          address?: string;
          city?: string;
          [key: string]: unknown;
        };

        // Return the first available property in order of preference
        return (
          locationObj.name ||
          locationObj.address ||
          locationObj.city ||
          "Unknown Location"
        );
      }

      // Step 3: Fallback for any unexpected cases
      return "Unknown Location";
    },
    []
  );

  // Handle keyboard navigation for modal
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Navigate to full comparison page
  const handleViewFullComparison = useCallback(() => {
    if (!formattedData) return;
    navigate(`/compare?properties=${formattedData.propertyIds}`);
    onClose();
  }, [formattedData, navigate, onClose]);

  // Enhanced close handler to ensure proper event handling
  const handleClose = useCallback(
    (event?: React.MouseEvent) => {
      // Prevent event bubbling if this is a click event
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      onClose();
    },
    [onClose]
  );

  // Dynamic grid column calculation for responsive design - MOVED BEFORE EARLY RETURNS
  // We'll use CSS custom properties to avoid inline styles while maintaining dynamic behavior
  const gridColumnsStyle = useMemo(() => {
    if (!formattedData || formattedData.properties.length < 2) {
      return { "--grid-columns": "200px 1fr" } as React.CSSProperties;
    }
    return {
      "--grid-columns": `200px repeat(${formattedData.properties.length}, 1fr)`,
    } as React.CSSProperties;
  }, [formattedData]);

  // Handle focus management when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Add keyboard listener when modal opens
      document.addEventListener("keydown", handleKeyDown);
      // Focus the modal for screen reader users
      if (modalRef.current) {
        modalRef.current.focus();
      }
    }

    // Cleanup function to remove listener
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // NOW we can do early returns since all hooks have been called
  if (!isOpen) {
    return null;
  }

  if (!formattedData || formattedData.properties.length < 2) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="insufficient-properties-title"
        ref={modalRef}
        tabIndex={-1}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          role="document"
        >
          <div className="text-center">
            <h3
              id="insufficient-properties-title"
              className="text-lg font-semibold mb-2"
            >
              Not Enough Properties
            </h3>
            <p className="text-gray-600 mb-4">
              You need at least 2 properties to compare. Please select more
              properties and try again.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const { properties } = formattedData;

  // Comparison row component with proper accessibility
  // Fixed ARIA structure - removed role="cell" and role="rowheader" since we're not using role="row"
  const ComparisonRow = React.memo(
    ({
      label,
      icon,
      values,
    }: {
      label: string;
      icon: React.ReactNode;
      values: React.ReactNode[];
    }) => (
      <div className="comparison-row grid gap-4 py-3 border-b border-border/40 comparison-grid">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        {values.map((value, index) => (
          <div
            key={index}
            className="text-sm flex items-center justify-center p-2 rounded bg-gray-50"
          >
            {value || "—"}
          </div>
        ))}
      </div>
    )
  );

  // Set display name for React DevTools
  ComparisonRow.displayName = "ComparisonRow";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
      ref={modalRef}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        role="document"
      >
        {/* Header - Fixed height to prevent layout shifts */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 id="comparison-modal-title" className="text-2xl font-bold">
            Property Comparison
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label="Close comparison modal"
            className="hover:bg-gray-100 focus:ring-2 focus:ring-gray-300 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content - Scrollable area that doesn't interfere with footer */}
        <div className="flex-1 overflow-auto min-h-0" style={gridColumnsStyle}>
          <style>{`
            .comparison-grid {
              grid-template-columns: var(--grid-columns);
            }
          `}</style>
          <div className="p-6">
            {/* Property Headers */}
            <div className="property-headers grid gap-4 mb-6 comparison-grid">
              <div></div>
              {properties.map((property) => (
                <div key={property.id} className="text-center">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    {property.images?.[0] ?
                      <img
                        src={property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-12 h-12 text-gray-400" />
                      </div>
                    }
                  </div>
                  <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                    {property.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {renderLocation(property.location)}
                  </p>
                  {getVerificationBadge(property.status)}
                </div>
              ))}
            </div>

            {/* Comparison Rows - Removed problematic ARIA table roles */}
            <div
              className="comparison-table space-y-1"
              aria-label="Property comparison data"
            >
              <ComparisonRow
                label="Price"
                icon={<DollarSign className="w-4 h-4" />}
                values={properties.map((p) => formatPrice(p.price))}
              />

              <ComparisonRow
                label="Location"
                icon={<MapPin className="w-4 h-4" />}
                values={properties.map((p) => renderLocation(p.location))}
              />

              <ComparisonRow
                label="Bedrooms"
                icon={<Bed className="w-4 h-4" />}
                values={properties.map((p) => {
                  const bedrooms = getFeatures(p)?.bedrooms;
                  return bedrooms ? String(bedrooms) : "—";
                })}
              />

              <ComparisonRow
                label="Bathrooms"
                icon={<Bath className="w-4 h-4" />}
                values={properties.map((p) => {
                  const bathrooms = getFeatures(p)?.bathrooms;
                  return bathrooms ? String(bathrooms) : "—";
                })}
              />

              <ComparisonRow
                label="Area"
                icon={<Home className="w-4 h-4" />}
                values={properties.map((p) => {
                  const sqft = getFeatures(p)?.squareFeet;
                  return sqft ? `${Number(sqft).toLocaleString()} sq ft` : "—";
                })}
              />

              <ComparisonRow
                label="Parking"
                icon={<Car className="w-4 h-4" />}
                values={properties.map((p) => {
                  const parking = getFeatures(p)?.parkingSpaces;
                  return parking ? `${parking} spaces` : "—";
                })}
              />

              <ComparisonRow
                label="Year Built"
                icon={<Calendar className="w-4 h-4" />}
                values={properties.map((p) => {
                  const year = getFeatures(p)?.yearBuilt;
                  return year ? String(year) : "—";
                })}
              />

              <ComparisonRow
                label="Status"
                icon={<Shield className="w-4 h-4" />}
                values={properties.map((p) => getVerificationBadge(p.status))}
              />
            </div>
          </div>
        </div>

        {/* Footer - Fixed at bottom, no longer blocked by grid */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
          <p className="text-sm text-gray-600">
            Comparing {properties.length} properties
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={handleViewFullComparison}>
              View Full Comparison
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
