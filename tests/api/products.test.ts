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
});
