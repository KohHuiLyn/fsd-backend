# Stage 1 - Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# # Generate Prisma client
# RUN npx prisma generate

# Stage 2 - Runtime
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3001

CMD ["node", "src/index.js"]
