import { useState, useCallback } from "react";

interface Customer {
  id: number;
  name: string;
  phone?: string;
}

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

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data: unknown = await fetchWithRetry(
        `${import.meta.env.VITE_API_URL}/customers`,
        { credentials: "include" },
      );
      setCustomers(data as Customer[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { customers, isLoading, error, fetchCustomers, setCustomers };
}
