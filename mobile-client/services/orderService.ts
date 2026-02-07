import { api } from './api';
import { Sale } from '../types/sale';

export const orderService = {
    getOrders: async (page = 1, pageSize = 10): Promise<{ orders: Sale[] }> => {
        const response = await api.get(`/orders?page=${page}&pageSize=${pageSize}`);
        return response.data;
    }
};
