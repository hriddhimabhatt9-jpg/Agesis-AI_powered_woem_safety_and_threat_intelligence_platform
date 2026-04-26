FROM node:20-alpine

WORKDIR /app

# Copy root and backend
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN cd server && npm ci
RUN cd client && npm install --legacy-peer-deps

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Build client
RUN cd client && npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start server
WORKDIR /app/server
CMD ["npm", "start"]
