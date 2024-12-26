import { Router } from 'express';
import Product from '../models/Product';
import Supplier from '../models/Supplier';
import ProductSupplier from '../models/ProductSupplier';
import PriceUnit from '../models/PriceUnit';
import { seedProducts, seedSuppliers, seedProductSuppliers } from '../../seed/products';

const router = Router();

router.post('/seed', async (req, res) => {
  try {
    // Clear existing data
    await ProductSupplier.destroy({ where: {} });
    await PriceUnit.destroy({ where: {} });
    await Product.destroy({ where: {} });
    await Supplier.destroy({ where: {} });

    console.log('Starting demo data seeding...');

    // Create suppliers first
    const suppliers = await Promise.all(
      seedSuppliers.map(async (supplierData) => {
        const supplier = await Supplier.create(supplierData);
        return supplier;
      })
    );

    // Create products with price units
    const products = await Promise.all(
      seedProducts.map(async (productData) => {
        // Create the product
        const product = await Product.create({
          name: productData.name,
          sku: productData.sku,
          category: productData.category,
          stock: productData.stock,
          min_stock: productData.min_stock,
          max_stock: productData.max_stock,
          reorder_point: productData.reorder_point,
          stock_unit: productData.stock_unit,
        });

        // Create price units for the product
        const priceUnits = [
          {
            product_id: product.id,
            unit_type: 'per_piece',
            quantity: 1,
            buying_price: productData.buying_price,
            selling_price: productData.selling_price,
            is_default: true
          },
          {
            product_id: product.id,
            unit_type: 'three_piece',
            quantity: 3,
            buying_price: (Number(productData.buying_price) * 3 * 0.95).toString(), // 5% discount
            selling_price: (Number(productData.selling_price) * 3 * 0.95).toString(),
            is_default: false
          },
          {
            product_id: product.id,
            unit_type: 'dozen',
            quantity: 12,
            buying_price: (Number(productData.buying_price) * 12 * 0.9).toString(), // 10% discount
            selling_price: (Number(productData.selling_price) * 12 * 0.9).toString(),
            is_default: false
          }
        ];

        await PriceUnit.bulkCreate(priceUnits);
        return product;
      })
    );

    // Create product-supplier relationships
    await Promise.all(
      seedProductSuppliers.map(async (psData) => {
        const product = await Product.findOne({
          where: { sku: psData.product_sku },
        });
        const supplier = await Supplier.findOne({
          where: { email: psData.supplier_email },
        });

        if (product && supplier) {
          await ProductSupplier.create({
            product_id: product.id,
            supplier_id: supplier.id,
            cost_price: psData.cost_price,
            is_preferred: psData.is_preferred,
          });
        }
      })
    );

    // Fetch all data with associations
    const productsWithData = await Product.findAll({
      include: [
        {
          model: PriceUnit,
          as: 'price_units',
        },
        {
          model: Supplier,
          through: ProductSupplier,
        }
      ]
    });

    res.json({
      message: 'Database seeded successfully',
      data: {
        products: productsWithData,
        suppliers: await Supplier.findAll(),
      },
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({
      message: 'Error seeding database',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router; 