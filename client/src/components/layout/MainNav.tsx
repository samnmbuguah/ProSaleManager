import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useStoreContext } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  PackageSearch,
  Users,
  Receipt,
  BarChart3,
  Wallet,
  Heart,
  Menu,
  LogOut,
  User,
  ShoppingCart,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CartModal from "@/components/pos/CartModal";

type AppRole = "admin" | "manager" | "user" | "super_admin" | "sales" | "client";

interface Route {
  path: string;
  label: string;
  icon: React.ElementType;
}

const ROLE_ROUTES: Record<AppRole, Route[]> = {
  admin: [
    { path: "pos", label: "POS", icon: Store },
    { path: "inventory", label: "Inventory", icon: PackageSearch },
    { path: "customers", label: "Customers", icon: Users },
    { path: "sales", label: "Sales", icon: Receipt },
    { path: "reports", label: "Reports", icon: BarChart3 },
    { path: "expenses", label: "Expenses", icon: Wallet },
    { path: "favorites", label: "Favorites", icon: Heart },
  ],
  manager: [
    { path: "pos", label: "POS", icon: Store },
    { path: "inventory", label: "Inventory", icon: PackageSearch },
    { path: "customers", label: "Customers", icon: Users },
    { path: "sales", label: "Sales", icon: Receipt },
    { path: "reports", label: "Reports", icon: BarChart3 },
    { path: "expenses", label: "Expenses", icon: Wallet },
    { path: "favorites", label: "Favorites", icon: Heart },
  ],
  user: [
    { path: "pos", label: "POS", icon: Store },
    { path: "inventory", label: "Inventory", icon: PackageSearch },
    { path: "expenses", label: "Expenses", icon: Wallet },
    { path: "favorites", label: "Favorites", icon: Heart },
  ],
  super_admin: [
    { path: "pos", label: "POS", icon: Store },
    { path: "inventory", label: "Inventory", icon: PackageSearch },
    { path: "customers", label: "Customers", icon: Users },
    { path: "sales", label: "Sales", icon: Receipt },
    { path: "reports", label: "Reports", icon: BarChart3 },
    { path: "expenses", label: "Expenses", icon: Wallet },
    { path: "favorites", label: "Favorites", icon: Heart },
    { path: "users", label: "Users", icon: Users },
  ],
  sales: [
    { path: "pos", label: "POS", icon: Store },
    { path: "inventory", label: "Inventory", icon: PackageSearch },
    { path: "expenses", label: "Expenses", icon: Wallet },
    { path: "favorites", label: "Favorites", icon: Heart },
  ],
  client: [
    { path: "orders", label: "My Orders", icon: Package },
    { path: "favorites", label: "Favorites", icon: Heart }
  ],
};

export default function MainNav() {
  const [location] = useLocation();
  const { user, logout } = useAuthContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { cart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const { currentStore, setCurrentStore, stores } = useStoreContext();

  if (!user) return null;

  const routes = ROLE_ROUTES[user.role as AppRole] || ROLE_ROUTES.user;

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "Please try again later",
      });
    }
  };

  const storePrefix = currentStore?.name ? `/${currentStore.name}` : "";
  const firstName = (user.name || "").split(" ")[0] || user.name;

  const NavLinks = () => (
    <>
      {routes.map(({ path, label, icon: Icon }: Route) => {
        // Use direct routes when no store is selected, otherwise use store-prefixed routes
        const href = currentStore?.name ? `${storePrefix}/${path}`.replace(/\/$/, "") : `/${path}`;
        const isActive = location === href;

        return (
          <Link key={path} href={href}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className="flex items-center space-x-2"
              onClick={() => setIsOpen(false)}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b shadow-sm">
      <div className="max-w-7xl mx-auto w-full px-6">
        <div className="h-16 min-h-16 flex items-center justify-between w-full">
          {/* Left logo linking to homepage */}
          <div className="flex items-center">
            <Link href={`${storePrefix}` || "/"}>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">B</span>
                </div>
                <span className="hidden sm:inline font-semibold">BYC Collections</span>
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          {(user.role as AppRole) !== "client" && (
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col space-y-2 mt-4">
                    <NavLinks />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* Desktop Menu */}
          {(user.role as AppRole) !== "client" && (
            <div className="hidden md:flex items-center gap-x-4">
              <NavLinks />
            </div>
          )}

          <div className="flex items-center gap-x-2">
            {/* Floating Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCartOpen(true)}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1">
                  {cart.items.length}
                </span>
              )}
            </Button>
            <CartModal open={cartOpen} onOpenChange={setCartOpen} />
            <div className="hidden md:flex items-center gap-x-2">
              <Link href={`${storePrefix}/profile`.replace(/\/$/, "")}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-x-2 hover:bg-accent"
                >
                  <User className="h-4 w-4" />
                  <span className="truncate align-middle">{firstName}</span>
                </Button>
              </Link>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-accent">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          {(user?.role as AppRole) === "super_admin" && stores.length > 0 && (
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Store:</span>
              <select
                className="border rounded px-2 py-1"
                value={currentStore?.id || ""}
                onChange={(e) => {
                  const store = stores.find((s) => s.id === Number(e.target.value));
                  if (store) setCurrentStore(store);
                }}
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
