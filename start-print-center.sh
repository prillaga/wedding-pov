#!/bin/bash
# Prillaga Wedding POV — Instant Print Center (port 3001, avoids Marshmallow on 3000)
cd "$(dirname "$0")"

ARCH=$(uname -m)
NODE_ARCH=$([ "$ARCH" = "arm64" ] && echo "arm64" || echo "x64")
NODE_DIR="/tmp/node-v22.16.0-darwin-${NODE_ARCH}"

if [ ! -f "$NODE_DIR/bin/node" ]; then
  echo "Downloading Node.js (first time only)..."
  curl -fsSL "https://nodejs.org/dist/v22.16.0/node-v22.16.0-darwin-${NODE_ARCH}.tar.gz" | tar xz -C /tmp
fi

export PATH="$NODE_DIR/bin:$PATH"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo ""
echo "  Prillaga Wedding POV — Instant Print Center"
echo "  Open: http://localhost:3001/admin/print-center"
echo "  (Port 3001 — Marshmallow uses 3000)"
echo ""

npm run dev:3001
