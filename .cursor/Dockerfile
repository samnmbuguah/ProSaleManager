FROM node:22.12.0-slim

# Install Docker, Docker Compose, and PostgreSQL client
RUN apt-get update && \
    apt-get install -y \
      postgresql-client \
      curl \
      ca-certificates \
      gnupg \
      lsb-release && \
    # Install Docker
    curl -fsSL https://get.docker.com | sh && \
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

# (No COPY or project-specific steps; the agent will clone your repo)
