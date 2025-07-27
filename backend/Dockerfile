FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only with aggressive cleanup
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force && \
    rm -rf /root/.npm && \
    rm -rf /tmp/*

# Copy source code
COPY . .

# Expose the port the app runs on
EXPOSE 8085

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8085

# Start the application
CMD ["node", "src/server.js"] 