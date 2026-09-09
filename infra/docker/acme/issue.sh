#!/bin/sh
# 首次：make -C /opt/sister-netdisk cert-issue
# Let's Encrypt + DNS-01 泛域名。续期后 nginx 由 90-periodic-reload.sh reload。
set -e

: "${ACME_EMAIL:?配置 ACME_EMAIL}"
: "${BASE_DOMAIN:?配置 BASE_DOMAIN}"

if [ -n "${CF_API_TOKEN:-}" ]; then
  export CF_Token="$CF_API_TOKEN"
  [ -n "${CF_ZONE_ID:-}" ] && export CF_Zone_ID="$CF_ZONE_ID"
  DNS_PROVIDER=dns_cf
  echo "==> Cloudflare DNS-01"
elif [ -n "${Ali_Key:-}" ] && [ -n "${Ali_Secret:-}" ]; then
  DNS_PROVIDER=dns_ali
  echo "==> 阿里云 DNS-01"
else
  echo "在 .env.prod.local 配 CF_API_TOKEN 或 ALI_KEY/ALI_SECRET" >&2
  exit 1
fi

echo "==> 注册 Let's Encrypt 账户"
acme.sh --register-account -m "$ACME_EMAIL" --server letsencrypt

echo "==> 签发 $BASE_DOMAIN + *.$BASE_DOMAIN"
acme.sh --issue --server letsencrypt --keylength 2048 \
  --dns "$DNS_PROVIDER" \
  -d "$BASE_DOMAIN" -d "*.$BASE_DOMAIN"

echo "==> 安装到 /certs/live"
mkdir -p /certs/live
acme.sh --install-cert -d "$BASE_DOMAIN" \
  --fullchain-file /certs/live/fullchain.pem \
  --key-file /certs/live/privkey.pem

echo "==> 完成。执行 make -C /opt/sister-netdisk gateway-reload"
