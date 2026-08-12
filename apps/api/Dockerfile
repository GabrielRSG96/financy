# syntax=docker/dockerfile:1
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# O Prisma precisa do OpenSSL para os engines nativos.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
RUN pnpm install --filter api... --frozen-lockfile || pnpm install --filter api...
COPY apps/api apps/api
RUN pnpm --filter api exec prisma generate && pnpm --filter api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api
# O banco fica num volume para sobreviver ao recriar o container.
ENV DATABASE_URL=file:/data/financy.db
EXPOSE 4000

# Aplica as migrações e semeia (idempotente) antes de subir a API.
CMD ["sh", "-c", "mkdir -p /data && npx prisma migrate deploy && npx prisma db seed || true; node dist/server.js"]
