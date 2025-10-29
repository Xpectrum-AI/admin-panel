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

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_URL=https://auth.developer-dev.xpectrum-ai.com
ENV NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
ENV NEXT_PUBLIC_DEVELOPMENT_PROPELAUTH_API_KEY=8203315022b0778dce72003f464938218ea7b22dfb0a396e1388250db6058579a412f9752a05e70611d377dc5fcc265f
ENV NEXT_PUBLIC_ENABLE_EMAIL_VERIFICATION=true
ENV NEXT_PUBLIC_DIFY_CONSOLE_ORIGIN=https://demos.xpectrum-ai.com/
ENV NEXT_PUBLIC_DIFY_ADMIN_EMAIL=ghosh.ishw@gmail.com
ENV NEXT_PUBLIC_DIFY_ADMIN_PASSWORD=Ghosh1@*123
ENV NEXT_PUBLIC_DIFY_WORKSPACE_ID=661d95ae-77ee-4cfd-88e3-e6f3ef8d638b
ENV NEXT_PUBLIC_DIFY_BASE_URL=https://demos.xpectrum-ai.com/v1
ENV NEXT_PUBLIC_MODEL_OPEN_AI_API_KEY=REDACTED
ENV NEXT_PUBLIC_MODEL_GROQ_API_KEY=REDACTED
ENV NEXT_PUBLIC_MODEL_ANTHROPIC_API_KEY=REDACTED
ENV NEXT_PUBLIC_CHATBOT_API_URL=https://demos.xpectrum-ai.com/v1/chat-messages
ENV NEXT_PUBLIC_CHATBOT_API_KEY=REDACTED
ENV NEXT_PUBLIC_ELEVEN_LABS_API_KEY=REDACTED
ENV NEXT_PUBLIC_OPEN_AI_API_KEY=REDACTED
ENV NEXT_PUBLIC_WHISPER_API_KEY=REDACTED
ENV NEXT_PUBLIC_DEEPGRAM_API_KEY=e1db3c9cab55f4d427f6f03b8a5975bed3160aa9
ENV NEXT_PUBLIC_CARTESIA_API_KEY=REDACTED
ENV NEXT_PUBLIC_CARTESIA_VOICE_ID=e8e5fffb-252c-436d-b842-8879b84445b6
ENV NEXT_PUBLIC_ELEVEN_LABS_VOICE_ID=pNInz6obpgDQGcFmaJgB
ENV NEXT_PUBLIC_LIVE_API_URL=https://d3sgivh2kmd3c8.cloudfront.net
ENV NEXT_PUBLIC_LIVE_API_KEY=xpectrum-ai@123
ENV MONGODB_URL=your_mongodb_connection_string
ENV DATABASE_NAME=your_database_name
ENV NEXT_PUBLIC_APP_NAME="Developer Dashboard"
ENV NEXT_PUBLIC_APP_VERSION=1.0.0

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