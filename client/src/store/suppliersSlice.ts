import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Supplier } from "@/types/supplier";

export const fetchSuppliers = createAsyncThunk(
  "suppliers/fetchSuppliers",
  async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/suppliers`, {
      credentials: "include",
    });
    return await response.json();
  },
);

const suppliersSlice = createSlice({
  name: "suppliers",
  initialState: {
    items: [] as Supplier[],
    status: "idle",
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSuppliers.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || null;
      });
  },
});

export default suppliersSlice.reducer;
