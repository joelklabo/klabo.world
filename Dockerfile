# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.11.1
FROM node:${NODE_VERSION}-slim AS base
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY app/package.json app/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/scripts/package.json packages/scripts/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY patches ./patches
RUN pnpm install --frozen-lockfile --unsafe-perm

FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN pnpm install --frozen-lockfile --unsafe-perm
RUN mkdir -p app/data
RUN pnpm --filter app exec prisma generate
RUN NODE_ENV=production pnpm --filter app exec contentlayer build
RUN NODE_ENV=production pnpm --filter app build

FROM base AS runner
ENV NODE_ENV=production

WORKDIR /app
COPY --from=builder /app/app/.next/standalone ./
COPY --from=builder /app/app/.next/static ./app/.next/static
COPY --from=builder /app/app/public ./app/public
COPY --from=builder /app/app/.contentlayer ./app/.contentlayer
COPY --from=builder /app/content ./content
RUN mkdir -p /home/site/wwwroot/data

WORKDIR /app/app
EXPOSE 80

CMD ["node", "server.js"]
