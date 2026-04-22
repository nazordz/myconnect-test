
FROM node:24.15.0-alpine3.22 AS base
RUN corepack enable
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    dumb-init \
    && \
    rm -rf /var/lib/apt/lists/*

FROM base AS builder
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack prepare pnpm@10.10.0 --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
RUN CI=true pnpm prune --prod

FROM base AS runner
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist


EXPOSE 5900 6080

CMD ["dumb-init", "--", "/app/docker/start-with-vnc.sh"]
