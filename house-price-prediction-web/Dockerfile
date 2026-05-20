# 基础镜像前缀：docker build --build-arg REGISTRY=你的仓库主机（无 https://，无末尾 /）
# 若需 Dockerfile 前端走镜像站：export BUILDKIT_SYNTAX=你的主机/docker/dockerfile:1 后再构建（本文件未写 # syntax=，避免默认拉 Docker Hub）

FROM 8wxewmnzl14gzm6b6v.xuanyuan.run/library/node:22.22-bookworm-slim AS base

FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --registry=https://registry.npmmirror.com/

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --registry=https://registry.npmmirror.com/

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=10s --timeout=5s --start-period=45s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
