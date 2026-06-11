import { api } from './api';
import { Sale } from '../types/sale';

export interface CreateOrderItem {
    product_id: number;
    quantity: number;
    unit_price: number;
    unit_type: string;
}

export const orderService = {
    getOrders: async (page = 1, pageSize = 10): Promise<{ orders: Sale[] }> => {
        const response = await api.get(`/orders?page=${page}&pageSize=${pageSize}`);
        return response.data;
    },

    // GET /orders/:id returns the Sale object directly (see server order.controller.ts getOrder)
    getOrder: async (id: number): Promise<Sale> => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    },

    // POST /orders returns { message, orderId } (see server order.controller.ts createOrder)
    createOrder: async (items: CreateOrderItem[]): Promise<{ message: string; orderId: number }> => {
        const response = await api.post('/orders', { items });
        return response.data;
    }
};
