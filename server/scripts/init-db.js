import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Sequelize } from 'sequelize';

// Create require in ES module scope
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load config
const config = require(join(process.cwd(), 'config.json'));

async function initializeDatabase() {
  try {
    const dbConfig = config.production;
    
    console.log('Creating database if it does not exist...');
    
    // Create database if it doesn't exist
    const sequelize = new Sequelize('', dbConfig.username, dbConfig.password, {
      host: dbConfig.host,
      dialect: dbConfig.dialect,
      logging: console.log
    });
    
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log('Database created or already exists');
    
    // Close the connection
    await sequelize.close();
    
    // Now connect to the new database
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

// Execute the function
initializeDatabase().catch(error => {
  console.error('Unhandled error in database initialization:', error);
  process.exit(1);
});
