import { sequelize } from "../config/database.js";
import "../models/index.js"; // Initialize models

async function verifySchema() {
    try {
        console.log("🔍 Verifying database schema against models...");
        await sequelize.authenticate();
        const queryInterface = sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();

        // Get all defined models
        const models = sequelize.models;
        let errorsFound = false;

        console.log(`Found ${Object.keys(models).length} models defined.`);

        for (const modelName in models) {
            const model = models[modelName];
            const tableName = model.getTableName();

            if (!tables.includes(tableName as string)) {
                console.error(`❌ Missing table: ${tableName} (Model: ${modelName})`);
                errorsFound = true;
                continue;
            }

            const tableDescription = await queryInterface.describeTable(tableName as string);
            const modelAttributes = model.getAttributes();

            for (const attrName in modelAttributes) {
                const attribute = modelAttributes[attrName];
                const columnName = attribute.field || attrName;

                if (!tableDescription[columnName]) {
                    console.error(`❌ Missing column: ${tableName}.${columnName}`);
                    errorsFound = true;
                } else {
                    // Optional: strict type checking could go here
                }
            }
        }

        if (!errorsFound) {
            console.log("✅ Schema verification passed! All models match the database tables.");
        } else {
            console.error("❌ Schema verification failed. See errors above.");
            process.exit(1);
        }

    } catch (error) {
        console.error("Error verifying schema:", error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}

verifySchema();
