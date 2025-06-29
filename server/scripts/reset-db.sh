#!/bin/bash

# Set PostgreSQL password
export PGPASSWORD='prosalepassword'

echo "Dropping all tables..."
psql -h localhost -U prosalemanager -d prosaledatabase << EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO prosalemanager;
GRANT ALL ON SCHEMA public TO public;
EOF

echo "Running migrations..."
cd server && npm run migrate

echo "Database reset complete!" 