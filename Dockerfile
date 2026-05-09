# syntax=docker/dockerfile:1
#
# Simple multi-stage build:
# - build: installs deps, runs `pnpm build` to produce root `dist/`
# - runtime: copies `dist/` only and runs the server
#

FROM node:24-alpine AS build

WORKDIR /app

# Enable pnpm via corepack (repo pins pnpm via package.json#packageManager)
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# Install deps first (better Docker layer caching)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY client/package.json ./client/package.json
COPY server/package.json ./server/package.json
COPY types/package.json ./types/package.json

RUN pnpm install --frozen-lockfile

# Copy the rest of the source and build
COPY . .

RUN pnpm build


FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Copy only the assembled runtime output
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/server.js"]

