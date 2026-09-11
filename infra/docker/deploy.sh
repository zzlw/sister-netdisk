#!/usr/bin/env bash
# 服务器滚动发布。用法：./deploy.sh [all|web|pansou|gateway] [tag]
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICE="${1:-all}"
export IMAGE_TAG="${2:-latest}"

if [[ ! -f "$DIR/.env.prod" || ! -f "$DIR/.env.prod.local" ]]; then
  echo "缺少 $DIR/.env.prod 或 .env.prod.local" >&2
  exit 1
fi

COMPOSE=(docker compose -f "$DIR/docker-compose.prod.yml")
if [[ -f "$DIR/docker-compose.acme.override.yml" ]]; then
  COMPOSE+=(-f "$DIR/docker-compose.acme.override.yml")
fi
COMPOSE+=(--env-file "$DIR/.env.prod" --env-file "$DIR/.env.prod.local")

cd "$DIR"

if [[ "$SERVICE" == "all" ]]; then
  "${COMPOSE[@]}" pull web
else
  "${COMPOSE[@]}" pull "$SERVICE" || true
fi

if [[ "$SERVICE" == "all" ]]; then
  "${COMPOSE[@]}" up -d pansou web gateway
else
  "${COMPOSE[@]}" up -d "$SERVICE"
fi

"${COMPOSE[@]}" exec -T gateway nginx -s reload || true
"${COMPOSE[@]}" ps
echo "发布完成 tag=${IMAGE_TAG} service=${SERVICE}"
