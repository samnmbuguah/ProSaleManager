import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Product } from "@/types/product";
import type { ProductFormData } from "@/types/product";

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/products`, {
      credentials: "include",
    });
    return await response.json();
  },
);

export const searchProducts = createAsyncThunk(
  "products/searchProducts",
  async (query: string) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/products/search?query=${encodeURIComponent(query)}`,
      {
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Failed to search products");
    return await response.json();
  },
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async (
    { id, data }: { id: number; data: Partial<ProductFormData> },
    { dispatch },
  ) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/products/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Failed to update product");
    await dispatch(fetchProducts());
    return await response.json();
  },
);

const initialFormData: ProductFormData = {
  name: "",
  product_code: "",
  category: "",
  stock_unit: "piece",
  quantity: 0,
  min_stock: 0,
  buying_price: "0",
  selling_price: "0",
};

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [] as Product[],
    status: "idle",
    error: null as string | null,
    isAddDialogOpen: false,
    isEditDialogOpen: false,
    selectedProduct: null as Product | null,
    searchQuery: "",
    activeTab: "products",
    imagePreview: null as string | null,
    formData: initialFormData as ProductFormData,
  },
  reducers: {
    setIsAddDialogOpen(state, action) {
      state.isAddDialogOpen = action.payload;
    },
    setIsEditDialogOpen(state, action) {
      state.isEditDialogOpen = action.payload;
    },
    setSelectedProduct(state, action) {
      state.selectedProduct = action.payload;
    },
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
    },
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    },
    setImagePreview(state, action) {
      if (typeof action.payload === "function") {
        console.warn("setImagePreview: function passed as payload, ignoring.");
        return;
      }
      state.imagePreview = action.payload;
    },
    setFormData(state, action) {
      if (typeof action.payload === "function") {
        console.warn("setFormData: function passed as payload, ignoring.");
        return;
      }
      state.formData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || null;
      })
      .addCase(searchProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || null;
      })
      .addCase(updateProduct.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateProduct.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || null;
      });
  },
});

export const {
  setIsAddDialogOpen,
  setIsEditDialogOpen,
  setSelectedProduct,
  setSearchQuery,
  setActiveTab,
  setImagePreview,
  setFormData,
} = productsSlice.actions;

export default productsSlice.reducer;
