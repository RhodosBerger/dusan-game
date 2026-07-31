#!/bin/bash

# ANSI Color Codes
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}==================================================================${NC}"
echo -e "${CYAN}      SOVEREIGN ENGINE - FULL ENVIRONMENT ORCHESTRATOR           ${NC}"
echo -e "${CYAN}==================================================================${NC}"

# Ensure Python Virtual Environment exists and is fully synchronized
./packages/server/scripts/bootstrap-python.sh
if [ $? -ne 0 ]; then
    echo -e "${RED}[ML SETUP ERROR] Python virtual environment bootstrap failed.${NC}"
    exit 1
fi

# Build all typescript workspaces first
echo -e "${YELLOW}[BUILD] Compiling all packages and workspaces...${NC}"
yarn workspace @dusan-game/shared build && yarn workspace @dusan-game/server build && yarn workspace client build
if [ $? -ne 0 ]; then
    echo -e "${RED}[BUILD ERROR] Workspace compilation failed! Resolve TS errors first.${NC}"
    exit 1
fi
echo -e "${GREEN}[BUILD] Compilation completed successfully.${NC}"

# Function to clean up background processes on exit
cleanup() {
    echo -e "\n${RED}[STOP] Terminating all environment processes...${NC}"
    kill $GO_PID 2>/dev/null
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    echo -e "${GREEN}[STOP] All services stopped clean. Goodbye!${NC}"
    exit 0
}

# Trap Ctrl+C (SIGINT), SIGTERM
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Go Core Microservice (Port 8081)
echo -e "${PURPLE}[GO CORE] Launching Go Core microservice on port 8081...${NC}"
./start-go.sh > go-core.log 2>&1 &
GO_PID=$!

# 2. Start Node.js Express API Server (Port 3000)
echo -e "${PURPLE}[EXPRESS SERVER] Launching Express server on port 3000...${NC}"
yarn workspace @dusan-game/server dev > express-server.log 2>&1 &
SERVER_PID=$!

# 3. Start Vite React Client (Port 5173)
echo -e "${PURPLE}[VITE CLIENT] Launching React R3F client on http://localhost:5173...${NC}"
yarn workspace client dev > vite-client.log 2>&1 &
CLIENT_PID=$!

echo -e "${GREEN}==================================================================${NC}"
echo -e "${GREEN}  ALL SERVICES ARE RUNNING IN THE BACKGROUND:${NC}"
echo -e "  - ${CYAN}Vite Frontend:${NC}   http://localhost:5173 (Log: vite-client.log)"
echo -e "  - ${CYAN}Express Server:${NC}  http://localhost:3000 (Log: express-server.log)"
echo -e "  - ${CYAN}Go Core API:${NC}     http://localhost:8081 (Log: go-core.log)"
echo -e "${GREEN}==================================================================${NC}"
echo -e "${YELLOW}Press Ctrl+C to terminate all services simultaneously.${NC}"

# Keep the script running to keep trapping signals
while true; do
    sleep 1
done
