import { useCallback, useEffect, useState } from "react";
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
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CartModal from "@/components/pos/CartModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { useNotifications } from "@/hooks/use-notifications";


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
    { path: "customers", label: "Customers", icon: Users },
    { path: "sales", label: "Sales", icon: Receipt },
    { path: "expenses", label: "Expenses", icon: Wallet },
    { path: "favorites", label: "Favorites", icon: Heart },
  ],
  client: [
    { path: "orders", label: "My Orders", icon: Package },
    { path: "favorites", label: "Favorites", icon: Heart },
  ],
};



export default function MainNav() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuthContext();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const { cart } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const { currentStore, setCurrentStore, stores, isLoading } = useStoreContext();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { setTheme, theme } = useTheme();

  const routes = user ? (ROLE_ROUTES[user.role as AppRole] || ROLE_ROUTES.user) : [];

  const playNotificationSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      // Double beep
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.setTargetAtTime(0, ctx.currentTime + 0.1, 0.1);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);

      // Second beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(600, ctx.currentTime + 0.25);
      gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.25);
      gain2.gain.setTargetAtTime(0, ctx.currentTime + 0.35, 0.1);
      osc2.start(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.5);

    } catch (e) {
      console.error("Audio play failed", e);
    }
  }, []);

  // Use the new hook for notifications
  const { data: notifData, isLoading: isNotifLoading, refetch: refetchNotifications } = useNotifications();

  const notifications = notifData?.notifications || [];
  const pendingOrdersCount = notifData?.pendingOrdersCount || 0;

  // fetchNotifications is no longer needed manually as useQuery handles it

  // NOTE: Original code had logic for "setNotificationsLoading", "setPendingOrdersCount" etc.
  // We need to map the hook result to the component state or just use the hook result directly.
  // The component mostly uses `notifications` and `pendingOrdersCount`.

  // We can remove the old state if we replace usages.
  // But to be safe with minimal changes, let's sync them or just shadow variables.
  // Shadowing/Replacing variables is better.


  // Hourly sound notification if there are pending orders
  useEffect(() => {
    if (!user) return;
    const soundInterval = setInterval(() => {
      if (pendingOrdersCount > 0) {
        playNotificationSound();
        toast({
          title: "Pending Orders Alert",
          description: `You have ${pendingOrdersCount} uncompleted orders.`,
        });
      }
    }, 3600000); // 1 hour

    return () => clearInterval(soundInterval);
  }, [pendingOrdersCount, playNotificationSound, toast, user]);

  if (!user) return null;

  // Don't render navigation until store context is loaded
  if (isLoading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 border-b shadow-sm bg-background dark:bg-background bg-gradient-to-r from-[#c8cbc8] to-white dark:from-background dark:to-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }


  const handleMarkAsRead = async (id: number) => {
    try {
      if (id === -1) {
        // If it's the virtual pending orders notification, navigate to orders
        setLocation(`${storePrefix}/sales?tab=orders`);
        // We can't "mark read" per se, it disappears when orders are completed
        setNotificationsOpen(false);
        return;
      }

      await api.patch(API_ENDPOINTS.notifications.markRead(id));
      await refetchNotifications(); // Refresh data from server instead of local state
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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

  const storePrefix = currentStore?.name ? `/${encodeURIComponent(currentStore.name)}` : "";
  const firstName = (user.name || "").split(" ")[0] || user.name;

  const NavLinks = () => (
    <>
      {routes.map(({ path, label, icon: Icon }: Route) => {
        // Always use store-prefixed routes when store is available
        // Fallback to direct routes only when no store context
        const href = currentStore?.name
          ? `/${encodeURIComponent(currentStore.name)}/${path}`.replace(/\/$/, "")
          : `/${path}`;
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
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b shadow-sm bg-background dark:bg-background bg-gradient-to-r from-[#c8cbc8] to-white dark:from-background dark:to-background"
    >
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6">
        <div className="h-14 sm:h-16 min-h-14 sm:min-h-16 flex items-center justify-between w-full">
          {/* Left logo linking to homepage */}
          {/* Left logo linking to homepage */}
          <div className="flex items-center">
            <Link href={`${storePrefix}` || "/"}>
              <div className="flex items-center gap-2 px-1 sm:px-2 cursor-pointer">
                <img src="/logo.png" alt="Eltee Store Logo" className="w-10 h-10 sm:w-14 sm:h-14 object-contain" />
              </div>
            </Link>
          </div>

          {/* Mobile Menu */}
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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-x-3">
            <NavLinks />
          </div>

          <div className="flex items-center gap-x-1.5 sm:gap-x-2">
            <Popover
              open={notificationsOpen}
              onOpenChange={setNotificationsOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] sm:text-xs px-1">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="text-sm font-semibold">Notifications</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refetchNotifications()}
                    disabled={isNotifLoading}
                    className="mr-1"
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={async () => {
                      try {
                        await api.post(API_ENDPOINTS.notifications.markAllRead);
                        await refetchNotifications();
                      } catch (e) {
                        console.error("Failed to mark all read", e);
                      }
                    }}
                  >
                    Mark all read
                  </Button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {isNotifLoading ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-3 py-2 text-sm border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${notification.is_read ? "bg-white" : "bg-blue-50"
                          } ${notification.id === -1 ? "bg-blue-50" : ""}`}
                        onClick={() => {
                          handleMarkAsRead(notification.id);
                          // Navigate if link exists
                          if (notification.data?.link) {
                            // If link starts with /, append to store prefix if needed or just use as is
                            // Our store routing usually puts store name first.
                            // If link is absolute path like /inventory, we might need to prepend store name.
                            let targetLink = notification.data.link;
                            if (currentStore?.name && !targetLink.startsWith(`/${currentStore.name}`) && targetLink.startsWith('/')) {
                              targetLink = `/${encodeURIComponent(currentStore.name)}${targetLink}`;
                            }
                            setLocation(targetLink);
                            setNotificationsOpen(false);
                          } else if (notification.id === -1) {
                            // Default pending order behavior
                            setLocation(`${storePrefix}/sales?tab=orders`);
                            setNotificationsOpen(false);
                          }
                        }}
                      >
                        <div className="font-semibold">{notification.title}</div>
                        <div className="text-muted-foreground">{notification.message}</div>
                        {notification.createdAt && (
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            {/* Floating Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCartOpen(true)}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[10px] sm:text-xs px-1">
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
                  className="flex items-center gap-x-1.5 hover:bg-accent"
                >
                  <User className="h-4 w-4" />
                  <span className="truncate align-middle text-sm">{firstName}</span>
                </Button>
              </Link>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="hover:bg-accent">
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
          {(user?.role as AppRole) === "super_admin" && stores.length > 0 && (
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground hidden lg:inline-block">Store:</span>
              <div className="w-[180px]">
                <Select
                  value={currentStore?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const store = stores.find((s) => s.id === Number(value));
                    if (store) {
                      // Synchronously update localStorage so API interceptor sees it immediately
                      localStorage.setItem("currentStore", JSON.stringify(store));
                      setCurrentStore(store);
                      // Note: Query cache is now cleared centrally by StoreContext when store changes

                      // Preserve current route, just update the store prefix in URL
                      const currentPath = location;
                      const pathParts = currentPath.split('/').filter(Boolean);

                      // Get the route part (everything after store name)
                      let routePart = 'pos'; // default fallback

                      // Check if the first path segment is ANY store name (not just currentStore)
                      const firstSegmentDecoded = decodeURIComponent(pathParts[0] || '');
                      const isFirstSegmentAStore = stores.some(s => s.name === firstSegmentDecoded);

                      if (isFirstSegmentAStore && pathParts.length > 1) {
                        // Current URL has a store prefix, get only the route part (everything after store name)
                        routePart = pathParts.slice(1).join('/');
                      } else if (isFirstSegmentAStore && pathParts.length === 1) {
                        // Just the store name, default to pos
                        routePart = 'pos';
                      } else if (pathParts.length > 0) {
                        // No store prefix in URL, use the first segment as the route
                        routePart = pathParts[0];
                      }

                      // Navigate to new store with same route
                      setLocation(`/${encodeURIComponent(store.name)}/${routePart}`);

                      toast({
                        title: "Store Switched",
                        description: `Now viewing ${store.name}`,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select Store" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id.toString()}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
