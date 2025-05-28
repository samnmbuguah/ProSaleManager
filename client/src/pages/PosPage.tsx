import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { ProductSearch } from "@/components/pos/ProductSearch";
import { Cart } from "@/components/pos/Cart";
import { CheckoutDialog } from "@/components/pos/CheckoutDialog";
import type { CartItem } from "@/types/pos";
import { ReceiptDialog } from "@/components/pos/ReceiptDialog";
import { useProducts } from "@/hooks/useProducts";
import { useCustomers } from "@/hooks/useCustomers";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

const PosPage: React.FC = () => {
  const {
    products,
    error: productsError,
    fetchProducts,
    setProducts,
  } = useProducts();
  const {
    items: cartItems,
    addToCart,
    updateQuantity,
    updateUnitType,
    updateUnitPrice,
    clearCart,
    total: cartTotal,
  } = useCart();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const { customers, fetchCustomers } = useCustomers();
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);
  const [isLoading, setIsLoading] = useState({
    checkout: false,
  });
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, [fetchProducts, fetchCustomers]);

  const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    retries = MAX_RETRIES,
  ) => {
    try {
      console.log(`Fetching ${url} with options:`, options);
      const response = await fetch(url, options);

      // Log the response status to help with debugging
      console.log(`Response status: ${response.status} for ${url}`);

      // First check if the response is ok (status in the range 200-299)
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error: ${response.status}`, errorText);
        throw new Error(
          `Server returned ${response.status}: ${errorText || "No error details"}`,
        );
      }

      // Then try to parse the JSON
      try {
        const data = await response.json();
        console.log(`Response data for ${url}:`, data);
        return data;
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Invalid JSON response from server");
      }
    } catch (error) {
      console.error(`Fetch error for ${url}:`, error);

      // If we have retries left, wait and try again
      if (retries > 0) {
        console.log(`Retrying ${url}, ${retries} attempts left`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return fetchWithRetry(url, options, retries - 1);
      }

      // No more retries, rethrow the error
      throw error;
    }
  };

  const handleCheckout = async () => {
    try {
      setIsLoading((prev) => ({ ...prev, checkout: true }));

      if (cartItems.length === 0) {
        toast({
          title: "Error",
          description: "Cart is empty",
          variant: "destructive",
        });
        return;
      }

      // Format sale data for API
      const saleData = {
        items: cartItems
          .filter((item) => item.product && item.product.id > 0)
          .map((item) => ({
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            unit_type: item.unit_type || item.product.stock_unit,
          })),
        total: cartTotal + deliveryFee,
        delivery_fee: deliveryFee,
        customer_id: selectedCustomer,
        payment_method: paymentMethod,
        status: "completed",
        payment_status: "paid",
        amount_paid: cartTotal + deliveryFee,
        change_amount: 0,
      };

      console.log("CHECKOUT - Sending sale data:", JSON.stringify(saleData));

      // Attempt to create the sale
      const response = await fetchWithRetry(
        `${import.meta.env.VITE_API_URL}/sales`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(saleData),
          credentials: "include",
        },
      );

      console.log("CHECKOUT - Sale created successfully, response:", response);

      // Verify response format and extract sale ID
      let saleId;
      if (response && response.data && response.data.id) {
        saleId = response.data.id;
      } else if (response && response.id) {
        saleId = response.id;
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

      // Pre-fill the phone number if available
      const customer = customers.find((c) => c.id === selectedCustomer);
      if (customer?.phone) {
        setPhoneNumber(customer.phone);
      }

      // Open the receipt dialog immediately
      setIsReceiptDialogOpen(true);
    } catch (error) {
      console.error("CHECKOUT - Error:", error);

      // Show detailed error message
      toast({
        title: "Server Error",
        description:
          error instanceof Error
            ? `Failed to complete checkout: ${error.message}`
            : "Failed to complete checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, checkout: false }));
    }
  };

  const handleSendReceipt = async (method: "whatsapp" | "sms") => {
    try {
      if (!currentSaleId || !phoneNumber) {
        toast({
          title: "Error",
          description: "Missing sale ID or phone number",
          variant: "destructive",
        });
        return;
      }

      setIsSendingReceipt(true);

      const response = await fetchWithRetry(
        `${import.meta.env.VITE_API_URL}/sales/${currentSaleId}/receipt/${method}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber }),
          credentials: "include",
        },
      );

      if (!response) {
        throw new Error(`Failed to send ${method} receipt`);
      }

      toast({
        title: "Success",
        description: `Receipt sent via ${method === "whatsapp" ? "WhatsApp" : "SMS"}!`,
      });

      // Close the dialog after sending
      setTimeout(() => {
        setIsReceiptDialogOpen(false);
        setPhoneNumber("");
        setCurrentSaleId(null);
      }, 2000);
    } catch (error) {
      console.error(`Error sending ${method} receipt:`, error);
      toast({
        title: "Error",
        description: `Failed to send receipt via ${method === "whatsapp" ? "WhatsApp" : "SMS"}`,
        variant: "destructive",
      });
    } finally {
      setIsSendingReceipt(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden px-2 mx-auto pt-16">
      <div className="grid grid-cols-12 h-full">
        {/* Products Section */}
        <div className="col-span-8 h-full p-4 overflow-hidden flex flex-col">
          {productsError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                {productsError}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchProducts}
                  className="ml-2"
                >
                  <RefreshCcw className="h-4 w-4 mr-1" /> Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex-1 overflow-y-auto">
            <ProductSearch
              products={products.filter(
                (product) => product.product_code !== "SRV001",
              )}
              onSelect={addToCart}
              searchProducts={async (query: string) => {
                try {
                  const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/products/search?q=${query}`,
                  );
                  if (!response.ok) throw new Error("Failed to search products");

                  const data = await response.json();
                  setProducts(data);
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
        </div>

        {/* Cart Section */}
        <div className="col-span-4 h-full p-4 overflow-hidden">
          <Cart
            items={cartItems as unknown as CartItem[]}
            onUpdateQuantity={(
              productId: number,
              unitType: string,
              quantity: number,
            ) => updateQuantity(productId, quantity)}
            onUpdateUnitType={updateUnitType}
            onUpdateUnitPrice={updateUnitPrice}
            onCheckout={() => setIsCheckoutDialogOpen(true)}
            total={cartTotal}
          />
        </div>
      </div>

      {/* Checkout Dialog */}
      <CheckoutDialog
        open={isCheckoutDialogOpen}
        onOpenChange={setIsCheckoutDialogOpen}
        cartTotal={cartTotal}
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
        onOpenChange={(open) => {
          if (!open && !isSendingReceipt) setIsReceiptDialogOpen(false);
        }}
        currentSaleId={currentSaleId}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        isSendingReceipt={isSendingReceipt}
        handleSendReceipt={handleSendReceipt}
      />
    </div>
  );
};

export default PosPage;
