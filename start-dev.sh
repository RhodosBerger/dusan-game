#!/bin/bash
# Zjednodušené spustenie hry bez Go Core (stačí Node.js).
# Použitie: ./start-dev.sh  |  Ukončenie: Ctrl+C

cd "$(dirname "$0")"

# Prvé spustenie: nainštaluj závislosti a zbuilduj shared balík
if [ ! -d node_modules ]; then
    echo "[SETUP] Inštalujem závislosti (len prvýkrát)..."
    yarn install || exit 1
fi
if [ ! -d packages/shared/dist ]; then
    echo "[SETUP] Buildujem shared balík (len prvýkrát)..."
    yarn workspace @dusan-game/shared build || exit 1
fi

cleanup() {
    echo ""
    echo "[STOP] Ukončujem všetky služby..."
    kill $SERVER_PID $CLIENT_PID $GO_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Go Core (voliteľné) — spustí sa, len ak je Go nainštalované a port 8081 voľný
if command -v go >/dev/null 2>&1; then
    if lsof -nP -iTCP:8081 -sTCP:LISTEN >/dev/null 2>&1; then
        echo "[GO CORE] Port 8081 je obsadený iným programom — hra pobeží bez Go Core (má fallback)."
    else
        echo "[GO CORE] Spúšťam Go Core (port 8081)..."
        (cd packages/go-core && go run main.go) > go-core.log 2>&1 &
        GO_PID=$!
    fi
else
    echo "[GO CORE] Go nie je nainštalované — hra pobeží bez Go Core (má fallback)."
fi

echo "[SERVER] Spúšťam herný server (port 3001)..."
yarn workspace @dusan-game/server dev > server.log 2>&1 &
SERVER_PID=$!

echo "[KLIENT] Spúšťam hru..."
yarn workspace client dev 2>&1 | tee client.log &
CLIENT_PID=$!

echo ""
echo "=================================================="
echo "  Hra sa spúšťa — otvor adresu, ktorú vypíše Vite"
echo "  (riadok 'Local: http://localhost:51xx')"
echo "  Ukončenie: Ctrl+C"
echo "=================================================="

wait
