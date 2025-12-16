
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Expects .env in current directory

// Try to find config in probable locations
let configPath;
if (fs.existsSync('./dist/src/config/config.cjs')) {
  configPath = './dist/src/config/config.cjs';
} else if (fs.existsSync('./src/config/config.cjs')) {
  configPath = './src/config/config.cjs';
} else {
    console.error('Could not find config file path.');
    console.error('Current directory:', process.cwd());
    try {
      console.error('Listing dist/src/config:', fs.readdirSync('./dist/src/config'));
    } catch (e) { console.error('Cannot list dist/src/config'); }
    process.exit(1);
}

// Create a temp CJS copy to bypass "type: module" restrictions
const tempConfigPath = path.resolve(__dirname, 'temp-config.cjs');
fs.copyFileSync(configPath, tempConfigPath);

let config;
try {
  config = require(tempConfigPath);
} catch (e) {
  console.error('Error requiring config:', e);
  process.exit(1);
} finally {
  if (fs.existsSync(tempConfigPath)) {
    fs.unlinkSync(tempConfigPath);
  }
}

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

console.error(`Connecting to ${env} database...`);

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  port: dbConfig.port,
  logging: false,
});

async function introspect() {
  try {
    await sequelize.authenticate();
    console.error('Connection has been established successfully.');

    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    const schema = {};

    for (const table of tables) {
      if (table === 'SequelizeMeta') continue;
      const tableName = typeof table === 'object' ? table.tableName : table;
      
      console.error(`Introspecting ${tableName}...`);
      const columns = await queryInterface.describeTable(tableName);
      schema[tableName] = columns;
    }

    console.log(JSON.stringify(schema, null, 2));
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

introspect();
