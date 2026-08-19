#!/usr/bin/env bash
set -euo pipefail

SSH_HOST="webfam"
REMOTE_PATH="/home/webfam/htdocs/webfam.com.ar"
SITE_USER="webfam"
SITE_GROUP="webfam"
SITE_URL="https://webfam.com.ar"

cd "$(dirname "$0")/.."

echo "[1/3] Building..."
npm run build

echo "[2/3] Subiendo a $SSH_HOST:$REMOTE_PATH"
rsync -az --delete --stats --human-readable \
  --exclude='.well-known' \
  dist/ "$SSH_HOST:$REMOTE_PATH/"

echo "[3/3] Ajustando ownership a $SITE_USER:$SITE_GROUP"
ssh "$SSH_HOST" "chown -R $SITE_USER:$SITE_GROUP $REMOTE_PATH"

echo ""
echo "Deploy OK -> $SITE_URL"
