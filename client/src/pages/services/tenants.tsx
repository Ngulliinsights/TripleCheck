import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Star, 
  Shield, 
  Users, 
  CheckCircle, 
  User, 
  Home, 
  Calendar, 
  Info,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TenantLevel = 'gold' | 'silver' | 'bronze' | 'all';

interface Tenant {
  id: number;
  name: string;
  photo: string;
  rating: number;
  verificationLevel: 'Gold' | 'Silver' | 'Bronze';
  verificationBadge: string;
  occupation: string;
  income: string;
  seeking: string;
  contactInfo: string;
  referencesCount: number;
  previousRentals: number;
  joinedDate: string;
  lastActive: string;
  bio: string;
}

export default function TenantsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<TenantLevel>('all');
  const [incomeRange, setIncomeRange] = useState([50000, 200000]);
  const [showContactInfo, setShowContactInfo] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('available');
  
  // Simulated tenants data
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: 1,
      name: "David Mwangi",
      photo: "/tenant1.webp",
      rating: 4.8,
      verificationLevel: "Gold",
      verificationBadge: "Fully Verified",
      occupation: "Software Engineer",
      income: "200,000+ KES monthly",
      seeking: "2-3 bedroom apartment in Kilimani",
      contactInfo: "+254 712 345 678",
      referencesCount: 3,
      previousRentals: 2,
      joinedDate: "January 2023",
      lastActive: "Today",
      bio: "Responsible professional looking for a quiet apartment in a good neighborhood. Non-smoker, no pets."
    },
    {
      id: 2,
      name: "Grace Achieng",
      photo: "/tenant2.webp",
      rating: 4.5,
      verificationLevel: "Silver",
      verificationBadge: "ID Verified",
      occupation: "Marketing Manager",
      income: "150,000-200,000 KES monthly",
      seeking: "1-2 bedroom apartment in Westlands",
      contactInfo: "+254 723 456 789",
      referencesCount: 2,
      previousRentals: 1,
      joinedDate: "March 2023",
      lastActive: "Yesterday",
      bio: "Corporate professional seeking modern apartment close to Westlands. Clean, quiet, and responsible tenant."
    },
    {
      id: 3,
      name: "John Kamau",
      photo: "/tenant3.webp",
      rating: 4.2,
      verificationLevel: "Bronze",
      verificationBadge: "Basic Verification",
      occupation: "Financial Analyst",
      income: "100,000-150,000 KES monthly",
      seeking: "Studio or 1 bedroom in Lavington",
      contactInfo: "+254 734 567 890",
      referencesCount: 1,
      previousRentals: 1,
      joinedDate: "July 2023",
      lastActive: "2 days ago",
      bio: "Young professional seeking affordable housing in Lavington area. No pets, non-smoker, clean habits."
    },
    {
      id: 4,
      name: "Sarah Njeri",
      photo: "/tenant4.webp",
      rating: 4.9,
      verificationLevel: "Gold",
      verificationBadge: "Fully Verified",
      occupation: "Doctor",
      income: "250,000+ KES monthly",
      seeking: "3 bedroom house in Karen",
      contactInfo: "+254 745 678 901",
      referencesCount: 4,
      previousRentals: 3,
      joinedDate: "December 2022",
      lastActive: "Today",
      bio: "Medical professional with family (2 children) looking for spacious home in Karen. Excellent rental history and references available."
    },
    {
      id: 5,
      name: "Samuel Ochieng",
      photo: "/tenant5.webp",
      rating: 4.4,
      verificationLevel: "Silver",
      verificationBadge: "ID Verified",
      occupation: "Architect",
      income: "120,000-170,000 KES monthly",
      seeking: "2 bedroom apartment in Kileleshwa",
      contactInfo: "+254 756 789 012",
      referencesCount: 2,
      previousRentals: 2,
      joinedDate: "February 2023",
      lastActive: "3 days ago",
      bio: "Design professional looking for modern apartment with good natural light for home office. Clean and organized."
    },
    {
      id: 6,
      name: "Patricia Wambui",
      photo: "/tenant6.webp",
      rating: 4.7,
      verificationLevel: "Gold",
      verificationBadge: "Fully Verified",
      occupation: "University Lecturer",
      income: "180,000-230,000 KES monthly",
      seeking: "2-3 bedroom house in Runda",
      contactInfo: "+254 767 890 123",
      referencesCount: 3,
      previousRentals: 2,
      joinedDate: "April 2023",
      lastActive: "Today",
      bio: "Academic professional seeking quiet neighborhood for family of three. Long-term rental preferred."
    }
  ]);

  const handleContactReveal = (tenantId: number) => {
    // If not already revealed, add to revealed array
    if (!showContactInfo.includes(tenantId)) {
      setShowContactInfo([...showContactInfo, tenantId]);
      
      toast({
        title: "Contact information revealed",
        description: "You can now contact this tenant directly. Your credit has been deducted.",
      });
    }
  };

  const filterTenants = () => {
    return tenants.filter(tenant => {
      // Filter by search query
      if (searchQuery && !tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !tenant.occupation.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !tenant.seeking.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by verification level
      if (filterLevel !== 'all') {
        if (filterLevel === 'gold' && tenant.verificationLevel !== 'Gold') return false;
        if (filterLevel === 'silver' && tenant.verificationLevel !== 'Silver') return false;
        if (filterLevel === 'bronze' && tenant.verificationLevel !== 'Bronze') return false;
      }
      
      // Filter by income (simplified)
      const incomeNum = parseInt(tenant.income.replace(/[^0-9]/g, ''));
      if (incomeNum < incomeRange[0] || incomeNum > incomeRange[1]) return false;
      
      return true;
    });
  };

  const filteredTenants = filterTenants();

  const sendMessage = (tenantId: number) => {
    toast({
      title: "Message sent",
      description: "Your property details have been sent to the tenant.",
    });
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-[#2C5282]">Access Verified Tenants</h1>
      <p className="text-lg mb-8">
        Connect with pre-screened, verified tenants actively looking for properties in Kenya.
        All tenants undergo our rigorous background and financial verification process.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Tenant Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Tenants</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Name, occupation, location..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification">Verification Level</Label>
                <Select 
                  value={filterLevel} 
                  onValueChange={(value: TenantLevel) => setFilterLevel(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="gold">Gold Verified</SelectItem>
                    <SelectItem value="silver">Silver Verified</SelectItem>
                    <SelectItem value="bronze">Bronze Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="income-range">Monthly Income Range (KES)</Label>
                <div className="pt-4 pb-2">
                  <Slider
                    defaultValue={[50000, 200000]}
                    min={20000}
                    max={300000}
                    step={10000}
                    value={incomeRange}
                    onValueChange={setIncomeRange}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{incomeRange[0].toLocaleString()} KES</span>
                  <span>{incomeRange[1].toLocaleString()} KES</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="property-type">Seeking Property Type</Label>
                <Select defaultValue="any">
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Property</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Preferred Location</Label>
                <Select defaultValue="any">
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Location</SelectItem>
                    <SelectItem value="kilimani">Kilimani</SelectItem>
                    <SelectItem value="lavington">Lavington</SelectItem>
                    <SelectItem value="karen">Karen</SelectItem>
                    <SelectItem value="westlands">Westlands</SelectItem>
                    <SelectItem value="kileleshwa">Kileleshwa</SelectItem>
                    <SelectItem value="runda">Runda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Switch id="references" />
                <Label htmlFor="references">Has References</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="previous-rentals" />
                <Label htmlFor="previous-rentals">Previous Rental History</Label>
              </div>

              <Button className="w-full mt-2">Apply Filters</Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tenant Credits</CardTitle>
              <CardDescription>
                Your remaining tenant contact reveals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-2">
                <div className="text-4xl font-bold text-[#2C5282]">12</div>
                <p className="text-sm text-gray-500 mt-1">Credits Remaining</p>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-[#2C5282]">
                <p>Each credit allows you to reveal contact details for one verified tenant.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Purchase More Credits</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="available" className="mb-6" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="available" className="text-center">
                <Users className="h-4 w-4 mr-2" />
                Available Tenants
              </TabsTrigger>
              <TabsTrigger value="saved" className="text-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Saved Tenants
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 'available' && filteredTenants.length === 0 && (
            <div className="bg-white rounded-lg p-8 text-center border">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium">No matching tenants found</h3>
              <p className="text-gray-500 mt-1">Try adjusting your filters to see more results.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeTab === 'available' && filteredTenants.map((tenant) => (
              <Card key={tenant.id} className="overflow-hidden">
                <div className="bg-[#2C5282] text-white p-3 flex justify-between items-center">
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    <span>{tenant.verificationBadge}</span>
                  </div>
                  <Badge 
                    className={`
                      ${tenant.verificationLevel === 'Gold' ? 'bg-[#FFD700] text-amber-800' : 
                        tenant.verificationLevel === 'Silver' ? 'bg-[#C0C0C0] text-gray-800' : 
                        'bg-[#CD7F32] text-amber-900'}
                    `}
                  >
                    {tenant.verificationLevel}
                  </Badge>
                </div>
                <CardContent className="pt-6">
                  <div className="flex">
                    <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden mr-4 flex-shrink-0">
                      <User className="h-full w-full text-gray-400 p-2" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{tenant.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" fill="currentColor" />
                        <span>{tenant.rating}</span>
                        <span className="mx-2">•</span>
                        <span>{tenant.occupation}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Home className="h-4 w-4 mr-1" />
                        <span>{tenant.seeking}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Income:</span>
                      <span className="font-medium">{tenant.income}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">References:</span>
                      <span className="font-medium">{tenant.referencesCount} verified</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Rental History:</span>
                      <span className="font-medium">{tenant.previousRentals} previous</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Member Since:</span>
                      <span className="font-medium">{tenant.joinedDate}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Active:</span>
                      <span className="font-medium">{tenant.lastActive}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm">
                    <p className="text-gray-600">{tenant.bio}</p>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    {showContactInfo.includes(tenant.id) ? (
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 rounded-md">
                          <div className="font-medium text-[#2C5282] mb-1">Contact Information</div>
                          <div className="text-sm">{tenant.contactInfo}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1" onClick={() => sendMessage(tenant.id)}>
                            Send Property Details
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1" 
                          variant="outline"
                          onClick={() => handleContactReveal(tenant.id)}
                        >
                          Reveal Contact (1 Credit)
                        </Button>
                        <Button 
                          className="flex-1"
                          variant="secondary"
                        >
                          Save Tenant
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {activeTab === 'saved' && (
              <div className="col-span-full bg-white rounded-lg p-8 text-center border">
                <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium">No saved tenants yet</h3>
                <p className="text-gray-500 mt-1">Save tenants you're interested in for quick access later.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <div className="flex items-start">
          <Info className="h-6 w-6 text-[#2C5282] mr-4 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-[#2C5282] mb-2">Our Tenant Verification Process</h3>
            <p className="text-gray-700 mb-4">
              All tenants on our platform undergo a rigorous verification process to ensure they are reliable and financially stable.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-md">
                <h4 className="font-medium text-[#2C5282] mb-2 flex items-center">
                  <Badge className="bg-[#CD7F32] text-amber-900 mr-2">Bronze</Badge>
                  Basic Verification
                </h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>ID verification</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Phone number verification</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Email verification</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-md">
                <h4 className="font-medium text-[#2C5282] mb-2 flex items-center">
                  <Badge className="bg-[#C0C0C0] text-gray-800 mr-2">Silver</Badge>
                  ID Verified
                </h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>All Bronze verifications</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Employment verification</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Income verification</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Previous landlord reference (1)</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-md">
                <h4 className="font-medium text-[#2C5282] mb-2 flex items-center">
                  <Badge className="bg-[#FFD700] text-amber-800 mr-2">Gold</Badge>
                  Fully Verified
                </h4>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>All Silver verifications</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Credit history check</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Background check</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Previous landlord references (2+)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                    <span>Video interview verification</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}