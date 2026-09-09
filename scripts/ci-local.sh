#!/usr/bin/env bash
# 对本机已生成的仓库跑和 CI 的 check job 相同的检查（不依赖 GitHub）。
# API 已起来才追加 e2e；GitHub 的 check job 没有 .env / 没有 API，因此不会跑到这一步。
set -euo pipefail

if [[ ! -f package.json ]]; then
  echo "在仓库根目录执行" >&2
  exit 1
fi

echo "→ lint"
pnpm lint

echo "→ typecheck"
pnpm typecheck

echo "→ test"
pnpm test

echo "→ build api + packages"
pnpm --filter @repo/shared --filter @repo/db --filter @repo/api build

if [[ -z "${API_PORT:-}" && -f .env ]]; then
  API_PORT="$(sed -n 's/^API_PORT=//p' .env | head -1 | tr -d '\r')"
fi
if [[ -n "${API_PORT:-}" ]] && curl -fsS "http://127.0.0.1:${API_PORT}/api/health" >/dev/null 2>&1; then
  echo "→ e2e"
  pnpm test:e2e
fi

echo "check 通过"
