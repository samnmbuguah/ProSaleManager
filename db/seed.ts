import { db } from './index'
import { 
  products, 
  unitPricing, 
  users, 
  purchaseOrderItems, 
  purchaseOrders,
  productSuppliers,
  saleItems,
  sales,
  loyaltyTransactions,
  loyaltyPoints
} from './schema'
import { eq } from 'drizzle-orm'
import { hash } from 'bcrypt'

async function clearTables() {
  // First, remove default unit pricing references
  await db.update(products)
    .set({ default_unit_pricing_id: null });

  // Delete in order of dependencies
  await db.delete(loyaltyTransactions);
  await db.delete(loyaltyPoints);
  await db.delete(saleItems);
  await db.delete(sales);
  await db.delete(purchaseOrderItems);
  await db.delete(purchaseOrders);
  await db.delete(productSuppliers);
  await db.delete(unitPricing);
  await db.delete(products);
  await db.delete(users);
}

async function seedUsers() {
  const hashedPassword = await hash('password123', 10)
  return await db.insert(users).values([
    {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
    {
      email: 'cashier@example.com',
      username: 'cashier',
      password: hashedPassword,
      role: 'cashier',
    },
  ]).returning()
}

async function seedProducts() {
  // Insert products first with retail items
  // Insert initial products
  const productsToInsert = [
    {
      name: 'Classic White T-Shirt',
      sku: 'TSHIRT-001',
      buying_price: '999',
      selling_price: '1999',
      stock: 100,
      category: 'Clothing',
      min_stock: 20,
      max_stock: 200,
      reorder_point: 30,
      stock_unit: 'per_piece' as const,
    },
    {
      name: 'Leather Wallet',
      sku: 'WALLET-001',
      buying_price: '1999',
      selling_price: '2999',
      stock: 50,
      category: 'Accessories',
      min_stock: 10,
      max_stock: 100,
      reorder_point: 15,
      stock_unit: 'per_piece' as const,
    },
    {
      name: 'Running Shoes',
      sku: 'SHOES-001',
      buying_price: '5999',
      selling_price: '7999',
      stock: 75,
      category: 'Footwear',
      min_stock: 15,
      max_stock: 150,
      reorder_point: 25,
      stock_unit: 'per_piece' as const,
    },
    {
      name: 'Wireless Headphones',
      sku: 'AUDIO-001',
      buying_price: '8999',
      selling_price: '12999',
      stock: 30,
      category: 'Electronics',
      min_stock: 5,
      max_stock: 50,
      reorder_point: 10,
      stock_unit: 'per_piece' as const,
    },
  ];

  const insertedProducts = await db.insert(products).values(productsToInsert).returning();

  // Prepare unit pricing data for each product
  // Prepare unit pricing data for each product
  const unitPricingData = insertedProducts.flatMap(product => {
    const basePrice = parseFloat(product.buying_price);
    const markupMultiplier = parseFloat(product.selling_price) / basePrice;

    return [
      // Per piece pricing (default)
      {
        product_id: product.id,
        unit_type: 'per_piece',
        quantity: 1,
        buying_price: basePrice.toFixed(2),
        selling_price: (basePrice * markupMultiplier).toFixed(2),
        is_default: true,
      },
      // Three piece pricing (10% discount)
      {
        product_id: product.id,
        unit_type: 'three_piece',
        quantity: 3,
        buying_price: (basePrice * 2.7).toFixed(2),
        selling_price: (basePrice * markupMultiplier * 2.7).toFixed(2),
        is_default: false,
      },
      // Dozen pricing (15% discount)
      {
        product_id: product.id,
        unit_type: 'dozen',
        quantity: 12,
        buying_price: (basePrice * 10.2).toFixed(2),
        selling_price: (basePrice * markupMultiplier * 10.2).toFixed(2),
        is_default: false,
      }
    ];
  });

  // Insert all unit pricing records
  const unitPricings = await db.insert(unitPricing).values(unitPricingData).returning();

  // Update products with default unit pricing IDs
  for (const product of insertedProducts) {
    const defaultPricing = unitPricings.find(
      up => up.product_id === product.id && up.is_default
    );
    if (defaultPricing) {
      await db.update(products)
        .set({ default_unit_pricing_id: defaultPricing.id })
        .where(eq(products.id, product.id));
    }
  }
}

async function main() {
  console.log('🌱 Seeding database...')
  
  console.log('Clearing existing data...')
  await clearTables()
  
  console.log('Seeding users...')
  await seedUsers()
  
  console.log('Seeding products with unit pricing...')
  await seedProducts()
  
  console.log('✅ Seeding complete!')
  process.exit(0)
}

main().catch((error) => {
  console.error('❌ Seeding failed:')
  console.error(error)
  process.exit(1)
}) 