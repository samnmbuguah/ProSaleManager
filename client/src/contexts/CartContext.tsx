import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '@/types/product';
import type { CartItem, Cart } from '@/types/pos';

// Define the shape of our context state
interface CartContextType {
    cart: Cart;
    addToCart: (product: Product) => void;
    removeFromCart: (itemId: number) => void;
    updateQuantity: (itemId: number, quantity: number) => void;
    updateUnitPrice: (itemId: number, price: number) => void;
    updateUnitType: (itemId: number, unitType: string) => void;
    clearCart: () => void;
    addDeliveryService: (deliveryService: Product) => void;
}

// Define action types
type CartAction =
    | { type: 'ADD_ITEM'; payload: { product: Product; unitPrice: number } }
    | { type: 'REMOVE_ITEM'; payload: { itemId: number } }
    | { type: 'UPDATE_QUANTITY'; payload: { itemId: number; quantity: number } }
    | { type: 'UPDATE_UNIT_PRICE'; payload: { itemId: number; price: number } }
    | { type: 'UPDATE_UNIT_TYPE'; payload: { itemId: number; unitType: string } }
    | { type: 'CLEAR_CART' }
    | { type: 'LOAD_CART'; payload: { cart: Cart } }
    | { type: 'ADD_DELIVERY'; payload: { product: Product } };

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Storage key
const STORAGE_KEY = 'pos_cart_v2';

// Reducer function to handle cart state updates
function cartReducer(state: Cart, action: CartAction): Cart {
    switch (action.type) {
        case 'ADD_ITEM': {
            const { product, unitPrice } = action.payload;
            const existingItem = state.items.find(item => item.product.id === product.id);

            if (existingItem) {
                // For delivery service, don't update quantity
                if (product.product_code === 'SRV001') {
                    return state;
                }

                // Update existing item
                const updatedItems = state.items.map(item => {
                    if (item.product.id === product.id) {
                        const newQuantity = item.quantity + 1;
                        return {
                            ...item,
                            quantity: newQuantity,
                            total: unitPrice * newQuantity
                        };
                    }
                    return item;
                });

                return {
                    ...state,
                    items: updatedItems,
                    total: updatedItems.reduce((sum, item) => sum + item.total, 0)
                };
            }

            // Add new item
            const newItem: CartItem = {
                id: Date.now(),
                product,
                quantity: 1,
                unit_price: unitPrice,
                total: unitPrice,
                unit_type: product.stock_unit
            };

            const updatedItems = [...state.items, newItem];
            return {
                ...state,
                items: updatedItems,
                total: updatedItems.reduce((sum, item) => sum + item.total, 0)
            };
        }

        case 'REMOVE_ITEM': {
            const updatedItems = state.items.filter(item => item.id !== action.payload.itemId);
            return {
                ...state,
                items: updatedItems,
                total: updatedItems.reduce((sum, item) => sum + item.total, 0)
            };
        }

        case 'UPDATE_QUANTITY': {
            const { itemId, quantity } = action.payload;
            if (quantity < 1) return state;

            const updatedItems = state.items.map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        quantity: quantity,
                        total: item.unit_price * quantity
                    };
                }
                return item;
            });

            return {
                ...state,
                items: updatedItems,
                total: updatedItems.reduce((sum, item) => sum + item.total, 0)
            };
        }

        case 'UPDATE_UNIT_PRICE': {
            const { itemId, price } = action.payload;
            const updatedItems = state.items.map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        unit_price: price,
                        total: price * item.quantity
                    };
                }
                return item;
            });

            return {
                ...state,
                items: updatedItems,
                total: updatedItems.reduce((sum, item) => sum + item.total, 0)
            };
        }

        case 'UPDATE_UNIT_TYPE': {
            const { itemId, unitType } = action.payload;
            const updatedItems = state.items.map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        unit_type: unitType
                    };
                }
                return item;
            });

            return {
                ...state,
                items: updatedItems,
                total: updatedItems.reduce((sum, item) => sum + item.total, 0)
            };
        }

        case 'CLEAR_CART':
            return { items: [], total: 0 };

        case 'LOAD_CART':
            return action.payload.cart;

        case 'ADD_DELIVERY': {
            const { product } = action.payload;
            // Check if delivery is already in cart
            const hasDelivery = state.items.some(
                item => item.product && item.product.product_code === 'SRV001'
            );

            if (hasDelivery) {
                return state;
            }

            // Add delivery to cart
            const unitPrice = parseFloat(product.selling_price);
            const newItem: CartItem = {
                id: Date.now(),
                product,
                quantity: 1,
                unit_price: unitPrice,
                total: unitPrice,
                unit_type: product.stock_unit
            };

            const updatedItems = [...state.items, newItem];
            return {
                ...state,
                items: updatedItems,
                total: updatedItems.reduce((sum, item) => sum + item.total, 0)
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
                console.log('Found cart in localStorage, age:', Math.round(cartAge / 1000 / 60), 'minutes');
                const parsedCart = JSON.parse(savedCart);

                if (parsedCart && parsedCart.items && Array.isArray(parsedCart.items)) {
                    // Validate all cart items have the necessary properties
                    const validItems = parsedCart.items.filter(item =>
                        item &&
                        item.product &&
                        typeof item.product === 'object' &&
                        'id' in item.product &&
                        'name' in item.product
                    );

                    // Only load if we have valid items
                    if (validItems.length > 0) {
                        // Recalculate total to ensure it's correct
                        const validCart = {
                            items: validItems,
                            total: validItems.reduce((sum, item) => sum + (item.total || 0), 0)
                        };

                        console.log('Loading validated cart:', validCart);
                        dispatch({ type: 'LOAD_CART', payload: { cart: validCart } });
                    }
                }
            } else if (savedCart) {
                console.log('Found stale cart data, not loading');
                // Clear stale data
                localStorage.removeItem(STORAGE_KEY);
                localStorage.removeItem(`${STORAGE_KEY}_timestamp`);
            }
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            // Clean up potentially corrupted data
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(`${STORAGE_KEY}_timestamp`);
        }
    }, []);

    // Save cart to localStorage on change
    useEffect(() => {
        try {
            // Create a simplified version for storage to avoid circular references
            const storageCart = {
                items: cart.items.map(item => ({
                    id: item.id,
                    product: {
                        id: item.product.id,
                        name: item.product.name,
                        product_code: item.product.product_code,
                        selling_price: item.product.selling_price,
                        buying_price: item.product.buying_price || '0',
                        quantity: item.product.quantity || 0,
                        available_units: item.product.available_units || 0,
                        stock_unit: item.product.stock_unit || 'piece',
                        category_id: item.product.category_id || null
                    },
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total: item.total,
                    unit_type: item.unit_type
                })),
                total: cart.total
            };

            console.log('Saving cart to localStorage:', storageCart);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(storageCart));

            // Also save a timestamp to verify freshness
            localStorage.setItem(`${STORAGE_KEY}_timestamp`, Date.now().toString());
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
        }
    }, [cart]);

    // Helper function to calculate unit price
    const calculateUnitPrice = (product: Product): number => {
        const numericPrice = parseFloat(product.selling_price);
        switch (product.stock_unit) {
            case 'dozen':
                return numericPrice / 12;
            case 'pack':
                return numericPrice / 6;
            default:
                return numericPrice;
        }
    };

    // Action creators
    const addToCart = (product: Product) => {
        const unitPrice = calculateUnitPrice(product);
        dispatch({ type: 'ADD_ITEM', payload: { product, unitPrice } });
    };

    const removeFromCart = (itemId: number) => {
        dispatch({ type: 'REMOVE_ITEM', payload: { itemId } });
    };

    const updateQuantity = (itemId: number, quantity: number) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
    };

    const updateUnitPrice = (itemId: number, price: number) => {
        dispatch({ type: 'UPDATE_UNIT_PRICE', payload: { itemId, price } });
    };

    const updateUnitType = (itemId: number, unitType: string) => {
        dispatch({ type: 'UPDATE_UNIT_TYPE', payload: { itemId, unitType } });
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
        // Also clear localStorage
        localStorage.removeItem(STORAGE_KEY);
    };

    const addDeliveryService = (deliveryService: Product) => {
        dispatch({ type: 'ADD_DELIVERY', payload: { product: deliveryService } });
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
                addDeliveryService
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
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}; 