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
  customer_id?: number | null;
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
      const response = await fetch("/api/products", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (error) {
      setProducts([]);
      setError(
        error instanceof Error ? error.message : "Failed to fetch products",
      );
    }
  };

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      fetchAllProducts();
      return;
    }

    try {
      const response = await fetch(
        `/api/products/search?q=${encodeURIComponent(query)}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (error) {
      setProducts([]);
      setError(
        error instanceof Error ? error.message : "Failed to search products",
      );
    }
  };

  const createSale = async (saleData: SaleData) => {
    setIsProcessing(true);
    try {
      console.log("Creating sale with data:", saleData);
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...saleData,
          customer_id: saleData.customer_id || null,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create sale");
      }

      const result = await response.json();
      setError(null);
      return result;
    } catch (error) {
      console.error("Sale creation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create sale";
      setError(errorMessage);
      throw new Error(errorMessage);
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
