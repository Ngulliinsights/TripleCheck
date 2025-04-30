import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import PropertyPage from "@/pages/property";
import DashboardPage from "@/pages/dashboard";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuContent, NavigationMenuTrigger, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { TutorialProvider, useTutorial } from "@/components/tutorial/TutorialProvider";

// Component to show a button to restart the tutorial
function TutorialButton() {
  const { restartTutorial } = useTutorial();
  
  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={restartTutorial}
      title="Start Platform Tour"
      className="text-white hover:text-white hover:bg-white/20"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}

function Navigation() {
  return (
    <div className="bg-[#2C5282] text-white">
      <NavigationMenu className="max-w-screen-xl mx-auto px-4 py-2">
        <NavigationMenuList className="gap-4">
          {/* Logo */}
          <NavigationMenuItem>
            <NavigationMenuLink href="/" className="tutorial-welcome">
              <img src="/Artmark.svg" alt="TripleCheck Logo" className="h-8" />
            </NavigationMenuLink>
          </NavigationMenuItem>

          {/* Main Navigation */}
          <NavigationMenuItem>
            <NavigationMenuLink 
              className="text-white hover:text-white/90"
              href="/"
            >
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>

          {/* About Us Dropdown */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-white hover:text-white/90">About Us</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-48 p-2">
                <li><NavigationMenuLink href="/our-story">Our Story</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/team">Team</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/partners">Partners</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/press-media">Press and Media</NavigationMenuLink></li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Services Dropdown */}
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-white hover:text-white/90">Services</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid grid-cols-4 gap-4 p-4 w-screen max-w-4xl">
                <div>
                  <h3 className="font-medium mb-2">Property Verification</h3>
                  <ul className="space-y-1">
                    <li><NavigationMenuLink href="/services/basic-checks">Basic Property Checks</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="/services/document-auth">Document Authentication</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="/services/fraud-detection">Fraud Detection</NavigationMenuLink></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Community Trust Network</h3>
                  <ul className="space-y-1">
                    <li><NavigationMenuLink href="/services/reviews">User Reviews & Ratings</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="/services/trust-points">Trust Points System</NavigationMenuLink></li>
                    <li><NavigationMenuLink href="/services/karma">Real Estate Karma Score</NavigationMenuLink></li>
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
            <div className="relative search-bar">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search properties..."
                className="pl-9 w-64"
              />
            </div>
          </NavigationMenuItem>

          {/* Verification and Tutorial Buttons */}
          <NavigationMenuItem>
            <Button 
              variant="outline" 
              className="text-white border-white hover:bg-white hover:text-[#2C5282] verify-property mr-2"
            >
              Verify Property
            </Button>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <TutorialButton />
          </NavigationMenuItem>
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
          <Route path="/" component={HomePage} />
          <Route path="/property/:id" component={PropertyPage} />
          <Route path="/dashboard" component={DashboardPage} />

          {/* Property Verification Services */}
          <Route path="/services/basic-checks" component={BasicChecksPage} />
          <Route path="/services/document-auth" component={DocumentAuthPage} />
          <Route path="/services/fraud-detection" component={FraudDetectionPage} />

          {/* Community Trust Network Services */}
          <Route path="/services/reviews" component={ReviewsPage} />
          <Route path="/services/trust-points" component={TrustPointsPage} />
          <Route path="/services/karma" component={KarmaScorePage} />

          {/* Market Insights Services */}
          <Route path="/services/reports" component={ReportsPage} />
          <Route path="/services/alerts" component={AlertsPage} />
          <Route path="/services/resources" component={ResourcesPage} />

          {/* For Landlords & Agents Services */}
          <Route path="/services/list-property" component={ListPropertyPage} />
          <Route path="/services/reputation" component={ReputationPage} />
          <Route path="/services/tenants" component={TenantsPage} />

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