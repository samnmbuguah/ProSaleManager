import { api } from './api';
import { SaleItem, SalesResponse } from '../types/sale';

export const saleService = {
    getSales: async (page = 1, pageSize = 20) => {
        const response = await api.get<SalesResponse>('/sales', {
            params: { page, pageSize },
        });
        return response.data;
    },

    getSaleItems: async (saleId: number) => {
        const response = await api.get<SaleItem[]>(`/sales/${saleId}/items`);
        return response.data;
    },
};
