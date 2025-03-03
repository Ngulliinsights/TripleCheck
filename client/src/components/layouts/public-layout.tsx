import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home, Search, Users, LogIn } from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <a href="/" className="flex items-center gap-2">
                <div className="bg-primary p-2 rounded">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">TripleCheck</span>
              </a>
              
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink 
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      )}
                      href="/search"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Find Property
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink 
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      )}
                      href="/community"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Community
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-sm" asChild>
                <a href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </a>
              </Button>
              <Button className="text-sm" asChild>
                <a href="/register">Sign Up</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">About TripleCheck</h3>
              <p className="text-sm text-muted-foreground">
                Kenya's trusted platform for verified real estate listings and community-driven insights.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/how-it-works" className="text-muted-foreground hover:text-foreground">How It Works</a></li>
                <li><a href="/legal" className="text-muted-foreground hover:text-foreground">Legal Resources</a></li>
                <li><a href="/faq" className="text-muted-foreground hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/community" className="text-muted-foreground hover:text-foreground">Trust Network</a></li>
                <li><a href="/report" className="text-muted-foreground hover:text-foreground">Report Fraud</a></li>
                <li><a href="/success-stories" className="text-muted-foreground hover:text-foreground">Success Stories</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Enterprise</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/enterprise" className="text-muted-foreground hover:text-foreground">For Agencies</a></li>
                <li><a href="/api" className="text-muted-foreground hover:text-foreground">API Access</a></li>
                <li><a href="/contact" className="text-muted-foreground hover:text-foreground">Contact Sales</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} TripleCheck. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
