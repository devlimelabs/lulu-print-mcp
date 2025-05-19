FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm first
RUN npm install -g pnpm

# Copy package files and install dependencies using pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Create a minimal package.json to avoid prepare scripts
RUN echo '{}' > package.json

# Copy built application from builder stage FIRST
COPY --from=builder /app/dist ./dist

# Then copy the real package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies without running scripts
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy .env.example file
COPY .env.example .env.example

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/index.js"]
