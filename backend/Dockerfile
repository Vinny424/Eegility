# Backend Dockerfile
FROM node:16-alpine

# Create app directory
WORKDIR /app

# Install system dependencies for Python and build tools
RUN apk add --no-cache python3 make g++ pkgconfig build-base

# Install app dependencies
COPY package*.json ./
RUN npm install --production

# For development, we also install dev dependencies
# RUN npm install

# Bundle app source
COPY . .

# Expose the API port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]