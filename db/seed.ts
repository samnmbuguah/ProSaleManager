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
  // Insert products first
  const [rice, sugar, flour] = await db.insert(products).values([
    {
      name: 'Rice',
      sku: 'RIC-001',
      buying_price: '100',
      selling_price: '120',
      stock: 1000,
      category: 'Grains',
      min_stock: 100,
      max_stock: 2000,
      reorder_point: 200,
      stock_unit: 'kg',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'Sugar',
      sku: 'SUG-001',
      buying_price: '120',
      selling_price: '150',
      stock: 500,
      category: 'Groceries',
      min_stock: 50,
      max_stock: 1000,
      reorder_point: 100,
      stock_unit: 'kg',
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: 'Wheat Flour',
      sku: 'FLR-001',
      buying_price: '90',
      selling_price: '110',
      stock: 800,
      category: 'Baking',
      min_stock: 100,
      max_stock: 1500,
      reorder_point: 200,
      stock_unit: 'kg',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]).returning()

  // Insert unit pricing for each product
  const unitPricingData = [
    // Rice units
    {
      product_id: rice.id,
      unit_type: 'kg',
      quantity: 1,
      buying_price: '100',
      selling_price: '120',
      is_default: true,
    },
    {
      product_id: rice.id,
      unit_type: '25kg bag',
      quantity: 25,
      buying_price: '2400',
      selling_price: '2800',
    },
    {
      product_id: rice.id,
      unit_type: '50kg bag',
      quantity: 50,
      buying_price: '4700',
      selling_price: '5500',
    },
    // Sugar units
    {
      product_id: sugar.id,
      unit_type: 'kg',
      quantity: 1,
      buying_price: '120',
      selling_price: '150',
      is_default: true,
    },
    {
      product_id: sugar.id,
      unit_type: '2kg pack',
      quantity: 2,
      buying_price: '230',
      selling_price: '280',
    },
    {
      product_id: sugar.id,
      unit_type: '50kg bag',
      quantity: 50,
      buying_price: '5700',
      selling_price: '6800',
    },
    // Flour units
    {
      product_id: flour.id,
      unit_type: 'kg',
      quantity: 1,
      buying_price: '90',
      selling_price: '110',
      is_default: true,
    },
    {
      product_id: flour.id,
      unit_type: '2kg pack',
      quantity: 2,
      buying_price: '170',
      selling_price: '200',
    },
    {
      product_id: flour.id,
      unit_type: 'bale',
      quantity: 24,
      buying_price: '2040',
      selling_price: '2400',
    },
  ]

  const unitPricings = await db.insert(unitPricing).values(unitPricingData).returning()

  // Update products with default unit pricing IDs
  for (const product of [rice, sugar, flour]) {
    const defaultPricing = unitPricings.find(
      up => up.product_id === product.id && up.is_default
    )
    if (defaultPricing) {
      await db.update(products)
        .set({ default_unit_pricing_id: defaultPricing.id })
        .where(eq(products.id, product.id))
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