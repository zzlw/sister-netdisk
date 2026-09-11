# 网盘妹

网盘分享聚合搜索。用户搜公开分享，点结果跳到对应网盘。本站不存文件，也不做登录或后台。

[技术方案](./技术方案.md) · [部署](./DEPLOY.md) · [约定](./AGENTS.md)

## 栈

pnpm + Turborepo。`apps/web` 为 Next.js 16，搜索在 Route Handler 里服务端调官方镜像 [`ghcr.io/fish2018/pansou`](https://github.com/fish2018/pansou)。浏览器不直连。

## 本地

```bash
pnpm install
pnpm pansou:up
pnpm dev
```

端口段 NN=35：web `3501` / Pansou `3588`。不要改成 `3000` / `5432`。复制 `.env.example` 为 `.env`。

## 许可

[MIT](./LICENSE)
