import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Home, Upload, Building, Map, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ListPropertyPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data state
  const [propertyData, setPropertyData] = useState({
    title: "",
    type: "apartment",
    price: "",
    beds: "",
    baths: "",
    area: "",
    location: "",
    description: "",
    ownershipStatus: "freehold"
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPropertyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setPropertyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStepChange = (step: number) => {
    if (step < currentStep || validateCurrentStep()) {
      setCurrentStep(step);
    } else {
      toast({
        title: "Please complete all required fields",
        description: "Fill in all the required information before proceeding.",
        variant: "destructive"
      });
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return propertyData.title && propertyData.type && propertyData.price;
      case 2:
        return propertyData.beds && propertyData.baths && propertyData.area;
      case 3:
        return propertyData.location && propertyData.description;
      default:
        return true;
    }
  };

  const createPropertyMutation = useMutation({
    mutationFn: async (propertyData: any) => {
      const response = await apiRequest("POST", "/api/properties", propertyData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      toast({
        title: "Property submitted successfully",
        description: "Your property listing is now pending verification.",
      });
      
      // Reset form
      setPropertyData({
        title: "",
        type: "apartment",
        price: "",
        beds: "",
        baths: "",
        area: "",
        location: "",
        description: "",
        ownershipStatus: "freehold"
      });
      setCurrentStep(1);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit property",
        description: error.message || "Please try again later.",
        variant: "destructive"
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) {
      toast({
        title: "Missing information",
        description: "Please complete all required fields before submitting.",
        variant: "destructive"
      });
      return;
    }

    // Format property data for API
    const formattedData = {
      ownerId: 1, // TODO: Get from authenticated user
      title: propertyData.title,
      description: propertyData.description,
      location: propertyData.location,
      price: parseInt(propertyData.price),
      imageUrls: [], // TODO: Add image upload functionality
      features: {
        bedrooms: parseInt(propertyData.beds),
        bathrooms: parseInt(propertyData.baths),
        squareFeet: parseInt(propertyData.area),
        parkingSpaces: 1, // Default value
        yearBuilt: new Date().getFullYear(), // Default to current year
        amenities: [] // TODO: Add amenities selection
      }
    };

    createPropertyMutation.mutate(formattedData);
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-[#2C5282]">List Your Property</h1>
      <p className="text-lg mb-8">
        Add your property to our trusted platform and reach verified buyers and tenants.
        All listings undergo our verification process to maintain trust in our ecosystem.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex mb-6">
                <button
                  className={`flex items-center px-4 py-2 ${currentStep === 1 ? "text-[#2C5282] border-b-2 border-[#2C5282]" : "text-gray-500"}`}
                  onClick={() => handleStepChange(1)}
                >
                  <Home className="mr-2 h-5 w-5" />
                  <span>Basic Details</span>
                </button>
                <button
                  className={`flex items-center px-4 py-2 ${currentStep === 2 ? "text-[#2C5282] border-b-2 border-[#2C5282]" : "text-gray-500"}`}
                  onClick={() => handleStepChange(2)}
                >
                  <Building className="mr-2 h-5 w-5" />
                  <span>Features</span>
                </button>
                <button
                  className={`flex items-center px-4 py-2 ${currentStep === 3 ? "text-[#2C5282] border-b-2 border-[#2C5282]" : "text-gray-500"}`}
                  onClick={() => handleStepChange(3)}
                >
                  <Map className="mr-2 h-5 w-5" />
                  <span>Location</span>
                </button>
                <button
                  className={`flex items-center px-4 py-2 ${currentStep === 4 ? "text-[#2C5282] border-b-2 border-[#2C5282]" : "text-gray-500"}`}
                  onClick={() => handleStepChange(4)}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  <span>Documents</span>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Step 1: Basic Details */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Property Title*</Label>
                      <Input
                        id="title"
                        name="title"
                        value={propertyData.title}
                        onChange={handleInputChange}
                        placeholder="e.g., Modern Apartment in Kileleshwa"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Property Type*</Label>
                      <Select 
                        value={propertyData.type} 
                        onValueChange={(value) => handleSelectChange("type", value)}
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
                      <Label htmlFor="price">Price (KES)*</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        value={propertyData.price}
                        onChange={handleInputChange}
                        placeholder="e.g., 5000000"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ownershipStatus">Ownership Status*</Label>
                      <Select 
                        value={propertyData.ownershipStatus} 
                        onValueChange={(value) => handleSelectChange("ownershipStatus", value)}
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

                {/* Step 2: Features */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="beds">Bedrooms*</Label>
                        <Input
                          id="beds"
                          name="beds"
                          type="number"
                          value={propertyData.beds}
                          onChange={handleInputChange}
                          min="0"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="baths">Bathrooms*</Label>
                        <Input
                          id="baths"
                          name="baths"
                          type="number"
                          value={propertyData.baths}
                          onChange={handleInputChange}
                          min="0"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="area">Area (sq. ft)*</Label>
                        <Input
                          id="area"
                          name="area"
                          type="number"
                          value={propertyData.area}
                          onChange={handleInputChange}
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Amenities</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="swimming-pool" className="rounded" />
                          <label htmlFor="swimming-pool">Swimming Pool</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="gym" className="rounded" />
                          <label htmlFor="gym">Gym</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="security" className="rounded" />
                          <label htmlFor="security">24/7 Security</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="parking" className="rounded" />
                          <label htmlFor="parking">Parking</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="balcony" className="rounded" />
                          <label htmlFor="balcony">Balcony</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="garden" className="rounded" />
                          <label htmlFor="garden">Garden</label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Location */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Address/Location*</Label>
                      <Input
                        id="location"
                        name="location"
                        value={propertyData.location}
                        onChange={handleInputChange}
                        placeholder="e.g., Kileleshwa, Nairobi"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Property Description*</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={propertyData.description}
                        onChange={handleInputChange}
                        placeholder="Provide a detailed description of your property..."
                        rows={5}
                        required
                      />
                    </div>
                    
                    <div className="h-64 bg-gray-100 rounded-md flex items-center justify-center mb-4">
                      <div className="text-center">
                        <Map className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">Map location will be displayed here</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          Set Location
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Documents */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Required Documents</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Upload the following documents to verify your property ownership. All documents will be securely verified.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="border rounded-md p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">Title Deed / Ownership Documents</h4>
                              <p className="text-sm text-gray-500">PDF or image (max 5MB)</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        </div>
                        
                        <div className="border rounded-md p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">Land Rate Receipt</h4>
                              <p className="text-sm text-gray-500">PDF or image (max 5MB)</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        </div>
                        
                        <div className="border rounded-md p-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">ID/Passport</h4>
                              <p className="text-sm text-gray-500">PDF or image (max 5MB)</p>
                            </div>
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 pt-4">
                      <input type="checkbox" id="terms" className="mt-1 rounded" />
                      <div>
                        <label htmlFor="terms" className="font-medium">I confirm that all information is accurate</label>
                        <p className="text-sm text-gray-500">
                          By submitting this listing, you confirm that all the information provided is accurate and you have the legal right to list this property.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-8">
                  {currentStep > 1 ? (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setCurrentStep(currentStep - 1)}
                    >
                      Previous
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  
                  {currentStep < 4 ? (
                    <Button 
                      type="button"
                      onClick={() => validateCurrentStep() && setCurrentStep(currentStep + 1)}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" disabled={createPropertyMutation.isPending}>
                      {createPropertyMutation.isPending ? 'Submitting...' : 'Submit Property'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Benefits of Listing</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex">
                  <Check className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Access to verified buyers and tenants with proven trust scores</span>
                </li>
                <li className="flex">
                  <Check className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Blockchain-verified listing that increases buyer confidence</span>
                </li>
                <li className="flex">
                  <Check className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Priority placement in search results with verification badge</span>
                </li>
                <li className="flex">
                  <Check className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Build your reputation with a transparent track record</span>
                </li>
                <li className="flex">
                  <Check className="text-green-500 h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Reduced time to close deals through trusted platform</span>
                </li>
              </ul>

              <div className="mt-6 bg-blue-50 p-4 rounded-md">
                <div className="flex">
                  <Info className="text-[#2C5282] h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-[#2C5282]">Verification Process</h4>
                    <p className="text-sm mt-1">
                      All listings undergo a rigorous verification process, including document authentication 
                      and ownership validation. This typically takes 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Listing Packages</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="standard">
                <TabsList className="w-full">
                  <TabsTrigger value="standard" className="flex-1">Standard</TabsTrigger>
                  <TabsTrigger value="premium" className="flex-1">Premium</TabsTrigger>
                </TabsList>
                <TabsContent value="standard" className="pt-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="font-medium">Standard Listing</h4>
                    <div className="text-xl font-bold mb-2">KES 2,500</div>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center">
                        <Check className="text-green-500 h-4 w-4 mr-2" />
                        <span>30-day listing period</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="text-green-500 h-4 w-4 mr-2" />
                        <span>Basic verification badge</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="text-green-500 h-4 w-4 mr-2" />
                        <span>Up to 10 photos</span>
                      </li>
                    </ul>
                  </div>
                </TabsContent>
                <TabsContent value="premium" className="pt-4">
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium text-[#2C5282]">Premium Listing</h4>
                    <div className="text-xl font-bold mb-2">KES 7,500</div>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center">
                        <Check className="text-green-500 h-4 w-4 mr-2" />
                        <span>90-day listing period</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="text-green-500 h-4 w-4 mr-2" />
                        <span>Premium verification badge</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="text-green-500 h-4 w-4 mr-2" />
                        <span>Unlimited photos + virtual tour</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="text-green-500 h-4 w-4 mr-2" />
                        <span>Featured in homepage carousel</span>
                      </li>
                      <li className="flex items-center">
                        <Check className="text-green-500 h-4 w-4 mr-2" />
                        <span>Social media promotion</span>
                      </li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}