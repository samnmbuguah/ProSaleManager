import { useQuery } from "@tanstack/react-query";
import { type Product, type SupplierProduct } from "@db/schema";

export interface SupplierProductWithProduct extends SupplierProduct {
  product?: Product;
}

export function useSupplierProducts(supplierId?: number) {
  return useQuery<SupplierProductWithProduct[]>({
    queryKey: ['supplier-products', supplierId],
    queryFn: () =>
      supplierId
        ? fetch(`/api/supplier-products/${supplierId}`).then((res) => res.json())
        : Promise.resolve([]),
    enabled: !!supplierId,
  });
}
