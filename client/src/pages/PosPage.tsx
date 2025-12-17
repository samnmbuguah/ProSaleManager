import React, { useState, useEffect } from "react";
import type { Product } from "@/types/product";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw, User, ShoppingCart, History } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { Cart } from "@/components/pos/Cart";
import { CheckoutDialog, type PaymentDetails } from "@/components/pos/CheckoutDialog";
import { ReceiptDialog } from "@/components/pos/ReceiptDialog";
import { useProducts } from "@/hooks/use-products";
import { useCustomers } from "@/hooks/useCustomers";
import { useFavorites } from "@/hooks/use-favorites";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCreateSale } from "@/hooks/use-sales-query";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

const PosPage: React.FC = () => {
  const createSaleMutation = useCreateSale();
  const { toast } = useToast();
  const { user } = useAuthContext();

  // Initialize favorites after user is available
  const { refetch: refetchFavorites } = useFavorites(!!user);

  const { products: allProducts, refetch: refetchProducts, error } = useProducts();
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const {
    cart,
    addToCart,
    updateQuantity,
    updateUnitType,
    updateUnitPrice,
    removeFromCart,
    clearCart,
  } = useCart();
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "split">("cash");
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const { customers, fetchCustomers } = useCustomers();
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState({
    checkout: false,
    isCheckingOut: false,
  });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [isHistoricalMode, setIsHistoricalMode] = useState(false);

  // Load products and customers on component mount and when historical mode changes
  useEffect(() => {
    // Make sure we have the refetch functions before proceeding
    if (!refetchProducts || !fetchCustomers) return;

    const fetchData = async () => {
      try {
        // Use the correctly named refetch functions
        const productsPromise = refetchProducts();
        const customersPromise = fetchCustomers();

        await Promise.all([productsPromise, customersPromise]);

        // If in historical mode and user is authenticated, also fetch favorites
        if (isHistoricalMode && user && refetchFavorites) {
          await refetchFavorites();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [refetchProducts, fetchCustomers, refetchFavorites, isHistoricalMode, user]);

  // Initialize displayed products when allProducts changes (including empty arrays)
  useEffect(() => {
    console.log("allProducts changed:", allProducts?.length, "products");
    setDisplayedProducts(allProducts || []);
  }, [allProducts]);

  // Set Walk-in Customer as default when customers are loaded
  useEffect(() => {
    if (customers && customers.length > 0 && !selectedCustomer) {
      // Find the Walk-in Customer (backend should have created it)
      const walkInCustomer = customers.find((c) => c.name === "Walk-in Customer");
      if (walkInCustomer) {
        setSelectedCustomer(walkInCustomer.id);
      } else if (customers.length > 0) {
        // If no Walk-in Customer found, select the first customer
        setSelectedCustomer(customers[0].id);
      }
    }
  }, [customers, selectedCustomer]);

  // Enhanced add to cart function that defaults to piece pricing
  const handleAddToCart = (product: Product) => {
    // Default to piece pricing
    const unitType = "piece";
    // Ensure unitPrice is a number (convert from string if needed)
    const unitPrice = typeof product.piece_selling_price === 'string'
      ? parseFloat(product.piece_selling_price)
      : Number(product.piece_selling_price) || 0;

    addToCart(product, unitType, unitPrice);

    toast({
      title: "Added to Cart",
      description: `${product.name} added to cart (${unitType})`,
    });
  };

  const handleCheckout = async (
    amountTendered: number,
    change: number,
    historicalDate?: string
  ) => {
    setIsLoading({ ...isLoading, isCheckingOut: true });
    try {
      // Calculate subtotal from cart items (ensure all totals are numbers)
      const subtotal = cart.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      const total = subtotal + Number(deliveryFee);

      const saleData = {
        customer_id: selectedCustomer,
        items: cart.items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_type: item.unit_type,
          unit_price: Number(item.unit_price) || 0,
          total: Number(item.total) || 0,
        })),
        total: total,
        delivery_fee: Number(deliveryFee),
        payment_method: paymentMethod,
        payment_details: paymentMethod === "split" ? paymentDetails : null,
        status: "completed",
        payment_status: "paid",
        amount_paid: paymentMethod === "cash" ? Number(amountTendered) || 0 : total,
        change_amount: Number(change) || 0,
        created_at: historicalDate,
      };

      const result = await createSaleMutation.mutateAsync(saleData);
      const saleId = result.id;
      setCurrentSaleId(saleId);
      setIsCheckoutDialogOpen(false);
      setIsReceiptDialogOpen(true);
      clearCart();
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to complete checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading({ ...isLoading, isCheckingOut: false });
    }
  };

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);

  return (
    <div className="container mx-auto p-2 sm:p-4 mt-16">
      {/* Header with Customer Selection */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full sm:w-auto">
            {/* Historical Sales Toggle - Only for admin and super_admin */}
            {(user?.role === "admin" || user?.role === "super_admin") && (
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                <History className="h-5 w-5 text-gray-500" />
                <Label htmlFor="historical-mode" className="text-sm text-gray-600">
                  Historical Sales
                </Label>
                <Switch
                  id="historical-mode"
                  checked={isHistoricalMode}
                  onCheckedChange={setIsHistoricalMode}
                />
              </div>
            )}
            <div className="flex-1 flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
              <User className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <span className="text-sm text-gray-600 whitespace-nowrap">Customer:</span>
              <div className="w-full">
                <Select
                  value={selectedCustomer?.toString() || ""}
                  onValueChange={(value) => setSelectedCustomer(value ? parseInt(value) : null)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Products Section - Shown first on mobile, on left on desktop */}
        <div className="w-full lg:w-2/3 order-2 lg:order-1">
          <Card className="flex-1 flex flex-col h-full">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Products
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 overflow-hidden">
              {!!error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection Error</AlertTitle>
                  <AlertDescription>
                    Failed to load products. Please try again later.
                    <Button variant="outline" size="sm" onClick={() => refetchProducts()} className="ml-2">
                      <RefreshCcw className="h-4 w-4 mr-1" /> Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex-1 min-h-0 overflow-y-auto">
                <ProductSearch
                  products={(displayedProducts || []).filter(
                    (product) => product?.sku !== "SRV001"
                  )}
                  onSelect={handleAddToCart}
                  searchProducts={async (query: string) => {
                    try {
                      if (!query.trim()) {
                        setDisplayedProducts(allProducts || []);
                        return;
                      }
                      const res = await api.get(API_ENDPOINTS.products.search(query));
                      const searchResults = (res.data && res.data.data) ? res.data.data : (res.data || []);
                      setDisplayedProducts(searchResults as Product[]);
                    } catch (error) {
                      console.error("Error:", error);
                      toast({
                        title: "Error",
                        description: "Failed to search products",
                        variant: "destructive",
                      });
                      setDisplayedProducts(allProducts || []);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section - Shown second on mobile, on right on desktop */}
        <div className="w-full lg:w-1/3 order-1 lg:order-2">
          <Cart
            items={cart.items}
            onUpdateQuantity={(itemId, _unitType, quantity) => {
              updateQuantity(itemId, quantity);
            }}
            onUpdateUnitType={updateUnitType}
            onUpdateUnitPrice={updateUnitPrice}
            onRemoveItem={removeFromCart}
            onCheckout={() => setIsCheckoutDialogOpen(true)}
            total={cart.total}
            selectedCustomer={selectedCustomerData}
          />
        </div>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={isCheckoutDialogOpen}
        onOpenChange={setIsCheckoutDialogOpen}
        cartTotal={cart.total}
        deliveryFee={deliveryFee}
        setDeliveryFee={setDeliveryFee}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        setPaymentDetails={setPaymentDetails}
        customers={customers}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        onCheckout={handleCheckout}
        isLoadingCheckout={isLoading.isCheckingOut}
        isHistoricalMode={isHistoricalMode}
      />

      {/* Receipt Dialog */}
      <ReceiptDialog
        open={isReceiptDialogOpen}
        onOpenChange={setIsReceiptDialogOpen}
        currentSaleId={currentSaleId}
      />
    </div>
  );
};

export default PosPage;
