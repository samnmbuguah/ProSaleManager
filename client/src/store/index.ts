import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "./productsSlice";
import suppliersReducer from "./suppliersSlice";
import purchaseOrdersReducer from "./purchaseOrdersSlice";
import customersReducer from "./customersSlice";

export const store = configureStore({
  reducer: {
    products: productsReducer,
    suppliers: suppliersReducer,
    purchaseOrders: purchaseOrdersReducer,
    customers: customersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
