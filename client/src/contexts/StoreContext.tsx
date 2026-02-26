import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { api, setApiStoreId } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

interface Store {
  id: number;
  name: string;
  domain: string | null;
  subdomain: string | null;
}

interface StoreContextType {
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  stores: Store[];
  setStores: (stores: Store[]) => void;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedStores = useRef(false);

  // Load stores from API - runs once on mount
  useEffect(() => {
    if (hasFetchedStores.current) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    hasFetchedStores.current = true;

    console.log("[StoreContext] Fetching stores...");
    api.get("/stores")
      .then((res) => {
        const data = res.data;
        console.log("[StoreContext] API response:", data);
        if (data.success && Array.isArray(data.data)) {
          console.log("[StoreContext] Stores fetched:", data.data.length, "stores");
          setStores(data.data);

          // If no store selected yet, derive from URL or default to first
          if (data.data.length > 0) {
            const storedStr = localStorage.getItem("currentStore");
            let initialStore = data.data[0];

            // Try to match from URL first
            const pathParts = window.location.pathname.split("/").filter(Boolean);
            const urlStoreSegment = pathParts[0];

            console.log("[StoreContext] URL path parts:", pathParts, "First segment:", urlStoreSegment);

            if (urlStoreSegment) {
              const decodedName = decodeURIComponent(urlStoreSegment);
              const matchedStore = data.data.find((store: Store) => store.name === decodedName);
              if (matchedStore) {
                console.log("[StoreContext] Matched store from URL:", matchedStore.name);
                initialStore = matchedStore;
              }
            } else if (storedStr) {
              // Fall back to localStorage
              try {
                const parsed = JSON.parse(storedStr);
                const matchedStore = data.data.find((store: Store) => store.id === parsed.id);
                if (matchedStore) {
                  console.log("[StoreContext] Matched store from localStorage:", matchedStore.name);
                  initialStore = matchedStore;
                }
              } catch {
                // Ignore
              }
            }

            console.log("[StoreContext] Setting currentStore to:", initialStore.name);
            setCurrentStore(initialStore);
            localStorage.setItem("currentStore", JSON.stringify(initialStore));
          } else {
            console.log("[StoreContext] No stores returned from API!");
          }
        } else {
          console.log("[StoreContext] API response not successful or data not array:", data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch stores in StoreContext:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Persist current store in localStorage, sync to API module, and clear caches
  // Use useLayoutEffect to ensure this runs before any child components render/fetch
  const previousStoreIdRef = useRef<number | null>(null);

  React.useLayoutEffect(() => {
    if (currentStore) {
      // Clear all caches when store CHANGES (not on initial load)
      if (previousStoreIdRef.current !== null && previousStoreIdRef.current !== currentStore.id) {
        console.log("[StoreContext] Store changed from", previousStoreIdRef.current, "to", currentStore.id);

        // Clear React Query cache and refetch all active queries
        queryClient.invalidateQueries();

        console.log("[StoreContext] Cleared all React Query caches");
      }
      previousStoreIdRef.current = currentStore.id;

      localStorage.setItem("currentStore", JSON.stringify(currentStore));
      setApiStoreId(currentStore.id.toString());
    } else {
      localStorage.removeItem("currentStore");
      setApiStoreId(null);
    }
  }, [currentStore]);

  // Note: localStorage loading is now handled in the main stores fetch effect above

  return (
    <StoreContext.Provider value={{ currentStore, setCurrentStore, stores, setStores, isLoading }}>
      {children}
    </StoreContext.Provider>
  );
};

export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreContext must be used within StoreProvider");
  return ctx;
}
