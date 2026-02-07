import { api } from './api';
import { Product, ProductInsert, ProductUpdate } from '../types/product';

export const productService = {
    getAll: async () => {
        const response = await api.get<Product[]>('/products');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get<Product>(`/products/${id}`);
        return response.data;
    },

    create: async (data: ProductInsert) => {
        const response = await api.post<Product>('/products', data);
        return response.data;
    },

    update: async (id: number, data: ProductUpdate) => {
        const response = await api.put<Product>(`/products/${id}`, data);
        return response.data;
    },

    delete: async (id: number) => {
        await api.delete(`/products/${id}`);
    },

    search: async (query: string) => {
        const response = await api.get<Product[]>(`/products/search?q=${encodeURIComponent(query)}`);
        return response.data;
    }
};
