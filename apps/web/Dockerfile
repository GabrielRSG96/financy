# syntax=docker/dockerfile:1
FROM node:22-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/
RUN pnpm install --filter web... --frozen-lockfile || pnpm install --filter web...
COPY apps/web apps/web

ARG VITE_BACKEND_URL=http://localhost:4000/graphql
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN pnpm --filter web build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
