# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments - Build-time variables required for client-side code
# Note: NEXT_PUBLIC_* variables are embedded in client bundle at build time
# Client-side secrets (API keys used in browser) must be available at build time
# Server-side secrets (passwords, private keys) are injected at runtime only
ARG NEXT_PUBLIC_LIVE_API_URL
ARG NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL
ARG NEXT_PUBLIC_SUPER_ADMIN_ORG_ID
ARG NEXT_PUBLIC_MODEL_API_BASE_URL
ARG NEXT_PUBLIC_CHATBOT_API_URL
ARG NEXT_PUBLIC_CARTESIA_VOICE_ID
ARG NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID
ARG NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN
ARG NEXT_PUBLIC_DIFY_ADMIN_EMAIL
ARG NEXT_PUBLIC_DIFY_WORKSPACE_ID
ARG NEXT_PUBLIC_DIFY_BASE_URL
ARG NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
ARG NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
ARG NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY
# Client-side secrets (required at build time for client bundle)
ARG NEXT_PUBLIC_LIVE_API_KEY
ARG NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY
ARG NEXT_PUBLIC_CHATBOT_API_KEY
ARG NEXT_PUBLIC_CARTESIA_API_KEY
ARG NEXT_PUBLIC_DEMO_JWT_SECRET

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_PUBLIC_LIVE_API_URL=$NEXT_PUBLIC_LIVE_API_URL
ENV NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL=$NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL
ENV NEXT_PUBLIC_SUPER_ADMIN_ORG_ID=$NEXT_PUBLIC_SUPER_ADMIN_ORG_ID
ENV NEXT_PUBLIC_MODEL_API_BASE_URL=$NEXT_PUBLIC_MODEL_API_BASE_URL
ENV NEXT_PUBLIC_CHATBOT_API_URL=$NEXT_PUBLIC_CHATBOT_API_URL
ENV NEXT_PUBLIC_CARTESIA_VOICE_ID=$NEXT_PUBLIC_CARTESIA_VOICE_ID
ENV NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID=$NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID
ENV NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN=$NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN
ENV NEXT_PUBLIC_DIFY_ADMIN_EMAIL=$NEXT_PUBLIC_DIFY_ADMIN_EMAIL
ENV NEXT_PUBLIC_DIFY_WORKSPACE_ID=$NEXT_PUBLIC_DIFY_WORKSPACE_ID
ENV NEXT_PUBLIC_DIFY_BASE_URL=$NEXT_PUBLIC_DIFY_BASE_URL
ENV NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=$NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
ENV NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=$NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
ENV NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY=$NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY
# Client-side secrets (embedded in client bundle)
ENV NEXT_PUBLIC_LIVE_API_KEY=$NEXT_PUBLIC_LIVE_API_KEY
ENV NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY=$NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY
ENV NEXT_PUBLIC_CHATBOT_API_KEY=$NEXT_PUBLIC_CHATBOT_API_KEY
ENV NEXT_PUBLIC_CARTESIA_API_KEY=$NEXT_PUBLIC_CARTESIA_API_KEY
ENV NEXT_PUBLIC_DEMO_JWT_SECRET=$NEXT_PUBLIC_DEMO_JWT_SECRET


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
RUN echo "Build timestamp: $(date +%s) - v4.1 priority fix" > .build-timestamp

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

# Production stage - use a smaller base image with required tools
FROM node:20-alpine AS runner
WORKDIR /app

# Install required tools for script execution
RUN apk add --no-cache \
    curl \
    jq \
    bash \
    && rm -rf /var/cache/apk/*

ENV NODE_ENV=production

# Secrets are injected at runtime via environment variables (not in image layers)
# GOOGLE_TRANSLATE_API_KEY will be set at container startup

# Copy only necessary files from builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts

# Create a non-root user and set ownership
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    chown -R nextjs:nodejs /app && \
    chmod +x scripts/*.sh scripts/*.ps1

# Switch to non-root user
USER nextjs

# Environment variables will be set by CDK at runtime
# Remove hardcoded env file copy

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Add health check (uses PORT environment variable, defaults to 3000)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const port = process.env.PORT || 3000; require('http').get('http://localhost:' + port + '/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"] 
