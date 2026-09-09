#!/usr/bin/env bash
# 对已启动的 Nest 做鉴权基线：health、docs、种子账密、C 端注册、后台拒绝注册。
set -euo pipefail

BASE="${API_E2E_URL:-http://localhost:${API_PORT:-3300}}"
EMAIL="e2e-$(date +%s)@example.com"
PASSWORD="password12"
SEED_USER_EMAIL="${DEV_USER_EMAIL:-user@example.com}"
SEED_USER_PASSWORD="${DEV_USER_PASSWORD:-password}"
SEED_ADMIN_EMAIL="${DEV_ADMIN_EMAIL:-admin@example.com}"
SEED_ADMIN_PASSWORD="${DEV_ADMIN_PASSWORD:-password}"
WEB_ORIGIN="${E2E_ORIGIN:-http://localhost:${WEB_PORT:-3301}}"
ADMIN_ORIGIN="${E2E_ADMIN_ORIGIN:-http://localhost:${ADMIN_PORT:-3302}}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

wait_for_health() {
  local i
  for i in $(seq 1 40); do
    if curl -fsS "$BASE/api/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done
  echo "API 未就绪: $BASE/api/health" >&2
  return 1
}

wait_for_health

echo "→ health"
curl -fsS "$BASE/api/health" | grep -q '"ok":true'

echo "→ swagger"
code="$(curl -sS -o /dev/null -w '%{http_code}' "$BASE/api/docs")"
if [[ "$code" != "200" && "$code" != "301" && "$code" != "302" ]]; then
  echo "Swagger 未开: HTTP $code （$BASE/api/docs）" >&2
  exit 1
fi

echo "→ admin 拒绝注册"
admin_signup="$(curl -sS -o /tmp/e2e-admin-signup.json -w '%{http_code}' \
  -H "Content-Type: application/json" \
  -H "Origin: $ADMIN_ORIGIN" \
  -X POST "$BASE/api/auth/sign-up/email" \
  -d "{\"email\":\"staff-$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"Staff\"}")"
if [[ "$admin_signup" != "403" ]]; then
  echo "后台注册应 403，实际 HTTP $admin_signup" >&2
  cat /tmp/e2e-admin-signup.json >&2
  exit 1
fi

echo "→ 种子会员登录官网"
user_login="$(curl -sS -o /tmp/e2e-user-login.json -w '%{http_code}' \
  -H "Content-Type: application/json" \
  -H "Origin: $WEB_ORIGIN" \
  -X POST "$BASE/api/auth/sign-in/email" \
  -d "{\"email\":\"$SEED_USER_EMAIL\",\"password\":\"$SEED_USER_PASSWORD\",\"rememberMe\":true}")"
if [[ "$user_login" != "200" ]] || ! grep -q '"role":"user"' /tmp/e2e-user-login.json; then
  echo "种子会员登录官网应 200 且 role=user，实际 HTTP $user_login" >&2
  cat /tmp/e2e-user-login.json >&2
  exit 1
fi

echo "→ 种子员工登录官网应 403"
staff_on_web="$(curl -sS -o /tmp/e2e-staff-web.json -w '%{http_code}' \
  -H "Content-Type: application/json" \
  -H "Origin: $WEB_ORIGIN" \
  -X POST "$BASE/api/auth/sign-in/email" \
  -d "{\"email\":\"$SEED_ADMIN_EMAIL\",\"password\":\"$SEED_ADMIN_PASSWORD\",\"rememberMe\":true}")"
if [[ "$staff_on_web" != "403" ]]; then
  echo "员工登官网应 403，实际 HTTP $staff_on_web" >&2
  cat /tmp/e2e-staff-web.json >&2
  exit 1
fi

echo "→ 种子员工登录后台"
admin_login="$(curl -sS -o /tmp/e2e-admin-login.json -w '%{http_code}' \
  -H "Content-Type: application/json" \
  -H "Origin: $ADMIN_ORIGIN" \
  -X POST "$BASE/api/auth/sign-in/email" \
  -d "{\"email\":\"$SEED_ADMIN_EMAIL\",\"password\":\"$SEED_ADMIN_PASSWORD\",\"rememberMe\":true}")"
if [[ "$admin_login" != "200" ]] || ! grep -q '"role":"admin"' /tmp/e2e-admin-login.json; then
  echo "种子员工登录后台应 200 且 role=admin，实际 HTTP $admin_login" >&2
  cat /tmp/e2e-admin-login.json >&2
  exit 1
fi

echo "→ 种子会员登录后台应 403"
user_on_admin="$(curl -sS -o /tmp/e2e-user-admin.json -w '%{http_code}' \
  -H "Content-Type: application/json" \
  -H "Origin: $ADMIN_ORIGIN" \
  -X POST "$BASE/api/auth/sign-in/email" \
  -d "{\"email\":\"$SEED_USER_EMAIL\",\"password\":\"$SEED_USER_PASSWORD\",\"rememberMe\":true}")"
if [[ "$user_on_admin" != "403" ]]; then
  echo "会员登后台应 403，实际 HTTP $user_on_admin" >&2
  cat /tmp/e2e-user-admin.json >&2
  exit 1
fi

echo "→ C 端注册会员 $EMAIL"
curl -fsS -c "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -H "Origin: $WEB_ORIGIN" \
  -X POST "$BASE/api/auth/sign-up/email" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"E2E\"}" \
  | grep -q '"email"'

echo "→ 会员打 /api/users 应 403"
users_code="$(curl -sS -o /dev/null -w '%{http_code}' -b "$COOKIE_JAR" "$BASE/api/users")"
if [[ "$users_code" != "403" ]]; then
  echo "会员访问 /api/users 应 403，实际 HTTP $users_code" >&2
  exit 1
fi

echo "e2e 通过: $BASE"
