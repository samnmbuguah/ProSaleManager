import { sequelize } from '../src/config/database.js'

// Import advanced seed functions for products and customers
import { seedProducts } from '../src/seed/products.js'
import { seedCustomers } from '../src/seed/customers.js'
// Import standard seeders for the rest
import { seedUsers } from '../seed/users.js'
import { seedCategories } from '../seed/categories.js'
import { seedSuppliers } from '../seed/suppliers.js'

const seedAll = async () => {
  try {
    console.log('Starting database seeding...')

    // Sync database
    await sequelize.sync({ force: true })
    console.log('Database synced successfully')

    // Seed data in order
    await seedUsers()
    await seedCategories()
    await seedProducts()
    await seedCustomers()
    await seedSuppliers()

    console.log('All data seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

const undoAll = async () => {
  try {
    console.log('Starting database cleanup...')

    // Drop all tables
    await sequelize.drop()
    console.log('All tables dropped successfully')

    console.log('Database cleanup completed!')
    process.exit(0)
  } catch (error) {
    console.error('Error cleaning database:', error)
    process.exit(1)
  }
}

const resetAll = async () => {
  try {
    console.log('Starting database reset...')

    // Drop all tables
    await sequelize.drop()
    console.log('All tables dropped successfully')

    // Sync database
    await sequelize.sync({ force: true })
    console.log('Database synced successfully')

    // Seed data in order
    await seedUsers()
    await seedCategories()
    await seedProducts()
    await seedCustomers()
    await seedSuppliers()

    console.log('Database reset completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error resetting database:', error)
    process.exit(1)
  }
}

const showTables = async () => {
  try {
    const [results] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    console.log('Available tables:')
    ;(results as Array<Record<string, unknown>>).forEach((row: Record<string, unknown>) => {
      console.log(`- ${row.table_name}`)
    })
    process.exit(0)
  } catch (error) {
    console.error('Error showing tables:', error)
    process.exit(1)
  }
}

// Get command from command line arguments
const command = process.argv[2]

switch (command) {
  case 'seed':
    seedAll()
    break
  case 'undo':
    undoAll()
    break
  case 'reset':
    resetAll()
    break
  case 'tables':
    showTables()
    break
  default:
    console.log('Available commands:')
    console.log('  npm run seed:all     - Seed all data')
    console.log('  npm run seed:undo:all - Remove all data')
    console.log('  npm run seed:reset:all - Reset and reseed all data')
    console.log('  npm run seed:tables  - Show all tables')
    process.exit(0)
} 