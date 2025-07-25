interface Product {
  id: number;
  product_code: string;
  name: string;
  price: number;
}

interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

interface Cart {
  items: CartItem[];
}

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
  function addToCart(cart: Cart, product: Product): Cart {
    const existingItem = cart.items.find(
      (item: CartItem) => item.product.product_code === "SRV001",
    );

    if (existingItem) {
      return {
        ...cart,
        items: cart.items.map((item: CartItem) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      };
    }

    return {
      ...cart,
      items: [
        ...cart.items,
        {
          id: Date.now(),
          product,
          quantity: 1,
        },
      ],
    };
  }

  function removeFromCart(cart: Cart, itemId: number): Cart {
    const itemToRemove = cart.items.find(
      (item: CartItem) => item.id === itemId,
    );
    if (!itemToRemove) return cart;

    return {
      ...cart,
      items: cart.items.filter((item: CartItem) => item.id !== itemId),
    };
  }
});
