# MapMyMoments 🗺️✨

A full-stack travel journey documentation platform that allows users to create, document, and share their travel journeys by combining interactive maps with photo storytelling.

## 🚀 Quick Start

Get the entire application running locally with one command:

```bash
make quick-start
```

This will:
- ✅ Check dependencies
- 📦 Install all required packages
- 🔨 Build the backend
- 🚀 Start both frontend and backend servers

## 🌐 Local Development URLs

- **Frontend**: https://localhost:3000 (React PWA with HTTPS)
- **Backend**: http://localhost:8080 (Go API server)

## 📋 Available Commands

### 🔥 Most Used Commands

```bash
make dev          # Start full development environment
make dev-frontend # Start only frontend server
make dev-backend  # Start only backend server
make stop         # Stop all development servers
make status       # Check project status
```

### 📦 Setup & Installation

```bash
make setup        # Complete project setup
make install      # Install all dependencies
make check-deps   # Check if required tools are installed
```

### 🔨 Build Commands

```bash
make build        # Build both frontend and backend
make build-backend # Build only backend
make build-frontend # Build only frontend
make prod-build   # Build for production
```

### 🧪 Testing & Quality

```bash
make test         # Run all tests
make lint         # Run linting
make clean        # Clean build artifacts
```

### 🔧 Utilities

```bash
make help         # Show all available commands
make info         # Show development information
make env-check    # Check environment configuration
make restart      # Restart development servers
```

## 🏗️ Project Structure

```
mapmymoments/
├── mapmymoments-BE/          # Go backend API
│   ├── cmd/                  # Application entry points
│   ├── internal/             # Private application code
│   ├── storage/              # Database layer
│   ├── config/               # Configuration files
│   └── Makefile             # Backend-specific commands
├── mapmymoments-FE/          # React frontend PWA
│   ├── src/                  # Frontend source code
│   ├── public/               # Static assets
│   ├── package.json          # Frontend dependencies
│   └── vite.config.ts        # Vite configuration
├── Makefile                  # Root-level development commands
├── dev-server.sh            # Development server script
└── README.md                # This file
```

## 🛠️ Technology Stack

### Backend
- **Language**: Go 1.23+
- **Database**: MongoDB (primary) + SQLite (local)
- **Authentication**: JWT with refresh tokens
- **File Storage**: AWS S3 + CloudFront CDN
- **Email**: AWS SES

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Maps**: Google Maps API
- **State Management**: Redux Toolkit + React Query
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **PWA**: Service Worker + App Manifest

## 🔧 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (18.0+) and **npm**
- **Go** (1.23+)
- **Git**

Check dependencies:
```bash
make check-deps
```

## 🌍 Environment Configuration

### Development Environment

The application automatically uses local development settings:

- Frontend points to `http://localhost:8080` for API calls
- Backend serves on `localhost:8080`
- MongoDB connection configured in `mapmymoments-BE/config/local.yaml`

### Environment Files

- `mapmymoments-FE/.env.development` - Local development settings
- `mapmymoments-FE/.env` - Production settings
- `mapmymoments-BE/config/local.yaml` - Backend configuration

## 🎯 Key Features

### 🗺️ Journey Planning & Route Creation
- Interactive map-based route planning
- Google Places API integration
- Multiple waypoints support
- Turn-by-turn directions

### 📸 Photo Documentation
- Upload photos to AWS S3
- CloudFront CDN delivery
- Photo gallery with pagination
- Set cover photos for routes

### 👥 User Management
- JWT-based authentication
- Email verification with OTP
- Password reset functionality
- User profiles

### 🌐 Progressive Web App
- Installable on mobile devices
- Offline support
- Push notifications ready
- Responsive design

## 🔄 Development Workflow

### First Time Setup
```bash
# Clone the repository
git clone <repository-url>
cd mapmymoments

# Complete setup and start development
make quick-start
```

### Daily Development
```bash
# Start development servers
make dev

# In another terminal, check status
make status

# Stop servers when done
make stop
```

### Making Changes
```bash
# Frontend changes - hot reload automatically enabled
# Backend changes - restart backend only
make dev-backend

# Run tests
make test

# Build for production
make prod-build
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Stop all development servers
make stop

# Check what's using the ports
lsof -i :3000  # Frontend
lsof -i :8080  # Backend
```

### Environment Issues
```bash
# Check environment configuration
make env-check

# Reset environment
make env-setup
```

### Build Issues
```bash
# Clean and rebuild
make clean
make build
```

### Dependencies Issues
```bash
# Reinstall all dependencies
make clean
make install
```

## 📊 Monitoring Development

### View Live Logs
When using `make dev`, logs are saved to:
- `backend.log` - Backend server logs
- `frontend.log` - Frontend server logs

### Check Status
```bash
make status  # Project overview
make logs    # View recent logs
```

## 🚢 Production Deployment

```bash
# Build for production
make prod-build

# Files will be generated in:
# - mapmymoments-BE/bin/routes-api (backend binary)
# - mapmymoments-FE/dist/ (frontend static files)
```

## 🤝 Contributing

1. Make sure all tests pass: `make test`
2. Lint your code: `make lint`
3. Build successfully: `make build`
4. Test the development environment: `make dev`

## 📝 License

[Add your license information here]

## 🆘 Support

- Check `make help` for available commands
- View `make info` for development information
- Check logs with `make logs`
- Report issues in the repository issue tracker

---

**Happy Coding! 🚀✨**