# 网盘妹

网盘分享聚合搜索。用户搜公开分享，点结果跳到对应网盘。本站不存文件。

[技术方案](./技术方案.md) · [部署](./DEPLOY.md) · [约定](./AGENTS.md)

## 栈

pnpm + Turborepo。`apps/web` / `apps/admin` 为 Next.js 16，`apps/api` 为 NestJS 11。鉴权、业务、数据库只在 Nest；前端经 `/api` rewrite 调用。

全网搜索计划旁挂官方镜像 [`ghcr.io/fish2018/pansou`](https://github.com/fish2018/pansou)，见 `技术方案.md`（尚未落地）。

## 本地

```bash
pnpm install
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

端口段 NN=35：API `3500` / web `3501` / admin `3502` / Postgres `3532`。不要改成 `3000` / `5432`。

本地账密由 seed 写入：员工 `admin@example.com` / `password` 只登后台，会员 `user@example.com` / `password` 只登 C 端。复制 `.env.example` 为 `.env`，不要提交真实密钥。

## 许可

[MIT](./LICENSE)
