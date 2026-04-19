import { memo } from "react";
import { Link } from "react-router-dom";
import { MapPin, Home, Square, Maximize2 } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import VerificationBadge from "@/trust/components/VerificationBadge";
import type { Property } from "@shared/types/property";

// ─── Constants ────────────────────────────────────────────────────────────────

const AMENITIES_DISPLAY_LIMIT = 3;
const PLACEHOLDER_IMAGE = "/placeholder-property.jpg";
const PRICE_FORMAT = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derives the display location string from the LocationData object. */
function formatLocation(location: Property["location"]): string {
  const parts = [location.city, location.state, location.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : location.address;
}

/**
 * Returns category-appropriate specs for display.
 * Residential → bedrooms + sqft; Commercial → sqft; Land → size + unit.
 */
function getPropertySpecs(property: Property): Array<{ icon: React.ReactNode; label: string }> {
  const specs: Array<{ icon: React.ReactNode; label: string }> = [];
  const iconClass = "h-4 w-4 text-primary/80 flex-shrink-0";

  if (property.category === "residential") {
    const { bedrooms, squareFeet } = property.features;
    if (bedrooms > 0) {
      specs.push({
        icon: <Home className={iconClass} />,
        label: `${bedrooms} ${bedrooms === 1 ? "bed" : "beds"}`,
      });
    }
    if (squareFeet > 0) {
      specs.push({
        icon: <Square className={iconClass} />,
        label: `${squareFeet.toLocaleString()} sq ft`,
      });
    }
  }

  if (property.category === "commercial") {
    const { squareFeet } = property.features;
    if (squareFeet > 0) {
      specs.push({
        icon: <Square className={iconClass} />,
        label: `${squareFeet.toLocaleString()} sq ft`,
      });
    }
  }

  if (property.category === "land") {
    const { sizeValue, sizeUnit } = property.features;
    if (sizeValue > 0) {
      specs.push({
        icon: <Maximize2 className={iconClass} />,
        label: `${sizeValue.toLocaleString()} ${sizeUnit}`,
      });
    }
  }

  return specs;
}

/** Returns the first available image URL. */
function getPrimaryImage(property: Property): string {
  return property.images[0] ?? PLACEHOLDER_IMAGE;
}

/** Returns displayable amenities for residential properties only. */
function getAmenities(property: Property): string[] {
  if (property.category === "residential") {
    return property.features.amenities ?? [];
  }
  return [];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ListingCardProps {
  property: Property;
}

/**
 * ListingCard — displays a property summary across all three categories
 * (residential, commercial, land). Category-specific specs are derived
 * via `getPropertySpecs` to avoid feature-shape assumptions.
 *
 * Accessibility: a single stretched link covers the card; the title is
 * the semantic anchor text. Amenity badges and the footer sit above the
 * link in z-index to remain independently interactive.
 */
const ListingCard = memo(function ListingCard({ property }: ListingCardProps) {
  const primaryImage  = getPrimaryImage(property);
  const location      = formatLocation(property.location);
  const specs         = getPropertySpecs(property);
  const amenities     = getAmenities(property);
  const shownAmenities = amenities.slice(0, AMENITIES_DISPLAY_LIMIT);
  const hiddenCount   = amenities.length - AMENITIES_DISPLAY_LIMIT;
  const formattedPrice = PRICE_FORMAT.format(property.price);

  const handleImageError: React.ReactEventHandler<HTMLImageElement> = (e) => {
    e.currentTarget.src = PLACEHOLDER_IMAGE;
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white rounded-xl border-0 shadow-md">

      {/*
        Single stretched link covers the entire card for keyboard and pointer
        navigation. The title below is the semantic anchor text.
        Interactive children (badges, footer) are raised above via z-10.
      */}
      <Link
        to={`/property/${property.id}`}
        aria-label={`View listing: ${property.title}`}
        className="absolute inset-0 z-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
      />

      {/* ── Image ── */}
      <div className="relative overflow-hidden">
        <img
          src={primaryImage}
          alt={`${property.title} — property listing`}
          className="w-full h-56 object-cover transform group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={handleImageError}
        />

        <div className="absolute top-4 right-4 z-10">
          <VerificationBadge status={property.verificationStatus} />
        </div>

        {/* Gradient for price legibility */}
        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>

      {/* ── Body ── */}
      <CardContent className="p-5">
        <div className="space-y-3">

          {/* Title — semantic text for the stretched link above */}
          <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" aria-hidden />
            <span className="text-sm font-medium truncate">{location}</span>
          </div>

          {/* Specs + price */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-5">
              {specs.map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-gray-700">
                  {icon}
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
            <p className="font-semibold text-lg text-primary whitespace-nowrap ml-4">
              {formattedPrice}
            </p>
          </div>

        </div>
      </CardContent>

      {/* ── Amenities footer (residential only) ── */}
      {shownAmenities.length > 0 && (
        <CardFooter className="relative z-10 px-5 py-4 bg-gray-50 border-t flex flex-wrap gap-2">
          {shownAmenities.map((amenity) => (
            <Badge
              key={amenity}
              variant="secondary"
              className="text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-0"
            >
              {amenity}
            </Badge>
          ))}

          {hiddenCount > 0 && (
            <Badge variant="outline" className="text-xs text-gray-500 border-gray-300">
              +{hiddenCount} more
            </Badge>
          )}
        </CardFooter>
      )}

    </Card>
  );
});

export default ListingCard;