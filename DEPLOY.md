# 部署

用户只在大陆。仓库默认生产方案仍是 **Docker Compose + nginx + acme.sh**，源站可以在国内或海外。布局对齐 [拓之迹](https://github.com/zzlw/tzj-website) 的 `infra/docker`：网关终止 TLS，应用只在内网。访客直连源站，不要 Cloudflare 橙色云/代签，也不要把 Nest 打成 Serverless。

`wangpanmei.com` 按指定走 **Vercel 前台 + Railway 后台**（见文末一节）。那是你指定的免费拆法，不替代、也不删除这套 Compose。

源站在哪只影响延迟和拉镜像，不改变证书和反代：

| 机器 | 镜像 | 选点 |
|---|---|---|
| 国内（阿里云 ECS 等） | ACR | 有备案就近 |
| 海外 | GHCR | 优先香港 / 新加坡 / 东京，不要默认美西 |

海外源站被墙或很慢时，用云厂商全球加速 / 跨境线路，不要把 NS 迁到 Cloudflare 当加速。

| 主机名 | 反代到 | 浏览器 |
|---|---|---|
| `www.example.com` | `web:3000` | 页面和 `/api`（Next rewrite → `http://api:3000`） |
| `admin.example.com` | `admin:3000` | 同上 |
| `api.example.com` | `api:3000` | 只给健康检查 / Swagger / 非浏览器客户端 |
| `example.com` | 301 → `www` | |

应用端口不要映射到宿主机。只有 gateway 的 80 / 443 对外。Postgres 不要发布 `5432`。Pansou 只 `expose: 8888`，不要映射宿主机端口，也不要给公网开 `/pansou`。

C 端 PWA 依赖这套 HTTPS。admin 不要做成可安装应用。

## 镜像与密钥

- 镜像：海外机器用 **GHCR**（`ghcr.io/<owner>/sister-netdisk-web|admin|api`）；国内机器用阿里云 ACR（和拓之迹一样）。
- 服务器目录：`/opt/sister-netdisk/`（compose、nginx、acme、两份 env）。
- `.env.prod`：域名、非密钥。可按 example 改。
- `.env.prod.local`：密码、`BETTER_AUTH_SECRET`、DNS API。**不要进 git。**

构建 Next 时烘入 `API_INTERNAL_URL=http://api:3000` 和 `NEXT_PUBLIC_*`。运行时 web/admin 仍把 `API_INTERNAL_URL` 指到 compose 服务名，避免走公网回环。

## 证书（acme.sh + DNS-01）

和拓之迹一样：Let's Encrypt 签发 `BASE_DOMAIN` + `*.BASE_DOMAIN`。DNS-01 才能一张证覆盖 www / admin / api。

1. **默认阿里云 DNS**：`.env.prod.local` 填 `ALI_KEY` / `ALI_SECRET`（和拓之迹一样）。
2. 不要把用户流量接到 Cloudflare 代签。`CF_API_TOKEN` 只留给「解析碰巧还在 CF」的签发，不是推荐架构。
3. 不要用 HTTP-01 打三个主机名当默认（通配符签不出来）。
4. 证书只放 `nginx/certs/live/`，volume `acme-data` 存账户。不要把 pem 提交进仓库。

首次上线（机器上）：

```bash
# 把 infra/docker 同步到 /opt/sister-netdisk，写好两份 env
cd /opt/sister-netdisk
make cert-selfsigned   # 占位证，让 nginx 能起
make acme-build
make infra-up          # postgres + acme + gateway（--no-deps）
make cert-issue
make gateway-reload
```

之后 `acme.sh daemon` 续期，gateway 每小时 reload。不要用长期自签当生产。

## 发布

GitHub Actions `deploy.yml`：`vars.DEPLOY_ENABLED=true` 后，push `main` 构建三张镜像并 SSH 执行 `deploy.sh`。

服务器手动：

```bash
make -C /opt/sister-netdisk prod-deploy
# 或 ./deploy.sh all <tag>
```

`deploy.sh`：pull → 等 Postgres → `pnpm --filter @repo/db migrate` → up → reload nginx。**不要**在生产跑 `pnpm db:seed`。

需要 Variables / Secrets：

| 键 | 用途 |
|---|---|
| `DEPLOY_ENABLED` | `true` 才跑发布 job |
| `IMAGE_REGISTRY` | 如 `ghcr.io/owner`（镜像为 `…/sister-netdisk-web`） |
| `WEB_URL` / `ADMIN_URL` | 烘进 Next 的 `NEXT_PUBLIC_*` |
| `DEPLOY_HOST` / `DEPLOY_USER` / `DEPLOY_SSH_KEY` | SSH |

## 环境变量（生产）

见 `infra/docker/.env.prod.example` 与 `.env.prod.local.example`。至少：

```
BETTER_AUTH_SECRET=至少 32 位随机串
BETTER_AUTH_URL=https://api.example.com
CORS_ORIGINS=https://www.example.com,https://admin.example.com
DATABASE_URL=postgresql://…@postgres:5432/…
SWAGGER=0
```

生产不要跑 `db:seed`，也不要带 `DEV_ADMIN_*` / `DEV_USER_*`。后台不开放注册，员工靠邀请或后台提权；会员只在 C 端注册，不会变成管理员。

## 发布后自检

1. `https://api.example.com/api/health` 返回 `{"ok":true}`
2. C 端用会员账号登录，Cookie 在 `www.example.com`；员工账号登官网应失败
3. B 端用员工账号登录，能打开 `/users`；会员账号登后台应失败
4. Network 里业务请求走当前站点 `/api/...`，不要让浏览器直连 `api.example.com`
5. 证书不是自签；HSTS 已开

## 不要

- 把 Nest 打成 Serverless；默认也不要把 web / admin 拆到 Vercel（`wangpanmei.com` 指定拆法见下一节）
- 宿主机暴露 3000 / 3001 / 3002 / 5432
- 证书、`.env.prod.local`、Railway / Vercel 密钥进 git
- 用 Caddy / Traefik 换掉 Compose 方案（用户要改口再换）
- 为了省事 HTTP-01 只签 www、admin 用自签
- 大陆用户站走 Cloudflare 橙色云 / 代签，或把本域 NS 迁到 Cloudflare

## Vercel + Railway（wangpanmei.com）

你指定的免费起步拆法：C/B 上 Vercel（阿里云 CNAME 到 Vercel 中国节点），Nest + Postgres + Pansou 上 Railway。浏览器仍然只打当前站点的 `/api`，Next rewrite 到 Railway，不直连 Nest。权威 DNS 留在阿里云，记录加在阿里云。不要迁 NS，不要橙色云。

Hobby / 试用额度会很快烧完（Pansou 建议约 1GB，再加上 Nest 和 Postgres）。Railway 源站在海外，只给 Vercel 回源。海外探国内网盘死链可能不准，必要时关掉 `SHARE_CHECK_*`。控制台登录和付款要你本机完成。

```
大陆访客 → 阿里云 DNS
  www / admin CNAME → cname-china.vercel-dns.com → Vercel web 或 admin
  Vercel /api rewrite → Railway Nest → Postgres / Pansou
```

| 主机名 | 落点 |
|---|---|
| `www.wangpanmei.com` | Vercel `@repo/web` |
| `admin.wangpanmei.com` | Vercel `@repo/admin` |
| `wangpanmei.com` | 阿里云 URL 转发 301 → `www` |
| Nest / Pansou | 不配公网域名；Vercel 用 `https://<railway-api>.up.railway.app` |

### Railway

见 [`infra/railway/README.md`](infra/railway/README.md)。同一项目：Postgres 插件 + Pansou 锁定镜像 + API（`infra/docker/Dockerfile.api`，启动先迁移再起 Nest）。API / Pansou **关掉 sleep**。变量清单 [`infra/railway/api.env.example`](infra/railway/api.env.example)，Pansou 环境抄 [`infra/docker/pansou.env`](infra/docker/pansou.env)。生产禁止 seed。

```
BETTER_AUTH_URL=https://www.wangpanmei.com
CORS_ORIGINS=https://www.wangpanmei.com,https://admin.wangpanmei.com
WEB_URL=https://www.wangpanmei.com
ADMIN_URL=https://admin.wangpanmei.com
PANSOU_URL=http://<pansou>.railway.internal:8888
```

Vercel rewrite 必须带 `X-Forwarded-Host` / `X-Forwarded-Proto`。仓库已开 Express `trust proxy` 和 Better Auth `trustedProxyHeaders`，否则 Cookie 会写到 `*.up.railway.app`。www 和 admin 不共享 Cookie。

### Vercel

见 [`infra/vercel/README.md`](infra/vercel/README.md)。两个项目都连本仓库 `main`，Root Directory 分别是 `apps/web`、`apps/admin`：

- 安装：仓库根 `pnpm install --frozen-lockfile`
- 构建：`pnpm --filter @repo/web` 或 `@repo/admin` `build`
- `API_INTERNAL_URL=https://<railway-api>.up.railway.app`（不要 `NEXT_PUBLIC_`）
- `NEXT_PUBLIC_WEB_URL=https://www.wangpanmei.com`
- `NEXT_PUBLIC_ADMIN_URL=https://admin.wangpanmei.com`
- `NEXT_PUBLIC_API_URL=/api`

Custom Domain 加 `www.wangpanmei.com`、`admin.wangpanmei.com`。

### 阿里云解析

- `www` CNAME → `cname-china.vercel-dns.com`
- `admin` CNAME → `cname-china.vercel-dns.com`
- `@` 显性 URL 转发到 `https://www.wangpanmei.com`（阿里云要备案；未备案改 A `76.76.21.21`，由 Vercel 301 到 www）

加完后 `dig www.wangpanmei.com` 确认公网是中国区优化节点，不是默认 `cname.vercel-dns.com`。
