# Stage 1: Install dependencies
# NOTE: glibc (slim), NOT alpine/musl. sharp's native libvips binary is libc-specific
# and musl causes unbounded RSS retention under image load — the OOM root cause.
FROM node:20-slim AS deps
RUN corepack enable
WORKDIR /app
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# Stage 2: Build the application
FROM node:20-slim AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_ONCHAINKIT_API_KEY
ARG NEXT_PUBLIC_CONTRACT_ADDRESS
ARG NEXT_PUBLIC_DEPLOY_BLOCK
ARG NEXT_PUBLIC_PROJECT_NAME
ARG NEXT_PUBLIC_MATOMO_URL
RUN yarn build

# Stage 3: Production runner
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Limit glibc allocator arenas to curb fragmentation/retention from native (sharp) memory.
ENV MALLOC_ARENA_MAX=2

# Fonts for sharp/librsvg text rendering in OG images.
RUN apt-get update \
  && apt-get install -y --no-install-recommends fontconfig fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
