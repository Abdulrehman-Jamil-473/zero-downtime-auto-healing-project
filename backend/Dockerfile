# ---- Build Stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY . .

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

# Copy only what's needed from the builder stage (keeps image small)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js

EXPOSE 3000

CMD ["node", "server.js"]
