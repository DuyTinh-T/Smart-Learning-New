#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Learning Platform Services...${NC}\n"

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${BLUE}⚠️  Redis is not running. Please start Redis first.${NC}"
    echo "Run: sudo service redis-server start"
    exit 1
fi

echo -e "${GREEN}✅ Redis is running${NC}"

# Start Socket.IO server in background
echo -e "${BLUE}📡 Starting Socket.IO server on port 4000...${NC}"
cd socket-server && npm start &
SOCKET_PID=$!

# Wait for socket server to start
sleep 3

# Start Next.js app
echo -e "${BLUE}🌐 Starting Next.js app on port 3000...${NC}"
cd ..
npm run dev &
NEXT_PID=$!

echo -e "\n${GREEN}✅ All services started!${NC}"
echo -e "${BLUE}Socket.IO Server: http://localhost:4000${NC}"
echo -e "${BLUE}Next.js App: http://localhost:3000${NC}"
echo -e "\n${BLUE}Press Ctrl+C to stop all services${NC}\n"

# Wait for user interrupt
trap "echo -e '\n${BLUE}🛑 Stopping services...${NC}'; kill $SOCKET_PID $NEXT_PID; exit" INT
wait
