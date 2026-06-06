#!/bin/bash
# Double-click this file in Finder to run Wedding POV in Safari (not Cursor).

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR" || exit 1

if ! command -v npm >/dev/null 2>&1; then
  export PATH="/tmp/node-v22.14.0-darwin-x64/bin:$PATH"
fi

# Always open offline demo first — works instantly with no server
open -a Safari "file://$DIR/WeddingPOV.html"

if ! command -v npm >/dev/null 2>&1; then
  osascript -e 'display alert "Node.js not found" message "The offline demo is open in Safari. Install Node from https://nodejs.org for the full app."'
  exit 0
fi

PORT=3001
while lsof -i :"$PORT" >/dev/null 2>&1; do
  PORT=$((PORT + 1))
done

if [ ! -d node_modules ]; then
  npm install
fi

echo "Starting full Wedding POV app on http://localhost:$PORT"
npm run dev -- --port "$PORT" &
SERVER_PID=$!

echo "Waiting for server (first launch may take up to 90 seconds)..."
READY=0
for i in $(seq 1 90); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/wedding/prillaga-wedding-2026" 2>/dev/null || echo "000")
  if echo "$CODE" | grep -q "200"; then
    BODY=$(curl -s "http://localhost:$PORT/wedding/prillaga-wedding-2026" 2>/dev/null || echo "")
    if echo "$BODY" | grep -q "Join Event"; then
      READY=1
      break
    fi
  fi
  sleep 1
done

if [ "$READY" = "1" ]; then
  open -a Safari "http://localhost:$PORT/wedding/prillaga-wedding-2026"
else
  osascript -e 'display alert "Full app still compiling" message "The offline demo is already open in Safari. When ready, visit http://localhost:'"$PORT"'/wedding/prillaga-wedding-2026"'
fi

echo ""
echo "Offline demo: file://$DIR/WeddingPOV.html"
echo "Full app:     http://localhost:$PORT/wedding/prillaga-wedding-2026"
echo "Admin:        http://localhost:$PORT/dashboard"
echo "Press Ctrl+C in Terminal to stop the dev server."
wait $SERVER_PID
