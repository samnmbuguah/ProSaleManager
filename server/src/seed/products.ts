import { Product, Category } from '../models/index.js';
import type { ProductAttributes } from "../models/Product.js";
import fetch from 'node-fetch';

const PACK_DISCOUNT = 0.95; // 5% discount for pack
const DOZEN_DISCOUNT = 0.90; // 10% discount for dozen

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

async function fetchPexelsImages(query: string, perPage = 3): Promise<string[]> {
  const res = await fetch(`${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=${perPage}`, {
    headers: {
      Authorization: PEXELS_API_KEY!,
    },
  });
  if (!res.ok) throw new Error(`Pexels API error: ${res.statusText}`);
  const data = await res.json();
  return data.photos.map((photo: any) => photo.src.large);
}

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomPrice(min: number, max: number): number { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }

export const seedProducts = async (): Promise<void> => {
  try {
    console.log('🚀 Starting advanced product seeder...');
    
    // Clear existing data
    console.log('🗑️  Clearing existing products and categories...');
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
    console.log('✅ Existing data cleared');

    // Create categories and ensure IDs are returned
    console.log('📂 Creating categories...');
    const categories = await Category.bulkCreate([
      { name: 'Shoes', description: 'Footwear products' },
      { name: 'Boxers', description: 'Men\'s underwear' },
      { name: 'Panties', description: 'Women\'s underwear' },
      { name: 'Bras', description: 'Women\'s lingerie' },
      { name: 'Oil', description: 'Beauty and wellness products' },
      { name: 'Service', description: 'Service products' },
    ], { returning: true });
    console.log(`✅ Created ${categories.length} categories`);

    // Map category names to IDs for easy lookup
    const categoryMap = new Map<string, number>();
    categories.forEach(cat => {
      if (typeof cat.id === 'number') {
        categoryMap.set(String(cat.name), cat.id);
      }
    });
    const now = new Date();

    // Define base products (now with explicit prices)
    const baseProducts: ProductAttributes[] = [
      {
        name: 'Nike Air Max',
        description: 'Comfortable everyday sneakers',
        sku: 'SHOE001',
        category_id: categoryMap.get('Shoes') ?? 1,
        piece_buying_price: 1350.00,
        piece_selling_price: 1800.00,
        pack_buying_price: 1350.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 1800.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 1350.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 1800.00 * 12 * DOZEN_DISCOUNT,
        quantity: 20,
        min_quantity: 5,
        is_active: true,
        image_url: '',
        images: [],
      },
      {
        name: 'Adidas Ultraboost',
        description: 'Premium running shoes',
        sku: 'SHOE002',
        category_id: categoryMap.get('Shoes') ?? 1,
        piece_buying_price: 1500.00,
        piece_selling_price: 2000.00,
        pack_buying_price: 1500.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 2000.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 1500.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 2000.00 * 12 * DOZEN_DISCOUNT,
        quantity: 15,
        min_quantity: 5,
        is_active: true,
        image_url: '',
        images: [],
      },
      {
        name: 'Victoria Secret Pink Panty',
        description: 'Elegant lace panties',
        sku: 'PAN001',
        category_id: categoryMap.get('Panties') ?? 1,
        piece_buying_price: 180.00,
        piece_selling_price: 315.00,
        pack_buying_price: 180.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 315.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 180.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 315.00 * 12 * DOZEN_DISCOUNT,
        quantity: 10,
        min_quantity: 3,
        is_active: true,
        image_url: '',
        images: [],
      },
      {
        name: 'Cotton Hipster Panty',
        description: 'Comfortable cotton panties',
        sku: 'PAN002',
        category_id: categoryMap.get('Panties') ?? 1,
        piece_buying_price: 150.00,
        piece_selling_price: 250.00,
        pack_buying_price: 150.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 250.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 150.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 250.00 * 12 * DOZEN_DISCOUNT,
        quantity: 12,
        min_quantity: 3,
        is_active: true,
        image_url: '',
        images: [],
      },
      {
        name: 'Calvin Klein Boxer Brief',
        description: 'Premium cotton boxer briefs',
        sku: 'BOX001',
        category_id: categoryMap.get('Boxers') ?? 1,
        piece_buying_price: 280.00,
        piece_selling_price: 450.00,
        pack_buying_price: 280.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 450.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 280.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 450.00 * 12 * DOZEN_DISCOUNT,
        quantity: 8,
        min_quantity: 2,
        is_active: true,
        image_url: '',
        images: [],
      },
      {
        name: 'Nike Dri-FIT Boxer',
        description: 'Sports performance boxers',
        sku: 'BOX002',
        category_id: categoryMap.get('Boxers') ?? 1,
        piece_buying_price: 250.00,
        piece_selling_price: 400.00,
        pack_buying_price: 250.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 400.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 250.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 400.00 * 12 * DOZEN_DISCOUNT,
        quantity: 10,
        min_quantity: 2,
        is_active: true,
        image_url: '',
        images: [],
      },
      {
        name: 'Victoria Secret Push-Up Bra',
        description: 'Luxury push-up bra',
        sku: 'BRA001',
        category_id: categoryMap.get('Bras') ?? 1,
        piece_buying_price: 750.00,
        piece_selling_price: 1200.00,
        pack_buying_price: 750.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 1200.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 750.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 1200.00 * 12 * DOZEN_DISCOUNT,
        quantity: 6,
        min_quantity: 2,
        is_active: true,
        image_url: '',
        images: [],
      },
      {
        name: 'Sports Bra',
        description: 'High-performance sports bra',
        sku: 'BRA002',
        category_id: categoryMap.get('Bras') ?? 1,
        piece_buying_price: 600.00,
        piece_selling_price: 900.00,
        pack_buying_price: 600.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 900.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 600.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 900.00 * 12 * DOZEN_DISCOUNT,
        quantity: 8,
        min_quantity: 2,
        is_active: true,
        image_url: '',
        images: [],
      },
      {
        name: 'Coconut Oil',
        description: 'Pure organic coconut oil',
        sku: 'OIL001',
        category_id: categoryMap.get('Oil') ?? 1,
        piece_buying_price: 230.00,
        piece_selling_price: 350.00,
        pack_buying_price: 230.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 350.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 230.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 350.00 * 12 * DOZEN_DISCOUNT,
        quantity: 15,
        min_quantity: 5,
        is_active: true,
        image_url: '',
        images: [],
      },
      {
        name: 'Olive Oil',
        description: 'Extra virgin olive oil',
        sku: 'OIL002',
        category_id: categoryMap.get('Oil') ?? 1,
        piece_buying_price: 280.00,
        piece_selling_price: 400.00,
        pack_buying_price: 280.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 400.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 280.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 400.00 * 12 * DOZEN_DISCOUNT,
        quantity: 12,
        min_quantity: 5,
        is_active: true,
        image_url: '',
        images: [],
      },
      {
        name: 'Delivery Service',
        description: 'Product delivery service',
        sku: 'SRV001',
        category_id: categoryMap.get('Service') ?? 1,
        piece_buying_price: 100.00,
        piece_selling_price: 150.00,
        pack_buying_price: 100.00 * 3 * PACK_DISCOUNT,
        pack_selling_price: 150.00 * 3 * PACK_DISCOUNT,
        dozen_buying_price: 100.00 * 12 * DOZEN_DISCOUNT,
        dozen_selling_price: 150.00 * 12 * DOZEN_DISCOUNT,
        quantity: 999999,
        min_quantity: 0,
        is_active: true,
        image_url: '',
        images: [],
      },
    ];

    // Generate additional random products
    const PRODUCT_ADJECTIVES = ['Classic', 'Modern', 'Premium', 'Eco', 'Sport', 'Luxury', 'Basic', 'Smart', 'Pro', 'Ultra'];
    const PRODUCT_TYPES = ['Sneaker', 'Panty', 'Boxer', 'Bra', 'Oil', 'Service', 'Boot', 'Sandal', 'Shirt', 'Shorts'];
    const BRANDS = ['Nike', 'Adidas', 'Victoria', 'Calvin Klein', 'Puma', 'Reebok', 'Under Armour', 'Levi\'s', 'Hanes', 'Gucci'];
    const randomProducts: ProductAttributes[] = Array.from({ length: 100 }).map((_, i) => {
      const brand = randomFrom(BRANDS);
      const type = randomFrom(PRODUCT_TYPES);
      const adj = randomFrom(PRODUCT_ADJECTIVES);
      const name = `${brand} ${adj} ${type}`;
      const sku = `${brand.slice(0, 3).toUpperCase()}${type.slice(0, 2).toUpperCase()}${i + 10}`;
      const category = randomFrom(categories);
      const piece_buying_price = randomPrice(100, 2000);
      const piece_selling_price = piece_buying_price + randomPrice(50, 500);
      const pack_buying_price = piece_buying_price * 3 * PACK_DISCOUNT;
      const pack_selling_price = piece_selling_price * 3 * PACK_DISCOUNT;
      const dozen_buying_price = piece_buying_price * 12 * DOZEN_DISCOUNT;
      const dozen_selling_price = piece_selling_price * 12 * DOZEN_DISCOUNT;
      const image_url = `https://source.unsplash.com/random/400x400?${encodeURIComponent(type)}`;
      return {
        name,
        description: `A ${adj.toLowerCase()} ${type.toLowerCase()} by ${brand}.`,
        sku,
        category_id: categoryMap.get(category.name) ?? 1,
        piece_buying_price,
        piece_selling_price,
        pack_buying_price,
        pack_selling_price,
        dozen_buying_price,
        dozen_selling_price,
        quantity: Math.floor(Math.random() * 50) + 1,
        min_quantity: Math.floor(Math.random() * 5) + 1,
        is_active: true,
        image_url,
        images: [],
      };
    });
    // Combine base and random products
    let productsToCreate: ProductAttributes[] = [
      ...baseProducts.map(baseProduct => {
        const { piece_buying_price, piece_selling_price } = baseProduct;
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
          images: baseProduct.images ?? [],
        };
      }),
      ...randomProducts
    ];
    // Final strict filter and map before bulkCreate
    productsToCreate = productsToCreate.map(p => {
      const { category_id, ...rest } = p;
      return {
        ...rest,
        category_id: typeof category_id === 'number' ? category_id : 1,
        images: p.images ?? []
      };
    });
    productsToCreate = productsToCreate.filter(p => typeof p.category_id === 'number');

    // Limit to 25 products to avoid rate limiting
    productsToCreate = productsToCreate.slice(0, 25);

    // Log the final product data being sent to create
    console.log('\nCreating products with data:', JSON.stringify(productsToCreate, null, 2));

    console.log('Seeding products: count =', productsToCreate.length, 'Sample:', productsToCreate[0]);
    // Create all products at once
    await Product.bulkCreate(productsToCreate as ProductAttributes[], { returning: true });
    
    // For each product, fetch images from Pexels
    for (const product of productsToCreate) {
      try {
        const query = product.name.split(' ')[0]; // Use first word as query (e.g., brand/type)
        product.images = await fetchPexelsImages(query, 3);
        if (!product.image_url && product.images.length > 0) {
          product.image_url = product.images[0];
        }
      } catch (err) {
        console.warn(`Could not fetch images for product ${product.name}:`, err);
        product.images = [];
      }
    }

    // Log the created products to verify the saved data
    console.log('\nCreated products:', JSON.stringify(productsToCreate, null, 2));

    console.log('Products seeded successfully');
    
    // Verify the count in database
    const finalCount = await Product.count();
    console.log(`🎉 Advanced product seeder completed successfully!`);
    console.log(`📊 Total products created: ${finalCount}`);
    console.log(`📋 Expected count: ${productsToCreate.length}`);
    
    if (finalCount !== productsToCreate.length) {
      console.warn(`⚠️  Warning: Expected ${productsToCreate.length} products but found ${finalCount} in database`);
    }
  } catch (error) {
    console.error('❌ Error seeding products:', error);
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
