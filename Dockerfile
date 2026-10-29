# StudentBazaar — Production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy backend package manifests
COPY backend/package*.json ./backend/
WORKDIR /usr/src/app/backend
RUN npm ci --only=production

# Copy entire application codebase
WORKDIR /usr/src/app
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV PORT=5001

EXPOSE 5001

WORKDIR /usr/src/app/backend
CMD ["node", "src/server.js"]
