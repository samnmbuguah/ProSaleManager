import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { PurchaseOrder } from "@/types/purchase-order";
import { api, API_ENDPOINTS } from "@/lib/api";

export const fetchPurchaseOrders = createAsyncThunk(
  "purchaseOrders/fetchPurchaseOrders",
  async () => {
    const response = await api.get(API_ENDPOINTS.purchaseOrders.list);
    return response.data;
  }
);

const purchaseOrdersSlice = createSlice({
  name: "purchaseOrders",
  initialState: {
    items: [] as PurchaseOrder[],
    status: "idle",
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || null;
      });
  },
});

export default purchaseOrdersSlice.reducer;
