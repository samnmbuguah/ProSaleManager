import { Store, User } from '../models/index.js';
import bcrypt from 'bcryptjs';

export async function seedStoresAndSuperAdmin() {
  // Clear all stores before seeding to avoid unique constraint errors
  await Store.destroy({ where: {} });

  // Create initial stores
  await Store.upsert({
    name: 'eltee',
    domain: 'eltee.prosale.com',
    subdomain: 'eltee',
  });
  await Store.upsert({
    name: 'Demo Store',
    domain: 'demo.prosale.com',
    subdomain: 'demo',
  });

  // Do not seed super admin user here; let the test register it

  console.log('Seeded initial store and super admin user.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedStoresAndSuperAdmin();
} 