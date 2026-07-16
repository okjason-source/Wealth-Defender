#!/usr/bin/env bash
# Stop Wealth Defender
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
PORT=3044
PID_FILE="$ROOT/.wealth-defender.pid"

kill_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Stopping processes on port $port (PIDs: $pids)..."
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 0.5
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$pids" ]]; then
      # shellcheck disable=SC2086
      kill -9 $pids 2>/dev/null || true
    fi
  else
    echo "Nothing listening on port $port."
  fi
}

if [[ -f "$PID_FILE" ]]; then
  echo "Stopping from PID file..."
  while read -r pid; do
    [[ -z "$pid" ]] && continue
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping PID $pid..."
      kill "$pid" 2>/dev/null || true
    fi
  done < "$PID_FILE"
  sleep 0.5
  while read -r pid; do
    [[ -z "$pid" ]] && continue
    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
fi

kill_port "$PORT"
echo "Wealth Defender stopped."
