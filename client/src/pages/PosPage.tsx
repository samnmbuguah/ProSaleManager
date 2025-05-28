import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types/product";
import type { CartItem } from "@/types/pos";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/contexts/CartContext";

const STOCK_UNITS = ["piece", "pack", "dozen"] as const;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

const PosPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateUnitPrice,
    updateUnitType,
    clearCart,
    addDeliveryService,
  } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa">("cash");
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<
    Array<{ id: number; name: string; phone?: string }>
  >([]);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [currentSaleId, setCurrentSaleId] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSendingReceipt, setIsSendingReceipt] = useState(false);
  const [isLoading, setIsLoading] = useState({
    products: false,
    customers: false,
    checkout: false,
  });
  const [apiError, setApiError] = useState({
    products: false,
    customers: false,
  });

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, []);

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

  const fetchProducts = async () => {
    setIsLoading((prev) => ({ ...prev, products: true }));
    setApiError((prev) => ({ ...prev, products: false }));

    try {
      const data = await fetchWithRetry(
        `${import.meta.env.VITE_API_URL}/products`,
        { credentials: "include" },
      );
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setApiError((prev) => ({ ...prev, products: true }));
      toast({
        title: "Connection Error",
        description:
          "Could not connect to the server. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, products: false }));
    }
  };

  const fetchCustomers = async () => {
    setIsLoading((prev) => ({ ...prev, customers: true }));
    setApiError((prev) => ({ ...prev, customers: false }));

    try {
      const data = await fetchWithRetry(
        `${import.meta.env.VITE_API_URL}/customers`,
        { credentials: "include" },
      );
      setCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setApiError((prev) => ({ ...prev, customers: true }));
      toast({
        title: "Connection Error",
        description:
          "Could not connect to the server. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading((prev) => ({ ...prev, customers: false }));
    }
  };

  const calculateUnitPrice = (product: Product): number => {
    const numericPrice = parseFloat(product.selling_price);
    switch (product.stock_unit) {
      case "dozen":
        return numericPrice / 12;
      case "pack":
        return numericPrice / 6;
      default:
        return numericPrice;
    }
  };

  // Add a function to get or create a delivery service product
  const getDeliveryServiceProduct = useCallback(() => {
    // Try to find the delivery service in the products array
    const existingService = products.find((p) => p.product_code === "SRV001");

    if (existingService) {
      console.log("Found existing delivery service:", existingService);
      return existingService;
    }

    // If not found, create a fallback delivery service
    console.log("Creating fallback delivery service");
    const fallbackDeliveryService = {
      id: -1, // Use a negative ID to indicate it's not from the database
      name: "Delivery Service",
      product_code: "SRV001",
      description: "Delivery service fee",
      category_id: null,
      selling_price: "200",
      buying_price: "0",
      quantity: 999,
      available_units: 999,
      stock_unit: "piece",
      image_url: null,
      barcode: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return fallbackDeliveryService;
  }, [products]);

  const handleAddDelivery = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Prevent default behavior and stop propagation to isolate this event
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      try {
        // Find or create delivery service product
        const deliveryService = getDeliveryServiceProduct();
        console.log("ADD DELIVERY - Delivery service:", deliveryService);

        if (!deliveryService) {
          console.error("ADD DELIVERY - Failed to create delivery service");
          toast({
            title: "Error",
            description: "Failed to create delivery service",
            variant: "destructive",
          });
          return;
        }

        // Check if delivery is already in cart
        const hasDelivery = cart.items.some(
          (item) => item.product && item.product.product_code === "SRV001",
        );

        console.log("ADD DELIVERY - Delivery already in cart:", hasDelivery);

        if (hasDelivery) {
          toast({
            title: "Error",
            description: "Delivery charge already added",
            variant: "destructive",
          });
          return;
        }

        // Add the delivery service using the context function
        addDeliveryService(deliveryService);

        toast({
          title: "Success",
          description: "Delivery service added to cart",
        });
      } catch (error) {
        console.error("ADD DELIVERY - Error:", error);
        toast({
          title: "Error",
          description: "Failed to add delivery service. Please try again.",
          variant: "destructive",
        });
      }
    },
    [cart, getDeliveryServiceProduct, toast, addDeliveryService],
  );

  const handleAddProductToCart = (product: Product) => {
    // Special handling for delivery service
    if (product.product_code === "SRV001") {
      const hasDelivery = cart.items.some(
        (item) => item.product.product_code === "SRV001",
      );
      if (hasDelivery) {
        toast({
          title: "Error",
          description: "Delivery charge already added",
          variant: "destructive",
        });
        return;
      }
    }

    addToCart(product);
  };

  const handleRemoveItem = (itemId: number) => {
    removeFromCart(itemId);
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/products/search?q=${searchQuery}`,
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
  };

  const handleCheckout = async () => {
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

      // Format sale data for API
      const saleData = {
        items: cart.items.map((item) => {
          // Special handling for delivery service
          if (item.product.product_code === "SRV001") {
            console.log("CHECKOUT - Processing delivery service item");
          }

          return {
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            unit_type: item.unit_type || item.product.stock_unit,
          };
        }),
        total: cart.total,
        customer_id: selectedCustomer,
        payment_method: paymentMethod,
        status: "completed",
        payment_status: "paid",
        amount_paid: cart.total,
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

  // Add a new function to fetch sale details for the receipt
  const fetchSaleDetails = async (saleId: number) => {
    try {
      const response = await fetchWithRetry(
        `${import.meta.env.VITE_API_URL}/sales/${saleId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );

      if (!response) {
        throw new Error("Failed to fetch sale details");
      }

      return response;
    } catch (error) {
      console.error("Error fetching sale details:", error);
      toast({
        title: "Error",
        description: "Failed to load receipt details",
        variant: "destructive",
      });
      return null;
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden px-2 mx-auto">
      <div className="grid grid-cols-12 h-full">
        {/* Products Section */}
        <div className="col-span-8 h-full p-4 overflow-hidden flex flex-col">
          {apiError.products && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                Could not connect to the server.
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

          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading.products
                ? // Show loading skeletons
                  Array(8)
                    .fill(0)
                    .map((_, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardContent className="p-4">
                          <Skeleton className="h-32 w-full mb-2" />
                          <Skeleton className="h-5 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3 mb-2" />
                          <Skeleton className="h-4 w-1/2" />
                        </CardContent>
                      </Card>
                    ))
                : // Filter out the delivery service from the grid
                  products
                    .filter((product) => product.product_code !== "SRV001")
                    .map((product) => (
                      <Card
                        key={product.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleAddProductToCart(product)}
                      >
                        <CardContent className="p-4">
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-32 object-cover rounded-md mb-2"
                            />
                          )}
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-gray-600">
                            Stock: {product.quantity} {product.stock_unit}
                            {product.available_units !== product.quantity && (
                              <span className="ml-2">
                                ({product.available_units} pieces)
                              </span>
                            )}
                          </p>
                          <p className="text-sm font-medium">
                            KSh {calculateUnitPrice(product).toFixed(2)} per
                            piece
                          </p>
                        </CardContent>
                      </Card>
                    ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="col-span-4 h-full p-4 overflow-hidden">
          <Card className="h-full">
            <CardContent className="h-full flex flex-col p-4">
              <h2 className="text-xl font-bold mb-4">Cart</h2>
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 pb-4 border-b"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium">{item.product.name}</h3>
                        <div className="mt-1">
                          <Label className="text-sm text-gray-600">
                            Price per unit
                          </Label>
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) =>
                              updateUnitPrice(
                                item.id,
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="h-8 text-sm mt-1"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              updateQuantity(item.id, item.quantity - 1);
                            }}
                            disabled={item.product.product_code === "SRV001"}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.id,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-20 text-center"
                            disabled={item.product.product_code === "SRV001"}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              updateQuantity(item.id, item.quantity + 1);
                            }}
                            disabled={item.product.product_code === "SRV001"}
                          >
                            +
                          </Button>
                        </div>
                        <div className="mt-2">
                          <Select
                            value={item.unit_type || item.product.stock_unit}
                            onValueChange={(value) =>
                              updateUnitType(item.id, value)
                            }
                            disabled={item.product.product_code === "SRV001"}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {STOCK_UNITS.map((unit) => (
                                <SelectItem key={unit} value={unit}>
                                  {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          KSh {item.total.toFixed(2)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveItem(item.id);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span>KSh {cart.total.toFixed(2)}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const button = e.currentTarget;
                      // Disable button temporarily to prevent double-clicks
                      button.disabled = true;
                      try {
                        handleAddDelivery(e);
                      } finally {
                        // Re-enable after a short delay
                        setTimeout(() => {
                          button.disabled = false;
                        }, 1000);
                      }
                    }}
                    disabled={isLoading.products || apiError.products}
                  >
                    Add Delivery (KSh 200)
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => setIsCheckoutDialogOpen(true)}
                    disabled={cart.items.length === 0 || isLoading.checkout}
                  >
                    {isLoading.checkout
                      ? "Processing..."
                      : "Proceed to Checkout"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog
        open={isCheckoutDialogOpen}
        onOpenChange={setIsCheckoutDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Sale</DialogTitle>
            <DialogDescription>
              Select payment method and customer details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: "cash" | "mpesa") =>
                  setPaymentMethod(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer (Optional)</Label>
              <Select
                value={
                  selectedCustomer ? selectedCustomer.toString() : "walk_in"
                }
                onValueChange={(value) =>
                  setSelectedCustomer(
                    value !== "walk_in" ? parseInt(value) : null,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk_in">Walk-in Customer</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem
                      key={customer.id}
                      value={customer.id.toString()}
                    >
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Amount:</span>
                <span>KSh {cart.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCheckoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCheckout} disabled={isLoading.checkout}>
              {isLoading.checkout ? "Processing..." : "Complete Sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog
        open={isReceiptDialogOpen}
        onOpenChange={(open) => {
          // Only allow manual closing, not auto-closing
          if (!open && !isSendingReceipt) {
            setIsReceiptDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Receipt</DialogTitle>
            <DialogDescription>
              Sale #{currentSaleId} completed successfully
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                type="tel"
                placeholder="+254..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <p>Send a receipt to the customer via WhatsApp or SMS</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleSendReceipt("sms")}
              disabled={!phoneNumber || isSendingReceipt}
            >
              Send via SMS
            </Button>
            <Button
              onClick={() => handleSendReceipt("whatsapp")}
              disabled={!phoneNumber || isSendingReceipt}
            >
              Send via WhatsApp
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsReceiptDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PosPage;
