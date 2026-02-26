import { api } from "@/lib/api";

export interface StockLog {
    id: number;
    product_id: number;
    quantity_added: number;
    unit_cost: number;
    total_cost: number;
    user_id: number;
    store_id: number;
    type: string;
    notes?: string;
    date: string;
    product?: {
        name: string;
        sku: string;
    };
    user?: {
        name: string;
    };
}

export interface StockValueReportResponse {
    total_value: number;
    logs: StockLog[];
}

export const stockService = {
    getValueReport: async (storeId?: number, filters?: { start_date?: string; end_date?: string }) => {
        const headers = storeId ? { "x-store-id": storeId.toString() } : {};
        const params = new URLSearchParams();
        if (filters?.start_date) params.append("start_date", filters.start_date);
        if (filters?.end_date) params.append("end_date", filters.end_date);

        const response = await api.get<StockValueReportResponse>(`/stock/value-report?${params.toString()}`, { headers });
        return response.data;
    },

    receiveStock: async (data: any, storeId?: number) => {
        const headers = storeId ? { "x-store-id": storeId.toString() } : {};
        const response = await api.post("/stock/receive", data, { headers });
        return response.data;
    }
};
