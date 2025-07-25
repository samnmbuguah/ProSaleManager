import { Product, Category, Store } from "../models/index.js";
import type { ProductAttributes } from "../models/Product.js";
import fetch from "node-fetch";

const PACK_DISCOUNT = 0.95; // 5% discount for pack
const DOZEN_DISCOUNT = 0.9; // 10% discount for dozen

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_API_URL = "https://api.pexels.com/v1/search";

async function fetchPexelsImages(query: string, perPage = 3): Promise<string[]> {
  const res = await fetch(
    `${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    {
      headers: {
        Authorization: PEXELS_API_KEY!,
      },
    },
  );
  if (!res.ok) throw new Error(`Pexels API error: ${res.statusText}`);
  const data = await res.json();
  return data.photos.map((photo: any) => photo.src.large);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

export const seedProducts = async (): Promise<void> => {
  try {
    console.log("\ud83d\ude80 Starting advanced product seeder...");

    const stores = await Store.findAll();
    if (!stores.length) throw new Error("No stores found");

    // Clear existing data
    console.log("\ud83d\uddd1\ufe0f  Clearing existing products and categories...");
    await Product.destroy({ where: {} });
    await Category.destroy({ where: {} });
    console.log("\u2705 Existing data cleared");

    // Create categories and ensure IDs are returned
    console.log("\ud83d\udcc2 Creating categories...");
    const categories = await Category.bulkCreate(
      [
        { name: "Shoes", description: "Footwear products" },
        { name: "Boxers", description: "Men's underwear" },
        { name: "Panties", description: "Women's underwear" },
        { name: "Bras", description: "Women's lingerie" },
        { name: "Oil", description: "Beauty and wellness products" },
        { name: "Service", description: "Service products" },
      ],
      { returning: true },
    );
    console.log(`\u2705 Created ${categories.length} categories`);

    // Map category names to IDs for easy lookup
    const categoryMap = new Map<string, number>();
    categories.forEach((cat) => {
      if (typeof cat.id === "number") {
        categoryMap.set(String(cat.name), cat.id);
      }
    });

    for (const store of stores) {
      const storeId = store.id;
      // Define base products (now with explicit prices)
      const baseProducts: ProductAttributes[] = [
        {
          name: "Nike Air Max",
          description: "Comfortable everyday sneakers",
          sku: "SHOE001",
          category_id: categoryMap.get("Shoes") ?? 1,
          piece_buying_price: 1350.0,
          piece_selling_price: 1800.0,
          pack_buying_price: 1350.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 1800.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 1350.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 1800.0 * 12 * DOZEN_DISCOUNT,
          quantity: 20,
          min_quantity: 5,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
        {
          name: "Adidas Ultraboost",
          description: "Premium running shoes",
          sku: "SHOE002",
          category_id: categoryMap.get("Shoes") ?? 1,
          piece_buying_price: 1500.0,
          piece_selling_price: 2000.0,
          pack_buying_price: 1500.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 2000.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 1500.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 2000.0 * 12 * DOZEN_DISCOUNT,
          quantity: 15,
          min_quantity: 5,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
        {
          name: "Victoria Secret Pink Panty",
          description: "Elegant lace panties",
          sku: "PAN001",
          category_id: categoryMap.get("Panties") ?? 1,
          piece_buying_price: 180.0,
          piece_selling_price: 315.0,
          pack_buying_price: 180.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 315.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 180.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 315.0 * 12 * DOZEN_DISCOUNT,
          quantity: 10,
          min_quantity: 3,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
        {
          name: "Cotton Hipster Panty",
          description: "Comfortable cotton panties",
          sku: "PAN002",
          category_id: categoryMap.get("Panties") ?? 1,
          piece_buying_price: 150.0,
          piece_selling_price: 250.0,
          pack_buying_price: 150.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 250.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 150.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 250.0 * 12 * DOZEN_DISCOUNT,
          quantity: 12,
          min_quantity: 3,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
        {
          name: "Calvin Klein Boxer Brief",
          description: "Premium cotton boxer briefs",
          sku: "BOX001",
          category_id: categoryMap.get("Boxers") ?? 1,
          piece_buying_price: 280.0,
          piece_selling_price: 450.0,
          pack_buying_price: 280.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 450.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 280.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 450.0 * 12 * DOZEN_DISCOUNT,
          quantity: 8,
          min_quantity: 2,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
        {
          name: "Nike Dri-FIT Boxer",
          description: "Sports performance boxers",
          sku: "BOX002",
          category_id: categoryMap.get("Boxers") ?? 1,
          piece_buying_price: 250.0,
          piece_selling_price: 400.0,
          pack_buying_price: 250.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 400.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 250.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 400.0 * 12 * DOZEN_DISCOUNT,
          quantity: 10,
          min_quantity: 2,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
        {
          name: "Victoria Secret Push-Up Bra",
          description: "Luxury push-up bra",
          sku: "BRA001",
          category_id: categoryMap.get("Bras") ?? 1,
          piece_buying_price: 750.0,
          piece_selling_price: 1200.0,
          pack_buying_price: 750.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 1200.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 750.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 1200.0 * 12 * DOZEN_DISCOUNT,
          quantity: 6,
          min_quantity: 2,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
        {
          name: "Sports Bra",
          description: "High-performance sports bra",
          sku: "BRA002",
          category_id: categoryMap.get("Bras") ?? 1,
          piece_buying_price: 600.0,
          piece_selling_price: 900.0,
          pack_buying_price: 600.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 900.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 600.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 900.0 * 12 * DOZEN_DISCOUNT,
          quantity: 8,
          min_quantity: 2,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
        {
          name: "Coconut Oil",
          description: "Pure organic coconut oil",
          sku: "OIL001",
          category_id: categoryMap.get("Oil") ?? 1,
          piece_buying_price: 230.0,
          piece_selling_price: 350.0,
          pack_buying_price: 230.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 350.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 230.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 350.0 * 12 * DOZEN_DISCOUNT,
          quantity: 15,
          min_quantity: 5,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
        {
          name: "Olive Oil",
          description: "Extra virgin olive oil",
          sku: "OIL002",
          category_id: categoryMap.get("Oil") ?? 1,
          piece_buying_price: 280.0,
          piece_selling_price: 400.0,
          pack_buying_price: 280.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 400.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 280.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 400.0 * 12 * DOZEN_DISCOUNT,
          quantity: 12,
          min_quantity: 5,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
        {
          name: "Delivery Service",
          description: "Product delivery service",
          sku: "SRV001",
          category_id: categoryMap.get("Service") ?? 1,
          piece_buying_price: 100.0,
          piece_selling_price: 150.0,
          pack_buying_price: 100.0 * 3 * PACK_DISCOUNT,
          pack_selling_price: 150.0 * 3 * PACK_DISCOUNT,
          dozen_buying_price: 100.0 * 12 * DOZEN_DISCOUNT,
          dozen_selling_price: 150.0 * 12 * DOZEN_DISCOUNT,
          quantity: 999999,
          min_quantity: 0,
          is_active: true,
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        },
      ];

      // Generate additional random products
      const PRODUCT_ADJECTIVES = [
        "Classic",
        "Modern",
        "Premium",
        "Eco",
        "Sport",
        "Luxury",
        "Basic",
        "Smart",
        "Pro",
        "Ultra",
      ];
      const PRODUCT_TYPES = [
        "Sneaker",
        "Panty",
        "Boxer",
        "Bra",
        "Oil",
        "Service",
        "Boot",
        "Sandal",
        "Shirt",
        "Shorts",
      ];
      const BRANDS = [
        "Nike",
        "Adidas",
        "Victoria",
        "Calvin Klein",
        "Puma",
        "Reebok",
        "Under Armour",
        "Levi's",
        "Hanes",
        "Gucci",
      ];
      const randomProducts: ProductAttributes[] = Array.from({
        length: 100,
      }).map((_, i) => {
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
          images: [],
          store_id: storeId,
          stock_unit: "piece",
        };
      });
      // Combine base and random products
      let productsToCreate: ProductAttributes[] = [
        ...baseProducts.map((baseProduct) => {
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
        ...randomProducts,
      ];
      // Final strict filter and map before bulkCreate
      productsToCreate = productsToCreate.map((p) => {
        const { category_id, ...rest } = p;
        return {
          ...rest,
          category_id: typeof category_id === "number" ? category_id : 1,
          images: p.images ?? [],
        };
      });
      productsToCreate = productsToCreate.filter((p) => typeof p.category_id === "number");

      // Limit to 25 products to avoid rate limiting
      productsToCreate = productsToCreate.slice(0, 25);

      // Fetch Pexels images for each product and update the images field
      for (const product of productsToCreate) {
        try {
          const query = product.name.split(" ")[0]; // Use first word as query (e.g., brand/type)
          product.images = await fetchPexelsImages(query, 3);
        } catch (err) {
          console.warn(`Could not fetch images for product ${product.name}:`, err);
          product.images = [];
        }
      }

      // Create all products with images
      await Product.bulkCreate(productsToCreate as ProductAttributes[], {
        returning: true,
      });

      // Log the created products to verify the saved data
      console.log(
        `\nCreated products for store ${store.name}:`,
        JSON.stringify(productsToCreate, null, 2),
      );

      console.log(`Products seeded successfully for store ${store.name}`);

      // Verify the count in database
      const finalCount = await Product.count({ where: { store_id: storeId } });
      console.log(
        `\ud83c\udf89 Advanced product seeder completed successfully for store ${store.name}!`,
      );
      console.log(`\ud83d\udcca Total products created for store: ${finalCount}`);
      console.log(`\ud83d\udccb Expected count: ${productsToCreate.length}`);

      if (finalCount !== productsToCreate.length) {
        console.warn(
          `\u26a0\ufe0f  Warning: Expected ${productsToCreate.length} products but found ${finalCount} in database for store ${store.name}`,
        );
      }
    }
  } catch (error) {
    console.error("\u274c Error seeding products:", error);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  seedProducts();
}
