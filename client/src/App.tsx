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
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

function Navigation() {
  return (
    <div className="bg-[#2C5282] text-white">
      <NavigationMenu className="max-w-screen-xl mx-auto px-4 py-2">
        <NavigationMenuList className="gap-4">
          {/* Logo */}
          <NavigationMenuItem>
            <NavigationMenuLink href="/">
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
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search properties..."
                className="pl-9 w-64"
              />
            </div>
          </NavigationMenuItem>

          {/* Auth Buttons */}
          <NavigationMenuItem>
            <Button variant="outline" className="text-white border-white hover:bg-white hover:text-[#2C5282]">
              Sign In
            </Button>
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
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;