import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Supplier } from "@/types/supplier";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export const fetchSuppliers = createAsyncThunk("suppliers/fetchSuppliers", async () => {
  const response = await api.get(API_ENDPOINTS.suppliers.list);
  // Always return an array, regardless of backend response shape
  return Array.isArray(response.data) ? response.data : response.data.data;
});

export const createSupplier = createAsyncThunk(
  "suppliers/createSupplier",
  async (supplierData: Omit<Supplier, "id" | "created_at" | "updated_at">) => {
    const response = await api.post(API_ENDPOINTS.suppliers.create, supplierData);
    return response.data;
  }
);

export const updateSupplier = createAsyncThunk(
  "suppliers/updateSupplier",
  async ({ id, data }: { id: number; data: Partial<Supplier> }) => {
    const response = await api.put(API_ENDPOINTS.suppliers.update(id), data);
    return response.data;
  }
);

export const deleteSupplier = createAsyncThunk("suppliers/deleteSupplier", async (id: number) => {
  await api.delete(API_ENDPOINTS.suppliers.delete(id));
  return id;
});

const suppliersSlice = createSlice({
  name: "suppliers",
  initialState: {
    items: [] as Supplier[],
    status: "idle" as "idle" | "loading" | "succeeded" | "failed",
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch suppliers
      .addCase(fetchSuppliers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchSuppliers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch suppliers";
      })
      // Create supplier
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      // Update supplier
      .addCase(updateSupplier.fulfilled, (state, action) => {
        const index = state.items.findIndex((supplier) => supplier.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      // Delete supplier
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.items = state.items.filter((supplier) => supplier.id !== action.payload);
      });
  },
});

export default suppliersSlice.reducer;
