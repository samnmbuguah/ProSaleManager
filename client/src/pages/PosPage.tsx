import { useState } from "react";
import { SaleTerminal } from "../components/pos/SaleTerminal";
import { ProductSearch } from "../components/pos/ProductSearch";
import { Cart } from "../components/pos/Cart";
import { PaymentDialog } from "../components/pos/PaymentDialog";
import type { Product } from "../../../db/schema";
import { usePos } from "../hooks/use-pos";

interface PriceUnit {
  id: number;
  product_id: number;
  unit_type: string;
  quantity: number;
  selling_price: string;
  buying_price: string;
  is_default: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface ExtendedProduct extends Omit<Product, 'price_units' | 'default_unit_pricing'> {
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
  price_units?: PriceUnit[];
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

      // Ensure we're passing complete price unit objects including IDs
      const processedPriceUnits = product.price_units?.map(pu => ({
        id: pu.id,
        unit_type: pu.unit_type,
        quantity: pu.quantity,
        selling_price: pu.selling_price,
        buying_price: pu.buying_price,
        is_default: pu.is_default
      })) || [];

      return [...items, { 
        id: product.id,
        name: product.name,
        quantity: 1,
        selectedUnit: selectedUnit,
        unitPrice: sellingPrice,
        total: sellingPrice,
        price_units: processedPriceUnits,
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
      if (!cartItems.length) {
        throw new Error('No items in cart');
      }

      const saleItems = cartItems.map(item => {
        // Validate required item properties
        if (!item.id || !item.name || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
          throw new Error(`Invalid item data for ${item.name || 'unknown item'}`);
        }

        // Find and validate the selected price unit
        if (!item.price_units || !Array.isArray(item.price_units)) {
          console.error('No price units available for item:', item);
          throw new Error(`No price units available for ${item.name}`);
        }

        const priceUnit = item.price_units.find(p => p.unit_type === item.selectedUnit);
        if (!priceUnit) {
          console.error('Selected unit not found among available units:', {
            selectedUnit: item.selectedUnit,
            availableUnits: item.price_units.map(pu => pu.unit_type)
          });
          throw new Error(`Price unit '${item.selectedUnit}' not found for ${item.name}`);
        }

        if (!priceUnit.id) {
          console.error('Price unit missing ID:', priceUnit);
          throw new Error(`Price unit ${item.selectedUnit} for ${item.name} is missing an ID`);
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
