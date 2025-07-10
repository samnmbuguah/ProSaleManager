import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, User, ShoppingCart } from "lucide-react";
import { CartItem } from "../../types/pos";
import type { Customer } from "@/types/customer";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (
    productId: number,
    unitType: string,
    quantity: number,
  ) => void;
  onUpdateUnitType: (productId: number, unitType: string) => void;
  onUpdateUnitPrice: (productId: number, price: number) => void;
  onRemoveItem?: (productId: number) => void;
  onCheckout: () => void;
  total: number;
  selectedCustomer?: Customer | null;
}

export const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onUpdateUnitType,
  onUpdateUnitPrice,
  onRemoveItem,
  onCheckout,
  total,
  selectedCustomer,
}) => {
  const formatPrice = (price: string | number) => {
    return `KSh ${Number(price).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getUnitPrice = (product: CartItem["product"], unitType: string) => {
    switch (unitType) {
      case "piece":
        return product.piece_selling_price || 0;
      case "pack":
        return product.pack_selling_price || 0;
      case "dozen":
        return product.dozen_selling_price || 0;
      default:
        return product.piece_selling_price || 0;
    }
  };

  const handleUnitTypeChange = (productId: number, unitType: string) => {
    const item = items.find((item) => item.product.id === productId);
    if (item) {
      const newPrice = getUnitPrice(item.product, unitType);
      onUpdateUnitType(productId, unitType);
      onUpdateUnitPrice(productId, newPrice);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Current Sale
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Customer Info */}
        {selectedCustomer && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Customer
              </span>
            </div>
            <p className="font-semibold text-sm">{selectedCustomer.name}</p>
            <p className="text-xs text-gray-600">{selectedCustomer.phone}</p>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-auto space-y-3">
          {items.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Cart is empty</p>
              <p className="text-xs">
                Search and select products to add to cart
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.unit_type}`}
                  className="border rounded-lg p-3 bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-semibold text-sm">
                        {item.product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.product.sku}
                      </div>
                    </div>
                    {onRemoveItem && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.product.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div>
                      <label
                        htmlFor={`unit-type-${item.product.id}`}
                        className="text-xs text-gray-600"
                      >
                        Unit Type
                      </label>
                      <Select
                        value={item.unit_type}
                        onValueChange={(value) =>
                          handleUnitTypeChange(item.product.id, value)
                        }
                      >
                        <SelectTrigger
                          id={`unit-type-${item.product.id}`}
                          className="h-8 text-xs"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="pack">Pack</SelectItem>
                          <SelectItem value="dozen">Dozen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label
                        htmlFor={`quantity-${item.product.id}`}
                        className="text-xs text-gray-600"
                      >
                        Quantity
                      </label>
                      <input
                        id={`quantity-${item.product.id}`}
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          onUpdateQuantity(
                            item.product.id,
                            item.unit_type,
                            Number(e.target.value),
                          )
                        }
                        className="w-full h-8 border rounded px-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-gray-600">Unit Price:</span>
                      <span className="font-medium ml-1">
                        {formatPrice(item.unit_price)}
                      </span>
                    </div>
                    <div className="font-semibold">
                      {formatPrice(item.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="mt-4 space-y-3 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">{formatPrice(total)}</span>
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={onCheckout}
            disabled={items.length === 0 || !selectedCustomer}
          >
            {!selectedCustomer
              ? "Select Customer First"
              : "Proceed to Checkout"}
          </Button>

          {!selectedCustomer && (
            <p className="text-xs text-red-500 text-center">
              Please select a customer before checkout
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
