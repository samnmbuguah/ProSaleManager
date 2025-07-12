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
  price: number;
  quantity: number;
  category?: string;
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
  type: 'earn' | 'redeem';
  createdAt: Date;
}
