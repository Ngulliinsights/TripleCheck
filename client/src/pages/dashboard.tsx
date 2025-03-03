import { useQuery } from "@tanstack/react-query";
import { Property } from "@shared/schema";
import ListingCard from "@/components/listing-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"]
  });

  const verifiedProperties = properties?.filter(
    p => p.verificationStatus === "verified"
  );
  const pendingProperties = properties?.filter(
    p => p.verificationStatus === "pending"
  );

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{properties?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Verified Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{verifiedProperties?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pendingProperties?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Properties</TabsTrigger>
          <TabsTrigger value="verified">Verified</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {properties?.map(property => (
              <ListingCard key={property.id} property={property} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="verified">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {verifiedProperties?.map(property => (
              <ListingCard key={property.id} property={property} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="pending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {pendingProperties?.map(property => (
              <ListingCard key={property.id} property={property} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
