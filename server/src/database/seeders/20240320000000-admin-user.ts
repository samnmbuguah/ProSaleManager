import { QueryInterface } from 'sequelize';
import bcrypt from 'bcryptjs';

export async function up(queryInterface: QueryInterface) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  await queryInterface.bulkInsert('users', [{
    email: 'admin@prosale.com',
    password: hashedPassword,
    name: 'Admin User',
    role: 'admin',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date()
  }]);
}

export async function down(queryInterface: QueryInterface) {
  await queryInterface.bulkDelete('users', { email: 'admin@prosale.com' });
} 