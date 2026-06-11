export interface SaleItemProduct {
    id: number;
    name: string;
    sku: string;
}

export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    quantity: number;
    // DECIMAL columns are serialized as strings by the API
    unit_price: number | string;
    buying_price?: number | string | null;
    total: number | string;
    unit_type: string;
    Product?: SaleItemProduct;
}

export interface SaleUser {
    id: number;
    name: string;
    email: string;
}

export interface SaleCustomer {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
}

export interface Sale {
    id: number;
    customer_id: number | null;
    user_id: number;
    total_amount: number | string;
    payment_method: string;
    payment_details?: { cash?: number; mpesa?: number } | null;
    amount_paid: number | string;
    status: string;
    payment_status: string;
    delivery_fee: number | string;
    store_id: number;
    createdAt: string;
    updatedAt: string;
    User?: SaleUser | null;
    Customer?: SaleCustomer | null;
    items?: SaleItem[];
}

export interface SalesResponse {
    sales: Sale[];
    total: number;
    totalPages: number;
    currentPage: number;
}
