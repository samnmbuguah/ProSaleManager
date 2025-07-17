import { Category } from '../models/index.js';

export async function seedCategories() {
  const categories = [
    { name: 'Shoes', description: 'Footwear products' },
    { name: 'Boxers', description: "Men's underwear" },
    { name: 'Panties', description: "Women's underwear" },
    { name: 'Bras', description: "Women's lingerie" },
    { name: 'Oil', description: 'Beauty and wellness products' },
    { name: 'Service', description: 'Service products' },
  ];
  await Category.bulkCreate(categories, { ignoreDuplicates: true });
  console.log('Categories seeded');
} 