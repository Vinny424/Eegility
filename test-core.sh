#!/bin/bash

echo "🔧 Testing Eegility Core Services (Backend + Frontend + MongoDB)"
echo "=============================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "🧹 Cleaning up any existing containers..."
docker-compose -f docker-compose.core.yml down --volumes 2>/dev/null

echo ""
echo "🏗️  Building core services (this may take a few minutes)..."

# Build backend
echo "Building Backend C#..."
docker-compose -f docker-compose.core.yml build --no-cache backend
if [ $? -eq 0 ]; then
    print_status 0 "Backend C# built successfully"
else
    print_status 1 "Backend C# build failed"
    exit 1
fi

# Build frontend
echo "Building Frontend React..."
docker-compose -f docker-compose.core.yml build --no-cache frontend
if [ $? -eq 0 ]; then
    print_status 0 "Frontend React built successfully"
else
    print_status 1 "Frontend React build failed"
    exit 1
fi

echo ""
echo "🚀 Starting core services..."
docker-compose -f docker-compose.core.yml up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 15

echo ""
echo "🩺 Checking service health..."

# Check MongoDB
if docker-compose -f docker-compose.core.yml ps mongodb | grep -q "healthy"; then
    print_status 0 "MongoDB is healthy"
else
    print_status 1 "MongoDB is not healthy"
fi

# Check Backend
if docker-compose -f docker-compose.core.yml ps backend | grep -q "healthy"; then
    print_status 0 "Backend C# is healthy"
else
    print_status 1 "Backend C# is not healthy"
fi

# Check Frontend
if docker-compose -f docker-compose.core.yml ps frontend | grep -q "healthy"; then
    print_status 0 "Frontend React is healthy"
else
    print_status 1 "Frontend React is not healthy"
fi

echo ""
echo "📊 Core Service Status:"
docker-compose -f docker-compose.core.yml ps

echo ""
echo "🌐 Service URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5001"
echo "MongoDB: localhost:27018"

echo ""
print_warning "Core services test complete!"
print_warning "Use 'docker-compose -f docker-compose.core.yml logs [service-name]' to view logs."
print_warning "Use 'docker-compose -f docker-compose.core.yml down' to stop services."