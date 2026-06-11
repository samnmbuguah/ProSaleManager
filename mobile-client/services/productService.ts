import { api } from './api';
import { Product } from '../types/product';

export const productService = {
    getAll: async () => {
        // Server paginates with a default limit of 10; request a large page so the shop grid shows the full catalog
        const response = await api.get<{ success: boolean; data: Product[] }>('/products?limit=1000');
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
