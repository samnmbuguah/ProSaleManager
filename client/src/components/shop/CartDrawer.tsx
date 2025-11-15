import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/use-auth";
import { useStoreContext } from "@/contexts/StoreContext";
import { useLocation } from "wouter";

interface CartDrawerProps {
  onCheckout: () => void;
  clientCheckoutHandler?: () => void;
  isSubmitting?: boolean;
}

export default function CartDrawer({ 
  onCheckout, 
  clientCheckoutHandler,
  isSubmitting = false 
}: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { currentStore } = useStoreContext();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleCheckout = () => {
    // If clientCheckoutHandler is provided (homepage), use it
    if (clientCheckoutHandler) {
      clientCheckoutHandler();
      setIsOpen(false);
      return;
    }

    // Otherwise, use the default behavior (redirect to POS or show auth)
    if (!isAuthenticated) {
      onCheckout();
    } else {
      const storePrefix = currentStore?.name ? `/${encodeURIComponent(currentStore.name)}` : "";
      setLocation(storePrefix ? `${storePrefix}/pos` : "/pos");
    }
    setIsOpen(false);
  };

  const getUnitLabel = (unitType: string) => {
    switch (unitType) {
      case "piece":
        return "per piece";
      case "pack":
        return "per pack";
      case "dozen":
        return "per dozen";
      default:
        return "per piece";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative bg-white hover:bg-gray-50 border-gray-200"
        >
          <ShoppingCart className="w-4 h-4" />
          {cart.items.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Shopping Cart
            {cart.items.length > 0 && (
              <Badge variant="secondary">
                {cart.items.reduce((sum, item) => sum + item.quantity, 0)} items
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {cart.items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
                <p className="text-sm text-gray-400">Add some items to get started</p>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      {/* Product Image */}
                      <div className="w-16 h-16 flex-shrink-0">
                        <img
                          src={
                            item.product.images?.[0] ||
                            item.product.image_url ||
                            "/placeholder-product.jpg"
                          }
                          alt={item.product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                        <p className="text-xs text-gray-500 mb-1">{getUnitLabel(item.unit_type)}</p>
                        <p className="text-sm font-semibold text-green-600">
                          KSh {item.unit_price.toLocaleString()}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center border rounded-lg">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="px-2 text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              {/* Cart Summary */}
              <div className="py-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">KSh {cart.total.toLocaleString()}</span>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isSubmitting 
                    ? "Processing..." 
                    : isAuthenticated 
                      ? "Checkout" 
                      : "Login to Checkout"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
