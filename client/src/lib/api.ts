import axios from "axios";

const isDevelopment = process.env.NODE_ENV === "development";

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    // Only log in development and if it's an error
    if (isDevelopment && config.method === "get") {
      console.debug(`Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    if (isDevelopment) {
      console.error("Request error:", error);
    }
    return Promise.reject(error);
  },
);

// Add response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => {
    // Only log errors in development
    if (isDevelopment && response.status >= 400) {
      console.debug(`Response from ${response.config.url}:`, response.data);
    }
    return response;
  },
  (error) => {
    if (isDevelopment) {
      console.error("Response error:", error);
    }
    return Promise.reject(error);
  },
);
