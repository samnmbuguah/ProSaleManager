import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import env from './env.js';

dotenv.config();

const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: 'postgres',
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
});

// Log database connection info
const dbConfig = new URL(env.DATABASE_URL);
console.log('\nDatabase Configuration:');
console.log('---------------------');
console.log(`Database: ${dbConfig.pathname.slice(1)}`);
console.log(`Host: ${dbConfig.hostname}`);
console.log(`Port: ${dbConfig.port}`);
console.log(`User: ${dbConfig.username}`);
console.log('---------------------\n');

export default sequelize; 