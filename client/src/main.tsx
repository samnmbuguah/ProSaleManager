import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import App from "./App";
import { StoreProvider } from "@/contexts/StoreContext";
import { StoreDataProvider } from "@/contexts/StoreDataContext";
import { ThemeProvider } from "@/components/theme-provider";

const root = document.getElementById("root") as HTMLElement;
createRoot(root).render(
  <StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <StoreProvider>
          <StoreDataProvider>
            <CartProvider>
              <ThemeProvider defaultTheme="light" storageKey="app-ui-theme">
                <App />
              </ThemeProvider>
            </CartProvider>
          </StoreDataProvider>
        </StoreProvider>
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>
);
