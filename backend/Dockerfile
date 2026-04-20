# Use Node 20 inline bounds respecting GitHub Action pipelines
FROM node:20-slim

# Enforce secure directory mappings
WORKDIR /usr/src/app

# Define production arrays explicitly
ENV NODE_ENV=production

# Copy binary lockfiles locking exact payload traces
COPY package*.json ./

# Install cleanly stripping dev layer bloat natively
RUN npm ci --only=production

# Map application shell outwards
COPY . .

# Expose required execution boundary
EXPOSE 3001

# Boot physical server bounds
CMD [ "node", "server.js" ]
