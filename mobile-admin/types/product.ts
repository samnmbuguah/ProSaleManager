export const STOCK_UNITS = ["piece", "pack", "dozen"] as const;

export type StockUnitType = (typeof STOCK_UNITS)[number];

export interface Product {
    id: number;
    name: string;
    description: string;
    sku: string;
    barcode: string;
    category_id: number;
    piece_buying_price: number;
    piece_selling_price: number;
    pack_buying_price: number;
    pack_selling_price: number;
    dozen_buying_price: number;
    dozen_selling_price: number;
    quantity: number;
    min_quantity: number;
    image_url: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    images: string[];
    stock_unit: StockUnitType;
    Category?: {
        id: number;
        name: string;
    };
}

export type ProductInsert = Omit<Product, "id" | "created_at" | "updated_at" | "Category">;
export type ProductUpdate = Partial<ProductInsert>;
