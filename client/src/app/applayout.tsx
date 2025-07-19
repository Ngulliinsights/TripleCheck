import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { Logo } from "@/components/ui/logo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, User, LogOut } from "lucide-react";
import { MobileNav } from "@/components/navigation/mobile-nav";
import { useTutorial } from "@/components/tutorial/TutorialProvider";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

/**
 * Tutorial button component with proper state management
 * Encapsulates tutorial-related logic to prevent unnecessary re-renders
 */
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

/**
 * Main navigation component optimized for performance
 * Uses React Query caching to prevent unnecessary auth checks
 */
function Navigation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Optimized authentication check with proper caching
  // The 'enabled' option and caching prevent infinite loops
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // Keep user data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Cache for 10 minutes
    // This prevents the query from running if we already have user data
    enabled: true,
  });

  // Logout mutation with proper error handling and state management
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      // Clear user data from cache instead of refetching
      queryClient.setQueryData(["/api/auth/me"], null);
      toast({
        title: "Logged out successfully",
        description: "Come back soon!",
      });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  // Memoized search handler to prevent unnecessary re-renders
  const handleSearch = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const query = formData.get("search") as string;
      if (query.trim()) {
        setLocation(`/?search=${encodeURIComponent(query.trim())}`);
      }
    },
    [setLocation]
  );

  const handleLogout = React.useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return (
    <div className="bg-customSecondary text-white">
      <div className="max-w-screen-xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Mobile Navigation */}
          <div className="flex items-center gap-4">
            <MobileNav
              user={user}
              onLogout={handleLogout}
              isLoggingOut={logoutMutation.isPending}
            />

            {/* Logo with proper accessibility */}
            <a
              href="/"
              className="tutorial-welcome"
              aria-label="TripleCheck - Go to homepage"
              title="TripleCheck - Go to homepage"
            >
              <Logo
                size="md"
                variant="default"
                className="border border-white/20 hover:border-white/40 shadow-md hover:shadow-lg"
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="gap-4">
              {/* Main Navigation Links */}
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
                        href="/static/our-story"
                      >
                        Our Story
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        className="block px-4 py-2 hover:bg-customSecondary/10 hover:text-customSecondary transition-colors"
                        href="/static/team"
                      >
                        Team
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        className="block px-4 py-2 hover:bg-customSecondary/10 hover:text-customSecondary transition-colors"
                        href="/static/partners"
                      >
                        Partners
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink
                        className="block px-4 py-2 hover:bg-customSecondary/10 hover:text-customSecondary transition-colors"
                        href="/static/press-media"
                      >
                        Press and Media
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Services Dropdown with organized structure */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-white hover:text-white/80 transition-colors bg-transparent hover:bg-white/10">
                  Services
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid grid-cols-4 gap-4 p-6 w-screen max-w-4xl bg-white shadow-lg rounded-md">
                    <div>
                      <h3 className="font-medium mb-3 text-customPrimary">
                        Property Verification
                      </h3>
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
                      <h3 className="font-medium mb-3 text-customPrimary">
                        Community Trust Network
                      </h3>
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
                        <li>
                          <NavigationMenuLink href="/services/reports">
                            Comprehensive Reports
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink href="/services/alerts">
                            Real-Time Alerts
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink href="/services/resources">
                            Educational Resources
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">
                        For Landlords & Agents
                      </h3>
                      <ul className="space-y-1">
                        <li>
                          <NavigationMenuLink href="/services/list-property">
                            List Your Property
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink href="/services/reputation">
                            Build Your Reputation
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink href="/services/tenants">
                            Access Verified Tenants
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Direct navigation links */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  className="text-white hover:text-white/90"
                  href="/static/features"
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
                  href="/static/pricing"
                >
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  className="text-white hover:text-white/90"
                  href="/blog"
                >
                  Blog
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

              {/* Search functionality */}
              <NavigationMenuItem className="ml-auto">
                <form onSubmit={handleSearch}>
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

              {/* Authentication section */}
              {user ?
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
                      <span>{(user as any)?.username || "User"}</span>
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
              : <>
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
              }
            </NavigationMenuList>
          </NavigationMenu>

          {/* Mobile Search and Auth */}
          <div className="flex md:hidden items-center gap-2">
            <form onSubmit={handleSearch} className="hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  type="search"
                  placeholder="Search..."
                  className="pl-9 w-32"
                />
              </div>
            </form>

            {user ?
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-white hover:text-white hover:bg-white/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            : <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/auth/login")}
                className="text-white hover:text-white hover:bg-white/10 transition-colors"
              >
                Login
              </Button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main layout component that provides consistent structure
 * Separates navigation concerns from routing logic
 */
interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
