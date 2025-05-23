FROM node:24-slim

# Install PostgreSQL client for health checks
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Copy .env files if present
COPY client/.env ./client/.env
COPY server/.env ./server/.env

# Expose ports for server and client
EXPOSE 5000
EXPOSE 5173

# Start the application in development mode
CMD ["npm", "run", "dev"] 