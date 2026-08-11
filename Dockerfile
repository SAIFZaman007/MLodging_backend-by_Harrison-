# --- Build Stage ---
FROM node:22-slim AS builder

WORKDIR /app

# Copy dependency manifests first for caching
COPY package.json package-lock.json ./

# Force npm to install linux-x64 native binaries (fixes Rolldown issue)
RUN npm ci --os=linux --cpu=x64

# Copy remaining project files and build
COPY . .
RUN npm run build

# --- Production Stage ---
FROM nginx:alpine

# Copy built assets to Nginx default public directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]