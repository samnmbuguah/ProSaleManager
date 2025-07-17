#!/bin/bash

set -e

# 1. Clean up previous production directory
rm -rf production

# 2. Build frontend
echo "Building frontend..."
if [ ! -d client/node_modules ]; then
  cd client
  npm install
  cd ..
fi
cd client
npm run build
cd ..

# 3. Build backend
echo "Building backend..."
if [ ! -d server/node_modules ]; then
  cd server
  npm install
  cd ..
fi
cd server
npm run build # Remove or adjust if you don't have a build step
cd ..

# 4. Prepare production directory
mkdir -p production/server

# 5. Copy backend build and essentials
cp -r server/dist production/server/
cp server/package.json production/server/
cp server/package-lock.json production/server/

# 6. Ensure .env is set to production
cp server/.env production/server/.env
sed -i 's/^NODE_ENV=.*/NODE_ENV=production/' production/server/.env
if ! grep -q '^NODE_ENV=' production/server/.env; then
  echo 'NODE_ENV=production' >> production/server/.env
fi

# 7. Copy frontend build to backend public directory
mkdir -p production/server/public
cp -r client/dist/* production/server/public/

# 8. Upload to cPanel server
echo "Uploading to server using rsync..."
rsync -avz -e "ssh -p 21098" production/server/ elteijae@198.54.114.246:/home/elteijae/eltee_store/server/

# 9. Do NOT delete production folder after deployment

echo "Deployment complete!" 