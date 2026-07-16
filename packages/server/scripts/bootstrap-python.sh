#!/bin/bash
# Reusable Python bootstrap script to synchronize dependencies in virtual environment.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
VENV_DIR="$PROJECT_ROOT/packages/server/.venv"
REQ_FILE="$PROJECT_ROOT/packages/server/requirements.txt"

echo -e "\033[36m[ML BOOTSTRAP] Auditing Python virtual environment at $VENV_DIR...\033[0m"

# 1. Create virtualenv if missing
if [ ! -d "$VENV_DIR" ]; then
    echo -e "\033[33m[ML BOOTSTRAP] Virtual environment missing. Initializing...\033[0m"
    python3 -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        echo -e "\033[31m[ML BOOTSTRAP ERROR] Failed to create virtual environment. Please install python3-venv.\033[0m"
        exit 1
    fi
fi

# 2. Check if pip is available
PIP_CMD="$VENV_DIR/bin/pip"
if [ ! -f "$PIP_CMD" ]; then
    echo -e "\033[31m[ML BOOTSTRAP ERROR] pip binary not found in virtual environment.\033[0m"
    exit 1
fi

# 3. Synchronize requirements.txt
echo -e "\033[33m[ML BOOTSTRAP] Synchronizing packages from requirements.txt...\033[0m"
"$PIP_CMD" install --upgrade pip
"$PIP_CMD" install -r "$REQ_FILE"
if [ $? -ne 0 ]; then
    echo -e "\033[31m[ML BOOTSTRAP ERROR] Failed to synchronize python dependencies.\033[0m"
    exit 1
fi

echo -e "\033[32m[ML BOOTSTRAP] Python virtual environment is healthy and ready.\033[0m"
exit 0
