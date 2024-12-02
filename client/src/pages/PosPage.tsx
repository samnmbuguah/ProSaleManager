import { useState } from "react";
import { ProductSearch } from "../components/pos/ProductSearch";
import { Cart } from "../components/pos/Cart";
import { PaymentDialog } from "../components/pos/PaymentDialog";
import { ReceiptDialog } from "../components/pos/ReceiptDialog";
import type { Product, Customer } from "@db/schema";
import { usePos } from "../hooks/use-pos";

interface CartItem extends Product {
  quantity: number;
}

export default function PosPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    saleId: number;
    customer: Customer | null;
    paymentMethod: string;
    date: Date;
  } | null>(null);
  const { products, searchProducts, calculateTotal, createSale, isProcessing } = usePos();

  const handleAddToCart = (product: Product) => {
    setCartItems((items) => {
      const existingItem = items.find((item) => item.id === product.id);
      if (existingItem) {
        return items.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...items, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setCartItems((items) =>
      quantity === 0
        ? items.filter((item) => item.id !== productId)
        : items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          )
    );
  };

  const handleCheckout = () => {
    setIsPaymentOpen(true);
  };

  const handlePaymentComplete = async (paymentMethod: string, customerId?: number) => {
    const sale = await createSale({
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        price: Number(item.price),
      })),
      customerId,
      total: calculateTotal(cartItems),
      paymentMethod,
    });
    
    setReceiptData({
      saleId: sale.id,
      customer: null,
      paymentMethod,
      date: new Date(),
    });
    
    setCartItems([]);
    setIsPaymentOpen(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <ProductSearch
          products={products || []}
          onSelect={handleAddToCart}
          searchProducts={searchProducts}
        />
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

      {receiptData && (
        <ReceiptDialog
          open={true}
          onClose={() => setReceiptData(null)}
          saleId={receiptData.saleId}
          items={cartItems}
          total={calculateTotal(cartItems)}
          paymentMethod={receiptData.paymentMethod}
          customer={receiptData.customer}
          date={receiptData.date}
        />
      )}
    </div>
  );
}
