// Export all seeders
export * from './seed-products.js';
export * from './seed-suppliers.js';
export * from './seed-product-suppliers.js';

// This allows running the seeders directly with: npx tsx src/seed/index.ts
import { seedProducts } from './seed-products.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  seedProducts().catch(console.error);
}
