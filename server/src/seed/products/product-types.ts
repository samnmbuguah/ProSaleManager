export interface ProductInput {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  piecePrice: number;
  dozenPrice: number;
  unitType: 'piece' | 'pack';
  packSize?: number;
}

export interface Supplier {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ProductSupplier {
  product_number: string;
  supplier_email: string;
  cost_price: string;
  is_preferred: boolean;
}

export interface ProductAttributes {
  name: string;
  description?: string;
  sku: string;
  category_id: number;
  quantity: number;
  piece_buying_price: number;
  piece_selling_price: number;
  pack_buying_price: number | null;
  pack_selling_price: number | null;
  dozen_buying_price: number;
  dozen_selling_price: number;
  store_id: number;
  unit_type: 'piece' | 'pack';
  pack_size: number | null;
  image_urls: string[] | null;
  min_quantity: number;
  stock_unit: string;
}
