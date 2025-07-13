import User from "../src/models/User.js";
import { faker } from '@faker-js/faker';

export async function seedUsers() {
  try {
    await User.destroy({ where: {} });
    console.log("Cleared existing users");

    const baseUsers = [
      {
        name: "System Admin",
        email: "admin@prosale.com",
        password: "prosale123",
        role: "admin",
        is_active: true
      },
      {
        name: "Sales Person",
        email: "sales@prosale.com",
        password: "sales123",
        role: "sales",
        is_active: true
      },
      {
        name: "Test User",
        email: "test@prosale.com",
        password: "test123",
        role: "admin",
        is_active: true
      }
    ];

    // Generate additional random users
    for (let i = 0; i < 20; i++) {
      baseUsers.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(8),
        role: Math.random() > 0.5 ? 'admin' : 'sales',
        is_active: true
      });
    }

    await User.bulkCreate(baseUsers);

    console.log("Users seeded successfully");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
} 