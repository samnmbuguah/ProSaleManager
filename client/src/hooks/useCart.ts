import { useState } from 'react'
import type { Product } from '@/types/product'

export interface CartItem {
  product: Product;
  quantity: number;
  unit_type: string;
  unit_price: number;
  total: number;
}

export function useCart () {
  const [items, setItems] = useState<CartItem[]>([])

  const addToCart = (product: Product, unitType: string, price: number) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.product.id === product.id && item.unit_type === unitType
      )
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id && item.unit_type === unitType
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unit_price
              }
            : item
        )
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unit_type: unitType,
          unit_price: price,
          total: price
        }
      ]
    })
  }

  const updateQuantity = (productId: number, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity, total: quantity * item.unit_price }
          : item
      )
    )
  }

  const updateUnitType = (productId: number, unitType: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, unit_type: unitType } : item
      )
    )
  }

  const updateUnitPrice = (productId: number, price: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, unit_price: price, total: price * item.quantity }
          : item
      )
    )
  }

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, item) => sum + item.total, 0)

  return {
    items,
    addToCart,
    updateQuantity,
    updateUnitType,
    updateUnitPrice,
    removeItem,
    clearCart,
    total
  }
}
