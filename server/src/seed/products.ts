import { Product, Category } from '../models/index.js';

const PACK_DISCOUNT = 0.95; // 5% discount for pack
const DOZEN_DISCOUNT = 0.90; // 10% discount for dozen

export const seedProducts = async (): Promise<void> => {
  try {
    // Clear existing data
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });

    // Create categories and ensure IDs are returned
    const categories = await Category.bulkCreate([
      { name: 'Shoes', description: 'Footwear products' },
      { name: 'Boxers', description: 'Men\'s underwear' },
      { name: 'Panties', description: 'Women\'s underwear' },
      { name: 'Bras', description: 'Women\'s lingerie' },
      { name: 'Oil', description: 'Beauty and wellness products' },
      { name: 'Service', description: 'Service products' },
    ], { returning: true });

    const now = new Date();

    // Define base products (now with explicit prices)
    const baseProducts = [
      {
        name: 'Nike Air Max',
        description: 'Comfortable everyday sneakers',
        sku: 'SHOE001',
        category_id: categories[0].id,
        piece_buying_price: 1350.00,
        piece_selling_price: 1800.00,
        quantity: 20,
        min_quantity: 5,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Adidas Ultraboost',
        description: 'Premium running shoes',
        sku: 'SHOE002',
        category_id: categories[0].id,
        piece_buying_price: 1500.00,
        piece_selling_price: 2000.00,
        quantity: 15,
        min_quantity: 5,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Victoria Secret Pink Panty',
        description: 'Elegant lace panties',
        sku: 'PAN001',
        category_id: categories[2].id,
        piece_buying_price: 180.00,
        piece_selling_price: 315.00,
        quantity: 10,
        min_quantity: 3,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Cotton Hipster Panty',
        description: 'Comfortable cotton panties',
        sku: 'PAN002',
        category_id: categories[2].id,
        piece_buying_price: 150.00,
        piece_selling_price: 250.00,
        quantity: 12,
        min_quantity: 3,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Calvin Klein Boxer Brief',
        description: 'Premium cotton boxer briefs',
        sku: 'BOX001',
        category_id: categories[1].id,
        piece_buying_price: 280.00,
        piece_selling_price: 450.00,
        quantity: 8,
        min_quantity: 2,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Nike Dri-FIT Boxer',
        description: 'Sports performance boxers',
        sku: 'BOX002',
        category_id: categories[1].id,
        piece_buying_price: 250.00,
        piece_selling_price: 400.00,
        quantity: 10,
        min_quantity: 2,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Victoria Secret Push-Up Bra',
        description: 'Luxury push-up bra',
        sku: 'BRA001',
        category_id: categories[3].id,
        piece_buying_price: 750.00,
        piece_selling_price: 1200.00,
        quantity: 6,
        min_quantity: 2,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Sports Bra',
        description: 'High-performance sports bra',
        sku: 'BRA002',
        category_id: categories[3].id,
        piece_buying_price: 600.00,
        piece_selling_price: 900.00,
        quantity: 8,
        min_quantity: 2,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Coconut Oil',
        description: 'Pure organic coconut oil',
        sku: 'OIL001',
        category_id: categories[4].id,
        piece_buying_price: 230.00,
        piece_selling_price: 350.00,
        quantity: 15,
        min_quantity: 5,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Olive Oil',
        description: 'Extra virgin olive oil',
        sku: 'OIL002',
        category_id: categories[4].id,
        piece_buying_price: 280.00,
        piece_selling_price: 400.00,
        quantity: 12,
        min_quantity: 5,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
      {
        name: 'Delivery Service',
        description: 'Product delivery service',
        sku: 'SRV001',
        category_id: categories[5].id,
        piece_buying_price: 100.00,
        piece_selling_price: 150.00,
        quantity: 999999,
        min_quantity: 0,
        is_active: true,
        image_url: '',
        created_at: now,
        updated_at: now,
      },
    ];

    // Create products with calculated prices
    const productsToCreate = baseProducts.map(baseProduct => {
      const { piece_buying_price, piece_selling_price } = baseProduct;

      // Calculate pack and dozen prices
      const pack_buying_price = piece_buying_price * 3 * PACK_DISCOUNT;
      const pack_selling_price = piece_selling_price * 3 * PACK_DISCOUNT;
      const dozen_buying_price = piece_buying_price * 12 * DOZEN_DISCOUNT;
      const dozen_selling_price = piece_selling_price * 12 * DOZEN_DISCOUNT;

      return {
        ...baseProduct,
        pack_buying_price,
        pack_selling_price,
        dozen_buying_price,
        dozen_selling_price,
      };
    });

    // Log the final product data being sent to create
    console.log('\nCreating products with data:', JSON.stringify(productsToCreate, null, 2));

    // Create all products at once
    await Product.bulkCreate(productsToCreate, { returning: true });
    
    // Log the created products to verify the saved data
    console.log('\nCreated products:', JSON.stringify(productsToCreate, null, 2));

    console.log('Products seeded successfully');
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
};

export const seedSuppliers = [
  {
    name: "Fashion Footwear Ltd",
    email: "sales@fashionfootwear.com",
    phone: "+254700000001",
    address: "Industrial Area, Nairobi",
  },
  {
    name: "Undergarments Wholesale Co",
    email: "sales@ugwholesale.com",
    phone: "+254700000002",
    address: "Westlands, Nairobi",
  },
  {
    name: "Beauty Products Distributors",
    email: "info@beautydist.com",
    phone: "+254700000003",
    address: "Kilimani, Nairobi",
  },
  {
    name: "Sports Gear Kenya",
    email: "orders@sportsgear.co.ke",
    phone: "+254700000004",
    address: "Lavington, Nairobi",
  },
  {
    name: "Luxury Lingerie Imports",
    email: "sales@luxlingerie.com",
    phone: "+254700000005",
    address: "Karen, Nairobi",
  },
];

export const seedProductSuppliers = [
  {
    product_number: "SHOE001",
    supplier_email: "sales@fashionfootwear.com",
    cost_price: "1400",
    is_preferred: true,
  },
  {
    product_number: "BOX001",
    supplier_email: "sales@ugwholesale.com",
    cost_price: "280",
    is_preferred: true,
  },
  {
    product_number: "PAN001",
    supplier_email: "sales@ugwholesale.com",
    cost_price: "180",
    is_preferred: true,
  },
  {
    product_number: "BRA001",
    supplier_email: "sales@ugwholesale.com",
    cost_price: "750",
    is_preferred: true,
  },
  {
    product_number: "OIL001",
    supplier_email: "sales@beautydist.com",
    cost_price: "230",
    is_preferred: true,
  },
];
