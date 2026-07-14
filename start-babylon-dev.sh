#!/bin/bash
# Spustenie hry s Babylon.js viewportom a novým reproduced backendom.
# Použitie: ./start-babylon-dev.sh  |  Ukončenie: Ctrl+C

cd "$(dirname "$0")"

# Zaisti, že shared balík je zbuildovaný
if [ ! -d packages/shared/dist ]; then
    echo "[SETUP] Buildujem shared balík..."
    yarn workspace @dusan-game/shared build || exit 1
fi

cleanup() {
    echo ""
    echo "[STOP] Ukončujem Babylon Sovereign služby..."
    kill $SERVER_PID $CLIENT_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "[SERVER] Spúšťam nový herný server (port 3005)..."
yarn workspace @dusan-game/babylon-sovereign dev:server > babylon-server.log 2>&1 &
SERVER_PID=$!

echo "[KLIENT] Spúšťam Babylon.js klienta (port 8085)..."
yarn workspace @dusan-game/babylon-sovereign dev:client &
CLIENT_PID=$!

echo ""
echo "=================================================="
      echo "  Sovereign Engine v3.0 (BabylonJS Edition)  "
      echo "  Klient beží na: http://localhost:8085"
      echo "  Ukončenie: Ctrl+C"
echo "=================================================="

wait
