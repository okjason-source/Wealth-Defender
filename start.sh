#!/usr/bin/env bash
# Start Wealth Defender (Vite dev server)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT=3044
PID_FILE="$ROOT/.wealth-defender.pid"
DEV_PID=""

cleanup() {
  echo ""
  echo "Shutting down..."
  [[ -n "$DEV_PID" ]] && kill "$DEV_PID" 2>/dev/null || true
  rm -f "$PID_FILE"
  wait 2>/dev/null || true
  echo "Stopped."
}
trap cleanup EXIT INT TERM

cd "$ROOT"

if [[ ! -d node_modules/vite ]]; then
  echo "Installing dependencies..."
  npm install
fi

BROWSER=none npm run dev -- --port "$PORT" --strictPort &
DEV_PID=$!
echo "$DEV_PID" > "$PID_FILE"

echo "Starting Wealth Defender..."
echo "  Game: http://localhost:$PORT"
for _ in $(seq 1 60); do
  if curl -sf "http://localhost:$PORT" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
open "http://localhost:$PORT" 2>/dev/null || true

echo "Press Ctrl+C to stop."
wait
