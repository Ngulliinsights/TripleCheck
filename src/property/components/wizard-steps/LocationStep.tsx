import React, { useEffect, useState, useCallback } from 'react';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Alert, AlertDescription } from '@shared/components/ui/alert';
import { PropertyMap } from '../PropertyMap';
import { PropertyFormData } from '../PropertyListingWizard';
import { MapPin, Navigation, Search, CheckCircle } from 'lucide-react';

interface LocationStepProps {
  data: PropertyFormData;
  onUpdate: (updates: Partial<PropertyFormData>) => void;
  onValidation: (isValid: boolean) => void;
}

export function LocationStep({ data, onUpdate, onValidation }: LocationStepProps) {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

  // Validate step
  useEffect(() => {
    const isValid = !!(data.location.address && data.location.city);
    onValidation(isValid);
  }, [data.location.address, data.location.city, onValidation]);

  const handleLocationChange = (field: keyof PropertyFormData['location'], value: string) => {
    onUpdate({
      location: {
        ...data.location,
        [field]: value
      }
    });
  };

  // Geocode address to get coordinates
  const geocodeAddress = useCallback(async () => {
    if (!data.location.address || !data.location.city) return;

    setIsGeocoding(true);
    setGeocodeError(null);

    try {
      const fullAddress = `${data.location.address}, ${data.location.city}, ${data.location.state || ''}, ${data.location.country}`;
      
      // Use Google Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      
      const result = await response.json();
      
      if (result.status === 'OK' && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        const addressComponents = result.results[0].address_components;
        
        // Extract city and state from geocoding result
        let city = data.location.city;
        let state = data.location.state;
        
        addressComponents.forEach((component: any) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
        });

        onUpdate({
          location: {
            ...data.location,
            city,
            state,
            coordinates: {
              lat: location.lat,
              lng: location.lng
            }
          }
        });
      } else {
        setGeocodeError('Could not find the specified address. Please check and try again.');
      }
    } catch (error) {
      setGeocodeError('Failed to geocode address. Please try again.');
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  }, [data.location, onUpdate]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeocodeError('Geolocation is not supported by this browser.');
      return;
    }

    setIsGeocoding(true);
    setGeocodeError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get address
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );
          
          const result = await response.json();
          
          if (result.status === 'OK' && result.results.length > 0) {
            const addressComponents = result.results[0].address_components;
            const formattedAddress = result.results[0].formatted_address;
            
            let address = '';
            let city = '';
            let state = '';
            
            addressComponents.forEach((component: any) => {
              if (component.types.includes('street_number') || component.types.includes('route')) {
                address += component.long_name + ' ';
              }
              if (component.types.includes('locality')) {
                city = component.long_name;
              }
              if (component.types.includes('administrative_area_level_1')) {
                state = component.long_name;
              }
            });

            onUpdate({
              location: {
                ...data.location,
                address: address.trim() || formattedAddress,
                city,
                state,
                coordinates: {
                  lat: latitude,
                  lng: longitude
                }
              }
            });
          }
        } catch (error) {
          setGeocodeError('Failed to get address from location.');
          console.error('Reverse geocoding error:', error);
        } finally {
          setIsGeocoding(false);
        }
      },
      (error) => {
        setGeocodeError('Failed to get your current location.');
        console.error('Geolocation error:', error);
        setIsGeocoding(false);
      }
    );
  }, [data.location, onUpdate]);

  // Address suggestions (mock implementation)
  const getAddressSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    // Mock suggestions - in real implementation, use Google Places API
    const mockSuggestions = [
      `${query}, Kileleshwa, Nairobi`,
      `${query}, Westlands, Nairobi`,
      `${query}, Karen, Nairobi`,
      `${query}, Lavington, Nairobi`,
      `${query}, Kilimani, Nairobi`
    ];
    
    setAddressSuggestions(mockSuggestions.slice(0, 3));
  }, []);

  return (
    <div className="space-y-6">
      {/* Address Input */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Address
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">
              Street Address *
              <span className="text-sm text-gray-500 ml-2">
                Enter the complete street address
              </span>
            </Label>
            <div className="relative">
              <Input
                id="address"
                value={data.location.address}
                onChange={(e) => {
                  handleLocationChange('address', e.target.value);
                  getAddressSuggestions(e.target.value);
                }}
                placeholder="e.g., 123 Riverside Drive"
                className="pr-10"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Address Suggestions */}
            {addressSuggestions.length > 0 && (
              <div className="border rounded-md bg-white shadow-sm">
                {addressSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const parts = suggestion.split(', ');
                      handleLocationChange('address', parts[0]);
                      if (parts[1]) handleLocationChange('city', parts[1]);
                      if (parts[2]) handleLocationChange('state', parts[2]);
                      setAddressSuggestions([]);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">
                City *
              </Label>
              <Input
                id="city"
                value={data.location.city}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                placeholder="e.g., Nairobi"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">
                County/State
              </Label>
              <Input
                id="state"
                value={data.location.state}
                onChange={(e) => handleLocationChange('state', e.target.value)}
                placeholder="e.g., Nairobi County"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">
              Country
            </Label>
            <Input
              id="country"
              value={data.location.country}
              onChange={(e) => handleLocationChange('country', e.target.value)}
              placeholder="Kenya"
            />
          </div>

          {/* Location Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={geocodeAddress}
              disabled={isGeocoding || !data.location.address || !data.location.city}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {isGeocoding ? 'Finding Location...' : 'Find on Map'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isGeocoding}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              Use Current Location
            </Button>
          </div>

          {/* Geocoding Error */}
          {geocodeError && (
            <Alert variant="destructive">
              <AlertDescription>{geocodeError}</AlertDescription>
            </Alert>
          )}

          {/* Coordinates Display */}
          {data.location.coordinates && (
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Location Confirmed</span>
              </div>
              <p className="text-sm text-green-700">
                Coordinates: {data.location.coordinates.lat.toFixed(6)}, {data.location.coordinates.lng.toFixed(6)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Map */}
      {data.location.coordinates && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Property Location Map</CardTitle>
          </CardHeader>
          <CardContent>
            <PropertyMap
              location={{
                lat: data.location.coordinates.lat,
                lng: data.location.coordinates.lng,
                address: data.location.address,
                title: data.title || 'Property Location'
              }}
              height="400px"
              showNearbyPlaces={true}
              interactive={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Location Tips */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">📍 Location Tips</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Provide the exact street address for accurate mapping</li>
            <li>• Use "Find on Map" to verify the location is correct</li>
            <li>• Accurate location helps buyers find your property easily</li>
            <li>• The map will show nearby amenities and transport links</li>
          </ul>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Step Completion</h4>
              <p className="text-sm text-gray-600">
                Complete all required fields to proceed
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant={data.location.address ? 'default' : 'secondary'}>
                Address {data.location.address ? '✓' : '○'}
              </Badge>
              <Badge variant={data.location.city ? 'default' : 'secondary'}>
                City {data.location.city ? '✓' : '○'}
              </Badge>
              <Badge variant={data.location.coordinates ? 'default' : 'secondary'}>
                Map {data.location.coordinates ? '✓' : '○'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}