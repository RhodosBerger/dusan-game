#!/bin/bash
# Simple script to serve the pre-built Dušan Game client

echo "Starting Dušan Game client server..."
echo "Serving pre-built client from packages/client/dist/"
echo "Game will be available at: http://localhost:5173"
echo ""
echo "Note: This only serves the static client."
echo "For full gameplay, you need:"
echo "  1. Node.js/npm to run the server (packages/server/)"
echo "  2. PHP to run the Laravel backend (laravel_app/)"
echo "  3. Working Go core binary (packages/go-core/go-core)"
echo ""
echo "Press Ctrl+C to stop the server."
echo ""

# Serve the pre-built client
cd packages/client/dist && python3 -m http.server 5173