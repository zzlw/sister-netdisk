#!/usr/bin/env bash
# 服务器滚动发布。用法：./deploy.sh [all|api|web|admin] [tag]
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
  "${COMPOSE[@]}" pull api web admin
else
  "${COMPOSE[@]}" pull "$SERVICE"
fi

"${COMPOSE[@]}" up -d postgres
echo "等待 Postgres…"
for _ in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T postgres pg_isready -q; then
    break
  fi
  sleep 2
done

echo "迁移数据库"
"${COMPOSE[@]}" run --rm --no-deps --workdir /app --entrypoint pnpm api --filter @repo/db migrate

if [[ "$SERVICE" == "all" ]]; then
  "${COMPOSE[@]}" up -d api web admin gateway
else
  "${COMPOSE[@]}" up -d "$SERVICE"
fi

"${COMPOSE[@]}" exec -T gateway nginx -s reload || true
"${COMPOSE[@]}" ps
echo "发布完成 tag=${IMAGE_TAG} service=${SERVICE}"
