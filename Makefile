# MapMyMoments - Unified Development Makefile
# Run the entire application stack locally with one command

.PHONY: help install dev dev-frontend dev-backend build clean setup stop logs test lint format deps check-deps

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Project directories
BACKEND_DIR := mapmymoments-BE
FRONTEND_DIR := mapmymoments-FE

##@ Development Commands

help: ## Display this help message
	@echo "$(GREEN)MapMyMoments Development Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

dev: setup ## 🚀 Start the full development environment (Backend + Frontend)
	@echo "$(GREEN)🚀 Starting MapMyMoments development environment...$(NC)"
	@./dev-server.sh

dev-backend: ## 🔧 Start only the backend server
	@echo "$(GREEN)🔧 Starting backend server on localhost:8080...$(NC)"
	@cd $(BACKEND_DIR) && make run

dev-frontend: ## 🎨 Start only the frontend server
	@echo "$(GREEN)🎨 Starting frontend server on https://localhost:3000...$(NC)"
	@cd $(FRONTEND_DIR) && npm run dev

##@ Setup & Installation

setup: check-deps install build-backend ## 🔨 Complete project setup (install deps + build backend)
	@echo "$(GREEN)✅ Setup complete! Ready for development.$(NC)"

install: install-frontend ## 📦 Install all dependencies
	@echo "$(GREEN)📦 All dependencies installed!$(NC)"

install-frontend: ## Install frontend dependencies
	@echo "$(YELLOW)📦 Installing frontend dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && npm install

install-backend: ## Install backend dependencies
	@echo "$(YELLOW)📦 Installing backend dependencies...$(NC)"
	@cd $(BACKEND_DIR) && go mod download && go mod tidy

##@ Build Commands

build: build-backend build-frontend ## 🔨 Build both frontend and backend

build-backend: ## Build backend binary
	@echo "$(YELLOW)🔨 Building backend...$(NC)"
	@cd $(BACKEND_DIR) && make build

build-frontend: ## Build frontend for production
	@echo "$(YELLOW)🔨 Building frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run build

build-frontend-dev: ## Build frontend for development
	@echo "$(YELLOW)🔨 Building frontend (development mode)...$(NC)"
	@cd $(FRONTEND_DIR) && npm run build:dev

##@ Testing & Quality

test: test-backend test-frontend ## 🧪 Run all tests

test-backend: ## Run backend tests
	@echo "$(YELLOW)🧪 Running backend tests...$(NC)"
	@cd $(BACKEND_DIR) && make test

test-frontend: ## Run frontend tests/linting
	@echo "$(YELLOW)🧪 Running frontend linting...$(NC)"
	@cd $(FRONTEND_DIR) && npm run lint

lint: ## 🔍 Run linting for the entire project
	@echo "$(YELLOW)🔍 Linting project...$(NC)"
	@cd $(FRONTEND_DIR) && npm run lint
	@echo "$(GREEN)✅ Linting complete!$(NC)"

##@ Environment Management

env-check: ## 🔍 Check environment configuration
	@echo "$(YELLOW)🔍 Checking environment configuration...$(NC)"
	@echo "Frontend environment files:"
	@ls -la $(FRONTEND_DIR)/.env* 2>/dev/null || echo "  No .env files found"
	@echo "\nBackend configuration:"
	@ls -la $(BACKEND_DIR)/config/local.yaml 2>/dev/null || echo "  No local.yaml found"
	@echo "\n$(GREEN)Environment check complete!$(NC)"

env-setup: ## 🔧 Setup environment files with local development defaults
	@echo "$(YELLOW)🔧 Setting up local development environment...$(NC)"
	@if [ ! -f $(FRONTEND_DIR)/.env.development ]; then \
		echo "Creating frontend .env.development..."; \
		echo "VITE_API_BASE_URL=http://localhost:8080" > $(FRONTEND_DIR)/.env.development; \
		echo "VITE_GOOGLE_MAPS_API_KEY=\"AIzaSyDPRWyEVasy7zo_MvEU67Ijwrv4af1R-7E\"" >> $(FRONTEND_DIR)/.env.development; \
	fi
	@echo "$(GREEN)✅ Environment setup complete!$(NC)"

##@ Database & Services

db-status: ## 📊 Check database connection status
	@echo "$(YELLOW)📊 Checking database status...$(NC)"
	@echo "MongoDB URI configured in $(BACKEND_DIR)/config/local.yaml"
	@echo "Local SQLite DB: $(BACKEND_DIR)/storage/storage.db"
	@ls -la $(BACKEND_DIR)/storage/storage.db 2>/dev/null || echo "  SQLite DB not found (will be created on first run)"

##@ Utility Commands

clean: clean-backend clean-frontend ## 🧹 Clean all build artifacts and dependencies

clean-backend: ## Clean backend build artifacts
	@echo "$(YELLOW)🧹 Cleaning backend...$(NC)"
	@cd $(BACKEND_DIR) && make clean

clean-frontend: ## Clean frontend build artifacts and dependencies
	@echo "$(YELLOW)🧹 Cleaning frontend...$(NC)"
	@cd $(FRONTEND_DIR) && rm -rf dist node_modules package-lock.json

clean-all: clean ## 🧹 Deep clean (removes all generated files)
	@echo "$(YELLOW)🧹 Deep cleaning project...$(NC)"
	@rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/node_modules
	@rm -rf $(BACKEND_DIR)/bin $(BACKEND_DIR)/storage/storage.db

##@ Development Utilities

logs: ## 📋 Show application logs (if running in background)
	@echo "$(YELLOW)📋 Recent application logs:$(NC)"
	@echo "Backend logs:"
	@tail -n 20 $(BACKEND_DIR)/app.log 2>/dev/null || echo "  No backend logs found"
	@echo "\nFrontend logs:"
	@tail -n 20 $(FRONTEND_DIR)/dist/app.log 2>/dev/null || echo "  No frontend logs found"

restart: stop dev ## 🔄 Restart the development environment

stop: ## ⏹️  Stop all running development servers
	@echo "$(YELLOW)⏹️  Stopping development servers...$(NC)"
	@pkill -f "routes-api" 2>/dev/null || true
	@pkill -f "vite" 2>/dev/null || true
	@pkill -f "npm.*dev" 2>/dev/null || true
	@echo "$(GREEN)✅ Development servers stopped!$(NC)"

##@ Dependency Management

check-deps: ## ✅ Check if required dependencies are installed
	@echo "$(YELLOW)✅ Checking dependencies...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)❌ Node.js is required but not installed. Please install Node.js first.$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)❌ npm is required but not installed. Please install npm first.$(NC)"; exit 1; }
	@command -v go >/dev/null 2>&1 || { echo "$(RED)❌ Go is required but not installed. Please install Go first.$(NC)"; exit 1; }
	@echo "$(GREEN)✅ All required dependencies are installed!$(NC)"

deps: install ## 📦 Alias for install command

##@ Information

status: ## 📊 Show project status
	@echo "$(GREEN)📊 MapMyMoments Project Status$(NC)"
	@echo "================================"
	@echo "Backend Directory: $(BACKEND_DIR)"
	@echo "Frontend Directory: $(FRONTEND_DIR)"
	@echo ""
	@echo "Backend Status:"
	@cd $(BACKEND_DIR) && ls -la bin/routes-api 2>/dev/null && echo "  ✅ Backend binary built" || echo "  ❌ Backend not built (run 'make build-backend')"
	@echo ""
	@echo "Frontend Status:"
	@cd $(FRONTEND_DIR) && ls -la node_modules 2>/dev/null >/dev/null && echo "  ✅ Frontend dependencies installed" || echo "  ❌ Frontend dependencies not installed (run 'make install-frontend')"
	@cd $(FRONTEND_DIR) && ls -la dist 2>/dev/null >/dev/null && echo "  ✅ Frontend built" || echo "  ❌ Frontend not built (run 'make build-frontend')"

##@ Quick Start

quick-start: ## 🚀 Complete setup and start development (recommended for first time)
	@echo "$(GREEN)🚀 MapMyMoments Quick Start$(NC)"
	@echo "============================="
	@$(MAKE) setup
	@echo ""
	@echo "$(GREEN)🎉 Setup complete! Starting development servers...$(NC)"
	@$(MAKE) dev

##@ Production

prod-build: ## 🏭 Build for production
	@echo "$(YELLOW)🏭 Building for production...$(NC)"
	@$(MAKE) build-backend
	@$(MAKE) build-frontend
	@echo "$(GREEN)✅ Production build complete!$(NC)"

##@ Development Info

info: ## ℹ️  Show development information
	@echo "$(GREEN)ℹ️  MapMyMoments Development Information$(NC)"
	@echo "========================================"
	@echo ""
	@echo "🌐 Local URLs:"
	@echo "  Frontend: https://localhost:3000"
	@echo "  Backend:  http://localhost:8080"
	@echo ""
	@echo "📁 Project Structure:"
	@echo "  Backend:  ./$(BACKEND_DIR)/"
	@echo "  Frontend: ./$(FRONTEND_DIR)/"
	@echo ""
	@echo "🔧 Common Commands:"
	@echo "  make dev          - Start full development environment"
	@echo "  make dev-frontend - Start only frontend"
	@echo "  make dev-backend  - Start only backend"
	@echo "  make build        - Build both applications"
	@echo "  make test         - Run all tests"
	@echo "  make clean        - Clean build artifacts"
	@echo ""
	@echo "💡 First time setup:"
	@echo "  make quick-start  - Complete setup and start development"