import { useState, useEffect } from "react";
import type { Product, PriceUnit } from "@/types/product";

interface ProductWithPriceUnits extends Product {
  price_units: PriceUnit[];
}

export interface ReceiptData {
  id: number;
  items: {
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
    unit_type: string;
  }[];
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  total: number;
  payment_method: string;
  timestamp: string;
  transaction_id: string;
  cash_amount?: number;
  receipt_status?: {
    sms?: boolean;
    whatsapp?: boolean;
    last_sent_at?: string;
  };
}

declare global {
  interface Window {
    _setReceiptState?: (receipt: ReceiptData | null) => void;
  }
}

interface SaleData {
  items: {
    product_id: number;
    quantity: number;
    price: number;
    name: string;
    unit_type: string;
    unit_price: number;
    total: number;
    unit_pricing_id: number;
  }[];
  total: string;
  paymentMethod: string;
  paymentStatus: string;
  amountPaid: string;
  changeAmount: string;
  cashAmount: number;
}

export function usePos() {
  const [products, setProducts] = useState<ProductWithPriceUnits[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (error) {
      setProducts([]);
      setError(error instanceof Error ? error.message : 'Failed to fetch products');
    }
  };

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      fetchAllProducts();
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (error) {
      setProducts([]);
      setError(error instanceof Error ? error.message : 'Failed to search products');
    }
  };

  const createSale = async (saleData: SaleData) => {
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    products,
    searchProducts,
    createSale,
    isProcessing,
    error,
  };
}