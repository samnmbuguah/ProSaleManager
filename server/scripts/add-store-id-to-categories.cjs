const { sequelize } = require('../src/config/database.cjs');

async function addStoreIdToCategories() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Adding store_id column to categories table...');
    
    // Add store_id column to categories table
    await sequelize.query(
      `ALTER TABLE categories 
       ADD COLUMN store_id INTEGER 
       REFERENCES stores(id) 
       ON UPDATE CASCADE 
       ON DELETE SET NULL;`,
      { transaction }
    );
    
    console.log('Successfully added store_id column to categories table');
    
    // Commit the transaction
    await transaction.commit();
    console.log('Transaction committed successfully');
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    console.error('Error adding store_id column to categories table:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script
addStoreIdToCategories()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
