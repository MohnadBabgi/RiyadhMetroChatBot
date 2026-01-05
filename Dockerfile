# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd client && npm install

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production deps
COPY package*.json ./
RUN npm install --production

# Copy server code
COPY server ./server
COPY Dataset.csv ./

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Create data directory
RUN mkdir -p data

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Start the server
CMD ["npm", "start"]
