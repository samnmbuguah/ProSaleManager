import { useQuery } from "@tanstack/react-query";
import type { SupplierProduct } from "@db/schema";

export function useSupplierProducts(supplierId: number) {
  return useQuery<SupplierProduct[]>({
    queryKey: ["supplier-products", supplierId],
    queryFn: () =>
      fetch(`/api/supplier-products/${supplierId}`).then((res) => res.json()),
    enabled: !!supplierId,
  });
}
