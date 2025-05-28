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
      function calculateTotalSales(sales) {
        return sales.reduce(
          (total, sale) => total + Number(sale.total_amount),
          0,
        );
      }

      const totalSales = calculateTotalSales(mockSales);

      expect(totalSales).toBe(2450);
    });

    it("should filter sales by date range", () => {
      // Function to filter sales by date range
      function filterSalesByDateRange(sales, startDate, endDate) {
        return sales.filter((sale) => {
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
      function groupSalesByPaymentMethod(sales) {
        return sales.reduce((result, sale) => {
          const method = sale.payment_method;
          if (!result[method]) {
            result[method] = [];
          }
          result[method].push(sale);
          return result;
        }, {});
      }

      const groupedSales = groupSalesByPaymentMethod(mockSales);

      expect(Object.keys(groupedSales)).toHaveLength(2);
      expect(groupedSales.cash).toHaveLength(2);
      expect(groupedSales.mpesa).toHaveLength(1);
    });
  });

  describe("Inventory Reports", () => {
    it("should calculate total inventory value", () => {
      // Function to calculate total inventory value
      function calculateInventoryValue(products) {
        return products.reduce((total, product) => {
          return (
            total + Number(product.quantity) * Number(product.selling_price)
          );
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
      function findLowStockProducts(products, threshold) {
        return products.filter((product) => product.quantity < threshold);
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
      function groupProductsByCategory(products) {
        return products.reduce((result, product) => {
          const category = product.category;
          if (!result[category]) {
            result[category] = [];
          }
          result[category].push(product);
          return result;
        }, {});
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
      function summarizeSalesByDay(sales) {
        return sales.reduce((result, sale) => {
          const date = new Date(sale.createdAt).toISOString().split("T")[0];
          if (!result[date]) {
            result[date] = {
              count: 0,
              total: 0,
            };
          }
          result[date].count += 1;
          result[date].total += Number(sale.total_amount);
          return result;
        }, {});
      }

      const salesSummary = summarizeSalesByDay(mockSales);

      expect(Object.keys(salesSummary)).toHaveLength(2);
      expect(salesSummary["2023-01-01"].count).toBe(2);
      expect(salesSummary["2023-01-01"].total).toBe(1950);
      expect(salesSummary["2023-01-02"].count).toBe(1);
      expect(salesSummary["2023-01-02"].total).toBe(500);
    });
  });
});
