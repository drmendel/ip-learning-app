#!/usr/bin/env bash
# Start the Képfeldolgozás practice app (Node ≥ 20 or Deno ≥ 2) and open it in the browser.
set -e
cd "$(dirname "$0")"
PORT="${PORT:-8766}"
( for _ in $(seq 1 40); do
    if curl -s "http://localhost:$PORT/api/health" >/dev/null 2>&1; then
      (command -v xdg-open >/dev/null && xdg-open "http://localhost:$PORT") || (command -v open >/dev/null && open "http://localhost:$PORT") || true
      break
    fi
    sleep 0.5
  done ) >/dev/null 2>&1 &
if command -v node >/dev/null; then PORT="$PORT" exec node server.js; fi
if command -v deno >/dev/null; then PORT="$PORT" exec deno run -A server.js; fi
echo "Install Node.js ≥ 20 (or Deno ≥ 2) first." >&2; exit 1
