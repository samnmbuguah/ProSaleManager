import { Store, User } from '../models/index.js';

export async function seedStoresAndSuperAdmin() {
  // Clear all stores and users before seeding to avoid unique constraint errors
  await Store.destroy({ where: {} });
  await User.destroy({ where: { role: 'super_admin' } });

  // Create initial stores
  await Store.create({
    name: 'eltee',
    subdomain: 'eltee',
  });
  await Store.create({
    name: 'Demo Store',
    subdomain: 'demo',
  });
  await Store.create({
    name: 'Branch Store',
    subdomain: 'branch',
  });

  // Seed a global super admin user (not tied to any store)
  await User.create({
    name: 'Super Admin',
    email: 'superadmin@prosale.com',
    password: 'superadmin123', // will be hashed by model hook
    role: 'super_admin',
    is_active: true,
    store_id: null,
  });

  console.log('Seeded initial stores and super admin user.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedStoresAndSuperAdmin();
} 