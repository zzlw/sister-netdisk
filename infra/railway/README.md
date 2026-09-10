# Railway（Nest + Postgres + Pansou）

给 `wangpanmei.com` 的后台三件套。C/B 端在 Vercel，步骤见 [`../vercel/README.md`](../vercel/README.md) 和 [`../../DEPLOY.md`](../../DEPLOY.md)。密钥只写控制台，不要提交。

生产禁止 `pnpm db:seed`。

## 三个服务

同一个 Railway 项目里建三个服务。API 和 Pansou **关掉 sleep**（`sleepApplication = false`）；冷启动搜一次要几十秒。

### Postgres

用 Railway 插件。把 `DATABASE_URL`（或 `DATABASE_PRIVATE_URL`）共享给 API。不要把 5432 打到公网。

### Pansou

控制台 **Deploy from Docker Image**，不要 Nixpacks：

```
ghcr.io/fish2018/pansou:sha-f6c3041@sha256:0951534e40a644a2b5777144df0684dae729d536b02925b661b9b6da0aa14099
```

- Config-as-code：`infra/railway/pansou.toml`
- Volume：`/cache`
- 环境：把 [`../docker/pansou.env`](../docker/pansou.env) 贴进变量（`PORT=8888`、`CACHE_PATH=/cache`、频道/插件白名单）
- 不要给 Pansou 配公网域名

### API

连本仓库，Config-as-code：`infra/railway/railway.toml`。用现有 [`../docker/Dockerfile.api`](../docker/Dockerfile.api)，启动先 `pnpm --filter @repo/db migrate` 再起 Nest（`start-api.sh`）。

`PORT` 听 Railway 注入。变量见 [`api.env.example`](./api.env.example)：

```
PANSOU_URL=http://<pansou服务名>.railway.internal:8888
BETTER_AUTH_URL=https://www.wangpanmei.com
CORS_ORIGINS=https://www.wangpanmei.com,https://admin.wangpanmei.com
WEB_URL=https://www.wangpanmei.com
ADMIN_URL=https://admin.wangpanmei.com
```

Nest **不要**配 `wangpanmei.com` 子域。Vercel rewrite 用 `https://<api>.up.railway.app`（Vercel 到不了 `*.railway.internal`）。浏览器仍然只打当前站点的 `/api`。

生成 `BETTER_AUTH_SECRET`（至少 32 位）。Cookie 依赖 `X-Forwarded-Host` / `Proto`；仓库里已开 Express `trust proxy` 和 Better Auth `trustedProxyHeaders`。不要开跨子域 Cookie（www 和 admin 不共享会话）。
