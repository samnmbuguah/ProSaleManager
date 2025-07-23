import { useState, useEffect } from 'react'
import type { Product } from '@/types/product'
import { API_ENDPOINTS } from '@/lib/api-endpoints'
import { api } from '@/lib/api'

interface PriceUnit {
  unit_type: string;
  price: number;
  is_default: boolean;
}
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

export function usePos () {
  const [products, setProducts] = useState<ProductWithPriceUnits[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllProducts()
  }, [])

  const fetchAllProducts = async () => {
    try {
      const response = await api.get(API_ENDPOINTS.products.list)
      setProducts(response.data)
      setError(null)
    } catch (error) {
      setProducts([])
      setError(
        error instanceof Error ? error.message : 'Failed to fetch products'
      )
    }
  }

  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      fetchAllProducts()
      return
    }

    try {
      const response = await api.get(API_ENDPOINTS.products.search(query))
      setProducts(response.data)
      setError(null)
    } catch (error) {
      setProducts([])
      setError(
        error instanceof Error ? error.message : 'Failed to search products'
      )
    }
  }

  const createSale = async (saleData: SaleData) => {
    setIsProcessing(true)
    try {
      const response = await api.post(API_ENDPOINTS.sales.create, {
        ...saleData,
        customer_id: saleData.customer_id || null
      })
      setError(null)
      return response.data
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create sale'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    products,
    searchProducts,
    createSale,
    isProcessing,
    error
  }
}
