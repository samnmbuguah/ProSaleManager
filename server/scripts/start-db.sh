#!/bin/bash

# Set PostgreSQL password
export PGPASSWORD='prosalepassword'

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "PostgreSQL is not running. Starting it..."
    
    # Try to start PostgreSQL using Docker first
    if docker ps | grep -q prosalemanager-db-1; then
        echo "PostgreSQL Docker container is already running"
    else
        echo "Starting PostgreSQL Docker container..."
        docker compose up -d db
        
        # Wait for PostgreSQL to be ready
        echo "Waiting for PostgreSQL to be ready..."
        for i in {1..30}; do
            if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
                echo "PostgreSQL is ready!"
                break
            fi
            sleep 1
        done
    fi
else
    echo "PostgreSQL is already running"
fi

# Verify database exists
if ! psql -h localhost -U prosalemanager -d prosaledatabase -c "\l" > /dev/null 2>&1; then
    echo "Creating database and user..."
    docker exec -it prosalemanager-db-1 psql -U prosalemanager -d prosaledatabase -c "CREATE DATABASE prosaledatabase;" 2>/dev/null || true
fi

echo "Database setup complete!" 