#!/bin/bash
# Run sequelize migrations on the production server.
# Uses .env on the remote host for DB credentials.
#
# Usage:
#   chmod +x scripts/run-prod-migrate.sh
#   ./scripts/run-prod-migrate.sh

set -euo pipefail

SERVER="elteijae@198.54.114.246"
SSH_PORT=21098
REMOTE_DIR="/home/elteijae/eltee.store"

echo "🚀 Running migrations on ${SERVER}..."

ssh -p "${SSH_PORT}" "${SERVER}" /bin/bash <<EOF
set -euo pipefail
cd "${REMOTE_DIR}"
if [ ! -f package.json ]; then
  echo "❌ package.json not found in ${REMOTE_DIR}"
  exit 1
fi
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi
echo "📦 Installing deps if needed..."
npm install --omit=dev >/tmp/npm-install.log 2>&1 || { echo "npm install failed. See /tmp/npm-install.log"; exit 1; }

echo "📝 Writing temporary Sequelize config for production..."
cat > /tmp/sequelize.prod.cjs <<'CFG'
module.exports = {
  production: {
    username: process.env.MYSQL_USER || process.env.DB_USER || '',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || '',
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
    dialect: 'mysql',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  },
};
CFG

echo "🏃 Running migrations..."
# Use compiled dist migrations with the temp config
npx sequelize-cli db:migrate \\
  --env production \\
  --config /tmp/sequelize.prod.cjs \\
  --migrations-path dist/src/migrations
echo "✅ Migrations finished."
echo "📊 Migration status:"
npx sequelize-cli db:migrate:status \\
  --env production \\
  --config /tmp/sequelize.prod.cjs \\
  --migrations-path dist/src/migrations
EOF


