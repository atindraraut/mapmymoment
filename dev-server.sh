#!/bin/bash

# MapMyMoments Development Server Script
# This script starts both frontend and backend servers concurrently

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to handle cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development servers...${NC}"
    
    # Kill background processes
    if [[ -n $BACKEND_PID ]]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    fi
    
    if [[ -n $FRONTEND_PID ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend server stopped${NC}"
    fi
    
    # Also kill any remaining processes
    pkill -f "routes-api" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    echo -e "${GREEN}🎯 All development servers stopped!${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo -e "${BLUE}🚀 Starting MapMyMoments Development Environment${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if directories exist
if [[ ! -d "mapmymoments-BE" ]]; then
    echo -e "${RED}❌ Backend directory not found. Please run from project root.${NC}"
    exit 1
fi

if [[ ! -d "mapmymoments-FE" ]]; then
    echo -e "${RED}❌ Frontend directory not found. Please run from project root.${NC}"
    exit 1
fi

# Start backend server
echo -e "${YELLOW}🔧 Starting backend server...${NC}"
cd mapmymoments-BE
make run > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✅ Backend server started (PID: $BACKEND_PID) - Logs: backend.log${NC}"

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo -e "${YELLOW}🎨 Starting frontend server...${NC}"
cd mapmymoments-FE
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✅ Frontend server started (PID: $FRONTEND_PID) - Logs: frontend.log${NC}"

echo ""
echo -e "${BLUE}🌐 Development servers are running:${NC}"
echo -e "${GREEN}  Frontend: https://localhost:3000${NC}"
echo -e "${GREEN}  Backend:  http://localhost:8080${NC}"
echo ""
echo -e "${YELLOW}📋 Live logs (press Ctrl+C to stop all servers):${NC}"
echo -e "${BLUE}================================================${NC}"

# Follow logs from both servers
tail -f backend.log frontend.log 2>/dev/null &
TAIL_PID=$!

# Wait for user to stop
wait $BACKEND_PID $FRONTEND_PID