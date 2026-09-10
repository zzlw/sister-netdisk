# Render 从仓库根构建 Nest API。内容和 infra/docker/Dockerfile.api 保持一致。
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/db/package.json packages/db/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @repo/shared --filter @repo/db --filter @repo/api...

FROM deps AS build
COPY packages/shared packages/shared
COPY packages/db packages/db
COPY apps/api apps/api
RUN pnpm --filter @repo/shared --filter @repo/db --filter @repo/api build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/api ./apps/api
COPY infra/railway/start-api.sh /usr/local/bin/start-api.sh
RUN chmod +x /usr/local/bin/start-api.sh
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
