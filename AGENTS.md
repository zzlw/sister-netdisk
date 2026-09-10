# AGENTS.md

网盘妹。用户搜索聚合的公开分享，点结果跳原盘。本站不收录、不存文件。约定以开发者本机 `~/.cursor/skills/new-website/defaults.md` 为准。

## 栈

- monorepo：pnpm + Turborepo
- apps/web：C 端 Next.js 16（官网 + 用户登录后）
- apps/admin：B 端 Next.js 16
- apps/api：NestJS 11
- packages/shared：Zod / 类型；packages/db：Drizzle；packages/ui：前端唯一共享包（shadcn 原语 + `cn` + 公共样式）
- Lint / 格式化：Biome 2，全仓一份根 `biome.jsonc`。没有 ESLint、没有 Prettier
- 鉴权在 Nest（Better Auth）。user = C 端会员，admin = B 端员工，账密不通用
- 开发端口段 NN=35（API 3500 / web 3501 / admin 3502 / Postgres 3532）

## 命令

- 安装：`pnpm install`
- 依赖容器：`pnpm db:up`（只要 Postgres）；搜索引擎：`pnpm pansou:up`（官方 `ghcr.io/fish2018/pansou`，宿主机 `3588`）；迁移：`pnpm db:migrate`；本地账密：`pnpm db:seed`（员工 `DEV_ADMIN_*`，会员 `DEV_USER_*`）；对象存储：`pnpm storage:up`
- 开发：`pnpm pansou:up && pnpm dev`
- 构建：`pnpm build`
- 校验：`pnpm lint`（Biome，只读）/ `pnpm format`（Biome 自动修）/ `pnpm typecheck` / `pnpm test`
- API 联调自检：`pnpm test:e2e`（先 `pnpm db:up && pnpm db:migrate && pnpm dev:api`）
- 本机 CI：`pnpm check`
- 部署：一台 VPS + Compose + nginx + acme.sh，见 `DEPLOY.md`。Swagger：`/api/docs`

## 约定

- 业务只写在 Nest；Next 只渲染并通过 `/api` rewrite 调用 Nest
- 不要把后台塞进 web 的路由分组
- 不要改用 3000 / 5432
- 不要装 ESLint / Prettier，也不要在 app 里加 `eslint.config.*`、`.prettierrc`。规则改根 `biome.jsonc`。shadcn 装进来的代码在 overrides 里已豁免，别去手改那些文件的格式
- 组件一律从 `@repo/ui/components/x` 引，不要 `@/components/ui/x`。`apps/*/src/components/ui/` 不该存在
- 装组件在 app 里跑 `pnpm dlx shadcn@latest add <name>`：原语自动落 `packages/ui`，block 落当前 app。不要在 `packages/ui` 里跑 add
- 公共样式和 token 在 `@repo/ui/globals.css`；app 的 `globals.css` 只 `@import` 它 + 覆盖 `--primary`。`@source` 那行和 `transpilePackages: ["@repo/ui"]` 不要删
- 三份 `components.json`（web / admin / ui）的 `style`·`baseColor`·`iconLibrary` 必须一致
- 滚动条只用 OverlayScrollbars：页面滚动挂 `body`，区域内滚动用 `@repo/ui/components/scroll-area`。不要用原生条、`::-webkit-scrollbar` 或 shadcn Radix `scroll-area`
- Tailwind v4 按钮默认是箭头。可点的 `button` / `[role="button"]` 用手势，靠 `globals.css` 的 pointer 规则，不要漏补
- 不上 Web 字体。西文 system-ui，汉字走系统简体（苹方 / 微软雅黑）。不要 `next/font` 拉 Geist
- 深色模式跟系统。C 端不放切换器；B 端顶栏 `ThemeModeToggle`（⌘⇧D）。不要上多色板或字体切换
- 样式用 CSS 变量（`cssVariables: true`），写 `bg-primary` 等 token class。不要用 `bg-zinc-950 dark:bg-zinc-50` 这种 className 上色
- 组合件根节点加 `data-slot`。父级改子件用 `data-[slot=…]`，不要靠 class 名或 DOM 路径。不要用它换主题或存状态
- 文案简体中文。`html lang="zh-CN"`
- C 端：底贴边。文章 65ch，营销带 1440，工具/搜索/列表用 `page-shell-wide`（1920）。不要整页套 `page-prose`
- B 端：列表页主体是表格，新增走 Dialog / Sheet，不要把创建表单常驻列表上方。每块一张 Card，页面自己写 h1，内容区 `p-4 lg:p-6`
- B 端外壳提到 `app/layout.tsx`，别丢 `SidebarProvider` 的内联 `style`（`--sidebar-width` / `--header-height`）。`site-header` 两层 `items-center` 不要动。竖线 `Separator` 写 `data-[orientation=vertical]:h-4` **和** `data-[orientation=vertical]:self-center`（Base UI 再加 `data-vertical:*`）。只改高度不够：原语的 `self-stretch` 会把固定高度的竖线钉在顶部
- 侧栏跟 URL 高亮已在 `nav-main.tsx` 做好（`usePathname` + `Link` + `isActive`，子路由算父项命中）。加菜单只改 `app-sidebar.tsx` 的 `data`
- 侧栏骨架别拆：品牌区 / 主导航 / 次级区 / 底部 `NavUser` 都要留，只换 `app-sidebar.tsx` 里的 `data`。`nav-user.tsx` 已接 `authClient.useSession()` + `signOut()`，删了后台就没登出入口
- 按钮尺寸：页头主操作用默认 size（h-9），卡片内工具栏和表格行内用 `sm`（h-8），行内图标 `icon-sm`。同一行尺寸要一致
- B 端表单只用 shadcn 组件：下拉用 `Select` 不用原生 `<select>`，表格用 `Table` 不用裸 `<table>`，加载用 `Skeleton` 不用「加载中…」。字段给 `max-w-sm` / `max-w-xl`。三态（加载/空/错）必写。照 `app/users/page.tsx` 长
- 会话页默认动态；营销公开数据才 `use cache`。有数据的段给 loading / error / not-found
- C 端图用 `next/image`，每页写 metadata。环境变量启动时 Zod 校验
- C 端 PWA：`manifest.ts` + icon / apple-icon，可安装。默认不上 Service Worker。admin 不做
- 尊重 `prefers-reduced-motion`。表单真 label，图标按钮 sr-only。时间存 UTC、展示上海时区
- 按钮视觉用 shadcn `default`/`sm`，不要为了 44px 热区把按钮画很大。热区用透明扩大，桌面列表 CTA 不要撑满行高
- 刷新不丢：搜索/筛选/分页进 URL（`nuqs`）；侧栏等偏好进 cookie/localStorage。不要只放 `useState`。Dialog/Toast 可以丢
- 登录：本地 `pnpm db:seed` 出员工和会员，不要靠手注册。会员 `user@example.com` 只登 C 端，员工 `admin@example.com` 只登 B 端。Cookie 不共享。会话 7 天 + `rememberMe`。生产禁止 seed，后台不开放注册
- 生产部署：用户只在大陆。Compose + nginx + 阿里云 DNS-01。源站可在国内或海外（海外优先港/新/东京）。不要 Cloudflare 代签，不要默认上 Vercel
