import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useConfirm } from "@/components/ui/confirm-dialog";

export default function CartModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { cart, removeFromCart, clearCart } = useCart();
  const confirm = useConfirm();

  const handleRemove = (itemId: number) => {
    removeFromCart(itemId);
  };

  const handleClear = async () => {
    const confirmed = await confirm({
      title: "Clear cart?",
      description: "Are you sure you want to remove all items from your cart?",
      confirmText: "Clear",
      destructive: true,
    });
    if (confirmed) clearCart();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your Cart</DialogTitle>
        </DialogHeader>
        {cart.items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">Your cart is empty.</div>
        ) : (
          <div className="space-y-2">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b py-2">
                <span>
                  {item.product?.name || "Unknown"} x{item.quantity}
                </span>
                <Button size="sm" variant="ghost" onClick={() => handleRemove(item.id)}>
                  Remove
                </Button>
              </div>
            ))}
            <div className="font-bold text-right mt-2">Total: KSh {cart.total}</div>
            <div className="flex justify-between mt-4">
              <Button variant="destructive" onClick={handleClear}>
                Clear Cart
              </Button>
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
