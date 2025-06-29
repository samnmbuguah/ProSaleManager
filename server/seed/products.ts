import Product from "../src/models/Product.js";
import Category from "../src/models/Category.js";

export async function seedProducts() {
  try {
    await Product.destroy({ where: {} });
    console.log("Cleared existing products");

    // Fetch all categories and map by name
    const categories = await Category.findAll();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });

    const products = [
      {
        name: "Nike Air Max",
        sku: "SHOE001",
        category_id: categoryMap["Shoes"],
        piece_buying_price: 4000,
        piece_selling_price: 6000,
        pack_buying_price: 22000,
        pack_selling_price: 33000,
        dozen_buying_price: 45000,
        dozen_selling_price: 66000,
        quantity: 20,
        min_quantity: 5,
        is_active: true,
        image_url: null
      },
      {
        name: "Delivery Service",
        sku: "SRV001",
        category_id: categoryMap["Services"],
        piece_buying_price: 0,
        piece_selling_price: 200,
        pack_buying_price: 0,
        pack_selling_price: 0,
        dozen_buying_price: 0,
        dozen_selling_price: 0,
        quantity: 999999,
        min_quantity: 0,
        is_active: true,
        image_url: null
      }
    ];

    await Product.bulkCreate(products);
    console.log("Products seeded successfully");
  } catch (error) {
    console.error("Error seeding products:", error);
    throw error;
  }
} 