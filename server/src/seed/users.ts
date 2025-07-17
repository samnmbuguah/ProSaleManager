import { User } from '../models/index.js';
import type { UserAttributes } from '../models/User.js';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

export async function seedUsers() {
  try {
    const baseUsers: UserAttributes[] = [
      {
        name: "System Admin",
        email: "admin@prosale.com",
        password: await bcrypt.hash("prosale123", 10),
        role: 'admin',
        is_active: true
      },
      {
        name: "Sales Person",
        email: "sales@prosale.com",
        password: await bcrypt.hash("sales123", 10),
        role: 'sales',
        is_active: true
      },
      {
        name: "Test User",
        email: "test@prosale.com",
        password: await bcrypt.hash("test123", 10),
        role: 'admin',
        is_active: true
      }
    ];

    // Generate additional random users
    for (let i = 0; i < 20; i++) {
      const roles = ['admin', 'sales', 'manager'] as const;
      const role = roles[Math.floor(Math.random() * roles.length)];
      baseUsers.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: await bcrypt.hash(faker.internet.password(), 10),
        role: role as 'admin' | 'sales' | 'manager',
        is_active: true
      });
    }

    for (const user of baseUsers) {
      const existing = await User.findOne({ where: { email: user.email } });
      if (existing) {
        // Update password and other fields if user exists
        existing.password = user.password;
        existing.name = user.name;
        existing.role = user.role ?? 'sales';
        existing.is_active = user.is_active ?? true;
        existing.changed('password', true);
        await existing.save();
      } else {
        await User.create(user);
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