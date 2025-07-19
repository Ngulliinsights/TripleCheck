import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card";
import { Button } from "../../shared/components/ui/button";
import { Input } from "../../shared/components/ui/input";
import { Label } from "../../shared/components/ui/label";
import { Textarea } from "../../shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui/select";
import { Checkbox } from "../../shared/components/ui/checkbox";
import { Badge } from "../../shared/components/ui/badge";
import { Separator } from "../../shared/components/ui/separator";
import { useToast } from "../../shared/hooks/use-toast";
import { apiRequest } from "../../infrastructure/api/queryClient";
import { Property, PropertyFeatures } from "../../shared/schema";
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  Trash2, 
  Plus,
  Home,
  MapPin,
  DollarSign,
  Bed,
  Bath,
  Square,
  Car,
  Calendar,
  Shield,
  Eye,
  Edit
} from "lucide-react";

interface PropertyEditPageProps {
  id: string;
}

export default function PropertyEditPage({ id }: PropertyEditPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    squareFeet: "",
    parkingSpaces: "",
    yearBuilt: "",
    propertyType: "apartment",
    petFriendly: false,
    furnished: false,
    amenities: [] as string[],
    imageUrls: [] as string[]
  });

  // Fetch property data
  const { data: property, isLoading, error } = useQuery<Property>({
    queryKey: [`/api/properties/${id}`],
    enabled: !!id
  });

  // Update form data when property loads
  useEffect(() => {
    if (property) {
      const features = property.features as PropertyFeatures;
      setFormData({
        title: property.title,
        description: property.description,
        location: property.location,
        price: property.price.toString(),
        bedrooms: features?.bedrooms?.toString() || "",
        bathrooms: features?.bathrooms?.toString() || "",
        squareFeet: features?.squareFeet?.toString() || "",
        parkingSpaces: features?.parkingSpaces?.toString() || "",
        yearBuilt: features?.yearBuilt?.toString() || "",
        propertyType: features?.propertyType || "apartment",
        petFriendly: features?.petFriendly || false,
        furnished: features?.furnished || false,
        amenities: features?.amenities || [],
        imageUrls: property.imageUrls || []
      });
    }
  }, [property]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/properties/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Property updated successfully",
        description: "Your changes have been saved",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/properties/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update property",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      price: parseInt(formData.price),
      imageUrls: formData.imageUrls,
      features: {
        bedrooms: parseInt(formData.bedrooms) || 0,
        bathrooms: parseInt(formData.bathrooms) || 0,
        squareFeet: parseInt(formData.squareFeet) || 0,
        parkingSpaces: parseInt(formData.parkingSpaces) || 0,
        yearBuilt: parseInt(formData.yearBuilt) || new Date().getFullYear(),
        propertyType: formData.propertyType,
        petFriendly: formData.petFriendly,
        furnished: formData.furnished,
        amenities: formData.amenities
      }
    };

    updateMutation.mutate(updateData);
  };

  const availableAmenities = [
    "Swimming Pool", "Gym", "Security", "Parking", "Garden", "Balcony",
    "Air Conditioning", "Internet", "Elevator", "Backup Generator",
    "Water Tank", "CCTV", "Intercom", "Playground", "Shopping Center"
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Property not found</h1>
          <p className="text-muted-foreground mb-6">
            The property you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <Button onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setLocation('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Edit Property</h1>
              <p className="text-muted-foreground">Update your property information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setLocation(`/property/${id}`)}>
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Badge variant={property.verificationStatus === 'verified' ? 'default' : 'secondary'}>
              {property.verificationStatus}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Modern 2BR Apartment in Westlands"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your property in detail..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="e.g., Westlands, Nairobi"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="price">Price (KES) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="85000"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property Features */}
          <Card>
            <CardHeader>
              <CardTitle>Property Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bedrooms"
                      type="number"
                      value={formData.bedrooms}
                      onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                      className="pl-9"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <div className="relative">
                    <Bath className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="bathrooms"
                      type="number"
                      value={formData.bathrooms}
                      onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                      className="pl-9"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="squareFeet">Square Feet</Label>
                  <div className="relative">
                    <Square className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="squareFeet"
                      type="number"
                      value={formData.squareFeet}
                      onChange={(e) => handleInputChange('squareFeet', e.target.value)}
                      className="pl-9"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="parkingSpaces">Parking</Label>
                  <div className="relative">
                    <Car className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="parkingSpaces"
                      type="number"
                      value={formData.parkingSpaces}
                      onChange={(e) => handleInputChange('parkingSpaces', e.target.value)}
                      className="pl-9"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="yearBuilt"
                      type="number"
                      value={formData.yearBuilt}
                      onChange={(e) => handleInputChange('yearBuilt', e.target.value)}
                      className="pl-9"
                      min="1900"
                      max={new Date().getFullYear() + 5}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select 
                    value={formData.propertyType} 
                    onValueChange={(value) => handleInputChange('propertyType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="house">House</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Additional Features</h3>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="petFriendly"
                      checked={formData.petFriendly}
                      onCheckedChange={(checked) => handleInputChange('petFriendly', checked)}
                    />
                    <Label htmlFor="petFriendly">Pet Friendly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="furnished"
                      checked={formData.furnished}
                      onCheckedChange={(checked) => handleInputChange('furnished', checked)}
                    />
                    <Label htmlFor="furnished">Furnished</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableAmenities.map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={formData.amenities.includes(amenity)}
                      onCheckedChange={() => handleAmenityToggle(amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm">
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Property Images</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Property ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newUrls = formData.imageUrls.filter((_, i) => i !== index);
                        handleInputChange('imageUrls', newUrls);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Add Images
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={() => setLocation('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}