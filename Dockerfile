# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.11.1
FROM node:${NODE_VERSION}-slim AS base
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl libssl3 \
  && rm -rf /var/lib/apt/lists/*
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
ARG DATABASE_URL=file:../data/app.db
ARG ALLOW_SQLITE_IN_PROD=true
ENV DATABASE_URL=$DATABASE_URL
ENV ALLOW_SQLITE_IN_PROD=$ALLOW_SQLITE_IN_PROD
RUN --mount=type=secret,id=NEXTAUTH_SECRET \
  if [ ! -s /run/secrets/NEXTAUTH_SECRET ]; then \
    echo "NEXTAUTH_SECRET build secret is required. Provide --secret id=NEXTAUTH_SECRET." >&2; \
    exit 1; \
  fi; \
  export NEXTAUTH_SECRET="$(cat /run/secrets/NEXTAUTH_SECRET)" \
  && pnpm --filter app exec prisma generate \
  && NODE_ENV=production pnpm --filter app exec contentlayer build \
  && NODE_ENV=production pnpm --filter app build

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
