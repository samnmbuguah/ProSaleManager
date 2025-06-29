import request from 'supertest';
import { app } from '../../index';
import Product from '../../models/Product';
import { sequelize } from '../../config/database';

describe('Products API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      await Product.create({
        product_code: 'TEST001',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        quantity: 10,
        category: 'Test Category',
        supplier: 'Test Supplier',
        buying_price: 80,
        reorder_level: 5
      });
    });

    it('should return all products', async () => {
      const response = await request(app).get('/api/products');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products')
        .query({ category: 'Test Category' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((p: any) => p.category === 'Test Category')).toBe(true);
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        product_code: 'NEW001',
        name: 'New Product',
        description: 'New Description',
        price: 150,
        quantity: 20,
        category: 'New Category',
        supplier: 'New Supplier',
        buying_price: 120,
        reorder_level: 10
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(productData.name);
    });

    it('should return 400 for invalid product data', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/products/:id', () => {
    let product: any;

    beforeEach(async () => {
      product = await Product.create({
        product_code: 'TEST001',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        quantity: 10,
        category: 'Test Category',
        supplier: 'Test Supplier',
        buying_price: 80,
        reorder_level: 5
      });
    });

    it('should update a product', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 120
      };

      const response = await request(app)
        .put(`/api/products/${product.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updateData.name);
      expect(response.body.price).toBe(updateData.price);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/api/products/999')
        .send({ name: 'Updated Product' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    let product: any;

    beforeEach(async () => {
      product = await Product.create({
        product_code: 'TEST001',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        quantity: 10,
        category: 'Test Category',
        supplier: 'Test Supplier',
        buying_price: 80,
        reorder_level: 5
      });
    });

    it('should delete a product', async () => {
      const response = await request(app)
        .delete(`/api/products/${product.id}`);

      expect(response.status).toBe(200);

      const deletedProduct = await Product.findByPk(product.id);
      expect(deletedProduct).toBeNull();
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .delete('/api/products/999');

      expect(response.status).toBe(404);
    });
  });
}); 