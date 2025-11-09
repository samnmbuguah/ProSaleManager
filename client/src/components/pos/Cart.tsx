import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, User, ShoppingCart, AlertTriangle } from "lucide-react";
import { CartItem } from "../../types/pos";
import type { Customer } from "@/types/customer";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, unitType: string, quantity: number) => void;
  onUpdateUnitType: (productId: number, unitType: string) => void;
  onUpdateUnitPrice: (productId: number, price: number) => void;
  onRemoveItem?: (productId: number) => void;
  onCheckout: () => void;
  total: number;
  selectedCustomer?: Customer | null;
}

interface StockValidationResult {
  productId: number;
  productName: string;
  available: number;
  required: number;
  isInsufficient: boolean;
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
  const [stockValidation, setStockValidation] = useState<StockValidationResult[]>([]);
  const [isValidatingStock, setIsValidatingStock] = useState(false);

  const formatPrice = (price: string | number) => {
    return `KSh ${Number(price).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getUnitPrice = (product: CartItem["product"], unitType: string): number => {
    let price: number | string | null | undefined;
    switch (unitType) {
      case "piece":
        price = product.piece_selling_price;
        break;
      case "pack":
        price = product.pack_selling_price;
        break;
      case "dozen":
        price = product.dozen_selling_price;
        break;
      default:
        price = product.piece_selling_price;
    }
    return typeof price === 'string' ? parseFloat(price) : Number(price) || 0;
  };

  // Function to validate stock for all cart items
  const validateStock = async () => {
    if (items.length === 0) {
      setStockValidation([]);
      return;
    }

    setIsValidatingStock(true);
    try {
      const validationResults: StockValidationResult[] = [];

      for (const item of items) {
        // Convert cart quantity to base units (pieces) based on unit_type
        let requiredQuantity = item.quantity;
        if (item.unit_type === "pack") {
          requiredQuantity = item.quantity * 3; // 1 pack = 3 pieces
        } else if (item.unit_type === "dozen") {
          requiredQuantity = item.quantity * 12; // 1 dozen = 12 pieces
        }

        const availableQuantity = item.product.quantity || 0;
        const isInsufficient = availableQuantity < requiredQuantity;

        validationResults.push({
          productId: item.product.id,
          productName: item.product.name,
          available: availableQuantity,
          required: requiredQuantity,
          isInsufficient,
        });
      }

      setStockValidation(validationResults);
    } catch (error) {
      console.error("Error validating stock:", error);
      setStockValidation([]);
    } finally {
      setIsValidatingStock(false);
    }
  };

  // Validate stock whenever cart items change
  useEffect(() => {
    validateStock();
  }, [items]);

  // Check if there are any stock issues
  const hasStockIssues = stockValidation.some((result) => result.isInsufficient);
  const stockIssues = stockValidation.filter((result) => result.isInsufficient);

  const handleUnitTypeChange = (itemId: number, unitType: string) => {
    const item = items.find((item) => item.id === itemId);
    if (item) {
      const newPrice = getUnitPrice(item.product, unitType);
      onUpdateUnitType(itemId, unitType);
      onUpdateUnitPrice(itemId, newPrice);
    }
  };

  return (
    <Card className="flex flex-col">
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
              <span className="text-sm font-medium text-blue-800">Customer</span>
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
              <p className="text-xs">Search and select products to add to cart</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const stockResult = stockValidation.find(
                  (result) => result.productId === item.product.id
                );
                const hasStockIssue = stockResult?.isInsufficient || false;

                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-3 ${hasStockIssue ? "bg-red-50 border-red-200" : "bg-white"}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          {item.product.name}
                          {hasStockIssue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        </div>
                        <div className="text-xs text-gray-500">{item.product.sku}</div>
                        {hasStockIssue && stockResult && (
                          <div className="text-xs text-red-600 mt-1">
                            Insufficient stock: Available {stockResult.available}, Required{" "}
                            {stockResult.required}
                          </div>
                        )}
                      </div>
                      {onRemoveItem && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label htmlFor={`unit-type-${item.id}`} className="text-xs text-gray-600">
                          Unit Type
                        </label>
                        <Select
                          value={item.unit_type}
                          onValueChange={(value) => handleUnitTypeChange(item.id, value)}
                        >
                          <SelectTrigger id={`unit-type-${item.id}`} className="h-8 text-xs">
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
                        <label htmlFor={`quantity-${item.id}`} className="text-xs text-gray-600">
                          Quantity
                        </label>
                        <input
                          id={`quantity-${item.id}`}
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            onUpdateQuantity(item.id, item.unit_type, Number(e.target.value))
                          }
                          className="w-full h-8 border rounded px-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <span className="text-gray-600">Unit Price:</span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unit_price}
                          onChange={(e) => onUpdateUnitPrice(item.id, Number(e.target.value))}
                          className="ml-1 w-20 border rounded px-1 text-xs font-medium"
                          style={{ width: 80 }}
                        />
                      </div>
                      <div className="font-semibold">{formatPrice(item.total)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Summary */}
        <div className="mt-4 space-y-3 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold">{formatPrice(total)}</span>
          </div>

          {/* Stock Issues Warning */}
          {hasStockIssues && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-800">Insufficient Stock</span>
              </div>
              <div className="text-xs text-red-700 space-y-1">
                {stockIssues.map((issue, index) => (
                  <div key={index}>
                    • {issue.productName}: Available {issue.available}, Required {issue.required}
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-600 mt-2">
                Please reduce quantities or remove items before checkout
              </p>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={onCheckout}
            disabled={
              items.length === 0 || !selectedCustomer || hasStockIssues || isValidatingStock
            }
          >
            {isValidatingStock
              ? "Checking Stock..."
              : !selectedCustomer
                ? "Select Customer First"
                : hasStockIssues
                  ? "Fix Stock Issues First"
                  : "Proceed to Checkout"}
          </Button>

          {!selectedCustomer && (
            <p className="text-xs text-red-500 text-center">
              Please select a customer before checkout
            </p>
          )}

          {hasStockIssues && (
            <p className="text-xs text-red-500 text-center">
              Resolve stock issues before proceeding to checkout
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
