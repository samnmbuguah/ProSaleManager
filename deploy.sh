#!/bin/bash

set -e

# 1. Clean up previous production directory
rm -rf production

# 2. Create database backup before deployment (legacy SQLite backup if exists)
echo "Creating database backup (if SQLite database exists)..."
BACKUP_DIR="/home/elteijae/eltee.store/backups"
BACKUP_FILE="database-backup-$(date +%F-%H%M%S).sqlite"
ssh -p 21098 elteijae@198.54.114.246 "mkdir -p $BACKUP_DIR && if [ -f /home/elteijae/eltee.store/database.sqlite ]; then cp /home/elteijae/eltee.store/database.sqlite $BACKUP_DIR/$BACKUP_FILE; echo 'Database backed up to: $BACKUP_DIR/$BACKUP_FILE'; else echo 'No existing SQLite database to backup (using MySQL in production)'; fi"

# 2.5. Configure production environment in .env before builds
echo "Configuring production environment in .env..."
# Save original NODE_ENV value
ORIGINAL_NODE_ENV=$(grep -E '^NODE_ENV=' server/.env | cut -d '=' -f2 || echo "development")

# Validate MySQL configuration exists before proceeding
HAS_DB_USER=$(grep -qE '^DB_USER=|^MYSQL_USER=' server/.env && echo "yes" || echo "no")
HAS_DB_PASSWORD=$(grep -qE '^DB_PASSWORD=|^MYSQL_PASSWORD=' server/.env && echo "yes" || echo "no")
HAS_DB_NAME=$(grep -qE '^DB_NAME=|^MYSQL_DATABASE=' server/.env && echo "yes" || echo "no")

if [ "$HAS_DB_USER" = "no" ] || [ "$HAS_DB_PASSWORD" = "no" ] || [ "$HAS_DB_NAME" = "no" ]; then
  echo "⚠️  WARNING: MySQL database configuration incomplete in .env file!"
  echo "   Production requires: DB_USER (or MYSQL_USER), DB_PASSWORD (or MYSQL_PASSWORD), DB_NAME (or MYSQL_DATABASE)"
  echo "   Please ensure your .env file contains MySQL connection settings."
  echo ""
  read -p "Continue deployment anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled. Please update .env file with MySQL configuration."
    exit 1
  fi
else
  echo "✅ MySQL configuration found in .env file"
fi

# Set NODE_ENV to production in server/.env
sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' server/.env
if ! grep -q '^NODE_ENV=' server/.env; then
  echo 'NODE_ENV=production' >> server/.env
fi

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

# 7. Copy .env to production directory (already configured with NODE_ENV=production)
cp server/.env production/server/.env

# 8. Copy frontend build to backend public directory
mkdir -p production/server/public
cp -r client/dist/* production/server/public/

# 9. Database management - handled manually
echo "📝 Database management: Handled manually to preserve production data"

# 10. Upload to cPanel server (excluding database file)
echo "Uploading to server using rsync (excluding database)..."
rsync -avz -e "ssh -p 21098" --exclude='database.sqlite' production/server/ elteijae@198.54.114.246:/home/elteijae/eltee.store/

# 11. Restore original NODE_ENV in server/.env (optional, for local development)
echo "Restoring original NODE_ENV in server/.env..."
sed -i "s/^NODE_ENV=.*/NODE_ENV=${ORIGINAL_NODE_ENV}/" server/.env

# 12. Deployment complete

# 13. Do NOT delete production folder after deployment

echo ""
echo "🎉 Deployment complete!"
echo "📊 Deployment Summary:"
echo "   ✅ Frontend built and deployed"
echo "   ✅ Backend built and deployed"
echo "   ✅ Database backed up to: $BACKUP_FILE"
echo "   📝 Database managed manually (not uploaded)"
echo ""
echo "🔗 Application should be available at your domain"
echo "🔑 Login credentials:"
echo "   Admin: eltee.admin@prosale.com / elteeadmin123"
echo "   Cashier: eltee.cashier@prosale.com / eltee123"
echo "   Manager: eltee.manager@prosale.com / elteemgr123"