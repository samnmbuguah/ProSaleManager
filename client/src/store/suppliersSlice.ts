import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Supplier } from "@/types/supplier";
import { api } from "@/lib/api";

export const fetchSuppliers = createAsyncThunk(
  "suppliers/fetchSuppliers",
  async () => {
    const response = await api.get("/api/suppliers");
    return response.data.data;
  },
);

const suppliersSlice = createSlice({
  name: "suppliers",
  initialState: {
    items: [] as Supplier[],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch suppliers";
      });
  },
});

export default suppliersSlice.reducer;
