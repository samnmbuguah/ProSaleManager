import { api } from './api';
import { Category } from '../types/category';

export const categoryService = {
    getAll: async () => {
        const response = await api.get<{ success: boolean; data: Category[] }>('/categories');
        return response.data.data;
    },
};
