import { api } from './api';
import { Product } from '../types/product';

export const favoritesService = {
    getFavorites: async (): Promise<Product[]> => {
        const response = await api.get('/favorites');
        return response.data.data;
    },

    checkFavoriteStatus: async (productId: number): Promise<{ isFavorite: boolean }> => {
        const response = await api.get(`/favorites/check/${productId}`);
        return response.data.data;
    },

    // POST /favorites/:productId returns { success, message, data: favorite }
    addFavorite: async (productId: number): Promise<{ success: boolean; message: string }> => {
        const response = await api.post(`/favorites/${productId}`);
        return response.data;
    },

    // DELETE /favorites/:productId returns { success, message }
    removeFavorite: async (productId: number): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`/favorites/${productId}`);
        return response.data;
    },

    toggleFavorite: async (productId: number): Promise<{ message: string; data: { isFavorite: boolean } }> => {
        const response = await api.patch(`/favorites/${productId}/toggle`);
        return response.data;
    }
};
