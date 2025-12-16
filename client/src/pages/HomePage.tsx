import { useProducts } from "@/hooks/use-products";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { useStoreContext } from "@/contexts/StoreContext";
import { useEffect, useState } from "react";
import { api, API_ENDPOINTS } from "@/lib/api";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Swal from "sweetalert2";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Star,
  Filter,
  Grid,
  List,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import CategoryFilter from "@/components/shop/CategoryFilter";
import StoreNav from "@/components/layout/StoreNav";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function HomePage() {
  const { products: rawProducts, isLoading, refetch: refetchProducts } = useProducts();
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated, login, register } = useAuth();
  const { currentStore } = useStoreContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [shouldNavigateAfterAuth, setShouldNavigateAfterAuth] = useState(false);
  const [imageErrorIds, setImageErrorIds] = useState<{ [id: number]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);


  // Refetch data when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      refetchProducts();
      // Add any other data refetching here (e.g., favorites, cart, etc.)
    }
  }, [isAuthenticated, refetchProducts]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Filter and sort products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return (a.piece_selling_price || 0) - (b.piece_selling_price || 0);
      case "price-high":
        return (b.piece_selling_price || 0) - (a.piece_selling_price || 0);
      case "name":
      default:
        return (a.name || "").localeCompare(b.name || "");
    }
  });

  const totalPages = Math.ceil(sortedProducts.length / pageSize);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [products, searchTerm, sortBy, selectedCategory]);

  const handleCheckout = () => {
    if (!cart.items.length) {
      Swal.fire({
        icon: "info",
        title: "Cart is empty",
        text: "Please add items to your cart before placing an order.",
      });
      return;
    }

    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }

    handleOrder();
  };

  const handleOrder = async () => {
    if (!cart.items.length) return;

    setIsSubmitting(true);
    try {
      await api.post(API_ENDPOINTS.orders.create, {
        items: cart.items.map((i) => {
          if (!i.product || !i.product.id) {
            throw new Error("Invalid cart item");
          }
          return {
            product_id: i.product.id,
            quantity: i.quantity,
            unit_type: i.unit_type,
            unit_price: i.unit_price,
          };
        }),
      });
      Swal.fire({
        icon: "success",
        title: "Order placed!",
        text: "Your order has been submitted successfully. Our staff will process it and contact you soon.",
      });
      clearCart();
    } catch (e: unknown) {
      let title = "Order Failed";
      let message = "Failed to place order. Please try again.";

      if (
        typeof e === "object" &&
        e !== null &&
        "response" in e &&
        (e as { response?: { data?: { message?: string } } }).response
      ) {
        const responseData = (e as { response?: { data?: { message?: string } } }).response?.data;

        if (responseData?.message) {
          // Check if it's an insufficient stock error
          if (responseData.message.includes("Insufficient stock")) {
            title = "Insufficient Stock";

            // Extract product name and stock details from the error message
            const stockMatch = responseData.message.match(
              /Insufficient stock for (.+?)\. Available: (\d+), Required: (\d+)/
            );
            if (stockMatch) {
              const [, productName, available, required] = stockMatch;
              const shortage = parseInt(required) - parseInt(available);

              message = `${productName} has insufficient stock.\n\nAvailable: ${available} units\nRequired: ${required} units\nShortage: ${shortage} units\n\nPlease reduce the quantity or remove this item from your order.`;
            } else {
              message = responseData.message;
            }
          } else {
            message = responseData.message;
          }
        }
      } else if (e instanceof Error) {
        message = e.message;
      }

      Swal.fire({
        icon: "error",
        title: title,
        text: message,
        confirmButtonText: "OK",
        customClass: {
          popup: "swal-wide",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    try {
      if (isLogin) {
        await login({ email: data.email, password: data.password });
      } else {
        await register({
          email: data.email,
          password: data.password,
          name: (data as RegisterFormData).name,
          phone: (data as RegisterFormData).phone,
        });
      }
      setShowAuthDialog(false);
      loginForm.reset();
      registerForm.reset();
      // After successful auth, trigger post-auth navigation / order flow
      setShouldNavigateAfterAuth(true);
    } catch (error: unknown) {
      let errorMessage = "Incorrect email or password. Please check your details and try again.";

      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (
          error as {
            response?: { status?: number; headers?: { [key: string]: string } };
          }
        ).response &&
        (error as { response: { status: number } }).response.status === 429
      ) {
        const retryAfter = (error as {
          response: { headers?: { [key: string]: string } };
        }).response.headers?.["retry-after"];
        if (retryAfter) {
          errorMessage = `Too many login attempts. Please wait ${retryAfter} seconds and try again.`;
        } else {
          errorMessage = "Too many login attempts. Please wait and try again.";
        }
      }
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: errorMessage,
      });
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    loginForm.reset();
    registerForm.reset();
  };
  const [, setLocation] = useLocation();


  // Handle post-auth behavior for homepage dialog
  useEffect(() => {
    if (shouldNavigateAfterAuth && user) {
      // Wait until store context is available so we can build store-aware routes
      if (!currentStore?.name) {
        return;
      }

      const storePrefix = `/${encodeURIComponent(currentStore.name)}`;

      if (user.role === "client") {
        // For clients, continue with the existing order flow
        handleOrder();
      } else {
        // For staff roles, navigate to store POS
        setLocation(`${storePrefix}/pos`);
      }

      setShouldNavigateAfterAuth(false);
    }
  }, [shouldNavigateAfterAuth, user, currentStore, setLocation]);

  if (isLoading)
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  if (!Array.isArray(products)) {
    Swal.fire({
      icon: "error",
      title: "Product Load Error",
      text: "Failed to load products. Please refresh the page.",
    });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <StoreNav
        onLoginClick={() => setShowAuthDialog(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showSearch={true}
        onCheckout={handleCheckout}
        isSubmitting={isSubmitting}
      />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 text-white">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">
            Discover Amazing Products
          </h2>
          <p className="text-sm sm:text-lg md:text-xl opacity-90 mb-4 sm:mb-6">
            Shop the latest trends and find exactly what you're looking for
          </p>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-sm sm:text-base">4.8/5 Rating</span>
            </div>
            <div className="w-px h-4 sm:h-6 bg-white opacity-30"></div>
            <span className="opacity-90 text-sm sm:text-base">{products.length}+ Products</span>
          </div>
        </div>

        {/* Mobile Filters Sheet */}
        <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters & Sort</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              <CategoryFilter
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Sort By</h3>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">View Mode</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setViewMode("grid");
                      setShowMobileFilters(false);
                    }}
                    className="flex-1"
                  >
                    <Grid className="w-4 h-4 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setViewMode("list");
                      setShowMobileFilters(false);
                    }}
                    className="flex-1"
                  >
                    <List className="w-4 h-4 mr-2" />
                    List
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Filters and Sort - Compact Row */}
        <div className="flex sm:hidden items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-1 px-2 py-1"
            >
              <Filter className="w-3 h-3" />
              <span className="text-xs">Filters</span>
            </Button>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-low">Price ↑</SelectItem>
                <SelectItem value="price-high">Price ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid className="w-3 h-3" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Desktop Filters and Sort */}
        <div className="hidden sm:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Desktop Category Filter Sidebar */}
        {showFilters && (
          <div className="hidden lg:block w-64 bg-white rounded-lg shadow-md p-6 mb-6">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 sm:mb-6">
          <p className="text-gray-600 text-sm sm:text-base">
            Showing {paginatedProducts.length} of {sortedProducts.length} products
            {searchTerm && ` for "${searchTerm}"`}
          </p>
        </div>

        {/* Products Grid */}
        <div
          className={`grid gap-3 sm:gap-4 md:gap-6 mb-8 ${viewMode === "grid"
            ? "grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            : "grid-cols-1"
            }`}
        >
          {paginatedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onImageError={(productId) =>
                setImageErrorIds((prev) => ({
                  ...prev,
                  [productId]: true,
                }))
              }
              imageError={imageErrorIds[product.id] || false}
              viewMode={viewMode}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mb-8">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronDown className="w-4 h-4 rotate-90" />
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  size="sm"
                  variant={page === currentPage ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              );
            })}
            {totalPages > 5 && (
              <>
                <span className="text-gray-500">...</span>
                <Button
                  size="sm"
                  variant={totalPages === currentPage ? "default" : "outline"}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Next
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </Button>
          </div>
        )}
      </div>

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-md border-0 shadow-2xl">
          <DialogHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {isLogin ? "Welcome Back" : "Create Account"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {isLogin
                ? "Sign in to complete your order and track your purchases"
                : "Join us to complete your order and enjoy exclusive benefits"}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={
              isLogin ? loginForm.handleSubmit(onSubmit) : registerForm.handleSubmit(onSubmit)
            }
            className="space-y-4"
          >
            {!isLogin && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  {...registerForm.register("name")}
                  placeholder="Enter your full name"
                />
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-red-600 mt-1">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...(isLogin ? loginForm.register("email") : registerForm.register("email"))}
                placeholder="Enter your email"
              />
              {(isLogin
                ? loginForm.formState.errors.email
                : registerForm.formState.errors.email) && (
                  <p className="text-sm text-red-600 mt-1">
                    {isLogin
                      ? loginForm.formState.errors.email?.message
                      : registerForm.formState.errors.email?.message}
                  </p>
                )}
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...registerForm.register("phone")}
                  placeholder="Enter your phone number"
                />
                {registerForm.formState.errors.phone && (
                  <p className="text-sm text-red-600 mt-1">
                    {registerForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...(isLogin
                    ? loginForm.register("password")
                    : registerForm.register("password"))}
                  placeholder="Enter your password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {(isLogin
                ? loginForm.formState.errors.password
                : registerForm.formState.errors.password) && (
                  <p className="text-sm text-red-600 mt-1">
                    {isLogin
                      ? loginForm.formState.errors.password?.message
                      : registerForm.formState.errors.password?.message}
                  </p>
                )}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold shadow-lg"
              >
                {isLogin ? "Sign In" : "Create Account"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={toggleAuthMode}
                className="w-full border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
