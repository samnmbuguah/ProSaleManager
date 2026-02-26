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
// In-memory store ID for immediate switching without localStorage latency
let activeStoreId: string | null = null;
export const setApiStoreId = (id: string | null) => {
  activeStoreId = id;
};

// Add request interceptor for CSRF token, auth, and store_id for super admin
api.interceptors.request.use(async (config) => {
  // Skip CSRF token for:
  // 1. GET requests to non-auth endpoints
  // 2. The CSRF token endpoint itself
  // 3. DELETE requests (they don't need CSRF in this implementation)
  if (
    (config.method === "get" && !config.url?.startsWith("/auth")) ||
    config.method === "delete" ||
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
    // Priority 1: In-memory active store ID (set instantly by UI switch)
    // Priority 1: In-memory active store ID (set instantly by UI switch)
    if (activeStoreId && !config.headers["x-store-id"]) {
      config.headers["x-store-id"] = activeStoreId;
    } else if (!config.headers["x-store-id"]) {
      // Priority 2: Fallback to localStorage (for initial load / refresh)
      const store = localStorage.getItem("currentStore");
      if (store) {
        try {
          const storeObj = JSON.parse(store);
          if (storeObj && storeObj.id) {
            config.headers["x-store-id"] = storeObj.id.toString();
            // Hydrate memory cache
            activeStoreId = storeObj.id.toString();
          }
        } catch {
          // Ignore parse error
        }
      }
    }
  } catch (error) {
    console.error("Error setting headers:", error);
  }

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
      // Don't log 401s to console to keep it clean during session checks
      if (error.response?.status !== 401) {
        console.error("API Error:", {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data,
        });
      }
    }

    // If we get a 403, clear the token and retry a failed request once
    if (error.response?.status === 403 && error.config.method !== "get" && !error.config._retry) {
      error.config._retry = true;
      csrfToken = null;
      const newToken = await fetchCsrfToken();
      if (newToken) {
        error.config.headers["X-CSRF-Token"] = newToken;
        return api(error.config);
      }
    }

    // Handle 401 errors (unauthorized) - don't redirect if on root route
    if (error.response?.status === 401 && window.location.pathname !== "/") {
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
