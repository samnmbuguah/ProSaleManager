import Category from "../src/models/Category.js";

export async function seedCategories() {
  try {
    await Category.destroy({ where: {} });
    console.log("Cleared existing categories");

    const categories = [
      { name: "Shoes" },
      { name: "Panties" },
      { name: "Boxers" },
      { name: "Bras" },
      { name: "Oil" },
      { name: "Services" },
      { name: "Shirts" },
      { name: "Shorts" },
      { name: "Boots" },
      { name: "Sandals" },
      { name: "Accessories" },
      { name: "Electronics" },
      { name: "Beauty" },
      { name: "Wellness" },
      { name: "Home" },
      { name: "Kids" },
      { name: "Men" },
      { name: "Women" },
    ];

    const createdCategories = await Category.bulkCreate(categories, { returning: true });
    console.log("Categories seeded successfully");
    return createdCategories;
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
} 