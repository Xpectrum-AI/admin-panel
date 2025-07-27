# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Set npm registry and configure DNS
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

COPY package*.json ./
RUN npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# Add timestamp to force cache invalidation for source files
RUN echo "Build timestamp: $(date)" > .build-timestamp

COPY . .
RUN npm run build && \
    rm -rf node_modules

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"] 