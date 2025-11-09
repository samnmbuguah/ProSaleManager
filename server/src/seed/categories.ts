import { Category } from "../models/index.js";

export async function seedCategories() {
  const categories = [
    { name: "Shoes", description: "Footwear products" },
    { name: "Boxers", description: "Men's underwear" },
    { name: "Panties", description: "Women's underwear" },
    { name: "Bras", description: "Women's lingerie" },
    { name: "Oil", description: "Beauty and wellness products" },
    { name: "Service", description: "Service products" },
    { name: "Lingerie", description: "Women's lingerie and sleepwear" },
    { name: "Cartoon Boxers", description: "Cartoon-themed men's underwear" },
    { name: "Kids Wear", description: "Clothing for children" },
    { name: "Men's Underwear", description: "Men's underwear and undershirts" },
    { name: "Accessories", description: "Fashion accessories" }
  ];
  await Category.bulkCreate(categories, { ignoreDuplicates: true });
  console.log("✅ Categories seeded");
}
