# Production Dockerfile for Express Backend with Prisma & Socket.io
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
COPY src/prisma ./src/prisma

RUN npm ci

# Generate Prisma Client
RUN npx prisma generate --schema=src/prisma/schema.prisma

# Copy source code and build TypeScript
COPY . .
RUN npm run build

# --- Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/prisma ./src/prisma

EXPOSE 5000

CMD ["node", "dist/server.js"]