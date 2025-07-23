import { Customer } from '../models/index.js';

async function clearCustomers() {
  await Customer.destroy({ where: {} });
  console.log('All customers deleted.');
}

clearCustomers().then(() => process.exit(0)); 