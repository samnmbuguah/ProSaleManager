import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { CartProvider, useCart } from '../../context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../../types/product';

jest.mock('@react-native-async-storage/async-storage');

const mockProduct: Product = {
  id: 1,
  name: 'Test Product',
  piece_selling_price: 100,
  pack_selling_price: 1100,
  dozen_selling_price: 1200,
  piece_buying_price: 80,
  stock: 50,
  min_stock: 10,
} as Product;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  describe('initialization', () => {
    it('should initialize with empty cart when no saved cart exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.cart.items).toEqual([]);
      expect(result.current.cart.total).toBe(0);
    });

    it('should load cart from AsyncStorage on mount', async () => {
      const savedCart = {
        items: [
          {
            id: 1,
            product_id: 1,
            product: mockProduct,
            quantity: 2,
            unit_price: 100,
            unit_type: 'piece',
            total: 200,
          },
        ],
        total: 200,
      };
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(savedCart));

      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.cart.items).toHaveLength(1);
      expect(result.current.cart.total).toBe(200);
    });
  });

  describe('addToCart', () => {
    it('should add new item to cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(mockProduct, 2);
      });

      expect(result.current.cart.items).toHaveLength(1);
      expect(result.current.cart.items[0].product_id).toBe(1);
      expect(result.current.cart.items[0].quantity).toBe(2);
      expect(result.current.cart.items[0].total).toBe(200);
      expect(result.current.cart.total).toBe(200);
    });

    it('should increment quantity when adding existing item', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(mockProduct, 2);
      });

      await act(async () => {
        result.current.addToCart(mockProduct, 3);
      });

      expect(result.current.cart.items).toHaveLength(1);
      expect(result.current.cart.items[0].quantity).toBe(5);
      expect(result.current.cart.items[0].total).toBe(500);
    });

    it('should use default quantity of 1 when not specified', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(mockProduct);
      });

      expect(result.current.cart.items[0].quantity).toBe(1);
    });

    it('should handle product with no price', async () => {
      const noPriceProduct = { ...mockProduct, piece_selling_price: 0 };
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(noPriceProduct, 1);
      });

      expect(result.current.cart.items[0].unit_price).toBe(0);
      expect(result.current.cart.items[0].total).toBe(0);
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(mockProduct, 2);
      });

      const itemId = result.current.cart.items[0].id;

      await act(async () => {
        result.current.removeFromCart(itemId);
      });

      expect(result.current.cart.items).toHaveLength(0);
      expect(result.current.cart.total).toBe(0);
    });

    it('should recalculate total after removal', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const product2 = { ...mockProduct, id: 2, piece_selling_price: 200 };

      await act(async () => {
        result.current.addToCart(mockProduct, 2);
        result.current.addToCart(product2, 1);
      });

      expect(result.current.cart.total).toBe(400);

      const itemId = result.current.cart.items[0].id;
      await act(async () => {
        result.current.removeFromCart(itemId);
      });

      expect(result.current.cart.total).toBe(200);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(mockProduct, 2);
      });

      const itemId = result.current.cart.items[0].id;

      await act(async () => {
        result.current.updateQuantity(itemId, 5);
      });

      expect(result.current.cart.items[0].quantity).toBe(5);
      expect(result.current.cart.items[0].total).toBe(500);
    });

    it('should remove item when quantity is 0 or less', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(mockProduct, 2);
      });

      const itemId = result.current.cart.items[0].id;

      await act(async () => {
        result.current.updateQuantity(itemId, 0);
      });

      expect(result.current.cart.items).toHaveLength(0);
    });

    it('should recalculate total correctly', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(mockProduct, 2);
      });

      const itemId = result.current.cart.items[0].id;

      await act(async () => {
        result.current.updateQuantity(itemId, 10);
      });

      expect(result.current.cart.items[0].total).toBe(1000);
      expect(result.current.cart.total).toBe(1000);
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(mockProduct, 2);
        result.current.addToCart({ ...mockProduct, id: 2 }, 1);
      });

      expect(result.current.cart.items).toHaveLength(2);

      await act(async () => {
        result.current.clearCart();
      });

      expect(result.current.cart.items).toHaveLength(0);
      expect(result.current.cart.total).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should save cart to AsyncStorage when cart changes', async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        result.current.addToCart(mockProduct, 2);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'shopping_cart',
        expect.any(String)
      );
    });
  });
});
