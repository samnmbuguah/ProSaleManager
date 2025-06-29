import { useState, useCallback } from "react";
import { Product } from "@/types";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-endpoints";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES,
): Promise<unknown> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Server returned ${response.status}: ${errorText || "No error details"}`,
      );
    }
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.products.list);
      setProducts(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { products, isLoading, error, fetchProducts, setProducts };
}
