# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_LIVE_API_URL
ARG NEXT_PUBLIC_PROPELAUTH_URL
ARG NEXT_PUBLIC_LIVE_API_KEY
ARG NEXT_PUBLIC_PROPELAUTH_API_KEY
ARG NEXT_PUBLIC_SUPER_ADMIN_ORG_ID
ARG NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN
ARG NEXT_PUBLIC_DIFY_ADMIN_EMAIL
ARG NEXT_PUBLIC_DIFY_ADMIN_PASSWORD
ARG NEXT_PUBLIC_DIFY_WORKSPACE_ID

# Set environment variables for build
ENV NEXT_PUBLIC_PROPELAUTH_URL=https://auth.admin-dev.xpectrum-ai.com
ENV NEXT_PUBLIC_PROPELAUTH_API_KEY=888ea8af8e1d78888fcb15304e2633446516519573b7f6219943b306a4626df95d477061f77b939b8cdadd7a50559a6c
ENV NEXT_PUBLIC_LIVE_API_URL=https://d3sgivh2kmd3c8.cloudfront.net
ENV NEXT_PUBLIC_LIVE_API_KEY=xpectrum-ai@123
ENV NEXT_PUBLIC_SUPER_ADMIN_ORG_ID=c53e8731-2ce7-4484-919c-0aba50c2f46a
ENV NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN=$NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN
ENV NEXT_PUBLIC_DIFY_ADMIN_EMAIL=$NEXT_PUBLIC_DIFY_ADMIN_EMAIL
ENV NEXT_PUBLIC_DIFY_ADMIN_PASSWORD=$NEXT_PUBLIC_DIFY_ADMIN_PASSWORD
ENV NEXT_PUBLIC_DIFY_WORKSPACE_ID=$NEXT_PUBLIC_DIFY_WORKSPACE_ID

# Set npm registry and configure DNS with better retry settings
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 2

# Disable Next.js telemetry and Google Fonts during build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_FONT_GOOGLE_MOCKED_RESPONSES=1

# Copy only package files first for better caching
COPY package*.json ./

# Install dependencies with aggressive cleanup and better network handling
RUN npm ci --no-audit --production=false --maxsockets 1 --network-timeout 300000 && \
    npm cache clean --force && \
    rm -rf /root/.npm

# Add cache-busting timestamp
RUN echo "Build timestamp: $(date +%s)" > .build-timestamp

# Copy source files
COPY . .

# Build with aggressive cleanup and optimization
RUN npm run build && \
    rm -rf node_modules && \
    rm -rf .next/cache && \
    rm -rf /root/.npm && \
    npm cache clean --force && \
    rm -rf /tmp/* && \
    rm -rf /var/cache/apk/*

# Production stage - use a smaller base image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files from builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Environment variables will be set by CDK at runtime
# Remove hardcoded env file copy

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 