import { Sale } from "../../../server/src/models/Sale";
import { Product } from "../../../server/src/models/Product";

describe("Report Generation", () => {
  // Mock sales data
  const mockSales = [
    {
      id: 1,
      customer_id: 1,
      total_amount: 750,
      payment_method: "cash",
      status: "paid",
      createdAt: new Date("2023-01-01T10:00:00Z"),
    },
    {
      id: 2,
      customer_id: 2,
      total_amount: 1200,
      payment_method: "mpesa",
      status: "paid",
      createdAt: new Date("2023-01-01T14:30:00Z"),
    },
    {
      id: 3,
      customer_id: 1,
      total_amount: 500,
      payment_method: "cash",
      status: "paid",
      createdAt: new Date("2023-01-02T09:15:00Z"),
    },
  ];

  // Mock product data
  const mockProducts = [
    {
      id: 1,
      name: "Product A",
      category: "Electronics",
      quantity: 20,
      selling_price: 150,
    },
    {
      id: 2,
      name: "Product B",
      category: "Food",
      quantity: 5,
      selling_price: 50,
    },
    {
      id: 3,
      name: "Product C",
      category: "Electronics",
      quantity: 8,
      selling_price: 200,
    },
  ];

  describe("Sales Reports", () => {
    it("should calculate total sales correctly", () => {
      // Function to calculate total sales
      function calculateTotalSales(sales: Sale[]): number {
        return sales.reduce(
          (total: number, sale: Sale) => total + Number(sale.total_amount),
          0,
        );
      }

      const totalSales = calculateTotalSales(mockSales);

      expect(totalSales).toBe(2450);
    });

    it("should filter sales by date range", () => {
      // Function to filter sales by date range
      function filterSalesByDateRange(
        sales: Sale[],
        startDate: Date,
        endDate: Date,
      ): Sale[] {
        return sales.filter((sale: Sale) => {
          const saleDate = new Date(sale.createdAt);
          return saleDate >= startDate && saleDate <= endDate;
        });
      }

      const startDate = new Date("2023-01-01T00:00:00Z");
      const endDate = new Date("2023-01-01T23:59:59Z");

      const filteredSales = filterSalesByDateRange(
        mockSales,
        startDate,
        endDate,
      );

      expect(filteredSales.length).toBe(2);
      expect(filteredSales[0].id).toBe(1);
      expect(filteredSales[1].id).toBe(2);
    });

    it("should group sales by payment method", () => {
      // Function to group sales by payment method
      function groupSalesByPaymentMethod(
        sales: Sale[],
      ): Record<string, number> {
        return sales.reduce((result: Record<string, number>, sale: Sale) => {
          const method = sale.payment_method;
          result[method] = (result[method] || 0) + Number(sale.total_amount);
          return result;
        }, {});
      }

      const groupedSales = groupSalesByPaymentMethod(mockSales);

      expect(Object.keys(groupedSales)).toHaveLength(2);
      expect(groupedSales.cash).toBe(1250);
      expect(groupedSales.mpesa).toBe(1200);
    });
  });

  describe("Inventory Reports", () => {
    it("should calculate total inventory value", () => {
      // Function to calculate total inventory value
      function calculateInventoryValue(products: Product[]): number {
        return products.reduce((total: number, product: Product) => {
          return total + product.quantity * product.selling_price;
        }, 0);
      }

      const inventoryValue = calculateInventoryValue(mockProducts);

      // (20 * 150) + (5 * 50) + (8 * 200) = 3000 + 250 + 1600 = 4850
      expect(inventoryValue).toBe(4850);
    });

    it("should identify low stock products", () => {
      // Set min stock threshold
      const minStockThreshold = 10;

      // Function to identify low stock products
      function findLowStockProducts(
        products: Product[],
        threshold: number,
      ): Product[] {
        return products.filter(
          (product: Product) => product.quantity < threshold,
        );
      }

      const lowStockProducts = findLowStockProducts(
        mockProducts,
        minStockThreshold,
      );

      expect(lowStockProducts).toHaveLength(2);
      expect(lowStockProducts[0].name).toBe("Product B");
      expect(lowStockProducts[1].name).toBe("Product C");
    });

    it("should group products by category", () => {
      // Function to group products by category
      function groupProductsByCategory(
        products: Product[],
      ): Record<string, Product[]> {
        return products.reduce(
          (result: Record<string, Product[]>, product: Product) => {
            const category = product.category;
            if (!result[category]) {
              result[category] = [];
            }
            result[category].push(product);
            return result;
          },
          {},
        );
      }

      const groupedProducts = groupProductsByCategory(mockProducts);

      expect(Object.keys(groupedProducts)).toHaveLength(2);
      expect(groupedProducts.Electronics).toHaveLength(2);
      expect(groupedProducts.Food).toHaveLength(1);
    });
  });

  describe("Dynamic Report Generation", () => {
    it("should generate sales summary by day", () => {
      // Function to summarize sales by date
      function summarizeSalesByDay(sales: Sale[]): Record<string, number> {
        return sales.reduce((result: Record<string, number>, sale: Sale) => {
          const date = new Date(sale.createdAt).toISOString().split("T")[0];
          result[date] = (result[date] || 0) + Number(sale.total_amount);
          return result;
        }, {});
      }

      const salesSummary = summarizeSalesByDay(mockSales);

      expect(Object.keys(salesSummary)).toHaveLength(2);
      expect(salesSummary["2023-01-01"]).toBe(1950);
      expect(salesSummary["2023-01-02"]).toBe(500);
    });
  });
});
