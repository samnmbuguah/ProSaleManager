import { User, Store } from '../models/index.js';
import type { UserAttributes } from '../models/User.js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

export async function seedUsers() {
  try {
    // Clear all users before seeding to avoid double hashing
    await User.destroy({ where: {} });
    
    // Get store references
    const elteeStore = await Store.findOne({ where: { name: 'eltee' } });
    const demoStore = await Store.findOne({ where: { name: 'Demo Store' } });
    
    if (!elteeStore) throw new Error('eltee store not found');
    if (!demoStore) throw new Error('Demo Store not found');

    const baseUsers: UserAttributes[] = [
      {
        name: "System Admin",
        email: "admin@prosale.com",
        password: "prosale123", // plain text
        role: 'admin',
        is_active: true,
        store_id: elteeStore.id,
      },
      {
        name: "Sales Person",
        email: "sales@prosale.com",
        password: "sales123", // plain text
        role: 'sales',
        is_active: true,
        store_id: elteeStore.id,
      },
      {
        name: "Test User",
        email: "test@prosale.com",
        password: "test123", // plain text
        role: 'admin',
        is_active: true,
        store_id: elteeStore.id,
      }
    ];

    // Generate additional random users
    for (let i = 0; i < 20; i++) {
      const roles = ['admin', 'sales', 'manager'] as const;
      const role = roles[Math.floor(Math.random() * roles.length)];
      baseUsers.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        role: role as 'admin' | 'sales' | 'manager',
        is_active: true,
        store_id: elteeStore.id,
      });
    }

    for (const user of baseUsers) {
      const existing = await User.findOne({ where: { email: user.email } });
      if (existing) {
        existing.password = user.password; // plain text, let model hook hash
        existing.name = user.name;
        existing.role = user.role ?? 'sales';
        existing.is_active = user.is_active ?? true;
        existing.store_id = user.store_id;
        existing.changed('password', true);
        await existing.save();
      } else {
        await User.create(user); // plain text, let model hook hash
      }
    }

    // Log the stored hash for the admin user
    const admin = await User.findOne({ where: { email: "admin@prosale.com" } });
    if (admin) {
      console.log("SEEDED ADMIN HASH:", admin.password);
    } else {
      console.log("Admin user not found after seeding.");
    }

    console.log("Users seeded successfully");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedUsers();
} 