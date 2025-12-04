// src/seed/full-reset-seed.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import { sequelize } from '../config/database.js';
import Store from '../models/Store.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('🏪 Starting Full Reset Seed...');

    // Disable foreign key checks for both SQLite and MySQL
    const dialect = sequelize.getDialect();

    if (dialect === 'sqlite') {
        try {
            await sequelize.query('PRAGMA foreign_keys = OFF');
        } catch (_) { }
    } else if (dialect === 'mysql') {
        try {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        } catch (_) { }
    }

    // Drop all tables safely
    try {
        await sequelize.drop();
        console.log('✅ All tables dropped');
    } catch (e) {
        console.warn('⚠️ Could not drop tables cleanly', e);
    }

    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // Re-enable foreign key checks
    if (dialect === 'sqlite') {
        try {
            await sequelize.query('PRAGMA foreign_keys = ON');
        } catch (_) { }
    } else if (dialect === 'mysql') {
        try {
            await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (_) { }
    }

    // --- Store creation ---
    const elteeStore = await Store.create({ name: 'Eltee', subdomain: 'eltee' });
    const elteeCbdStore = await Store.create({ name: 'Eltee CBD', subdomain: 'eltee-cbd' });

    // --- Users ---
    const users = [
        { email: 'eltee.admin@prosale.com', password: 'elteeadmin123!', name: 'Eltee Admin', role: 'admin' as const, store_id: elteeStore.id },
        { email: 'eltee.manager@prosale.com', password: 'elteemgr123', name: 'Eltee Manager', role: 'manager' as const, store_id: elteeStore.id },
        { email: 'eltee.cashier@prosale.com', password: 'eltee123', name: 'Eltee Cashier', role: 'sales' as const, store_id: elteeStore.id },
        { email: 'eltee.cbd.admin@prosale.com', password: 'elteecbdadmin123!', name: 'Eltee CBD Admin', role: 'admin' as const, store_id: elteeCbdStore.id },
        { email: 'eltee.cbd.manager@prosale.com', password: 'elteecbdmgr123', name: 'Eltee CBD Manager', role: 'manager' as const, store_id: elteeCbdStore.id },
        { email: 'eltee.cbd.cashier@prosale.com', password: 'elteecbd123', name: 'Eltee CBD Cashier', role: 'sales' as const, store_id: elteeCbdStore.id },
    ];
    for (const u of users) {
        await User.create({
            email: u.email,
            password: await bcrypt.hash(u.password, 10),
            name: u.name,
            role: u.role,
            store_id: u.store_id
        });
    }
    console.log('✅ Users created');

    // --- CSV product import ---
    const csvPath = path.resolve(__dirname, '../../El Tee Records  - Price list.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true });
    console.log(`📦 Found ${records.length} products in CSV. Seeding...`);

    const inferCategory = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('men')) return "Men's Innerwear";
        if (lower.includes('ladies') && lower.includes('outer')) return "Ladies Outerwear";
        if (lower.includes('ladies')) return "Ladies Innerwear";
        if (lower.includes('kids')) return "Kids Innerwear";
        if (lower.includes('sock')) return 'Socks';
        return 'General';
    };

    const categoryCache: Record<number, Record<string, Category>> = {};
    let skuCounter = 1;

    for (const store of [elteeStore, elteeCbdStore]) {
        categoryCache[store.id] = {};
        for (const rec of records as any[]) {
            const itemName = rec['Item'] || rec['Item '];
            const piecePrice = parseFloat(rec['Piece Price'] || rec['Piece Price ']);
            const packPrice = parseFloat(rec['Pack Price'] || rec['Pack Price ']);
            const dozenPrice = parseFloat((rec['Wholesale / dozen'] || rec['Wholesale / dozen ']).replace(/,/g, ''));
            const categoryName = inferCategory(itemName);
            if (!categoryCache[store.id][categoryName]) {
                const cat = await Category.findOrCreate({
                    where: { name: categoryName, store_id: store.id },
                    defaults: { description: `${categoryName} for ${store.name}` },
                });
                categoryCache[store.id][categoryName] = cat[0];
            }
            const category = categoryCache[store.id][categoryName];
            const sku = `${categoryName.substring(0, 3).toUpperCase()}-${skuCounter.toString().padStart(4, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
            await Product.create({
                name: itemName,
                sku,
                description: 'Imported from CSV',
                category_id: category.id!,
                piece_selling_price: piecePrice,
                pack_selling_price: packPrice,
                dozen_selling_price: dozenPrice,
                piece_buying_price: piecePrice * 0.7,
                pack_buying_price: packPrice * 0.7,
                dozen_buying_price: dozenPrice * 0.7,
                quantity: 100,
                min_quantity: 10,
                stock_unit: 'piece',
                store_id: store.id,
                is_active: true,
            });
            skuCounter++;
        }
    }

    console.log('✅ Products seeded successfully');
    console.log('🎉 Full reset seeding completed!');
}

main().catch(err => {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
});
