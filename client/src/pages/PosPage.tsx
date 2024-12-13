import { useState } from "react";
import { SaleTerminal } from "../components/pos/SaleTerminal";
import { ProductSearch } from "../components/pos/ProductSearch";
import { Cart } from "../components/pos/Cart";
import { PaymentDialog } from "../components/pos/PaymentDialog";
import type { Product } from "../../../db/schema";
import { usePos } from "../hooks/use-pos";

interface PriceUnit {
  id?: number;
  unit_type: string;
  quantity: number;
  selling_price: string;
  buying_price: string;
  is_default: boolean;
}

interface ExtendedProduct extends Product {
  price_units?: PriceUnit[];
  default_unit_pricing?: PriceUnit | null;
}

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  selectedUnit: string;
  unitPrice: number;
  total: number;
  price_units: PriceUnit[];
}

export default function PosPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { products, searchProducts, createSale, isProcessing } = usePos();

  const handleAddToCart = (product: ExtendedProduct, selectedUnit: string) => {
    setCartItems(items => {
      const priceUnit = product.price_units?.find(p => p.unit_type === selectedUnit);
      if (!priceUnit) {
        console.error("Selected price unit not found", { selectedUnit, availableUnits: product.price_units });
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
        price_units: product.price_units || [],
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
    try {
      const saleData = {
        items: cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.unitPrice.toString(),
          name: item.name,
          unit_pricing_id: item.price_units.find(p => p.unit_type === item.selectedUnit)?.id
        })),
        total: cartItems.reduce((sum, item) => sum + item.total, 0).toString(),
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        amountPaid: paymentDetails.amountPaid.toString(),
        changeAmount: paymentDetails.change.toString(),
        cashAmount: paymentDetails.amountPaid,
      };
      
      console.log('Sending sale data:', saleData); // Debug log
      await createSale(saleData);
      setCartItems([]);
      setIsPaymentOpen(false);
    } catch (error) {
      console.error('Error completing sale:', error);
    }
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
