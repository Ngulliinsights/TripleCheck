import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  Building2, 
  FileCheck, 
  Users, 
  Settings, 
  Bell,
  UserCircle
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <a href="/dashboard" className="flex items-center gap-2">
                <div className="bg-primary p-2 rounded">
                  <LayoutGrid className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-lg">TripleCheck Enterprise</span>
              </a>
              
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuLink 
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      )}
                      href="/dashboard/properties"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Properties
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink 
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      )}
                      href="/dashboard/verifications"
                    >
                      <FileCheck className="h-4 w-4 mr-2" />
                      Verifications
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink 
                      className={cn(
                        "group inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                      )}
                      href="/dashboard/clients"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Clients
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                <span>Agency Name</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
