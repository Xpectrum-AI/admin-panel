# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments - Build-time variables required for client-side code
# Note: NEXT_PUBLIC_* variables are embedded in client bundle at build time
# Client-side secrets (API keys used in browser) must be available at build time
# Server-side secrets (passwords, private keys) are injected at runtime only
ARG NEXT_PUBLIC_LIVE_API_URL
ARG NEXT_PUBLIC_PROPELAUTH_URL
ARG NEXT_PUBLIC_SUPER_ADMIN_ORG_ID
ARG NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN
ARG NEXT_PUBLIC_DIFY_ADMIN_EMAIL
ARG NEXT_PUBLIC_DIFY_WORKSPACE_ID
# Client-side secrets (required at build time for client bundle)
ARG NEXT_PUBLIC_LIVE_API_KEY

# Set environment variables for build
ENV NEXT_PUBLIC_LIVE_API_URL=$NEXT_PUBLIC_LIVE_API_URL
ENV NEXT_PUBLIC_PROPELAUTH_URL=$NEXT_PUBLIC_PROPELAUTH_URL
ENV NEXT_PUBLIC_SUPER_ADMIN_ORG_ID=$NEXT_PUBLIC_SUPER_ADMIN_ORG_ID
ENV NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN=$NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN
ENV NEXT_PUBLIC_DIFY_ADMIN_EMAIL=$NEXT_PUBLIC_DIFY_ADMIN_EMAIL
ENV NEXT_PUBLIC_DIFY_WORKSPACE_ID=$NEXT_PUBLIC_DIFY_WORKSPACE_ID
# Client-side secrets (embedded in client bundle)
ENV NEXT_PUBLIC_LIVE_API_KEY=$NEXT_PUBLIC_LIVE_API_KEY



# Set npm registry and configure DNS
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy only package files first for better caching
COPY package*.json ./

# Install dependencies with aggressive cleanup
RUN npm ci --prefer-offline --production=false && \
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

# Create a non-root user and set ownership
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Environment variables will be set by CDK at runtime
# Remove hardcoded env file copy

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Add health check (uses PORT environment variable, defaults to 3000)
# Note: Using Node.js to read PORT env var since curl is not installed in this image
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const port = process.env.PORT || 3000; require('http').get('http://localhost:' + port + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"] 