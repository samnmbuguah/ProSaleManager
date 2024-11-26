import { useState } from "react";
import { SaleTerminal } from "../components/pos/SaleTerminal";
import { ProductSearch } from "../components/pos/ProductSearch";
import { Cart } from "../components/pos/Cart";
import { PaymentDialog } from "../components/pos/PaymentDialog";
import type { Product } from "@db/schema";
import { usePos } from "../hooks/use-pos";

interface CartItem extends Product {
  quantity: number;
}

export default function PosPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { products, searchProducts, calculateTotal, createSale, isProcessing } = usePos();

  const handleAddToCart = (product: Product) => {
    setCartItems(items => {
      const existing = items.find(item => item.id === product.id);
      if (existing) {
        return items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...items, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const handleCheckout = () => {
    setIsPaymentOpen(true);
  };

  const handlePaymentComplete = async (paymentMethod: string, customerId?: number) => {
    await createSale({
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      customerId,
      total: calculateTotal(cartItems),
      paymentMethod,
    });
    setCartItems([]);
    setIsPaymentOpen(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[calc(100vh-5rem)]">
      <div className="lg:col-span-2">
        <SaleTerminal>
          <ProductSearch
            products={products || []}
            onSelect={handleAddToCart}
            searchProducts={searchProducts}
          />
        </SaleTerminal>
      </div>
      
      <div className="bg-card rounded-lg border p-4">
        <Cart
          items={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onCheckout={handleCheckout}
          total={calculateTotal(cartItems)}
        />
      </div>

      <PaymentDialog
        open={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onComplete={handlePaymentComplete}
        total={calculateTotal(cartItems)}
        isProcessing={isProcessing}
      />
    </div>
  );
}
