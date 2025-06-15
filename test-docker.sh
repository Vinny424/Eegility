#!/bin/bash

echo "🔧 Testing Eegility Core Services (EEG Processor Disabled)"
echo "=========================================================="

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

echo "🔍 Checking required files..."

# Check if docker-compose.yml exists
if [ -f "docker-compose.yml" ]; then
    print_status 0 "docker-compose.yml found"
else
    print_status 1 "docker-compose.yml not found"
    exit 1
fi

# Check if Dockerfiles exist
if [ -f "backend-csharp/Dockerfile" ]; then
    print_status 0 "Backend C# Dockerfile found"
else
    print_status 1 "Backend C# Dockerfile not found"
fi

if [ -f "frontend-react/Dockerfile" ]; then
    print_status 0 "Frontend React Dockerfile found"
else
    print_status 1 "Frontend React Dockerfile not found"
fi

echo ""
echo "🧹 Cleaning up any existing containers..."
docker-compose down --volumes 2>/dev/null

echo ""
echo "🏗️  Building services..."
echo "This may take several minutes, especially on first build..."

# Build services individually to better isolate issues
echo "Building MongoDB (using official image)..."
print_status 0 "MongoDB ready (official image)"

echo "Building Backend C#..."
docker-compose build --no-cache backend
if [ $? -eq 0 ]; then
    print_status 0 "Backend C# built successfully"
else
    print_status 1 "Backend C# build failed"
    echo "📋 Backend build logs:"
    docker-compose logs backend
    exit 1
fi

echo "Building Frontend React..."
docker-compose build --no-cache frontend
if [ $? -eq 0 ]; then
    print_status 0 "Frontend React built successfully"
else
    print_status 1 "Frontend React build failed"
    echo "📋 Frontend build logs:"
    docker-compose logs frontend
    exit 1
fi

print_warning "EEG Processor is disabled in the current configuration"
print_status 0 "All core services built successfully"

echo ""
echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🩺 Checking service health..."

# Check MongoDB
if docker-compose ps mongodb | grep -q "healthy"; then
    print_status 0 "MongoDB is healthy"
else
    print_status 1 "MongoDB is not healthy"
fi

# Check Backend
if docker-compose ps backend | grep -q "healthy"; then
    print_status 0 "Backend C# is healthy"
else
    print_status 1 "Backend C# is not healthy"
fi

# Check Frontend
if docker-compose ps frontend | grep -q "healthy"; then
    print_status 0 "Frontend React is healthy"
else
    print_status 1 "Frontend React is not healthy"
fi

echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Service URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5001"
echo "MongoDB: localhost:27018"

echo ""
print_warning "Test complete! Check the output above for any issues."
print_warning "Use 'docker-compose logs [service-name]' to view logs if needed."
print_warning "Use 'docker-compose down' to stop all services."