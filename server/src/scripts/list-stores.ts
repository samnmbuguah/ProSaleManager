import { Store } from "../models/index.js";
import { sequelize } from "../config/database.js";

async function listStores() {
    try {
        await sequelize.authenticate();
        const stores = await Store.findAll();
        console.log(`Found ${stores.length} stores:`);
        stores.forEach(s => console.log(`- ${s.name} (ID: ${s.id}, Domain: ${s.subdomain})`));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

listStores();
