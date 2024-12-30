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
        name: 'Nike Air Max',
        product_number: 'SHOE001',
        category: 'Shoes',
        stock: 50,
        min_stock: 10,
        max_stock: 100,
        reorder_point: 20,
        stock_unit: 'pair',
        buying_price: 4000,
        selling_price: 5500,
        image_url: '/images/products/nike-air-max.jpg'
      },
      {
        name: 'Adidas Ultraboost',
        product_number: 'SHOE002',
        category: 'Shoes',
        stock: 40,
        min_stock: 8,
        max_stock: 80,
        reorder_point: 15,
        stock_unit: 'pair',
        buying_price: 4500,
        selling_price: 6000,
        image_url: '/images/products/adidas-ultraboost.jpg'
      },
      {
        name: 'Calvin Klein Boxers',
        product_number: 'BOX001',
        category: 'Boxers',
        stock: 100,
        min_stock: 20,
        max_stock: 200,
        reorder_point: 30,
        stock_unit: 'piece',
        buying_price: 500,
        selling_price: 800,
        image_url: '/images/products/ck-boxers.jpg'
      },
      {
        name: 'Victoria Secret Panties',
        product_number: 'PAN001',
        category: 'Panties',
        stock: 150,
        min_stock: 30,
        max_stock: 300,
        reorder_point: 50,
        stock_unit: 'piece',
        buying_price: 300,
        selling_price: 500,
        image_url: '/images/products/vs-panties.jpg'
      },
      {
        name: 'Victoria Secret Bra',
        product_number: 'BRA001',
        category: 'Bras',
        stock: 75,
        min_stock: 15,
        max_stock: 150,
        reorder_point: 25,
        stock_unit: 'piece',
        buying_price: 1200,
        selling_price: 2000,
        image_url: '/images/products/vs-bra.jpg'
      },
      {
        name: 'Coconut Oil',
        product_number: 'OIL001',
        category: 'Oil',
        stock: 80,
        min_stock: 20,
        max_stock: 160,
        reorder_point: 30,
        stock_unit: 'bottle',
        buying_price: 200,
        selling_price: 350,
        image_url: '/images/products/coconut-oil.jpg'
      },
      {
        name: 'Olive Oil',
        product_number: 'OIL002',
        category: 'Oil',
        stock: 60,
        min_stock: 15,
        max_stock: 120,
        reorder_point: 25,
        stock_unit: 'bottle',
        buying_price: 400,
        selling_price: 650,
        image_url: '/images/products/olive-oil.jpg'
      }
    ];

    for (const productData of products) {
      const product = await Product.create(productData);
      
      // Create default price unit for the product
      await PriceUnit.create({
        product_id: product.id,
        unit_type: 'per_piece',
        quantity: 1,
        buying_price: productData.buying_price,
        selling_price: productData.selling_price,
        is_default: true
      });

      // Add bulk pricing (10% discount for bulk)
      await PriceUnit.create({
        product_id: product.id,
        unit_type: 'bulk',
        quantity: 10,
        buying_price: productData.buying_price * 9,
        selling_price: productData.selling_price * 9,
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
