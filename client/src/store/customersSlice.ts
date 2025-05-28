import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Customer } from "@/types/customer";

export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/customers`, {
      credentials: "include",
    });
    return await response.json();
  },
);

const customersSlice = createSlice({
  name: "customers",
  initialState: {
    items: [] as Customer[],
    status: "idle",
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || null;
      });
  },
});

export default customersSlice.reducer;
