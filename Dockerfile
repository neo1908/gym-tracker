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
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "build"]