import { Customer } from '../models/index.js';

export const seedCustomers = async (): Promise<void> => {
  try {
    // Clear existing customers
    await Customer.destroy({ where: {} });

    // Create sample customers
    const customers = await Customer.bulkCreate([
      {
        name: 'Walk-in Customer',
        email: 'walkin@prosale.com',
        phone: '+254000000000',
        address: 'Walk-in customer - no address',
        is_active: true,
      },
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+254700000001',
        address: 'Nairobi, Kenya',
        is_active: true,
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+254700000002',
        address: 'Mombasa, Kenya',
        is_active: true,
      },
      {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '+254700000003',
        address: 'Kisumu, Kenya',
        is_active: true,
      },
      {
        name: 'Alice Brown',
        email: 'alice@example.com',
        phone: '+254700000004',
        address: 'Nakuru, Kenya',
        is_active: true,
      },
      {
        name: 'Charlie Wilson',
        email: 'charlie@example.com',
        phone: '+254700000005',
        address: 'Eldoret, Kenya',
        is_active: true,
      },
    ]);

    console.log('Customers seeded successfully');
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  }
}; 