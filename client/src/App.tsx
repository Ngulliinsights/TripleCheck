import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "@/components/ui/logo";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import PropertyPage from "@/pages/property";
import DashboardPage from "@/pages/dashboard";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import BasicChecksPage from "@/pages/services/basic-checks";
import DocumentAuthPage from "@/pages/services/document-auth";
import FraudDetectionPage from "@/pages/services/fraud-detection";
import ReviewsPage from "@/pages/services/reviews";
import TrustPointsPage from "@/pages/services/trust-points";
import KarmaScorePage from "@/pages/services/karma";
import ReportsPage from "@/pages/services/reports";
import AlertsPage from "@/pages/services/alerts";
import ResourcesPage from "@/pages/services/resources";
import ListPropertyPage from "@/pages/services/list-property";
import ReputationPage from "@/pages/services/reputation";
import TenantsPage from "@/pages/services/tenants";
import PropertyComparePage from "@/pages/compare";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import FeaturesPage from "@/pages/features";
import PricingPage from "@/pages/pricing";
import OurStoryPage from "@/pages/our-story";
import TeamPage from "@/pages/team";
import PartnersPage from "@/pages/partners";
import PressMediaPage from "@/pages/press-media";
import { TutorialProvider, useTutorial } from "@/components/tutorial/TutorialProvider";

// Component to show a button to restart the tutorial
function TutorialButton() {
  const { restartTutorial, isActive } = useTutorial();
  
  return (
    <Button 
      variant="ghost" 
      size="sm"
      onClick={restartTutorial}
      title={isActive ? "Restart Platform Tour" : "Take Platform Tour"}
      className="text-white hover:text-white hover:bg-white/10 transition-colors tutorial-help-button"
    >
      <HelpCircle className="h-4 w-4 mr-1" />
      {isActive ? "Restart Tour" : "Take Tour"}
    </Button>
  );
}

function Navigation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check if user is authenticated
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
      });
      setLocation("/");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="bg-customSecondary text-white">
      <NavigationMenu className="max-w-screen-xl mx-auto px-4 py-2">
        <NavigationMenuList className="gap-4">
          {/* Logo with enhanced presentation */}
          <NavigationMenuItem>
            <NavigationMenuLink href="/" className="tutorial-welcome">
              <Logo 
                size="md"
                variant="default"
                className="border border-white/20 hover:border-white/40 shadow-md hover:shadow-lg" 
              />
            </NavigationMenuLink>
          </NavigationMenuItem>

          {/* Main Navigation */}
          <NavigationMenuItem>
            <NavigationMenuLink 
              className="text-white hover:text-white/80 transition-colors"
              href="/"
            >
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>

          {/* About Us Dropdown */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-white hover:text-white/80 transition-colors bg-transparent hover:bg-white/10">
              About Us
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-48 p-2 bg-white shadow-lg rounded-md">
                <li>
                  <NavigationMenuLink 
                    className="block px-4 py-2 hover:bg-customSecondary/10 hover:text-customSecondary transition-colors" 
                    href="/our-story"
                  >
                    Our Story
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink 
                    className="block px-4 py-2 hover:bg-customSecondary/10 hover:text-customSecondary transition-colors" 
                    href="/team"
                  >
                    Team
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink 
                    className="block px-4 py-2 hover:bg-customSecondary/10 hover:text-customSecondary transition-colors" 
                    href="/partners"
                  >
                    Partners
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink 
                    className="block px-4 py-2 hover:bg-customSecondary/10 hover:text-customSecondary transition-colors" 
                    href="/press-media"
                  >
                    Press and Media
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Services Dropdown */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-white hover:text-white/80 transition-colors bg-transparent hover:bg-white/10">
              Services
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid grid-cols-4 gap-4 p-6 w-screen max-w-4xl bg-white shadow-lg rounded-md">
                <div>
                  <h3 className="font-medium mb-3 text-customPrimary">Property Verification</h3>
                  <ul className="space-y-2">
                    <li>
                      <NavigationMenuLink 
                        className="block hover:text-customSecondary transition-colors" 
                        href="/services/basic-checks"
                      >
                        Basic Property Checks
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink 
                        className="block hover:text-customSecondary transition-colors" 
                        href="/services/document-auth"
                      >
                        Document Authentication
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink 
                        className="block hover:text-customSecondary transition-colors" 
                        href="/services/fraud-detection"
                      >
                        Fraud Detection
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-3 text-customPrimary">Community Trust Network</h3>
                  <ul className="space-y-2">
                    <li>
                      <NavigationMenuLink 
                        className="block hover:text-customSecondary transition-colors" 
                        href="/services/reviews"
                      >
                        User Reviews & Ratings
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink 
                        className="block hover:text-customSecondary transition-colors" 
                        href="/services/trust-points"
                      >
                        Trust Points System
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink 
                        className="block hover:text-customSecondary transition-colors" 
                        href="/services/karma"
                      >
                        Real Estate Karma Score
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Market Insights</h3>
                  <ul className="space-y-1">
                    <li><NavigationMenuLink href="/services/reports">Comprehensive Reports</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="/services/alerts">Real-Time Alerts</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="/services/resources">Educational Resources</NavigationMenuLink></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">For Landlords & Agents</h3>
                  <ul className="space-y-1">
                    <li><NavigationMenuLink href="/services/list-property">List Your Property</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="/services/reputation">Build Your Reputation</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="/services/tenants">Access Verified Tenants</NavigationMenuLink></li>
                  </ul>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink 
              className="text-white hover:text-white/90"
              href="/features"
            >
              Features
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink 
              className="text-white hover:text-white/90"
              href="/compare"
            >
              Compare
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink 
              className="text-white hover:text-white/90"
              href="/pricing"
            >
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink 
              className="text-white hover:text-white/90"
              href="/dashboard"
            >
              Dashboard
            </NavigationMenuLink>
          </NavigationMenuItem>

          {/* Search */}
          <NavigationMenuItem className="ml-auto">
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const query = formData.get('search') as string;
              if (query.trim()) {
                setLocation(`/?search=${encodeURIComponent(query.trim())}`);
              }
            }}>
              <div className="relative search-bar">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  type="search"
                  placeholder="Search properties..."
                  className="pl-9 w-64"
                />
              </div>
            </form>
          </NavigationMenuItem>

          {/* Authentication */}
          {user ? (
            <>
              <NavigationMenuItem>
                <Button 
                  variant="outline" 
                  className="text-white border-white hover:bg-white hover:text-customSecondary transition-all verify-property mr-2"
                  onClick={() => setLocation("/services/basic-checks")}
                >
                  Verify Property
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{(user as any)?.username || 'User'}</span>
                </div>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-white hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <TutorialButton />
              </NavigationMenuItem>
            </>
          ) : (
            <>
              <NavigationMenuItem>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/auth/login")}
                  className="text-white hover:text-white hover:bg-white/10 transition-colors mr-2"
                >
                  Login
                </Button>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation("/auth/register")}
                  className="text-white border-white/80 hover:bg-white hover:text-customSecondary transition-all"
                >
                  Sign Up
                </Button>
              </NavigationMenuItem>
            </>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <Switch>
          <Route path="/">
            <HomePage />
          </Route>
          {/* Fixed property route - properly extract id from params */}
          <Route path="/property/:id">
            {(params) => <PropertyPage id={params.id} />}
          </Route>
          <Route path="/dashboard">
            <DashboardPage />
          </Route>

          {/* Property Verification Services */}
          <Route path="/services/basic-checks">
            <BasicChecksPage />
          </Route>
          <Route path="/services/document-auth">
            <DocumentAuthPage />
          </Route>
          <Route path="/services/fraud-detection">
            <FraudDetectionPage />
          </Route>

          {/* Community Trust Network Services */}
          <Route path="/services/reviews">
            {() => <ReviewsPage />}
          </Route>
          <Route path="/services/trust-points">
            {() => <TrustPointsPage />}
          </Route>
          <Route path="/services/karma">
            {() => <KarmaScorePage />}
          </Route>

          {/* Market Insights Services */}
          <Route path="/services/reports">
            {() => <ReportsPage />}
          </Route>
          <Route path="/services/alerts">
            {() => <AlertsPage />}
          </Route>
          <Route path="/services/resources">
            {() => <ResourcesPage />}
          </Route>

          {/* For Landlords & Agents Services */}
          <Route path="/services/list-property" component={ListPropertyPage} />
          <Route path="/services/reputation" component={ReputationPage} />
          <Route path="/services/tenants" component={TenantsPage} />

          {/* Property Comparison */}
          <Route path="/compare" component={PropertyComparePage} />

          {/* Authentication */}
          <Route path="/auth/login" component={LoginPage} />
          <Route path="/auth/register" component={RegisterPage} />

          {/* Static Pages */}
          <Route path="/features" component={FeaturesPage} />
          <Route path="/pricing" component={PricingPage} />
          <Route path="/our-story" component={OurStoryPage} />
          <Route path="/team" component={TeamPage} />
          <Route path="/partners" component={PartnersPage} />
          <Route path="/press-media" component={PressMediaPage} />

          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TutorialProvider>
        <Router />
        <Toaster />
      </TutorialProvider>
    </QueryClientProvider>
  );
}

export default App;