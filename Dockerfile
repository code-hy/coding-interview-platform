# Use Node.js Alpine for smaller image size
FROM node:20-alpine AS base

# Install Python dependencies for Pyodide
RUN apk add --no-cache python3 py3-pip

# Install compilers for Multi-Language Support
# Java (OpenJDK 17), C++ (build-base includes GCC/G++), Go
# Also install curl for health checks
RUN apk add --no-cache openjdk17 build-base go curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]