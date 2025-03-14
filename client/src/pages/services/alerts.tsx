import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Home, TrendingUp, AlertTriangle } from "lucide-react";

interface AlertPreference {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export default function AlertsPage() {
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

  const toggleAlert = (alertId: string) => {
    setAlertPreferences(prev =>
      prev.map(pref =>
        pref.id === alertId ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
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
            <form className="space-y-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter preferred locations"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minPrice">Minimum Price (KES)</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    placeholder="Minimum price"
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice">Maximum Price (KES)</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    placeholder="Maximum price"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="propertyType">Property Type</Label>
                <Input
                  id="propertyType"
                  placeholder="e.g., Apartment, House, Land"
                />
              </div>

              <Button type="submit" className="w-full">
                Save Alert Preferences
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
