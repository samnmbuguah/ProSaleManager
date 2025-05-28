describe("Cart with Delivery Service", () => {
  // Sample data
  const deliveryService = {
    id: 100,
    name: "Delivery Service",
    product_code: "SRV001",
    category: "Services",
    stock_unit: "service",
    quantity: 1000,
    min_stock: 1000,
    buying_price: 0,
    selling_price: 200,
  };

  const regularProduct = {
    id: 1,
    name: "Regular Product",
    product_code: "REG001",
    category: "Electronics",
    stock_unit: "piece",
    quantity: 50,
    min_stock: 10,
    buying_price: 100,
    selling_price: 150,
  };

  // Test cart functionality
  it("should prevent adding multiple delivery services to cart", () => {
    const cart = { items: [], total: 0 };

    // Add delivery service
    const updatedCart1 = addToCart(cart, deliveryService);
    expect(updatedCart1.items.length).toBe(1);
    expect(updatedCart1.items[0].product.product_code).toBe("SRV001");
    expect(updatedCart1.total).toBe(200);

    // Try to add delivery service again
    const updatedCart2 = addToCart(updatedCart1, deliveryService);
    // Should not add again
    expect(updatedCart2.items.length).toBe(1);
    expect(updatedCart2.total).toBe(200);

    // Add regular product
    const updatedCart3 = addToCart(updatedCart2, regularProduct);
    expect(updatedCart3.items.length).toBe(2);
    expect(updatedCart3.total).toBe(350);
  });

  it("should allow removing the delivery service", () => {
    // Start with a cart with both products
    const initialCart = {
      items: [
        {
          id: 1,
          product: deliveryService,
          quantity: 1,
          unit_price: 200,
          total: 200,
          unit_type: "service",
        },
        {
          id: 2,
          product: regularProduct,
          quantity: 1,
          unit_price: 150,
          total: 150,
          unit_type: "piece",
        },
      ],
      total: 350,
    };

    // Remove delivery service
    const updatedCart = removeFromCart(initialCart, 1);
    expect(updatedCart.items.length).toBe(1);
    expect(updatedCart.items[0].product.product_code).toBe("REG001");
    expect(updatedCart.total).toBe(150);
  });

  // Helper functions to mimic cart functionality
  function addToCart(cart, product) {
    const isDeliveryService = product.product_code === "SRV001";

    // Check if delivery service already exists in cart
    if (isDeliveryService) {
      const existingDeliveryIndex = cart.items.findIndex(
        (item) => item.product.product_code === "SRV001",
      );

      if (existingDeliveryIndex >= 0) {
        // Don't add again if already in cart
        return cart;
      }
    }

    // Add to cart
    const newItem = {
      id: cart.items.length + 1,
      product,
      quantity: 1,
      unit_price: product.selling_price,
      total: product.selling_price,
      unit_type: product.stock_unit,
    };

    const newCart = {
      items: [...cart.items, newItem],
      total: cart.total + newItem.total,
    };

    return newCart;
  }

  function removeFromCart(cart, itemId) {
    const itemToRemove = cart.items.find((item) => item.id === itemId);
    if (!itemToRemove) return cart;

    const newCart = {
      items: cart.items.filter((item) => item.id !== itemId),
      total: cart.total - itemToRemove.total,
    };

    return newCart;
  }
});
