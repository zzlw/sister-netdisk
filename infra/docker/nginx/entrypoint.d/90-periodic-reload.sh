#!/bin/sh
# acme 续期后覆盖 /certs/live，按小时 reload，不必重启 gateway。
while true; do
  sleep 3600
  nginx -s reload 2>/dev/null || true
done &
