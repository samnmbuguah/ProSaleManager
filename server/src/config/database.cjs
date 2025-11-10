require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction) {
  // MySQL configuration for production
  sequelize = new Sequelize(
    process.env.DB_NAME || process.env.MYSQL_DATABASE,
    process.env.DB_USER || process.env.MYSQL_USER,
    process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
    {
      host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10),
      dialect: 'mysql',
      logging: process.env.DB_LOGGING === 'true' ? console.log : false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
} else {
  // SQLite configuration for development
  const sqlitePath = process.env.SQLITE_PATH || path.resolve(process.cwd(), 'database.sqlite');
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqlitePath,
    logging: false,
  });
}

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
};
