FROM node:20-bookworm-slim

# 1. Install minimal build tools to compile SQLite natively against this container's GLIBC
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Copy package manifests
COPY package*.json ./

# 3. Install production dependencies and compile sqlite3 natively
RUN npm install --omit=dev --build-from-source=sqlite3

# 4. Copy application source code
COPY . .

# 5. Prepare database directory for persistent volume mount
RUN mkdir -p /app/database

ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "start"]
