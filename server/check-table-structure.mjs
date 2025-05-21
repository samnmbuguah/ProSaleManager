import { Sequelize } from 'sequelize';

// Create a connection to the database using the configuration from config.json
const sequelize = new Sequelize('prosale', 'prosalemanager', 'prosalepassword', {
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres'
});

async function checkTableStructure() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Get the table structure
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `);
    
    console.log('Products table structure:');
    console.log(columns);
  } catch (error) {
    console.error('Error checking table structure:', error);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure(); 