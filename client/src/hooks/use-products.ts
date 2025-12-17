import { useStoreData } from "@/contexts/StoreDataContext";

export function useProducts() {
  const { products, isLoadingProducts: isLoading, productsError: error, refetchProducts: refetch } = useStoreData();

  return {
    products,
    isLoading,
    error,
    refetch,
  };
}
