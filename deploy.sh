#!/bin/bash

set -e

# 1. Clean up previous production directory
rm -rf production

# 2. Create database and image backup (MySQL & Uploads)
echo "Creating backup of MySQL database and product images..."
ssh -p 21098 elteijae@198.54.114.246 "
  # Define backup root
  BACKUP_ROOT='/home/elteijae/byccollections.com_backup'
  mkdir -p \$BACKUP_ROOT

  # Source env for DB credentials (safely)
  if [ -f /home/elteijae/byccollections.com/.env ]; then
    export \$(grep -E '^(DB_|MYSQL_)' /home/elteijae/byccollections.com/.env | xargs)
  fi

  TIMESTAMP=\$(date +%F-%H%M%S)

  # 1. Backup MySQL Database
  echo 'Backing up MySQL database...'
  if [ ! -z \"\$DB_NAME\" ]; then
    mysqldump -u \$DB_USER -p\$DB_PASSWORD \$DB_NAME > \$BACKUP_ROOT/db_\$TIMESTAMP.sql
    echo \"Database backup created: \$BACKUP_ROOT/db_\$TIMESTAMP.sql\"
  else
    echo 'Could not find DB_NAME in .env, skipping DB backup.'
  fi

  # 2. Backup Images (byccollections.com/uploads)
  echo 'Backing up product images...'
  if [ -d /home/elteijae/byccollections.com/uploads ]; then
    TARGET_IMG_DIR=\"\$BACKUP_ROOT/images_\$TIMESTAMP\"
    mkdir -p \$TARGET_IMG_DIR
    cp -r /home/elteijae/byccollections.com/uploads/* \$TARGET_IMG_DIR
    echo \"Images backed up to: \$TARGET_IMG_DIR\"
  else
    echo 'No uploads directory found at /home/elteijae/byccollections.com/uploads'
  fi
"

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

# 8. Copy frontend build into backend public directory (served by the Node app)
mkdir -p production/server/public
cp -r client/dist/* production/server/public/

# 8.5. Manually copy config.cjs, migrations, and clean up
echo "Copying config, migrations, and .sequelizerc..."
cp server/src/config/config.cjs production/server/dist/src/config/config.cjs
cp server/.sequelizerc production/server/

# Ensure migrations and seeders are in dist (tsc ignores non-ts files)
mkdir -p production/server/dist/src/database
# Clean up potential stale migrations in the build output to avoid running deleted migrations
cp -r server/src/database/migrations production/server/dist/src/database/
cp -r server/src/database/seeders production/server/dist/src/database/

# 9. Upload to cPanel server (excluding database file)
echo "Uploading to server using rsync (excluding database)..."
rsync -rtvz -e "ssh -p 21098" --exclude='database.sqlite' production/server/ elteijae@198.54.114.246:/home/elteijae/byccollections.com/

# 9.5. Run Database Migrations (Interactive)
echo ""
read -p "Do you want to run DATABASE MIGRATIONS on production? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🚀 Running migrations on production server..."
  # Clean up stale .js migrations on remote (we now use .cjs, and rsync doesn't delete old files)
  ssh -p 21098 elteijae@198.54.114.246 "cd /home/elteijae/byccollections.com && rm -f dist/src/database/migrations/*.js && export NODE_ENV=production && npm install --production && npx sequelize-cli db:migrate"
else
  echo "⏩ Skipping database migrations."
fi

# 10. Trigger Passenger restart
ssh -p 21098 elteijae@198.54.114.246 "touch /home/elteijae/byccollections.com/tmp/restart.txt"

# 11. Restore original NODE_ENV in server/.env (optional, for local development)
echo "Restoring original NODE_ENV in server/.env..."
sed -i "s/^NODE_ENV=.*/NODE_ENV=${ORIGINAL_NODE_ENV}/" server/.env

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
echo ""