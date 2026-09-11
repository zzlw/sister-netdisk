#!/usr/bin/env bash
# 对本机已生成的仓库跑和 CI 的 check job 相同的检查（不依赖 GitHub）。
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

echo "check 通过"
