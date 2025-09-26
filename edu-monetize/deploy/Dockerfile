# syntax=docker/dockerfile:1

# ---- Base deps ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---- Builder (includes dev deps for build) ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Generate Prisma client for the build
RUN npx prisma generate
# Build Next.js
RUN npm run build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Ensure system time zone and libc if needed (most hosts OK without)

# Copy only necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/app/generated ./app/generated
COPY --from=builder /app/prisma ./prisma

# Expose and run
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]