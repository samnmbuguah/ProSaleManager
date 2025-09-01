#!/bin/bash

echo "🔄 Resetting database with latest schema..."
echo "⚠️  WARNING: This will delete all existing data!"

# Run the sync script
npx tsx scripts/sync-db.ts

echo ""
echo "🌱 Seeding initial data..."

# Seed the database
npx tsx src/seed/stores.ts
npx tsx src/seed/categories.ts
npx tsx src/seed/users.ts
npx tsx src/seed/products.ts
npx tsx src/seed/customers.ts
npx tsx src/seed/suppliers.ts

echo ""
echo "✅ Database reset and seeded successfully!"
echo "🔐 User roles: super_admin, admin, manager, sales, client"
echo "👤 Default user role: client"
echo "🏪 Shop page is now the default for client users"
echo ""
echo "📋 Test credentials:"
echo "   Super Admin: superadmin@prosale.com / superadmin123"
echo "   Eltee Admin: eltee.admin@prosale.com / elteeadmin123"
echo "   Eltee Cashier: eltee.cashier@prosale.com / eltee123"
echo "   Eltee Manager: eltee.manager@prosale.com / elteemgr123"