import { Store, User } from '../models/index.js';

export async function seedStoresAndSuperAdmin() {
  // Create initial store
  const store = await Store.create({
    name: 'Demo Store',
    domain: 'demo.prosale.com',
    subdomain: 'demo',
  });

  // Create super admin user (store_id: null)
  await User.create({
    name: 'Super Admin',
    email: 'superadmin@prosale.com',
    password: 'superadmin123',
    role: 'super_admin',
    is_active: true,
    store_id: null,
  });

  console.log('Seeded initial store and super admin user.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedStoresAndSuperAdmin();
} 