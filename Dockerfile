FROM node:20-slim

# Install PostgreSQL client for health checks
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"] 