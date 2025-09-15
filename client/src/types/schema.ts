// Client-side type definitions that mirror server schema

export interface User {
  id: number;
  email: string;
  name: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InsertUser {
  email: string;
  name: string;
  password: string;
  role?: string;
}

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  sku: string;
  piece_selling_price?: number;
  piece_buying_price?: number;
  pack_selling_price?: number;
  pack_buying_price?: number;
  dozen_selling_price?: number;
  dozen_buying_price?: number;
  quantity: number;
  min_quantity?: number;
  category_id?: number;
  category?: string;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyPoints {
  id: number;
  customerId: number;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTransaction {
  id: number;
  customerId: number;
  points: number;
  type: "earn" | "redeem";
  createdAt: Date;
}
