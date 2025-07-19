import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Search, User, LogOut, HelpCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTutorial } from "@/components/tutorial/TutorialProvider";

interface MobileNavProps {
  user?: any;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function MobileNav({ user, onLogout, isLoggingOut }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { restartTutorial, isActive } = useTutorial();

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    if (query.trim()) {
      setLocation(`/?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden text-white hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-customSecondary text-white">
            <Logo size="sm" variant="default" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  name="search"
                  type="search"
                  placeholder="Search properties..."
                  className="pl-9"
                />
              </div>
            </form>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/")}
              >
                Home
              </Button>

              {/* About Us Section */}
              <div className="space-y-1">
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                  About Us
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-6"
                  onClick={() => handleNavigation("/our-story")}
                >
                  Our Story
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-6"
                  onClick={() => handleNavigation("/team")}
                >
                  Team
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-6"
                  onClick={() => handleNavigation("/partners")}
                >
                  Partners
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-6"
                  onClick={() => handleNavigation("/press-media")}
                >
                  Press and Media
                </Button>
              </div>

              {/* Services Section */}
              <div className="space-y-1">
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground">
                  Services
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-6"
                  onClick={() => handleNavigation("/services/basic-checks")}
                >
                  Basic Property Checks
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-6"
                  onClick={() => handleNavigation("/services/document-auth")}
                >
                  Document Authentication
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-6"
                  onClick={() => handleNavigation("/services/fraud-detection")}
                >
                  Fraud Detection
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-6"
                  onClick={() => handleNavigation("/services/reviews")}
                >
                  User Reviews & Ratings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-6"
                  onClick={() => handleNavigation("/services/trust-points")}
                >
                  Trust Points System
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start pl-6"
                  onClick={() => handleNavigation("/services/karma")}
                >
                  Real Estate Karma Score
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/features")}
              >
                Features
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/compare")}
              >
                Compare
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/pricing")}
              >
                Pricing
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/blog")}
              >
                Blog
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleNavigation("/dashboard")}
              >
                Dashboard
              </Button>
            </nav>
          </div>

          {/* User Section */}
          <div className="border-t p-4 space-y-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>{user.username || 'User'}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleNavigation("/services/basic-checks")}
                >
                  Verify Property
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    restartTutorial();
                    setIsOpen(false);
                  }}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  {isActive ? "Restart Tour" : "Take Tour"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={onLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => handleNavigation("/auth/login")}
                >
                  Login
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleNavigation("/auth/register")}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}