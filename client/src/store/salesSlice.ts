import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";
import { Sale, CreateSaleRequest } from "@/types/sale";

export const fetchSales = createAsyncThunk(
    "sales/fetchSales",
    async (params: { page?: number; pageSize?: number } = {}, { rejectWithValue }) => {
        try {
            const { page = 1, pageSize = 10 } = params;
            const response = await api.get(`${API_ENDPOINTS.sales.list}?page=${page}&pageSize=${pageSize}`);
            return {
                sales: response.data.sales,
                total: response.data.total,
                pagination: {
                    page,
                    pageSize,
                    total: response.data.total,
                    totalPages: Math.ceil(response.data.total / pageSize),
                },
            };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch sales");
        }
    }
);

export const createSale = createAsyncThunk(
    "sales/createSale",
    async (saleData: CreateSaleRequest, { rejectWithValue }) => {
        try {
            const response = await api.post(API_ENDPOINTS.sales.create, saleData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to create sale");
        }
    }
);

export const updateSale = createAsyncThunk(
    "sales/updateSale",
    async ({ id, data }: { id: number; data: Partial<Sale> }, { rejectWithValue }) => {
        try {
            const response = await api.put(API_ENDPOINTS.sales.update(id), data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to update sale");
        }
    }
);

export const deleteSale = createAsyncThunk(
    "sales/deleteSale",
    async (id: number, { rejectWithValue }) => {
        try {
            await api.delete(API_ENDPOINTS.sales.delete(id));
            return id;
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to delete sale");
        }
    }
);

export const fetchOrders = createAsyncThunk(
    "sales/fetchOrders",
    async (params: { page?: number; pageSize?: number } = {}, { rejectWithValue }) => {
        try {
            const { page = 1, pageSize = 10 } = params;
            const response = await api.get(`${API_ENDPOINTS.orders.list}?page=${page}&pageSize=${pageSize}`);
            return {
                orders: response.data.orders,
                total: response.data.total,
                pagination: {
                    page,
                    pageSize,
                    total: response.data.total,
                    totalPages: Math.ceil(response.data.total / pageSize),
                },
            };
        } catch (error) {
            return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch orders");
        }
    }
);

interface SalesState {
    sales: Sale[];
    orders: any[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error: string | null;
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
    ordersPagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

const initialState: SalesState = {
    sales: [],
    orders: [],
    status: "idle",
    error: null,
    pagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
    },
    ordersPagination: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
    },
};

const salesSlice = createSlice({
    name: "sales",
    initialState,
    reducers: {
        setSalesPage: (state, action) => {
            state.pagination.page = action.payload;
        },
        setSalesPageSize: (state, action) => {
            state.pagination.pageSize = action.payload;
            state.pagination.page = 1; // Reset to first page when changing page size
        },
        setOrdersPage: (state, action) => {
            state.ordersPagination.page = action.payload;
        },
        setOrdersPageSize: (state, action) => {
            state.ordersPagination.pageSize = action.payload;
            state.ordersPagination.page = 1; // Reset to first page when changing page size
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Sales
            .addCase(fetchSales.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchSales.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.sales = action.payload.sales;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchSales.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Failed to fetch sales";
            })
            // Create Sale
            .addCase(createSale.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(createSale.fulfilled, (state, action) => {
                state.status = "succeeded";
                // Add the new sale to the beginning of the list (newest first)
                state.sales.unshift(action.payload);
                state.pagination.total += 1;
                state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.pageSize);
            })
            .addCase(createSale.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Failed to create sale";
            })
            // Update Sale
            .addCase(updateSale.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(updateSale.fulfilled, (state, action) => {
                state.status = "succeeded";
                const index = state.sales.findIndex((sale) => sale.id === action.payload.id);
                if (index !== -1) {
                    state.sales[index] = action.payload;
                }
            })
            .addCase(updateSale.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Failed to update sale";
            })
            // Delete Sale
            .addCase(deleteSale.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(deleteSale.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.sales = state.sales.filter((sale) => sale.id !== action.payload);
                state.pagination.total -= 1;
                state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.pageSize);
            })
            .addCase(deleteSale.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Failed to delete sale";
            })
            // Fetch Orders
            .addCase(fetchOrders.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.orders = action.payload.orders;
                state.ordersPagination = action.payload.pagination;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.status = "failed";
                state.error = (action.payload as string) || "Failed to fetch orders";
            });
    },
});

export const {
    setSalesPage,
    setSalesPageSize,
    setOrdersPage,
    setOrdersPageSize,
    clearError,
} = salesSlice.actions;

export default salesSlice.reducer;
