import { useState } from "react";
import { SaleTerminal } from "../components/pos/SaleTerminal";
import { ProductSearch } from "../components/pos/ProductSearch";
import { Cart } from "../components/pos/Cart";
import { PaymentDialog } from "../components/pos/PaymentDialog";
import type { Product } from "../../../db/schema";
import { usePos } from "../hooks/use-pos";

interface PriceUnit {
  stock_unit: string;
  selling_price: string;
  buying_price: string;
  conversion_rate: string;
}

interface ExtendedProduct extends Product {
  priceUnits?: PriceUnit[];
}

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  selectedUnit: string;
  unitPrice: number;
  total: number;
  priceUnits: PriceUnit[];
}

export default function PosPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { products, searchProducts, createSale, isProcessing } = usePos();

  const handleAddToCart = (product: ExtendedProduct, selectedUnit: string) => {
    setCartItems(items => {
      const priceUnit = product.priceUnits?.find((p: PriceUnit) => p.stock_unit === selectedUnit);
      if (!priceUnit) {
        console.error("Selected price unit not found");
        return items;
      }

      const existing = items.find(item => 
        item.id === product.id && item.selectedUnit === selectedUnit
      );

      if (existing) {
        return items.map(item =>
          (item.id === product.id && item.selectedUnit === selectedUnit)
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice
              }
            : item
        );
      }
      
      const sellingPrice = typeof priceUnit.selling_price === 'string' 
        ? parseFloat(priceUnit.selling_price)
        : priceUnit.selling_price;

      return [...items, { 
        id: product.id,
        name: product.name,
        quantity: 1,
        selectedUnit: selectedUnit,
        unitPrice: sellingPrice,
        total: sellingPrice,
        priceUnits: product.priceUnits || [],
      }];
    });
  };

  const handleUpdateQuantity = (productId: number, selectedUnit: string, quantity: number) => {
    setCartItems(items =>
      items.map(item =>
        (item.id === productId && item.selectedUnit === selectedUnit)
          ? { 
              ...item, 
              quantity,
              total: quantity * item.unitPrice
            }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const handleCheckout = () => {
    setIsPaymentOpen(true);
  };

  const handlePaymentComplete = async (paymentDetails: {
    amountPaid: number;
    change: number;
    items: CartItem[];
  }) => {
    await createSale({
      items: cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit: item.selectedUnit,
        price: item.unitPrice,
      })),
      total: cartItems.reduce((sum, item) => sum + item.total, 0).toString(),
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      amountPaid: paymentDetails.amountPaid.toString(),
      changeAmount: paymentDetails.change.toString(),
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
          total={cartItems.reduce((sum, item) => sum + item.total, 0)}
        />
      </div>

      <PaymentDialog
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        cartItems={cartItems}
        onProcessPayment={handlePaymentComplete}
      />
    </div>
  );
}
