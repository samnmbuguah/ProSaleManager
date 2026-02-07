import React, { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '@/types/product';

export interface POSCartItem {
    id: number;
    product_id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    unit_type: string;
    total: number;
}

export interface POSCart {
    items: POSCartItem[];
    total: number;
}

interface POSCartContextType {
    cart: POSCart;
    addToCart: (product: Product, quantity?: number) => void;
    removeFromCart: (itemId: number) => void;
    updateQuantity: (itemId: number, quantity: number) => void;
    clearCart: () => void;
}

const POSCartContext = createContext<POSCartContextType | undefined>(undefined);

type Action =
    | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
    | { type: 'REMOVE_ITEM'; payload: number }
    | { type: 'UPDATE_QUANTITY'; payload: { itemId: number; quantity: number } }
    | { type: 'CLEAR_CART' }
    | { type: 'LOAD_CART'; payload: POSCart };

const cartReducer = (state: POSCart, action: Action): POSCart => {
    switch (action.type) {
        case 'ADD_ITEM': {
            const { product, quantity } = action.payload;
            const existingItem = state.items.find(item => item.product.id === product.id);

            let newItems;
            if (existingItem) {
                newItems = state.items.map(item =>
                    item.id === existingItem.id
                        ? {
                            ...item,
                            quantity: item.quantity + quantity,
                            total: (item.quantity + quantity) * item.unit_price
                        }
                        : item
                );
            } else {
                const price = product.piece_selling_price || 0;
                newItems = [...state.items, {
                    id: Date.now(),
                    product_id: product.id,
                    product,
                    quantity,
                    unit_price: price,
                    unit_type: 'piece',
                    total: price * quantity
                }];
            }

            return {
                items: newItems,
                total: newItems.reduce((sum, item) => sum + item.total, 0)
            };
        }
        case 'REMOVE_ITEM': {
            const newItems = state.items.filter(item => item.id !== action.payload);
            return {
                items: newItems,
                total: newItems.reduce((sum, item) => sum + item.total, 0)
            };
        }
        case 'UPDATE_QUANTITY': {
            const { itemId, quantity } = action.payload;
            if (quantity <= 0) {
                const newItems = state.items.filter(item => item.id !== itemId);
                return {
                    items: newItems,
                    total: newItems.reduce((sum, item) => sum + item.total, 0)
                };
            }
            const newItems = state.items.map(item =>
                item.id === itemId
                    ? { ...item, quantity, total: quantity * item.unit_price }
                    : item
            );
            return {
                items: newItems,
                total: newItems.reduce((sum, item) => sum + item.total, 0)
            };
        }
        case 'CLEAR_CART':
            return { items: [], total: 0 };
        case 'LOAD_CART':
            return action.payload;
        default:
            return state;
    }
};

export const POSCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

    useEffect(() => {
        const loadCart = async () => {
            try {
                const savedCart = await AsyncStorage.getItem('pos_cart');
                if (savedCart) {
                    dispatch({ type: 'LOAD_CART', payload: JSON.parse(savedCart) });
                }
            } catch (e) {
                console.error('Failed to load cart', e);
            }
        };
        loadCart();
    }, []);

    useEffect(() => {
        AsyncStorage.setItem('pos_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: Product, quantity = 1) => {
        dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
    };

    const removeFromCart = (itemId: number) => {
        dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    };

    const updateQuantity = (itemId: number, quantity: number) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { itemId, quantity } });
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
    };

    return (
        <POSCartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>
            {children}
        </POSCartContext.Provider>
    );
};

export const usePOSCart = () => {
    const context = useContext(POSCartContext);
    if (!context) throw new Error('usePOSCart must be used within a POSCartProvider');
    return context;
};
