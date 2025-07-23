import { sequelize } from '../src/config/database.js'
import '../src/models/index.js'
import '../src/models/ReceiptSettings.js';

const syncDatabase = async () => {
  try {
    console.log('Starting database synchronization...')
    
    await sequelize.sync({ alter: true })
    
    console.log('Database synchronized successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error synchronizing database:', error)
    process.exit(1)
  }
}

syncDatabase() 