const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

async function initializeDatabase() {
  try {
    const dbConfig = config.production;
    
    // Create database if it doesn't exist
    const sequelize = new Sequelize('', dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: console.log
    });
    
    console.log('Creating database if it does not exist...');
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log('Database created or already exists');
    
    // Close the connection
    await sequelize.close();
    
    // Now connect to the new database and run migrations
    const db = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: console.log,
      pool: dbConfig.pool
    });
    
    // Test the connection
    console.log('Testing database connection...');
    await db.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Close the connection
    await db.close();
    
    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDatabase();
