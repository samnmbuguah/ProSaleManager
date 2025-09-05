import { sequelize } from "../config/database.js";
import Store from "../models/Store.js";
import Category from "../models/Category.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import bcrypt from "bcryptjs";

interface ProductData {
    name: string;
    retailPrice: number; // Price per piece
    wholesalePrice: number; // Price per dozen
    isPack?: boolean; // If true, retail price is per pack (3 pieces)
    packPrice?: number; // Price per pack if different from retail
}

const elteeProducts: ProductData[] = [
    // Adult hotpants
    { name: "Adult hotpants", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Adult hotpants", retailPrice: 200.00, wholesalePrice: 2200.00 },
    { name: "Adult hotpants", retailPrice: 250.00, wholesalePrice: 2800.00 },

    // Bikers
    { name: "Bikers", retailPrice: 200.00, wholesalePrice: 2400.00 },

    // Boob tops
    { name: "Boob tops", retailPrice: 150.00, wholesalePrice: 1800.00 },
    { name: "Boob tops cartoon", retailPrice: 120.00, wholesalePrice: 1200.00 },

    // Bras
    { name: "Bra cap A", retailPrice: 400.00, wholesalePrice: 4800.00 },
    { name: "Bra panty set", retailPrice: 550.00, wholesalePrice: 6600.00 },
    { name: "Cap B", retailPrice: 400.00, wholesalePrice: 4800.00 },
    { name: "Cap C", retailPrice: 400.00, wholesalePrice: 4800.00 },
    { name: "Cap D", retailPrice: 450.00, wholesalePrice: 5400.00 },
    { name: "Cap E", retailPrice: 500.00, wholesalePrice: 6000.00 },
    { name: "Cap F", retailPrice: 550.00, wholesalePrice: 6600.00 },

    // Cartoon boxers
    { name: "Cartoon boxers L", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Cartoon boxers M", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Cartoon boxers S", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Cartoon boxers XL", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Cartoon boxers 120", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Cartoon boxers 130", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Cartoon boxers 140", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Cartoon boxers 160", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Cartoon boxers 170", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Cartoon boxers 180", retailPrice: 150.00, wholesalePrice: 1600.00 },

    // Checked boxers (pack pricing)
    { name: "Checked boxers kids", retailPrice: 200.00, wholesalePrice: 2200.00, isPack: true, packPrice: 600.00 },
    { name: "Checked boxers men", retailPrice: 233.33, wholesalePrice: 2400.00, isPack: true, packPrice: 700.00 },

    // Cotton items
    { name: "Cotton", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Cotton big", retailPrice: 200.00, wholesalePrice: 2200.00 },
    { name: "Cotton seamless big", retailPrice: 200.00, wholesalePrice: 2200.00 },
    { name: "Cotton seamless", retailPrice: 150.00, wholesalePrice: 1600.00 },

    // High waist items
    { name: "High waist bikers", retailPrice: 500.00, wholesalePrice: 6000.00 },
    { name: "High waist lace", retailPrice: 500.00, wholesalePrice: 6000.00 },
    { name: "High waist lace", retailPrice: 200.00, wholesalePrice: 2200.00 },
    { name: "High waist seamless", retailPrice: 400.00, wholesalePrice: 4800.00 },

    // Kids 3 packs (pack pricing - 3 pieces per pack)
    { name: "Kids 3 pack 13-15", retailPrice: 150.00, wholesalePrice: 1600.00, isPack: true, packPrice: 450.00 },
    { name: "Kids 3 pack 2-3", retailPrice: 120.00, wholesalePrice: 1200.00, isPack: true, packPrice: 360.00 },
    { name: "Kids 3 pack 3-4", retailPrice: 120.00, wholesalePrice: 1200.00, isPack: true, packPrice: 360.00 },
    { name: "Kids 3 pack 5-6", retailPrice: 120.00, wholesalePrice: 1200.00, isPack: true, packPrice: 360.00 },
    { name: "Kids 3 pack 7-8", retailPrice: 120.00, wholesalePrice: 1200.00, isPack: true, packPrice: 360.00 },
    { name: "Kids 3 pack 9-10", retailPrice: 120.00, wholesalePrice: 1200.00, isPack: true, packPrice: 360.00 },
    { name: "Kids 3 packs 11-12", retailPrice: 120.00, wholesalePrice: 1200.00, isPack: true, packPrice: 360.00 },

    // Kids items
    { name: "Kids bikers", retailPrice: 200.00, wholesalePrice: 2200.00 },
    { name: "Kids hotpants 2XL", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Kids hotpants 3XL", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Kids hotpants 4XL", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Kids hotpants Dotted", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Kids hotpants L", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Kids hotpants S", retailPrice: 150.00, wholesalePrice: 1600.00 },

    // Kids plain boxers
    { name: "Kids plain boxers 2XL", retailPrice: 150.00, wholesalePrice: 1800.00 },
    { name: "Kids plain boxers 3XL", retailPrice: 150.00, wholesalePrice: 1800.00 },
    { name: "Kids plain boxers L", retailPrice: 150.00, wholesalePrice: 1800.00 },
    { name: "Kids plain boxers M", retailPrice: 150.00, wholesalePrice: 1800.00 },
    { name: "Kids plain boxers S", retailPrice: 150.00, wholesalePrice: 1800.00 },
    { name: "Kids plain boxers XL", retailPrice: 150.00, wholesalePrice: 1800.00 },

    // Lace items
    { name: "Lace", retailPrice: 150.00, wholesalePrice: 1600.00 },
    { name: "Lace big", retailPrice: 200.00, wholesalePrice: 2200.00 },

    // Men boxers
    { name: "Men boxers 2XL", retailPrice: 250.00, wholesalePrice: 2400.00 },
    { name: "Men boxers 3XL", retailPrice: 250.00, wholesalePrice: 2400.00 },
    { name: "Men boxers 4XL", retailPrice: 250.00, wholesalePrice: 2400.00 },
    { name: "Men boxers 5XL", retailPrice: 250.00, wholesalePrice: 2400.00 },
    { name: "Men boxers L", retailPrice: 250.00, wholesalePrice: 2400.00 },
    { name: "Men boxers XL", retailPrice: 250.00, wholesalePrice: 2400.00 },

    // Other items
    { name: "Mtush bras", retailPrice: 200.00, wholesalePrice: 1800.00 },
    { name: "Seamless", retailPrice: 200.00, wholesalePrice: 1600.00 },
    { name: "Seamless big", retailPrice: 200.00, wholesalePrice: 2200.00 },
    { name: "Seamless high waist", retailPrice: 450.00, wholesalePrice: 5400.00 },
    { name: "Thong", retailPrice: 150.00, wholesalePrice: 1600.00 },

    // Vests (pack pricing)
    { name: "Vests boys", retailPrice: 233.33, wholesalePrice: 2400.00, isPack: true, packPrice: 700.00 },
    { name: "Vests girls", retailPrice: 233.33, wholesalePrice: 2400.00, isPack: true, packPrice: 700.00 },
    { name: "Vests men", retailPrice: 250.00, wholesalePrice: 2400.00, isPack: true, packPrice: 750.00 },
];

async function seedElteeStore() {
    try {
        console.log("🌱 Starting Eltee Store seeder...");

        // Create Eltee Store
        const [elteeStore, created] = await Store.findOrCreate({
            where: { name: "Eltee Store" },
            defaults: {
                name: "Eltee Store",
                address: "Nairobi, Kenya",
                phone: "+254700000000",
                email: "info@elteestore.com",
                description: "Premium lingerie and undergarments store",
                is_active: true,
            },
        });

        if (created) {
            console.log("✅ Created Eltee Store");
        } else {
            console.log("ℹ️ Eltee Store already exists");
        }

        // Create main users for Eltee Store
        const users = [
            {
                name: "Eltee Admin",
                email: "eltee.admin@prosale.com",
                password: "elteeadmin123",
                role: "admin",
                store_id: elteeStore.id,
            },
            {
                name: "Eltee Manager",
                email: "eltee.manager@prosale.com",
                password: "elteemgr123",
                role: "manager",
                store_id: elteeStore.id,
            },
            {
                name: "Eltee Cashier",
                email: "eltee.cashier@prosale.com",
                password: "eltee123",
                role: "sales",
                store_id: elteeStore.id,
            },
        ];

        for (const userData of users) {
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            const [user, created] = await User.findOrCreate({
                where: { email: userData.email },
                defaults: {
                    name: userData.name,
                    email: userData.email,
                    password: hashedPassword,
                    role: userData.role as "super_admin" | "admin" | "sales" | "manager" | "client",
                    store_id: userData.store_id,
                },
            });

            if (created) {
                console.log(`✅ Created user: ${userData.name} (${userData.role})`);
            } else {
                console.log(`ℹ️ User already exists: ${userData.name}`);
            }
        }

        // Create categories
        const categories = [
            { name: "Lingerie", description: "Women's intimate apparel" },
            { name: "Men's Underwear", description: "Men's boxers and briefs" },
            { name: "Kids Wear", description: "Children's undergarments" },
            { name: "Bras", description: "Women's bras and lingerie sets" },
            { name: "Accessories", description: "Other intimate accessories" },
        ];

        const createdCategories = [];
        for (const categoryData of categories) {
            const [category, created] = await Category.findOrCreate({
                where: { name: categoryData.name },
                defaults: categoryData,
            });
            createdCategories.push(category);
            if (created) {
                console.log(`✅ Created category: ${categoryData.name}`);
            }
        }

        // Create products
        console.log("🛍️ Creating products...");
        let productCount = 0;

        for (const productData of elteeProducts) {
            // Determine category based on product name
            let categoryId: number = createdCategories[4].id!; // Default to Accessories

            if (productData.name.toLowerCase().includes('bra') ||
                productData.name.toLowerCase().includes('cap')) {
                categoryId = createdCategories[3].id!; // Bras
            } else if (productData.name.toLowerCase().includes('men') ||
                productData.name.toLowerCase().includes('boxers')) {
                categoryId = createdCategories[1].id!; // Men's Underwear
            } else if (productData.name.toLowerCase().includes('kids') ||
                productData.name.toLowerCase().includes('children')) {
                categoryId = createdCategories[2].id!; // Kids Wear
            } else if (productData.name.toLowerCase().includes('hotpants') ||
                productData.name.toLowerCase().includes('bikers') ||
                productData.name.toLowerCase().includes('thong') ||
                productData.name.toLowerCase().includes('seamless') ||
                productData.name.toLowerCase().includes('lace') ||
                productData.name.toLowerCase().includes('cotton')) {
                categoryId = createdCategories[0].id!; // Lingerie
            }

            // Calculate prices based on the pricing structure
            let pieceBuyingPrice: number;
            let pieceSellingPrice: number;
            let packBuyingPrice: number;
            let packSellingPrice: number;
            let dozenBuyingPrice: number;
            let dozenSellingPrice: number;

            if (productData.isPack && productData.packPrice) {
                // For pack items, the retail price shown is per pack (3 pieces)
                pieceSellingPrice = productData.packPrice / 3; // Divide pack price by 3
                pieceBuyingPrice = pieceSellingPrice * 0.7; // 30% margin

                packSellingPrice = productData.packPrice;
                packBuyingPrice = pieceBuyingPrice * 3;

                dozenSellingPrice = productData.wholesalePrice;
                dozenBuyingPrice = dozenSellingPrice * 0.7; // 30% margin
            } else {
                // For individual items, retail price is per piece
                pieceSellingPrice = productData.retailPrice;
                pieceBuyingPrice = pieceSellingPrice * 0.7; // 30% margin

                packSellingPrice = pieceSellingPrice * 3; // 3 pieces per pack
                packBuyingPrice = pieceBuyingPrice * 3;

                dozenSellingPrice = productData.wholesalePrice;
                dozenBuyingPrice = dozenSellingPrice * 0.7; // 30% margin
            }

            // Generate SKU
            const sku = `ELT${String(productCount + 1).padStart(3, '0')}`;

            const [product, created] = await Product.findOrCreate({
                where: {
                    name: productData.name,
                    store_id: elteeStore.id
                },
                defaults: {
                    name: productData.name,
                    description: `Premium ${productData.name.toLowerCase()} from Eltee Store`,
                    sku: sku,
                    piece_buying_price: Number(pieceBuyingPrice.toFixed(2)),
                    piece_selling_price: Number(pieceSellingPrice.toFixed(2)),
                    pack_buying_price: Number(packBuyingPrice.toFixed(2)),
                    pack_selling_price: Number(packSellingPrice.toFixed(2)),
                    dozen_buying_price: Number(dozenBuyingPrice.toFixed(2)),
                    dozen_selling_price: Number(dozenSellingPrice.toFixed(2)),
                    quantity: 10, // As requested
                    min_quantity: 2,
                    is_active: true,
                    images: [
                        "https://images.pexels.com/photos/205377/pexels-photo-205377.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
                        "https://images.pexels.com/photos/1485452/pexels-photo-1485452.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
                        "https://images.pexels.com/photos/2354225/pexels-photo-2354225.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
                    ],
                    store_id: elteeStore.id,
                    category_id: categoryId,
                    stock_unit: "piece",
                },
            });

            if (created) {
                productCount++;
                console.log(`✅ Created product: ${productData.name} (SKU: ${sku})`);
            } else {
                console.log(`ℹ️ Product already exists: ${productData.name}`);
            }
        }

        console.log(`🎉 Eltee Store seeder completed successfully!`);
        console.log(`📊 Summary:`);
        console.log(`   ✅ Store: Eltee Store`);
        console.log(`   ✅ Users: 3 (Admin, Manager, Cashier)`);
        console.log(`   ✅ Categories: ${createdCategories.length}`);
        console.log(`   ✅ Products: ${productCount} created`);
        console.log(`   ✅ All products set with quantity: 10`);

    } catch (error) {
        console.error("❌ Error seeding Eltee Store:", error);
        throw error;
    }
}

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedElteeStore()
        .then(() => {
            console.log("✅ Seeding completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("❌ Seeding failed:", error);
            process.exit(1);
        });
}

export default seedElteeStore;

