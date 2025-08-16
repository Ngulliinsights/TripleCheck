import React, { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Badge } from "../../../../shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../shared/components/ui/card";
import { WizardStepProps } from "../types";

export function AdaptedPreviewStep({
  data,
  onUpdate,
  onValidation,
}: Readonly<WizardStepProps>) {
  // Preview step is always valid
  useEffect(() => {
    onValidation?.(true);
  }, [onValidation]);

  const formatPrice = (price: number) => {
    return price ? `KSH ${price.toLocaleString()}` : "Price not set";
  };

  const formatLocation = () => {
    const { address, city, county, state } = data.location;
    const parts = [address, city, county || state].filter(Boolean);
    return parts.join(", ") || "Location not set";
  };

  const getFeatures = () => {
    const features = data.features || [];
    const amenities = data.amenities || [];
    // Combine and deduplicate
    const allFeatures = [...new Set([...features, ...amenities])];
    return allFeatures;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Review Your Listing</h3>
        <p className="text-muted-foreground">
          Please review all information before submitting your property listing.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Basic Information</h4>
              <p className="text-sm text-muted-foreground">
                Title: {data.title || "Not set"}
              </p>
              <p className="text-sm text-muted-foreground">
                Type: {data.propertyType || "Not set"}
              </p>
              <p className="text-sm text-muted-foreground">
                Price: {formatPrice(data.price)}
              </p>
              <p className="text-sm text-muted-foreground">
                Size: {data.area || "Not set"}
                {data.area && typeof data.area === "number" ? " sqm" : ""}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Location</h4>
              <p className="text-sm text-muted-foreground">
                {formatLocation()}
              </p>
              {data.bedrooms && data.bathrooms && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Bedrooms: {data.bedrooms}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Bathrooms: {data.bathrooms}
                  </p>
                </>
              )}
            </div>
          </div>

          {data.description && (
            <div>
              <h4 className="font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {data.description}
              </p>
            </div>
          )}

          {getFeatures().length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Features & Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {getFeatures().map((feature) => (
                  <Badge key={feature} variant="secondary">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Images</h4>
              <p className="text-sm text-muted-foreground">
                {(data.images?.length || 0) + (data.imageUrls?.length || 0)}{" "}
                photos uploaded
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Documents</h4>
              <p className="text-sm text-muted-foreground">
                {data.documents?.length || 0} documents uploaded
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Verification</h4>
              <p className="text-sm text-muted-foreground">
                {
                  [data.titleDeed, data.surveyPlan, data.ownershipProof].filter(
                    Boolean
                  ).length
                }{" "}
                verification documents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Next Steps</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Your listing will be reviewed within 24 hours</li>
          <li>• You'll receive email updates on the verification status</li>
          <li>• Once approved, your property will be live on the platform</li>
        </ul>
      </div>
    </div>
  );
}
