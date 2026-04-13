import { describe, it, expect } from "vitest";
import { filterProducts, getStockStatus, getStockStatusColor, getStockStatusText } from "../productFilters";
import { Product } from "@/types/product";

const createProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 1,
  name: "Test Product",
  piece_selling_price: 100,
  piece_buying_price: 80,
  quantity: 50,
  min_quantity: 10,
  category_id: 1,
  stock_unit: "piece",
  is_active: true,
  ...overrides,
} as Product);

describe("productFilters", () => {
  describe("filterProducts", () => {
    const products = [
      createProduct({ id: 1, name: "Product A", category_id: 1, quantity: 50, min_quantity: 10, piece_selling_price: 100 }),
      createProduct({ id: 2, name: "Product B", category_id: 2, quantity: 5, min_quantity: 10, piece_selling_price: 200 }),
      createProduct({ id: 3, name: "Product C", category_id: 1, quantity: 0, min_quantity: 10, piece_selling_price: 150 }),
      createProduct({ id: 4, name: "Product D", category_id: 3, quantity: 100, min_quantity: 20, piece_selling_price: 300, stock_unit: "pack" }),
    ];

    it("should return all products when no filters applied", () => {
      const filters = {
        categoryId: null,
        stockStatus: "all" as const,
        stockUnit: "all" as const,
        isActive: null,
        priceRange: { min: null, max: null },
        quantityRange: { min: null, max: null },
      };

      const result = filterProducts(products, filters);

      expect(result).toHaveLength(4);
    });

    it("should filter by category", () => {
      const filters = {
        categoryId: 1,
        stockStatus: "all" as const,
        stockUnit: "all" as const,
        isActive: null,
        priceRange: { min: null, max: null },
        quantityRange: { min: null, max: null },
      };

      const result = filterProducts(products, filters);

      expect(result).toHaveLength(2);
      expect(result.every(p => p.category_id === 1)).toBe(true);
    });

    it("should filter by in-stock status", () => {
      const filters = {
        categoryId: null,
        stockStatus: "in-stock" as const,
        stockUnit: "all" as const,
        isActive: null,
        priceRange: { min: null, max: null },
        quantityRange: { min: null, max: null },
      };

      const result = filterProducts(products, filters);

      expect(result.every(p => p.quantity > p.min_quantity)).toBe(true);
    });

    it("should filter by low-stock status", () => {
      const filters = {
        categoryId: null,
        stockStatus: "low-stock" as const,
        stockUnit: "all" as const,
        isActive: null,
        priceRange: { min: null, max: null },
        quantityRange: { min: null, max: null },
      };

      const result = filterProducts(products, filters);

      expect(result.every(p => p.quantity > 0 && p.quantity <= p.min_quantity)).toBe(true);
    });

    it("should filter by out-of-stock status", () => {
      const filters = {
        categoryId: null,
        stockStatus: "out-of-stock" as const,
        stockUnit: "all" as const,
        isActive: null,
        priceRange: { min: null, max: null },
        quantityRange: { min: null, max: null },
      };

      const result = filterProducts(products, filters);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(0);
    });

    it("should filter by stock unit", () => {
      const filters = {
        categoryId: null,
        stockStatus: "all" as const,
        stockUnit: "pack",
        isActive: null,
        priceRange: { min: null, max: null },
        quantityRange: { min: null, max: null },
      };

      const result = filterProducts(products, filters);

      expect(result).toHaveLength(1);
      expect(result[0].stock_unit).toBe("pack");
    });

    it("should filter by active status", () => {
      const inactiveProduct = createProduct({ id: 5, is_active: false });
      const allProducts = [...products, inactiveProduct];

      const filters = {
        categoryId: null,
        stockStatus: "all" as const,
        stockUnit: "all" as const,
        isActive: true,
        priceRange: { min: null, max: null },
        quantityRange: { min: null, max: null },
      };

      const result = filterProducts(allProducts, filters);

      expect(result.every(p => p.is_active === true)).toBe(true);
    });

    it("should filter by price range", () => {
      const filters = {
        categoryId: null,
        stockStatus: "all" as const,
        stockUnit: "all" as const,
        isActive: null,
        priceRange: { min: 100, max: 200 },
        quantityRange: { min: null, max: null },
      };

      const result = filterProducts(products, filters);

      expect(result.every(p => p.piece_selling_price >= 100 && p.piece_selling_price <= 200)).toBe(true);
    });

    it("should filter by quantity range", () => {
      const filters = {
        categoryId: null,
        stockStatus: "all" as const,
        stockUnit: "all" as const,
        isActive: null,
        priceRange: { min: null, max: null },
        quantityRange: { min: 10, max: 100 },
      };

      const result = filterProducts(products, filters);

      expect(result.every(p => p.quantity >= 10 && p.quantity <= 100)).toBe(true);
    });

    it("should handle multiple filters combined", () => {
      const filters = {
        categoryId: 1,
        stockStatus: "in-stock" as const,
        stockUnit: "all" as const,
        isActive: true,
        priceRange: { min: 50, max: 200 },
        quantityRange: { min: null, max: null },
      };

      const result = filterProducts(products, filters);

      expect(result.every(p => p.category_id === 1)).toBe(true);
      expect(result.every(p => p.piece_selling_price >= 50 && p.piece_selling_price <= 200)).toBe(true);
    });
  });

  describe("getStockStatus", () => {
    it("should return in-stock when quantity > min_quantity", () => {
      const product = createProduct({ quantity: 50, min_quantity: 10 });
      expect(getStockStatus(product)).toBe("in-stock");
    });

    it("should return low-stock when quantity <= min_quantity and > 0", () => {
      const product = createProduct({ quantity: 5, min_quantity: 10 });
      expect(getStockStatus(product)).toBe("low-stock");
    });

    it("should return out-of-stock when quantity is 0", () => {
      const product = createProduct({ quantity: 0, min_quantity: 10 });
      expect(getStockStatus(product)).toBe("out-of-stock");
    });

    it("should handle missing quantity", () => {
      const product = createProduct({ quantity: undefined });
      expect(getStockStatus(product)).toBe("out-of-stock");
    });

    it("should handle missing min_quantity", () => {
      const product = createProduct({ min_quantity: undefined, quantity: 50 });
      expect(getStockStatus(product)).toBe("in-stock");
    });
  });

  describe("getStockStatusColor", () => {
    it("should return green for in-stock", () => {
      expect(getStockStatusColor("in-stock")).toBe("text-green-600 bg-green-50");
    });

    it("should return yellow for low-stock", () => {
      expect(getStockStatusColor("low-stock")).toBe("text-yellow-600 bg-yellow-50");
    });

    it("should return red for out-of-stock", () => {
      expect(getStockStatusColor("out-of-stock")).toBe("text-red-600 bg-red-50");
    });
  });

  describe("getStockStatusText", () => {
    it("should return correct text for each status", () => {
      expect(getStockStatusText("in-stock")).toBe("In Stock");
      expect(getStockStatusText("low-stock")).toBe("Low Stock");
      expect(getStockStatusText("out-of-stock")).toBe("Out of Stock");
    });
  });
});
