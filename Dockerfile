# ── Build Stage ──────────────────────────────────────────────
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy server code
COPY server.js ./

# ── Runtime ───────────────────────────────────────────────────
EXPOSE 5000

# Start the Express server
CMD ["node", "server.js"]
