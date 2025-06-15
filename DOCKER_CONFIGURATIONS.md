# Docker Configurations for Eegility

## Available Docker Compose Files

### 1. `docker-compose.yml` (Default - Core Services Only)
**Services included:**
- ✅ MongoDB (Database)
- ✅ Backend C# (.NET Core API) 
- ✅ Frontend React (Web Application)
- ❌ EEG Processor (Disabled)

**Usage:**
```bash
docker-compose up -d
```

**Best for:** Development, testing, and production when EEG processing is not needed yet.

### 2. `docker-compose.core.yml` (Minimal Core)
**Services included:**
- ✅ MongoDB (Database)
- ✅ Backend C# (.NET Core API)
- ✅ Frontend React (Web Application)

**Usage:**
```bash
docker-compose -f docker-compose.core.yml up -d
```

**Best for:** Quick testing and development of core functionality.

### 3. `docker-compose.full.yml` (All Services)
**Services included:**
- ✅ MongoDB (Database)
- ✅ Backend C# (.NET Core API)
- ✅ Frontend React (Web Application)  
- ✅ EEG Processor (Python ML Service)

**Usage:**
```bash
docker-compose -f docker-compose.full.yml up -d
```

**Best for:** When EEG processing functionality is needed and ready for testing.

## Testing Scripts

### Quick Core Test
```bash
./test-core.sh
```
Tests just the essential services (MongoDB + Backend + Frontend).

### Full Core Test  
```bash
./test-docker.sh
```
Tests the default configuration (core services with EEG processor disabled).

## Service URLs

When running any configuration:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **MongoDB:** localhost:27018

## Notes

- The EEG processor is currently disabled in the main configuration to avoid build issues
- All configurations use the same network and volumes for consistency
- Health checks ensure services start in the correct order
- The C# backend and React frontend are the core working components