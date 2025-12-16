
const fs = require('fs');
const path = require('path');

const schemaPath = path.resolve(__dirname, '../schema_dump.json');
const outputPath = path.resolve(__dirname, '../src/database/migrations/20250101000000-baseline-schema.cjs');

if (!fs.existsSync(schemaPath)) {
  console.error('Schema dump not found!');
  process.exit(1);
}

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

let upCode = `
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    
    // Helper to check if table exists
    const tableExists = (tableName) => tables.includes(tableName);
`;

let downCode = `
  },

  async down(queryInterface, Sequelize) {
    // Drop all tables in reverse order or just drop existing ones
    // For baseline, down usually drops everything.
    // We can list tables from schema keys.
`;

const tables = Object.keys(schema);

// Improve sorting if possible to handle FKs (naive topological sort needed? or just disable FK checks)
// For MySQL: SET FOREIGN_KEY_CHECKS = 0;

upCode += `
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
`;

for (const tableName of tables) {
  const columns = schema[tableName];
  upCode += `
    if (!tableExists('${tableName}')) {
      await queryInterface.createTable('${tableName}', {
`;
  
  for (const [colName, colDef] of Object.entries(columns)) {
    // Map raw types back to Sequelize types if possible, or use literal strings
    // describeTable returns "type" as a string like "VARCHAR(255)"
    // We can use Sequelize.literal but createTable expects Sequelize objects or strings for types.
    // If we pass the raw string from describeTable as type, Sequelize usually accepts it or we wrap it.
    
    upCode += `        ${colName}: {
          type: '${colDef.type.replace(/'/g, "\\'")}',
          allowNull: ${colDef.allowNull},
          defaultValue: ${colDef.defaultValue === null ? 'null' : (typeof colDef.defaultValue === 'string' && !colDef.defaultValue.includes('CURRENT_TIMESTAMP') ? `'${colDef.defaultValue}'` : 'Sequelize.literal("'+colDef.defaultValue+'")')},
          primaryKey: ${colDef.primaryKey},
          autoIncrement: ${colDef.autoIncrement},
        },
`;
  }

  upCode += `      });
    }
`;
}

upCode += `
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
`;

// Generate Down
downCode += `    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
`;
for (const tableName of tables.reverse()) { // Naive reverse
  downCode += `    await queryInterface.dropTable('${tableName}');
`;
}
downCode += `    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  }
};
`;

fs.writeFileSync(outputPath, upCode + downCode);
console.log('Baseline migration generated at:', outputPath);
