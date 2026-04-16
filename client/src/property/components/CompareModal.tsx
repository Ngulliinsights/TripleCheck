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
} from "lucide-react"
import React, { useCallback, useMemo, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from '../../local/components/ui/button"
import {
  formatComparePrice,
  formatCompareLocation,
  safeGetPropertyImage,
  getComparePropertyTitle,
  getVerificationBadge,
  getFeatureValue,
} from '../../local/utils/compare-utils"
import type { CompareProperty } from '../../local/types/compare"
import { usePropertyCompare } from "../contexts"

// ─── ComparisonRow ────────────────────────────────────────────────────────────
// Defined outside the modal so it is never recreated on render.

interface ComparisonRowProps {
  label: string;
  icon: React.ReactNode;
  values: React.ReactNode[];
}

const ComparisonRow = React.memo(({ label, icon, values }: ComparisonRowProps) => (
  <div className="grid gap-4 py-3 border-b border-border/40 comparison-grid">
    <div className="flex items-center gap-2 text-sm font-medium">
      {icon}
      {label}
    </div>
    {values.map((value, index) => (
      <div
        key={index}
        className="text-sm flex items-center justify-center p-2 rounded bg-gray-50"
      >
        {value ?? "—"}
      </div>
    ))}
  </div>
));

ComparisonRow.displayName = "ComparisonRow";

// ─── CompareModal ─────────────────────────────────────────────────────────────

interface CompareModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CompareModal({ isOpen, onClose }: CompareModalProps) {
  const { selectedProperties } = usePropertyCompare();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  // ── Derived data (hooks must precede any early return) ──────────────────────

  const formattedData = useMemo(() => {
    if (!selectedProperties.length) return null;
    return {
      properties: selectedProperties,
      propertyCount: selectedProperties.length,
      propertyIds: selectedProperties.map((p) => p.id).join(","),
    };
  }, [selectedProperties]);

  /** CSS custom property drives the comparison grid layout. */
  const gridColumnsStyle = useMemo((): React.CSSProperties => {
    const cols = formattedData && formattedData.properties.length >= 2
      ? `200px repeat(${formattedData.properties.length}, 1fr)`
      : "200px 1fr";
    return { "--grid-columns": cols } as React.CSSProperties;
  }, [formattedData]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  const handleClose = useCallback(
    (event?: React.MouseEvent) => {
      event?.preventDefault();
      event?.stopPropagation();
      onClose();
    },
    [onClose]
  );

  const handleViewFullComparison = useCallback(() => {
    if (!formattedData) return;
    navigate(`/compare?properties=${formattedData.propertyIds}`);
    onClose();
  }, [formattedData, navigate, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    modalRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // ── Early returns ───────────────────────────────────────────────────────────

  if (!isOpen) return null;

  if (!formattedData || formattedData.properties.length < 2) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="insufficient-properties-title"
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" role="document">
          <div className="text-center">
            <h3 id="insufficient-properties-title" className="text-lg font-semibold mb-2">
              Not Enough Properties
            </h3>
            <p className="text-gray-600 mb-4">
              You need at least 2 properties to compare. Please select more properties and try again.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </div>
      </div>
    );
  }

  const { properties } = formattedData;

  // ── Render helpers ──────────────────────────────────────────────────────────

  const bedroomValues = properties.map((p) => {
    const v = getFeatureValue(p, "bedrooms");
    return v ? String(v) : null;
  });

  const bathroomValues = properties.map((p) => {
    const v = getFeatureValue(p, "bathrooms");
    return v ? String(v) : null;
  });

  const areaValues = properties.map((p) => {
    const v = getFeatureValue(p, "squareFeet");
    return v ? `${Number(v).toLocaleString()} sq ft` : null;
  });

  const parkingValues = properties.map((p) => {
    const v = getFeatureValue(p, "parkingSpaces");
    return v ? `${v} spaces` : null;
  });

  const yearValues = properties.map((p) => {
    const v = getFeatureValue(p, "yearBuilt");
    return v ? String(v) : null;
  });

  // ── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
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
        {/* Header */}
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

        {/* Scrollable content */}
        <div className="flex-1 overflow-auto min-h-0" style={gridColumnsStyle}>
          <div className="p-6">
            {/* Property headers */}
            <div className="grid gap-4 mb-6 comparison-grid">
              <div aria-hidden="true" />
              {properties.map((property) => {
                const imgSrc = safeGetPropertyImage(property);
                const title = getComparePropertyTitle(property);
                return (
                  <div key={property.id} className="text-center">
                    <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={title}
                          width={300}
                          height={200}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">{title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatCompareLocation(property.location)}
                    </p>
                    {getVerificationBadge(property.verificationStatus)}
                  </div>
                );
              })}
            </div>

            {/* Comparison rows */}
            <div className="space-y-1" aria-label="Property comparison data">
              <ComparisonRow
                label="Price"
                icon={<DollarSign className="w-4 h-4" />}
                values={properties.map((p) => formatComparePrice(p.price))}
              />
              <ComparisonRow
                label="Location"
                icon={<MapPin className="w-4 h-4" />}
                values={properties.map((p) => formatCompareLocation(p.location))}
              />
              <ComparisonRow
                label="Bedrooms"
                icon={<Bed className="w-4 h-4" />}
                values={bedroomValues}
              />
              <ComparisonRow
                label="Bathrooms"
                icon={<Bath className="w-4 h-4" />}
                values={bathroomValues}
              />
              <ComparisonRow
                label="Area"
                icon={<Home className="w-4 h-4" />}
                values={areaValues}
              />
              <ComparisonRow
                label="Parking"
                icon={<Car className="w-4 h-4" />}
                values={parkingValues}
              />
              <ComparisonRow
                label="Year Built"
                icon={<Calendar className="w-4 h-4" />}
                values={yearValues}
              />
              <ComparisonRow
                label="Status"
                icon={<Shield className="w-4 h-4" />}
                values={properties.map((p) => getVerificationBadge(p.verificationStatus))}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50 flex-shrink-0">
          <p className="text-sm text-gray-600">
            Comparing {properties.length} properties
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button onClick={handleViewFullComparison}>View Full Comparison</Button>
          </div>
        </div>
      </div>
    </div>
  );
}