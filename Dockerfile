
FROM node:24.15.0-alpine3.22 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PORT=3000

RUN corepack enable pnpm
RUN apk add --no-cache dumb-init libc6-compat

FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack prepare pnpm@10.10.0 --activate
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma:generate
RUN pnpm build
RUN CI=true pnpm prune --prod

FROM base AS runner
WORKDIR /app

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["dumb-init", "node", "/app/dist/src/main.js"]
