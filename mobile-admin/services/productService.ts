import { api } from './api';
import { Product, ProductInsert, ProductUpdate } from '../types/product';

// The API wraps product payloads in { success, data }
export const productService = {
    getAll: async () => {
        const response = await api.get<{ success: boolean; data: Product[] }>('/products', {
            params: { limit: 1000 },
        });
        return response.data.data;
    },

    getById: async (id: number) => {
        const response = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
        return response.data.data;
    },

    create: async (data: ProductInsert) => {
        const response = await api.post<{ success: boolean; data: Product }>('/products', data);
        return response.data.data;
    },

    update: async (id: number, data: ProductUpdate) => {
        const response = await api.put<{ success: boolean; data: Product }>(`/products/${id}`, data);
        return response.data.data;
    },

    delete: async (id: number) => {
        await api.delete(`/products/${id}`);
    },

    search: async (query: string) => {
        const response = await api.get<{ success: boolean; data: Product[] }>(
            `/products/search?q=${encodeURIComponent(query)}`
        );
        return response.data.data;
    }
};
