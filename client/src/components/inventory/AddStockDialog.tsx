import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";
import type { Product } from "@db/schema";

interface AddStockDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onSubmit: (productId: number, quantity: number) => Promise<void>;
  isSubmitting: boolean;
}

export function AddStockDialog({
  product,
  open,
  onClose,
  onSubmit,
  isSubmitting
}: AddStockDialogProps) {
  const [quantity, setQuantity] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > 0) {
      await onSubmit(product.id, quantity);
      setQuantity(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Stock - {product.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Stock:</span>
              <span className="font-medium">{product.stock} units</span>
            </div>
            {product.stock < 10 && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Low stock warning</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="quantity" className="text-sm font-medium">
              Additional Stock
            </label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="Enter quantity to add"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || quantity <= 0}
          >
            Add Stock
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
