#!/bin/bash

set -e

# 1. Clean up previous production directory
rm -rf production

# 2. Create database backup before deployment
echo "Creating database backup..."
BACKUP_DIR="/home/elteijae/eltee_store/backups"
BACKUP_FILE="database-backup-$(date +%F-%H%M%S).sqlite"
ssh -p 21098 elteijae@198.54.114.246 "mkdir -p $BACKUP_DIR && cp /home/elteijae/eltee_store/database.sqlite $BACKUP_DIR/$BACKUP_FILE"
echo "Database backed up to: $BACKUP_DIR/$BACKUP_FILE"

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

# 9. Copy database file
echo "Copying database file..."
cp database.sqlite production/server/database.sqlite

# 10. Upload to cPanel server
echo "Uploading to server using rsync..."
rsync -avz -e "ssh -p 21098" production/server/ elteijae@198.54.114.246:/home/elteijae/eltee_store/

# 11. Clean up old backups (keep last 7 days)
echo "Cleaning up old backups..."
ssh -p 21098 elteijae@198.54.114.246 "find $BACKUP_DIR -name 'database-backup-*.sqlite' -mtime +7 -delete"

# 12. Do NOT delete production folder after deployment

echo "Deployment complete!" 