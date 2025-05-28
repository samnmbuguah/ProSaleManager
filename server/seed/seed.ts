import { seedProducts } from "./products.js";
import { seedUsers } from "./users.js";

async function main() {
  await seedProducts();
  await seedUsers();
  process.exit(0);
}

main(); 