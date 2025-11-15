import { Product, Category, Store } from "../models/index.js";
import { ProductInput, ProductAttributes } from "./products/product-types.js";
import { PRODUCTS, PACK_DISCOUNT, DOZEN_DISCOUNT } from "./products/product-data.js";
import { fetchPexelsImages } from "./products/product-utils.js";

interface ProductData {
  name: string;
  piecePrice: number;
  dozenPrice: number;
  category: string;
  isPack?: boolean;
  packSize?: number;
  sku?: string;
  quantity?: number;
  unitType?: 'piece' | 'pack';
  description?: string;
  barcode?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Define a type for the product creation data that matches the database model
type ProductCreationData = Omit<ProductAttributes, 'id' | 'createdAt' | 'updatedAt'> & {
  barcode?: string;
  created_at: Date;
  updated_at: Date;
  is_active?: boolean;
  image_urls?: string[];
  images?: string[];
  image_url?: string | null;
  store_id: number;
  unit_type: string;
  pack_size: number | null;
  piece_buying_price: number;
  piece_selling_price: number;
  pack_buying_price: number;
  pack_selling_price: number;
  dozen_buying_price: number;
  dozen_selling_price: number;
  min_quantity: number;
  category_id: number;
};

export function createProduct(
  product: ProductData & { sku: string; quantity: number; unitType: 'piece' | 'pack' },
  storeId: number,
  categoryMap: Map<string, number>
): ProductCreationData {
  // Map categories to valid database categories
  const categoryMapping: Record<string, string> = {
    'Handkerchiefs': 'Accessories',
    'Kids Underwear': 'Kids Wear',
    'Hotpants': 'Lingerie',
    'Bikers': 'Lingerie',
    'Boob Tops': 'Lingerie',
    'Cotton Underwear': 'Lingerie',
    'Boxers': 'Men\'s Underwear',
    'Cartoon Boxers': 'Cartoon Boxers',
    'Bras': 'Bras',
    'Accessories': 'Accessories',
    'Lingerie': 'Lingerie',
    "Men's Underwear": "Men's Underwear",
    'Kids Wear': 'Kids Wear'
  };

  const validCategory = categoryMapping[product.category] || 'Accessories';
  const categoryId = categoryMap.get(validCategory);
  
  if (!categoryId) {
    console.warn(`Category ${product.category} not found, using 'Accessories'`);
    return createProduct({ ...product, category: 'Accessories' }, storeId, categoryMap);
  }

  const packSize = product.unitType === 'pack' ? (product.packSize || 1) : 1;
  
  // Calculate prices based on unit type
  const pieceBuyingPrice = product.piecePrice;
  const pieceSellingPrice = Math.round(product.piecePrice * 1.2);
  
  // Calculate pack prices if unitType is 'pack'
  const packBuyingPrice = (product.unitType === 'pack' && product.isPack)
    ? product.piecePrice * (product.packSize || 1) * 0.95
    : product.piecePrice * 1.2;
  
  // Ensure pack_buying_price is never null
  const safePackBuyingPrice = packBuyingPrice || 0;
  const packSellingPrice = Math.round(safePackBuyingPrice * 1.2);
  
  // Calculate dozen prices
  const dozenBuyingPrice = product.dozenPrice;
  const dozenSellingPrice = Math.round(product.dozenPrice * 1.2);
  
  // Define a type that includes all the fields we need
  type ProductCreationData = Omit<ProductAttributes, 'id'> & { 
    barcode?: string; 
    created_at: Date; 
    updated_at: Date; 
  };
  
  // Create the product data object with all required fields
  const productData = {
    name: product.name,
    description: product.description || '',
    sku: product.sku,
    barcode: `BC${storeId}-${product.sku}`, // Generate barcode if not provided
    category_id: categoryId,
    piece_buying_price: Number(product.piecePrice) || 0,
    piece_selling_price: Math.round((Number(product.piecePrice) || 0) * 1.2),
    pack_buying_price: Number(safePackBuyingPrice) || 0,
    pack_selling_price: Number(packSellingPrice) || 0,
    dozen_buying_price: Number(product.dozenPrice) || 0,
    dozen_selling_price: Math.round((Number(product.dozenPrice) || 0) * 1.2),
    quantity: Number(product.quantity) || 0,
    min_quantity: 1,
    image_urls: [] as string[], // Ensure image_urls is a mutable array
    is_active: true,
    unit_type: product.unitType,
    stock_unit: product.unitType, // Required by ProductAttributes
    pack_size: product.packSize || null, // Ensure pack_size is always a number or null
    store_id: storeId,
    created_at: new Date(),
    updated_at: new Date()
  } as const;
  
  return productData;
}

export const seedProducts = async (): Promise<void> => {
  try {
    console.log("🚀 Starting product seeder...");
    
    // Get all stores
    const stores = await Store.findAll();
    if (stores.length === 0) {
      console.log("No stores found. Please seed stores first.");
      return;
    }
    
    // Get all categories
    const categories = await Category.findAll();
    const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]));
    
    // Process each store
    for (const store of stores) {
      console.log(`\n🛍️  Processing store: ${store.name}`);
      
      // Process all stores (Eltee Store, Eltee Store Nairobi, and Demo Store)
      if (store.name === 'Eltee Store' || store.name === 'Eltee Store Nairobi' || store.name === 'Demo Store') {
        console.log(`\n🛒  Removing existing products for ${store.name}...`);
        await Product.destroy({ where: { store_id: store.id } });
        console.log(`✅  Removed existing products for ${store.name}`);
        
        console.log(`\n🛒  Creating products for ${store.name}...`);
        
        // Create products in batches to avoid memory issues
        const batchSize = 25;
        
        console.log(`🛒  Creating ${PRODUCTS.length} products...`);
        
        for (let i = 0; i < PRODUCTS.length; i += batchSize) {
          const batch = PRODUCTS.slice(i, i + batchSize);
          try {
            const productsToCreate: ProductCreationData[] = [];
            
            for (const product of batch) {
              // Create a unique SKU by combining the base SKU with the index
              const baseSku = `ELT${String(i + productsToCreate.length + 1).padStart(3, '0')}`;
              const uniqueSku = `${baseSku}-${store.id}`;
              
              // Create a complete product object with all required fields
              const productWithDefaults = {
                ...product,
                sku: uniqueSku,
                quantity: 'quantity' in product ? product.quantity : 10,
                unitType: ('unitType' in product ? product.unitType : (product.isPack ? 'pack' : 'piece')) as 'piece' | 'pack',
                barcode: `BC${store.id}-${baseSku}`,
                created_at: new Date(),
                updated_at: new Date(),
                // Ensure category is set, default to 'Accessories' if not provided
                category: product.category || 'Accessories'
              };
              
              // Get a non-null category map
              const validCategoryMap = new Map<string, number>();
              categoryMap.forEach((value, key) => {
                if (value !== undefined) {
                  validCategoryMap.set(key, value);
                }
              });
              
              const productData = createProduct(
                productWithDefaults as ProductData & { 
                  sku: string; 
                  quantity: number; 
                  unitType: 'piece' | 'pack'; 
                  category: string;
                }, 
                store.id, 
                validCategoryMap
              );
              
              // For Demo Store only, try to fetch a few product images from Pexels
              if (store.name === 'Demo Store') {
                try {
                  const images = await fetchPexelsImages(product.name, 3);
                  if (images && images.length > 0) {
                    (productData as any).images = images;
                    (productData as any).image_url = images[0];
                  }
                } catch (error) {
                  console.error(`Error fetching Pexels images for product ${product.name}:`, error);
                }
              }

              productsToCreate.push(productData as ProductCreationData);
            }
            
            // Use type assertion to ensure TypeScript understands the types
            await Product.bulkCreate(productsToCreate as any, { validate: true });
            console.log(`   Created batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(PRODUCTS.length / batchSize)}`);
          } catch (error) {
            console.error(`❌ Error creating batch ${Math.floor(i / batchSize) + 1}:`, error);
            throw error;
          }
        }
        
        console.log(`✅ Created ${PRODUCTS.length} products for ${store.name}`);
      }
    }
    
    console.log("\n🎉 Product seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    throw error;
  }
};

export const seedDemoProducts = async (): Promise<void> => {
  try {
    console.log("🚀 Starting Demo Store product seeder...");

    const demoStore = await Store.findOne({ where: { name: "Demo Store" } });
    if (!demoStore) {
      console.log("Demo Store not found. Please create it first.");
      return;
    }

    const categories = await Category.findAll();
    const categoryMap = new Map(categories.map(cat => [cat.name, cat.id]));

    console.log(`\n🛍️  Processing store: ${demoStore.name}`);

    await Product.destroy({ where: { store_id: demoStore.id } });
    console.log(`✅  Removed existing products for ${demoStore.name}`);

    const batchSize = 25;
    console.log(`🛒  Creating ${PRODUCTS.length} products for Demo Store...`);

    for (let i = 0; i < PRODUCTS.length; i += batchSize) {
      const batch = PRODUCTS.slice(i, i + batchSize);
      try {
        const productsToCreate: ProductCreationData[] = [];

        for (const product of batch) {
          const baseSku = `ELT${String(i + productsToCreate.length + 1).padStart(3, "0")}`;
          const uniqueSku = `${baseSku}-${demoStore.id}`;

          const productWithDefaults = {
            ...product,
            sku: uniqueSku,
            quantity: "quantity" in product ? product.quantity : 10,
            unitType: ("unitType" in product ? product.unitType : (product.isPack ? "pack" : "piece")) as "piece" | "pack",
            barcode: `BC${demoStore.id}-${baseSku}`,
            created_at: new Date(),
            updated_at: new Date(),
            category: product.category || "Accessories",
          };

          const validCategoryMap = new Map<string, number>();
          categoryMap.forEach((value, key) => {
            if (value !== undefined) {
              validCategoryMap.set(key, value);
            }
          });

          const productData = createProduct(
            productWithDefaults as ProductData & {
              sku: string;
              quantity: number;
              unitType: "piece" | "pack";
              category: string;
            },
            demoStore.id,
            validCategoryMap,
          );

          try {
            const images = await fetchPexelsImages(product.name, 3);
            if (images && images.length > 0) {
              (productData as any).images = images;
              (productData as any).image_url = images[0];
            }
          } catch (error) {
            console.error(`Error fetching Pexels images for product ${product.name}:`, error);
          }

          productsToCreate.push(productData as ProductCreationData);
        }

        await Product.bulkCreate(productsToCreate as any, { validate: true });
        console.log(`   Created Demo batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(PRODUCTS.length / batchSize)}`);
      } catch (error) {
        console.error(`❌ Error creating Demo batch ${Math.floor(i / batchSize) + 1}:`, error);
        throw error;
      }
    }

    console.log("✅ Demo Store products seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding Demo Store products:", error);
    throw error;
  }
};

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedProducts().catch(console.error);
}
