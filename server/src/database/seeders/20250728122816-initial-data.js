'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // Seed stores first
    await queryInterface.bulkInsert('stores', [
      {
        name: 'eltee',
        subdomain: 'eltee',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Demo Store',
        subdomain: 'demo',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Branch Store',
        subdomain: 'branch',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Get the store IDs that were just created
    const stores = await queryInterface.sequelize.query(
      'SELECT id, subdomain FROM stores WHERE subdomain IN (?, ?, ?)',
      {
        replacements: ['eltee', 'demo', 'branch'],
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const storeMap = {};
    stores.forEach(store => {
      storeMap[store.subdomain] = store.id;
    });

    // Seed categories
    await queryInterface.bulkInsert('categories', [
      {
        name: 'Shoes',
        description: 'Footwear products',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Boxers',
        description: "Men's underwear",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Panties',
        description: "Women's underwear",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Bras',
        description: "Women's lingerie",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Oil',
        description: 'Beauty and wellness products',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Service',
        description: 'Service products',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Seed users after stores are created
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('superadmin123', salt);
    const adminPassword = await bcrypt.hash('admin123', salt);
    
    await queryInterface.bulkInsert('users', [
      {
        name: 'Super Admin',
        email: 'superadmin@prosale.com',
        password: hashedPassword,
        role: 'super_admin',
        is_active: true,
        store_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Admin User',
        email: 'admin@prosale.com',
        password: adminPassword,
        role: 'admin',
        is_active: true,
        store_id: storeMap['eltee'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Demo Admin',
        email: 'demo@prosale.com',
        password: adminPassword,
        role: 'admin',
        is_active: true,
        store_id: storeMap['demo'],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Branch Admin',
        email: 'branch@prosale.com',
        password: adminPassword,
        role: 'admin',
        is_active: true,
        store_id: storeMap['branch'],
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log('Initial data seeded successfully!');
  },

  async down (queryInterface, Sequelize) {
    // Remove seeded data in reverse order
    await queryInterface.bulkDelete('users', { role: { [Sequelize.Op.in]: ['admin', 'super_admin'] } }, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('stores', null, {});
  }
};
