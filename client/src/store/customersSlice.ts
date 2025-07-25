import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Customer } from "@/types/customer";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export const fetchCustomers = createAsyncThunk("customers/fetchCustomers", async () => {
  const response = await api.get(API_ENDPOINTS.customers.list);
  return response.data.data;
});

const customersSlice = createSlice({
  name: "customers",
  initialState: {
    items: [] as Customer[],
    status: "idle" as "idle" | "loading" | "succeeded" | "failed",
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch customers";
      });
  },
});

export default customersSlice.reducer;
