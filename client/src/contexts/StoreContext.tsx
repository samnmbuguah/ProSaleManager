import React, { createContext, useContext, useState, useEffect } from "react";

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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  // Load stores for super admin (fetch from API if user is super admin)
  useEffect(() => {
    // Only fetch if not already loaded
    if (stores.length === 0 && window.location.pathname !== "/auth") {
      fetch("/api/stores")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setStores(data.data);
            // If no store selected, default to the first
            if (!currentStore && data.data.length > 0) {
              setCurrentStore(data.data[0]);
            }
          }
        })
        .catch(() => {});
    }
  }, [stores.length, currentStore]);

  // Persist current store in localStorage
  useEffect(() => {
    if (currentStore) {
      localStorage.setItem("currentStore", JSON.stringify(currentStore));
    }
  }, [currentStore]);

  // Load current store from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("currentStore");
    if (stored) {
      try {
        setCurrentStore(JSON.parse(stored));
      } catch {}
    }
  }, []);

  return (
    <StoreContext.Provider value={{ currentStore, setCurrentStore, stores, setStores }}>
      {children}
    </StoreContext.Provider>
  );
};

export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreContext must be used within StoreProvider");
  return ctx;
}
