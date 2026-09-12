#!/bin/bash
# deploy.sh — Blue-Green deployment script (runs ON the app-server)
# Usage: ./deploy.sh <new-image-tag>
# Example: ./deploy.sh abdulrehmanofficial/zero-downtime-backend:42

set -e  # stop immediately if any command fails

NEW_IMAGE="$1"
if [ -z "$NEW_IMAGE" ]; then
  echo "ERROR: no image tag provided"
  exit 1
fi

NETWORK=$(docker network ls --format '{{.Name}}' | grep zdp-network)
echo "Using network: $NETWORK"

# 1. Find out which slot is CURRENTLY live by asking nginx itself
CURRENT=$(curl -s http://localhost/health | grep -o '"version":"[a-z]*"' | cut -d'"' -f4)
echo "Currently active slot: $CURRENT"

if [ "$CURRENT" = "blue" ]; then
  INACTIVE="green"
else
  INACTIVE="blue"
fi
echo "Deploying new version to INACTIVE slot: $INACTIVE"

# 2. Pull the new image
docker pull "$NEW_IMAGE"

# 3. Replace the inactive container with the new image
docker stop "backend-$INACTIVE" || true
docker rm "backend-$INACTIVE" || true

docker run -d \
  --name "backend-$INACTIVE" \
  --network "$NETWORK" \
  -e MONGO_URI="mongodb://mongo:27017/zerodowntimedb" \
  -e PORT=3000 \
  -e VERSION="$INACTIVE" \
  --restart always \
  "$NEW_IMAGE"

# 4. Wait a moment for it to boot, then health-check the NEW container directly
echo "Waiting for new container to be healthy..."
sleep 5

HEALTH=$(docker exec "backend-$INACTIVE" node -e "
require('http').get('http://localhost:3000/health', res => {
  process.exit(res.statusCode === 200 ? 0 : 1);
}).on('error', () => process.exit(1));
" && echo "OK" || echo "FAIL")

if [ "$HEALTH" != "OK" ]; then
  echo "❌ Health check FAILED on $INACTIVE — rolling back (NOT switching traffic)"
  docker stop "backend-$INACTIVE" || true
  docker rm "backend-$INACTIVE" || true
  exit 1
fi

echo "✅ Health check PASSED on $INACTIVE — switching traffic now"

# 5. Switch nginx traffic to the new (now healthy) slot — zero downtime
#    (we rewrite the whole config file to avoid depending on exact
#    spacing/formatting from any previous manual edits)
docker exec -i zdp-nginx sh -c "cat > /etc/nginx/conf.d/default.conf" << EOF
upstream backend_active {
    server backend-$INACTIVE:3000;
    # server backend-$CURRENT:3000;
}

server {
    listen 80;

    location / {
        root /usr/share/nginx/html;
        try_files \$uri /index.html;
    }

    location /api/ {
        proxy_pass http://backend_active;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /health {
        proxy_pass http://backend_active;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

docker exec zdp-nginx sh -c "nginx -t && nginx -s reload"

echo "🎉 Deployment complete. Live slot is now: $INACTIVE"
