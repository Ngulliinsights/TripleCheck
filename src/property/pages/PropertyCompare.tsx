import {
  ArrowLeftRight,
  Bath,
  Bed,
  Calendar,
  Car,
  CheckCircle,
  DollarSign,
  Home,
  MapPin,
  Minus,
  Shield,
  TrendingUp,
  XCircle,
} from "lucide-react";
import React, {
  useMemo,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import { Badge } from "../../shared/components/ui/badge";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shared/components/ui/select";
import { useSafePropertiesQuery } from "../../shared/hooks/useSafeQuery";
import { cn } from "../../shared/lib/utils";
import type { PropertyFeatures } from "../../shared/schema";
import type { Property } from "../../shared/types/property";
import { useCompare, CompareProvider } from "../contexts/CompareContext";

/* ---------- Constants ---------- */
const LOCATION_NOT_SPECIFIED = "Location not specified";
const PRICE_DISPLAY_FALLBACK = "—";
const CURRENCY_CODE = "KES";
const STALE_TIME_MS = 10 * 60 * 1000;
const DEFAULT_DESCRIPTION = "No description available";

/* ---------- Types ---------- */
type ComparisonResult = "equal" | "higher" | "lower" | "different";
type VerificationStatus =
  | "verified"
  | "pending"
  | "unverified"
  | "draft"
  | undefined;

// Create a more flexible property type that handles optional description
type FlexibleProperty = Omit<Property, 'description'> & {
  description?: string;
};

/* ---------- Guards & Utilities ---------- */
const isValidProperty = (property: unknown): property is FlexibleProperty =>
  typeof property === "object" &&
  property !== null &&
  "id" in property &&
  "price" in property &&
  "title" in property;

const ensurePropertyFields = (property: Record<string, unknown>): Property =>
  ({
    ...property,
    description: (property.description as string) || DEFAULT_DESCRIPTION,
  } as Property);

const isValidVerificationStatus = (status: unknown): status is VerificationStatus => {
  return status === undefined || 
    ["verified", "pending", "unverified", "draft"].includes(status as string);
};

const safeGetImageUrl = (imageUrls: unknown): string | undefined => {
  if (Array.isArray(imageUrls) && imageUrls.length > 0 && typeof imageUrls[0] === 'string') {
    return imageUrls[0];
  }
  return undefined;
};

const safeGetAmenities = (amenities: unknown): string[] => {
  if (Array.isArray(amenities)) {
    return amenities.filter((item): item is string => typeof item === 'string');
  }
  return [];
};

/* ---------- Main Component ---------- */
function PropertyComparePageContent(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProperty1, setSelectedProperty1] = useState<string>("");
  const [selectedProperty2, setSelectedProperty2] = useState<string>("");

  /* ---- Context & Data ---- */
  const { selectedProperties, addToCompare, clearCompare } = useCompare();
  const { data: properties } = useSafePropertiesQuery(undefined, {
    context: "property-compare",
    staleTime: STALE_TIME_MS,
  });

  /* ---- Sync URL params ↔ context ↔ local state ---- */
  useEffect(() => {
    const urlIds = searchParams.get("properties")?.split(",").filter(Boolean);
    if (urlIds && properties && Array.isArray(properties)) {
      clearCompare();
      urlIds.forEach((id) => {
        const foundProperty = properties.find((p) => String(p.id) === id);
        if (foundProperty && isValidProperty(foundProperty)) {
          addToCompare(ensurePropertyFields(foundProperty));
        }
      });
    }
  }, [searchParams, properties, clearCompare, addToCompare]);

  useEffect(() => {
    if (selectedProperties[0] && !selectedProperty1) {
      setSelectedProperty1(String(selectedProperties[0].id));
    }
    if (selectedProperties[1] && !selectedProperty2) {
      setSelectedProperty2(String(selectedProperties[1].id));
    }
  }, [selectedProperties, selectedProperty1, selectedProperty2]);

  /* ---- Selected Properties ---- */
  const property1 = useMemo(() => {
    if (!Array.isArray(properties)) return undefined;
    const found = properties.find((p) => String(p.id) === selectedProperty1);
    return found ? ensurePropertyFields(found) : undefined;
  }, [properties, selectedProperty1]);

  const property2 = useMemo(() => {
    if (!Array.isArray(properties)) return undefined;
    const found = properties.find((p) => String(p.id) === selectedProperty2);
    return found ? ensurePropertyFields(found) : undefined;
  }, [properties, selectedProperty2]);

  /* ---- Safe Accessors ---- */
  const getFeatures = useCallback(
    (property: Property | undefined): PropertyFeatures | null =>
      property?.features ? (property.features as PropertyFeatures) : null,
    []
  );

  const getPropertyValue = useCallback(
    <K extends keyof Property>(property: Property | undefined, key: K): Property[K] | undefined => {
      if (!property || !isValidProperty(property)) return undefined;
      const allowed: ReadonlyArray<keyof Property> = [
        "price",
        "location",
        "title",
        "verificationStatus",
        "id",
        "description",
        "imageUrls",
        "features",
        "aiVerificationResults",
      ];
      return allowed.includes(key) ? property[key] : undefined;
    },
    []
  );

  const getFeatureValue = useCallback(
    <K extends keyof PropertyFeatures>(
      property: Property | undefined,
      feature: K
    ): PropertyFeatures[K] | undefined => {
      const features = getFeatures(property);
      if (!features) return undefined;
      const allowed: ReadonlyArray<keyof PropertyFeatures> = [
        "bedrooms",
        "bathrooms",
        "squareFeet",
        "parkingSpaces",
        "yearBuilt",
        "amenities",
      ];
      return allowed.includes(feature) ? features[feature] : undefined;
    },
    [getFeatures]
  );

  /* ---- Comparators ---- */
  const getComparisonValue = useCallback(
    (
      p1: Property | undefined,
      p2: Property | undefined,
      key: keyof Property
    ): ComparisonResult => {
      const v1 = getPropertyValue(p1, key);
      const v2 = getPropertyValue(p2, key);
      if (v1 === v2) return "equal";
      if (typeof v1 === "number" && typeof v2 === "number") {
        return v1 > v2 ? "higher" : "lower";
      }
      return "different";
    },
    [getPropertyValue]
  );

  const getFeatureComparison = useCallback(
    (
      p1: Property | undefined,
      p2: Property | undefined,
      feat: keyof PropertyFeatures
    ): ComparisonResult => {
      const v1 = getFeatureValue(p1, feat);
      const v2 = getFeatureValue(p2, feat);
      if (v1 === v2) return "equal";
      if (typeof v1 === "number" && typeof v2 === "number") {
        return v1 > v2 ? "higher" : "lower";
      }
      return "different";
    },
    [getFeatureValue]
  );

  /* ---- Formatters ---- */
  const formatPrice = useCallback((price: number | string | undefined) => {
    if (price == null) return PRICE_DISPLAY_FALLBACK;
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;
    if (typeof numericPrice !== "number" || isNaN(numericPrice) || numericPrice < 0) {
      return PRICE_DISPLAY_FALLBACK;
    }
    try {
      return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: CURRENCY_CODE,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numericPrice);
    } catch {
      return `${CURRENCY_CODE} ${numericPrice.toLocaleString()}`;
    }
  }, []);

  const formatLocation = useCallback((location: unknown) => {
    if (typeof location === "string" && location.trim()) {
      return location.trim();
    }
    if (Array.isArray(location) && location.length && typeof location[0] === "string") {
      return location[0].trim();
    }
    return LOCATION_NOT_SPECIFIED;
  }, []);

  const getTitle = useCallback((property?: Property) => {
    return property?.title && String(property.title).trim()
      ? String(property.title).trim()
      : "Untitled Property";
  }, []);

  const getVerificationBadge = useCallback((status: unknown) => {
    const safeStatus = isValidVerificationStatus(status) ? status : undefined;
    const config = {
      verified: {
        cls: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Verified",
      },
      unverified: {
        cls: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Unverified",
      },
      draft: { 
        cls: "bg-gray-100 text-gray-800", 
        icon: Minus, 
        label: "Draft" 
      },
      pending: {
        cls: "bg-yellow-100 text-yellow-800",
        icon: Minus,
        label: "Pending",
      },
    };
    
    const finalConfig = config[safeStatus as keyof typeof config] ?? {
      cls: "bg-gray-100 text-gray-800",
      icon: Minus,
      label: "Unknown",
    };
    
    const Icon = finalConfig.icon;
    return (
      <Badge className={finalConfig.cls}>
        <Icon className="w-3 h-3 mr-1" />
        {finalConfig.label}
      </Badge>
    );
  }, []);

  /* ---- Comparison Row Component ---- */
  const ComparisonRow = React.memo(
    ({
      label,
      value1,
      value2,
      icon,
      comparison,
      formatter = (v: unknown) => (v != null ? String(v) : PRICE_DISPLAY_FALLBACK),
    }: {
      label: string;
      value1: unknown;
      value2: unknown;
      icon: React.ReactNode;
      comparison?: ComparisonResult;
      formatter?: (v: unknown) => React.ReactNode;
    }) => {
      const getStyle = (isFirst: boolean) => {
        if (!comparison || comparison === "different") return "";
        if (comparison === "equal") return "bg-blue-50 text-blue-700";
        const isHigher = comparison === "higher";
        return isHigher === isFirst
          ? "bg-green-50 text-green-700 font-semibold"
          : "bg-red-50 text-red-600";
      };
      
      return (
        <tr className="border-b border-border/40">
          <td className="py-3 flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </td>
          <td className={cn(
            "py-3 text-sm text-center p-2 rounded",
            getStyle(true)
          )}>
            {formatter(value1)}
          </td>
          <td className="py-3 text-center">
            <ArrowLeftRight className="w-4 h-4 text-muted-foreground mx-auto" />
          </td>
          <td className={cn(
            "py-3 text-sm text-center p-2 rounded",
            getStyle(false)
          )}>
            {formatter(value2)}
          </td>
        </tr>
      );
    }
  );
  ComparisonRow.displayName = "ComparisonRow";

  /* ---- Derived Data ---- */
  const comparisonData = useMemo(() => {
    if (!property1 || !property2) return null;
    return {
      priceComparison: getComparisonValue(property1, property2, "price"),
      bedroomsComparison: getFeatureComparison(property1, property2, "bedrooms"),
      bathroomsComparison: getFeatureComparison(property1, property2, "bathrooms"),
      squareFeetComparison: getFeatureComparison(property1, property2, "squareFeet"),
      parkingComparison: getFeatureComparison(property1, property2, "parkingSpaces"),
      yearBuiltComparison: getFeatureComparison(property1, property2, "yearBuilt"),
    };
  }, [property1, property2, getComparisonValue, getFeatureComparison]);

  /* ---- Event Handlers ---- */
  const handleProperty1Change = useCallback((id: string) => {
    setSelectedProperty1(id);
    setSearchParams(
      { properties: [id, selectedProperty2].filter(Boolean).join(",") },
      { replace: true }
    );
  }, [selectedProperty2, setSearchParams]);

  const handleProperty2Change = useCallback((id: string) => {
    setSelectedProperty2(id);
    setSearchParams(
      { properties: [selectedProperty1, id].filter(Boolean).join(",") },
      { replace: true }
    );
  }, [selectedProperty1, setSearchParams]);

  /* ---- Render ---- */
  return (
    <div className="container mx-auto px-4 navbar-offset pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Property Comparison</h1>
          <p className="text-muted-foreground">
            Compare properties side-by-side to make informed decisions
          </p>
        </div>

        {/* Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Select Properties to Compare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="property1-select" className="text-sm font-medium">
                  Property 1
                </label>
                <Select
                  value={selectedProperty1}
                  onValueChange={handleProperty1Change}
                >
                  <SelectTrigger id="property1-select">
                    <SelectValue placeholder="Select first property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={String(p.id)}
                        disabled={String(p.id) === selectedProperty2}
                      >
                        {getTitle(ensurePropertyFields(p))} – {formatLocation(p.location)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="property2-select" className="text-sm font-medium">
                  Property 2
                </label>
                <Select
                  value={selectedProperty2}
                  onValueChange={handleProperty2Change}
                >
                  <SelectTrigger id="property2-select">
                    <SelectValue placeholder="Select second property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((p) => (
                      <SelectItem
                        key={p.id}
                        value={String(p.id)}
                        disabled={String(p.id) === selectedProperty1}
                      >
                        {getTitle(ensurePropertyFields(p))} – {formatLocation(p.location)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {property1 && property2 && comparisonData && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[property1, property2].map((property) => (
                <Card key={property.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{getTitle(property)}</CardTitle>
                      {getVerificationBadge(property.verificationStatus)}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {formatLocation(property.location)}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                      {safeGetImageUrl(property.imageUrls) ? (
                        <img
                          src={safeGetImageUrl(property.imageUrls)}
                          alt={getTitle(property)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(property.price)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {property.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full" aria-label="Property comparison">
                  <tbody>
                    <ComparisonRow
                      label="Price"
                      value1={property1.price}
                      value2={property2.price}
                      icon={<DollarSign className="w-4 h-4" />}
                      comparison={comparisonData.priceComparison}
                      formatter={(v) => formatPrice(v as number)}
                    />
                    <ComparisonRow
                      label="Location"
                      value1={formatLocation(property1.location)}
                      value2={formatLocation(property2.location)}
                      icon={<MapPin className="w-4 h-4" />}
                    />
                    <ComparisonRow
                      label="Bedrooms"
                      value1={getFeatureValue(property1, "bedrooms")}
                      value2={getFeatureValue(property2, "bedrooms")}
                      icon={<Bed className="w-4 h-4" />}
                      comparison={comparisonData.bedroomsComparison}
                    />
                    <ComparisonRow
                      label="Bathrooms"
                      value1={getFeatureValue(property1, "bathrooms")}
                      value2={getFeatureValue(property2, "bathrooms")}
                      icon={<Bath className="w-4 h-4" />}
                      comparison={comparisonData.bathroomsComparison}
                    />
                    <ComparisonRow
                      label="Square Feet"
                      value1={getFeatureValue(property1, "squareFeet")}
                      value2={getFeatureValue(property2, "squareFeet")}
                      icon={<Home className="w-4 h-4" />}
                      comparison={comparisonData.squareFeetComparison}
                      formatter={(v) =>
                        typeof v === "number" && v > 0
                          ? `${v.toLocaleString()} sq ft`
                          : PRICE_DISPLAY_FALLBACK
                      }
                    />
                    <ComparisonRow
                      label="Parking Spaces"
                      value1={getFeatureValue(property1, "parkingSpaces")}
                      value2={getFeatureValue(property2, "parkingSpaces")}
                      icon={<Car className="w-4 h-4" />}
                      comparison={comparisonData.parkingComparison}
                    />
                    <ComparisonRow
                      label="Year Built"
                      value1={getFeatureValue(property1, "yearBuilt")}
                      value2={getFeatureValue(property2, "yearBuilt")}
                      icon={<Calendar className="w-4 h-4" />}
                      comparison={comparisonData.yearBuiltComparison}
                    />
                    <tr className="border-b border-border/40">
                      <td className="py-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-medium">Verification</span>
                      </td>
                      <td className="py-3 text-center">
                        {getVerificationBadge(property1.verificationStatus)}
                      </td>
                      <td className="py-3 text-center">
                        <ArrowLeftRight className="w-4 h-4 text-muted-foreground mx-auto" />
                      </td>
                      <td className="py-3 text-center">
                        {getVerificationBadge(property2.verificationStatus)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[property1, property2].map((property) => {
                    const amenities = safeGetAmenities(getFeatureValue(property, "amenities"));
                    return (
                      <div key={property.id}>
                        <h4 className="font-medium mb-3">{getTitle(property)}</h4>
                        <div className="space-y-2">
                          {amenities.length > 0 ? (
                            amenities.map((amenity, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm">{amenity}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No amenities listed
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Price Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[property1, property2].map((property) => {
                    const squareFeet = getFeatureValue(property, "squareFeet") as number;
                    const price = parseFloat(String(property.price));
                    const pricePerSqFt =
                      squareFeet && squareFeet > 0 && price && !isNaN(price)
                        ? formatPrice(Math.round(price / squareFeet))
                        : PRICE_DISPLAY_FALLBACK;
                    return (
                      <div key={property.id} className="space-y-4">
                        <h4 className="font-medium">{getTitle(property)}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Price per sq ft:</span>
                            <span className="font-medium">{pricePerSqFt}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Price:</span>
                            <span className="font-medium">
                              {formatPrice(price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="py-8">
                <div className="text-center space-y-6">
                  <h3 className="text-2xl font-bold">Ready to Take the Next Step?</h3>
                  <p className="text-muted-foreground">
                    Contact the property owners or schedule viewings to make your decision.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {[property1, property2].map((property) => (
                      <div key={property.id} className="space-y-4">
                        <h4 className="font-semibold text-lg">{getTitle(property)}</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button
                            className="flex-1"
                            onClick={() => (window.location.href = `/property/${property.id}`)}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() =>
                              (window.location.href = `/contact?property=${property.id}`)
                            }
                          >
                            Contact Owner
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {(!property1 || !property2) && (
          <Card>
            <CardContent className="py-16 text-center">
              <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Select Two Properties to Compare
              </h3>
              <p className="text-muted-foreground mb-6">
                Choose properties from the dropdowns above to see a detailed
                side-by-side comparison
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> Go to the{" "}
                  <a href="/properties" className="underline hover:no-underline">
                    properties page
                  </a>{" "}
                  and click the compare button on properties you&apos;re interested in.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PropertyComparePage(): JSX.Element {
  return (
    <CompareProvider>
      <PropertyComparePageContent />
    </CompareProvider>
  );
}