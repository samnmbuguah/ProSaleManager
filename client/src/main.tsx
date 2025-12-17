import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { CartProvider } from "@/contexts/CartContext";
import { Provider } from "react-redux";
import { store } from "./store";
import { AuthProvider } from "@/contexts/AuthContext";
import App from "./App";
import { StoreProvider } from "@/contexts/StoreContext";
import { ThemeProvider } from "@/components/theme-provider";

const root = document.getElementById("root") as HTMLElement;
createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <StoreProvider>
            <CartProvider>
              <ThemeProvider defaultTheme="light" storageKey="app-ui-theme">
                <App />
              </ThemeProvider>
            </CartProvider>
          </StoreProvider>
        </QueryClientProvider>
      </AuthProvider>
    </Provider>
  </StrictMode>
);
