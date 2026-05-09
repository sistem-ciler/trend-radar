# syntax=docker/dockerfile:1
# SRV-HTZNR-EU-SWS — trend-radar production image
# Multi-stage: deps → builder → runner (standalone output)

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@9.15.0
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# --ignore-scripts skips all postinstall (incl. sharp's native build);
# we rebuild sharp explicitly in the builder stage to dodge pnpm v10's
# strict ERR_PNPM_IGNORED_BUILDS behavior.
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm rebuild sharp
RUN pnpm build

FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
