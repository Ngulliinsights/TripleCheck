import React, { useCallback, useMemo, useState } from "react";
import {
  Bath,
  Bed,
  Building2,
  Car,
  Home,
  MapPin,
  RotateCcw,
  Save,
  Search,
  Shield,
  Store,
  TreePine,
  Warehouse,
  Wifi,
  X,
} from "lucide-react";

import { Badge } from "../../local/components/ui/badge";
import { Button } from "../../local/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../local/components/ui/card";
import { Checkbox } from "../../local/components/ui/checkbox";
import { Input } from "../../local/components/ui/input";
import { Label } from "../../local/components/ui/label";
import { Slider } from "../../local/components/ui/slider";
import { useToast } from "../../local/hooks/use-toast";
import { NormalizedProperty } from "../../local/types/property";
import { PropertySearchFilters } from "../../local/types/search";

// ============================================================================
// Types
// ============================================================================

/**
 * Explicitly narrows array fields from the base interface so TypeScript
 * knows they are always defined arrays in this component.
 */
interface AdvancedSearchFilters extends PropertySearchFilters {
  query: string;
  location: string;
  propertyType: string[];
  amenities: string[];
  verificationStatus: string[];
  priceRange: [number, number];
  areaRange: [number, number];
  listingAge: number | null;
  sortBy: string;
  savedSearchName?: string;
}

interface SavedSearch {
  id: string;
  name: string;
  filters: AdvancedSearchFilters;
  createdAt: Date;
  alertsEnabled: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FILTERS: AdvancedSearchFilters = {
  query: "",
  location: "",
  propertyType: [],
  amenities: [],
  verificationStatus: [],
  priceRange: [0, 100_000_000],
  areaRange: [0, 10_000],
  listingAge: null,
  sortBy: "relevance",
};

const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment", icon: Building2 },
  { id: "house", label: "House", icon: Home },
  { id: "villa", label: "Villa", icon: Warehouse },
  { id: "townhouse", label: "Townhouse", icon: Building2 },
  { id: "land", label: "Land", icon: TreePine },
  { id: "commercial", label: "Commercial", icon: Store },
] as const;

const AMENITIES = [
  { id: "parking", label: "Parking", icon: Car },
  { id: "wifi", label: "WiFi", icon: Wifi },
  { id: "security", label: "24/7 Security", icon: Shield },
  { id: "gym", label: "Gym", icon: Warehouse },
  { id: "pool", label: "Swimming Pool", icon: Warehouse },
  { id: "garden", label: "Garden", icon: TreePine },
  { id: "balcony", label: "Balcony", icon: Warehouse },
  { id: "furnished", label: "Furnished", icon: Home },
] as const;

const VERIFICATION_STATUSES = [
  { id: "verified", label: "Verified", color: "bg-green-100 text-green-800" },
  { id: "pending", label: "Pending Verification", color: "bg-yellow-100 text-yellow-800" },
  { id: "unverified", label: "Unverified", color: "bg-gray-100 text-gray-800" },
] as const;

const SORT_OPTIONS = [
  { id: "relevance", label: "Most Relevant" },
  { id: "price-low", label: "Price: Low to High" },
  { id: "price-high", label: "Price: High to Low" },
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "area-large", label: "Largest Area" },
  { id: "area-small", label: "Smallest Area" },
] as const;

const MOCK_RESULTS: NormalizedProperty[] = [
  {
    id: "1",
    title: "Modern 3BR Apartment in Westlands",
    description: "Spacious apartment with modern amenities",
    price: 15_000_000,
    location: "Westlands, Nairobi",
    images: ["/assets/Residential/cytonn-photography-TVyhDpvL8MY-unsplash.jpg"],
    verified: true,
    type: "apartment",
    category: "residential",
    features: { bedrooms: 3, bathrooms: 2, squareFeet: 1200 },
    createdAt: new Date().toISOString(),
    status: "available",
    verificationStatus: "verified",
  },
  {
    id: "2",
    title: "Luxury Villa in Karen",
    description: "Beautiful villa with garden and pool",
    price: 45_000_000,
    location: "Karen, Nairobi",
    images: ["/assets/Residential/dillon-kydd-XGvwt544g8k-unsplash.jpg"],
    verified: true,
    type: "villa",
    category: "residential",
    features: { bedrooms: 5, bathrooms: 4, squareFeet: 3500 },
    createdAt: new Date().toISOString(),
    status: "available",
    verificationStatus: "verified",
  },
];

// ============================================================================
// Helpers
// ============================================================================

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(0)}M`;
  if (value >= 1_000) return `KES ${(value / 1_000).toFixed(0)}K`;
  return `KES ${value.toLocaleString()}`;
}

// ============================================================================
// Component
// ============================================================================

export default function AdvancedSearch(): JSX.Element {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AdvancedSearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<NormalizedProperty[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  const updateFilter = useCallback(<K extends keyof AdvancedSearchFilters>(
    key: K,
    value: AdvancedSearchFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleInArray = useCallback(<K extends "propertyType" | "amenities" | "verificationStatus">(
    key: K,
    value: string
  ) => {
    setFilters((prev) => {
      const arr = prev[key];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...prev, [key]: next };
    });
  }, []);

  const handleSearch = useCallback(async () => {
    setIsSearching(true);
    await new Promise((r) => setTimeout(r, 600));

    let filtered = MOCK_RESULTS;

    const q = filters.query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }

    if (filters.location.trim()) {
      const loc = filters.location.toLowerCase();
      filtered = filtered.filter((p) => p.location.toLowerCase().includes(loc));
    }

    if (filters.propertyType.length > 0) {
      filtered = filtered.filter((p) => filters.propertyType.includes(p.type));
    }

    if (filters.bedrooms != null) {
      filtered = filtered.filter((p) => p.features?.bedrooms === filters.bedrooms);
    }
    if (filters.bathrooms != null) {
      filtered = filtered.filter((p) => p.features?.bathrooms === filters.bathrooms);
    }

    filtered = filtered.filter(
      (p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    if (filters.verificationStatus.length > 0) {
      filtered = filtered.filter((p) =>
        filters.verificationStatus.includes(p.verificationStatus ?? "unverified")
      );
    }

    setResults(filtered);
    setIsSearching(false);
    toast({ title: "Search completed", description: `Found ${filtered.length} properties.` });
  }, [filters, toast]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setResults([]);
    toast({ title: "Filters reset", description: "All search filters have been cleared." });
  }, [toast]);

  const handleSaveSearch = useCallback(() => {
    const name = saveName.trim();
    if (!name) {
      toast({ title: "Please enter a name", variant: "destructive" });
      return;
    }
    if (savedSearches.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: "Name already exists", variant: "destructive" });
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      filters: { ...filters },
      createdAt: new Date(),
      alertsEnabled: true,
    };

    setSavedSearches((prev) => [...prev, newSearch]);
    setShowSaveDialog(false);
    setSaveName("");
    toast({ title: "Search saved", description: `"${name}" has been saved.` });
  }, [filters, saveName, savedSearches, toast]);

  const loadSavedSearch = useCallback((saved: SavedSearch) => {
    setFilters({ ...saved.filters });
    toast({ title: "Search loaded", description: `Loaded "${saved.name}".` });
  }, [toast]);

  const activeCount = useMemo(() => {
    let c = 0;
    if (filters.query.trim()) c++;
    if (filters.location.trim()) c++;
    if (filters.propertyType.length) c++;
    if (filters.amenities.length) c++;
    if (filters.verificationStatus.length) c++;
    if (filters.bedrooms != null) c++;
    if (filters.bathrooms != null) c++;
    if (filters.priceRange[0] !== DEFAULT_FILTERS.priceRange[0] || filters.priceRange[1] !== DEFAULT_FILTERS.priceRange[1]) c++;
    return c;
  }, [filters]);

  const removeFilter = useCallback((filterType: string, value?: string) => {
    switch (filterType) {
      case "query":
        updateFilter("query", "");
        break;
      case "location":
        updateFilter("location", "");
        break;
      case "bedrooms":
        updateFilter("bedrooms", undefined);
        break;
      case "bathrooms":
        updateFilter("bathrooms", undefined);
        break;
      case "propertyType":
      case "amenities":
      case "verificationStatus":
        if (value) toggleInArray(filterType, value);
        break;
    }
  }, [updateFilter, toggleInArray]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Search className="w-8 h-8" />
            Advanced Search
          </h1>
          <p className="text-muted-foreground">Find your perfect property with detailed search filters</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {savedSearches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Saved Searches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {savedSearches.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => loadSavedSearch(s)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <span className="text-sm font-medium truncate">{s.name}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {s.alertsEnabled ? "Alerts On" : "Alerts Off"}
                      </Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="query">Keywords</Label>
                  <Input
                    id="query"
                    placeholder="e.g., modern apartment..."
                    value={filters.query}
                    onChange={(e) => updateFilter("query", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Westlands, Karen..."
                    value={filters.location}
                    onChange={(e) => updateFilter("location", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Property Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {PROPERTY_TYPES.map((t) => (
                    <div key={t.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={t.id}
                        checked={filters.propertyType.includes(t.id)}
                        onCheckedChange={() => toggleInArray("propertyType", t.id)}
                      />
                      <Label htmlFor={t.id} className="text-sm cursor-pointer flex items-center gap-1">
                        <t.icon className="w-3.5 h-3.5" />
                        {t.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Price Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Slider
                  value={[filters.priceRange[0], filters.priceRange[1]]}
                  onValueChange={(v) => updateFilter("priceRange", v as [number, number])}
                  max={100_000_000}
                  step={1_000_000}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatPrice(filters.priceRange[0])}</span>
                  <span>{formatPrice(filters.priceRange[1])}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rooms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bedrooms</Label>
                  <select
                    value={filters.bedrooms?.toString() ?? ""}
                    onChange={(e) => updateFilter("bedrooms", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
                  >
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n}+ Bedrooms</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Bathrooms</Label>
                  <select
                    value={filters.bathrooms?.toString() ?? ""}
                    onChange={(e) => updateFilter("bathrooms", e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-background"
                  >
                    <option value="">Any</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}+ Bathrooms</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Amenities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {AMENITIES.map((a) => (
                  <div key={a.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={a.id}
                      checked={filters.amenities.includes(a.id)}
                      onCheckedChange={() => toggleInArray("amenities", a.id)}
                    />
                    <Label htmlFor={a.id} className="text-sm cursor-pointer flex items-center gap-2">
                      <a.icon className="w-4 h-4" />
                      {a.label}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {VERIFICATION_STATUSES.map((s) => (
                  <div key={s.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={s.id}
                      checked={filters.verificationStatus.includes(s.id)}
                      onCheckedChange={() => toggleInArray("verificationStatus", s.id)}
                    />
                    <Label htmlFor={s.id} className="text-sm cursor-pointer">
                      <Badge className={s.color}>{s.label}</Badge>
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Button onClick={handleSearch} className="w-full" disabled={isSearching}>
                <Search className="w-4 h-4 mr-2" />
                {isSearching ? "Searching..." : "Search Properties"}
              </Button>
              <Button variant="outline" onClick={handleReset} className="w-full" disabled={isSearching}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
              <Button variant="ghost" onClick={() => setShowSaveDialog(true)} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Save Search
              </Button>
            </div>
          </aside>

          {/* Results */}
          <section className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Search Results {results.length > 0 && `(${results.length})`}
                </h2>
                {activeCount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {activeCount} filter{activeCount !== 1 ? "s" : ""} applied
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="sort" className="text-sm whitespace-nowrap">Sort by:</Label>
                <select
                  id="sort"
                  value={filters.sortBy}
                  onChange={(e) => updateFilter("sortBy", e.target.value)}
                  className="px-3 py-1.5 border rounded-md text-sm bg-background"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.query.trim() && (
                  <Badge variant="secondary" className="gap-1">
                    &quot;{filters.query}&quot;
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("query")} />
                  </Badge>
                )}
                {filters.location.trim() && (
                  <Badge variant="secondary" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {filters.location}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("location")} />
                  </Badge>
                )}
                {filters.propertyType.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    <Home className="w-3 h-3" />
                    {PROPERTY_TYPES.find((pt) => pt.id === t)?.label ?? t}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("propertyType", t)} />
                  </Badge>
                ))}
                {filters.bedrooms != null && (
                  <Badge variant="secondary" className="gap-1">
                    <Bed className="w-3 h-3" />
                    {filters.bedrooms}+ Bedrooms
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("bedrooms")} />
                  </Badge>
                )}
                {filters.bathrooms != null && (
                  <Badge variant="secondary" className="gap-1">
                    <Bath className="w-3 h-3" />
                    {filters.bathrooms}+ Bathrooms
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter("bathrooms")} />
                  </Badge>
                )}
              </div>
            )}

            {results.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">
                    {isSearching ? "Searching..." : "No properties found"}
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-4">
                    {isSearching
                      ? "Please wait while we search for properties matching your criteria."
                      : "Try adjusting your search filters to find more properties."}
                  </p>
                  {!isSearching && activeCount > 0 && (
                    <Button variant="outline" onClick={handleReset}>Clear All Filters</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {results.map((p) => (
                  <Card key={p.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2">{p.type}</Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{p.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{p.location}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{formatPrice(p.price)}</span>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {p.features?.bedrooms != null && (
                            <span className="flex items-center gap-1">
                              <Bed className="w-3.5 h-3.5" /> {p.features.bedrooms}
                            </span>
                          )}
                          {p.features?.bathrooms != null && (
                            <span className="flex items-center gap-1">
                              <Bath className="w-3.5 h-3.5" /> {p.features.bathrooms}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="save-name">Search Name</Label>
                <Input
                  id="save-name"
                  placeholder="e.g., 3BR Apartments in Westlands"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveSearch();
                    if (e.key === "Escape") setShowSaveDialog(false);
                  }}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveSearch}
                  className="flex-1"
                  disabled={!saveName.trim()}
                >
                  Save Search
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveName("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}