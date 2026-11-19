#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
host="${DEPLOY_TARGET:-mycloud}"
npm run build
rsync -az --delete dist/ "$host":~/poker-trainer/dist/
rsync -az --delete --exclude node_modules --exclude data server/ "$host":~/poker-trainer/server/
rsync -az deploy/docker-compose.yml deploy/nginx.conf deploy/remote-deploy.sh "$host":~/poker-trainer/
ssh "$host" 'sh ~/poker-trainer/remote-deploy.sh'
curl -fsS https://poker.cloud.savchenko.dev/api/health
echo " deployed https://poker.cloud.savchenko.dev/"
