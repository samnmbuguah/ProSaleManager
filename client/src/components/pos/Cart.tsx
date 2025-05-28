import React from "react";
import { Button } from "@/components/ui/button";
import { CartItem } from "../../types/pos";

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (
    productId: number,
    unitType: string,
    quantity: number,
  ) => void;
  onCheckout: () => void;
  total: number;
}

export const Cart: React.FC<CartProps> = ({
  items,
  onUpdateQuantity,
  onCheckout,
  total,
}) => {
  const formatPrice = (price: string | number) => {
    return `KSh ${Number(price).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">Current Sale</h2>
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {items.length === 0 ? (
          <div className="text-gray-400 text-center">Cart is empty</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-2 border-b pb-2"
              >
                <div className="flex-1">
                  <div className="font-bold">{item.product.name}</div>
                  <div className="text-xs text-gray-500">{item.unit_type}</div>
                </div>
                <input
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
                  className="w-16 border rounded px-1"
                />
                <div className="w-20 text-right">
                  KSh {item.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
};
