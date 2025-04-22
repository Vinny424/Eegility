FROM node:23-slim

# Create app directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all other files (excluding what's in .dockerignore)
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["node", "server.js"]