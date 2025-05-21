import { jest } from '@jest/globals';

// Mock the models and database
jest.mock('./src/config/database.js');
jest.mock('./src/models/Sale.js');
jest.mock('./src/models/SaleItem.js');

// Mock authentication middleware
jest.mock('./src/middleware/auth.middleware.js', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1 };
    next();
  }
}));

// Mock other models
jest.mock('./src/models/User.js', () => ({}));
jest.mock('./src/models/Customer.js', () => ({}));
jest.mock('./src/models/Product.js', () => ({})); 