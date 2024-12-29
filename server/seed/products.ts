import Product from '../src/models/Product.js';
import PriceUnit from '../src/models/PriceUnit.js';

export async function seedProducts() {
  try {
    // Clear existing products and price units
    await PriceUnit.destroy({ where: {} });
    await Product.destroy({ where: {} });
    console.log('Cleared existing products and price units');

    // Create products with their price units
    const products = [
      {
        name: 'Rice',
        sku: 'RICE001',
        category: 'Grains',
        stock: 100,
        min_stock: 20,
        max_stock: 200,
        reorder_point: 30,
        stock_unit: 'kg',
        buying_price: 100,
        selling_price: 120,
        image_url: '/images/products/rice.jpg'
      },
      {
        name: 'Sugar',
        sku: 'SUGAR001',
        category: 'Groceries',
        stock: 150,
        min_stock: 30,
        max_stock: 300,
        reorder_point: 40,
        stock_unit: 'kg',
        buying_price: 80,
        selling_price: 95,
        image_url: '/images/products/sugar.jpg'
      },
      {
        name: 'Cooking Oil',
        sku: 'OIL001',
        category: 'Groceries',
        stock: 80,
        min_stock: 15,
        max_stock: 150,
        reorder_point: 25,
        stock_unit: 'L',
        buying_price: 200,
        selling_price: 240,
        image_url: '/images/products/cooking-oil.jpg'
      },
      {
        name: 'Maize Flour',
        sku: 'FLOUR001',
        category: 'Grains',
        stock: 120,
        min_stock: 25,
        max_stock: 250,
        reorder_point: 35,
        stock_unit: 'kg',
        buying_price: 90,
        selling_price: 110,
        image_url: '/images/products/maize-flour.jpg'
      },
      {
        name: 'Milk',
        sku: 'MILK001',
        category: 'Dairy',
        stock: 50,
        min_stock: 10,
        max_stock: 100,
        reorder_point: 20,
        stock_unit: 'L',
        buying_price: 50,
        selling_price: 65,
        image_url: '/images/products/milk.jpg'
      },
      {
        name: 'Bread',
        sku: 'BREAD001',
        category: 'Bakery',
        stock: 30,
        min_stock: 5,
        max_stock: 50,
        reorder_point: 10,
        stock_unit: 'piece',
        buying_price: 45,
        selling_price: 55,
        image_url: '/images/products/bread.jpg'
      },
      {
        name: 'Eggs',
        sku: 'EGGS001',
        category: 'Dairy',
        stock: 200,
        min_stock: 40,
        max_stock: 400,
        reorder_point: 60,
        stock_unit: 'tray',
        buying_price: 300,
        selling_price: 360,
        image_url: '/images/products/eggs.jpg'
      },
      {
        name: 'Tea Leaves',
        sku: 'TEA001',
        category: 'Beverages',
        stock: 75,
        min_stock: 15,
        max_stock: 150,
        reorder_point: 25,
        stock_unit: 'kg',
        buying_price: 400,
        selling_price: 480,
        image_url: '/images/products/tea.jpg'
      }
    ];

    for (const productData of products) {
      const product = await Product.create(productData);
      
      // Create price units for the product
      await PriceUnit.create({
        product_id: product.id,
        unit_type: 'per_piece',
        quantity: 1,
        buying_price: productData.buying_price,
        selling_price: productData.selling_price,
        is_default: true
      });

      // Add bulk pricing
      await PriceUnit.create({
        product_id: product.id,
        unit_type: 'bulk',
        quantity: 10,
        buying_price: productData.buying_price * 9.5, // 5% discount for bulk
        selling_price: productData.selling_price * 9.5,
        is_default: false
      });

      console.log(`Created product: ${product.name} with price units`);
    }

    console.log('Products seeded successfully');
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
}
