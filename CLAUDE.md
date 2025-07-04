# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MapMyMoments is a full-stack web application that allows users to create, store, and share journey routes with photos. The application consists of:

- **Backend (mapmymoments-BE)**: Go API server with MongoDB storage
- **Frontend (mapmymoments-FE)**: React/TypeScript PWA with Google Maps integration

## Development Commands

### Backend Commands
```bash
# Navigate to backend directory
cd mapmymoments-BE

# Run the application in development mode
make run

# Build the application
make build

# Run tests
make test

# Clean build artifacts
make clean

# Run with custom config
go run cmd/routes-api/main.go -config config/local.yaml
```

### Frontend Commands
```bash
# Navigate to frontend directory
cd mapmymoments-FE

# Install dependencies
npm install

# Run development server (HTTPS on port 3000)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Backend Architecture
The Go backend follows a clean architecture pattern:

- **Entry Point**: `cmd/routes-api/main.go` - Application bootstrapping with graceful shutdown
- **Configuration**: `internal/config/` - YAML-based configuration management
- **HTTP Layer**: `internal/http/handlers/` - Route handlers organized by domain:
  - `public/` - Public endpoints (no auth required)
  - `user/` - User authentication and management
  - `routes/` - Route CRUD operations
- **Storage Layer**: `storage/` - Database abstraction with MongoDB and SQLite implementations
- **Types**: `internal/types/` - Shared data structures
- **Middleware**: `internal/utils/middleware/` - CORS, rate limiting, request timing
- **Utilities**: `internal/utils/` - Authentication helpers, response formatting, S3 utils

### Frontend Architecture
The React frontend is built with modern tooling:

- **Build Tool**: Vite with React SWC plugin
- **Routing**: React Router v6 with lazy loading
- **State Management**: Redux Toolkit + React Query for server state
- **UI Components**: shadcn/ui components built on Radix UI primitives
- **Maps**: Google Maps integration via `@vis.gl/react-google-maps`
- **Styling**: Tailwind CSS with custom theme
- **PWA**: Service worker with offline support and install prompts

### Data Flow
1. Frontend makes authenticated API requests to backend
2. Backend validates JWT tokens and processes requests
3. Data is stored in MongoDB with route information and metadata
4. Photos are uploaded to S3 via signed URLs
5. Frontend caches responses using React Query

## Key Features

### Authentication
- JWT-based authentication with refresh tokens
- Password reset functionality via email OTP
- Token refresh handled automatically in API layer

### Route Management
- Create routes with origin, destination, and waypoints
- Upload and associate photos with routes
- S3 integration for scalable photo storage
- Route sharing and details view

### Maps Integration
- Google Maps API for route visualization
- Marker clustering and custom overlays
- Geocoding for address to coordinates conversion

## Environment Setup

### Backend Environment
Required configuration in `config/local.yaml`:
- MongoDB connection string
- JWT secret key
- S3 bucket configuration
- OAuth client credentials

### Frontend Environment
Required environment variables:
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `VITE_API_BASE_URL` - Backend API URL (defaults to http://localhost:8080)

## Testing

### Backend Tests
```bash
cd mapmymoments-BE
make test
```

### Frontend Tests
The frontend uses ESLint for code quality. Run linting with:
```bash
cd mapmymoments-FE
npm run lint
```

## Development Workflow

1. **Backend Development**: 
   - Start MongoDB instance
   - Update `config/local.yaml` with credentials
   - Run `make run` for hot reloading

2. **Frontend Development**:
   - Ensure backend is running on port 8080
   - Set environment variables for Google Maps API
   - Run `npm run dev` for development server with HTTPS

3. **Database Changes**:
   - Update models in `storage/mongodb/` 
   - Update corresponding types in `internal/types/`
   - Update storage interface in `storage/storage.go`

4. **API Changes**:
   - Update handlers in `internal/http/handlers/`
   - Update frontend API client in `src/lib/api.ts`
   - Update TypeScript interfaces for type safety

## Common Issues

- **CORS Issues**: Ensure middleware is properly configured for frontend domain
- **Authentication**: Check JWT token expiration and refresh logic
- **Maps Loading**: Verify Google Maps API key has required permissions
- **S3 Upload**: Ensure AWS credentials and bucket policies are correctly configured