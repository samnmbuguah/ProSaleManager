import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Product, ProductFormData } from '@/types/product'
import { api } from '@/lib/api'

interface ProductsState {
  items: Product[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  status: 'idle',
  error: null
}

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async () => {
    const response = await api.get('/products')
    return response.data
  }
)

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (product: ProductFormData) => {
    const response = await api.post('/products', product)
    return response.data
  }
)

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, product }: { id: number; product: ProductFormData }) => {
    const response = await api.put(`/products/${id}`, product)
    return response.data
  }
)

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: number) => {
    await api.delete(`/products/${id}`)
    return id
  }
)

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Failed to fetch products'
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.items.push(action.payload)
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = action.payload
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload)
      })
  }
})

export default productsSlice.reducer
