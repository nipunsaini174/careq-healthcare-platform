# Multi-stage Dockerfile for patient-frontend (Next.js Static Export)
# Optimized for Render deployment and low memory usage

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments for Next.js build-time public variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Set as environment variables during build
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build static export (generates /app/out)
COPY . .
RUN npm run build

# --- Stage 2: Production Nginx Server ---
FROM nginx:alpine AS runner

WORKDIR /usr/share/nginx/html

# Set default PORT (Render overrides PORT dynamically at runtime)
ENV PORT=80

# Clean default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder
COPY --from=builder /app/out ./

# Configure Nginx template with dynamic $PORT support and SPA/Next routing
RUN mkdir -p /etc/nginx/templates
RUN echo 'server {' > /etc/nginx/templates/default.conf.template && \
    echo '    listen ${PORT};' >> /etc/nginx/templates/default.conf.template && \
    echo '    server_name _;' >> /etc/nginx/templates/default.conf.template && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/templates/default.conf.template && \
    echo '    index index.html;' >> /etc/nginx/templates/default.conf.template && \
    echo '    gzip on;' >> /etc/nginx/templates/default.conf.template && \
    echo '    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;' >> /etc/nginx/templates/default.conf.template && \
    echo '    location / {' >> /etc/nginx/templates/default.conf.template && \
    echo '        try_files $$uri $$uri.html $$uri/ /index.html =404;' >> /etc/nginx/templates/default.conf.template && \
    echo '    }' >> /etc/nginx/templates/default.conf.template && \
    echo '    error_page 404 /404.html;' >> /etc/nginx/templates/default.conf.template && \
    echo '}' >> /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
