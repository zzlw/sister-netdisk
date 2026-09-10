# Vercel（C 端 + B 端）

一个仓库、两个 Vercel 项目，都连 `main`。Root Directory 分别是 `apps/web`、`apps/admin`（会读各目录下的 `vercel.json`）。

| 项目 | Root | 安装 | 构建 | 自定义域 |
|---|---|---|---|---|
| web | `apps/web` | 仓库根 `pnpm install --frozen-lockfile` | `pnpm --filter @repo/web build` | `www.wangpanmei.com` |
| admin | `apps/admin` | 同上 | `pnpm --filter @repo/admin build` | `admin.wangpanmei.com` |

`output: "standalone"` 只在非 Vercel（Docker）启用。运行时 `API_INTERNAL_URL` 指 Railway Nest，**不要** `NEXT_PUBLIC_`。

环境变量见 [`web.env.example`](./web.env.example)、[`admin.env.example`](./admin.env.example)：

```
API_INTERNAL_URL=https://<railway-api>.up.railway.app
NEXT_PUBLIC_WEB_URL=https://www.wangpanmei.com
NEXT_PUBLIC_ADMIN_URL=https://admin.wangpanmei.com
NEXT_PUBLIC_API_URL=/api
```

阿里云 DNS（权威在阿里云才生效，不要迁 Cloudflare、不要橙色云）：

- `www` CNAME → `cname-china.vercel-dns.com`
- `admin` CNAME → `cname-china.vercel-dns.com`
- `@` 显性 URL 转发到 `https://www.wangpanmei.com`

加完域名后 `dig www.wangpanmei.com` 应看到中国区优化节点，不是默认的 `cname.vercel-dns.com`。
