# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Set npm configuration for better performance and ARM64 compatibility
RUN npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 3

# Copy package files
COPY package*.json ./

# Clean install with force to resolve ARM64 rollup issues
RUN rm -rf node_modules package-lock.json

# Install dependencies with force flag to resolve optional dependency issues
RUN npm install --force --no-audit --no-fund

# Copy source code
COPY . .

# Set environment for production build
ENV NODE_ENV=production

# Build the application with increased memory limit
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Production stage
FROM nginx:alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]