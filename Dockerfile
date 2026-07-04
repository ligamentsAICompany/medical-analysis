# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate

FROM base AS deps
RUN mkdir -p public
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
ARG NEXT_PUBLIC_ANALYZE_API_BASE_URL=https://medical-analysis-backend-2p3fwh332a-uc.a.run.app
ARG NEXT_PUBLIC_API_AUTH_TOKEN=dummy_token
ENV NEXT_PUBLIC_ANALYZE_API_BASE_URL=$NEXT_PUBLIC_ANALYZE_API_BASE_URL
ENV NEXT_PUBLIC_API_AUTH_TOKEN=$NEXT_PUBLIC_API_AUTH_TOKEN
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
