#!/usr/bin/env sh
set -eu
cd ~/poker-trainer
mkdir -p data/backups
sudo -n docker compose up -d --build --remove-orphans
sudo -n docker image prune -f >/dev/null
