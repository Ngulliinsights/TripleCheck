import { Bell, Home, TrendingUp, AlertTriangle } from "lucide-react"
import { useState } from "react"

import FormField from "../../shared/components/forms/FormField"
import { Button } from "../../shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../shared/components/ui/card"
import { Input } from "../../shared/components/ui/input"
import { Label } from "../../shared/components/ui/label"
import { Switch } from "../../shared/components/ui/switch"
import { useToast } from "../../shared/hooks/use-toast"
// import { useForm } from "../../shared/hooks/useFormValidation"

interface AlertPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function AlertsPage() {
  const { toast } = useToast();
  
  const [alertPreferences, setAlertPreferences] = useState<AlertPreference[]>([
    {
      id: "price-changes",
      name: "Price Changes",
      description: "Get notified when property prices change significantly",
      enabled: true
    },
    {
      id: "new-listings",
      name: "New Listings",
      description: "Receive alerts for new properties matching your criteria",
      enabled: true
    },
    {
      id: "verification-updates",
      name: "Verification Updates",
      description: "Stay informed about property verification status changes",
      enabled: false
    },
    {
      id: "market-alerts",
      name: "Market Alerts",
      description: "Get updates about market trends and opportunities",
      enabled: false
    }
  ]);

  const {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    handleSubmit,
    getFieldProps,
    getFieldError
  } = useForm({
    initialValues: {
      location: '',
      minPrice: '',
      maxPrice: '',
      propertyType: ''
    },
    validationRules: {
      location: {
        required: true,
        minLength: 2,
        maxLength: 100
      },
      minPrice: {
        numeric: true,
        min: 0,
        custom: (value: unknown, allValues?: unknown) => {
          if (value && (allValues as any)?.maxPrice && parseFloat(value as string) >= parseFloat((allValues as any).maxPrice)) {
            return 'Minimum price must be less than maximum price';
          }
          return null;
        }
      },
      maxPrice: {
        numeric: true,
        min: 0,
        custom: (value: unknown, allValues?: unknown) => {
          if (value && (allValues as any)?.minPrice && parseFloat(value as string) <= parseFloat((allValues as any).minPrice)) {
            return 'Maximum price must be greater than minimum price';
          }
          return null;
        }
      },
      propertyType: {
        required: true
      }
    },
    onSubmit: async (formData) => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
          title: "Alert preferences saved!",
          description: "You'll receive notifications based on your criteria.",
        });
      } catch (error) {
        toast({
          title: "Failed to save preferences",
          description: "Please try again.",
          variant: "destructive",
        });
        throw error;
      }
    }
  });

  const toggleAlert = (alertId: string) => {
    setAlertPreferences(prev =>
      prev.map(pref =>
        pref.id === alertId ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
    
    toast({
      title: "Alert preference updated",
      description: `${alertPreferences.find(p => p.id === alertId)?.name} alerts ${
        alertPreferences.find(p => p.id === alertId)?.enabled ? 'disabled' : 'enabled'
      }.`,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Real-Time Property Alerts</h1>
          <p className="text-muted-foreground">
            Stay updated with instant notifications about properties and market changes
          </p>
        </div>

        {/* Alert Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {alertPreferences.map(pref => (
                <div key={pref.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">{pref.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {pref.description}
                    </p>
                  </div>
                  <Switch
                    checked={pref.enabled}
                    onCheckedChange={() => toggleAlert(pref.id)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Alert Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Alert Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormField
                label="Location"
                type="text"
                placeholder="Enter preferred locations (e.g., Nairobi, Mombasa)"
                required
                helpText="Specify cities or areas where you want to receive alerts"
                error={getFieldError('location')}
                touched={touched.location}
                {...getFieldProps('location')}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Minimum Price (KES)"
                  type="number"
                  placeholder="0"
                  min={0}
                  helpText="Leave empty for no minimum"
                  error={getFieldError('minPrice')}
                  touched={touched.minPrice}
                  {...getFieldProps('minPrice')}
                />
                <FormField
                  label="Maximum Price (KES)"
                  type="number"
                  placeholder="10000000"
                  min={0}
                  helpText="Leave empty for no maximum"
                  error={getFieldError('maxPrice')}
                  touched={touched.maxPrice}
                  {...getFieldProps('maxPrice')}
                />
              </div>

              <FormField
                label="Property Type"
                type="select"
                required
                options={[
                  { value: '', label: 'Select property type' },
                  { value: 'apartment', label: 'Apartment' },
                  { value: 'house', label: 'House' },
                  { value: 'land', label: 'Land' },
                  { value: 'commercial', label: 'Commercial' },
                  { value: 'any', label: 'Any Type' }
                ]}
                error={getFieldError('propertyType')}
                touched={touched.propertyType}
                {...getFieldProps('propertyType')}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? 'Saving...' : 'Save Alert Preferences'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sample Alerts */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Recent Alerts</h2>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Home className="h-5 w-5 text-[#2C5282] mt-1" />
                <div>
                  <h3 className="font-medium">New Property Listed in Kilimani</h3>
                  <p className="text-sm text-muted-foreground">
                    3-bedroom apartment matching your criteria just listed at KES 25M
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    2 hours ago
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <TrendingUp className="h-5 w-5 text-green-500 mt-1" />
                <div>
                  <h3 className="font-medium">Price Drop Alert</h3>
                  <p className="text-sm text-muted-foreground">
                    Price reduced by 10% for a property in your watchlist
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    5 hours ago
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-1" />
                <div>
                  <h3 className="font-medium">Verification Status Update</h3>
                  <p className="text-sm text-muted-foreground">
                    A property in your watchlist has completed verification
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    1 day ago
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
