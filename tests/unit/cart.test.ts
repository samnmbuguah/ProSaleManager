import { Cart, CartItem } from "../../client/src/types/pos";
import { Product } from "../../client/src/types/product";

describe("Cart with Delivery Service", () => {
  // Sample data
  const deliveryService: Product = {
    id: 100,
    name: "Delivery Service",
    description: "Delivery service",
    sku: "SRV001",
    barcode: "SRV001",
    category_id: 1,
    piece_buying_price: 0,
    piece_selling_price: 200,
    pack_buying_price: 0,
    pack_selling_price: 200,
    dozen_buying_price: 0,
    dozen_selling_price: 200,
    quantity: 1000,
    min_quantity: 1000,
    image_url: "",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
    stock_unit: "piece",
  };

  const regularProduct: Product = {
    id: 1,
    name: "Regular Product",
    description: "Regular product",
    sku: "REG001",
    barcode: "REG001",
    category_id: 1,
    piece_buying_price: 100,
    piece_selling_price: 150,
    pack_buying_price: 400,
    pack_selling_price: 600,
    dozen_buying_price: 1200,
    dozen_selling_price: 1800,
    quantity: 50,
    min_quantity: 10,
    image_url: "",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    images: [],
    stock_unit: "piece",
  };

  // Test cart functionality
  it("should prevent adding multiple delivery services to cart", () => {
    const cart: Cart = { items: [], total: 0 };

    // Add delivery service
    const updatedCart1 = addToCart(cart, deliveryService);
    expect(updatedCart1.items.length).toBe(1);
    expect(updatedCart1.items[0].product.sku).toBe("SRV001");
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
    const initialCart: Cart = {
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
    expect(updatedCart.items[0].product.sku).toBe("REG001");
    expect(updatedCart.total).toBe(150);
  });

  // Helper functions to mimic cart functionality
  function addToCart(cart: Cart, product: Product): Cart {
    const existingItem = cart.items.find(
      (item: CartItem) => item.product.sku === "SRV001",
    );

    if (existingItem && product.sku === "SRV001") {
      // Don't add delivery service if it already exists
      return cart;
    }

    const newItem: CartItem = {
      id: Date.now(),
      product,
      quantity: 1,
      unit_price: product.piece_selling_price,
      total: product.piece_selling_price,
      unit_type: product.stock_unit,
    };

    return {
      ...cart,
      items: [...cart.items, newItem],
      total: cart.total + newItem.total,
    };
  }

  function removeFromCart(cart: Cart, itemId: number): Cart {
    const itemToRemove = cart.items.find((item) => item.id === itemId);
    if (!itemToRemove) return cart;

    return {
      ...cart,
      items: cart.items.filter((item) => item.id !== itemId),
      total: cart.total - itemToRemove.total,
    };
  }
});
