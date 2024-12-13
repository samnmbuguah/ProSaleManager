import { useState } from "react";
import { SaleTerminal } from "../components/pos/SaleTerminal";
import { ProductSearch } from "../components/pos/ProductSearch";
import { Cart } from "../components/pos/Cart";
import { PaymentDialog } from "../components/pos/PaymentDialog";
import type { Product, UnitPricing } from "../../../db/schema";
import { usePos } from "../hooks/use-pos";

type PriceUnit = UnitPricing;

interface CartItem {
  id: number;
  name: string;
  quantity: number;
  selectedUnit: string;
  unitPrice: number;
  total: number;
  price_units: PriceUnit[];
}

interface SaleItem {
  product_id: number;
  quantity: number;
  price: number;
  name: string;
  unit_pricing_id: number;
}

interface SaleData {
  items: SaleItem[];
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  amountPaid: string;
  changeAmount: string;
  cashAmount: number;
}

export default function PosPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { products, searchProducts, createSale, isProcessing } = usePos();

  const handleAddToCart = (product: Product, selectedUnit: string) => {
    setCartItems(items => {
      // Find the complete price unit with all required fields
      const priceUnit = product.price_units?.find(p => p.unit_type === selectedUnit);
      if (!priceUnit) {
        console.error("Selected price unit not found", { selectedUnit, availableUnits: product.price_units });
        return items;
      }

      // Verify price unit has all required fields
      if (!priceUnit.id || !priceUnit.product_id) {
        console.error("Price unit missing required fields:", priceUnit);
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
      
      const sellingPrice = parseFloat(priceUnit.selling_price);

      const newCartItem: CartItem = {
        id: product.id,
        name: product.name,
        quantity: 1,
        selectedUnit: selectedUnit,
        unitPrice: sellingPrice,
        total: sellingPrice,
        price_units: [priceUnit], // Use the price unit directly from the product
      };

      return [...items, newCartItem];
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
      if (!cartItems.length) {
        throw new Error('No items in cart');
      }

      const saleItems = cartItems.map(item => {
        // Validate required item properties
        if (!item.id || !item.name || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
          throw new Error(`Invalid item data for ${item.name || 'unknown item'}`);
        }

        // Find and validate the selected price unit
        if (!item.price_units || !Array.isArray(item.price_units) || item.price_units.length === 0) {
          console.error('No price units available for item:', item);
          throw new Error(`No price units available for ${item.name}`);
        }

        // Since we now store only the selected price unit in the cart item
        const priceUnit = item.price_units[0];
        if (!priceUnit || priceUnit.unit_type !== item.selectedUnit) {
          console.error('Invalid price unit in cart item:', {
            selectedUnit: item.selectedUnit,
            priceUnit
          });
          throw new Error(`Invalid price unit for ${item.name}`);
        }

        if (!priceUnit.id || !priceUnit.product_id) {
          console.error('Price unit missing required fields:', priceUnit);
          throw new Error(`Price unit ${item.selectedUnit} for ${item.name} is missing required fields`);
        }

        return {
          product_id: item.id,
          quantity: Math.max(0, Math.round(item.quantity)),
          price: Number(item.unitPrice.toFixed(2)),
          name: item.name,
          unit_pricing_id: priceUnit.id
        };
      });

      // Calculate total with proper number handling
      const total = cartItems.reduce((sum, item) => {
        const itemTotal = typeof item.total === 'number' ? item.total : 0;
        return sum + itemTotal;
      }, 0);

      const saleData: SaleData = {
        items: saleItems,
        total: total.toFixed(2),
        paymentMethod: 'cash',
        paymentStatus: 'paid',
        amountPaid: paymentDetails.amountPaid.toFixed(2),
        changeAmount: paymentDetails.change.toFixed(2),
        cashAmount: paymentDetails.amountPaid,
      };

      await createSale(saleData);
      setCartItems([]);
      setIsPaymentOpen(false);
    } catch (error) {
      console.error('Error completing sale:', error);
      alert(error instanceof Error ? error.message : 'Failed to complete sale');
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
