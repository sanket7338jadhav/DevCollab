# ==========================================
# Backend Dockerfile for DevCollab
# ==========================================
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production

# Install dependencies first (leverage Docker layer caching)
COPY package*.json ./
RUN npm i --omit=dev

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Healthcheck using built-in Alpine wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start server
CMD ["node", "server.js"]
