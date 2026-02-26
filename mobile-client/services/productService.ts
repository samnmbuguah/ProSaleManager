import { api } from './api';
import { Product } from '../types/product';

export const productService = {
    getAll: async () => {
        const response = await api.get<{ success: boolean; data: Product[] }>('/products');
        return response.data.data;
    },

    getById: async (id: number) => {
        const response = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
        return response.data.data;
    },

    search: async (query: string) => {
        const response = await api.get<{ success: boolean; data: Product[] }>(`/products/search?q=${encodeURIComponent(query)}`);
        return response.data.data;
    }
};
