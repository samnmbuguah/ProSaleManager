#!/bin/bash
#
# Baseline (mark as applied) selected Sequelize migrations on the production
# MySQL database without re-running them. This is safe when the schema already
# matches the listed migrations but the `SequelizeMeta` table is missing rows.
#
# Usage (from repo root):
#   chmod +x scripts/baseline-migrations.sh
#   ./scripts/baseline-migrations.sh
#
# It will SSH to the production server, load DB credentials from .env in
# /home/elteijae/eltee.store, and insert rows into `SequelizeMeta` for the
# migrations listed in MIGRATIONS_TO_BASELINE below.

set -euo pipefail

# --- Settings you may adjust -------------------------------------------------
SERVER="elteijae@198.54.114.246"
SSH_PORT=21098
REMOTE_DIR="/home/elteijae/eltee.store"

# List ONLY the migrations that are already reflected in the production schema
# but missing from `SequelizeMeta`. Do NOT include new migrations you still
# need to run.
MIGRATIONS_TO_BASELINE=(
  "20241009-initial-schema.ts"
  "20231110-add-store-id-to-categories.ts"
)

# -----------------------------------------------------------------------------

echo "🚀 Connecting to ${SERVER} to baseline migrations: ${MIGRATIONS_TO_BASELINE[*]}"

# Build a space-separated, shell-escaped list for the remote shell
MIGRATIONS_STRING="$(printf '%q ' "${MIGRATIONS_TO_BASELINE[@]}")"

ssh -p "${SSH_PORT}" "${SERVER}" "MIGRATIONS_STRING='${MIGRATIONS_STRING}' REMOTE_DIR='${REMOTE_DIR}' bash -s" <<'EOF'
set -euo pipefail

cd "${REMOTE_DIR}"

if [ ! -f ".env" ]; then
  echo "❌ .env not found in ${REMOTE_DIR}. Aborting."
  exit 1
fi

# Load DB credentials from .env (supports DB_* or MYSQL_* naming)
set -a
source .env
set +a

DB_HOST="${DB_HOST:-${MYSQL_HOST:-localhost}}"
DB_PORT="${DB_PORT:-${MYSQL_PORT:-3306}}"
DB_USER="${DB_USER:-${MYSQL_USER:-}}"
DB_PASSWORD="${DB_PASSWORD:-${MYSQL_PASSWORD:-}}"
DB_NAME="${DB_NAME:-${MYSQL_DATABASE:-}}"

if [ -z "${DB_USER}" ] || [ -z "${DB_PASSWORD}" ] || [ -z "${DB_NAME}" ]; then
  echo "❌ Missing DB_USER/DB_PASSWORD/DB_NAME (or MYSQL_* equivalents) in .env"
  exit 1
fi

echo "✅ Loaded DB config from .env (host=${DB_HOST} port=${DB_PORT} db=${DB_NAME})"

# Ensure SequelizeMeta exists (no-op if already there)
mysql -h "${DB_HOST}" -P "${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
  -e "CREATE TABLE IF NOT EXISTS \`SequelizeMeta\` (\`name\` varchar(255) NOT NULL, PRIMARY KEY (\`name\`));"

# Baseline the provided migrations
migrations=(${MIGRATIONS_STRING})

# Optional sanity checks before baselining
if [[ " ${migrations[*]} " == *" 20231110-add-store-id-to-categories.ts "* ]]; then
  has_store_id=$(mysql -N -B -h "${DB_HOST}" -P "${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
    -e "SHOW COLUMNS FROM \`categories\` LIKE 'store_id';")
  if [ -z "${has_store_id}" ]; then
    echo "❌ categories.store_id is missing; aborting baseline for this migration."
    exit 1
  fi
  echo "✅ categories.store_id present."
fi

for name in "${migrations[@]}"; do
  echo "➕ Baseline: ${name}"
  mysql -h "${DB_HOST}" -P "${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
    -e "INSERT IGNORE INTO \`SequelizeMeta\` (\`name\`) VALUES ('${name}');"
done

echo "📄 Current SequelizeMeta rows:"
mysql -h "${DB_HOST}" -P "${DB_PORT}" -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
  -e "SELECT name FROM \`SequelizeMeta\` ORDER BY name;"

echo "✅ Baseline complete. Next: run migrations normally (e.g., npm run migrate)."
EOF
