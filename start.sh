#!/usr/bin/env bash
# Waits for the Docker daemon to be ready, then brings up the full compose stack.
set -euo pipefail

echo "[start.sh] Waiting for Docker daemon..."
until docker info >/dev/null 2>&1; do
  sleep 1
done
echo "[start.sh] Docker daemon is ready."

cd /app

echo "[start.sh] Starting all services with docker-compose..."
docker-compose up -d --build

echo "[start.sh] All services started. Tailing compose logs..."
# Stream logs so Railway's log viewer shows application output
exec docker-compose logs -f
