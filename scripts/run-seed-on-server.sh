#!/bin/bash
set -e

# Server details
SERVER="elteijae@198.54.114.246"
SSH_PORT=21098
REMOTE_DIR="/home/elteijae/eltee.store"

# Create a temporary directory for the seeder
TEMP_DIR="$(mktemp -d)"

echo "📦 Preparing seeder package..."

# Copy necessary files
cp -r server/src/seed "$TEMP_DIR/"
cp -r server/src/config "$TEMP_DIR/"
cp server/package.json "$TEMP_DIR/"
cp server/tsconfig.json "$TEMP_DIR/"
cp scripts/seed-production.ts "$TEMP_DIR/"

# Create a package.json for the seeder
cat > "$TEMP_DIR/package.json" << 'EOL'
{
  "name": "prosale-seeder",
  "version": "1.0.0",
  "description": "Database seeder for ProSale Manager",
  "main": "seed-production.js",
  "scripts": {
    "seed": "node seed-production.js"
  },
  "dependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
EOL

echo "🚀 Uploading seeder to production server..."

# Create remote temp directory and upload files
ssh -p $SSH_PORT $SERVER "mkdir -p $REMOTE_DIR/tmp-seeder"
rsync -avz -e "ssh -p $SSH_PORT" "$TEMP_DIR/" "$SERVER:$REMOTE_DIR/tmp-seeder/"

# Run the seeder on the server
echo "🌱 Running database seeder on production server..."
ssh -p $SSH_PORT $SERVER "
    cd $REMOTE_DIR/tmp-seeder && \
    npm install && \
    npx tsc --module es2022 --moduleResolution node && \
    NODE_ENV=production npx ts-node seed-production.ts && \
    cd .. && rm -rf tmp-seeder
"

# Clean up local temp directory
rm -rf "$TEMP_DIR"

echo "✅ Seeding process completed successfully!"
