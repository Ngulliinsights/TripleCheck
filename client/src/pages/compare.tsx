import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Home, 
  MapPin, 
  DollarSign, 
  Bed, 
  Bath, 
  Car, 
  Calendar,
  Shield,
  Star,
  ArrowLeftRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Property, PropertyFeatures } from "@shared/schema";

export default function PropertyComparePage() {
  const [selectedProperty1, setSelectedProperty1] = useState<string>("");
  const [selectedProperty2, setSelectedProperty2] = useState<string>("");

  // Fetch all properties
  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties']
  });

  // Get selected properties data
  const property1 = properties.find((p: Property) => p.id.toString() === selectedProperty1);
  const property2 = properties.find((p: Property) => p.id.toString() === selectedProperty2);

  // Helper function to safely get features
  const getFeatures = (property: Property | undefined): PropertyFeatures | null => {
    if (!property?.features) return null;
    return property.features as PropertyFeatures;
  };

  // Calculate comparison metrics
  const getComparisonValue = (prop1: any, prop2: any, key: string) => {
    const val1 = prop1?.[key];
    const val2 = prop2?.[key];
    
    if (val1 === val2) return "equal";
    if (val1 > val2) return "higher";
    return "lower";
  };

  const getFeatureComparison = (prop1: Property, prop2: Property, feature: keyof PropertyFeatures) => {
    const features1 = prop1?.features as PropertyFeatures;
    const features2 = prop2?.features as PropertyFeatures;
    const val1 = features1?.[feature];
    const val2 = features2?.[feature];
    
    if (val1 === val2) return "equal";
    if (typeof val1 === 'number' && typeof val2 === 'number') {
      return val1 > val2 ? "higher" : "lower";
    }
    return "different";
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Minus className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline"><Minus className="w-3 h-3 mr-1" />Unverified</Badge>;
    }
  };

  const ComparisonRow = ({ 
    label, 
    value1, 
    value2, 
    icon, 
    comparison,
    formatter = (v: any) => v
  }: {
    label: string;
    value1: any;
    value2: any;
    icon: React.ReactNode;
    comparison?: string;
    formatter?: (value: any) => any;
  }) => (
    <div className="grid grid-cols-7 gap-4 py-3 border-b border-border/40">
      <div className="col-span-2 flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      <div className={cn(
        "col-span-2 text-sm flex items-center justify-center p-2 rounded",
        comparison === "higher" && "bg-green-50 text-green-700 font-semibold",
        comparison === "lower" && "bg-red-50 text-red-600",
        comparison === "equal" && "bg-blue-50 text-blue-700"
      )}>
        {formatter(value1) || "—"}
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className={cn(
        "col-span-2 text-sm flex items-center justify-center p-2 rounded",
        comparison === "lower" && "bg-green-50 text-green-700 font-semibold",
        comparison === "higher" && "bg-red-50 text-red-600",
        comparison === "equal" && "bg-blue-50 text-blue-700"
      )}>
        {formatter(value2) || "—"}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Property Comparison</h1>
          <p className="text-muted-foreground">
            Compare properties side-by-side to make informed decisions
          </p>
        </div>

        {/* Property Selection */}
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
                <label className="text-sm font-medium">Property 1</label>
                <Select value={selectedProperty1} onValueChange={setSelectedProperty1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select first property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem 
                        key={property.id} 
                        value={property.id.toString()}
                        disabled={property.id.toString() === selectedProperty2}
                      >
                        {property.title} - {property.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Property 2</label>
                <Select value={selectedProperty2} onValueChange={setSelectedProperty2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select second property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem 
                        key={property.id} 
                        value={property.id.toString()}
                        disabled={property.id.toString() === selectedProperty1}
                      >
                        {property.title} - {property.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {property1 && property2 && (
          <div className="space-y-6">
            {/* Property Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{property1.title}</CardTitle>
                    {getVerificationBadge(property1.verificationStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {property1.location}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      {property1.imageUrls?.[0] ? (
                        <img 
                          src={property1.imageUrls[0]} 
                          alt={property1.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(property1.price)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {property1.description}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{property2.title}</CardTitle>
                    {getVerificationBadge(property2.verificationStatus)}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {property2.location}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      {property2.imageUrls?.[0] ? (
                        <img 
                          src={property2.imageUrls[0]} 
                          alt={property2.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Home className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatPrice(property2.price)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {property2.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {/* Price Comparison */}
                  <ComparisonRow
                    label="Price"
                    value1={property1.price}
                    value2={property2.price}
                    icon={<DollarSign className="w-4 h-4" />}
                    comparison={getComparisonValue(property1, property2, 'price')}
                    formatter={formatPrice}
                  />

                  {/* Location */}
                  <ComparisonRow
                    label="Location"
                    value1={property1.location}
                    value2={property2.location}
                    icon={<MapPin className="w-4 h-4" />}
                  />

                  {/* Bedrooms */}
                  <ComparisonRow
                    label="Bedrooms"
                    value1={getFeatures(property1)?.bedrooms}
                    value2={getFeatures(property2)?.bedrooms}
                    icon={<Bed className="w-4 h-4" />}
                    comparison={getFeatureComparison(property1, property2, 'bedrooms')}
                  />

                  {/* Bathrooms */}
                  <ComparisonRow
                    label="Bathrooms"
                    value1={getFeatures(property1)?.bathrooms}
                    value2={getFeatures(property2)?.bathrooms}
                    icon={<Bath className="w-4 h-4" />}
                    comparison={getFeatureComparison(property1, property2, 'bathrooms')}
                  />

                  {/* Square Feet */}
                  <ComparisonRow
                    label="Square Feet"
                    value1={getFeatures(property1)?.squareFeet}
                    value2={getFeatures(property2)?.squareFeet}
                    icon={<Home className="w-4 h-4" />}
                    comparison={getFeatureComparison(property1, property2, 'squareFeet')}
                    formatter={(v: number) => v ? `${v.toLocaleString()} sq ft` : undefined}
                  />

                  {/* Parking Spaces */}
                  <ComparisonRow
                    label="Parking Spaces"
                    value1={getFeatures(property1)?.parkingSpaces}
                    value2={getFeatures(property2)?.parkingSpaces}
                    icon={<Car className="w-4 h-4" />}
                    comparison={getFeatureComparison(property1, property2, 'parkingSpaces')}
                  />

                  {/* Year Built */}
                  <ComparisonRow
                    label="Year Built"
                    value1={getFeatures(property1)?.yearBuilt}
                    value2={getFeatures(property2)?.yearBuilt}
                    icon={<Calendar className="w-4 h-4" />}
                    comparison={getFeatureComparison(property1, property2, 'yearBuilt')}
                  />

                  {/* Verification Status */}
                  <div className="grid grid-cols-7 gap-4 py-3 border-b border-border/40">
                    <div className="col-span-2 flex items-center gap-2 text-sm font-medium">
                      <Shield className="w-4 h-4" />
                      Verification Status
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      {getVerificationBadge(property1.verificationStatus)}
                    </div>
                    <div className="col-span-1 flex items-center justify-center">
                      <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="col-span-2 flex items-center justify-center">
                      {getVerificationBadge(property2.verificationStatus)}
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
                    <h4 className="font-medium mb-3">{property1.title}</h4>
                    <div className="space-y-2">
                      {(getFeatures(property1)?.amenities || []).map((amenity: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">{property2.title}</h4>
                    <div className="space-y-2">
                      {(getFeatures(property2)?.amenities || []).map((amenity: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{amenity}</span>
                        </div>
                      ))}
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
                    <h4 className="font-medium">{property1.title}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Price per sq ft:</span>
                        <span className="font-medium">
                          {getFeatures(property1)?.squareFeet 
                            ? formatPrice(Math.round(property1.price / getFeatures(property1)!.squareFeet))
                            : "—"
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Price:</span>
                        <span className="font-medium">{formatPrice(property1.price)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">{property2.title}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Price per sq ft:</span>
                        <span className="font-medium">
                          {getFeatures(property2)?.squareFeet 
                            ? formatPrice(Math.round(property2.price / getFeatures(property2)!.squareFeet))
                            : "—"
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Price:</span>
                        <span className="font-medium">{formatPrice(property2.price)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {(!property1 || !property2) && (
          <Card>
            <CardContent className="py-16 text-center">
              <Home className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select Two Properties to Compare</h3>
              <p className="text-muted-foreground">
                Choose properties from the dropdowns above to see a detailed side-by-side comparison
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}