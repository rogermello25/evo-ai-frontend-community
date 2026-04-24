# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build-time secret (apikey baked into bundle)
ARG VITE_EVOLUTION_API_KEY

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

ENV VITE_EVOLUTION_API_KEY=$VITE_EVOLUTION_API_KEY

# Build — runtime URLs injected at container start via docker-entrypoint.sh
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy runtime entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
