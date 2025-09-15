import { Product } from "@/types/product";
import type { ProductFilters } from "@/store/productsSlice";

export const filterProducts = (products: Product[], filters: ProductFilters): Product[] => {
  return products.filter((product) => {
    // Category filter
    if (filters.categoryId !== null && product.category_id !== filters.categoryId) {
      return false;
    }

    // Stock status filter
    if (filters.stockStatus !== "all") {
      const quantity = product.quantity || 0;
      const minQuantity = product.min_quantity || 0;

      switch (filters.stockStatus) {
        case "in-stock":
          if (quantity <= minQuantity) return false;
          break;
        case "low-stock":
          if (quantity > minQuantity || quantity === 0) return false;
          break;
        case "out-of-stock":
          if (quantity > 0) return false;
          break;
      }
    }

    // Stock unit filter
    if (filters.stockUnit !== "all" && product.stock_unit !== filters.stockUnit) {
      return false;
    }

    // Active status filter
    if (filters.isActive !== null && product.is_active !== filters.isActive) {
      return false;
    }

    // Price range filter
    const sellingPrice = product.piece_selling_price || 0;
    if (filters.priceRange.min !== null && sellingPrice < filters.priceRange.min) {
      return false;
    }
    if (filters.priceRange.max !== null && sellingPrice > filters.priceRange.max) {
      return false;
    }

    // Quantity range filter
    const quantity = product.quantity || 0;
    if (filters.quantityRange.min !== null && quantity < filters.quantityRange.min) {
      return false;
    }
    if (filters.quantityRange.max !== null && quantity > filters.quantityRange.max) {
      return false;
    }

    return true;
  });
};

export const getStockStatus = (product: Product): "in-stock" | "low-stock" | "out-of-stock" => {
  const quantity = product.quantity || 0;
  const minQuantity = product.min_quantity || 0;

  if (quantity === 0) return "out-of-stock";
  if (quantity <= minQuantity) return "low-stock";
  return "in-stock";
};

export const getStockStatusColor = (status: "in-stock" | "low-stock" | "out-of-stock"): string => {
  switch (status) {
    case "in-stock":
      return "text-green-600 bg-green-50";
    case "low-stock":
      return "text-yellow-600 bg-yellow-50";
    case "out-of-stock":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export const getStockStatusText = (status: "in-stock" | "low-stock" | "out-of-stock"): string => {
  switch (status) {
    case "in-stock":
      return "In Stock";
    case "low-stock":
      return "Low Stock";
    case "out-of-stock":
      return "Out of Stock";
    default:
      return "Unknown";
  }
};
