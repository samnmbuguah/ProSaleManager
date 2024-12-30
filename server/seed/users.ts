import User from '../src/models/User.js';

export async function seedUsers() {
  try {
    await User.destroy({ where: {} });
    console.log('Cleared existing users');

    await User.create({
      name: 'System Admin',
      email: 'admin@prosale.com',
      password: 'prosale123',
      role: 'admin'
    });

    await User.create({
      name: 'Sales Person',
      email: 'sales@prosale.com',
      password: 'sales123',
      role: 'user'
    });

    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
} 