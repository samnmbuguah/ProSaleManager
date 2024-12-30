import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  database: 'prosale',
  username: 'prosalemanager',
  password: 'prosalepassword',
  host: 'localhost',
  port: 5432,
  dialect: 'postgres' as const,
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
  dialectOptions: {
    ssl: false
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: dbConfig.define,
    dialectOptions: dbConfig.dialectOptions,
    pool: dbConfig.pool,
  }
);

// Log database connection info
console.log('\nDatabase Configuration:');
console.log('---------------------');
console.log(`Database: ${dbConfig.database}`);
console.log(`Host: ${dbConfig.host}`);
console.log(`Port: ${dbConfig.port}`);
console.log(`User: ${dbConfig.username}`);
console.log('---------------------\n');

export default sequelize; 