# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Accept build arguments
ARG NEXT_PUBLIC_LIVE_API_URL
ARG NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL
ARG NEXT_PUBLIC_LIVE_API_KEY
ARG NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY
ARG NEXT_PUBLIC_SUPER_ADMIN_ORG_ID
ARG NEXT_PUBLIC_MODEL_API_BASE_URL
ARG NEXT_PUBLIC_MODEL_API_KEY
ARG NEXT_PUBLIC_CHATBOT_API_URL
ARG NEXT_PUBLIC_CHATBOT_API_KEY
ARG NEXT_PUBLIC_ELEVEN_LABS_API_KEY
ARG NEXT_PUBLIC_OPEN_AI_API_KEY
ARG NEXT_PUBLIC_WHISPER_API_KEY
ARG NEXT_PUBLIC_DEEPGRAM_API_KEY
ARG NEXT_PUBLIC_CARTESIA_API_KEY
ARG NEXT_PUBLIC_CARTESIA_VOICE_ID
ARG NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID
ARG NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN
ARG NEXT_PUBLIC_DIFY_ADMIN_EMAIL
ARG NEXT_PUBLIC_DIFY_ADMIN_PASSWORD
ARG NEXT_PUBLIC_DIFY_WORKSPACE_ID
ARG NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY
ARG NEXT_PUBLIC_MODEL_GROQ_API_KEY
ARG NEXT_PUBLIC_MODEL_ANTHROPIC_API_KEY
ARG NEXT_PUBLIC_DIFY_BASE_URL

# Do not bake secrets into the image; App Platform will provide env vars at build/runtime
ENV NODE_ENV=production

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

# Copy only necessary files from builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/scripts ./scripts

# Make scripts executable
RUN chmod +x scripts/*.sh scripts/*.ps1

# Environment variables will be set by CDK at runtime
# Remove hardcoded env file copy

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 