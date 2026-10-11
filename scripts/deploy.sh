#!/usr/bin/env bash
# ==============================================================================
# DevCollab - Deployment Script for EC2
# ==============================================================================

set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/DevCollab}"

echo "🚀 Deploying DevCollab in $APP_DIR..."

cd "$APP_DIR"

# 1. Fetch latest changes from git
echo "📥 Pulling latest changes from git..."
git fetch origin master
git reset --hard origin/master

# 2. Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️ Warning: .env file not found in $APP_DIR! Please ensure .env is created."
fi

# 3. Build and launch containers
echo "🐳 Rebuilding and starting Docker containers..."
docker compose down || true
docker compose up -d --build --remove-orphans

# 4. Clean up dangling images to save disk space
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

# 5. Health Check with retries
echo "🩺 Running health check..."
MAX_RETRIES=12
COUNT=0
HEALTHY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
  if curl -s -f http://localhost:5000/api/health > /dev/null 2>&1 || curl -s -f http://localhost/api/health > /dev/null 2>&1; then
    HEALTHY=true
    break
  fi
  COUNT=$((COUNT + 1))
  echo "Waiting for services to become healthy... (Attempt $COUNT/$MAX_RETRIES)"
  sleep 5
done

if [ "$HEALTHY" = true ]; then
  echo "✅ Deployment successful! DevCollab is up and running."
else
  echo "❌ Health check failed after $MAX_RETRIES attempts. Check logs with 'docker compose logs'."
  docker compose logs --tail=50
  exit 1
fi
