#!/bin/bash
# Deploy to production
# Usage: ./scripts/deploy.sh
set -euo pipefail

KEY="$HOME/exam-simulator-key.pem"
HOST="ec2-user@3.1.59.198"
IMAGE="exam-simulator-app:prod"
TMP="/tmp/exam-simulator-app.tar.gz"

echo "=== 1/4 Building Docker image ==="
docker build -t "$IMAGE" .

echo "=== 2/4 Saving and compressing image ==="
docker save "$IMAGE" | gzip > "$TMP"
echo "Image size: $(du -h "$TMP" | cut -f1)"

echo "=== 3/4 Transferring to EC2 ==="
scp -C -i "$KEY" "$TMP" "$HOST":~/exam-simulator-app.tar.gz

echo "=== 4/4 Loading and restarting on EC2 ==="
ssh -i "$KEY" "$HOST" "
  gunzip -c ~/exam-simulator-app.tar.gz | docker load &&
  cd ~/exam-simulator &&
  git pull &&
  sed -i 's/build: \./image: exam-simulator-app:prod/' docker-compose.prod.yml &&
  docker compose --env-file .env.production -f docker-compose.prod.yml up -d --force-recreate app &&
  rm -f ~/exam-simulator-app.tar.gz &&
  docker image prune -f | tail -1
"
rm -f "$TMP"

echo "=== Deploy complete! ==="
echo "https://nihonmoment.com"
