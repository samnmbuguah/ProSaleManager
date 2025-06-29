import { Sequelize } from 'sequelize';

// Create a connection to the database using the configuration from config.json
const sequelize = new Sequelize('prosaledatabase', 'prosalemanager', 'prosalepassword', {
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres'
});

async function checkDeliveryProduct() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const [results] = await sequelize.query(
      "SELECT * FROM products WHERE product_code = 'SRV001'"
    );
    
    if (results.length === 0) {
      console.log('Delivery product (SRV001) does NOT exist in the database');
    } else {
      console.log('Delivery product found:');
      console.log(JSON.stringify(results[0], null, 2));
    }
  } catch (error) {
    console.error('Error checking for delivery product:', error);
  } finally {
    await sequelize.close();
  }
}

checkDeliveryProduct(); 