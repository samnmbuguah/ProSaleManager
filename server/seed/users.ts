import User from '../src/models/User.js';
import { UserService } from '../src/services/user.service.js';

export async function seedUsers() {
  try {
    // Clear existing users
    await User.destroy({ where: {} });
    console.log('Cleared existing users');

    const userService = new UserService();

    // Create admin user
    const adminResult = await userService.create({
      name: 'System Admin',
      email: 'admin@prosale.com',
      password: 'prosale123',
      role: 'admin'
    });
    if (adminResult.success) {
      console.log('Created admin user:', adminResult.data.email);
    }

    // Create sales user
    const salesResult = await userService.create({
      name: 'Sales Person',
      email: 'sales@prosale.com',
      password: 'sales123',
      role: 'user'
    });
    if (salesResult.success) {
      console.log('Created sales user:', salesResult.data.email);
    }

    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
} 