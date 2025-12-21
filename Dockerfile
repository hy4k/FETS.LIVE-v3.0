# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy monorepo files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy fets-point directory
COPY fets-point ./fets-point

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the frontend
RUN cd fets-point && pnpm build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/fets-point/dist /usr/share/nginx/html

# Copy nginx configuration for SPA
RUN cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
