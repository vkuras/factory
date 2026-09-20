# Two stages on the same pinned base (design, Dockerfile). Nothing is compiled: better-sqlite3 13
# ships N-API prebuilds for linux-arm64 and linux-x64 inside its npm package.

FROM node:26.9.0-trixie-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
# npm would otherwise start `node-gyp rebuild` for better-sqlite3 (it has a binding.gyp) and fail
# for want of a compiler; the prebuilt binary is what T-ARCH-1 requires to be loaded.
RUN npm ci --ignore-scripts --foreground-scripts
COPY tsconfig.json tsconfig.build.json ./
COPY scripts ./scripts
COPY src ./src
RUN npm run build
RUN npm prune --omit=dev --ignore-scripts \
 && rm -rf node_modules/better-sqlite3/deps node_modules/better-sqlite3/src \
 && find node_modules/better-sqlite3/prebuilds -type f ! -name 'linux-x64.node' ! -name 'linux-arm64.node' -delete

FROM node:26.9.0-trixie-slim AS runtime
ENV NODE_ENV=production \
    PORT=8787 \
    DB_PATH=/data/factory.sqlite \
    NODE_OPTIONS=--max-old-space-size=192
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY migrations ./migrations
COPY package.json ./
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8787
CMD ["node", "dist/server.js"]
