# ==========================================
# Frontend Dockerfile for DevCollab (Multi-stage)
# ==========================================

# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Accept build arguments for Vite environment variables
ARG VITE_BASE_URL=/api
ARG VITE_SOCKET_URL=/

ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Install dependencies
COPY package*.json ./
RUN npm i --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
