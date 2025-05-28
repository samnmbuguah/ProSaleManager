import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider, useCart } from "../../contexts/CartContext";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    store,
  };
})();

Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

// Test component that uses the cart
const TestComponent = () => {
  const { cart, addToCart, removeFromCart, clearCart } = useCart();

  return (
    <div>
      <div data-testid="cart-items">{cart.items.length}</div>
      <div data-testid="cart-total">{cart.total}</div>
      <button
        data-testid="add-item"
        onClick={() =>
          addToCart({
            id: 1,
            name: "Test Product",
            product_code: "TEST001",
            selling_price: "10",
            stock_unit: "piece",
            quantity: 100,
            buying_price: "5",
            available_units: 100,
          })
        }
      >
        Add Item
      </button>
      <button data-testid="remove-item" onClick={() => removeFromCart(1)}>
        Remove Item
      </button>
      <button data-testid="clear-cart" onClick={() => clearCart()}>
        Clear Cart
      </button>
    </div>
  );
};

describe("CartContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("should initialize with empty cart", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    expect(screen.getByTestId("cart-items")).toHaveTextContent("0");
    expect(screen.getByTestId("cart-total")).toHaveTextContent("0");
  });

  it("should add items to cart", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    fireEvent.click(screen.getByTestId("add-item"));

    expect(screen.getByTestId("cart-items")).toHaveTextContent("1");
    expect(screen.getByTestId("cart-total")).toHaveTextContent("10");
  });

  it("should remove items from cart", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    // Add an item
    fireEvent.click(screen.getByTestId("add-item"));
    expect(screen.getByTestId("cart-items")).toHaveTextContent("1");

    // Remove the item
    fireEvent.click(screen.getByTestId("remove-item"));
    expect(screen.getByTestId("cart-items")).toHaveTextContent("0");
  });

  it("should clear the cart", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    // Add items
    fireEvent.click(screen.getByTestId("add-item"));
    fireEvent.click(screen.getByTestId("add-item"));
    expect(screen.getByTestId("cart-items")).toHaveTextContent("2");

    // Clear the cart
    fireEvent.click(screen.getByTestId("clear-cart"));
    expect(screen.getByTestId("cart-items")).toHaveTextContent("0");
  });

  it("should save cart to localStorage", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    // Add an item
    fireEvent.click(screen.getByTestId("add-item"));

    // Check localStorage was called
    expect(localStorage.setItem).toHaveBeenCalled();

    const savedCartStr = mockLocalStorage.getItem("pos_cart_v2");
    expect(savedCartStr).not.toBeNull();

    if (savedCartStr) {
      const savedCart = JSON.parse(savedCartStr);
      expect(savedCart.items.length).toBe(1);
      expect(savedCart.total).toBe(10);
    }
  });

  it("should load cart from localStorage on mount", () => {
    // Setup localStorage with a cart
    const mockCart = {
      items: [
        {
          id: 1,
          product: {
            id: 1,
            name: "Test Product",
            product_code: "TEST001",
            selling_price: "10",
            buying_price: "5",
            quantity: 100,
            available_units: 100,
            stock_unit: "piece",
          },
          quantity: 2,
          unit_price: 10,
          total: 20,
          unit_type: "piece",
        },
      ],
      total: 20,
    };

    localStorage.setItem("pos_cart_v2", JSON.stringify(mockCart));
    localStorage.setItem("pos_cart_v2_timestamp", Date.now().toString());

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    // Check cart was loaded
    expect(screen.getByTestId("cart-items")).toHaveTextContent("1");
    expect(screen.getByTestId("cart-total")).toHaveTextContent("20");
  });

  it("should clear localStorage when clearing cart", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>,
    );

    // Add an item and verify localStorage
    fireEvent.click(screen.getByTestId("add-item"));
    expect(localStorage.setItem).toHaveBeenCalled();

    // Clear cart and verify localStorage was cleared
    fireEvent.click(screen.getByTestId("clear-cart"));
    expect(localStorage.removeItem).toHaveBeenCalledWith("pos_cart_v2");
  });
});
