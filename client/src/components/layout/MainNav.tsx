import { Link, useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import {
  Store,
  PackageSearch,
  Users,
  BarChart3,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function MainNav() {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "Please try again later"
      });
    }
  };

  const navItems = [
    { href: "/", icon: Store, label: "POS" },
    { href: "/inventory", icon: PackageSearch, label: "Inventory" },
    { href: "/customers", icon: Users, label: "Customers" },
    { href: "/reports", icon: BarChart3, label: "Reports" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <Button
                  variant={location === href ? "default" : "ghost"}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Button>
              </Link>
            ))}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{user?.username}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
