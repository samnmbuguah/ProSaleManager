#!/bin/bash

set -e

# 1. Clean up previous production directory
rm -rf production

# 2. Create database backup before deployment
echo "Creating database backup..."
BACKUP_DIR="/home/elteijae/eltee_store/backups"
BACKUP_FILE="database-backup-$(date +%F-%H%M%S).sqlite"
ssh -p 21098 elteijae@198.54.114.246 "mkdir -p $BACKUP_DIR && if [ -f /home/elteijae/eltee_store/database.sqlite ]; then cp /home/elteijae/eltee_store/database.sqlite $BACKUP_DIR/$BACKUP_FILE; echo 'Database backed up to: $BACKUP_DIR/$BACKUP_FILE'; else echo 'No existing database to backup'; fi"

# 3. Build frontend
echo "Building frontend..."
if [ ! -d client/node_modules ]; then
  cd client
  npm install
  cd ..
fi
cd client
npm run build
cd ..

# 4. Build backend
echo "Building backend..."
if [ ! -d server/node_modules ]; then
  cd server
  npm install
  cd ..
fi
cd server
npm run build # Remove or adjust if you don't have a build step
cd ..

# 5. Prepare production directory
mkdir -p production/server

# 6. Copy backend build and essentials
cp -r server/dist production/server/
cp server/package.json production/server/
cp server/package-lock.json production/server/

# 7. Ensure .env is set to production
cp server/.env production/server/.env
sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' production/server/.env
if ! grep -q '^NODE_ENV=' production/server/.env; then
  echo 'NODE_ENV=production' >> production/server/.env
fi

# 8. Copy frontend build to backend public directory
mkdir -p production/server/public
cp -r client/dist/* production/server/public/

# 9. Ensure database is up-to-date and copy it
echo "Ensuring database is synchronized..."
cd server
npx tsx scripts/sync-db.ts
echo "Database synchronized successfully!"

# Check if database needs seeding
echo "Checking if database needs seeding..."
USER_COUNT=$(sqlite3 database.sqlite "SELECT COUNT(*) FROM users;" 2>/dev/null || echo "0")
if [ "$USER_COUNT" -eq "0" ]; then
    echo "Database is empty, running seeders..."
    npx tsx src/seed/stores.ts
    npx tsx src/seed/categories.ts
    npx tsx src/seed/users.ts
    npx tsx src/seed/products.ts
    npx tsx src/seed/customers.ts
    npx tsx src/seed/suppliers.ts
    echo "Database seeded successfully!"
else
    echo "Database already has data ($USER_COUNT users), skipping seeding"
fi

echo "Copying database file..."
cp database.sqlite ../production/server/database.sqlite
cd ..

# Verify database file was copied and has correct schema
echo "Verifying database schema..."
if sqlite3 production/server/database.sqlite "PRAGMA table_info(users);" | grep -q "phone"; then
    echo "✅ Database schema verified - phone column exists"
else
    echo "❌ ERROR: Database schema verification failed - phone column missing"
    exit 1
fi

# 10. Upload to cPanel server
echo "Uploading to server using rsync..."
rsync -avz -e "ssh -p 21098" production/server/ elteijae@198.54.114.246:/home/elteijae/eltee_store/

# Verify production database after upload
echo "Verifying production database..."
if ssh -p 21098 elteijae@198.54.114.246 "sqlite3 /home/elteijae/eltee_store/database.sqlite 'PRAGMA table_info(users);'" | grep -q "phone"; then
    echo "✅ Production database verified - phone column exists"
else
    echo "❌ ERROR: Production database verification failed"
    exit 1
fi

# 11. Clean up old backups (keep last 7 days)
echo "Cleaning up old backups..."
ssh -p 21098 elteijae@198.54.114.246 "find $BACKUP_DIR -name 'database-backup-*.sqlite' -mtime +7 -delete"

# 12. Do NOT delete production folder after deployment

echo ""
echo "🎉 Deployment complete!"
echo "📊 Deployment Summary:"
echo "   ✅ Frontend built and deployed"
echo "   ✅ Backend built and deployed"
echo "   ✅ Database synchronized and verified"
echo "   ✅ Production database verified"
echo "   ✅ Backup created: $BACKUP_FILE"
echo ""
echo "🔗 Application should be available at your domain"
echo "🔑 Login credentials:"
echo "   Admin: eltee.admin@prosale.com / elteeadmin123"
echo "   Cashier: eltee.cashier@prosale.com / eltee123"
echo "   Manager: eltee.manager@prosale.com / elteemgr123" 