#!/bin/sh
set -eu
cd /app
pnpm --filter @repo/db migrate
exec node apps/api/dist/main.js
