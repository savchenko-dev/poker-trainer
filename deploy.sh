#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
npm run build
rsync -az --delete dist/ mycloud:~/poker-trainer/dist/
echo "deployed https://poker.cloud.savchenko.dev/"
