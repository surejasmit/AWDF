# ---------- Stage 1: install production dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# npm ci gives reproducible installs straight from the lockfile
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- Stage 2: minimal runtime image ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production

WORKDIR /app

# Drop root privileges inside the container
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src

USER appuser
EXPOSE 5000

# Alpine ships busybox wget, used here for container-level health checks
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health > /dev/null || exit 1

CMD ["node", "src/server.js"]
