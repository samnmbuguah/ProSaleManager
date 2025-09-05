import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { z } from "zod";
import { Product, productSchema } from "@/types/product";
import type { ProductFormData } from "@/types/product";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10 } = params;
      const response = await api.get(`${API_ENDPOINTS.products.list}?page=${page}&limit=${limit}`);
      return {
        products: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch products");
    }
  }
);

export const searchProducts = createAsyncThunk(
  "products/searchProducts",
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.products.search(query));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to search products");
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async (
    { id, data }: { id: number; data: Partial<ProductFormData> },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await api.put(API_ENDPOINTS.products.update(id), data);
      await dispatch(fetchProducts({ page: 1, limit: 10 }));
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update product");
    }
  }
);

const initialFormData: z.infer<typeof productSchema> = {
  name: "",
  description: "",
  sku: "",
  barcode: "",
  category_id: 1,
  piece_buying_price: 0,
  piece_selling_price: 0,
  pack_buying_price: 0,
  pack_selling_price: 0,
  dozen_buying_price: 0,
  dozen_selling_price: 0,
  quantity: 0,
  min_quantity: 0,
  image_url: "",
  is_active: true,
  stock_unit: "piece",
};

interface ProductsState {
  items: Product[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isAddDialogOpen: boolean;
  isEditDialogOpen: boolean;
  selectedProduct: Product | null;
  searchQuery: string;
  activeTab: string;
  imagePreview: string | null;
  formData: z.infer<typeof productSchema>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: ProductsState = {
  items: [],
  status: "idle",
  error: null,
  isAddDialogOpen: false,
  isEditDialogOpen: false,
  selectedProduct: null,
  searchQuery: "",
  activeTab: "products",
  imagePreview: null,
  formData: initialFormData,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

const productsSlice = createSlice({
  name: "products",
  initialState,
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
    setFormData: (state, action) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    resetFormData: (state) => {
      state.formData = initialFormData;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to fetch products";
      })
      .addCase(searchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to search products";
      })
      .addCase(updateProduct.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to update product";
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
  resetFormData,
  setPage,
} = productsSlice.actions;

export default productsSlice.reducer;
