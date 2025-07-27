import { useOptimisticMutation } from "@shared/hooks/useOptimisticMutation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Home, Upload, Building, Map, Info } from "lucide-react";
import { useState, useCallback } from "react";

import { apiRequest } from "../../infrastructure/api/queryClient";
import { Button } from "../../shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card";
import { Input } from "../../shared/components/ui/input";
import { Label } from "../../shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shared/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../shared/components/ui/tabs";
import { Textarea } from "../../shared/components/ui/textarea";
import { useToast } from "../../shared/hooks/use-toast";

/* =========================================================================
   TYPE DEFINITIONS
   ========================================================================= */

/** Form state that mirrors the UI controls */
interface PropertyFormData {
  title: string;
  type: string;
  price: string;
  beds: string;
  baths: string;
  area: string;
  location: string;
  description: string;
  ownershipStatus: string;
}

/** Shape expected by the back-end */
interface PropertyApiData {
  ownerId: number;
  title: string;
  description: string;
  location: string;
  price: number;
  imageUrls: string[];
  features: {
    bedrooms: number;
    bathrooms: number;
    squareFeet: number;
    parkingSpaces: number;
    yearBuilt: number;
    amenities: string[];
  };
}

/* -------------------------------------------------------------------------
   Sidebar‐specific types
   ------------------------------------------------------------------------- */

interface BenefitItem {
  readonly text: string;
  readonly id: string;
}

interface PackageFeature {
  readonly feature: string;
  readonly id: string;
}

interface ListingPackage {
  readonly id: string;
  readonly name: string;
  readonly price: string;
  readonly period: string;
  readonly badge?: string;
  readonly features: readonly PackageFeature[];
  readonly isPopular?: boolean;
}

/* =========================================================================
   CONSTANTS & CONFIG
   ========================================================================= */

const STEPS = [
  { id: 1, label: "Basic Details", icon: Home },
  { id: 2, label: "Features", icon: Building },
  { id: 3, label: "Location", icon: Map },
  { id: 4, label: "Documents", icon: Upload },
] as const;

const API_PROPERTIES_ENDPOINT = "/api/properties";
const TEXT_RED_500_CLASS = "text-red-500";
const BORDER_RED_200_CLASS = "border-red-200";
const DOCUMENT_FORMAT_TEXT = "PDF, JPG, PNG (max 5MB)";

const INITIAL_PROPERTY_DATA: PropertyFormData = {
  title: "",
  type: "apartment",
  price: "",
  beds: "",
  baths: "",
  area: "",
  location: "",
  description: "",
  ownershipStatus: "freehold",
};

/* -------------------------------------------------------------------------
   Sidebar data
   ------------------------------------------------------------------------- */

const LISTING_BENEFITS: readonly BenefitItem[] = [
  {
    id: "verified-buyers",
    text: "Access to verified buyers and tenants with proven trust scores",
  },
  {
    id: "blockchain-verified",
    text: "Blockchain-verified listing that increases buyer confidence",
  },
  {
    id: "priority-placement",
    text: "Priority placement in search results with verification badge",
  },
  {
    id: "build-reputation",
    text: "Build your reputation with a transparent track record",
  },
  {
    id: "reduced-time",
    text: "Reduced time to close deals through trusted platform",
  },
];

const LISTING_PACKAGES: readonly ListingPackage[] = [
  {
    id: "standard",
    name: "Standard Listing",
    price: "KES 2,500",
    period: "30-day listing period",
    features: [
      { id: "period", feature: "30-day listing period" },
      { id: "badge", feature: "Basic verification badge" },
      { id: "photos", feature: "Up to 10 photos" },
      { id: "placement", feature: "Standard search placement" },
    ],
  },
  {
    id: "premium",
    name: "Premium Listing",
    price: "KES 7,500",
    period: "90-day listing period",
    badge: "Best Value",
    isPopular: true,
    features: [
      { id: "period", feature: "90-day listing period" },
      { id: "badge", feature: "Premium verification badge" },
      { id: "photos", feature: "Unlimited photos + virtual tour" },
      { id: "featured", feature: "Featured in homepage carousel" },
      { id: "social", feature: "Social media promotion" },
      { id: "support", feature: "Priority customer support" },
    ],
  },
];

/* =========================================================================
   MAIN PAGE COMPONENT
   ========================================================================= */

export default function ListPropertyPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [propertyData, setPropertyData] = useState<PropertyFormData>(
    INITIAL_PROPERTY_DATA
  );

  /* ---------------------------------------------------------------------
     Event handlers
     --------------------------------------------------------------------- */

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setPropertyData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSelectChange = useCallback((name: string, value: string) => {
    setPropertyData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validateStep1 = useCallback(() => {
    const missingFields: string[] = [];
    if (!propertyData.title.trim()) missingFields.push("Property Title");
    if (!propertyData.type) missingFields.push("Property Type");
    if (!propertyData.price.trim()) missingFields.push("Price");
    return missingFields;
  }, [propertyData.title, propertyData.type, propertyData.price]);

  const validateStep2 = useCallback(() => {
    const missingFields: string[] = [];
    if (!propertyData.beds.trim()) missingFields.push("Bedrooms");
    if (!propertyData.baths.trim()) missingFields.push("Bathrooms");
    if (!propertyData.area.trim()) missingFields.push("Area");
    return missingFields;
  }, [propertyData.beds, propertyData.baths, propertyData.area]);

  const validateStep3 = useCallback(() => {
    const missingFields: string[] = [];
    if (!propertyData.location.trim()) missingFields.push("Location");
    if (!propertyData.description.trim()) missingFields.push("Description");
    return missingFields;
  }, [propertyData.location, propertyData.description]);

  const validateCurrentStep = useCallback((): {
    isValid: boolean;
    missingFields: string[];
  } => {
    let missingFields: string[] = [];

    if (currentStep === 1) missingFields = validateStep1();
    else if (currentStep === 2) missingFields = validateStep2();
    else if (currentStep === 3) missingFields = validateStep3();

    return { isValid: missingFields.length === 0, missingFields };
  }, [currentStep, validateStep1, validateStep2, validateStep3]);

  const handleStepChange = useCallback(
    (step: number) => {
      if (step < currentStep) {
        setCurrentStep(step);
        return;
      }
      const validation = validateCurrentStep();
      if (validation.isValid) {
        setCurrentStep(step);
      } else {
        toast({
          title: "Please complete required fields",
          description: `Missing: ${validation.missingFields.join(", ")}`,
          variant: "destructive",
        });
      }
    },
    [currentStep, validateCurrentStep, toast]
  );

  /* ---------------------------------------------------------------------
     Mutation
     --------------------------------------------------------------------- */

  const createPropertyMutation = useOptimisticMutation({
    mutationFn: async (data: PropertyApiData) =>
      apiRequest("POST", API_PROPERTIES_ENDPOINT, data),
    queryKey: [API_PROPERTIES_ENDPOINT],
    optimisticUpdate: (oldData, variables) => {
      const newProperty = {
        id: `temp-${Date.now()}`,
        ...variables,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      return Array.isArray(oldData) ? [...oldData, newProperty] : [newProperty];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_PROPERTIES_ENDPOINT] });
      toast({
        title: "Property submitted successfully",
        description: "Your property listing is now pending verification.",
      });
      setPropertyData(INITIAL_PROPERTY_DATA);
      setCurrentStep(1);
    },
    onError: (error: Error) =>
      toast({
        title: "Failed to submit property",
        description:
          error.message || "Please check your connection and try again.",
        variant: "destructive",
      }),
  });

  /* ---------------------------------------------------------------------
     Submission
     --------------------------------------------------------------------- */

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validation = validateCurrentStep();
      if (!validation.isValid) {
        toast({
          title: "Missing required information",
          description: `Please complete: ${validation.missingFields.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      const numericValues = {
        price: parseInt(propertyData.price, 10),
        beds: parseInt(propertyData.beds, 10),
        baths: parseInt(propertyData.baths, 10),
        area: parseInt(propertyData.area, 10),
      };

      if (isNaN(numericValues.price) || numericValues.price <= 0) {
        toast({
          title: "Invalid price",
          description: "Please enter a valid price amount.",
          variant: "destructive",
        });
        return;
      }

      if (
        isNaN(numericValues.beds) ||
        numericValues.beds < 0 ||
        isNaN(numericValues.baths) ||
        numericValues.baths < 0 ||
        isNaN(numericValues.area) ||
        numericValues.area <= 0
      ) {
        toast({
          title: "Invalid property features",
          description:
            "Please enter valid numbers for bedrooms, bathrooms, and area.",
          variant: "destructive",
        });
        return;
      }

      const formattedData: PropertyApiData = {
        ownerId: 1, // Note: Using placeholder ID - integrate with auth system
        title: propertyData.title.trim(),
        description: propertyData.description.trim(),
        location: propertyData.location.trim(),
        price: numericValues.price,
        imageUrls: [],
        features: {
          bedrooms: numericValues.beds,
          bathrooms: numericValues.baths,
          squareFeet: numericValues.area,
          parkingSpaces: 1,
          yearBuilt: new Date().getFullYear(),
          amenities: [],
        },
      };

      createPropertyMutation.mutate(formattedData);
    },
    [propertyData, validateCurrentStep, toast, createPropertyMutation]
  );

  const handleNextStep = useCallback(() => {
    const validation = validateCurrentStep();
    if (validation.isValid && currentStep < 4) setCurrentStep(currentStep + 1);
    else if (!validation.isValid)
      toast({
        title: "Complete required fields",
        description: `Missing: ${validation.missingFields.join(", ")}`,
        variant: "destructive",
      });
  }, [currentStep, validateCurrentStep, toast]);

  const handlePreviousStep = useCallback(() => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  }, [currentStep]);

  /* ---------------------------------------------------------------------
     Render
     --------------------------------------------------------------------- */

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 text-[#2C5282]">
          List Your Property
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Add your property to our trusted platform and reach verified buyers
          and tenants. All listings undergo our verification process to maintain
          trust in our ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main form area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
              <div className="text-sm text-gray-500">
                Step {currentStep} of {STEPS.length}
              </div>
            </CardHeader>

            <CardContent>
              <nav className="flex mb-6 border-b">
                {STEPS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={`flex items-center px-4 py-2 transition-colors duration-200 ${
                      currentStep === id ?
                        "text-[#2C5282] border-b-2 border-[#2C5282] bg-blue-50"
                      : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => handleStepChange(id)}
                    aria-current={currentStep === id ? "step" : undefined}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </nav>

              <form onSubmit={handleSubmit} noValidate>
                {/* ===== STEP 1: BASIC DETAILS ===== */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-sm font-medium">
                        Property Title{" "}
                        <span className={TEXT_RED_500_CLASS}>*</span>
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        value={propertyData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Modern Apartment in Kileleshwa"
                        className={
                          !propertyData.title.trim() ? BORDER_RED_200_CLASS : ""
                        }
                        required
                        aria-describedby="title-help"
                      />
                      <p id="title-help" className="text-xs text-gray-500">
                        Choose a descriptive title that highlights your
                        property&apos;s best features
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-medium">
                        Property Type{" "}
                        <span className={TEXT_RED_500_CLASS}>*</span>
                      </Label>
                      <Select
                        value={propertyData.type}
                        onValueChange={(value) =>
                          handleSelectChange("type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="villa">Villa</SelectItem>
                          <SelectItem value="townhouse">Townhouse</SelectItem>
                          <SelectItem value="land">Land</SelectItem>
                          <SelectItem value="commercial">Commercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">
                        Price (KES){" "}
                        <span className={TEXT_RED_500_CLASS}>*</span>
                      </Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        value={propertyData.price}
                        onChange={handleInputChange}
                        placeholder="e.g., 5000000"
                        min="0"
                        step="1000"
                        className={
                          !propertyData.price.trim() ? BORDER_RED_200_CLASS : ""
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="ownershipStatus"
                        className="text-sm font-medium"
                      >
                        Ownership Status{" "}
                        <span className={TEXT_RED_500_CLASS}>*</span>
                      </Label>
                      <Select
                        value={propertyData.ownershipStatus}
                        onValueChange={(value) =>
                          handleSelectChange("ownershipStatus", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select ownership status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="freehold">Freehold</SelectItem>
                          <SelectItem value="leasehold">Leasehold</SelectItem>
                          <SelectItem value="sharehold">Sharehold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* ===== STEP 2: FEATURES ===== */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="beds" className="text-sm font-medium">
                          Bedrooms <span className={TEXT_RED_500_CLASS}>*</span>
                        </Label>
                        <Input
                          id="beds"
                          name="beds"
                          type="number"
                          value={propertyData.beds}
                          onChange={handleInputChange}
                          min="0"
                          max="20"
                          className={
                            !propertyData.beds.trim() ?
                              BORDER_RED_200_CLASS
                            : ""
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="baths" className="text-sm font-medium">
                          Bathrooms{" "}
                          <span className={TEXT_RED_500_CLASS}>*</span>
                        </Label>
                        <Input
                          id="baths"
                          name="baths"
                          type="number"
                          value={propertyData.baths}
                          onChange={handleInputChange}
                          min="0"
                          max="20"
                          className={
                            !propertyData.baths.trim() ?
                              BORDER_RED_200_CLASS
                            : ""
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area" className="text-sm font-medium">
                          Area (sq. ft){" "}
                          <span className={TEXT_RED_500_CLASS}>*</span>
                        </Label>
                        <Input
                          id="area"
                          name="area"
                          type="number"
                          value={propertyData.area}
                          onChange={handleInputChange}
                          min="1"
                          step="1"
                          className={
                            !propertyData.area.trim() ?
                              BORDER_RED_200_CLASS
                            : ""
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Amenities</Label>
                      <p className="text-xs text-gray-500">
                        Select all amenities available in your property
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {[
                          { id: "swimming-pool", label: "Swimming Pool" },
                          { id: "gym", label: "Gym" },
                          { id: "security", label: "24/7 Security" },
                          { id: "parking", label: "Parking" },
                          { id: "balcony", label: "Balcony" },
                          { id: "garden", label: "Garden" },
                          { id: "elevator", label: "Elevator" },
                          { id: "backup-power", label: "Backup Power" },
                          { id: "water-backup", label: "Water Backup" },
                        ].map(({ id, label }) => (
                          <div key={id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={id}
                              className="rounded border-gray-300 text-[#2C5282] focus:ring-[#2C5282]"
                              aria-label={label}
                            />
                            <Label htmlFor={id} className="text-sm">
                              {label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== STEP 3: LOCATION ===== */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium">
                        Address/Location{" "}
                        <span className={TEXT_RED_500_CLASS}>*</span>
                      </Label>
                      <Input
                        id="location"
                        name="location"
                        value={propertyData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Kileleshwa, Nairobi"
                        className={
                          !propertyData.location.trim() ?
                            BORDER_RED_200_CLASS
                          : ""
                        }
                        required
                      />
                      <p className="text-xs text-gray-500">
                        Include neighborhood, estate name, and city for better
                        visibility
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        Property Description{" "}
                        <span className={TEXT_RED_500_CLASS}>*</span>
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={propertyData.description}
                        onChange={handleInputChange}
                        placeholder="Provide a detailed description of your property, including unique features, nearby amenities, and what makes it special..."
                        rows={6}
                        className={`${!propertyData.description.trim() ? BORDER_RED_200_CLASS : ""} resize-none`}
                        maxLength={1000}
                        required
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>
                          Be detailed and highlight unique selling points
                        </span>
                        <span>{propertyData.description.length}/1000</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Property Location
                      </Label>
                      <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <Map className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-500 font-medium mb-2">
                            Interactive map coming soon
                          </p>
                          <p className="text-sm text-gray-400 mb-4">
                            Pin your exact property location for better
                            visibility
                          </p>
                          <Button type="button" variant="outline" size="sm">
                            <Map className="h-4 w-4 mr-2" />
                            Set Location on Map
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== STEP 4: DOCUMENTS ===== */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Required Documents
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Upload the following documents to verify your property
                        ownership. All documents are encrypted and securely
                        stored.
                      </p>

                      <div className="space-y-4">
                        {[
                          {
                            title: "Title Deed / Ownership Documents",
                            description:
                              "Original title deed or certificate of title",
                            format: DOCUMENT_FORMAT_TEXT,
                            required: true,
                          },
                          {
                            title: "Land Rate Receipt",
                            description: "Recent land rates payment receipt",
                            format: DOCUMENT_FORMAT_TEXT,
                            required: true,
                          },
                          {
                            title: "National ID / Passport",
                            description: "Government-issued identification",
                            format: DOCUMENT_FORMAT_TEXT,
                            required: true,
                          },
                          {
                            title: "Property Photos",
                            description:
                              "High-quality interior and exterior photos",
                            format: "JPG, PNG (max 2MB each, up to 20 photos)",
                            required: false,
                          },
                        ].map((doc, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center mb-1">
                                  <h4 className="font-medium text-gray-900">
                                    {doc.title}
                                  </h4>
                                  {doc.required && (
                                    <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-1">
                                  {doc.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {doc.format}
                                </p>
                              </div>
                              <Button type="button" variant="outline" size="sm">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="terms"
                          className="mt-1 rounded border-gray-300 text-[#2C5282] focus:ring-[#2C5282]"
                          aria-label="Terms and conditions agreement"
                          required
                        />
                        <div>
                          <Label
                            htmlFor="terms"
                            className="font-medium text-gray-900"
                          >
                            I confirm that all information is accurate and
                            complete
                          </Label>
                          <p className="text-sm text-gray-600 mt-1">
                            By submitting this listing, you confirm that all
                            information provided is accurate, you have the legal
                            right to list this property, and you agree to our
                            terms of service and privacy policy.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== NAVIGATION ===== */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t">
                  {currentStep > 1 ?
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                    >
                      ← Previous
                    </Button>
                  : <div />}

                  {currentStep < 4 ?
                    <Button type="button" onClick={handleNextStep}>
                      Next →
                    </Button>
                  : <Button
                      type="submit"
                      disabled={createPropertyMutation.isPending}
                      className="flex items-center min-w-[140px]"
                    >
                      {createPropertyMutation.isPending ?
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Submitting...
                        </>
                      : "Submit Property"}
                    </Button>
                  }
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ===== SIDEBAR ===== */}
        <PropertyListingSidebar />
      </div>
    </div>
  );
}

/* =========================================================================
   SIDEBAR COMPONENTS
   ========================================================================= */

const BenefitsList: React.FC<{ benefits: readonly BenefitItem[] }> = ({
  benefits,
}) => (
  <div className="space-y-4" role="list">
    {benefits.map((benefit) => (
      <div key={benefit.id} className="flex items-start" role="listitem">
        <Check
          className="text-green-500 h-5 w-5 mr-3 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <span className="text-sm text-gray-700">{benefit.text}</span>
      </div>
    ))}
  </div>
);

const PackageCard: React.FC<{
  package: ListingPackage;
  isActive?: boolean;
}> = ({ package: pkg, isActive: _isActive = false }) => {
  const cardClasses =
    pkg.isPopular ?
      "bg-blue-50 p-4 rounded-lg border border-blue-200"
    : "bg-gray-50 p-4 rounded-lg border";

  const titleClasses =
    pkg.isPopular ?
      "font-semibold text-[#2C5282]"
    : "font-semibold text-gray-900";

  const priceClasses =
    pkg.isPopular ?
      "text-2xl font-bold mt-1 text-[#2C5282]"
    : "text-2xl font-bold mt-1 text-gray-900";

  return (
    <div className={cardClasses}>
      <div className="text-center mb-3">
        <h4 className={titleClasses}>{pkg.name}</h4>
        <div className={priceClasses}>{pkg.price}</div>
        {pkg.badge && (
          <div className="text-xs text-blue-600 bg-blue-100 inline-block px-2 py-1 rounded mt-1">
            {pkg.badge}
          </div>
        )}
      </div>
      <div className="space-y-2" role="list">
        {pkg.features.map((feature) => (
          <div
            key={feature.id}
            className="flex items-center text-sm"
            role="listitem"
          >
            <Check
              className="text-green-500 h-4 w-4 mr-2 flex-shrink-0"
              aria-hidden="true"
            />
            <span>{feature.feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PropertyListingSidebar: React.FC = () => (
  <div className="lg:col-span-1 space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Why List With Us?</CardTitle>
      </CardHeader>
      <CardContent>
        <BenefitsList benefits={LISTING_BENEFITS} />
        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <Info
              className="text-[#2C5282] h-5 w-5 mr-3 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div>
              <h4 className="font-medium text-[#2C5282] mb-1">
                Verification Process
              </h4>
              <p className="text-sm text-gray-700">
                All listings undergo rigorous verification, including document
                authentication and ownership validation. This typically takes
                24-48 hours and ensures buyer confidence.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Listing Packages</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="standard" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standard">Standard</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>
          {LISTING_PACKAGES.map((pkg) => (
            <TabsContent key={pkg.id} value={pkg.id} className="mt-4">
              <PackageCard package={pkg} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  </div>
);
