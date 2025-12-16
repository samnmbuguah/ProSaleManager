import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, User, Menu, Heart, Package, LogOut } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStoreContext } from "@/contexts/StoreContext";
import { api } from "@/lib/api";
import { useState } from "react";
import CartDrawer from "@/components/shop/CartDrawer";

export interface StoreNavProps {
    onLoginClick?: () => void;
    searchTerm?: string;
    onSearchChange?: (term: string) => void;
    showSearch?: boolean;
    // Cart props
    onCheckout?: () => void;
    isSubmitting?: boolean;
}

export default function StoreNav({
    onLoginClick,
    searchTerm = "",
    onSearchChange,
    showSearch = false,
    onCheckout,
    isSubmitting = false,
}: StoreNavProps) {
    const { user } = useAuthContext();
    const { currentStore } = useStoreContext();
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
            window.location.href = "/";
        } catch {
            // Ignore logout errors
        }
    };

    const storePrefix = currentStore?.name ? `/${encodeURIComponent(currentStore.name)}` : "";

    return (
        <header
            className="shadow-lg sticky top-0 z-40"
            style={{ background: "linear-gradient(to right, #c8cbc8, white)" }}
        >
            <div className="container mx-auto px-4 py-4">
                {/* Top Header */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                        <Link href={storePrefix || "/"}>
                            <img
                                src="/logo.png"
                                alt="Eltee Store Logo"
                                className="w-16 h-16 object-contain cursor-pointer"
                            />
                        </Link>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Cart Drawer */}
                        <CartDrawer
                            onCheckout={() => onLoginClick?.()}
                            clientCheckoutHandler={onCheckout}
                            isSubmitting={isSubmitting}
                        />

                        {user ? (
                            <>
                                {/* Desktop Navigation */}
                                <div className="hidden sm:flex items-center gap-3">
                                    <Link href="/profile">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
                                        >
                                            <User className="w-4 h-4 text-gray-600" />
                                            <span className="text-sm text-gray-700">
                                                {(user?.name || "").split(" ")[0] || user?.name}
                                            </span>
                                        </Button>
                                    </Link>
                                    <Link href={storePrefix ? `${storePrefix}/orders` : "/orders"}>
                                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            <span className="text-sm">My Orders</span>
                                        </Button>
                                    </Link>
                                    <Link href={storePrefix ? `${storePrefix}/favorites` : "/favorites"}>
                                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                                            <Heart className="h-4 w-4" />
                                            <span className="text-sm">Favorites</span>
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                                        <LogOut className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Mobile Menu Button */}
                                <div className="sm:hidden">
                                    <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                                        <SheetTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Menu className="h-5 w-5" />
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="right">
                                            <SheetHeader>
                                                <SheetTitle>Account Menu</SheetTitle>
                                            </SheetHeader>
                                            <div className="flex flex-col space-y-2 mt-4">
                                                <Link href="/profile">
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start"
                                                        onClick={() => setShowMobileMenu(false)}
                                                    >
                                                        <User className="w-4 h-4 mr-2" />
                                                        Profile
                                                    </Button>
                                                </Link>
                                                <Link href={storePrefix ? `${storePrefix}/orders` : "/orders"}>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start"
                                                        onClick={() => setShowMobileMenu(false)}
                                                    >
                                                        <Package className="w-4 h-4 mr-2" />
                                                        My Orders
                                                    </Button>
                                                </Link>
                                                <Link href={storePrefix ? `${storePrefix}/favorites` : "/favorites"}>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start"
                                                        onClick={() => setShowMobileMenu(false)}
                                                    >
                                                        <Heart className="w-4 h-4 mr-2" />
                                                        Favorites
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start"
                                                    onClick={handleLogout}
                                                >
                                                    <LogOut className="w-4 h-4 mr-2" />
                                                    Logout
                                                </Button>
                                            </div>
                                        </SheetContent>
                                    </Sheet>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Desktop Login Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onLoginClick?.()}
                                    className="hidden sm:flex"
                                >
                                    Login / Sign Up
                                </Button>
                                {/* Mobile Login Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onLoginClick?.()}
                                    className="sm:hidden"
                                >
                                    Login
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                {showSearch && (
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder="Search for products..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange?.(e.target.value)}
                            className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                        />
                    </div>
                )}
            </div>
        </header>
    );
}
