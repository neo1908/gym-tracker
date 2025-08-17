FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate SvelteKit files first (creates .svelte-kit/tsconfig.json)
RUN npm run build

# Install Playwright browsers for testing
#RUN npx playwright install --with-deps chromium

# Run tests to ensure build quality
RUN npm run test
#RUN npm run test:e2e

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Install production dependencies and drizzle-kit for migrations
RUN npm ci --omit=dev && npm install drizzle-kit

COPY --from=builder /app/build ./build

# Copy necessary files for migrations
COPY drizzle.config.ts ./
COPY src/lib/server/schema.ts ./src/lib/server/
COPY docker-entrypoint.sh ./

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["./docker-entrypoint.sh"]