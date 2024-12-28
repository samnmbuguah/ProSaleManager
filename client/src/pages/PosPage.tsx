import { useState } from "react";
import { SaleTerminal } from "../components/pos/SaleTerminal";
import { ProductSearch } from "../components/pos/ProductSearch";
import { Cart } from "../components/pos/Cart";
import { PaymentDialog } from "../components/pos/PaymentDialog";
import type { Product, PriceUnit, UnitTypeValues } from "@/types/product";
import { usePos } from "../hooks/use-pos";
import type { CartItem, SaleItem, PaymentDetails } from "../types/pos";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface SaleData {
  items: SaleItem[];
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  amountPaid: string;
  changeAmount: string;
  cashAmount: number;
}

interface ProductWithPriceUnits extends Product {
  price_units: PriceUnit[];
}

export default function PosPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const { products, searchProducts, createSale, isProcessing, error } = usePos();

  const handleAddToCart = (product: ProductWithPriceUnits, selectedUnit: UnitTypeValues) => {
    setCartItems(items => {
      // Find the complete price unit with all required fields
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
      
      const sellingPrice = parseFloat(priceUnit.selling_price);

      const newCartItem: CartItem = {
        id: product.id,
        name: product.name,
        quantity: 1,
        selectedUnit: selectedUnit,
        unitPrice: sellingPrice,
        total: sellingPrice,
        price_units: [priceUnit],
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

  const handlePaymentComplete = async (paymentDetails: PaymentDetails) => {
    try {
      if (!cartItems.length) {
        throw new Error('No items in cart');
      }

      const saleItems = cartItems.map(item => {
        // Validate required item properties
        if (!item.id || !item.name || typeof item.quantity !== 'number' || typeof item.unitPrice !== 'number') {
          throw new Error(`Invalid item data for ${item.name || 'unknown item'}`);
        }

        return {
          product_id: item.id,
          quantity: Math.max(0, Math.round(item.quantity)),
          unit_price: Number(item.unitPrice.toFixed(2)),
          total: Number(item.total.toFixed(2)),
          unit_type: item.selectedUnit,
          name: item.name // Add name for receipt
        };
      });

      // Calculate total with proper number handling
      const total = cartItems.reduce((sum, item) => {
        const itemTotal = typeof item.total === 'number' ? item.total : 0;
        return sum + itemTotal;
      }, 0);

      const saleData = {
        items: saleItems,
        total: total.toFixed(2),
        paymentMethod: paymentDetails.paymentMethod,
        paymentStatus: 'paid',
        amountPaid: paymentDetails.amountPaid.toFixed(2),
        changeAmount: paymentDetails.change.toFixed(2),
        cashAmount: paymentDetails.paymentMethod === 'mpesa' ? total : paymentDetails.amountPaid,
      };

      const response = await createSale(saleData);
      
      // Set receipt data immediately after sale
      if (window._setReceiptState) {
        const receiptData = {
          id: response.data.id,
          items: saleItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
            unit_type: item.unit_type
          })),
          total: total,
          payment_method: paymentDetails.paymentMethod,
          timestamp: new Date().toISOString(),
          transaction_id: response.data.id.toString(),
          cash_amount: paymentDetails.paymentMethod === 'cash' ? paymentDetails.amountPaid : undefined
        };
        window._setReceiptState(receiptData);
      }
      
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
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <ProductSearch
            products={products?.map(p => ({
              ...p,
              min_stock: p.min_stock ?? 0,
              max_stock: p.max_stock ?? 0,
              reorder_point: p.reorder_point ?? 0,
              category: p.category ?? '',
              price_units: p.price_units ?? [],
              stock_unit: p.stock_unit as UnitTypeValues
            })) || []}
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
