FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Copy remaining source code
COPY . .

# Generate Prisma Client and build TypeScript
RUN npx prisma generate
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built assets and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Render sets the PORT dynamically, expose a default just in case
EXPOSE 5000
# Run migrations and start the server
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]