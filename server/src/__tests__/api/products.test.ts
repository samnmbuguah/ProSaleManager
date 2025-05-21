import request from 'supertest';
import express from 'express';

// This is a simplified version - in a real project you'd import your actual app
const app = express();

// Mock response for products
const mockProducts = [
  { 
    id: 1, 
    name: 'Test Product', 
    description: 'A test product',
    selling_price: '100.00',
    buying_price: '80.00',
    quantity: 10, 
    stock_unit: 'piece',
    available_units: 10,
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Mock handler for products route
app.get('/api/products', (req, res) => {
  res.json(mockProducts);
});

app.get('/api/products/search', (req, res) => {
  const query = req.query.q as string;
  const filteredProducts = mockProducts.filter(
    product => product.name.toLowerCase().includes(query.toLowerCase())
  );
  res.json(filteredProducts);
});

describe('Products API', () => {
  it('GET /api/products should return all products', async () => {
    const res = await request(app).get('/api/products');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Test Product');
  });
  
  it('GET /api/products/search should return filtered products', async () => {
    const res = await request(app).get('/api/products/search?q=test');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Test Product');
  });
  
  it('GET /api/products/search with non-matching query should return empty array', async () => {
    const res = await request(app).get('/api/products/search?q=nonexistent');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(0);
  });
}); 