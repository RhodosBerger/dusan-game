#!/bin/bash
# deploy-matrix.sh
# Production multi-technology compilation and container orchestration pipeline

set -e

echo "[DEVOPS] Initializing monorepo compilation matrix..."

# 1. Build Shared package
echo "[DEVOPS] Building @dusan-game/shared workspace..."
yarn workspace @dusan-game/shared build

# 2. Build Client assets
echo "[DEVOPS] Building client static assets..."
yarn workspace client build

# 3. Build Go Core microservice binary locally (Go/C++/Rust sandbox compilation path check)
if command -v go &> /dev/null; then
    echo "[DEVOPS] Compiling packages/go-core executable..."
    go build -o packages/go-core/go-core packages/go-core/main.go
else
    echo "[DEVOPS] Go compiler not found, skipping local binary build."
fi

# 4. Build Docker container images
if command -v docker &> /dev/null; then
    echo "[DEVOPS] Executing Docker multi-container compilation..."
    docker compose build
else
    echo "[DEVOPS] Docker engine not found, skipping container build."
fi

echo "[DEVOPS] Monorepo compilation matrix finished successfully!"
