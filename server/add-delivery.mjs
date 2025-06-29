import { Sequelize } from 'sequelize';

// Create a connection to the database using the configuration from config.json
const sequelize = new Sequelize('prosaledatabase', 'prosalemanager', 'prosalepassword', {
  host: '127.0.0.1',
  port: 5432,
  dialect: 'postgres'
});

async function addDeliveryProduct() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // First check if the product already exists
    const [existingProducts] = await sequelize.query(
      "SELECT * FROM products WHERE product_code = 'SRV001'"
    );
    
    if (existingProducts.length > 0) {
      console.log('Delivery product already exists:');
      console.log(JSON.stringify(existingProducts[0], null, 2));
      return;
    }

    // Insert the delivery service product with the correct columns
    const [result] = await sequelize.query(`
      INSERT INTO products (
        name, 
        product_code, 
        category,
        buying_price, 
        selling_price, 
        quantity, 
        available_units, 
        stock_unit,
        min_stock,
        image_url,
        created_at, 
        updated_at
      ) VALUES (
        'Delivery Service', 
        'SRV001', 
        'Services',
        0, 
        200, 
        999, 
        999, 
        'piece',
        0,
        NULL,
        NOW(), 
        NOW()
      ) RETURNING *;
    `);

    console.log('Delivery product added successfully:');
    console.log(JSON.stringify(result[0], null, 2));
  } catch (error) {
    console.error('Error adding delivery product:', error);
  } finally {
    await sequelize.close();
  }
}

addDeliveryProduct(); 