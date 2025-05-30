import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartProvider, useCart } from "../contexts/CartContext";

// Test component that uses the cart to test delivery features
const DeliveryTestComponent = () => {
  const { cart, addDeliveryService } = useCart();

  // Create a delivery service product
  const deliveryService = {
    id: -1,
    name: "Delivery Service",
    product_code: "SRV001",
    description: "Delivery service fee",
    category_id: null,
    selling_price: "200",
    buying_price: "0",
    quantity: 999,
    available_units: 999,
    stock_unit: "piece",
    image_url: null,
    barcode: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div>
      <div data-testid="cart-items">{cart.items.length}</div>
      <div data-testid="cart-total">{cart.total}</div>

      <div data-testid="delivery-count">
        {
          cart.items.filter((item) => item.product.product_code === "SRV001")
            .length
        }
      </div>

      <button
        data-testid="add-delivery"
        onClick={() => addDeliveryService(deliveryService)}
      >
        Add Delivery
      </button>
    </div>
  );
};

describe("Delivery Feature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should add delivery service to cart", () => {
    render(
      <CartProvider>
        <DeliveryTestComponent />
      </CartProvider>,
    );

    // Verify cart is empty initially
    expect(screen.getByTestId("cart-items")).toHaveTextContent("0");
    expect(screen.getByTestId("delivery-count")).toHaveTextContent("0");

    // Add delivery service
    fireEvent.click(screen.getByTestId("add-delivery"));

    // Verify delivery was added
    expect(screen.getByTestId("cart-items")).toHaveTextContent("1");
    expect(screen.getByTestId("delivery-count")).toHaveTextContent("1");
    expect(screen.getByTestId("cart-total")).toHaveTextContent("200");
  });

  it("should not add duplicate delivery service", () => {
    render(
      <CartProvider>
        <DeliveryTestComponent />
      </CartProvider>,
    );

    // Add delivery service
    fireEvent.click(screen.getByTestId("add-delivery"));
    expect(screen.getByTestId("cart-items")).toHaveTextContent("1");

    // Try to add again
    fireEvent.click(screen.getByTestId("add-delivery"));

    // Verify only one delivery service was added
    expect(screen.getByTestId("cart-items")).toHaveTextContent("1");
    expect(screen.getByTestId("delivery-count")).toHaveTextContent("1");
    expect(screen.getByTestId("cart-total")).toHaveTextContent("200");
  });
});
