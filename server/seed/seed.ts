import { seedProducts } from "./products.js";
import { seedUsers } from "./users.js";
import { seedCustomers } from "./customers.js";

async function main() {
  await seedProducts();
  await seedUsers();
  await seedCustomers();
  process.exit(0);
}

main(); 