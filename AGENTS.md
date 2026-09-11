# AGENTS.md

网盘妹。用户搜索聚合的公开分享，点结果跳原盘。本站不收录、不存文件，也不做登录或后台。约定以开发者本机 `~/.cursor/skills/new-website/defaults.md` 为准。

## 栈

- monorepo：pnpm + Turborepo
- apps/web：C 端 Next.js 16。搜索在 Route Handler 里服务端调 Pansou
- packages/shared：Zod / 类型；packages/ui：前端唯一共享包（shadcn 原语 + `cn` + 公共样式）
- Lint / 格式化：Biome 2，全仓一份根 `biome.jsonc`。没有 ESLint、没有 Prettier
- 没有 Nest、没有 admin、没有 Postgres、没有鉴权
- 开发端口段 NN=35（web 3501 / Pansou 3588）

## 命令

- 安装：`pnpm install`
- 搜索引擎：`pnpm pansou:up`（官方 `ghcr.io/fish2018/pansou`，宿主机 `3588`）
- 开发：`pnpm pansou:up && pnpm dev`
- 构建：`pnpm build`
- 校验：`pnpm lint`（Biome，只读）/ `pnpm format`（Biome 自动修）/ `pnpm typecheck` / `pnpm test`
- 本机 CI：`pnpm check`
- 生产：Vercel 上 `apps/web`，Pansou 在 Render。见 `DEPLOY.md`

## 约定

- 搜索代理只写在 `apps/web` 的 Route Handler / `src/lib`。浏览器不直连 Pansou
- 不要重新加 Nest、admin、Postgres 或登录，除非用户明确改口
- 不要改用 3000 / 5432
- 不要装 ESLint / Prettier，也不要在 app 里加 `eslint.config.*`、`.prettierrc`。规则改根 `biome.jsonc`
- 组件一律从 `@repo/ui/components/x` 引，不要 `@/components/ui/x`
- 装组件在 app 里跑 `pnpm dlx shadcn@latest add <name>`：原语自动落 `packages/ui`
- 公共样式和 token 在 `@repo/ui/globals.css`；app 的 `globals.css` 只 `@import` 它 + 覆盖 `--primary`
- 滚动条只用 OverlayScrollbars：页面滚动挂 `body`，区域内滚动用 `@repo/ui/components/scroll-area`
- Tailwind v4 按钮默认是箭头。可点的 `button` / `[role="button"]` 用手势
- 不上 Web 字体。西文 system-ui，汉字走系统简体。不要 `next/font` 拉 Geist
- 深色模式跟系统。C 端不放切换器
- 样式用 CSS 变量（`cssVariables: true`），写 `bg-primary` 等 token class
- 组合件根节点加 `data-slot`。父级改子件用 `data-[slot=…]`
- 文案简体中文。`html lang="zh-CN"`
- C 端：底贴边。文章 65ch，营销带 1440，工具/搜索/列表用 `page-shell-wide`（1920）
- 会话页默认动态；营销公开数据才 `use cache`
- C 端图用 `next/image`，每页写 metadata。环境变量启动时 Zod 校验
- C 端 PWA：`manifest.ts` + icon / apple-icon，可安装。默认不上 Service Worker
- 尊重 `prefers-reduced-motion`。表单真 label，图标按钮 sr-only。时间存 UTC、展示上海时区
- 刷新不丢：搜索/筛选/分页进 URL（`nuqs`）
- 生产部署：用户只在大陆。当前是 Vercel C 端 + Render Pansou。不要 Cloudflare 代签
