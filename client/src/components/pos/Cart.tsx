import type { Product, PriceUnit, UnitTypeValues } from "../../../../db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, ShoppingCart } from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  selectedUnit: UnitTypeValues;
  unitPrice: number;
  total: number;
  price_units: PriceUnit[];
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (productId: number, selectedUnit: string, quantity: number) => void;
  onCheckout: () => void;
  total: number;
}

export function Cart({ items, onUpdateQuantity, onCheckout, total }: CartProps) {
  const formatPrice = (price: string | number) => {
    return `KSh ${Number(price).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Current Sale</h2>
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {items.map((item) => (
          <div
            key={`${item.id}-${item.selectedUnit}`}
            className="flex items-center justify-between p-2 bg-accent rounded-lg"
          >
            <div className="flex-1">
              <div className="font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground">
                {formatPrice(item.unitPrice)} per {item.selectedUnit}
                <div className="text-xs">
                  Subtotal: {formatPrice(item.total)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(item.id, item.selectedUnit, item.quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(item.id, item.selectedUnit, parseInt(e.target.value) || 0)}
                className="w-16 text-center"
              />
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => onUpdateQuantity(item.id, item.selectedUnit, item.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
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
          Checkout
        </Button>
      </div>
    </div>
  );
}
