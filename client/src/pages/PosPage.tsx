import React, { useState, useEffect } from "react";
import type { Product } from "@/types/product";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw, User, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { Cart } from "@/components/pos/Cart";
import { CheckoutDialog } from "@/components/pos/CheckoutDialog";
import type { CartItem } from "@/types/pos";
import { ReceiptDialog } from "@/components/pos/ReceiptDialog";
import { useProducts } from "@/hooks/use-products";
import { useCustomers } from "@/hooks/useCustomers";
import { api } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PosPage: React.FC = () => {
  const { products, refetch, error } = useProducts();
  const {
    cart,
    addToCart,
    updateQuantity,
    updateUnitType,
    updateUnitPrice,
    removeFromCart,
    clearCart,
  } = useCart();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const { customers, fetchCustomers } = useCustomers();
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState({
    checkout: false,
  });
  const [deliveryFee, setDeliveryFee] = useState(200);

  // Load products and customers on component mount
  // Note: In development mode with React.StrictMode, this may run twice
  // which is expected behavior and helps catch certain types of bugs
  useEffect(() => {
    refetch();
    fetchCustomers();
  }, [refetch, fetchCustomers]);

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
    const unitPrice = product.piece_selling_price || 0;

    addToCart(product, unitType, unitPrice);

    toast({
      title: "Added to Cart",
      description: `${product.name} added to cart (${unitType})`,
    });
  };

  const handleCheckout = async (amountTendered: number, change: number) => {
    try {
      setIsLoading((prev) => ({ ...prev, checkout: true }));

      if (cart.items.length === 0) {
        toast({
          title: "Error",
          description: "Cart is empty",
          variant: "destructive",
        });
        return;
      }

      if (!selectedCustomer) {
        toast({
          title: "Error",
          description: "Please select a customer",
          variant: "destructive",
        });
        return;
      }

      // Format sale data for API
      const saleData = {
        items: (cart.items || [])
          .filter((item) => item?.product && item.product.id > 0)
          .map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            unit_type: item.unit_type || "piece",
          })),
        total: cart.total + deliveryFee,
        delivery_fee: deliveryFee,
        customer_id: selectedCustomer,
        payment_method: paymentMethod,
        status: "completed",
        payment_status: "paid",
        amount_paid: amountTendered,
        change_amount: change,
      };

      // Use the configured API instance
      const response = await api.post("/sales", saleData);

      // Verify response format and extract sale ID
      let saleId;
      if (response.data && response.data.data && response.data.data.id) {
        saleId = response.data.data.id;
      } else if (response.data && response.data.id) {
        saleId = response.data.id;
      } else {
        throw new Error("Invalid server response format");
      }

      // Success - show toast and clear cart
      toast({
        title: "Success",
        description: "Checkout successful!",
      });

      // ONLY clear the cart after successful checkout using the context function
      clearCart();

      // Close the checkout dialog immediately
      setIsCheckoutDialogOpen(false);

      // Set the sale ID for the receipt dialog
      setCurrentSaleId(saleId);

      // Open the receipt dialog immediately
      setIsReceiptDialogOpen(true);
    } catch (error: unknown) {
      // Show detailed error message
      const errorMessage =
        error instanceof Error ? error.message : "Failed to complete checkout. Please try again.";
      toast({
        title: "Server Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, checkout: false }));
    }
  };

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);

  return (
    <div className="container mx-auto p-2 sm:p-4 mt-16">
      {/* Header with Customer Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600">Customer:</span>
            </div>
            <Select
              value={selectedCustomer?.toString() || ""}
              onValueChange={(value) => setSelectedCustomer(value ? parseInt(value) : null)}
            >
              <SelectTrigger className="w-full sm:w-64">
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
        {/* Remove the Selected Customer card/band here */}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Products Section */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Products
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Connection Error</AlertTitle>
                  <AlertDescription>
                    Failed to load products. Please try again later.
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
                      <RefreshCcw className="h-4 w-4 mr-1" /> Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex-1 min-h-0 overflow-y-auto">
                <ProductSearch
                  products={(products || []).filter((product) => product?.sku !== "SRV001")}
                  onSelect={handleAddToCart}
                  searchProducts={async (query: string) => {
                    try {
                      const response = await fetch(
                        `${import.meta.env.VITE_API_URL}/products/search?q=${query}`,
                        {
                          credentials: "include",
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }
                      );
                      if (!response.ok) {
                        throw new Error("Failed to search products");
                      }

                      const data = await response.json();
                      if (data.message === "getProducts stub") {
                        throw new Error("Stub response received - API not properly configured");
                      }
                      // setProducts(data.data || []) // This line is removed as per the edit hint
                    } catch (error) {
                      console.error("Error:", error);
                      toast({
                        title: "Error",
                        description: "Failed to search products",
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart Section */}
        <div className="w-full lg:w-1/3 flex flex-col">
          <Cart
            items={cart.items as CartItem[]}
            onUpdateQuantity={(productId: number, _unitType: string, quantity: number) =>
              updateQuantity(productId, quantity)
            }
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
        customers={customers}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        onCheckout={handleCheckout}
        isLoadingCheckout={isLoading.checkout}
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
