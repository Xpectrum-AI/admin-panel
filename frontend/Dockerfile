# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Set npm registry and configure DNS
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy only package files first for better caching
COPY package*.json ./

# Install dependencies with aggressive cleanup
RUN npm ci --prefer-offline --no-audit --production=false && \
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
COPY --from=builder /app/.env.production ./.env.production

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 