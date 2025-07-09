import request from "supertest";
import express from "express";
import { app } from '../../server/src/index';
import Product from '../../server/src/models/Product';

// This is a simplified version - in a real project you'd import your actual app
const app = express();

// Mock authentication middleware
const mockAuth = (req: any, res: any, next: any) => {
  // Simulate checking for a valid auth token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Apply mock auth middleware
app.use(mockAuth);

// Mock response for products
const mockProducts = [
  {
    id: 1,
    name: "Test Product",
    description: "A test product",
    selling_price: "100.00",
    buying_price: "80.00",
    quantity: 10,
    stock_unit: "piece",
    available_units: 10,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// Mock handler for products routes
app.get("/api/products", (req, res) => {
  res.json(mockProducts);
});

app.get("/api/pos/products", (req, res) => {
  res.json(mockProducts);
});

app.get("/api/products/search", (req, res) => {
  const query = req.query.q as string;
  const filteredProducts = mockProducts.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase()),
  );
  res.json(filteredProducts);
});

app.get("/api/pos/products/search", (req, res) => {
  const query = req.query.q as string;
  const filteredProducts = mockProducts.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase()),
  );
  res.json(filteredProducts);
});

describe("Products API", () => {
  it("GET /api/products should return all products with auth", async () => {
    const res = await request(app)
      .get("/api/products")
      .set('Authorization', 'Bearer test-token');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Test Product");
  });

  it("GET /api/products should fail without auth", async () => {
    const res = await request(app)
      .get("/api/products");

    expect(res.statusCode).toBe(401);
  });

  it("GET /api/pos/products should return all products with auth", async () => {
    const res = await request(app)
      .get("/api/pos/products")
      .set('Authorization', 'Bearer test-token');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Test Product");
  });

  it("GET /api/pos/products should fail without auth", async () => {
    const res = await request(app)
      .get("/api/pos/products");

    expect(res.statusCode).toBe(401);
  });

  it("GET /api/products/search should return filtered products with auth", async () => {
    const res = await request(app)
      .get("/api/products/search?q=test")
      .set('Authorization', 'Bearer test-token');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Test Product");
  });

  it("GET /api/pos/products/search should return filtered products with auth", async () => {
    const res = await request(app)
      .get("/api/pos/products/search?q=test")
      .set('Authorization', 'Bearer test-token');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Test Product");
  });

  it("GET /api/products/search with non-matching query should return empty array", async () => {
    const res = await request(app)
      .get("/api/products/search?q=nonexistent")
      .set('Authorization', 'Bearer test-token');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(0);
  });

  it("POST /api/products should add a product with valid auth and csrf", async () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBwcm9zYWxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1MTk3NjIzOCwiZXhwIjoxNzUyMDYyNjM4fQ.UJ23MfS1iQQbBiuDHVngjLezSc1yg57NPl9C-okQUCc";
    const csrf = "1af322f09f6c8d111a0945b0f4b658a3c08775371ad364d06f16bf159ff45f06";
    const productPayload = {
      name: "Test Product API",
      category_id: 1,
      piece_buying_price: 10,
      piece_selling_price: 15,
      pack_buying_price: 40,
      pack_selling_price: 60,
      dozen_buying_price: 120,
      dozen_selling_price: 180,
      quantity: 5,
      min_quantity: 2,
      is_active: true
    };
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${jwt}`)
      .set("x-csrf-token", csrf)
      .send(productPayload);
    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Test Product API");
  });
});
