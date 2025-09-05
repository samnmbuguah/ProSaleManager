#!/bin/bash

set -e

# 1. Clean up previous production directory
rm -rf production

# 2. Create database backup before deployment
echo "Creating database backup..."
BACKUP_DIR="/home/elteijae/byccollections.com/backups"
BACKUP_FILE="database-backup-$(date +%F-%H%M%S).sqlite"
ssh -p 21098 elteijae@198.54.114.246 "mkdir -p $BACKUP_DIR && if [ -f /home/elteijae/byccollections.com/database.sqlite ]; then cp /home/elteijae/byccollections.com/database.sqlite $BACKUP_DIR/$BACKUP_FILE; echo 'Database backed up to: $BACKUP_DIR/$BACKUP_FILE'; else echo 'No existing database to backup'; fi"

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

# 9. Database management - handled manually
echo "📝 Database management: Handled manually to preserve production data"

# 10. Upload to cPanel server (excluding database file)
echo "Uploading to server using rsync (excluding database)..."
rsync -avz -e "ssh -p 21098" --exclude='database.sqlite' production/server/ elteijae@198.54.114.246:/home/elteijae/byccollections.com/

# 11. Deployment complete

# 12. Do NOT delete production folder after deployment

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
echo "   Admin: admin@byccollections.com / admin123"
echo "   Manager: manager@byccollections.com / manager123"
echo "   Sales: sales@byccollections.com / sales123" 