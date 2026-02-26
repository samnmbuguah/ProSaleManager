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

    toggleFavorite: async (productId: number): Promise<{ message: string; data: { isFavorite: boolean } }> => {
        const response = await api.patch(`/favorites/${productId}/toggle`);
        return response.data;
    }
};
