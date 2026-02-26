import { Product } from './product';

export interface CartItem {
    id: number;
    product_id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    unit_type: string;
    total: number;
}

export interface Cart {
    items: CartItem[];
    total: number;
}
