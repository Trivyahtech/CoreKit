# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies and generate Prisma client
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Start command
CMD ["npm", "run", "start:prod"]
