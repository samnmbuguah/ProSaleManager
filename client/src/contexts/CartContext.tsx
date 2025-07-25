import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { ReactNode } from "react";
import type { Product } from "@/types/product";
import type { CartItem, Cart } from "@/types/pos";

// Define the shape of our context state
interface CartContextType {
  cart: Cart;
  addToCart: (product: Product, unit_type: string, price: number) => void;
  removeFromCart: (itemId: number) => void;
  updateQuantity: (itemId: number, quantity: number) => void;
  updateUnitPrice: (itemId: number, price: number) => void;
  updateUnitType: (itemId: number, unitType: string) => void;
  clearCart: () => void;
  addDeliveryService: (deliveryService: Product) => void;
}

// Define action types
type CartAction =
  | {
      type: "ADD_ITEM";
      payload: { product: Product; unitType: string; unitPrice: number };
    }
  | { type: "REMOVE_ITEM"; payload: { itemId: number } }
  | { type: "UPDATE_QUANTITY"; payload: { itemId: number; quantity: number } }
  | { type: "UPDATE_UNIT_PRICE"; payload: { itemId: number; price: number } }
  | { type: "UPDATE_UNIT_TYPE"; payload: { itemId: number; unitType: string } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: { cart: Cart } }
  | { type: "ADD_DELIVERY"; payload: { product: Product } };

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = "pos_cart_v2";

// Define a type for potentially invalid data read from localStorage
interface PotentialCartItemData {
  product?: {
    id?: unknown;
    name?: unknown;
    selling_price?: unknown;
    stock_unit?: unknown;
    sku?: unknown;
    [key: string]: unknown;
  };
  quantity?: unknown;
  unit_price?: unknown;
  total?: unknown;
  unit_type?: unknown;
  id?: unknown;
  [key: string]: unknown;
}

// Reducer function to handle cart state updates
function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, unitType, unitPrice } = action.payload;
      const existingItem = state.items.find(
        (item) => item.product.id === product.id && item.unit_type === unitType
      );

      if (existingItem) {
        // For delivery service, don't update quantity
        if (product.sku === "SRV001") {
          return state;
        }

        // Update existing item
        const updatedItems = state.items.map((item) => {
          if (item.product.id === product.id && item.unit_type === unitType) {
            const newQuantity = item.quantity + 1;
            return {
              ...item,
              quantity: newQuantity,
              total: unitPrice * newQuantity,
            };
          }
          return item;
        });

        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum: number, item: CartItem) => sum + item.total, 0),
        };
      }

      // Add new item
      const newItem: CartItem = {
        id: Date.now(),
        product,
        quantity: 1,
        unit_price: unitPrice,
        total: unitPrice,
        unit_type: unitType,
      };

      const updatedItems = [...state.items, newItem];
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum: number, item: CartItem) => sum + item.total, 0),
      };
    }

    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter((item) => item.id !== action.payload.itemId);
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum: number, item: CartItem) => sum + item.total, 0),
      };
    }

    case "UPDATE_QUANTITY": {
      const { itemId, quantity } = action.payload;
      if (quantity < 1) return state;

      const updatedItems = state.items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            total: item.unit_price * quantity,
          };
        }
        return item;
      });

      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum: number, item: CartItem) => sum + item.total, 0),
      };
    }

    case "UPDATE_UNIT_PRICE": {
      const { itemId, price } = action.payload;
      const updatedItems = state.items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            unit_price: price,
            total: price * item.quantity,
          };
        }
        return item;
      });

      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum: number, item: CartItem) => sum + item.total, 0),
      };
    }

    case "UPDATE_UNIT_TYPE": {
      const { itemId, unitType } = action.payload;
      const updatedItems = state.items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            unit_type: unitType,
          };
        }
        return item;
      });

      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum: number, item: CartItem) => sum + item.total, 0),
      };
    }

    case "CLEAR_CART":
      return { items: [], total: 0 };

    case "LOAD_CART":
      return action.payload.cart;

    case "ADD_DELIVERY": {
      const { product } = action.payload;
      // Check if delivery is already in cart
      const hasDelivery = state.items.some((item) => item.product && item.product.sku === "SRV001");

      if (hasDelivery) {
        return state;
      }

      // Add delivery to cart
      const unitPrice = parseFloat(product.piece_selling_price.toString());
      const newItem: CartItem = {
        id: Date.now(),
        product,
        quantity: 1,
        unit_price: unitPrice,
        total: unitPrice,
        unit_type: "piece", // Default to piece since stock_unit doesn't exist
      };

      const updatedItems = [...state.items, newItem];
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum: number, item: CartItem) => sum + item.total, 0),
      };
    }

    default:
      return state;
  }
}

// Provider component
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      // Check for timestamp to verify data freshness
      const timestamp = localStorage.getItem(`${STORAGE_KEY}_timestamp`);
      const now = Date.now();
      const cartAge = timestamp ? now - parseInt(timestamp) : Infinity;

      // Only load cart if it exists and is less than 24 hours old
      // (prevents loading very stale data)
      if (savedCart && cartAge < 24 * 60 * 60 * 1000) {
        const parsedCart = JSON.parse(savedCart);

        if (parsedCart && parsedCart.items && Array.isArray(parsedCart.items)) {
          // Validate all cart items have the necessary properties and correct types
          const validItems = parsedCart.items
            .filter(
              (item: PotentialCartItemData) =>
                item &&
                item.product &&
                typeof item.product === "object" &&
                "id" in item.product &&
                "name" in item.product &&
                "selling_price" in item.product &&
                "stock_unit" in item.product &&
                "quantity" in item && // Check for quantity on the cart item
                "unit_price" in item && // Check for unit_price on the cart item
                "total" in item && // Check for total on the cart item
                "unit_type" in item // Check for unit_type on the cart item
            )
            .map((item: PotentialCartItemData) => ({
              id: item.id,
              product: item.product, // Product type is handled by the filter
              quantity: Number(item.quantity), // Ensure quantity is a number
              unit_price: Number(item.unit_price), // Ensure unit_price is a number
              total: Number(item.total), // Ensure total is a number
              unit_type: item.unit_type, // Ensure unit_type is a string
            }));

          // Only load if we have valid items
          if (validItems.length > 0) {
            // Recalculate total to ensure it's correct
            const validCart = {
              items: validItems,
              total: validItems.reduce((sum: number, item: CartItem) => sum + item.total, 0),
            };

            dispatch({ type: "LOAD_CART", payload: { cart: validCart } });
          }
        }
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
      // Clear potentially corrupted cart data from localStorage
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}_timestamp`);
    }
  }, [dispatch]); // Depend on dispatch

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
      localStorage.setItem(`${STORAGE_KEY}_timestamp`, Date.now().toString());
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error);
    }
  }, [cart]); // Depend on cart

  // Action creators
  const addToCart = (product: Product, unitType: string, unitPrice: number) => {
    dispatch({ type: "ADD_ITEM", payload: { product, unitType, unitPrice } });
  };

  const removeFromCart = (itemId: number) => {
    dispatch({ type: "REMOVE_ITEM", payload: { itemId } });
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { itemId, quantity } });
  };

  const updateUnitPrice = (itemId: number, price: number) => {
    dispatch({ type: "UPDATE_UNIT_PRICE", payload: { itemId, price } });
  };

  const updateUnitType = (itemId: number, unitType: string) => {
    dispatch({ type: "UPDATE_UNIT_TYPE", payload: { itemId, unitType } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
    // Also clear localStorage
    localStorage.removeItem(STORAGE_KEY);
  };

  const addDeliveryService = (deliveryService: Product) => {
    dispatch({ type: "ADD_DELIVERY", payload: { product: deliveryService } });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateUnitPrice,
        updateUnitType,
        clearCart,
        addDeliveryService,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
