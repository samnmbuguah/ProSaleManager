FROM node:24-slim

# Install PostgreSQL client for health checks and any other system dependencies
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# (No COPY or project-specific steps; the agent will clone your repo)
