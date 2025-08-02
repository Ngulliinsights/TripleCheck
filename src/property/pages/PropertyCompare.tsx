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
import React, { useState, useMemo, useCallback, useEffect } from "react";

import { useCompare, CompareProvider } from "../contexts/CompareContext";
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

// Type-safe comparison result enum for better maintainability
type ComparisonResult = "equal" | "higher" | "lower" | "different";

// Type-safe verification status enum - Updated to match actual property type
type VerificationStatus = "verified" | "pending" | "unverified" | "draft" | undefined;

// Constants to avoid duplication
const LOCATION_NOT_SPECIFIED = "Location not specified";

function PropertyComparePageContent(): JSX.Element {
  const [selectedProperty1, setSelectedProperty1] = useState<string>("");
  const [selectedProperty2, setSelectedProperty2] = useState<string>("");
  
  // Get selected properties from compare context
  const { selectedProperties } = useCompare();

  // Fetch all properties with enhanced safety and validation
  const { data: properties } = useSafePropertiesQuery(undefined, {
    context: "property-compare",
    staleTime: 10 * 60 * 1000, // 10 minutes for comparison data
  });

  // Auto-populate from context when available
  useEffect(() => {
    if (selectedProperties.length >= 1 && !selectedProperty1) {
      setSelectedProperty1(selectedProperties[0].id);
    }
    if (selectedProperties.length >= 2 && !selectedProperty2) {
      setSelectedProperty2(selectedProperties[1].id);
    }
  }, [selectedProperties, selectedProperty1, selectedProperty2]);

  // Type-safe property selection with proper null checking
  const property1 = useMemo((): Property | undefined => {
    if (!Array.isArray(properties) || !selectedProperty1) return undefined;
    return properties.find((p: Property) => String(p.id) === selectedProperty1);
  }, [properties, selectedProperty1]);

  const property2 = useMemo((): Property | undefined => {
    if (!Array.isArray(properties) || !selectedProperty2) return undefined;
    return properties.find((p: Property) => String(p.id) === selectedProperty2);
  }, [properties, selectedProperty2]);

  // Helper function to safely get features with proper type checking
  const getFeatures = useCallback((property: Property | undefined): PropertyFeatures | null => {
    if (!property?.features) return null;
    return property.features as PropertyFeatures;
  }, []);

  // Type-safe property value accessor that prevents object injection
  const getPropertyValue = useCallback(<K extends keyof Property>(
    property: Property | undefined,
    key: K
  ): Property[K] | undefined => {
    if (!property) return undefined;
    
    // Using explicit key validation for security - addresses object injection warning
    const allowedKeys: (keyof Property)[] = [
      "price", "location", "title", "verificationStatus", "id", 
      "description", "imageUrls", "features", "aiVerificationResults"
    ];
    
    if (!allowedKeys.includes(key as keyof Property)) return undefined;
    
    // Safe property access with explicit validation
    if (key === "price") return property.price as Property[K];
    if (key === "location") return property.location as Property[K];
    if (key === "title") return property.title as Property[K];
    if (key === "verificationStatus") return property.verificationStatus as Property[K];
    if (key === "id") return property.id as Property[K];
    if (key === "description") return property.description as Property[K];
    if (key === "imageUrls") return property.imageUrls as Property[K];
    if (key === "features") return property.features as Property[K];
    if (key === "aiVerificationResults") return property.aiVerificationResults as Property[K];
    
    return undefined;
  }, []);

  // Enhanced comparison function with better type safety
  const getComparisonValue = useCallback((
    prop1: Property | undefined,
    prop2: Property | undefined,
    key: keyof Property
  ): ComparisonResult => {
    const val1 = getPropertyValue(prop1, key);
    const val2 = getPropertyValue(prop2, key);

    if (val1 === val2) return "equal";
    if (typeof val1 === "number" && typeof val2 === "number") {
      return val1 > val2 ? "higher" : "lower";
    }
    return "different";
  }, [getPropertyValue]);

  // Type-safe feature value accessor with proper validation
  const getFeatureValue = useCallback(<K extends keyof PropertyFeatures>(
    property: Property | undefined,
    feature: K
  ): PropertyFeatures[K] | undefined => {
    const features = getFeatures(property);
    if (!features) return undefined;
    
    // Explicit feature validation for security - addresses object injection warning
    const allowedFeatures: (keyof PropertyFeatures)[] = [
      "bedrooms", "bathrooms", "squareFeet", "parkingSpaces", 
      "yearBuilt", "amenities"
    ];
    
    if (!allowedFeatures.includes(feature as keyof PropertyFeatures)) return undefined;
    
    // Safe feature access with explicit validation
    if (feature === "bedrooms") return features.bedrooms as PropertyFeatures[K];
    if (feature === "bathrooms") return features.bathrooms as PropertyFeatures[K];
    if (feature === "squareFeet") return features.squareFeet as PropertyFeatures[K];
    if (feature === "parkingSpaces") return features.parkingSpaces as PropertyFeatures[K];
    if (feature === "yearBuilt") return features.yearBuilt as PropertyFeatures[K];
    if (feature === "amenities") return features.amenities as PropertyFeatures[K];
    
    return undefined;
  }, [getFeatures]);

  // Enhanced feature comparison with better type handling
  const getFeatureComparison = useCallback((
    prop1: Property | undefined,
    prop2: Property | undefined,
    feature: keyof PropertyFeatures
  ): ComparisonResult => {
    const val1 = getFeatureValue(prop1, feature);
    const val2 = getFeatureValue(prop2, feature);

    if (val1 === val2) return "equal";
    if (typeof val1 === "number" && typeof val2 === "number") {
      return val1 > val2 ? "higher" : "lower";
    }
    return "different";
  }, [getFeatureValue]);

  // Enhanced price formatting with error handling
  const formatPrice = useCallback((price: number | undefined): string => {
    if (typeof price !== "number" || isNaN(price)) return "—";
    
    try {
      return new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0,
      }).format(price);
    } catch {
      // Handle formatting error by falling back to basic formatting
      return `KES ${price.toLocaleString()}`;
    }
  }, []);

  // Type-safe location formatter that handles string locations
  const formatLocation = useCallback((location: unknown): string => {
    if (typeof location === 'string') {
      return location || LOCATION_NOT_SPECIFIED;
    }
    if (Array.isArray(location) && location.length > 0) {
      return String(location[0]) || LOCATION_NOT_SPECIFIED;
    }
    return LOCATION_NOT_SPECIFIED;
  }, []);

  // Helper function to safely get title as string
  const getTitle = useCallback((property: Property | undefined): string => {
    if (!property?.title) return "Untitled Property";
    return String(property.title);
  }, []);

  // Enhanced verification badge with proper typing
  const getVerificationBadge = useCallback((status: VerificationStatus): JSX.Element => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case "unverified":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Unverified
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline">
            <Minus className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Minus className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Minus className="w-3 h-3 mr-1" />
            Unknown
          </Badge>
        );
    }
  }, []);

  // Enhanced comparison row component with proper display name
  const ComparisonRow = React.memo(({
    label,
    value1,
    value2,
    icon,
    comparison,
    formatter = (v: unknown): React.ReactNode => (v != null ? String(v) : "—"),
  }: {
    label: string;
    value1: unknown;
    value2: unknown;
    icon: React.ReactNode;
    comparison?: ComparisonResult;
    formatter?: (value: unknown) => React.ReactNode;
  }): JSX.Element => {
    return (
      <div className="grid grid-cols-7 gap-4 py-3 border-b border-border/40">
        <div className="col-span-2 flex items-center gap-2 text-sm font-medium">
          {icon}
          {label}
        </div>
        <div
          className={cn(
            "col-span-2 text-sm flex items-center justify-center p-2 rounded",
            comparison === "higher" && "bg-green-50 text-green-700 font-semibold",
            comparison === "lower" && "bg-red-50 text-red-600",
            comparison === "equal" && "bg-blue-50 text-blue-700"
          )}
        >
          {formatter(value1)}
        </div>
        <div className="col-span-1 flex items-center justify-center">
          <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div
          className={cn(
            "col-span-2 text-sm flex items-center justify-center p-2 rounded",
            comparison === "lower" && "bg-green-50 text-green-700 font-semibold",
            comparison === "higher" && "bg-red-50 text-red-600",
            comparison === "equal" && "bg-blue-50 text-blue-700"
          )}
        >
          {formatter(value2)}
        </div>
      </div>
    );
  });

  ComparisonRow.displayName = "ComparisonRow";

  // Memoized calculations for performance optimization - Fixed dependencies
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

  // Helper function to get verification status safely
  const getVerificationStatus = useCallback((property: Property | undefined): VerificationStatus => {
    return property?.verificationStatus;
  }, []);

  return (
    <div className="container mx-auto px-4 navbar-offset pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Property Comparison</h1>
          <p className="text-muted-foreground">
            Compare properties side-by-side to make informed decisions
          </p>
        </div>

        {/* Property Selection Section */}
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
                <label
                  htmlFor="property1-select"
                  className="text-sm font-medium"
                >
                  Property 1
                </label>
                <Select
                  value={selectedProperty1}
                  onValueChange={setSelectedProperty1}
                >
                  <SelectTrigger id="property1-select">
                    <SelectValue placeholder="Select first property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((property) => (
                      <SelectItem
                        key={property.id}
                        value={String(property.id)}
                        disabled={String(property.id) === selectedProperty2}
                      >
                        {getTitle(property)} - {formatLocation(property.location)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="property2-select"
                  className="text-sm font-medium"
                >
                  Property 2
                </label>
                <Select
                  value={selectedProperty2}
                  onValueChange={setSelectedProperty2}
                >
                  <SelectTrigger id="property2-select">
                    <SelectValue placeholder="Select second property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties?.map((property) => (
                      <SelectItem
                        key={property.id}
                        value={String(property.id)}
                        disabled={String(property.id) === selectedProperty1}
                      >
                        {getTitle(property)} - {formatLocation(property.location)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results Section */}
        {property1 && property2 && comparisonData && (
          <div className="space-y-6">
            {/* Property Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{getTitle(property1)}</CardTitle>
                    {getVerificationBadge(getVerificationStatus(property1))}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {formatLocation(property1.location)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      {property1.imageUrls?.[0] ? (
                        <img
                          src={property1.imageUrls[0]}
                          alt={getTitle(property1)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(parseFloat(property1.price))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {property1.description || "No description available"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{getTitle(property2)}</CardTitle>
                    {getVerificationBadge(getVerificationStatus(property2))}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {formatLocation(property2.location)}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      {property2.imageUrls?.[0] ? (
                        <img
                          src={property2.imageUrls[0]}
                          alt={getTitle(property2)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(parseFloat(property2.price))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {property2.description || "No description available"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <ComparisonRow
                    label="Price"
                    value1={parseFloat(property1.price)}
                    value2={parseFloat(property2.price)}
                    icon={<DollarSign className="w-4 h-4" />}
                    comparison={comparisonData.priceComparison}
                    formatter={(value: unknown): React.ReactNode => formatPrice(value as number)}
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
                    formatter={(value: unknown): React.ReactNode =>
                      typeof value === "number" && value > 0
                        ? `${value.toLocaleString()} sq ft`
                        : "—"
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

                  {/* Verification Status Row */}
                  <div className="grid grid-cols-7 gap-4 py-3 border-b border-border/40">
                    <div className="col-span-2 flex items-center gap-2 text-sm font-medium">
                      <Shield className="w-4 h-4" />
                      Verification Status
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      {getVerificationBadge(getVerificationStatus(property1))}
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      {getVerificationBadge(getVerificationStatus(property2))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">{getTitle(property1)}</h4>
                    <div className="space-y-2">
                      {(getFeatureValue(property1, "amenities") as string[] || []).map(
                        (amenity: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{amenity}</span>
                          </div>
                        )
                      )}
                      {(!getFeatureValue(property1, "amenities") || (getFeatureValue(property1, "amenities") as string[])?.length === 0) && (
                        <p className="text-sm text-muted-foreground">No amenities listed</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">{getTitle(property2)}</h4>
                    <div className="space-y-2">
                      {(getFeatureValue(property2, "amenities") as string[] || []).map(
                        (amenity: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm">{amenity}</span>
                          </div>
                        )
                      )}
                      {(!getFeatureValue(property2, "amenities") || (getFeatureValue(property2, "amenities") as string[])?.length === 0) && (
                        <p className="text-sm text-muted-foreground">No amenities listed</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Price Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">{getTitle(property1)}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Price per sq ft:</span>
                        <span className="font-medium">
                          {(() => {
                            const sqft = getFeatureValue(property1, "squareFeet") as number;
                            const price = parseFloat(property1.price);
                            return sqft && sqft > 0 && price
                              ? formatPrice(Math.round(price / sqft))
                              : "—";
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Price:</span>
                        <span className="font-medium">
                          {formatPrice(parseFloat(property1.price))}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">{getTitle(property2)}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Price per sq ft:</span>
                        <span className="font-medium">
                          {(() => {
                            const sqft = getFeatureValue(property2, "squareFeet") as number;
                            const price = parseFloat(property2.price);
                            return sqft && sqft > 0 && price
                              ? formatPrice(Math.round(price / sqft))
                              : "—";
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Price:</span>
                        <span className="font-medium">
                          {formatPrice(parseFloat(property2.price))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Call-to-Action Section - Only show when both properties are selected */}
        {property1 && property2 && (
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="py-8">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Ready to Take the Next Step?
                  </h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Contact the property owners or schedule viewings to make your decision.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {/* Property 1 Actions */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">{property1.title}</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          // Navigate to property details
                          window.location.href = `/property/${property1.id}`;
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          // Contact functionality - could open a modal or navigate to contact page
                          window.location.href = `/contact?property=${property1.id}`;
                        }}
                      >
                        Contact Owner
                      </Button>
                    </div>
                  </div>
                  
                  {/* Property 2 Actions */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">{property2.title}</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          // Navigate to property details
                          window.location.href = `/property/${property2.id}`;
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          // Contact functionality
                          window.location.href = `/contact?property=${property2.id}`;
                        }}
                      >
                        Contact Owner
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
              {selectedProperties.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Go to the{" "}
                    <a href="/properties" className="underline hover:no-underline">
                      properties page
                    </a>{" "}
                    and click the compare button on properties you're interested in.
                  </p>
                </div>
              )}
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