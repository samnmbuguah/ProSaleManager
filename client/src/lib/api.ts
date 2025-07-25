import axios from "axios";
import { API_ENDPOINTS } from "./api-endpoints";
import { toast } from "@/components/ui/use-toast";

const isDevelopment = process.env.NODE_ENV === "development";

// API Configuration
const API_CONFIG = {
  baseURL: "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
};

// Create axios instance with default config
export const api = axios.create(API_CONFIG);

let csrfToken: string | null = null;

// Function to fetch a new CSRF token
export const fetchCsrfToken = async () => {
  // Only log errors, not every fetch attempt
  try {
    // Create a new axios instance without interceptors for the CSRF token request
    const csrfApi = axios.create(API_CONFIG);
    const response = await csrfApi.get(API_ENDPOINTS.auth.csrfToken);
    csrfToken = response.data.token;
    return csrfToken;
  } catch (error) {
    console.error("Failed to fetch CSRF token:", error);
    return null;
  }
};

// Add request interceptor for CSRF token, auth, and store_id for super admin
api.interceptors.request.use(async (config) => {
  // Remove noisy debug logs
  // Skip CSRF token for:
  // 1. GET requests to non-auth endpoints
  // 2. The CSRF token endpoint itself
  if (
    (config.method === "get" && !config.url?.startsWith("/auth")) ||
    config.url === API_ENDPOINTS.auth.csrfToken
  ) {
    return config;
  }

  // If we don't have a token, fetch one
  if (!csrfToken) {
    await fetchCsrfToken();
  }

  // Add CSRF token to headers if available
  if (csrfToken) {
    config.headers["X-CSRF-Token"] = csrfToken;
  }

  // Add store_id for super admin if present
  try {
    const store = localStorage.getItem("currentStore");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user && user.role === "super_admin" && store) {
      const storeObj = JSON.parse(store);
      if (storeObj && storeObj.id) {
        // Add as query param for GET, or in data/body for POST/PUT
        if (config.method === "get" || config.method === "delete") {
          const url = new URL(config.url!, window.location.origin);
          url.searchParams.set("store_id", storeObj.id);
          config.url = url.pathname + url.search;
        } else if (config.data && typeof config.data === "object") {
          config.data = { ...config.data, store_id: storeObj.id };
        } else {
          config.data = { store_id: storeObj.id };
        }
      }
    }
  } catch {}
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Remove noisy debug logs
    return response;
  },
  async (error) => {
    if (isDevelopment) {
      console.error("API Error:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
    }

    // If we get a 403, clear the token and retry once
    if (error.response?.status === 403 && error.config.method !== "get") {
      csrfToken = null;
      const newToken = await fetchCsrfToken();
      if (newToken) {
        error.config.headers["X-CSRF-Token"] = newToken;
        return api(error.config);
      }
    }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401) {
      toast({
        title: "Session expired",
        description: "Please log in again.",
        variant: "destructive",
      });
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
      // If already on /auth, do not redirect again (prevents infinite loop)
    }

    return Promise.reject(error);
  }
);

// Centralized API function to fetch all purchase orders
export async function fetchPurchaseOrdersApi() {
  const response = await api.get(API_ENDPOINTS.purchaseOrders.list);
  return response.data;
}

export { API_ENDPOINTS };
